import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ShieldAlert, Lock, Mail, ArrowRight, Eye, EyeOff, Terminal, CheckCircle2, ShieldCheck } from 'lucide-react';
import { NexusLogo } from '../components/NexusLogo';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // In-app password reset confirmation state (Supabase recovery links use URL fragments)
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string | null>(null);
  const [resetErrorNotice, setResetErrorNotice] = useState<string | null>(null);

  const { loginWithEmail, loginWithGoogle, confirmResetPassword, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Supabase recovery links return auth data in the URL hash, not oobCode/mode query params.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const resetSuccess = params.get('resetSuccess');

    if (resetSuccess === 'true') {
      setResetSuccessNotice('PASSWORD RESET SUCCESSFUL! Your password has been updated. Please log in with your new credentials.');
    }

    const handleRecovery = async () => {
      const isRecoveryUrl = window.location.hash.includes('type=recovery');
      if (!isRecoveryUrl) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsResettingPassword(true);
        setResetSuccessNotice(null);
        // Remove the recovery token from the visible URL after Supabase has consumed it.
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      }
    };

    handleRecovery();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
        setResetSuccessNotice(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    setResetSuccessNotice(null);
    try {
      await loginWithEmail(email, password);
      // Wait a moment for auth state to propagate, then navigate.
      // ProtectedRoute will redirect to /verify-email if needed.
      navigate(from, { replace: true });
    } catch (err) {
      // Error is set in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isResettingPassword || !newPassword) return;

    if (newPassword.length < 6) {
      setResetErrorNotice('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetErrorNotice('Password confirmation does not match.');
      return;
    }

    setResetSubmitting(true);
    setResetErrorNotice(null);
    try {
      await confirmResetPassword(newPassword);
      setIsResettingPassword(false);
      setResetSuccessNotice('PASSWORD RESET SUCCESSFUL! You can now log in with your new password.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      setResetErrorNotice(err?.message || 'Failed to reset password. The link may have expired or already been used.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleSubmitting(true);
    setResetSuccessNotice(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      // Error is set in AuthContext
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050709] text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 font-mono selection:bg-emerald-500 selection:text-black">
      {/* Background Matrix/Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#05150c_1px,transparent_1px),linear-gradient(to_bottom,#05150c_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10"></div>

      {/* Top Header Branding */}
      <div className="mb-8 text-center">
        <Link to="/" className="inline-block group">
          <NexusLogo variant="full" size="lg" subtitle="Engine // Access Control" />
        </Link>
      </div>

      {/* Login / Reset Card */}
      <div className="w-full max-w-md bg-zinc-950 border border-emerald-900/60 p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800/80 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold uppercase tracking-wider">
              {isResettingPassword ? 'SET_NEW_PASSWORD.EXE' : 'AUTHENTICATE_NODE.EXE'}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 border border-emerald-800 font-bold">
            TLS 1.3
          </span>
        </div>

        {/* Success Reset Notification */}
        {resetSuccessNotice && (
          <div className="mb-6 p-3.5 bg-emerald-950/60 border border-emerald-600/80 text-emerald-300 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-emerald-400 uppercase tracking-wider block">
                PASSWORD RESET SUCCESSFUL
              </span>
              <p className="leading-relaxed">{resetSuccessNotice}</p>
            </div>
          </div>
        )}

        {/* Info Notification Message */}
        {location.state?.infoMessage && (
          <div className="mb-6 p-3 bg-emerald-950/50 border border-emerald-700/80 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-emerald-400 uppercase tracking-wider block">
                REGISTRATION SUCCESSFUL
              </span>
              <p className="leading-relaxed">{location.state.infoMessage}</p>
            </div>
          </div>
        )}

        {/* Error Alert Message */}
        {(error || resetErrorNotice) && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-red-400 uppercase tracking-wider block">
                AUTHENTICATION FAILURE
              </span>
              <p className="leading-relaxed">{resetErrorNotice || error}</p>
            </div>
          </div>
        )}

        {isResettingPassword ? (
          /* Render In-App Password Reset Confirmation Form */
          <form onSubmit={handleConfirmReset} className="space-y-5">
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Enter your new security key / password below to finalize credential recovery.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>NEW PASSWORD</span>
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => {
                  setResetErrorNotice(null);
                  setNewPassword(e.target.value);
                }}
                placeholder="••••••••••••"
                className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-emerald-400 text-white text-xs px-3.5 py-2.5 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-400/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>CONFIRM NEW PASSWORD</span>
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
              </label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => {
                  setResetErrorNotice(null);
                  setConfirmNewPassword(e.target.value);
                }}
                placeholder="••••••••••••"
                className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-emerald-400 text-white text-xs px-3.5 py-2.5 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-400/50"
              />
            </div>

            <button
              type="submit"
              disabled={resetSubmitting}
              className="w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:shadow-[0_0_30px_rgba(0,255,102,0.5)] disabled:opacity-50 mt-6"
            >
              {resetSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  SAVING NEW PASSWORD...
                </span>
              ) : (
                <>
                  <span>UPDATE PASSWORD & LOGIN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Standard Login Form */
          <>
            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleSubmitting || submitting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-zinc-900 hover:bg-zinc-850 text-white font-mono text-xs font-bold border border-zinc-700 hover:border-emerald-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)] disabled:opacity-50 mb-6"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>
                {googleSubmitting ? 'CONNECTING GOOGLE AUTH...' : 'SIGN IN WITH GOOGLE'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <span className="relative px-3 bg-zinc-950 text-[10px] text-zinc-500 uppercase tracking-widest">
                OR EMAIL CREDENTIALS
              </span>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>EMAIL ADDRESS</span>
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    clearError();
                    setEmail(e.target.value);
                  }}
                  placeholder="operator@nexus.io"
                  className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-emerald-400 text-white text-xs px-3.5 py-2.5 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-400/50"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>SECURITY KEY / PASSWORD</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-emerald-400 hover:text-emerald-300 underline tracking-wider font-bold transition-colors"
                  >
                    FORGOT PASSWORD?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      clearError();
                      setPassword(e.target.value);
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-emerald-400 text-white text-xs px-3.5 py-2.5 pr-10 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-400/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || googleSubmitting}
                className="w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:shadow-[0_0_30px_rgba(0,255,102,0.5)] disabled:opacity-50 mt-6"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    AUTHENTICATING...
                  </span>
                ) : (
                  <>
                    <span>LOG IN TO NEXUS</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center space-y-3 text-xs">
          <p className="text-zinc-400">
            Need node access?{' '}
            <Link
              to="/signup"
              className="text-emerald-400 font-bold hover:underline tracking-wider"
            >
              REGISTER NEW ACCOUNT
            </Link>
          </p>
          <div>
            <Link
              to="/"
              className="text-zinc-500 hover:text-zinc-300 text-[11px] transition-colors"
            >
              ← RETURN TO PUBLIC TOPOLOGY
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

