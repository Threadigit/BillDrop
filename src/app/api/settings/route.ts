import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
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
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if Google account is connected
    const googleAccount = user.accounts.find(acc => acc.provider === 'google');
    const isGoogleConnected = !!googleAccount;

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const json = await req.json();
    const { settings, notifications, profile } = json;

    const updateData: any = {};

    if (settings) {
      if (settings.timezone !== undefined) updateData.timezone = settings.timezone;
      if (settings.currency !== undefined) updateData.currency = settings.currency;
      if (settings.scanningEnabled !== undefined) updateData.scanningEnabled = settings.scanningEnabled;
    }

    if (notifications) {
      if (notifications.renewalAlerts !== undefined) updateData.renewalAlerts = notifications.renewalAlerts;
      if (notifications.priceChangeAlerts !== undefined) updateData.priceChangeAlerts = notifications.priceChangeAlerts;
      if (notifications.marketingEmails !== undefined) updateData.marketingEmails = notifications.marketingEmails;
    }
    
    if (profile && profile.name !== undefined) {
      updateData.name = profile.name;
    }

    if (json.intent && json.intent.proPlanSubscriptionIntent !== undefined) {
      updateData.proPlanSubscriptionIntent = json.intent.proPlanSubscriptionIntent;
    }
    
    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'No changes' });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
