import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Cpu } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050709] flex flex-col items-center justify-center p-4 font-mono text-emerald-400">
        <div className="relative p-8 bg-zinc-950 border border-emerald-500/40 shadow-[0_0_30px_rgba(0,255,102,0.15)] max-w-md w-full text-center space-y-6">
          <div className="relative inline-flex items-center justify-center w-16 h-16 bg-emerald-950/50 border border-emerald-500/50">
            <Cpu className="w-8 h-8 text-emerald-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-bold tracking-widest text-white uppercase flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              AUTHENTICATING SESSION
            </h2>
            <p className="text-xs text-zinc-400">
              Verifying telemetry encryption keys & user credentials...
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-zinc-900 border border-emerald-900/60 h-2 overflow-hidden p-0.5">
            <div className="bg-emerald-400 h-full w-2/3 animate-pulse"></div>
          </div>

          <div className="text-[10px] text-zinc-500">
            SECURE HANDSHAKE // SUPABASE AUTH v10
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Mandatory Email Verification Guard:
  // If user signed up with email/password and hasn't verified their email yet, redirect to /verify-email.
  const isPasswordUser = user.providerData.some((p) => p.providerId === 'password');
  if (isPasswordUser && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
};
