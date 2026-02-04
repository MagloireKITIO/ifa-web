'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, HelpCircle, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface NavTab {
  label: string;
  href: string;
  key: string;
}

const navigationTabs: NavTab[] = [
  { label: 'Dashboard', href: '/dashboard', key: 'dashboard' },
  { label: 'Rapports', href: '/rapports', key: 'rapports' },
  { label: 'Structure', href: '/structure', key: 'structure' },
  { label: 'Sourcing', href: '/sourcing', key: 'sourcing' },
  { label: 'Membres', href: '/membres', key: 'membres' },
];

export function TopNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        {/* Logo IFA */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-md">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="font-semibold text-foreground hidden sm:block">
            IFA
          </span>
        </Link>

        {/* Navigation Tabs - Desktop */}
        <div className="hidden lg:flex items-center gap-2">
          {navigationTabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                ${
                  isActive(tab.href)
                    ? 'bg-[#0A0A0A] text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
                }
              `}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Right Side - Mobile Menu Button + User Avatar */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>

          {/* User Avatar & Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20">
                <Avatar className="w-9 h-9 border-2 border-white shadow-sm">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                      {user.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                  )}
                </Avatar>
                <span className="text-sm font-medium text-foreground hidden md:block">
                  {user.full_name.split(' ')[0]}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.full_name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profil')}>
                <User className="mr-2 h-4 w-4" />
                Mon Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/parametres')}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/aide')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Aide
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-white">
          <div className="px-4 py-3 space-y-1">
            {navigationTabs.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    isActive(tab.href)
                      ? 'bg-[#0A0A0A] text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
                  }
                `}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
