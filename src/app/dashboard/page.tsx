'use client';

import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Bell, Settings, LogOut, Search, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { StatsBar } from '@/components/StatsBar';
import { SubscriptionCard, Subscription } from '@/components/SubscriptionCard';
import EmailScanner from '@/components/EmailScanner';
import SubscriptionDetailModal from '@/components/SubscriptionDetailModal';
import AddSubscriptionModal from '@/components/AddSubscriptionModal';
import UpgradeBanner from '@/components/UpgradeBanner';
import LimitReachedModal from '@/components/LimitReachedModal';

function getDaysUntil(date: Date | null): number {
  if (!date) return 999;
  const now = new Date();
  const diffTime = new Date(date).getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [savedThisMonth, setSavedThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  
  // Tier-related state
  const [tier, setTier] = useState<string>('free');
  const [trackedCount, setTrackedCount] = useState(0);
  const [freeLimit, setFreeLimit] = useState(10);
  
  // Limit modal state
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [pendingConfirmSub, setPendingConfirmSub] = useState<Subscription | null>(null);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const res = await fetch('/api/subscriptions');
        if (res.ok) {
          const data = await res.json();
          // Use actual data from database, empty if none
          setSubscriptions(data.subscriptions || []);
          
          // Calculate total monthly savings from all cancelled subscriptions
          const cancelled = data.allCancelledMonthly || [];
          const totalSaved = cancelled.reduce((sum: number, sub: { monthlyAmount: number }) => sum + sub.monthlyAmount, 0);
          setSavedThisMonth(totalSaved);
          
          // Set tier info
          setTier(data.tier || 'free');
          setTrackedCount(data.trackedCount || 0);
          setFreeLimit(data.freeLimit || 10);
        } else {
          setSubscriptions([]);
          setSavedThisMonth(0);
        }
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        setSubscriptions([]);
        setSavedThisMonth(0);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchSubscriptions();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-pulse text-[var(--foreground-muted)]">Loading...</div>
      </div>
    );
  }

  if (!session) {
    redirect('/login');
  }

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
  const totalMonthly = activeSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const needsReview = activeSubscriptions.filter(sub => !sub.confirmed).length;
  const upcomingRenewals = activeSubscriptions.filter(sub => getDaysUntil(sub.nextBillingDate) <= 7).length;

  const handleConfirm = async (subscription: Subscription) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subscription.id, confirmed: true }),
      });
      
      if (res.status === 403) {
        // Limit reached - show modal
        const data = await res.json();
        setTrackedCount(data.trackedCount || trackedCount);
        setFreeLimit(data.freeLimit || freeLimit);
        setPendingConfirmSub(subscription);
        setShowLimitModal(true);
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        const wasTracked = data.subscription?.isTracked !== false;
        setSubscriptions(prev => 
          prev.map(s => s.id === subscription.id ? { ...s, confirmed: true, isTracked: wasTracked } : s)
        );
        // Update tracked count from response or increment
        if (data.trackedCount !== undefined) {
          setTrackedCount(data.trackedCount);
        } else if (wasTracked) {
          setTrackedCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error confirming subscription:', error);
    }
  };

  // Confirm subscription without tracking (for users over limit)
  const handleConfirmWithoutTracking = async () => {
    if (!pendingConfirmSub) return;
    
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pendingConfirmSub.id, confirmed: true, isTracked: false }),
      });
      
      if (res.ok) {
        setSubscriptions(prev => 
          prev.map(s => s.id === pendingConfirmSub.id ? { ...s, confirmed: true, isTracked: false } : s)
        );
      }
    } catch (error) {
      console.error('Error confirming subscription without tracking:', error);
    } finally {
      setPendingConfirmSub(null);
    }
  };

  // Mark as "Not a Subscription" - uses 'dismissed' status (doesn't count as savings)
  const handleCancel = async (subscription: Subscription) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subscription.id, status: 'dismissed' }),
      });
      if (res.ok) {
        setSubscriptions(prev => prev.filter(s => s.id !== subscription.id));
      }
    } catch (error) {
      console.error('Error dismissing subscription:', error);
    }
  };

  // Mark a confirmed subscription as cancelled (adds to savings)
  const handleMarkCancelled = async (subscription: Subscription) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subscription.id, status: 'cancelled', confirmed: true, isTracked: false }),
      });
      if (res.ok) {
        // Remove from list and add to savings
        setSubscriptions(prev => prev.filter(s => s.id !== subscription.id));
        setSavedThisMonth(prev => prev + subscription.amount);
        // Decrement tracked count if it was tracked
        if (subscription.isTracked !== false) {
          setTrackedCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error marking subscription as cancelled:', error);
    }
  };

  // Toggle subscription tracking status
  const handleToggleTrack = async (id: string, isTracked: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/subscriptions/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: id, isTracked }),
      });
      
      if (res.status === 403) {
        const data = await res.json();
        return { success: false, error: data.message || 'Tracking limit reached' };
      }
      
      if (res.ok) {
        // Update local state
        setSubscriptions(prev => 
          prev.map(s => s.id === id ? { ...s, isTracked } : s)
        );
        // Update tracked count
        setTrackedCount(prev => isTracked ? prev + 1 : prev - 1);
        // Update selected subscription if it's the one being toggled
        if (selectedSubscription?.id === id) {
          setSelectedSubscription(prev => prev ? { ...prev, isTracked } : null);
        }
        return { success: true };
      }
      
      return { success: false, error: 'Failed to update tracking status' };
    } catch (error) {
      console.error('Error toggling subscription tracking:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const handleScanComplete = () => {
    // Refresh subscriptions and savings after scan completes
    fetch('/api/subscriptions')
      .then(res => res.json())
      .then(data => {
        if (data.subscriptions) {
          setSubscriptions(data.subscriptions);
        }
        if (data.cancelledThisMonth) {
          const totalSaved = data.cancelledThisMonth.reduce((sum: number, sub: { amount: number }) => sum + sub.amount, 0);
          setSavedThisMonth(totalSaved);
        }
      });
  };

  // Add subscription in real-time as scanner finds them
  const handleSubscriptionFound = (newSub: {
    id: string;
    serviceName: string;
    amount: number;
    currency: string;
    billingCycle: string;
    confidence: number | null;
  }) => {
    setSubscriptions(prev => {
      // Avoid duplicates
      if (prev.some(s => s.id === newSub.id)) return prev;
      return [...prev, {
        ...newSub,
        logoUrl: null,
        status: 'active' as const,
        confirmed: false,
        nextBillingDate: null,
      }];
    });
  };

  // Handle click on subscription card to open detail modal
  const handleSubscriptionClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
  };

  // Update subscription via API
  const handleUpdateSubscription = async (id: string, data: Partial<Subscription>) => {
    const res = await fetch(`/api/subscriptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    }
  };

  // Delete subscription via API
  const handleDeleteSubscription = async (id: string) => {
    const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSubscriptions(prev => prev.filter(s => s.id !== id));
    }
  };

  // Add subscription manually
  const handleAddSubscription = async (data: {
    serviceName: string;
    amount: number;
    currency: string;
    billingCycle: string;
    nextBillingDate: string | null;
  }) => {
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const responseData = await res.json();
      const subscription = responseData.subscription;
      const isTracked = responseData.isTracked !== false;
      
      setSubscriptions(prev => [...prev, {
        ...subscription,
        logoUrl: null,
        status: 'active' as const,
        confirmed: true,
        isTracked,
        nextBillingDate: subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : null,
      }]);
      
      // Update tracked count if subscription was tracked
      if (isTracked) {
        setTrackedCount(prev => prev + 1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--background)]/80 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="BillDrop Logo" 
              width={40} 
              height={40} 
              className="rounded-xl"
            />
            <span className="font-semibold text-xl">BillDrop</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-xl hover:bg-black/5 transition-colors">
              <Bell className="w-5 h-5 text-[var(--foreground-muted)]" />
            </button>
            <button className="p-2 rounded-xl hover:bg-black/5 transition-colors">
              <Settings className="w-5 h-5 text-[var(--foreground-muted)]" />
            </button>
            <div className="h-6 w-px bg-black/10"></div>
            <div className="flex items-center gap-3">
              {session.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'} 
                  className="w-9 h-9 rounded-full"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-medium">
                  {session.user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden sm:block">
                <div className="text-sm font-medium">{session.user?.name}</div>
                <div className="text-xs text-[var(--foreground-muted)]">{session.user?.email}</div>
              </div>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 rounded-xl hover:bg-red-50 text-[var(--foreground-muted)] hover:text-red-600 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Welcome back, {session.user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Here&apos;s an overview of your subscriptions
          </p>
        </div>

        {/* Stats Cards - Using StatsBar component */}
        <StatsBar
          totalMonthly={totalMonthly}
          totalSaved={savedThisMonth}
          activeCount={activeSubscriptions.length}
          reviewCount={needsReview}
          upcomingCount={upcomingRenewals}
          trackedCount={trackedCount}
          freeLimit={freeLimit}
          tier={tier}
        />

        {/* Upgrade Banner - Show for free tier users over limit */}
        {tier === 'free' && (
          <UpgradeBanner
            trackedCount={trackedCount}
            freeLimit={freeLimit}
            confirmedCount={activeSubscriptions.filter(s => s.confirmed).length}
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {!showScanner && (
            <button 
              onClick={() => setShowScanner(true)}
              className="btn-primary flex items-center gap-2 text-sm py-3 px-5"
            >
              <Search className="w-4 h-4" />
              Scan Emails
            </button>
          )}
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-secondary flex items-center gap-2 text-sm py-3 px-5"
          >
            <Plus className="w-4 h-4" />
            Add Manually
          </button>
        </div>

        {/* Email Scanner - Inline above subscription list */}
        {showScanner && (
          <EmailScanner
            onScanComplete={handleScanComplete}
            onClose={() => setShowScanner(false)}
            onSubscriptionFound={handleSubscriptionFound}
          />
        )}

        {/* Subscriptions List */}
        <motion.div 
          className="card bg-white overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-6 border-b border-black/5">
            <h2 className="text-lg font-semibold">Your Subscriptions</h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-[var(--foreground-muted)]">
              Loading subscriptions...
            </div>
          ) : activeSubscriptions.length === 0 ? (
            <div className="py-16 px-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-5">
                <Search className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No subscriptions yet</h3>
              <p className="text-sm text-slate-400 mb-6 max-w-xs text-center">
                Scan your connected email to automatically find and track your subscriptions
              </p>
              {!showScanner && (
                <button 
                  onClick={() => setShowScanner(true)}
                  className="btn-primary text-sm py-2.5 px-5"
                >
                  Scan Emails
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {activeSubscriptions.map((sub, index) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  index={index}
                  onClick={handleSubscriptionClick}
                  onConfirm={!sub.confirmed ? handleConfirm : undefined}
                  onCancel={!sub.confirmed ? handleCancel : undefined}
                  onMarkCancelled={sub.confirmed ? handleMarkCancelled : undefined}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Subscription Detail Modal */}
        <SubscriptionDetailModal
          subscription={selectedSubscription}
          isOpen={selectedSubscription !== null}
          onClose={() => setSelectedSubscription(null)}
          onUpdate={handleUpdateSubscription}
          onDelete={handleDeleteSubscription}
          onToggleTrack={handleToggleTrack}
          tier={tier}
          trackedCount={trackedCount}
          freeLimit={freeLimit}
        />

        {/* Add Subscription Modal */}
        <AddSubscriptionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddSubscription}
        />

        {/* Limit Reached Modal */}
        <LimitReachedModal
          isOpen={showLimitModal}
          onClose={() => {
            setShowLimitModal(false);
            setPendingConfirmSub(null);
          }}
          subscriptionName={pendingConfirmSub?.serviceName || ''}
          trackedCount={trackedCount}
          freeLimit={freeLimit}
          onConfirmWithoutTracking={handleConfirmWithoutTracking}
        />
      </main>
    </div>
  );
}
