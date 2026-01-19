'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Trash2, Calendar, DollarSign, RefreshCw } from 'lucide-react';

interface Subscription {
  id: string;
  serviceName: string;
  description?: string | null;
  amount: number;
  currency: string;
  billingCycle: string;
  nextBillingDate: Date | null;
  cancellationUrl?: string | null;
  confirmed?: boolean;
  icon?: string;
  color?: string;
}

interface SubscriptionDetailModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Subscription>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'NGN', symbol: '₦' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'INR', symbol: '₹' },
];

const BILLING_CYCLES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const serviceDefaults: Record<string, { icon: string; color: string }> = {
  netflix: { icon: '🎬', color: '#E50914' },
  spotify: { icon: '🎵', color: '#1DB954' },
  chatgpt: { icon: '🤖', color: '#10A37F' },
  google: { icon: '🔍', color: '#4285F4' },
  github: { icon: '🐙', color: '#181717' },
  default: { icon: '💳', color: '#6366F1' },
};

function getServiceDefaults(name: string) {
  const key = name.toLowerCase();
  for (const [n, d] of Object.entries(serviceDefaults)) {
    if (key.includes(n)) return d;
  }
  return serviceDefaults.default;
}

export function SubscriptionDetailModal({
  subscription,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: SubscriptionDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [nextDate, setNextDate] = useState('');

  // Reset form when subscription changes
  useEffect(() => {
    if (subscription) {
      setAmount(subscription.amount);
      setCurrency(subscription.currency);
      setBillingCycle(subscription.billingCycle);
      setNextDate(subscription.nextBillingDate 
        ? new Date(subscription.nextBillingDate).toISOString().split('T')[0] : '');
    }
  }, [subscription?.id]);

  if (!subscription) return null;
  
  const { icon, color } = getServiceDefaults(subscription.serviceName);

  const handleSave = async () => {
    setIsLoading(true);
    await onUpdate(subscription.id, { amount, currency, billingCycle, nextBillingDate: nextDate ? new Date(nextDate) : null });
    setIsLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    if (confirm(`Delete ${subscription.serviceName}?`)) {
      await onDelete(subscription.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="p-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${color}20` }}>{icon}</div>
                <div className="flex-1">
                  <h2 className="font-semibold text-base">{subscription.serviceName}</h2>
                  {subscription.description ? (
                    <p className="text-xs text-indigo-600 font-medium">{subscription.description}</p>
                  ) : (
                    <p className="text-xs text-gray-500">{subscription.confirmed ? 'Active' : 'Pending'}</p>
                  )}
                </div>
                <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X className="w-4 h-4" /></button>
              </div>
              
              {/* Form */}
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1"><DollarSign className="w-3 h-3 inline" /> Amount</label>
                    <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border text-sm" step="0.01" />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs text-gray-500 mb-1">Currency</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-2 py-2 rounded-lg border text-sm bg-white">
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1"><RefreshCw className="w-3 h-3 inline" /> Cycle</label>
                  <div className="flex gap-1">
                    {BILLING_CYCLES.map(c => (
                      <button key={c.value} onClick={() => setBillingCycle(c.value)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${billingCycle === c.value ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`}>{c.label}</button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1"><Calendar className="w-3 h-3 inline" /> Next Bill</label>
                  <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                
                {subscription.cancellationUrl && (
                  <a href={subscription.cancellationUrl} target="_blank" className="flex items-center justify-center gap-1 py-2 rounded-lg border border-red-200 text-red-500 text-xs"><ExternalLink className="w-3 h-3" />Cancel</a>
                )}
              </div>
              
              {/* Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <button onClick={handleDelete} className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                <button onClick={handleSave} disabled={isLoading} className="flex-1 py-2 rounded-lg text-white text-sm font-medium bg-indigo-500">{isLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SubscriptionDetailModal;
