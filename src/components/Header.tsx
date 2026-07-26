'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Icon from '@/components/ui/AppIcon';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useAdminMode } from '@/lib/admin-mode-context';
import { getInitial } from '@/lib/auth-validation';
import { useLiveProductSearch } from '@/lib/use-live-product-search';
import SearchResultsDropdown from '@/components/SearchResultsDropdown';
import ErrorBoundary from '@/components/ErrorBoundary';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'New Arrivals', href: '/shop?filter=new' },
  { label: 'Best Sellers', href: '/shop?filter=bestseller' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

// Matches navLinks length — staggers each link's entrance when the mobile menu opens.
const navLinkDelays = [
  'delay-100',
  'delay-200',
  'delay-300',
  'delay-400',
  'delay-500',
  'delay-600',
];

export default function Header() {
  return (
    <ErrorBoundary fallback={<HeaderFallback />}>
      <Suspense fallback={<HeaderFallback />}>
        <HeaderContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function HeaderFallback() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b py-4 px-4 text-center"
      style={{ background: 'var(--blush-bg)', borderColor: 'var(--blush-border)' }}
    >
      <Link href="/" className="font-script text-2xl" style={{ color: 'var(--blush-text)' }}>
        Charm Avenue
      </Link>
    </header>
  );
}

function HeaderContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const { itemCount } = useCart();
  const { isAdmin, user } = useAdminMode();
  const accountInitial = user ? getInitial(user.user_metadata?.name || user.email || '') : null;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const desktopSearch = useLiveProductSearch(searchQuery);
  const mobileSearch = useLiveProductSearch(mobileSearchQuery);

  function submitSearch(e: React.FormEvent, query: string) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    closeSearch();
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery('');
    setMobileSearchQuery('');
    setMenuOpen(false);
  }

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isLinkActive = (href: string) => {
    const [base, query] = href.split('?');
    if (base === '/') return pathname === '/';
    if (!pathname.startsWith(base)) return false;

    const linkFilter = new URLSearchParams(query ?? '').get('filter');
    return linkFilter === searchParams.get('filter');
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ background: 'var(--blush-bg)', borderColor: 'var(--blush-border)' }}
      >
        <div className="relative max-w-screen-2xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          {/* Left: nav (desktop) / hamburger (mobile) */}
          <div className="flex items-center">
            <nav className="hidden xl:flex items-center gap-4 2xl:gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="whitespace-nowrap text-[0.6875rem] lg:text-xs font-semibold uppercase tracking-wide transition-colors hover:opacity-80"
                  style={{
                    color: isLinkActive(link.href) ? 'var(--blush-rose)' : 'var(--blush-text)',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <button
              className="xl:hidden w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--blush-border)', color: 'var(--blush-text)' }}
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Icon name="Bars3Icon" size={20} />
            </button>
          </div>

          {/* Center: script logo — absolutely centered regardless of nav/icon widths */}
          <Link
            href="/"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center leading-none whitespace-nowrap"
          >
            <span
              className="font-script text-2xl sm:text-3xl md:text-4xl inline-flex items-center gap-1"
              style={{ color: 'var(--blush-text)' }}
            >
              Charm Avenue
              <Icon name="HeartIcon" size={14} style={{ color: 'var(--blush-rose)' }} />
            </span>
            <span
              className="text-[0.5625rem] sm:text-[0.625rem] font-semibold tracking-[0.35em] uppercase mt-1 flex items-center gap-2"
              style={{ color: 'var(--blush-muted)' }}
            >
              <span className="w-3 h-px" style={{ background: 'var(--blush-muted)' }} />
              By Nandini
              <span className="w-3 h-px" style={{ background: 'var(--blush-muted)' }} />
            </span>
          </Link>

          {/* Right: icons */}
          <div className="flex items-center gap-3 sm:gap-4 xl:mr-16 2xl:mr-24">
            {searchOpen ? (
              <div className="hidden sm:block relative">
                <form
                  onSubmit={(e) => submitSearch(e, searchQuery)}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery.trim()) setSearchOpen(false);
                    }}
                    placeholder="Search products…"
                    className="w-40 lg:w-56 rounded-full px-4 py-1.5 text-sm border focus:outline-none"
                    style={{ borderColor: 'var(--blush-border)', color: 'var(--blush-text)' }}
                  />
                  <button
                    type="submit"
                    aria-label="Search"
                    className="w-9 h-9 flex items-center justify-center transition-opacity hover:opacity-70"
                    style={{ color: 'var(--blush-text)' }}
                  >
                    <Icon name="MagnifyingGlassIcon" size={19} />
                  </button>
                </form>
                {searchQuery.trim() && (
                  <div className="absolute top-full right-0 mt-2 w-72 z-50">
                    <SearchResultsDropdown
                      query={searchQuery.trim()}
                      results={desktopSearch.results}
                      loading={desktopSearch.loading}
                      onNavigate={closeSearch}
                    />
                  </div>
                )}
              </div>
            ) : (
              <button
                className="hidden sm:flex w-9 h-9 items-center justify-center transition-opacity hover:opacity-70"
                style={{ color: 'var(--blush-text)' }}
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <Icon name="MagnifyingGlassIcon" size={19} />
              </button>
            )}
            {isAdmin && (
              <Link
                href="/admin/products"
                aria-label="Admin Dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3.5 py-2 rounded-full transition-colors duration-150 hover:opacity-80"
                style={{ background: 'var(--blush-border)', color: 'var(--blush-text)' }}
              >
                <Icon name="Squares2X2Icon" size={14} />
                Admin
              </Link>
            )}
            {accountInitial ? (
              <Link
                href="/account"
                aria-label="My Account"
                className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full text-xs font-bold text-white transition-opacity hover:opacity-80"
                style={{ background: 'var(--blush-rose-button)' }}
              >
                {accountInitial}
              </Link>
            ) : (
              <Link
                href="/login"
                aria-label="Sign in"
                className="hidden sm:flex w-9 h-9 items-center justify-center transition-opacity hover:opacity-70"
                style={{ color: 'var(--blush-text)' }}
              >
                <Icon name="UserIcon" size={19} />
              </Link>
            )}
            <Link
              href="/cart"
              aria-label="View cart"
              className="relative w-9 h-9 flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ color: 'var(--blush-text)' }}
            >
              <Icon name="ShoppingBagIcon" size={19} />
              <span
                className="absolute -top-1 -right-1 min-w-[1rem] h-[1rem] px-1 rounded-full text-white text-[0.5625rem] font-bold flex items-center justify-center"
                style={{ background: 'var(--blush-rose-button)' }}
              >
                {itemCount}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[100] flex flex-col p-6 transition-all duration-300 ease-out ${
          menuOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ background: 'var(--blush-bg)' }}
        aria-hidden={!menuOpen}
      >
        {menuOpen && (
          <>
            <div className="flex items-center justify-between mb-8 animate-enter">
              <span
                className="font-script text-2xl inline-flex items-center gap-1"
                style={{ color: 'var(--blush-text)' }}
              >
                Charm Avenue
                <Icon name="HeartIcon" size={12} style={{ color: 'var(--blush-rose)' }} />
              </span>
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'var(--blush-border)', color: 'var(--blush-text)' }}
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>

            <div className="mb-6 animate-enter">
              <form
                onSubmit={(e) => submitSearch(e, mobileSearchQuery)}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  placeholder="Search products…"
                  className="flex-1 rounded-full px-4 py-2.5 text-sm border focus:outline-none"
                  style={{ borderColor: 'var(--blush-border)', color: 'var(--blush-text)' }}
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--blush-border)', color: 'var(--blush-text)' }}
                >
                  <Icon name="MagnifyingGlassIcon" size={18} />
                </button>
              </form>
              {mobileSearchQuery.trim() && (
                <div className="mt-2">
                  <SearchResultsDropdown
                    query={mobileSearchQuery.trim()}
                    results={mobileSearch.results}
                    loading={mobileSearch.loading}
                    onNavigate={closeSearch}
                  />
                </div>
              )}
            </div>

            <nav className="flex flex-col gap-4 flex-1 overflow-y-auto">
              {navLinks.map((link, i) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`font-elegant-serif text-2xl transition-colors animate-enter ${navLinkDelays[i]}`}
                  style={{
                    color: isLinkActive(link.href) ? 'var(--blush-rose)' : 'var(--blush-text)',
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4 mb-6 animate-enter delay-700">
              <Link
                href={accountInitial ? '/account' : '/login'}
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: 'var(--blush-text)' }}
                onClick={() => setMenuOpen(false)}
              >
                <Icon name="UserIcon" size={18} /> Account
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/products"
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: 'var(--blush-text)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon name="Squares2X2Icon" size={18} /> Admin Dashboard
                </Link>
              )}
            </div>

            <Link
              href="/shop"
              className="w-full text-white py-4 rounded-full font-semibold text-base uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 animate-enter delay-800"
              style={{ background: 'var(--blush-rose-button)' }}
              onClick={() => setMenuOpen(false)}
            >
              Shop Now
              <Icon name="ArrowRightIcon" size={18} />
            </Link>
          </>
        )}
      </div>
    </>
  );
}
