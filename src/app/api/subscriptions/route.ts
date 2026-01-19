import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/subscriptions - Fetch user's subscriptions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          orderBy: { nextBillingDate: 'asc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ subscriptions: [], cancelledThisMonth: [] });
    }

    // Get ALL cancelled subscriptions (confirmed) for total savings calculation
    // Calculate monthly equivalent savings from cancelled subscriptions
    const allCancelled = user.subscriptions.filter(sub => 
      sub.status === 'cancelled' && 
      sub.confirmed === true  // Must have been confirmed as a real subscription
    );

    // Calculate total monthly savings (adjust yearly/weekly to monthly equivalent)
    const allCancelledMonthly = allCancelled.map(sub => {
      let monthlyAmount = sub.amount;
      if (sub.billingCycle === 'yearly') {
        monthlyAmount = sub.amount / 12;
      } else if (sub.billingCycle === 'weekly') {
        monthlyAmount = sub.amount * 4.33; // Average weeks per month
      }
      return { ...sub, monthlyAmount };
    });

    // Active subscriptions exclude both cancelled and dismissed
    const activeSubscriptions = user.subscriptions.filter(sub => 
      sub.status !== 'cancelled' && sub.status !== 'dismissed'
    );

    return NextResponse.json({ 
      subscriptions: activeSubscriptions,
      allCancelledMonthly: allCancelledMonthly,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/subscriptions - Add new subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { serviceName, amount, billingCycle, nextBillingDate } = body;

    if (!serviceName || !amount || !billingCycle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        serviceName,
        serviceSlug: serviceName.toLowerCase().replace(/\s+/g, '-'),
        amount: parseFloat(amount),
        billingCycle,
        nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null,
        confirmed: true,
        confidence: 1.0,
      },
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/subscriptions - Update subscription
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
    }

    // Verify subscription belongs to user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existing = await prisma.subscription.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Handle status changes
    if (updates.status === 'cancelled') {
      updates.cancelledAt = new Date();
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
