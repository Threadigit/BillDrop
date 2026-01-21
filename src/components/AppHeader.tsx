'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Settings, LogOut } from 'lucide-react';

export function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--background)]/80 border-b border-black/5">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="BillDrop Logo" 
            width={40} 
            height={40} 
            className="rounded-xl"
          />
          <span className="font-semibold text-xl text-[var(--foreground)]">BillDrop</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-xl hover:bg-black/5 transition-colors">
            <Bell className="w-5 h-5 text-[var(--foreground-muted)]" />
          </button>
          <Link href="/settings" className="p-2 rounded-xl hover:bg-black/5 transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
            <Settings className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-black/10"></div>
          <div className="flex items-center gap-3">
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt={session.user.name || 'User'} 
                className="w-9 h-9 rounded-full"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-medium">
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-[var(--foreground)]">{session?.user?.name}</div>
              <div className="text-xs text-[var(--foreground-muted)]">{session?.user?.email}</div>
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
  );
}
