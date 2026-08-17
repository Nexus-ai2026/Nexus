import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Terminal,
  Sparkles,
  Menu,
  X,
  User as UserIcon,
  LogIn,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { NexusLogo } from './NexusLogo';

interface NavbarProps {
  accentTheme: any;
  setAccentTheme: (theme: any) => void;
  onOpenTerminal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTerminal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navLinks = [
    { label: 'Overview', href: '#overview' },
    { label: 'Data', href: '#datasource' },
    { label: 'Visualize', href: '#visualizations' },
    { label: 'Features', href: '#features' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-black/85 backdrop-blur-xl border-b border-white/10 font-mono">

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">

          {/* Logo */}
          <Link
            to="/"
            className="group shrink-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <NexusLogo
              variant="full"
              size="md"
              subtitle="UNDERSTANDS YOUR DATA"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] border border-white/[0.07] rounded-full p-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="
                  px-4 py-2
                  text-xs font-medium
                  text-zinc-400
                  hover:text-white
                  hover:bg-white/[0.06]
                  rounded-full
                  transition-all
                "
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">

            {/* Terminal */}
            <button
              onClick={onOpenTerminal}
              className="
                flex items-center gap-2
                px-3 py-2
                text-xs
                text-zinc-400
                bg-white/[0.03]
                border border-white/[0.08]
                hover:border-emerald-400/40
                hover:text-emerald-400
                rounded-xl
                transition-all
              "
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Terminal</span>
              <span className="text-[9px] text-zinc-600">
                ⌘K
              </span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">

                {/* Dashboard */}
                <Link
                  to="/dashboard"
                  className="
                    flex items-center gap-2
                    px-4 py-2
                    text-xs font-semibold
                    text-white
                    bg-white/[0.05]
                    hover:bg-white/[0.09]
                    border border-white/10
                    hover:border-emerald-400/40
                    rounded-xl
                    transition-all
                  "
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dashboard</span>
                </Link>

                {/* User */}
                <div
                  className="
                    flex items-center gap-2
                    px-3 py-2
                    bg-white/[0.03]
                    border border-white/[0.08]
                    rounded-xl
                    text-xs
                  "
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />

                  <span
                    className="text-zinc-300 max-w-[110px] truncate"
                    title={user.email || ''}
                  >
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>

                {/* Logout */}
                <button
                  onClick={() => logout()}
                  title="Logout"
                  className="
                    p-2
                    text-zinc-500
                    hover:text-red-400
                    bg-white/[0.03]
                    border border-white/[0.08]
                    hover:border-red-400/30
                    rounded-xl
                    transition-all
                  "
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">

                {/* Login */}
                <Link
                  to="/login"
                  className="
                    flex items-center gap-1.5
                    px-3 py-2
                    text-xs font-semibold
                    text-zinc-300
                    hover:text-white
                    bg-white/[0.03]
                    border border-white/[0.08]
                    hover:border-white/20
                    rounded-xl
                    transition-all
                  "
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log in</span>
                </Link>

                {/* Sign Up */}
                <Link
                  to="/signup"
                  className="
                    flex items-center gap-1.5
                    px-4 py-2
                    text-xs font-bold
                    text-black
                    bg-emerald-400
                    hover:bg-emerald-300
                    rounded-xl
                    shadow-[0_0_20px_rgba(52,211,153,0.2)]
                    hover:shadow-[0_0_28px_rgba(52,211,153,0.35)]
                    transition-all
                  "
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Free</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="
              lg:hidden
              p-2.5
              text-zinc-400
              hover:text-white
              bg-white/[0.04]
              border border-white/[0.08]
              hover:border-emerald-400/40
              rounded-xl
              transition-all
            "
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/[0.07] bg-zinc-950/95 backdrop-blur-xl">

          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">

            {/* Navigation */}
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="
                    px-4 py-3
                    text-xs font-medium
                    text-zinc-400
                    hover:text-white
                    bg-white/[0.03]
                    hover:bg-white/[0.06]
                    border border-white/[0.06]
                    rounded-xl
                    transition-all
                  "
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* User Actions */}
            {user ? (
              <div className="space-y-2">

                <div
                  className="
                    flex items-center gap-2
                    px-3 py-3
                    bg-white/[0.03]
                    border border-white/[0.07]
                    rounded-xl
                    text-xs
                  "
                >
                  <UserIcon className="w-4 h-4 text-emerald-400" />

                  <span className="text-zinc-300 truncate">
                    {user.displayName || user.email}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">

                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="
                      flex items-center justify-center gap-2
                      py-3
                      text-xs font-bold
                      text-black
                      bg-emerald-400
                      hover:bg-emerald-300
                      rounded-xl
                    "
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="
                      flex items-center justify-center gap-2
                      py-3
                      text-xs font-bold
                      text-red-400
                      bg-red-950/30
                      border border-red-900/40
                      rounded-xl
                    "
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">

                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="
                    flex items-center justify-center gap-2
                    py-3
                    text-xs font-semibold
                    text-zinc-300
                    bg-white/[0.03]
                    border border-white/[0.08]
                    rounded-xl
                  "
                >
                  <LogIn className="w-4 h-4" />
                  Log in
                </Link>

                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="
                    flex items-center justify-center gap-2
                    py-3
                    text-xs font-bold
                    text-black
                    bg-emerald-400
                    rounded-xl
                  "
                >
                  <Sparkles className="w-4 h-4" />
                  Start Free
                </Link>
              </div>
            )}

            {/* Terminal */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTerminal();
              }}
              className="
                w-full
                flex items-center justify-center gap-2
                py-3
                text-xs font-medium
                text-emerald-400
                bg-emerald-950/20
                border border-emerald-500/20
                hover:border-emerald-400/40
                rounded-xl
                transition-all
              "
            >
              <Terminal className="w-4 h-4" />
              Open Interactive Terminal
            </button>

          </div>
        </div>
      )}
    </header>
  );
};
