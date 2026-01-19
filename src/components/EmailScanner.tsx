'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, Loader2, X, Zap, Search, ArrowRight, CheckSquare, Square } from 'lucide-react';

interface FoundSubscription {
  id: string;
  serviceName: string;
  description?: string | null;
  amount: number;
  currency: string;
  billingCycle: string;
  confidence: number | null;
  nextBillingDate?: string | null;
}

interface StoredEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  extractedServiceName?: string;
  matchedKeywords: string[];
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

// Brand colors
const BRAND_COLOR = '#6366f1';
const BRAND_COLOR_LIGHT = '#818cf8';
const BRAND_COLOR_DARK = '#4f46e5';

// Batch size for processing emails
const BATCH_SIZE = 5;

type ScannerStatus = 'idle' | 'fetching' | 'review' | 'analyzing' | 'complete' | 'error';

export default function EmailScanner({ onClose, onScanComplete, onSubscriptionFound }: EmailScannerProps) {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);
  
  // Data state
  const [potentialEmails, setPotentialEmails] = useState<StoredEmail[]>([]);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [foundSubscriptions, setFoundSubscriptions] = useState<FoundSubscription[]>([]);
  const [totalEmailsScanned, setTotalEmailsScanned] = useState(0);
  
  const [error, setError] = useState<string | null>(null);
  const scanStartedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Step 1: Fetch potential subscriptions
  const fetchPotentials = useCallback(async () => {
    if (scanStartedRef.current) return;
    scanStartedRef.current = true;
    
    abortControllerRef.current = new AbortController();
    
    setStatus('fetching');
    setProgress(10);
    setStatusMessage('Connecting to Gmail...');
    setError(null);

    try {
      setStatusMessage('Scanning emails from last 30 days...');
      setProgress(30);
      
      const response = await fetch('/api/scan/batch', {
        signal: abortControllerRef.current?.signal,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch emails');
      }

      const data = await response.json();
      const emails: StoredEmail[] = data.emails;
      
      setTotalEmailsScanned(data.totalEmails);
      setPotentialEmails(emails);
      
      // Select all by default
      setSelectedEmailIds(new Set(emails.map(e => e.id)));
      
      if (emails.length === 0) {
        setStatus('complete');
        setProgress(100);
        setStatusMessage('No potential subscriptions found');
      } else {
        setStatus('review');
        setProgress(50);
        setStatusMessage(`Found ${emails.length} potential subscriptions`);
      }

    } catch (err) {
      console.error('Fetch error:', err);
      if (err instanceof Error && err.name === 'AbortError') return;
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to scan emails');
    }
  }, []);

  // Step 2: Process selected emails
  const processSelected = async () => {
    setStatus('analyzing');
    setProgress(0);
    setStatusMessage('Starting AI analysis...');
    
    const emailsToProcess = potentialEmails.filter(e => selectedEmailIds.has(e.id));
    const totalBatches = Math.ceil(emailsToProcess.length / BATCH_SIZE);
    let processedBatches = 0;
    let totalFound = 0;

    try {
      for (let i = 0; i < emailsToProcess.length; i += BATCH_SIZE) {
        if (abortControllerRef.current?.signal.aborted) throw new Error('Cancelled');

        const batch = emailsToProcess.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        
        setStatusMessage(`Analyzing batch ${batchNum} of ${totalBatches}...`);
        
        // Update progress at start of batch (smooth progression)
        const batchStartProgress = ((batchNum - 1) / totalBatches) * 100;
        setProgress(batchStartProgress);

        try {
          const response = await fetch('/api/scan/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails: batch }),
            signal: abortControllerRef.current?.signal,
          });

          if (response.ok) {
            const data = await response.json();
            if (data.subscriptions?.length > 0) {
              for (const sub of data.subscriptions) {
                setFoundSubscriptions(prev => [...prev, sub]);
                onSubscriptionFound(sub);
                totalFound++;
              }
            }
          }
        } catch (err) {
          console.error(`Batch ${batchNum} error:`, err);
        }

        processedBatches++;
        // Update progress after batch completes
        setProgress((processedBatches / totalBatches) * 100);
      }

      setStatus('complete');
      setProgress(100);
      setStatusMessage(`Successfully added ${totalFound} subscriptions`);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setStatus('error');
      setError('Analysis incomplete');
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedEmailIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedEmailIds(newSet);
  };

  const toggleAll = () => {
    if (selectedEmailIds.size === potentialEmails.length) {
      setSelectedEmailIds(new Set());
    } else {
      setSelectedEmailIds(new Set(potentialEmails.map(e => e.id)));
    }
  };

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) fetchPotentials();
    }, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchPotentials]);

  const handleClose = () => {
    abortControllerRef.current?.abort();
    scanStartedRef.current = false;
    if (status === 'complete') onScanComplete();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full bg-white rounded-3xl shadow-lg shadow-indigo-100/50 border border-slate-200 overflow-hidden mb-8 flex flex-col relative"
    >
      {/* Header */}
      <div 
        className="p-5 flex items-center justify-between shrink-0"
        style={{ background: `linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_COLOR_DARK} 100%)` }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner border border-white/10">
            {status === 'fetching' ? <Loader2 className="animate-spin w-6 h-6" /> :
             status === 'review' ? <Search className="w-6 h-6" /> :
             status === 'analyzing' ? <Zap className="w-6 h-6" /> :
             status === 'complete' ? <CheckCircle className="w-6 h-6" /> :
             <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {status === 'review' ? 'Review Discovery' :
               status === 'fetching' ? 'Scanning Inbox' :
               status === 'analyzing' ? 'AI Analysis' : 
               'Email Scanner'}
            </h2>
            <p className="text-sm text-indigo-100 font-medium opacity-90">
              {status === 'review' && totalEmailsScanned > 0 ? `Scanned ${totalEmailsScanned} emails` :
               statusMessage}
            </p>
          </div>
        </div>
        <button 
          onClick={handleClose} 
          className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"
          title="Close Scanner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 bg-slate-50 min-h-[200px]">
        
        {/* AI Analysis View - Minimalist Design */}
        {status === 'analyzing' && (
          <div className="space-y-5">
            {/* Main Analysis Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      <Zap className="w-5 h-5 text-white" />
                    </motion.div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Analyzing emails
                  </h3>
                  <p className="text-sm text-slate-500">{statusMessage}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Progress</span>
                  <span className="text-sm font-semibold text-slate-700">{Math.round(progress)}%</span>
                </div>
                
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ 
                      background: '#81B29A', // Sage green - secondary color
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Status Indicator */}
              <div className="mt-5 pt-4 border-t border-slate-50 flex items-center gap-2">
                <motion.div 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#81B29A' }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-xs text-slate-400">
                  AI is processing your emails
                </span>
              </div>

              {/* Subscriptions Found Count with Tags - Inside main card */}
              {foundSubscriptions.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {foundSubscriptions.length} subscription{foundSubscriptions.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {foundSubscriptions.filter(sub => sub.amount > 0).map((sub) => (
                      <span 
                        key={sub.id}
                        className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-medium border border-slate-100"
                      >
                        {sub.serviceName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Fetching Progress Bar */}
        {status === 'fetching' && (
          <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
              <span>Fetching Emails</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${BRAND_COLOR}, ${BRAND_COLOR_LIGHT})` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Review List */}
        {status === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              <div>
                <h3 className="font-bold text-indigo-900">Potential Subscriptions</h3>
                <p className="text-xs text-indigo-600 font-medium">Found {potentialEmails.length} candidates</p>
              </div>
              <button 
                onClick={toggleAll}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-indigo-100"
              >
                {selectedEmailIds.size === potentialEmails.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {selectedEmailIds.size === potentialEmails.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {potentialEmails.map(email => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    selectedEmailIds.has(email.id) 
                      ? 'bg-white border-indigo-500 shadow-md shadow-indigo-100' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                  }`}
                  onClick={() => toggleSelection(email.id)}
                >
                  <div className="flex items-start gap-3.5 relative z-10">
                    <div className={`mt-0.5 transition-colors ${selectedEmailIds.has(email.id) ? 'text-indigo-600' : 'text-slate-300'}`}>
                      {selectedEmailIds.has(email.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold text-sm truncate pr-2 ${selectedEmailIds.has(email.id) ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {email.subject}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-medium text-slate-500 truncate max-w-[120px]">{email.from}</p>
                        <span className="text-[10px] text-slate-400">•</span>
                        <p className="text-xs text-slate-400">
                          {new Date(email.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                        {email.extractedServiceName && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wide ml-auto">
                            {email.extractedServiceName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Summary */}
        {status === 'complete' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Scan Complete
                </h3>
                <p className="text-sm text-slate-500">
                  {foundSubscriptions.filter(sub => sub.amount > 0).length > 0 
                    ? `Found ${foundSubscriptions.filter(sub => sub.amount > 0).length} subscription${foundSubscriptions.filter(sub => sub.amount > 0).length !== 1 ? 's' : ''}`
                    : 'No new subscriptions found'}
                </p>
              </div>
            </div>

            {foundSubscriptions.filter(sub => sub.amount > 0).length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Added to your list</p>
                <div className="flex flex-wrap gap-2">
                  {foundSubscriptions.filter(sub => sub.amount > 0).map((sub) => (
                    <span 
                      key={sub.id}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100"
                    >
                      {sub.serviceName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}


        {status === 'error' && (
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">Scan Failed</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
            <button onClick={() => { setStatus('idle'); fetchPotentials(); }} className="px-3 py-1.5 bg-white rounded-lg text-xs font-bold shadow-sm border border-red-100 hover:bg-red-50 transition-colors">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {status === 'review' && (
        <div className="p-5 bg-white border-t border-slate-100 flex justify-between items-center z-10">
          <div className="text-xs font-medium text-slate-400">
            {selectedEmailIds.size} selected
          </div>
          <button
            onClick={processSelected}
            disabled={selectedEmailIds.size === 0}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Analyze with AI
            <Zap className="w-4 h-4 fill-white" />
          </button>
        </div>
      )}

      {status === 'complete' && (
        <div className="p-5 bg-white border-t border-slate-100 flex justify-end z-10">
          <button
            onClick={handleClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-slate-200"
          >
            Done
          </button>
        </div>
      )}
    </motion.div>
  );
}
