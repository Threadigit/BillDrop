import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Find the user's Google account
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: true },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const googleAccount = user.accounts.find(acc => acc.provider === 'google');

    if (!googleAccount) {
      return new NextResponse('No Google account connected', { status: 400 });
    }

    await prisma.account.delete({
      where: { id: googleAccount.id },
    });

    await prisma.user.update({
      where: { email: session.user.email },
      data: { scanningEnabled: false },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
