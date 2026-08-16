import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccentTheme } from './types';
import { Navbar } from './components/Navbar';
import { HeroCanvas } from './components/HeroCanvas';
import { LiveTickerBar } from './components/LiveTickerBar';
import { DataSourcePanel } from './components/DataSourcePanel';
import { VisualizationSuite } from './components/VisualizationSuite';
import { VisualStudioSandbox } from './components/VisualStudioSandbox';
import { FeatureBentoGrid } from './components/FeatureBentoGrid';
import { PerformanceComparison } from './components/PerformanceComparison';
import { FAQAndTestimonials } from './components/FAQAndTestimonials';
import { FooterCTA } from './components/FooterCTA';
import { TerminalConsoleModal } from './components/TerminalConsoleModal';

function LandingPage() {
  const [accentTheme, setAccentTheme] = useState<AccentTheme>('neon-green');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Keyboard shortcut (⌘K or Ctrl+K) to open terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#050709] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Navigation */}
      <Navbar
        accentTheme={accentTheme}
        setAccentTheme={setAccentTheme}
        onOpenTerminal={() => setIsTerminalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 space-y-12 sm:space-y-16 py-6 sm:py-8">
        {/* Hero Section */}
        <section id="overview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <HeroCanvas accentTheme={accentTheme} />
        </section>

        {/* Live Metrics Streaming Ticker Bar */}
        <LiveTickerBar />

        {/* Ingestion & Data Source Panel */}
        <section id="datasource">
          <DataSourcePanel accentTheme={accentTheme} />
        </section>

        {/* Featured Visualizations Suite */}
        <section id="visualizations">
          <VisualizationSuite accentTheme={accentTheme} />
        </section>

        {/* Visual Studio Parameter Tuning Sandbox */}
        <section id="sandbox">
          <VisualStudioSandbox accentTheme={accentTheme} />
        </section>

        {/* Bento Architecture Features Grid */}
        <section id="features">
          <FeatureBentoGrid />
        </section>

        {/* Performance Comparison Benchmarks */}
        <section id="benchmarks">
          <PerformanceComparison />
        </section>

        {/* FAQs & Social Proof Testimonials */}
        <FAQAndTestimonials />
      </main>

      {/* Footer & CTA */}
      <FooterCTA onOpenTerminal={() => setIsTerminalOpen(true)} />

      {/* Developer Terminal Console Modal */}
      <TerminalConsoleModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}

