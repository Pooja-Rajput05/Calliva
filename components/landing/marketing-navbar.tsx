'use client';

import {
  Home,
  Info,
  Sparkles,
  LayoutDashboard,
  Menu,
  Phone,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { VoxaWordmark } from '@/components/brand/voxa-logo';
import { Button } from '@/components/ui/button';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { InBrowserCallModal } from '@/components/voice/in-browser-call-modal';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon?: any;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'About', href: '/#about', icon: Info },
  { label: 'Features', href: '/#features', icon: Sparkles },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

interface MarketingNavbarProps {
  hydrateScroll?: boolean;
}

export function MarketingNavbar({ hydrateScroll = true }: MarketingNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(!hydrateScroll);
  const pathname = usePathname();

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Scroll -> frosted background
  useEffect(() => {
    if (!hydrateScroll) return;
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hydrateScroll]);

  return (
    <div className="relative">
      <InBrowserCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
      />

      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-black/[0.06] bg-white/80 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/70'
            : 'border-b border-transparent bg-white/40 backdrop-blur-md dark:bg-black/30',
        )}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6"
        >
          {/* Logo */}
          <Link href="/" aria-label="Voxa home" className="flex items-center gap-2">
            <VoxaWordmark size={26} />
          </Link>

          {/* Desktop Navigation Links */}
          <ul className="hidden items-center gap-1 sm:gap-2 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                        : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right CTAs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCallModalOpen(true)}
              className="inline-flex cursor-pointer"
              aria-label="Call the live AI demo in browser"
            >
              <ShimmerButton
                background="#6366F1"
                shimmerColor="#ffffff"
                className="h-9 px-4 rounded-full shadow-md shadow-indigo-500/20"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Phone aria-hidden className="size-3.5 animate-pulse" />
                  Call AI Demo
                </span>
              </ShimmerButton>
            </button>

            {/* Mobile trigger */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-14 z-40 border-b border-black/[0.06] bg-white/95 px-6 py-6 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/95 md:hidden"
          >
            <ul className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    {item.icon && <item.icon className="size-5 text-indigo-500" />}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setIsCallModalOpen(true);
                }}
                className="w-full"
              >
                <ShimmerButton
                  background="#6366F1"
                  shimmerColor="#ffffff"
                  className="w-full h-11 rounded-xl"
                >
                  <span className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white">
                    <Phone className="size-4" />
                    Start Live AI Call Demo
                  </span>
                </ShimmerButton>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
