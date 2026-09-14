'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
        <Link href="/" className="text-xl font-bold">Trip Photo Analyzer</Link>
        <div className="space-x-2">
          <Button asChild variant="ghost">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/settings">Settings</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
