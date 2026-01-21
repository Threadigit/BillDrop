'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { EmailConnectionSection } from '@/components/settings/EmailConnectionSection';
import { BillingSection } from '@/components/settings/BillingSection';
import { SubscriptionPrefsSection } from '@/components/settings/SubscriptionPrefsSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { AccountSection } from '@/components/settings/AccountSection';
import { PrivacySection } from '@/components/settings/PrivacySection';

import { AppHeader } from '@/components/AppHeader';
import { UpgradeModal } from '@/components/UpgradeModal';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('connection');
  const [data, setData] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const text = await res.text();
        setError(`Failed to load settings: ${res.status} ${text}`);
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred while loading settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (section: string, updates: any) => {
    // Optimistic update
    setData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));

    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [section]: updates })
      });
    } catch (err) {
      console.error(err);
      fetchSettings(); // Revert on error
    }
  };

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (error) {
     return (
       <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
         <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 max-w-md w-full text-center">
           <h3 className="font-bold mb-2">Error Loading Settings</h3>
           <p className="text-sm mb-4">{error}</p>
           <button 
             onClick={() => window.location.reload()}
             className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
           >
             Retry
           </button>
         </div>
       </div>
     );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AppHeader />
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
      
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2">Settings</h1>
          <p className="text-[var(--foreground-muted)]">
            Manage your account details and preferences.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar (Desktop sticky) */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-8">
              <SettingsSidebar 
                activeSection={activeSection} 
                onNavigate={handleScrollTo} 
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-12">
            
            <section id="connection" className="scroll-mt-6">
              <EmailConnectionSection
                isConnected={data.connection.isConnected}
                email={data.profile.email} 
                scanningEnabled={data.settings.scanningEnabled}
                lastScannedAt={data.settings.lastScannedAt}
                onToggleScanning={async (val) => updateSettings('settings', { scanningEnabled: val })}
                onRevoke={async () => {
                  const res = await fetch('/api/settings/connection', { method: 'DELETE' });
                  if (!res.ok) {
                    alert('Could not revoke access (or already disconnected). Please reconnect your email.');
                  }
                  await fetchSettings();
                }}
                onReconnect={() => window.location.href = '/api/auth/signin?callbackUrl=/settings'}
              />
            </section>

            <section id="billing" className="scroll-mt-6">
              <BillingSection
                isPro={data.profile.tier === 'pro'}
                onUpgrade={() => setShowUpgradeModal(true)}
                onManageSubscription={() => alert('Billing portal not yet integrated')}
              />
            </section>

            <section id="preferences" className="scroll-mt-6">
              <SubscriptionPrefsSection
                currency={data.settings.currency}
                onChangeCurrency={(val) => updateSettings('settings', { currency: val })}
              />
            </section>

            <section id="notifications" className="scroll-mt-6">
              <NotificationsSection
                renewalAlerts={data.notifications.renewalAlerts}
                priceChangeAlerts={data.notifications.priceChangeAlerts}
                marketingEmails={data.notifications.marketingEmails}
                isPro={data.profile.tier === 'pro'}
                onUpdate={(key, val) => updateSettings('notifications', { [key]: val })}
                onUpgrade={() => setShowUpgradeModal(true)}
              />
            </section>

            <section id="account" className="scroll-mt-6">
              <AccountSection
                name={data.profile.name || ''}
                email={data.profile.email || ''}
                timezone={data.settings.timezone}
                onUpdateProfile={(val) => updateSettings('profile', val)}
                onDeleteAccount={async () => {
                  await fetch('/api/settings/account', { method: 'DELETE' });
                  window.location.href = '/';
                }}
              />
            </section>

            <section id="privacy" className="scroll-mt-6">
              <PrivacySection
                isPro={data.profile.tier === 'pro'}
                onExportData={() => window.open('/api/settings/export', '_blank')}
                onDeleteData={async () => {
                  await fetch('/api/settings/data', { method: 'DELETE' });
                  await fetchSettings();
                }}
                onUpgrade={() => setShowUpgradeModal(true)}
              />
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
