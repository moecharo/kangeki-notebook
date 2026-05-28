'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const path = usePathname();

  return (
    <nav className="nav-bar">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span style={{ fontSize: '1.3rem' }}>📔</span>
          <span style={{ fontWeight: 600, color: 'var(--dark-brown)', fontSize: '1rem', letterSpacing: '0.05em' }}>
            観劇手帳
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1 rounded text-sm no-underline transition-colors"
            style={{
              color: path === '/' ? 'var(--dark-brown)' : 'var(--text-muted)',
              fontWeight: path === '/' ? 600 : 400,
              background: path === '/' ? 'rgba(192,98,74,0.12)' : 'transparent',
            }}
          >
            手帳
          </Link>
          <Link
            href="/summary"
            className="px-3 py-1 rounded text-sm no-underline transition-colors"
            style={{
              color: path === '/summary' ? 'var(--dark-brown)' : 'var(--text-muted)',
              fontWeight: path === '/summary' ? 600 : 400,
              background: path === '/summary' ? 'rgba(192,98,74,0.12)' : 'transparent',
            }}
          >
            サマリー
          </Link>
          <Link
            href="/settings"
            className="px-3 py-1 rounded text-sm no-underline transition-colors"
            style={{
              color: path === '/settings' ? 'var(--dark-brown)' : 'var(--text-muted)',
              fontWeight: path === '/settings' ? 600 : 400,
              background: path === '/settings' ? 'rgba(192,98,74,0.12)' : 'transparent',
            }}
            title="設定"
          >
            ⚙️
          </Link>
        </div>
      </div>
    </nav>
  );
}
