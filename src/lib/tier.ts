// Subscription tier utilities

export const FREE_TIER_LIMIT = 10;

export type UserTier = 'free' | 'pro';

export interface TierLimits {
  maxTrackedSubscriptions: number;
  hasRenewalAlerts: boolean;
  hasPriceChangeDetection: boolean;
  hasExportData: boolean;
  hasPrioritySupport: boolean;
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    maxTrackedSubscriptions: 10,
    hasRenewalAlerts: false,
    hasPriceChangeDetection: false,
    hasExportData: false,
    hasPrioritySupport: false,
  },
  pro: {
    maxTrackedSubscriptions: Infinity,
    hasRenewalAlerts: true,
    hasPriceChangeDetection: true,
    hasExportData: true,
    hasPrioritySupport: true,
  },
};

export function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[tier as UserTier] || TIER_LIMITS.free;
}

export function canTrackMoreSubscriptions(tier: string, currentTrackedCount: number): boolean {
  const limits = getTierLimits(tier);
  return currentTrackedCount < limits.maxTrackedSubscriptions;
}

export function getTrackedSubscriptionCount(subscriptions: { isTracked: boolean; confirmed: boolean; status: string }[]): number {
  return subscriptions.filter(s => 
    s.isTracked && 
    s.confirmed && 
    s.status !== 'cancelled' && 
    s.status !== 'dismissed'
  ).length;
}

export function getUpgradeMessage(currentCount: number): string {
  if (currentCount <= FREE_TIER_LIMIT) {
    return '';
  }
  const overLimit = currentCount - FREE_TIER_LIMIT;
  return `You have ${currentCount} confirmed subscriptions. Free tier tracks up to ${FREE_TIER_LIMIT}. ${overLimit} subscription${overLimit > 1 ? 's are' : ' is'} not being tracked.`;
}
