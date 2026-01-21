'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Crown, ArrowRight, X, Check } from 'lucide-react';
import Link from 'next/link';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionName: string;
  trackedCount: number;
  freeLimit: number;
  onConfirmWithoutTracking: () => void;
  onUpgrade?: () => void;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  subscriptionName,
  trackedCount,
  freeLimit,
  onConfirmWithoutTracking,
  onUpgrade
}: LimitReachedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b border-amber-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-amber-900">
                        Tracking Limit Reached
                      </h2>
                      <p className="text-sm text-amber-700">
                        {trackedCount}/{freeLimit} subscriptions tracked
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-amber-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-[var(--foreground-muted)] mb-6">
                  You&apos;ve confirmed <strong>{subscriptionName}</strong>, but your free tier can only track {freeLimit} subscriptions. Choose an option:
                </p>

                {/* Options */}
                <div className="space-y-3">
                  {/* Option 1: Upgrade */}
                  <button
                    onClick={() => {
                        onUpgrade && onUpgrade();
                        onClose(); // Optional: close limit modal when opening upgrade modal
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[var(--accent-primary)] bg-indigo-50 hover:bg-indigo-100 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--accent-primary)]">
                        Upgrade to Pro
                      </div>
                      <div className="text-sm text-[var(--foreground-muted)]">
                        Track unlimited subscriptions for $6.99/mo
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[var(--accent-primary)]" />
                  </button>

                  {/* Option 2: Confirm without tracking */}
                  <button
                    onClick={() => {
                      onConfirmWithoutTracking();
                      onClose();
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-black/10 hover:bg-black/[0.02] transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Check className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        Confirm without tracking
                      </div>
                      <div className="text-sm text-[var(--foreground-muted)]">
                        Save subscription data but don&apos;t count toward stats
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <button
                  onClick={onClose}
                  className="w-full py-3 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default LimitReachedModal;
