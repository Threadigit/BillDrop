'use client';

import { DollarSign, ChevronDown } from 'lucide-react';

interface SubscriptionPrefsSectionProps {
  currency: string;
  onChangeCurrency: (currency: string) => void;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
  { code: 'NGN', symbol: '₦', label: 'NGN (₦)' },
];

export function SubscriptionPrefsSection({
  currency,
  onChangeCurrency
}: SubscriptionPrefsSectionProps) {
  return (
    <div className="card mb-6">
      <div className="p-6 border-b border-black/5 bg-[var(--background-secondary)]/50">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--foreground)]">
          <DollarSign className="w-5 h-5 text-[var(--foreground-muted)]" />
          Subscription Preferences
        </h2>
      </div>

      <div className="p-6">
        <h3 className="font-medium text-sm text-[var(--foreground)] mb-3">Display Settings</h3>
        
        <div className="max-w-xs">
          <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
            Default currency
          </label>
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => onChangeCurrency(e.target.value)}
              className="appearance-none w-full bg-white border border-black/10 text-[var(--foreground)] text-sm rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)] pointer-events-none" />
          </div>
          <p className="text-xs text-[var(--foreground-subtle)] mt-2">
            We&apos;ll convert all subscription prices to your preferred currency.
          </p>
        </div>
      </div>
    </div>
  );
}
