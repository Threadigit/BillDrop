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

// Mock subscription data for when database is empty or loading
const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    serviceName: 'Netflix',
    amount: 15.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: new Date('2026-01-23'),
    logoUrl: null,
    status: 'active',
    confirmed: true,
  },
  {
    id: '2',
    serviceName: 'Spotify',
    amount: 9.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: new Date('2026-01-28'),
    logoUrl: null,
    status: 'active',
    confirmed: true,
  },
  {
    id: '3',
    serviceName: 'Adobe Creative Cloud',
    amount: 54.99,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: new Date('2026-02-01'),
    logoUrl: null,
    status: 'active',
    confirmed: false,
  },
  {
    id: '4',
    serviceName: 'ChatGPT Plus',
    amount: 20.00,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: new Date('2026-02-05'),
    logoUrl: null,
    status: 'active',
    confirmed: true,
  },
  {
    id: '5',
    serviceName: 'Gym Membership',
    amount: 45.00,
    currency: 'USD',
    billingCycle: 'monthly',
    nextBillingDate: new Date('2026-02-10'),
    logoUrl: null,
    status: 'active',
    confirmed: false,
  },
];

function getDaysUntil(date: Date | null): number {
  if (!date) return 999;
  const now = new Date();
  const diffTime = new Date(date).getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const res = await fetch('/api/subscriptions');
        if (res.ok) {
          const data = await res.json();
          // Use actual data from database, empty if none
          setSubscriptions(data.subscriptions || []);
        } else {
          setSubscriptions([]);
        }
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        setSubscriptions([]);
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
      if (res.ok) {
        setSubscriptions(prev => 
          prev.map(s => s.id === subscription.id ? { ...s, confirmed: true } : s)
        );
      }
    } catch (error) {
      console.error('Error confirming subscription:', error);
    }
  };

  const handleCancel = async (subscription: Subscription) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subscription.id, status: 'cancelled' }),
      });
      if (res.ok) {
        setSubscriptions(prev => prev.filter(s => s.id !== subscription.id));
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  const handleScanComplete = () => {
    // Refresh subscriptions after scan completes
    fetch('/api/subscriptions')
      .then(res => res.json())
      .then(data => {
        if (data.subscriptions) {
          setSubscriptions(data.subscriptions);
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
          totalSaved={45.00}
          activeCount={activeSubscriptions.length}
          reviewCount={needsReview}
          upcomingCount={upcomingRenewals}
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button 
            onClick={() => setShowScanner(true)}
            className="btn-primary flex items-center gap-2 text-sm py-3 px-5"
          >
            <Search className="w-4 h-4" />
            Scan Emails
          </button>
          <button className="btn-secondary flex items-center gap-2 text-sm py-3 px-5">
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
            <div className="p-12 text-center">
              <p className="text-[var(--foreground-muted)] mb-4">No subscriptions found yet.</p>
              <button className="btn-primary text-sm py-2 px-4">
                Scan your emails to find subscriptions
              </button>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {activeSubscriptions.map((sub, index) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  index={index}
                  onConfirm={!sub.confirmed ? handleConfirm : undefined}
                  onCancel={!sub.confirmed ? handleCancel : undefined}
                />
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
