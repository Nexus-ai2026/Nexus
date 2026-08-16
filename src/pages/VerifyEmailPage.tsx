import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Send,
  LogOut,
  Terminal,
  Clock,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { NexusLogo } from '../components/NexusLogo';

export const VerifyEmailPage: React.FC = () => {
  const { user, logout, sendVerificationEmail, resendSignupVerification, checkVerificationStatus, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [cooldown, setCooldown] = useState<number>(0);
  const [resending, setResending] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'success' | 'warning'; text: string } | null>(null);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState<boolean>(false);

  const signupEmail = (location.state as any)?.email;
  const signupMessage = (location.state as any)?.message;

  // Timer effect for 60-second resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Unified status verification & auto-redirect handler
  const performCheck = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const verified = await checkVerificationStatus();
      if (verified || user.emailVerified) {
        setIsVerifiedSuccess(true);
        setStatusMessage({
          type: 'success',
          text: 'EMAIL VERIFIED! Redirecting to dashboard...',
        });
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 800);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [checkVerificationStatus, navigate]);

  // Automatic background polling (every 3 seconds) + window focus trigger
  useEffect(() => {
    if (!user) return;

    // Check immediately on mount if user is already verified
    performCheck();

    const interval = setInterval(() => {
      performCheck();
    }, 3000);

    const handleFocus = () => {
      performCheck();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user, performCheck]);

  // If user is not logged in AND no signupEmail was passed, redirect to login
  if (!user && !signupEmail) {
    return <Navigate to="/login" replace />;
  }

  // If logged-in user is already verified (or Google user), redirect to dashboard
  if (user && !isVerifiedSuccess) {
    const isPasswordUser = user.providerData.some((p) => p.providerId === 'password');
    if ((user?.emailVerified || user.emailVerified || !isPasswordUser)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setResendSuccess(null);
    setStatusMessage(null);
    clearError();

    try {
      if (user) await sendVerificationEmail();
      else if (signupEmail) await resendSignupVerification(signupEmail);
      else throw new Error('No email address is available for verification.');
      const currentEmail = user?.email || displayEmail;
      setResendSuccess(`Verification email dispatched to ${currentEmail}. Check your inbox or spam folder.`);
      setCooldown(60); // Start 60s cooldown
    } catch (err: any) {
      // Error message handled in context or shown via error state
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    setResendSuccess(null);
    clearError();

    try {
      const verified = await performCheck();
      if (!verified) {
        setStatusMessage({
          type: 'warning',
          text: 'AWAITING VERIFICATION: Email is not verified yet. Please click the link sent to your email inbox and try again.',
        });
      }
    } catch (err) {
      // Error is set in AuthContext
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const displayEmail = user?.email || user?.email || signupEmail || 'your email';

  return (
    <div className="min-h-screen bg-[#050709] text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 font-mono selection:bg-emerald-500 selection:text-black">
      {/* Background Matrix/Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#05150c_1px,transparent_1px),linear-gradient(to_bottom,#05150c_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10"></div>

      {/* Header Branding */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-block group">
          <NexusLogo variant="full" size="lg" subtitle="Engine // Security Gate" />
        </Link>
      </div>

      {/* Main Verification Card */}
      <div className="w-full max-w-md bg-zinc-950 border border-emerald-900/60 p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800/80 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold uppercase tracking-wider">
              VERIFY_EMAIL.EXE
            </span>
          </div>
          <span className="text-[10px] bg-amber-950/60 text-amber-400 px-2 py-0.5 border border-amber-800/60 font-bold uppercase">
            PENDING VERIFICATION
          </span>
        </div>

        {/* Mail Icon & Title */}
        <div className="text-center space-y-3 mb-6">
          <div className="relative inline-flex items-center justify-center w-16 h-16 bg-emerald-950/40 border border-emerald-500/50 shadow-[0_0_20px_rgba(0,255,102,0.15)]">
            <Mail className="w-8 h-8 text-emerald-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <h1 className="text-lg font-bold text-white uppercase tracking-wider">
            VERIFY YOUR EMAIL ADDRESS
          </h1>

          <p className="text-xs text-zinc-400 leading-relaxed">
            {signupMessage || 'A verification link has been sent to your email address:'}
          </p>

          <div className="p-2.5 bg-zinc-900 border border-emerald-800/60 text-emerald-400 font-bold text-xs tracking-wide truncate">
            {displayEmail}
          </div>
        </div>

        {/* Error Alert Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-red-400 uppercase tracking-wider block">
                VERIFICATION ERROR
              </span>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Resend Success Banner */}
        {resendSuccess && (
          <div className="mb-6 p-3 bg-emerald-950/50 border border-emerald-700/80 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-emerald-400 uppercase tracking-wider block">
                EMAIL DISPATCHED
              </span>
              <p className="leading-relaxed">{resendSuccess}</p>
            </div>
          </div>
        )}

        {/* Status Check Message */}
        {statusMessage && (
          <div
            className={`mb-6 p-3 text-xs flex items-start gap-2.5 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-700/80 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider block">
                {statusMessage.type === 'success' ? 'EMAIL VERIFIED' : 'AWAITING VERIFICATION'}
              </span>
              <p className="leading-relaxed">{statusMessage.text}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {user ? (
            <>
              {/* Check Verification Status Button */}
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={checking}
                className="w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:shadow-[0_0_30px_rgba(0,255,102,0.5)] disabled:opacity-50"
              >
                {checking ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    CHECKING STATUS...
                  </span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>CHECK VERIFICATION STATUS</span>
                  </>
                )}
              </button>

              {/* Resend Email Button with 60s Cooldown */}
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-700 hover:border-emerald-400 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    SENDING EMAIL...
                  </span>
                ) : cooldown > 0 ? (
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    RESEND IN {cooldown}S
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>RESEND VERIFICATION EMAIL</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Signed Out State (Right after signup) */
            <Link
              to="/login"
              className="w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:shadow-[0_0_30px_rgba(0,255,102,0.5)]"
            >
              <span>PROCEED TO LOGIN</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-6 p-3 bg-zinc-900/60 border border-zinc-850 text-[11px] text-zinc-400 space-y-1">
          <span className="text-emerald-400 font-bold block">DIDN'T RECEIVE THE EMAIL?</span>
          <p className="leading-normal">
            Check your spam/junk folder. Once verified in your email, click "CHECK VERIFICATION STATUS" or switch back to this tab.
          </p>
        </div>

        {/* Footer Links & Logout */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOG OUT</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>RETURN TO LOGIN</span>
            </Link>
          )}

          <Link
            to="/"
            className="text-zinc-500 hover:text-zinc-300 text-[11px] transition-colors"
          >
            ← PUBLIC HOME
          </Link>
        </div>
      </div>
    </div>
  );
};

