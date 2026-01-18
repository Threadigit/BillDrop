import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample subscriptions for testing
const sampleSubscriptions = [
  {
    serviceName: 'Netflix',
    serviceSlug: 'netflix',
    amount: 15.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: new Date('2026-01-23'),
    status: 'active',
    confirmed: true,
    confidence: 1.0,
  },
  {
    serviceName: 'Spotify',
    serviceSlug: 'spotify',
    amount: 9.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: new Date('2026-01-28'),
    status: 'active',
    confirmed: true,
    confidence: 1.0,
  },
  {
    serviceName: 'Adobe Creative Cloud',
    serviceSlug: 'adobe-creative-cloud',
    amount: 54.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: new Date('2026-02-01'),
    status: 'active',
    confirmed: false,
    confidence: 0.75,
  },
  {
    serviceName: 'ChatGPT Plus',
    serviceSlug: 'chatgpt-plus',
    amount: 20.00,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: new Date('2026-02-05'),
    status: 'active',
    confirmed: true,
    confidence: 1.0,
  },
  {
    serviceName: 'Gym Membership',
    serviceSlug: 'gym-membership',
    amount: 45.00,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: new Date('2026-02-10'),
    status: 'active',
    confirmed: false,
    confidence: 0.6,
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Check if test user exists, create if not
  let testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    console.log('✅ Created test user:', testUser.email);
  } else {
    console.log('ℹ️  Test user already exists:', testUser.email);
  }

  // Clear existing subscriptions for test user
  await prisma.subscription.deleteMany({
    where: { userId: testUser.id },
  });
  console.log('🗑️  Cleared existing subscriptions');

  // Create sample subscriptions
  for (const sub of sampleSubscriptions) {
    await prisma.subscription.create({
      data: {
        ...sub,
        userId: testUser.id,
      },
    });
    console.log(`✅ Added subscription: ${sub.serviceName}`);
  }

  console.log(`\n🎉 Seeded ${sampleSubscriptions.length} subscriptions for ${testUser.email}`);
  console.log('   Total monthly: $' + sampleSubscriptions.reduce((sum, s) => sum + s.amount, 0).toFixed(2));
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
