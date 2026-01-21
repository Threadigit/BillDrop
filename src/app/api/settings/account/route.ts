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
    // Delete the user record
    // Cascade delete should handle accounts, sessions, subscriptions
    await prisma.user.delete({
      where: { email: session.user.email },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
