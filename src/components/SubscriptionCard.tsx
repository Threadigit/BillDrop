'use client';

import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';

export interface Subscription {
  id: string;
  serviceName: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextBillingDate: Date | null;
  logoUrl: string | null;
  status: string;
  confirmed: boolean;
  isTracked?: boolean;
  icon?: string;
  color?: string;
}

interface SubscriptionCardProps {
  subscription: Subscription;
  index?: number;
  onClick?: (subscription: Subscription) => void;
  onConfirm?: (subscription: Subscription) => void;
  onCancel?: (subscription: Subscription) => void;
  onMarkCancelled?: (subscription: Subscription) => void;
}

// Default service colors and icons
const serviceDefaults: Record<string, { icon: string; color: string }> = {
  netflix: { icon: '🎬', color: '#E50914' },
  spotify: { icon: '🎵', color: '#1DB954' },
  adobe: { icon: '🎨', color: '#FF0000' },
  chatgpt: { icon: '🤖', color: '#10A37F' },
  openai: { icon: '🤖', color: '#10A37F' },
  gym: { icon: '💪', color: '#FF6B6B' },
  youtube: { icon: '📺', color: '#FF0000' },
  amazon: { icon: '📦', color: '#FF9900' },
  disney: { icon: '🏰', color: '#113CCF' },
  hbo: { icon: '🎭', color: '#5822B4' },
  apple: { icon: '🍎', color: '#555555' },
  microsoft: { icon: '💻', color: '#00A4EF' },
  dropbox: { icon: '📁', color: '#0061FF' },
  slack: { icon: '💬', color: '#4A154B' },
  notion: { icon: '📝', color: '#000000' },
  figma: { icon: '🎨', color: '#F24E1E' },
  github: { icon: '🐙', color: '#181717' },
  default: { icon: '💳', color: '#6366F1' },
};

function getServiceDefaults(serviceName: string): { icon: string; color: string } {
  const key = serviceName.toLowerCase();
  for (const [name, defaults] of Object.entries(serviceDefaults)) {
    if (key.includes(name)) {
      return defaults;
    }
  }
  return serviceDefaults.default;
}

// Currency symbol map
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  NGN: '₦',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  INR: '₹',
};

function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return `${symbol}${amount.toLocaleString()}`;
}

function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function SubscriptionCard({ subscription, index = 0, onClick, onConfirm, onCancel, onMarkCancelled }: SubscriptionCardProps) {
  const defaults = getServiceDefaults(subscription.serviceName);
  const icon = subscription.icon || defaults.icon;
  const color = subscription.color || defaults.color;

  return (
    <motion.div
      className="p-6 hover:bg-black/[0.02] transition-colors cursor-pointer"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      whileHover={{ x: 4 }}
      onClick={() => onClick?.(subscription)}
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold truncate">{subscription.serviceName}</span>
            {!subscription.confirmed ? (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                Review
              </span>
            ) : subscription.isTracked !== false ? (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                Tracked
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                Untracked
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--foreground-muted)]">
            <span className="capitalize">{subscription.billingCycle}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Next: {formatDate(subscription.nextBillingDate)}
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-semibold">{formatCurrency(subscription.amount, subscription.currency)}</div>
          <div className="text-xs text-[var(--foreground-muted)]">per {subscription.billingCycle === 'yearly' ? 'year' : 'month'}</div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)]" />
      </div>

      {/* Action buttons for unconfirmed items */}
      {!subscription.confirmed && (onConfirm || onCancel) && (
        <div className="mt-4 flex gap-2 justify-end">
          {onConfirm && (
            <button
              onClick={(e) => { e.stopPropagation(); onConfirm(subscription); }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            >
              Confirm
            </button>
          )}
          {onCancel && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel(subscription); }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Not a Subscription
            </button>
          )}
        </div>
      )}

      {/* Mark as Cancelled button for confirmed subscriptions */}
      {subscription.confirmed && onMarkCancelled && (
        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onMarkCancelled(subscription); }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
          >
            I Cancelled This
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default SubscriptionCard;
