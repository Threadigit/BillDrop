import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTierLimits, FREE_TIER_LIMIT } from '@/lib/tier';

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
      return NextResponse.json({ subscriptions: [], allCancelledMonthly: [] });
    }

    // Get user tier info (tier field added in schema, may need TS server restart)
    const tier = (user as { tier?: string }).tier || 'free';
    const tierLimits = getTierLimits(tier);

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

    // Count confirmed tracked subscriptions
    const trackedCount = activeSubscriptions.filter(sub => 
      sub.confirmed && (sub as { isTracked?: boolean }).isTracked !== false
    ).length;

    // Check if over limit
    const isOverLimit = tier === 'free' && trackedCount > FREE_TIER_LIMIT;
    const canTrackMore = tier === 'pro' || trackedCount < FREE_TIER_LIMIT;

    return NextResponse.json({ 
      subscriptions: activeSubscriptions,
      allCancelledMonthly: allCancelledMonthly,
      tier,
      tierLimits,
      trackedCount,
      isOverLimit,
      canTrackMore,
      freeLimit: FREE_TIER_LIMIT,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/subscriptions - Add new subscription (manual entry)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscriptions: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { serviceName, amount, currency, billingCycle, nextBillingDate } = body;

    if (!serviceName || !amount || !billingCycle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user can track more subscriptions
    const userTier = (user as { tier?: string }).tier || 'free';
    const trackedCount = user.subscriptions.filter(s => 
      s.confirmed && 
      (s as { isTracked?: boolean }).isTracked !== false &&
      s.status !== 'cancelled' && 
      s.status !== 'dismissed'
    ).length;
    
    const canTrack = userTier === 'pro' || trackedCount < FREE_TIER_LIMIT;

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        serviceName,
        serviceSlug: serviceName.toLowerCase().replace(/\s+/g, '-'),
        amount: parseFloat(amount),
        currency: currency || 'USD',
        billingCycle,
        nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null,
        confirmed: true,
        isTracked: canTrack, // Only track if under limit
        confidence: 1.0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    return NextResponse.json({ 
      subscription,
      isTracked: canTrack,
      limitReached: !canTrack,
    }, { status: 201 });
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

    // Get user with all subscriptions for limit checking
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscriptions: true },
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

    // Handle confirm action - check limit before tracking
    if (updates.confirmed === true && !existing.confirmed) {
      const userTier = (user as { tier?: string }).tier || 'free';
      const trackedCount = user.subscriptions.filter(s => 
        s.confirmed && 
        (s as { isTracked?: boolean }).isTracked !== false &&
        s.status !== 'cancelled' && 
        s.status !== 'dismissed' &&
        s.id !== id // Exclude current one
      ).length;
      
      const canTrack = userTier === 'pro' || trackedCount < FREE_TIER_LIMIT;
      
      // If user explicitly wants to track (or default behavior)
      if (updates.isTracked === undefined) {
        updates.isTracked = canTrack; // Auto-track if under limit
      }
      
      // If limit reached and trying to track, return info
      if (!canTrack && updates.isTracked === true) {
        return NextResponse.json({ 
          error: 'Tracking limit reached',
          message: `Free tier allows tracking up to ${FREE_TIER_LIMIT} subscriptions.`,
          trackedCount,
          freeLimit: FREE_TIER_LIMIT,
          requiresUpgrade: true,
          canConfirmWithoutTracking: true,
        }, { status: 403 });
      }
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: updates as any,
    });

    // Return updated tracking info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newTrackedCount = user.subscriptions.filter((s: any) => 
      (s.id === id ? updates.confirmed ?? s.confirmed : s.confirmed) && 
      (s.id === id ? updates.isTracked ?? (s.isTracked !== false) : s.isTracked !== false) &&
      (s.id === id ? updates.status ?? s.status : s.status) !== 'cancelled' && 
      (s.id === id ? updates.status ?? s.status : s.status) !== 'dismissed'
    ).length;

    return NextResponse.json({ 
      subscription,
      trackedCount: newTrackedCount,
      freeLimit: FREE_TIER_LIMIT,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
