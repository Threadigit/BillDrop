'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Search, CheckCircle, AlertCircle, Loader2, Sparkles, X } from 'lucide-react';

interface FoundSubscription {
  id: string;
  serviceName: string;
  amount: number;
  currency: string;
  billingCycle: string;
  confidence: number | null;
  nextBillingDate?: string | null;
}

interface EmailScannerProps {
  onClose: () => void;
  onScanComplete: () => void;
  onSubscriptionFound: (subscription: FoundSubscription) => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  NGN: '₦',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  INR: '₹',
};

const formatCurrency = (amount: number, currency: string) => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function EmailScanner({ onClose, onScanComplete, onSubscriptionFound }: EmailScannerProps) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [foundSubscriptions, setFoundSubscriptions] = useState<FoundSubscription[]>([]);
  const [emailsFound, setEmailsFound] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const scanStartedRef = useRef(false);

  const startScan = useCallback(async () => {
    if (scanStartedRef.current) return;
    scanStartedRef.current = true;
    
    setStatus('scanning');
    setProgress(0);
    setFoundSubscriptions([]);
    setEmailsFound(0);
    setError(null);
    setStatusMessage('Connecting to Gmail...');

    try {
      const response = await fetch('/api/scan/stream');
      
      if (!response.ok) {
        throw new Error('Failed to start scan');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  setStatusMessage(data.message);
                  setProgress(data.progress || 0);
                  if (data.emailsFound) setEmailsFound(data.emailsFound);
                  break;
                  
                case 'subscription':
                  const newSub = data.subscription;
                  setFoundSubscriptions(prev => [...prev, newSub]);
                  // Immediately notify parent to add to main list
                  onSubscriptionFound(newSub);
                  break;
                  
                case 'complete':
                  setStatus('complete');
                  setProgress(100);
                  setStatusMessage(data.message);
                  break;
                  
                case 'error':
                  setStatus('error');
                  setError(data.message);
                  break;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Scan failed');
    }
  }, [onSubscriptionFound]);

  // Auto-start scan when component mounts
  useEffect(() => {
    startScan();
  }, [startScan]);

  const handleClose = () => {
    if (status === 'scanning') return; // Prevent closing during scan
    scanStartedRef.current = false;
    if (status === 'complete') {
      onScanComplete();
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Scanning Emails</h2>
            <p className="text-sm text-gray-500">{statusMessage || 'Finding your subscriptions...'}</p>
          </div>
        </div>
        {status !== 'scanning' && (
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">
            {status === 'scanning' && emailsFound > 0 && `Analyzing ${emailsFound} emails`}
            {status === 'complete' && 'Scan complete'}
            {status === 'error' && 'Scan failed'}
          </span>
          <span className="text-xs font-bold text-violet-600">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${status === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-purple-600'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Found subscriptions - compact inline list */}
      {foundSubscriptions.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700">
              Found {foundSubscriptions.length} subscription{foundSubscriptions.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {foundSubscriptions.map((sub) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm border border-green-100"
              >
                <span className="font-medium">{sub.serviceName}</span>
                <span className="text-green-600">{formatCurrency(sub.amount, sub.currency)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Scanning animation */}
      {status === 'scanning' && foundSubscriptions.length === 0 && progress > 20 && (
        <div className="px-4 pb-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
          <span className="text-sm text-gray-500">Analyzing emails for subscriptions...</span>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={() => {
              scanStartedRef.current = false;
              startScan();
            }}
            className="mt-2 text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {/* Complete state */}
      {status === 'complete' && (
        <div className="px-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {foundSubscriptions.length > 0 
                ? `Added ${foundSubscriptions.length} subscription${foundSubscriptions.length !== 1 ? 's' : ''} to your list`
                : 'No new subscriptions found'}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            Done
          </button>
        </div>
      )}
    </motion.div>
  );
}
