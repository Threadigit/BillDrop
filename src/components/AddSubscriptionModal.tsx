'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, DollarSign, RefreshCw, Calendar } from 'lucide-react';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    serviceName: string;
    amount: number;
    currency: string;
    billingCycle: string;
    nextBillingDate: string | null;
  }) => Promise<void>;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

const BILLING_CYCLES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function AddSubscriptionModal({ isOpen, onClose, onAdd }: AddSubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setServiceName('');
    setAmount('');
    setCurrency('USD');
    setBillingCycle('monthly');
    setNextBillingDate('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!serviceName.trim()) {
      setError('Service name is required');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      await onAdd({
        serviceName: serviceName.trim(),
        amount: parseFloat(amount),
        currency,
        billingCycle,
        nextBillingDate: nextBillingDate || null,
      });
      resetForm();
      onClose();
    } catch (err) {
      setError('Failed to add subscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={handleClose} 
          />
          
          {/* Modal */}
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }} 
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">Add Subscription</h2>
                    <p className="text-xs text-slate-400">Track a new recurring payment</p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Service Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Service Name
                  </label>
                  <input 
                    type="text" 
                    value={serviceName} 
                    onChange={e => setServiceName(e.target.value)}
                    placeholder="e.g. Netflix, Spotify, Gym"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    autoFocus
                  />
                </div>

                {/* Amount & Currency */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                      <DollarSign className="w-3 h-3 inline mr-1" />
                      Amount
                    </label>
                    <input 
                      type="number" 
                      value={amount} 
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                      Currency
                    </label>
                    <select 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    <RefreshCw className="w-3 h-3 inline mr-1" />
                    Billing Cycle
                  </label>
                  <div className="flex gap-2">
                    {BILLING_CYCLES.map(c => (
                      <button 
                        key={c.value} 
                        type="button"
                        onClick={() => setBillingCycle(c.value)} 
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                          billingCycle === c.value 
                            ? 'bg-indigo-500 text-white shadow-sm' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next Billing Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Next Billing Date <span className="text-slate-300">(optional)</span>
                  </label>
                  <input 
                    type="date" 
                    value={nextBillingDate} 
                    onChange={e => setNextBillingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Adding...' : 'Add Subscription'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AddSubscriptionModal;
