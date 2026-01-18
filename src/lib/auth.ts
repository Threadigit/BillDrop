import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper to get session on the server side
export async function getSession() {
  return await getServerSession(authOptions);
}

// Re-export authOptions for convenience
export { authOptions };
