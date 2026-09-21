import { z } from 'zod';
import {
  FundOwnerType,
  LeftoverResolutionAction,
  MoneyStatus,
  TopupFundingSourceType
} from '../enums/index.js';

export const CreateClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  companyName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  clientReference: z.string().min(2, 'Reference code required')
});

export const RecordClientPaymentSchema = z.object({
  clientId: z.string().uuid('Invalid Client ID'),
  amountRupees: z.number().positive('Amount must be greater than 0'),
  serviceFeeRupees: z.number().min(0, 'Service fee cannot be negative').default(0),
  paymentReference: z.string().min(3, 'Payment reference/UTR required'),
  paymentDate: z.string().optional(),
  notes: z.string().optional()
});

export const CreateClientJobSchema = z.object({
  clientId: z.string().uuid('Invalid Client ID'),
  title: z.string().min(3, 'Title is required'),
  plannedBudgetRupees: z.number().positive('Budget must be greater than 0'),
  targetAdAccountId: z.string().uuid().optional(),
  jobCode: z.string().min(3, 'Job code required')
});

export const AllocateFundToJobSchema = z.object({
  clientId: z.string().uuid('Invalid Client ID'),
  jobId: z.string().uuid('Invalid Job ID'),
  adAccountId: z.string().uuid('Invalid Ad Account ID'),
  amountRupees: z.number().positive('Amount must be greater than 0')
});

export const ResolveLeftoverFundSchema = z.object({
  jobId: z.string().uuid('Invalid Job ID'),
  action: z.nativeEnum(LeftoverResolutionAction),
  targetJobId: z.string().uuid().optional(),
  notes: z.string().optional()
});

export const CreateVendorSchema = z.object({
  name: z.string().min(2, 'Vendor name must be at least 2 characters'),
  vendorReference: z.string().min(2, 'Reference code required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional()
});

export const RecordVendorFundingBatchSchema = z.object({
  vendorId: z.string().uuid('Invalid Vendor ID'),
  principalAmountRupees: z.number().positive('Principal amount must be greater than 0'),
  batchCode: z.string().min(3, 'Batch code required'),
  receivedDate: z.string().optional(),
  repaymentDueDate: z.string().optional(),
  notes: z.string().optional()
});

export const RecordVendorRepaymentSchema = z.object({
  vendorId: z.string().uuid('Invalid Vendor ID'),
  fundingBatchId: z.string().uuid('Invalid Batch ID').optional(),
  amountRupees: z.number().positive('Repayment amount must be greater than 0'),
  paymentReference: z.string().min(3, 'Payment reference required'),
  notes: z.string().optional()
});

export const CreateManualAdjustmentSchema = z.object({
  debitAccountId: z.string().uuid('Invalid Debit Account ID'),
  creditAccountId: z.string().uuid('Invalid Credit Account ID'),
  amountRupees: z.number().positive('Amount must be greater than 0'),
  description: z.string().min(5, 'Reason for adjustment required'),
  referenceCode: z.string().min(3, 'Reference code required')
});

export const ExtensionPairingClaimSchema = z.object({
  code: z.string().trim().min(8).max(128),
  deviceName: z.string().trim().min(1).max(80),
  extensionVersion: z.string().trim().min(1).max(32)
});

export const ExtensionHeartbeatSchema = z.object({
  extensionVersion: z.string().trim().min(1).max(32)
});

export const MinorUnitStringSchema = z.string().regex(/^[1-9]\d*$/, 'Amount must be a positive minor-unit integer');
export const InrCurrencySchema = z.literal('INR');
export const IdempotencyKeySchema = z.string().trim().min(8).max(128);
export const MetaAccountIdSchema = z.string().regex(/^\d{5,32}$/, 'Invalid Meta Ad Account ID');

export const TopupFundingSourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(TopupFundingSourceType.FUNDING_REQUEST),
    fundingRequestId: z.string().uuid()
  }).strict(),
  z.object({
    type: z.literal(TopupFundingSourceType.FUND_LOT),
    fundLotId: z.string().uuid()
  }).strict()
]);

export const TopupDetectionSchema = z.object({
  pageUrl: z.string().url().max(2048),
  urlAccountId: MetaAccountIdSchema.optional(),
  visibleAccountId: MetaAccountIdSchema.optional(),
  visibleAccountName: z.string().trim().min(1).max(160).optional(),
  amountText: z.string().trim().min(1).max(64),
  currencyCode: InrCurrencySchema,
  qrVisible: z.boolean(),
  detectorVersion: z.string().trim().min(1).max(32)
}).strict();

export const TopupMappingSchema = z.object({
  idempotencyKey: IdempotencyKeySchema,
  detectedAdAccountId: z.string().uuid().optional(),
  selectedAdAccountId: z.string().uuid(),
  detectedAmountMinor: MinorUnitStringSchema.optional(),
  selectedAmountMinor: MinorUnitStringSchema,
  currencyCode: InrCurrencySchema,
  fundingSource: TopupFundingSourceSchema,
  detectorVersion: z.string().trim().min(1).max(32)
}).strict();

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type RecordClientPaymentInput = z.infer<typeof RecordClientPaymentSchema>;
export type CreateClientJobInput = z.infer<typeof CreateClientJobSchema>;
export type AllocateFundToJobInput = z.infer<typeof AllocateFundToJobSchema>;
export type ResolveLeftoverFundInput = z.infer<typeof ResolveLeftoverFundSchema>;
export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
export type RecordVendorFundingBatchInput = z.infer<typeof RecordVendorFundingBatchSchema>;
export type RecordVendorRepaymentInput = z.infer<typeof RecordVendorRepaymentSchema>;
export type CreateManualAdjustmentInput = z.infer<typeof CreateManualAdjustmentSchema>;
export type ExtensionPairingClaimInput = z.infer<typeof ExtensionPairingClaimSchema>;
export type ExtensionHeartbeatInput = z.infer<typeof ExtensionHeartbeatSchema>;
export type TopupDetectionInput = z.infer<typeof TopupDetectionSchema>;
export type TopupMappingInput = z.infer<typeof TopupMappingSchema>;
