'use client';

import { Shield, Download, Trash, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface PrivacySectionProps {
  onExportData: () => void;
  onDeleteData: () => Promise<void>;
  isPro?: boolean;
  onUpgrade?: () => void;
}

export function PrivacySection({
  onExportData,
  onDeleteData,
  isPro = false,
  onUpgrade
}: PrivacySectionProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const router = useRouter();

  const handleExport = () => {
    if (!isPro) {
      onUpgrade ? onUpgrade() : router.push('/pricing');
      return;
    }
    onExportData();
  };

  return (
    <div className="card mb-6">
      <div className="p-6 border-b border-black/5 bg-[var(--background-secondary)]/50">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--foreground)]">
          <Shield className="w-5 h-5 text-[var(--foreground-muted)]" />
          Privacy & Data
        </h2>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h3 className="font-semibold text-blue-900 mb-1">Your Data is Yours</h3>
            <p className="text-blue-800 opacity-90 leading-relaxed">
              We only store what is necessary to track your subscriptions. We do not sell your data.
              Subscription data is processed securely and you can delete it at any time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleExport}
            className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-black/5 hover:border-black/10 hover:bg-[var(--background-secondary)] transition-all group text-center"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-3 group-hover:shadow-sm transition-all border border-black/5">
              <Download className="w-5 h-5 text-[var(--foreground-muted)]" />
            </div>
            <h3 className="font-medium text-[var(--foreground)] text-sm flex items-center gap-2">
              Export Data
              {!isPro && <span className="text-[10px] font-bold bg-slate-100 text-[var(--foreground-subtle)] px-1.5 py-0.5 rounded uppercase">Pro</span>}
            </h3>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">Download CSV of active subscriptions</p>
          </button>

          <div className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-black/5 hover:border-red-100 hover:bg-red-50/50 transition-all group text-center relative">
            {!showDeleteConfirm ? (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full h-full flex flex-col items-center justify-center"
              >
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-red-100 transition-all">
                  <Trash className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-medium text-[var(--foreground)] text-sm group-hover:text-red-700">Clear Subscription Data</h3>
                <p className="text-xs text-[var(--foreground-muted)] mt-1 group-hover:text-red-600/70">Remove all tracked subscriptions</p>
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 rounded-xl z-10"
              >
                {!deleted ? (
                  <>
                    <p className="text-xs font-semibold text-red-600 mb-3 text-center">
                      Delete all {`subscriptions`}?
                    </p>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={async () => {
                          setDeleting(true);
                          await onDeleteData();
                          setDeleting(false);
                          setDeleted(true);
                          setTimeout(() => {
                            setDeleted(false);
                            setShowDeleteConfirm(false);
                          }, 2000);
                        }}
                        disabled={deleting}
                        className="flex-1 bg-red-600 text-white text-xs py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleting ? 'Deleting...' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deleting}
                        className="flex-1 bg-white border border-black/10 text-[var(--foreground)] text-xs py-2 rounded-lg hover:bg-[var(--background-secondary)]"
                      >
                        No
                      </button>
                    </div>
                  </>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-green-600"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold">Data Cleared!</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
