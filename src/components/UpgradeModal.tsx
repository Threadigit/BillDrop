'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Check, Bell } from 'lucide-react';
import Image from 'next/image';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [notified, setNotified] = useState(false);

  const handleNotifyMe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: { proPlanSubscriptionIntent: true } }),
      });
      
      if (res.ok) {
        setNotified(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[var(--background)] rounded-2xl shadow-2xl overflow-hidden border border-black/5"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 text-[var(--foreground-muted)] transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 text-center">
            {/* Header Icon */}
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Image 
                src="/logo.png" 
                alt="BillDrop" 
                width={64} 
                height={64} 
                className="rounded-2xl shadow-lg border border-black/5"
              />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Coming Soon
            </div>

            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Upgrade to BillDrop Pro
            </h2>
            <p className="text-[var(--foreground-muted)] mb-8 leading-relaxed">
              We&apos;re building powerful tools to help you save even more. Unlock unlimited tracking, real-time alerts, and detailed spending analytics.
            </p>

            {/* Benefits List */}
            <div className="text-left space-y-3 mb-8 bg-[var(--background-secondary)] p-4 rounded-xl">
              {[
                'Unlimited subscription tracking',
                'Real-time price change alerts',
                'Weekly spending digests',
                'Export data',
                'Priority support'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm text-[var(--foreground)]">{feature}</span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            {!notified ? (
              <button
                onClick={handleNotifyMe}
                disabled={loading}
                className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    <Bell className="w-4 h-4 group-hover:shake" />
                    Notify Me When Available
                  </>
                )}
              </button>
            ) : (
              <div className="w-full py-3 bg-green-50 text-green-700 rounded-xl font-medium flex items-center justify-center gap-2 border border-green-100">
                <Check className="w-5 h-5" />
                You&apos;ll be the first to know!
              </div>
            )}
            
            <p className="text-xs text-[var(--foreground-subtle)] mt-4">
              We won&apos;t spam you. Promise.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
