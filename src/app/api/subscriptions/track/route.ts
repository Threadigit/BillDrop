import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { FREE_TIER_LIMIT } from '@/lib/tier';

// POST /api/subscriptions/track - Toggle subscription tracking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId, isTracked } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
    }

    // Get user and their subscriptions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if subscription belongs to user
    const subscription = user.subscriptions.find(s => s.id === subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // If trying to enable tracking, check the limit for free users
    const userTier = (user as { tier?: string }).tier || 'free';
    if (isTracked && userTier === 'free') {
      const currentTrackedCount = user.subscriptions.filter(s => 
        (s as { isTracked?: boolean }).isTracked !== false && 
        s.confirmed && 
        s.status !== 'cancelled' && 
        s.status !== 'dismissed' &&
        s.id !== subscriptionId // Exclude the current one
      ).length;

      if (currentTrackedCount >= FREE_TIER_LIMIT) {
        return NextResponse.json({ 
          error: 'Tracking limit reached',
          message: `Free tier allows tracking up to ${FREE_TIER_LIMIT} subscriptions. Upgrade to Pro for unlimited tracking.`,
          requiresUpgrade: true,
        }, { status: 403 });
      }
    }

    // Update the subscription
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { isTracked } as any,
    });

    return NextResponse.json({ 
      subscription: updated,
      message: isTracked ? 'Subscription is now being tracked' : 'Subscription removed from tracking',
    });
  } catch (error) {
    console.error('Error updating subscription tracking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
