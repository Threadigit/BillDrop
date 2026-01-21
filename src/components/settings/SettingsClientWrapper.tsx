'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { EmailConnectionSection } from '@/components/settings/EmailConnectionSection';
import { BillingSection } from '@/components/settings/BillingSection';
import { SubscriptionPrefsSection } from '@/components/settings/SubscriptionPrefsSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { AccountSection } from '@/components/settings/AccountSection';
import { PrivacySection } from '@/components/settings/PrivacySection';

import { AppHeader } from '@/components/AppHeader';
import { UpgradeModal } from '@/components/UpgradeModal';

interface SettingsClientWrapperProps {
  initialData: any; // Type strictly if possible, but 'any' matches current usage
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function SettingsClientWrapper({ initialData }: SettingsClientWrapperProps) {
  const router = useRouter();
  
  const [activeSection, setActiveSection] = useState('connection');
  const [data, setData] = useState<any>(initialData);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Optimistic update handler
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
      // We could revert here, but for now we just log
      // Real implementation might re-fetch or revert state
    }
  };

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-2">Settings</h1>
          <p className="text-[var(--foreground-muted)]">
            Manage your account details and preferences.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar (Desktop sticky) */}
          <motion.div 
            className="lg:w-64 flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="lg:sticky lg:top-8">
              <SettingsSidebar 
                activeSection={activeSection} 
                onNavigate={handleScrollTo} 
              />
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            className="flex-1 min-w-0 space-y-12"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            
            <motion.section id="connection" className="scroll-mt-6" variants={fadeInUp}>
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
                  // Refresh page to get fresh server state
                  router.refresh(); 
                }}
                onReconnect={() => window.location.href = '/api/auth/signin?callbackUrl=/settings'}
              />
            </motion.section>

            <motion.section id="billing" className="scroll-mt-6" variants={fadeInUp}>
              <BillingSection
                isPro={data.profile.tier === 'pro'}
                onUpgrade={() => setShowUpgradeModal(true)}
                onManageSubscription={() => alert('Billing portal not yet integrated')}
              />
            </motion.section>

            <motion.section id="preferences" className="scroll-mt-6" variants={fadeInUp}>
              <SubscriptionPrefsSection
                currency={data.settings.currency}
                onChangeCurrency={(val) => updateSettings('settings', { currency: val })}
              />
            </motion.section>

            <motion.section id="notifications" className="scroll-mt-6" variants={fadeInUp}>
              <NotificationsSection
                renewalAlerts={data.notifications.renewalAlerts}
                priceChangeAlerts={data.notifications.priceChangeAlerts}
                marketingEmails={data.notifications.marketingEmails}
                isPro={data.profile.tier === 'pro'}
                onUpdate={(key, val) => updateSettings('notifications', { [key]: val })}
                onUpgrade={() => setShowUpgradeModal(true)}
              />
            </motion.section>

            <motion.section id="account" className="scroll-mt-6" variants={fadeInUp}>
              <AccountSection
                name={data.profile.name || ''}
                email={data.profile.email || ''}
                timezone={data.settings.timezone || data.profile.timezone} // Handle fallback if API struct changes
                onUpdateProfile={(val) => updateSettings('profile', val)}
                onDeleteAccount={async () => {
                  try {
                    await fetch('/api/settings/account', { method: 'DELETE' });
                    window.location.href = '/';
                  } catch (e) {
                    console.error('Delete failed', e);
                  }
                }}
              />
            </motion.section>

            <motion.section id="privacy" className="scroll-mt-6" variants={fadeInUp}>
              <PrivacySection
                isPro={data.profile.tier === 'pro'}
                onExportData={() => window.open('/api/settings/export', '_blank')}
                onDeleteData={async () => {
                  await fetch('/api/settings/data', { method: 'DELETE' });
                  router.refresh();
                }}
                onUpgrade={() => setShowUpgradeModal(true)}
              />
            </motion.section>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
