'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, getStoredUser, clearAuth } from '../../lib/auth';

const NAV_SALES = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/tasks', label: 'Komitmen', icon: '✅' },
  { href: '/activity', label: 'Aktivitas', icon: '⚡' },
  { href: '/weekly', label: 'Mingguan', icon: '📊' },
  { href: '/coaching', label: 'Coaching', icon: '💬' },
];

const NAV_OWNER = [
  { href: '/owner', label: 'Tim Sales', icon: '👥' },
  { href: '/owner/extensions', label: 'Extension', icon: '⏰' },
  { href: '/owner/coaching', label: 'Coaching', icon: '💬' },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setUser(getStoredUser());
  }, [router]);

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = user.role === 'owner' ? NAV_OWNER : NAV_SALES;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">Y</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">YESCARE</span>
          {user.role === 'owner' && (
            <span className="badge-blue ml-1">Owner</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{user.name}</span>
          <Link href="/settings" className="text-gray-400 hover:text-gray-600 text-lg leading-none" title="Pengaturan">
            ⚙️
          </Link>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600 text-xs font-medium"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-10">
        <div className="max-w-lg mx-auto flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-2 px-1 transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className={`text-xs mt-0.5 ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
