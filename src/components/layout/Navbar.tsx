'use client';
import Link from 'next/link';

const navLinkClasses =
  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors';

export function Navbar() {
  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-6">
        <Link href="/" className="text-xl font-bold">
          Trip Photo Analyzer
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/" className={navLinkClasses}>
            Home
          </Link>
          <Link href="/dashboard" className={navLinkClasses}>
            Dashboard
          </Link>
          <Link href="/activity" className={navLinkClasses}>
            Activity
          </Link>
          <Link href="/settings" className={navLinkClasses}>
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}
