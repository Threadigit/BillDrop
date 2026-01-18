'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Edit2 } from 'lucide-react';

interface PendingSubscription {
  id: string;
  serviceName: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextBillingDate: string | null;
  confidence: number;
}

interface ConfirmationModalProps {
  subscriptions: PendingSubscription[];
  onConfirm: (id: string, updates?: Partial<PendingSubscription>) => void;
  onReject: (id: string) => void;
  onComplete: () => void;
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

export function ConfirmationModal({ 
  subscriptions, 
  onConfirm, 
  onReject, 
  onComplete 
}: ConfirmationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<PendingSubscription>>({});

  const currentSub = subscriptions[currentIndex];
  const progress = ((currentIndex) / subscriptions.length) * 100;
  const isComplete = currentIndex >= subscriptions.length;

  const handleConfirm = () => {
    if (currentSub) {
      onConfirm(currentSub.id, editing ? editData : undefined);
      setEditing(false);
      setEditData({});
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleReject = () => {
    if (currentSub) {
      onReject(currentSub.id);
      setEditing(false);
      setEditData({});
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    setEditing(false);
    setEditData({});
    setCurrentIndex(prev => prev + 1);
  };

  if (isComplete) {
    return (
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Review Complete!</h3>
          <p className="text-[var(--foreground-muted)] mb-6">
            Your subscriptions have been updated based on your feedback.
          </p>
          <button onClick={onComplete} className="btn-primary w-full py-3">
            View Dashboard
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Header with progress */}
        <div className="p-6 border-b border-black/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Review Subscriptions</h2>
            <span className="text-sm text-[var(--foreground-muted)]">
              {currentIndex + 1} of {subscriptions.length}
            </span>
          </div>
          <div className="w-full bg-black/5 rounded-full h-1.5">
            <motion.div
              className="bg-[var(--accent-primary)] h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current subscription */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSub.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6"
          >
            {/* Confidence indicator */}
            {currentSub.confidence < 0.8 && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-yellow-50 text-yellow-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {currentSub.confidence < 0.6 
                    ? "We're not sure about this one. Please verify."
                    : "This might be a subscription. Please confirm."}
                </span>
              </div>
            )}

            {/* Subscription details */}
            <div className="bg-black/[0.02] rounded-2xl p-5 mb-6">
              {editing ? (
                // Edit mode
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-[var(--foreground-muted)] block mb-1">
                      Service Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-[var(--accent-primary)] focus:outline-none"
                      defaultValue={currentSub.serviceName}
                      onChange={(e) => setEditData(prev => ({ ...prev, serviceName: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-[var(--foreground-muted)] block mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-[var(--accent-primary)] focus:outline-none"
                        defaultValue={currentSub.amount}
                        onChange={(e) => setEditData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[var(--foreground-muted)] block mb-1">
                        Currency
                      </label>
                      <select
                        className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-[var(--accent-primary)] focus:outline-none bg-white"
                        defaultValue={currentSub.currency}
                        onChange={(e) => setEditData(prev => ({ ...prev, currency: e.target.value }))}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="NGN">NGN (₦)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD (CA$)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-[var(--foreground-muted)] block mb-1">
                      Billing Cycle
                    </label>
                    <select
                      className="w-full px-4 py-2 rounded-xl border border-black/10 focus:border-[var(--accent-primary)] focus:outline-none bg-white"
                      defaultValue={currentSub.billingCycle}
                      onChange={(e) => setEditData(prev => ({ ...prev, billingCycle: e.target.value }))}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{currentSub.serviceName}</h3>
                    <button
                      onClick={() => setEditing(true)}
                      className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                      title="Edit details"
                    >
                      <Edit2 className="w-4 h-4 text-[var(--foreground-muted)]" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[var(--foreground-muted)]">Amount</span>
                      <div className="font-semibold text-lg">
                        {formatCurrency(currentSub.amount, currentSub.currency)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[var(--foreground-muted)]">Billing</span>
                      <div className="font-medium capitalize">{currentSub.billingCycle}</div>
                    </div>
                    {currentSub.nextBillingDate && (
                      <div className="col-span-2">
                        <span className="text-[var(--foreground-muted)]">Next billing</span>
                        <div className="font-medium">
                          {new Date(currentSub.nextBillingDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Question */}
            <p className="text-center text-[var(--foreground-muted)] mb-6">
              Is this a subscription you want to track?
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <X className="w-5 h-5" />
                Not Subscription
              </button>
              <button
                onClick={handleSkip}
                className="py-3 px-4 rounded-xl border-2 border-black/10 text-[var(--foreground-muted)] hover:bg-black/5 transition-colors font-medium"
              >
                Skip
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
              >
                <Check className="w-5 h-5" />
                Yes, Track
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default ConfirmationModal;
