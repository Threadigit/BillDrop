'use client';

import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface UpgradeBannerProps {
  trackedCount: number;
  freeLimit: number;
  confirmedCount: number;
  dismissible?: boolean;
  onUpgrade?: () => void;
}

export function UpgradeBanner({ 
  trackedCount, 
  freeLimit, 
  confirmedCount,
  dismissible = true,
  onUpgrade
}: UpgradeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Only show if user has more confirmed subscriptions than the free limit
  if (confirmedCount <= freeLimit || isDismissed) {
    return null;
  }
  
  const notTrackedCount = confirmedCount - trackedCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex items-center justify-between gap-4 px-4 py-3 mb-6 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10"
    >
      <div className="flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
        <span className="text-sm text-[var(--foreground)]">
          <span className="font-medium">{trackedCount}/{freeLimit} tracked</span>
          <span className="text-[var(--foreground-muted)]"> · {notTrackedCount} not tracked · </span>
          <button 
            onClick={() => onUpgrade && onUpgrade()}
            className="text-[var(--accent-primary)] font-medium hover:underline"
          >
            Upgrade for unlimited
          </button>
        </span>
      </div>
      
      {dismissible && (
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-md hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4 text-[var(--foreground-muted)]" />
        </button>
      )}
    </motion.div>
  );
}

export default UpgradeBanner;
