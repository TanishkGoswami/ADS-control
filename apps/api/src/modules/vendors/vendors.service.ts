import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { LedgerService } from '../ledger/ledger.service';
import { TransactionType, EntryType, toPaise, CreateVendorInput, RecordVendorFundingBatchInput, RecordVendorRepaymentInput } from '@ads-control/shared';

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly ledgerService: LedgerService
  ) {}

  async getVendors(organizationId?: string) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const cacheKey = `vendors:list:${orgId}`;

    return this.cache.wrap(cacheKey, async () => {
      return this.prisma.vendor.findMany({
        where: { organizationId: orgId },
        include: {
          fundingBatches: true,
          receivables: true
        },
        orderBy: { name: 'asc' }
      });
    }, 60);
  }

  async createVendor(organizationId: string | undefined, input: CreateVendorInput) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const existing = await this.prisma.vendor.findFirst({ where: { organizationId: orgId, vendorReference: input.vendorReference } });
    if (existing) throw new BadRequestException('Vendor reference already exists. Use a different code.');
    const result = await this.prisma.vendor.create({
      data: {
        organizationId: orgId,
        vendorReference: input.vendorReference,
        name: input.name,
        email: input.email || undefined,
        phone: input.phone
      }
    });

    await this.cache.delPattern('vendors:*');
    await this.cache.delPattern('reports:*');
    return result;
  }

  /**
   * Record Vendor Funding Batch
   * Increases Company Bank (Asset) and Vendor Payable (Liability)
   */
  async recordFundingBatch(organizationId: string | undefined, input: RecordVendorFundingBatchInput) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const principalMinor = toPaise(input.principalAmountRupees);

    const result = await this.prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.findFirst({ where: { id: input.vendorId, organizationId: orgId } });
      if (!vendor) throw new NotFoundException('Vendor not found');

      const batch = await tx.vendorFundingBatch.create({
        data: {
          organizationId: orgId,
          vendorId: input.vendorId,
          batchCode: input.batchCode,
          principalAmountMinor: principalMinor,
          currencyCode: 'INR',
          status: 'OPEN',
          repaymentDueDate: input.repaymentDueDate ? new Date(input.repaymentDueDate) : undefined
        }
      });

      // Post to Ledger:
      // Dr: Bank (principalMinor)
      // Cr: Vendor Payable (principalMinor)
      await this.ledgerService.postTransaction({
        organizationId: orgId,
        transactionType: TransactionType.VENDOR_FUNDING_RECEIPT,
        description: `Vendor funding batch received (${input.batchCode})`,
        referenceEntity: 'VENDOR_BATCH',
        referenceId: batch.id,
        entries: [
          { accountCode: '1000-BANK', entryType: EntryType.DEBIT, amountMinor: principalMinor },
          { accountCode: '2100-VENDOR-PAYABLE', entryType: EntryType.CREDIT, amountMinor: principalMinor }
        ]
      }, tx);

      return batch;
    }, { timeout: 15000 });

    await this.cache.delPattern('vendors:*');
    await this.cache.delPattern('reports:*');
    return result;
  }

  /**
   * Record Vendor Repayment with Overpayment Detection Guard
   */
  async recordRepayment(organizationId: string | undefined, input: RecordVendorRepaymentInput) {
    const orgId = await this.prisma.resolveOrgId(organizationId);
    const amountMinor = toPaise(input.amountRupees);

    const result = await this.prisma.$transaction(async (tx) => {
      // Find Vendor Batches
      const vendor = await tx.vendor.findFirst({
        where: { id: input.vendorId, organizationId: orgId },
        include: { fundingBatches: { where: { status: 'OPEN' } } }
      });

      if (!vendor) throw new NotFoundException('Vendor not found');

      const totalOutstanding = vendor.fundingBatches.reduce(
        (acc, b) => acc + (b.principalAmountMinor - b.repaidAmountMinor),
        0n
      );

      // 1. Record Repayment
      const repayment = await tx.vendorRepayment.create({
        data: {
          organizationId: orgId,
          vendorId: input.vendorId,
          vendorFundingBatchId: input.fundingBatchId,
          amountMinor: amountMinor,
          paymentReference: input.paymentReference,
          currencyCode: 'INR',
          notes: input.notes
        }
      });

      // Check for Overpayment
      if (amountMinor > totalOutstanding) {
        const overpaymentMinor = amountMinor - totalOutstanding;

        // Create Vendor Receivable Record
        await tx.vendorReceivable.create({
          data: {
            organizationId: orgId,
            vendorId: input.vendorId,
            amountMinor: overpaymentMinor,
            currencyCode: 'INR',
            reason: 'OVERPAYMENT',
            status: 'OPEN'
          }
        });

        // Create Alert
        await tx.alert.create({
          data: {
            organizationId: orgId,
            alertType: 'VENDOR_OVERPAYMENT',
            title: `Overpayment to ${vendor.name}`,
            description: `Repayment of ₹${Number(amountMinor) / 100} exceeded total outstanding balance by ₹${Number(overpaymentMinor) / 100}. Overpayment locked as Vendor Receivable.`,
            severity: 'WARNING',
            status: 'OPEN',
            entityType: 'VENDOR',
            entityId: vendor.id
          }
        });

        // Post to Ledger:
        // Dr: Vendor Payable (totalOutstanding)
        // Dr: Vendor Receivable (overpaymentMinor)
        // Cr: Bank (amountMinor)
        await this.ledgerService.postTransaction({
          organizationId: orgId,
          transactionType: TransactionType.VENDOR_OVERPAYMENT_RECEIVABLE,
          description: `Vendor repayment with overpayment for ${vendor.name}`,
          referenceEntity: 'VENDOR_REPAYMENT',
          referenceId: repayment.id,
          entries: [
            { accountCode: '2100-VENDOR-PAYABLE', entryType: EntryType.DEBIT, amountMinor: totalOutstanding },
            { accountCode: '1200-VENDOR-RECEIVABLE', entryType: EntryType.DEBIT, amountMinor: overpaymentMinor },
            { accountCode: '1000-BANK', entryType: EntryType.CREDIT, amountMinor: amountMinor }
          ]
        }, tx);
      } else {
        // Normal Repayment Ledger
        await this.ledgerService.postTransaction({
          organizationId: orgId,
          transactionType: TransactionType.VENDOR_REPAYMENT,
          description: `Vendor repayment for ${vendor.name}`,
          referenceEntity: 'VENDOR_REPAYMENT',
          referenceId: repayment.id,
          entries: [
            { accountCode: '2100-VENDOR-PAYABLE', entryType: EntryType.DEBIT, amountMinor },
            { accountCode: '1000-BANK', entryType: EntryType.CREDIT, amountMinor }
          ]
        }, tx);
      }

      return repayment;
    }, { timeout: 15000 });

    await this.cache.delPattern('vendors:*');
    await this.cache.delPattern('reports:*');
    return result;
  }
}
