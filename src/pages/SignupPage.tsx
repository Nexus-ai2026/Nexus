import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, Mail, User as UserIcon, ArrowRight, Eye, EyeOff, Terminal, CheckCircle2 } from 'lucide-react';
import { NexusLogo } from '../components/NexusLogo';

export const SignupPage: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const { signupWithEmail, loginWithGoogle, error, clearError, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) return;

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signupWithEmail(email, password, displayName);
      navigate('/verify-email', {
        state: {
          email,
          message: `Verification link dispatched to ${email}. Please check your inbox and verify your email before logging in.`,
        },
        replace: true,
      });
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen bg-[#050709] text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 font-mono selection:bg-emerald-500 selection:text-black">
      {/* Background Matrix/Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#05150c_1px,transparent_1px),linear-gradient(to_bottom,#05150c_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10"></div>

      {/* Top Header Branding */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-block group">
          <NexusLogo variant="full" size="lg" subtitle="Engine // Node Registration" />
        </Link>
      </div>

      {/* Signup Card */}
      <div className="w-full max-w-md bg-zinc-950 border border-emerald-900/60 p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800/80 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold uppercase tracking-wider">
              REGISTER_OPERATOR.EXE
            </span>
          </div>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 border border-emerald-800">
            NEW CLUSTER NODE
          </span>
        </div>

        {/* Error Alert Message */}
        {activeError && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-red-400 uppercase tracking-wider block">
                REGISTRATION FAILURE
              </span>
              <p className="leading-relaxed">{activeError}</p>
            </div>
          </div>
        )}

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
            {googleSubmitting ? 'CONNECTING GOOGLE AUTH...' : 'SIGN UP WITH GOOGLE'}
          </span>
        </button>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <span className="relative px-3 bg-zinc-950 text-[10px] text-zinc-500 uppercase tracking-widest">
            OR CREATE MANUAL ACCOUNT
          </span>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Operator Name */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>OPERATOR NAME</span>
              <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => {
                setLocalError(null);
                clearError();
                setDisplayName(e.target.value);
              }}
              placeholder="Dr. Alex Mercer"
              className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-emerald-400 text-white text-xs px-3.5 py-2.5 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-400/50"
            />
          </div>

          {/* Email Address */}
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
                setLocalError(null);
                clearError();
                setEmail(e.target.value);
              }}
              placeholder="operator@nexus.io"
              className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-emerald-400 text-white text-xs px-3.5 py-2.5 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-400/50"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>PASSWORD (MIN 6 CHARS)</span>
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setLocalError(null);
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

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>CONFIRM PASSWORD</span>
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => {
                setLocalError(null);
                clearError();
                setConfirmPassword(e.target.value);
              }}
              placeholder="••••••••••••"
              className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-emerald-400 text-white text-xs px-3.5 py-2.5 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-emerald-400/50"
            />
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
                PROVISIONING NODE...
              </span>
            ) : (
              <>
                <span>INITIALIZE NODE ACCOUNT</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center space-y-3 text-xs">
          <p className="text-zinc-400">
            Already registered?{' '}
            <Link
              to="/login"
              className="text-emerald-400 font-bold hover:underline tracking-wider"
            >
              LOGIN TO ENGINE
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
