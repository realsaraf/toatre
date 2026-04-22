import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import PlottoMark from '@/components/plotto-mark';
import { supabaseServer } from '@/lib/supabase/server';
import SignOutButton from './sign-out-button';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  return (
    <div className="min-h-screen bg-paper-50 text-ink-900">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-paper-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/timeline" className="flex items-center gap-3">
            <PlottoMark className="h-8 w-8 shrink-0" />
            <span className="text-lg font-semibold tracking-tight">Plotto</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/timeline"
              className="rounded-lg px-3 py-1.5 font-medium text-ink-700 hover:bg-white hover:text-ink-900"
            >
              Timeline
            </Link>
            <Link
              href="/settings"
              className="rounded-lg px-3 py-1.5 font-medium text-ink-700 hover:bg-white hover:text-ink-900"
            >
              Settings
            </Link>
            <Link
              href="/capture"
              className="rounded-lg bg-ink-900 px-3 py-1.5 font-medium text-white hover:bg-ink-800"
            >
              + Capture
            </Link>
            <span className="ml-2 hidden text-xs text-ink-500 sm:inline">
              {user.email}
            </span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-6">{children}</div>
    </div>
  );
}
