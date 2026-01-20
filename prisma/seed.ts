// Seed script to populate default pricing plans
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultPlans = [
  {
    name: 'Free',
    slug: 'free',
    price: 0,
    currency: 'USD',
    interval: 'monthly',
    description: 'Perfect to get started',
    features: [
      'Up to 10 tracked subscriptions',
      'Email scanning',
      'Track and manage',
      'Basic alerts',
      'Manual entry',
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 0,
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: 6.99,
    currency: 'USD',
    interval: 'monthly',
    description: 'Everything you need',
    features: [
      'Everything in Free +',
      'Unlimited tracked subscriptions',
      '3-day renewal alerts',
      'New subscription detection',
      'Price change detection',
      'Export data',
      'Priority support',
    ],
    isActive: true,
    isPopular: true,
    sortOrder: 1,
  },
];

async function main() {
  console.log('Seeding pricing plans...');
  
  for (const plan of defaultPlans) {
    const existing = await prisma.plan.findUnique({
      where: { slug: plan.slug },
    });
    
    if (existing) {
      console.log(`Updating plan: ${plan.name}`);
      await prisma.plan.update({
        where: { slug: plan.slug },
        data: plan,
      });
    } else {
      console.log(`Creating plan: ${plan.name}`);
      await prisma.plan.create({
        data: plan,
      });
    }
  }
  
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
