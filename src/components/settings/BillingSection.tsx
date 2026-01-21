'use client';

import { CreditCard, Rocket, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface BillingSectionProps {
  isPro: boolean;
  onUpgrade?: () => void;
  onManageSubscription?: () => void;
}

export function BillingSection({
  isPro,
  onUpgrade,
  onManageSubscription
}: BillingSectionProps) {
  if (!isPro) {
    return (
      <div className="card mb-6">
        <div className="p-6 border-b border-black/5 bg-[var(--background-secondary)]/50">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--foreground)]">
            <CreditCard className="w-5 h-5 text-[var(--foreground-muted)]" />
            Billing & Subscription
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--background-secondary)] border border-black/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span className="text-xs font-medium text-[var(--foreground-muted)]">Current Plan: Free</span>
          </div>
          
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Upgrade to Pro</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Get unlimited tracking, advanced alerts, price history, and priority support.
          </p>
          <button 
            onClick={onUpgrade}
            className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2"
          >
            Upgrade now
          </button>
        </div>
      </div>
    );
  }

  // Pro View (Mocked data as per request, until Stripe integration)
  return (
    <div className="card mb-6">
      <div className="p-6 border-b border-black/5 bg-[var(--background-secondary)]/50">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--foreground)]">
          <CreditCard className="w-5 h-5 text-[var(--foreground-muted)]" />
          Billing & Subscription
        </h2>
      </div>

      <div className="p-6 space-y-8">
        {/* Current Plan */}
        <div>
          <h3 className="font-medium text-sm text-[var(--foreground)] mb-4">Current Plan</h3>
          <div className="bg-[var(--background-secondary)] rounded-2xl p-5 border border-black/5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                  🚀 BillDrop Pro
                </h4>
                <div className="mt-1 text-sm text-[var(--foreground-muted)]">
                  <span className="font-medium">$6.99</span>/month
                  <span className="mx-2 text-black/10">|</span>
                  Billed monthly
                </div>
                <p className="text-xs text-[var(--foreground-muted)] opacity-70 mt-2">
                  Next billing: Feb 19, 2026
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-5">
              <button 
                onClick={onManageSubscription}
                className="text-xs font-medium text-[var(--foreground)] bg-white border border-black/10 px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors shadow-sm"
              >
                Change Plan
              </button>
              <button 
                onClick={onManageSubscription}
                className="text-xs font-medium text-red-600 bg-white border border-black/10 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
              >
                Cancel Plan
              </button>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="border-t border-black/5 pt-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-medium text-sm text-[var(--foreground)]">Payment Method</h3>
            <button className="text-xs font-medium text-[var(--accent-primary)] hover:underline">
              Update
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-6 bg-white rounded border border-black/10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[var(--foreground-muted)]">VISA</span>
            </div>
            <div className="text-sm text-[var(--foreground)]">
              Pass ending in <span className="font-mono">4242</span>
            </div>
            <div className="text-xs text-[var(--foreground-muted)] ml-auto">
              Expires 12/2027
            </div>
          </div>
        </div>

        {/* History */}
        <div className="border-t border-black/5 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm text-[var(--foreground)]">Billing History</h3>
            <button className="text-xs font-medium text-[var(--accent-primary)] hover:underline flex items-center gap-1">
              View All <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-3">
            {[
              { date: 'Jan 19, 2026', amount: '$6.99' },
              { date: 'Dec 19, 2025', amount: '$6.99' },
              { date: 'Nov 19, 2025', amount: '$6.99' },
            ].map((invoice, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-[var(--foreground-muted)]">{invoice.date}</span>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-[var(--foreground)]">{invoice.amount}</span>
                  <button className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
