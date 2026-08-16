import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: { providerId: string }[];
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  clearError: () => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  checkVerificationStatus: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  confirmResetPassword: (newPassword: string) => Promise<void>;
  resendSignupVerification: (email: string) => Promise<void>;
  isPasswordRecovery: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUser = (sbUser: SupabaseUser | null): AppUser | null => {
  if (!sbUser) return null;
  
  const provider = sbUser.app_metadata?.provider || 'email';
  const providerId = provider === 'email' ? 'password' : provider === 'google' ? 'google.com' : provider;
  
  return {
    uid: sbUser.id,
    email: sbUser.email || null,
    displayName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.user_metadata?.displayName || null,
    photoURL: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null,
    emailVerified: !!sbUser.email_confirmed_at,
    providerData: [{ providerId }],
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapSupabaseUser(session?.user || null));
      setLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      setUser(mapSupabaseUser(session?.user || null));
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatAuthError = (err: any): string => {
    if (!err) return 'An unexpected authentication error occurred.';
    
    // Check if the environment variables are missing when we get a fetch error
    const isMissingEnvVars = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    const message = err.message || '';
    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please verify your credentials and try again.';
    }
    if (message.includes('User already registered')) {
      return 'An account with this email address already exists. Try logging in instead.';
    }
    if (message.includes('Failed to fetch')) {
      if (isMissingEnvVars) {
        return 'Configuration Error: VITE_SUPABASE_URL and/or VITE_SUPABASE_PUBLISHABLE_KEY are missing. Please add them to your environment variables.';
      }
      return 'Network Error: Failed to reach the Supabase authentication server (Failed to fetch).';
    }
    return message || 'Authentication operation failed. Please try again.';
  };

  const clearError = () => setError(null);

  const loginWithEmail = async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      const msg = formatAuthError(error);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signupWithEmail = async (email: string, password: string, displayName?: string) => {
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          displayName: displayName?.trim(),
          full_name: displayName?.trim(),
        },
        emailRedirectTo: `${window.location.origin}/login?verifySuccess=true`,
      }
    });
    
    if (error) {
      const msg = formatAuthError(error);
      setError(msg);
      throw new Error(msg);
    }

    if (data?.session) {
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  const resendSignupVerification = async (email: string) => {
    setError(null);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/login?verifySuccess=true` },
    });
    if (error) { const msg = formatAuthError(error); setError(msg); throw new Error(msg); }
  };

  const sendVerificationEmail = async () => {
    setError(null);
    if (!user?.email) {
      const msg = 'No authenticated user session found.';
      setError(msg);
      throw new Error(msg);
    }
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/login?verifySuccess=true`,
      }
    });
    
    if (error) {
      const msg = formatAuthError(error);
      setError(msg);
      throw new Error(msg);
    }
  };

  const checkVerificationStatus = async (): Promise<boolean> => {
    setError(null);
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      setError(formatAuthError(error));
      return false;
    }
    
    if (session?.user) {
      const sbUser = session.user;
      const isVerified = !!sbUser.email_confirmed_at;
      setUser(mapSupabaseUser(sbUser));
      return isVerified;
    }
    return false;
  };

  const resetPassword = async (email: string) => {
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    
    if (error) {
      const msg = formatAuthError(error);
      setError(msg);
      throw new Error(msg);
    }
  };

  const confirmResetPassword = async (newPassword: string) => {
    setError(null);
    // Supabase sets session from hash when redirecting, so we can just updateUser
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      const msg = formatAuthError(error);
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (error) {
      const msg = formatAuthError(error);
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      const msg = formatAuthError(error);
      setError(msg);
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        clearError,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
        sendVerificationEmail,
        checkVerificationStatus,
        resetPassword,
        confirmResetPassword,
        resendSignupVerification,
        isPasswordRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

