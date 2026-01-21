'use client';

import { User, CreditCard, Bell, Shield, Mail, DollarSign } from 'lucide-react';

interface SettingsSidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const SECTIONS = [
  { id: 'connection', label: 'Email Connection', icon: Mail },
  { id: 'billing', label: 'Billing & Subscription', icon: CreditCard },
  { id: 'preferences', label: 'Preferences', icon: DollarSign },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Account', icon: User },
  { id: 'privacy', label: 'Privacy & Data', icon: Shield },
];

export function SettingsSidebar({ activeSection, onNavigate }: SettingsSidebarProps) {
  return (
    <nav className="space-y-1">
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        
        return (
          <button
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              isActive
                ? 'bg-white text-[var(--accent-primary)] shadow-sm'
                : 'text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--foreground-muted)]'}`} />
            {section.label}
          </button>
        );
      })}
    </nav>
  );
}
