'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, Loader2, X, Zap } from 'lucide-react';

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

// Logo brand color - indigo/purple
const BRAND_COLOR = '#6366f1';
const BRAND_COLOR_LIGHT = '#818cf8';
const BRAND_COLOR_DARK = '#4f46e5';

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

  useEffect(() => {
    startScan();
  }, [startScan]);

  const handleClose = () => {
    if (status === 'scanning') return;
    scanStartedRef.current = false;
    if (status === 'complete') {
      onScanComplete();
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="bg-white rounded-2xl shadow-xl border border-indigo-100 mb-6 overflow-hidden"
    >
      {/* Header with gradient */}
      <div 
        className="p-4 flex items-center justify-between"
        style={{ 
          background: `linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_COLOR_DARK} 100%)` 
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {status === 'scanning' ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : status === 'complete' ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : status === 'error' ? (
              <AlertCircle className="w-5 h-5 text-white" />
            ) : (
              <Mail className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {status === 'scanning' ? 'Scanning Emails' : 
               status === 'complete' ? 'Scan Complete' :
               status === 'error' ? 'Scan Failed' : 'Email Scanner'}
            </h2>
            <p className="text-sm text-white/80">{statusMessage || 'Finding your subscriptions...'}</p>
          </div>
        </div>
        {status !== 'scanning' && (
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* V2 Progress Bar */}
      <div className="px-4 py-4 bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {status === 'scanning' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4"
              >
                <Zap className="w-4 h-4 text-indigo-500" />
              </motion.div>
            )}
            <span className="text-sm font-medium text-gray-700">
              {status === 'scanning' && emailsFound > 0 && `Processing ${emailsFound} emails`}
              {status === 'complete' && `Completed • ${foundSubscriptions.length} found`}
              {status === 'error' && 'Error occurred'}
            </span>
          </div>
          <span 
            className="text-sm font-bold"
            style={{ color: BRAND_COLOR }}
          >
            {progress}%
          </span>
        </div>
        
        {/* Progress track v2 - with glow effect */}
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          {/* Background shimmer */}
          {status === 'scanning' && (
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(90deg, transparent, ${BRAND_COLOR_LIGHT}, transparent)`,
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
          
          {/* Progress fill */}
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            style={{
              background: status === 'error' 
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : `linear-gradient(90deg, ${BRAND_COLOR}, ${BRAND_COLOR_DARK})`,
              boxShadow: status !== 'error' ? `0 0 10px ${BRAND_COLOR}40` : undefined,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
            />
          </motion.div>
        </div>
        
        {/* Stage indicators */}
        {status === 'scanning' && (
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span className={progress >= 5 ? 'text-indigo-500 font-medium' : ''}>Connect</span>
            <span className={progress >= 20 ? 'text-indigo-500 font-medium' : ''}>Fetch</span>
            <span className={progress >= 30 ? 'text-indigo-500 font-medium' : ''}>Filter</span>
            <span className={progress >= 50 ? 'text-indigo-500 font-medium' : ''}>Analyze</span>
            <span className={progress >= 95 ? 'text-indigo-500 font-medium' : ''}>Done</span>
          </div>
        )}
      </div>

      {/* Found subscriptions - compact pills */}
      {foundSubscriptions.length > 0 && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="flex items-center gap-2 pt-3 pb-2">
            <CheckCircle className="w-4 h-4" style={{ color: BRAND_COLOR }} />
            <span className="text-sm font-medium text-gray-700">
              Found {foundSubscriptions.length} subscription{foundSubscriptions.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {foundSubscriptions.map((sub, index) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border"
                style={{ 
                  backgroundColor: `${BRAND_COLOR}10`,
                  borderColor: `${BRAND_COLOR}30`,
                  color: BRAND_COLOR_DARK
                }}
              >
                <span className="font-medium">{sub.serviceName}</span>
                <span className="opacity-70">{formatCurrency(sub.amount, sub.currency)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Scanning animation when no results yet */}
      {status === 'scanning' && foundSubscriptions.length === 0 && progress > 30 && (
        <div className="px-4 pb-4 flex items-center gap-3 border-t border-gray-100 pt-3">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: BRAND_COLOR }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">Analyzing emails for subscriptions...</span>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={() => {
              scanStartedRef.current = false;
              startScan();
            }}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: `${BRAND_COLOR}10`, color: BRAND_COLOR }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Complete state */}
      {status === 'complete' && (
        <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2" style={{ color: BRAND_COLOR }}>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {foundSubscriptions.length > 0 
                ? `Added ${foundSubscriptions.length} subscription${foundSubscriptions.length !== 1 ? 's' : ''} to your list`
                : 'No new subscriptions found'}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: BRAND_COLOR, color: 'white' }}
          >
            Done
          </button>
        </div>
      )}
    </motion.div>
  );
}
