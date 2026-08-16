import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AccentTheme } from '../types';
import { THEME_CONFIGS } from '../lib/theme';
import { Activity, Terminal, ShieldAlert, Cpu, Sparkles, Menu, X, User as UserIcon, LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { NexusLogo } from './NexusLogo';

interface NavbarProps {
  accentTheme: AccentTheme;
  setAccentTheme: (theme: AccentTheme) => void;
  onOpenTerminal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  accentTheme,
  setAccentTheme,
  onOpenTerminal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const currentTheme = THEME_CONFIGS[accentTheme];

  const navLinks = [
    { label: 'Overview', href: '#overview' },
    { label: 'Data Source', href: '#datasource' },
    { label: 'Live Visualizations', href: '#visualizations' },
    { label: 'Visual Studio', href: '#sandbox' },
    { label: 'Bento Features', href: '#features' },
    { label: 'Benchmarks', href: '#benchmarks' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-black/80 border-b border-emerald-950/60 transition-colors font-mono">
      {/* Top Status Bar */}
      <div className="hidden md:flex items-center justify-between px-6 py-1 bg-zinc-950/90 border-b border-emerald-900/20 text-[11px] font-mono tracking-wider text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            SYSTEM NOMINAL // CLUSTER US-EAST-1 ACTIVE
          </span>
          <span className="text-zinc-600">|</span>
          <span className="flex items-center gap-1 text-zinc-300">
            <Activity className="w-3 h-3 text-emerald-400" /> 4.2M EVENTS/SEC
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-300">LATENCY: 0.38ms</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-500">ACCENT PALETTE:</span>
          <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-full border border-zinc-800">
            {(Object.keys(THEME_CONFIGS) as AccentTheme[]).map((themeKey) => {
              const cfg = THEME_CONFIGS[themeKey];
              const isActive = accentTheme === themeKey;
              return (
                <button
                  key={themeKey}
                  onClick={() => setAccentTheme(themeKey)}
                  title={cfg.name}
                  className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                    isActive ? 'scale-125 ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: cfg.primaryHex }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="group">
            <NexusLogo variant="full" size="md" subtitle="Data Topology Engine" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-zinc-950/60 p-1.5 rounded-full border border-emerald-950/40">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-1.5 text-xs font-medium text-zinc-300 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-full transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions & Auth */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={onOpenTerminal}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-zinc-300 bg-zinc-900/90 border border-emerald-500/30 hover:border-emerald-400 hover:text-emerald-400 rounded-lg transition-all cursor-pointer shadow-[0_0_10px_rgba(0,255,102,0.05)]"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>TERMINAL</span>
              <span className="px-1 py-0.2 bg-emerald-950 text-emerald-400 text-[9px] rounded border border-emerald-800">
                ⌘K
              </span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-[0_0_15px_rgba(0,255,102,0.3)] cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>DASHBOARD</span>
                </Link>

                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg text-xs">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-200 max-w-[100px] truncate text-[11px]" title={user.email || ''}>
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>

                <button
                  onClick={() => logout()}
                  title="Logout"
                  className="p-1.5 text-zinc-400 hover:text-red-400 bg-zinc-900 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-emerald-400 bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/40 rounded-lg transition-all flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                  <span>LOG IN</span>
                </Link>

                <Link
                  to="/signup"
                  className="relative inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:shadow-[0_0_30px_rgba(0,255,102,0.6)] cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  <span>SIGN UP</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-zinc-400 hover:text-emerald-400 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-zinc-950 border-b border-emerald-900/40 px-4 pt-2 pb-6 space-y-3 font-mono">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-zinc-800">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-medium text-zinc-300 hover:text-emerald-400 hover:bg-zinc-900 rounded-lg"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800 text-xs">
                  <span className="text-zinc-400">Authenticated:</span>
                  <span className="text-emerald-400 font-bold">{user.displayName || user.email}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-black bg-emerald-400 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4" /> DASHBOARD
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-red-400 bg-red-950/40 border border-red-900/60 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" /> LOG OUT
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-emerald-400 bg-zinc-900 border border-emerald-500/40 rounded-lg"
                >
                  <LogIn className="w-4 h-4" /> LOG IN
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-black bg-emerald-400 rounded-lg"
                >
                  <Sparkles className="w-4 h-4" /> SIGN UP
                </Link>
              </div>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTerminal();
              }}
              className="flex items-center justify-center gap-2 py-2 text-xs font-mono text-emerald-400 bg-zinc-900 border border-emerald-500/30 rounded-lg mt-1"
            >
              <Terminal className="w-4 h-4" /> OPEN INTERACTIVE TERMINAL
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
