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
      select: {
        tier: true,
        subscriptions: {
          where: { status: 'active' },
        },
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (user.tier !== 'pro') {
      return new NextResponse('Export is a Pro feature', { status: 403 });
    }

    // Generate CSV
    const fields = ['Name', 'Amount', 'Currency', 'Billing Cycle', 'Next Billing Date', 'Status', 'Description'];
    const rows = user.subscriptions.map(sub => [
      sub.serviceName,
      sub.amount,
      sub.currency,
      sub.billingCycle,
      sub.nextBillingDate ? new Date(sub.nextBillingDate).toISOString().split('T')[0] : '',
      sub.status,
      sub.description || ''
    ]);

    // Simple CSV stringifier
    const csvContent = [
      fields.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="billdrop-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
