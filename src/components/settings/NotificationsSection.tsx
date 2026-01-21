'use client';

import { Bell, Zap, Mail, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationsSectionProps {
  renewalAlerts: boolean;
  priceChangeAlerts: boolean;
  marketingEmails: boolean;
  onUpdate: (key: string, value: boolean) => void;
  isPro?: boolean;
  onUpgrade?: () => void;
}

export function NotificationsSection({
  renewalAlerts,
  priceChangeAlerts,
  marketingEmails,
  onUpdate,
  isPro = false,
  onUpgrade
}: NotificationsSectionProps) {
  const router = useRouter();

  const handleProToggle = (key: string, currentValue: boolean) => {
    if (!isPro) {
      onUpgrade ? onUpgrade() : router.push('/pricing');
      return;
    }
    onUpdate(key, currentValue);
  };

  const Toggle = ({ 
    active, 
    onChange, 
    disabled = false 
  }: { 
    active: boolean; 
    onChange: (v: boolean) => void; 
    disabled?: boolean;
  }) => (
    <button
      onClick={() => !disabled && onChange(!active)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 ${
        active ? 'bg-[var(--accent-primary)]' : 'bg-slate-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          active ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="card mb-6">
      <div className="p-6 border-b border-black/5 bg-[var(--background-secondary)]/50">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--foreground)]">
          <Bell className="w-5 h-5 text-[var(--foreground-muted)]" />
          Notifications
        </h2>
      </div>

      <div className="divide-y divide-black/5">
        <div className="p-6 flex items-start justify-between">
          <div className="flex gap-3">
            <div className="mt-0.5 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-[var(--foreground)]">Renewal Alerts</h3>
              <p className="text-xs text-[var(--foreground-muted)] max-w-sm mt-0.5">
                Get notified 3 days before a subscription renews.
              </p>
            </div>
          </div>
          <Toggle 
            active={renewalAlerts} 
            onChange={(v) => onUpdate('renewalAlerts', v)} 
          />
        </div>

        <div className="p-6 flex items-start justify-between">
          <div className="flex gap-3">
            <div className="mt-0.5 w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-[var(--foreground)] flex items-center gap-2">
                Price Change Alerts
                {!isPro && <span className="text-[10px] font-bold bg-slate-100 text-[var(--foreground-subtle)] px-1.5 py-0.5 rounded uppercase">Pro</span>}
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] max-w-sm mt-0.5">
                Receive alerts when we detect a price increase.
              </p>
            </div>
          </div>
          <Toggle 
            active={priceChangeAlerts} 
            onChange={(v) => handleProToggle('priceChangeAlerts', v)}
            disabled={false}
          />
        </div>

        <div className="p-6 flex items-start justify-between">
          <div className="flex gap-3">
            <div className="mt-0.5 w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-[var(--foreground)] flex items-center gap-2">
                Weekly Digest
                {!isPro && <span className="text-[10px] font-bold bg-slate-100 text-[var(--foreground-subtle)] px-1.5 py-0.5 rounded uppercase">Pro</span>}
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] max-w-sm mt-0.5">
                A summary of your upcoming bills and potential savings.
              </p>
            </div>
          </div>
          <Toggle 
            active={marketingEmails} 
            onChange={(v) => handleProToggle('marketingEmails', v)} 
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
}
