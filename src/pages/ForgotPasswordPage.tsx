import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, ArrowRight, Terminal, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { NexusLogo } from '../components/NexusLogo';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // In-app password reset confirmation state
  const [isResetFlow, setIsResetFlow] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetErrorNotice, setResetErrorNotice] = useState<string | null>(null);

  const { resetPassword, confirmResetPassword, error, clearError, isPasswordRecovery } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    setIsResetFlow(
      isPasswordRecovery ||
      params.get('type') === 'recovery' ||
      Boolean(params.get('code')) ||
      hash.get('type') === 'recovery'
    );
  }, [location.search, location.hash, isPasswordRecovery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    clearError();
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      await resetPassword(email);
      setSuccessMessage(
        `Password reset instructions have been dispatched to ${email}. Please check your inbox or spam folder.`
      );
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

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
      setIsResetFlow(false);
      navigate('/login', {
        state: { infoMessage: 'PASSWORD RESET SUCCESSFUL! You can now log in with your new password.' },
        replace: true,
      });
    } catch (err: any) {
      setResetErrorNotice(err?.message || 'Failed to reset password. The reset link may have expired.');
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050709] text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 font-mono selection:bg-emerald-500 selection:text-black">
      {/* Background Matrix/Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#05150c_1px,transparent_1px),linear-gradient(to_bottom,#05150c_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10"></div>

      {/* Top Header Branding */}
      <div className="mb-8 text-center">
        <Link to="/" className="inline-block group">
          <NexusLogo variant="full" size="lg" subtitle="Engine // Password Recovery" />
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-zinc-950 border border-emerald-900/60 p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800/80 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold uppercase tracking-wider">
              {isResetFlow ? 'UPDATE_SECURITY_KEY.EXE' : 'RECOVER_KEY.EXE'}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 border border-emerald-800 font-bold">
            SECURE RESET
          </span>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-3.5 bg-emerald-950/60 border border-emerald-600/80 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-emerald-400 uppercase tracking-wider block">
                DISPATCH SUCCESSFUL
              </span>
              <p className="leading-relaxed">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {(error || resetErrorNotice) && (
          <div className="mb-6 p-3.5 bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-red-400 uppercase tracking-wider block">
                RECOVERY ERROR
              </span>
              <p className="leading-relaxed">{resetErrorNotice || error}</p>
            </div>
          </div>
        )}

        {isResetFlow ? (
          /* Set New Password Form */
          <form onSubmit={handleConfirmReset} className="space-y-5">
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Enter your new password below to reset your security key and restore access to your account.
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
                  RESETTING PASSWORD...
                </span>
              ) : (
                <>
                  <span>CONFIRM NEW PASSWORD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Request Password Reset Email Form */
          <>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Enter your registered email address below. The system will issue an official Supabase password reset link directly to your inbox.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>REGISTERED EMAIL</span>
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    clearError();
                    setSuccessMessage(null);
                    setEmail(e.target.value);
                  }}
                  placeholder="operator@nexus.io"
                  className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-emerald-400 text-white text-xs px-3.5 py-2.5 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-400/50"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:shadow-[0_0_30px_rgba(0,255,102,0.5)] disabled:opacity-50 mt-6"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    DISPATCHING RESET EMAIL...
                  </span>
                ) : (
                  <>
                    <span>SEND RESET INSTRUCTIONS</span>
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
            Remembered your credentials?{' '}
            <Link
              to="/login"
              className="text-emerald-400 font-bold hover:underline tracking-wider inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              RETURN TO LOGIN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

