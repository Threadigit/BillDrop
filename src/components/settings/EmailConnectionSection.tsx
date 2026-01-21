'use client';

import { useState } from 'react';
import { Mail, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailConnectionSectionProps {
  isConnected: boolean;
  email?: string;
  scanningEnabled: boolean;
  lastScannedAt?: string | null;
  onToggleScanning: (enabled: boolean) => Promise<void>;
  onRevoke: () => Promise<void>;
  onReconnect: () => void;
}

export function EmailConnectionSection({
  isConnected,
  email,
  scanningEnabled,
  lastScannedAt,
  onToggleScanning,
  onRevoke,
  onReconnect
}: EmailConnectionSectionProps) {
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggleScanning(!scanningEnabled);
    setToggling(false);
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await onRevoke();
      setShowRevokeConfirm(false); 
    } catch (error) {
      console.error(error);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="card mb-6">
      <div className="p-6 border-b border-black/5 bg-[var(--background-secondary)]/50">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--foreground)]">
          <Mail className="w-5 h-5 text-[var(--foreground-muted)]" />
          Email Connections
        </h2>
      </div>

      <div className="p-6">
        {isConnected ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-[var(--foreground)]">Gmail Account</h3>
                <p className="text-sm text-[var(--foreground-muted)]">{email}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-md w-fit">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Status: Connected
                </div>
                {lastScannedAt && (
                  <p className="text-xs text-slate-400 mt-2">
                    Last scanned: {new Date(lastScannedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-black/5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-sm text-slate-700">Email Scanning Access</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Allow BillDrop to automatically detect new subscriptions from this account.
                  </p>
                </div>
                <button
                  onClick={handleToggle}
                  disabled={toggling}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 ${
                    scanningEnabled ? 'bg-[var(--accent-primary)]' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      scanningEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {!scanningEnabled && (
                <div className="mt-4 bg-[var(--background-secondary)] rounded-xl p-4 text-xs text-[var(--foreground-muted)] border border-black/5 flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-[var(--foreground)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)] mb-1 text-sm">Scanning is paused</p>
                    <p className="leading-relaxed mb-2 opacity-90">
                      BillDrop won't be able to automatically find new subscriptions or track renewals.
                    </p>
                    <div className="flex flex-col gap-1 opacity-80">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[var(--foreground-muted)]"></span>
                        <span>Existing subscriptions remain tracked</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="w-1 h-1 rounded-full bg-[var(--foreground-muted)]"></span>
                         <span>You can re-enable this anytime</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-black/5 pt-4">
              {!showRevokeConfirm ? (
                <button
                  onClick={() => setShowRevokeConfirm(true)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Revoke Email Access
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border border-red-100 rounded-xl p-4"
                >
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-red-800 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Revoke Email Access?
                  </h4>
                  <p className="text-xs text-red-700 mb-4">
                    Are you sure? We won't be able to find new subscriptions or track renewals automatically. Your existing data will be kept.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRevoke}
                      disabled={revoking}
                      className="text-xs bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {revoking ? 'Revoking...' : 'Yes, Revoke Access'}
                    </button>
                    <button
                      onClick={() => setShowRevokeConfirm(false)}
                      disabled={revoking}
                      className="text-xs bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
              ℹ️ We only read subscription receipts/emails from tracked providers. Your personal emails are never accessed or stored.
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Gmail is Disconnected</h3>
            <p className="text-sm text-slate-500 mb-4 max-w-xs mx-auto">
              Reconnect your account to resume automatic subscription tracking.
            </p>
            <button
              onClick={onReconnect}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reconnect Gmail
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
