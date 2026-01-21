'use client';

import { User, Globe, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface AccountSectionProps {
  name: string;
  email: string;
  timezone: string;
  onUpdateProfile: (data: { name?: string; timezone?: string }) => void;
  onDeleteAccount: () => void;
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
];

export function AccountSection({
  name,
  email,
  timezone,
  onUpdateProfile,
  onDeleteAccount
}: AccountSectionProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localName, setLocalName] = useState(name);
  const [localTimezone, setLocalTimezone] = useState(timezone);

  const handleSave = () => {
    onUpdateProfile({ name: localName, timezone: localTimezone });
  };

  return (
    <div className="card mb-6">
      <div className="p-6 border-b border-black/5 bg-[var(--background-secondary)]/50">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-[var(--foreground)]">
          <User className="w-5 h-5 text-[var(--foreground-muted)]" />
          Account Settings
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={localName || ''}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleSave}
              className="w-full bg-white border border-black/10 text-[var(--foreground)] text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-[var(--background-secondary)] border border-black/5 text-[var(--foreground-muted)] text-sm rounded-xl px-4 py-2.5 cursor-not-allowed"
            />
            <p className="text-[10px] text-[var(--foreground-subtle)] mt-1">
              Email cannot be changed as it&apos;s linked to your login.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
            Timezone
          </label>
          <div className="relative max-w-md">
            <select
              value={localTimezone}
              onChange={(e) => {
                setLocalTimezone(e.target.value);
                onUpdateProfile({ timezone: e.target.value });
              }}
              className="appearance-none w-full bg-white border border-black/10 text-[var(--foreground)] text-sm rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)] pointer-events-none" />
          </div>
          <p className="text-xs text-[var(--foreground-subtle)] mt-2">
            Used for accurate billing alerts and renewal notifications.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-black/5 pt-6 mt-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-sm text-red-600 flex items-center gap-2">
                 Delete Account
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] mt-1 max-w-xs">
                Permanently delete your account and all data. This cannot be undone.
              </p>
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-secondary text-xs text-red-600 hover:bg-red-50 border-red-100"
              >
                Delete My Account
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 bg-red-50 p-2 rounded-xl"
              >
                <span className="text-xs font-medium text-red-800">Are you sure?</span>
                <button
                  onClick={onDeleteAccount}
                  className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-700"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-slate-500 text-xs hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
