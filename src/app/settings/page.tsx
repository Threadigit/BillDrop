import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SettingsClientWrapper } from '@/components/settings/SettingsClientWrapper';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Settings - BillDrop',
  description: 'Manage your account settings',
};

async function getSettingsData() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      accounts: {
        select: {
          provider: true,
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  // Check if Google account is connected
  const googleAccount = user.accounts.find(acc => acc.provider === 'google');
  const isGoogleConnected = !!googleAccount;

  return {
    profile: {
      name: user.name,
      email: user.email,
      image: user.image,
      tier: user.tier,
    },
    settings: {
      timezone: user.timezone,
      currency: user.currency,
      scanningEnabled: user.scanningEnabled,
      lastScannedAt: user.lastScannedAt,
    },
    notifications: {
      renewalAlerts: user.renewalAlerts,
      priceChangeAlerts: user.priceChangeAlerts,
      marketingEmails: user.marketingEmails,
    },
    connection: {
      isConnected: isGoogleConnected,
      connectedAt: null, 
      provider: 'google',
    }
  };
}

export default async function SettingsPage() {
  const settingsData = await getSettingsData();

  if (!settingsData) {
    redirect('/login');
  }

  return <SettingsClientWrapper initialData={settingsData} />;
}
