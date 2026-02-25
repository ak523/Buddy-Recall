'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/upload', label: 'Upload', icon: '📤' },
  { href: '/decks', label: 'Decks', icon: '📚' },
  { href: '/study', label: 'Study', icon: '🧠' },
  { href: '/analytics', label: 'Analytics', icon: '📊' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b-4 border-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="text-xl font-black tracking-tight">BUDDY RECALL</span>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 font-bold border-2 border-transparent transition-all text-sm ${
                  pathname === item.href
                    ? 'bg-yellow-400 border-black shadow-[2px_2px_0px_black]'
                    : 'hover:bg-yellow-100 hover:border-black hover:shadow-[2px_2px_0px_black]'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
