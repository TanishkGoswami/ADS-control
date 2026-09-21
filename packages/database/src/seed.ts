import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Foundation Setup (Zero Mock Data)...');

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'in-house-ads' },
    update: {},
    create: {
      name: 'In-House Ad Ops & Control',
      slug: 'in-house-ads',
      defaultCurrency: 'INR',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE'
    }
  });

  console.log(`✓ Organization: ${org.name} (${org.id})`);

  // 2. User Profiles
  await prisma.userProfile.upsert({
    where: { authUserId: 'auth-user-admin-01' },
    update: {},
    create: {
      organizationId: org.id,
      authUserId: 'auth-user-admin-01',
      name: 'Operations Lead (Admin)',
      email: 'admin@metabull.internal',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  // 3. Chart of Financial Accounts
  const chartOfAccounts = [
    { code: '1000-BANK', name: 'Company Primary Bank Account', category: 'ASSET' },
    { code: '1100-AD-ACCOUNT-PREPAY', name: 'Meta Ad Account Prepayments', category: 'ASSET' },
    { code: '1200-VENDOR-RECEIVABLE', name: 'Vendor Overpayment Receivables', category: 'ASSET' },
    { code: '2000-CLIENT-WALLETS', name: 'Client Unallocated Wallets', category: 'LIABILITY' },
    { code: '2100-VENDOR-PAYABLE', name: 'Vendor Funding Payables', category: 'LIABILITY' },
    { code: '3000-AGENCY-EQUITY-POOL', name: 'Agency Operational Capital Pool', category: 'EQUITY' },
    { code: '4000-SERVICE-REVENUE', name: 'Agency Management Fee Revenue', category: 'REVENUE' },
    { code: '5000-AD-SPEND-EXPENSE', name: 'Meta Advertising Spend Expense', category: 'EXPENSE' }
  ];

  for (const acc of chartOfAccounts) {
    await prisma.financialAccount.upsert({
      where: { organizationId_accountCode: { organizationId: org.id, accountCode: acc.code } },
      update: {},
      create: {
        organizationId: org.id,
        accountCode: acc.code,
        name: acc.name,
        category: acc.category,
        currencyCode: 'INR'
      }
    });
  }

  console.log('✅ Foundation seed complete (zero mock/demo ad accounts, clients, or lots).');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
