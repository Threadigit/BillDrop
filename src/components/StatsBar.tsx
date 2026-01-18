'use client';

import { motion } from 'framer-motion';
import { CreditCard, TrendingDown, Bell, Search } from 'lucide-react';

interface StatsBarProps {
  totalMonthly: number;
  totalSaved: number;
  activeCount: number;
  reviewCount: number;
  upcomingCount?: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  iconBgClass: string;
  value: string | number;
  label: string;
  badge?: string;
  badgeClass?: string;
  valueClass?: string;
  delay: number;
}

function StatCard({ icon, iconBgClass, value, label, badge, badgeClass, valueClass, delay }: StatCardProps) {
  return (
    <motion.div 
      className="card p-6 bg-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${iconBgClass} flex items-center justify-center`}>
          {icon}
        </div>
        {badge && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold mb-1 ${valueClass || ''}`}>{value}</div>
      <div className="text-sm text-[var(--foreground-muted)]">{label}</div>
    </motion.div>
  );
}

export function StatsBar({ totalMonthly, totalSaved, activeCount, reviewCount, upcomingCount = 0 }: StatsBarProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon={<CreditCard className="w-6 h-6 text-[var(--accent-primary)]" />}
        iconBgClass="bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5"
        value={`$${totalMonthly.toFixed(2)}`}
        label="Total spending"
        badge="Monthly"
        badgeClass="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
        delay={0.1}
      />
      
      <StatCard
        icon={<TrendingDown className="w-6 h-6 text-green-600" />}
        iconBgClass="bg-gradient-to-br from-green-500/10 to-green-500/5"
        value={`$${totalSaved.toFixed(2)}`}
        label="This month"
        badge="Saved"
        badgeClass="bg-green-100 text-green-700"
        valueClass="text-green-600"
        delay={0.2}
      />
      
      <StatCard
        icon={<Bell className="w-6 h-6 text-orange-600" />}
        iconBgClass="bg-gradient-to-br from-orange-500/10 to-orange-500/5"
        value={activeCount}
        label="Active subscriptions"
        badge={upcomingCount > 0 ? `${upcomingCount} soon` : undefined}
        badgeClass="bg-orange-100 text-orange-700"
        delay={0.3}
      />
      
      <StatCard
        icon={<Search className="w-6 h-6 text-yellow-600" />}
        iconBgClass="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5"
        value={reviewCount}
        label="Need review"
        badge={reviewCount > 0 ? `${reviewCount} items` : undefined}
        badgeClass="bg-yellow-100 text-yellow-700"
        delay={0.4}
      />
    </div>
  );
}

export default StatsBar;
