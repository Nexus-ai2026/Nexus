import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { supabase } from "../lib/supabase";
import { handleSupabaseError, OperationType } from '../lib/supabaseErrors';
import { NexusLogo } from '../components/NexusLogo';
import { AddTelemetryModal } from '../components/AddTelemetryModal';
import { EditTelemetryModal } from '../components/EditTelemetryModal';
import { AlertThresholdModal } from '../components/AlertThresholdModal';
import { AlertThresholdPanel } from '../components/AlertThresholdPanel';
import { TelemetryRecord, ChartType, AlertThresholdSettings } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Zap,
  LogOut,
  User as UserIcon,
  Activity,
  Key,
  Copy,
  Check,
  Play,
  Pause,
  Database,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
  Edit2,
  Sliders,
  AlertTriangle,
  Bell,
  ShieldAlert,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Eye,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
}

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
    supabaseTelemetry,
    supabaseMetrics,
    supabaseLoading,
    supabaseError,
    clearSupabaseError,
    addTelemetryPoint,
    updateTelemetryPoint,
    deleteTelemetryPoint,
    seedInitialTelemetry,
    clearAllTelemetry,
    isSupabaseStreaming,
    toggleSupabaseStream,
  } = useData();

  // Visualization & Dashboard Local UI State
  const [activeTab, setActiveTab] = useState<'live-telemetry' | 'api-keys' | 'csv-lab'>('live-telemetry');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [selectedYField, setSelectedYField] = useState<'value' | 'secondaryValue'>('value');
  const [showGrid, setShowGrid] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Table State
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 7;

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TelemetryRecord | null>(null);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [isDismissedAlert, setIsDismissedAlert] = useState(false);

  // Alert Thresholds state (persisted to Supabase /users/{user.uid})
  const [alertSettings, setAlertSettings] = useState<AlertThresholdSettings>({
    enabled: true,
    metricFilter: 'ALL',
    warningThreshold: 500,
    criticalThreshold: 560,
    floorThreshold: 200,
    highlightRows: true,
    soundAlert: false,
  });

  // User Profile & API Keys Supabase state
  const [samplingRate, setSamplingRate] = useState<number>(500);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Sync user profile & API keys (public.api_keys)
  useEffect(() => {
    if (!user) return;

    
    

    // Subscribe to User Preferences & Alert Thresholds
    
    const fetchUserConfig = async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.uid).single();
      if (data) {
        if ((data.sampling_rate || data.samplingRate) !== undefined) setSamplingRate((data.sampling_rate || data.samplingRate));
        if ((data.alert_thresholds || data.alertThresholds)) {
          setAlertSettings((prev) => ({ ...prev, ...(data.alert_thresholds || data.alertThresholds) }));
        }
      } else {
        await supabase.from('profiles').insert({
          id: user.uid,
          email: user.email,
          display_name: user.displayName || '',
          sampling_rate: 500,
          alert_thresholds: {
            enabled: true,
            metricFilter: 'ALL',
            warningThreshold: 500,
            criticalThreshold: 560,
            floorThreshold: 200,
            highlightRows: true,
            soundAlert: false,
          },
        });
      }
    };
    fetchUserConfig();
    
    // Subscribe to User Preferences & Alert Thresholds
    const userChannel = supabase.channel('user-config').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.uid}` }, fetchUserConfig).subscribe();

    // Subscribe to User API Keys
    
    const fetchApiKeys = async () => {
      const { data } = await supabase.from('api_keys').select('*').eq('user_id', user.uid);
      if (data) {
        setApiKeys(data.map(d => ({
          id: d.id,
          name: d.name || 'API Key',
          key: d.key || '',
          created: d.created || new Date().toISOString().split('T')[0],
        })));
      }
    };
    fetchApiKeys();

    const keysChannel = supabase.channel('api-keys').on('postgres_changes', { event: '*', schema: 'public', table: 'api_keys', filter: `user_id=eq.${user.uid}` }, fetchApiKeys).subscribe();

    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(keysChannel);
    };
  }, [user]);

  // Derived available metric names from live telemetry
  const availableMetricNames = useMemo(() => {
    const names = Array.from(
      new Set(supabaseTelemetry.map((r) => r.metricName).filter(Boolean))
    );
    return ['ALL', ...names];
  }, [supabaseTelemetry]);

  // Latest record in live stream
  const latestRecord = useMemo(() => {
    return supabaseTelemetry.length > 0
      ? supabaseTelemetry[supabaseTelemetry.length - 1]
      : null;
  }, [supabaseTelemetry]);

  // Real-time threshold breach calculations
  const breachMetrics = useMemo(() => {
    if (!alertSettings.enabled) {
      return {
        totalBreaches: 0,
        criticalCount: 0,
        warningCount: 0,
        isLatestBreached: false,
        isLatestCritical: false,
        highestSpike: null as number | null,
        breachedIds: new Set<string>(),
      };
    }

    const filtered = supabaseTelemetry.filter(
      (r) => alertSettings.metricFilter === 'ALL' || r.metricName === alertSettings.metricFilter
    );

    const breachedIds = new Set<string>();
    let criticalCount = 0;
    let warningCount = 0;
    let highestVal: number | null = null;

    filtered.forEach((r) => {
      const isWarn =
        r.value >= alertSettings.warningThreshold ||
        (alertSettings.floorThreshold > 0 && r.value <= alertSettings.floorThreshold);
      const isCrit = r.value >= alertSettings.criticalThreshold;

      if (isCrit) {
        criticalCount++;
        breachedIds.add(r.id);
      } else if (isWarn) {
        warningCount++;
        breachedIds.add(r.id);
      }

      if (r.value >= alertSettings.warningThreshold) {
        if (highestVal === null || r.value > highestVal) {
          highestVal = r.value;
        }
      }
    });

    const isLatestBreached =
      latestRecord &&
      (alertSettings.metricFilter === 'ALL' || latestRecord.metricName === alertSettings.metricFilter) &&
      (latestRecord.value >= alertSettings.warningThreshold ||
        (alertSettings.floorThreshold > 0 && latestRecord.value <= alertSettings.floorThreshold));

    const isLatestCritical =
      latestRecord &&
      (alertSettings.metricFilter === 'ALL' || latestRecord.metricName === alertSettings.metricFilter) &&
      latestRecord.value >= alertSettings.criticalThreshold;

    return {
      totalBreaches: breachedIds.size,
      criticalCount,
      warningCount,
      isLatestBreached: !!isLatestBreached,
      isLatestCritical: !!isLatestCritical,
      highestSpike: highestVal,
      breachedIds,
    };
  }, [supabaseTelemetry, alertSettings, latestRecord]);

  // Audio chime synthesizer on spike arrival
  useEffect(() => {
    if (
      alertSettings.enabled &&
      alertSettings.soundAlert &&
      breachMetrics.isLatestBreached
    ) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = breachMetrics.isLatestCritical ? 'sawtooth' : 'sine';
          osc.frequency.setValueAtTime(breachMetrics.isLatestCritical ? 880 : 660, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        }
      } catch (e) {
        // audio playback policy handling
      }
    }
  }, [supabaseTelemetry.length, alertSettings.enabled, alertSettings.soundAlert, breachMetrics.isLatestBreached, breachMetrics.isLatestCritical]);

  // Handle saving alert threshold updates to Supabase
  const handleUpdateAlertThresholds = async (newSettings: Partial<AlertThresholdSettings>) => {
    const updated = { ...alertSettings, ...newSettings };
    setAlertSettings(updated);
    setIsDismissedAlert(false);

    if (!user) return;
    try {
      await supabase.from('profiles').update({ alert_thresholds: updated, updatedAt: new Date().toISOString() }).eq('id', user.uid);
    } catch (err) {
      handleSupabaseError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // Filtered Telemetry Records for Table
  const filteredRecords = useMemo(() => {
    if (!tableSearch.trim()) return supabaseTelemetry;
    const q = tableSearch.toLowerCase();
    return supabaseTelemetry.filter(
      (r) =>
        r.metricName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.node?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q)
    );
  }, [supabaseTelemetry, tableSearch]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = currentPage * rowsPerPage;
    return filteredRecords.slice(start, start + rowsPerPage);
  }, [filteredRecords, currentPage, rowsPerPage]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSetSamplingRate = async (rate: number) => {
    setSamplingRate(rate);
    if (!user) return;
    try {
      const { error } = await supabase.from('profiles').update({ sampling_rate: rate, updatedAt: new Date().toISOString() }).eq('id', user.uid);
      if (error) throw error;
    } catch (err) {
      handleSupabaseError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !user) return;

    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const randomHex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

    const keyId = `key-${Date.now()}`;
    const newKeyData = {
      id: keyId,
      name: newKeyName.trim(),
      key: `nx_live_${randomHex}`,
      created: new Date().toISOString().split('T')[0],
      user_id: user.uid,
      createdAt: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('api_keys').insert({ ...newKeyData, id: keyId, user_id: user.uid });
      if (error) throw error;
      setNewKeyName('');
      setIsGeneratingKey(false);
    } catch (err) {
      handleSupabaseError(err, OperationType.CREATE, `users/${user.uid}/apiKeys/${keyId}`);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', keyId).eq('user_id', user.uid);
      if (error) throw error;
    } catch (err) {
      handleSupabaseError(err, OperationType.DELETE, `users/${user.uid}/apiKeys/${keyId}`);
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

  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || 'Operator';
  const providerId = user?.providerData[0]?.providerId || 'password';

  return (
    <div className="min-h-screen bg-[#050709] text-zinc-100 flex flex-col font-mono selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 border-b border-emerald-950/80 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="group">
            <NexusLogo variant="full" size="sm" subtitle="Live Supabase Telemetry" />
          </Link>

          <span className="hidden md:inline-block text-zinc-700">|</span>

          {/* User Isolation Real-Time Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/80 px-2.5 py-1 text-[11px] text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>REALTIME SUBSCRIPTION // public.telemetry (user_id=${user?.uid.slice(0, 8)})</span>
          </div>
        </div>

        {/* Account Bar & Navigation */}
        <div className="flex items-center gap-3">
          {/* Quick Alert Limits Trigger */}
          <button
            onClick={() => setIsThresholdModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold uppercase border transition-all cursor-pointer ${
              breachMetrics.isLatestCritical
                ? 'bg-red-950 text-red-300 border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : breachMetrics.isLatestBreached
                ? 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-amber-500'
            }`}
            title="Configure Telemetry Alert Thresholds"
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                breachMetrics.isLatestCritical
                  ? 'text-red-400'
                  : breachMetrics.isLatestBreached
                  ? 'text-amber-400'
                  : 'text-zinc-400'
              }`}
            />
            <span className="hidden sm:inline">ALERT LIMITS</span>
            {breachMetrics.totalBreaches > 0 && (
              <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[9px] font-bold">
                {breachMetrics.totalBreaches}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={userDisplayName}
                className="w-5 h-5 rounded-full border border-emerald-400"
              />
            ) : (
              <UserIcon className="w-4 h-4 text-emerald-400" />
            )}
            <div className="flex flex-col text-left">
              <span className="font-bold text-white text-[11px] leading-none">
                {userDisplayName}
              </span>
              <span className="text-[9px] text-zinc-400 leading-none mt-1">
                {user?.email}
              </span>
            </div>
            <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 border border-emerald-800/80 uppercase ml-1">
              {providerId === 'google.com' ? 'GOOGLE' : 'EMAIL'}
            </span>
          </div>

          <Link
            to="/#datasource"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all"
            title="Explore CSV & WebSocket Ingestion Lab"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV LAB</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-900/60 hover:border-red-700 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LOGOUT</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Supabase Error Alert */}
        {supabaseError && (
          <div className="p-4 bg-red-950/60 border border-red-700 text-red-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <span className="font-bold block text-red-300">SUPABASE SUBSCRIPTION ERROR:</span>
                <span className="font-mono text-[11px] text-red-200">{supabaseError}</span>
              </div>
            </div>
            <button
              onClick={clearSupabaseError}
              className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-white text-xs font-bold uppercase cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Security & Authentication Isolation Banner */}
        <div className="bg-zinc-950 border border-emerald-900/60 p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>SUPABASE REALTIME // RLS AUTH ISOLATION VERIFIED</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider">
                NEXUS TELEMETRY COMMAND // <span className="text-emerald-400">{userDisplayName.toUpperCase()}</span>
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
                Direct Realtime sync active with table <code className="text-emerald-400 bg-zinc-900 px-1.5 py-0.5 border border-zinc-800">public.telemetry</code>. Any document addition, edit, or deletion updates charts and calculated statistics immediately without page refresh. User A cannot read User B.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsThresholdModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase border border-amber-500/80 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>ALERT THRESHOLDS</span>
              </button>

              <button
                onClick={toggleSupabaseStream}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase border transition-all cursor-pointer ${
                  isSupabaseStreaming
                    ? 'bg-amber-950 text-amber-400 border-amber-600 animate-pulse'
                    : 'bg-emerald-950/60 text-emerald-400 border-emerald-700 hover:bg-emerald-900'
                }`}
              >
                {isSupabaseStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSupabaseStreaming ? 'PAUSE LIVE FEEDER' : 'START LIVE FEEDER'}</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.3)] uppercase"
              >
                <Plus className="w-4 h-4" />
                <span>ADD METRIC POINT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visual Alert Threshold Breach Banner (Triggered dynamically when limits exceeded) */}
        {alertSettings.enabled && breachMetrics.totalBreaches > 0 && !isDismissedAlert && (
          <div
            className={`p-4 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono shadow-[0_0_35px_rgba(239,68,68,0.3)] ${
              breachMetrics.isLatestCritical
                ? 'bg-red-950/90 border-red-500 text-red-100'
                : 'bg-amber-950/90 border-amber-500 text-amber-100'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`p-2 border shrink-0 ${
                  breachMetrics.isLatestCritical
                    ? 'bg-red-900 border-red-400 text-red-200 animate-pulse'
                    : 'bg-amber-900 border-amber-400 text-amber-200 animate-pulse'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-xs sm:text-sm tracking-wider uppercase">
                    {breachMetrics.isLatestCritical
                      ? '🚨 CRITICAL TELEMETRY THRESHOLD BREACH DETECTED'
                      : '⚠️ TELEMETRY WARNING THRESHOLD EXCEEDED'}
                  </span>
                  <span className="px-2 py-0.5 bg-black text-amber-400 border border-amber-500/60 text-[10px] font-bold">
                    {breachMetrics.totalBreaches} DOCUMENT(S) BREACHED
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {latestRecord && (
                    <>
                      Latest point: <span className="font-bold text-white font-mono">{latestRecord.metricName}</span> recorded at{' '}
                      <span className="font-bold text-amber-300 font-mono">{latestRecord.value.toFixed(1)} {latestRecord.unit || 'MB/s'}</span>{' '}
                      (Limit: <span className="font-bold underline">{alertSettings.warningThreshold}</span>
                      {latestRecord.value >= alertSettings.criticalThreshold && (
                        <span className="text-red-300 font-bold ml-1">/ Critical: {alertSettings.criticalThreshold}</span>
                      )}
                      ).
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => setIsThresholdModalOpen(true)}
                className="px-3 py-1.5 bg-black hover:bg-zinc-900 border border-amber-400 text-amber-300 text-xs font-bold uppercase transition-all cursor-pointer"
              >
                ADJUST LIMITS
              </button>
              <button
                onClick={() => setIsDismissedAlert(true)}
                className="px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase border border-zinc-700 cursor-pointer"
              >
                DISMISS
              </button>
            </div>
          </div>
        )}

        {/* Inline Alert Threshold Sentinel Panel */}
        <AlertThresholdPanel
          settings={alertSettings}
          onUpdateSettings={handleUpdateAlertThresholds}
          onOpenModal={() => setIsThresholdModalOpen(true)}
          latestRecord={latestRecord}
          activeBreachesCount={breachMetrics.totalBreaches}
          criticalBreachesCount={breachMetrics.criticalCount}
          availableMetricNames={availableMetricNames}
        />

        {/* Dynamic Statistics Bar (Calculated Instantly on Every Realtime Event) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Latest / Current Value */}
          <div
            className={`p-3.5 space-y-1 transition-all border ${
              breachMetrics.isLatestCritical
                ? 'bg-red-950/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                : breachMetrics.isLatestBreached
                ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : 'bg-zinc-950 border-emerald-500/50 shadow-[0_0_15px_rgba(0,255,102,0.08)]'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase">
              <span>LATEST / CURRENT</span>
              {breachMetrics.isLatestBreached ? (
                <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
              ) : (
                <Activity className="w-3 h-3 text-emerald-400" />
              )}
            </div>
            <div
              className={`text-xl sm:text-2xl font-black ${
                breachMetrics.isLatestCritical
                  ? 'text-red-400'
                  : breachMetrics.isLatestBreached
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {supabaseMetrics.latest !== null ? supabaseMetrics.latest : '—'}
            </div>
            <div className="text-[10px] text-zinc-500 truncate">
              {supabaseTelemetry.length > 0
                ? `${supabaseTelemetry[supabaseTelemetry.length - 1]?.metricName}`
                : 'No points recorded'}
            </div>
          </div>

          {/* Minimum (Min) */}
          <div className="bg-zinc-950 border border-zinc-800 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase">
              <span>MINIMUM</span>
              <TrendingUp className="w-3 h-3 text-cyan-400 rotate-180" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-cyan-400">
              {supabaseMetrics.min !== null ? supabaseMetrics.min : '—'}
            </div>
            <div className="text-[10px] text-zinc-500">Floor value</div>
          </div>

          {/* Maximum (Max) */}
          <div className="bg-zinc-950 border border-zinc-800 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase">
              <span>MAXIMUM</span>
              <TrendingUp className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400">
              {supabaseMetrics.max !== null ? supabaseMetrics.max : '—'}
            </div>
            <div className="text-[10px] text-zinc-500">Peak threshold</div>
          </div>

          {/* Average (Mean) */}
          <div className="bg-zinc-950 border border-zinc-800 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase">
              <span>AVERAGE (MEAN)</span>
              <BarChart3 className="w-3 h-3 text-white" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {supabaseMetrics.avg !== null ? supabaseMetrics.avg : '—'}
            </div>
            <div className="text-[10px] text-zinc-500">Arithmetic mean</div>
          </div>

          {/* Median */}
          <div className="bg-zinc-950 border border-zinc-800 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase">
              <span>MEDIAN</span>
              <Sliders className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {supabaseMetrics.median !== null ? supabaseMetrics.median : '—'}
            </div>
            <div className="text-[10px] text-zinc-500">50th percentile</div>
          </div>

          {/* Sum */}
          <div className="bg-zinc-950 border border-zinc-800 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase">
              <span>SUM TOTAL</span>
              <Layers className="w-3 h-3 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-400">
              {supabaseMetrics.sum !== null ? supabaseMetrics.sum : '—'}
            </div>
            <div className="text-[10px] text-zinc-500">Cumulative metric</div>
          </div>

          {/* Total Count */}
          <div className="bg-zinc-950 border border-zinc-800 p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase">
              <span>DOC COUNT</span>
              <Database className="w-3 h-3 text-zinc-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-300">
              {supabaseMetrics.count}
            </div>
            <div className="text-[10px] text-zinc-500">Stored points</div>
          </div>
        </div>

        {/* Main Workspace: Real-Time Visualization & Controls */}
        <div className="bg-zinc-950 border border-emerald-900/60 p-6 space-y-6">
          {/* Chart Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  LIVE SUPABASE TELEMETRY VISUALIZATION
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-700 text-[10px] px-2 py-0.5 uppercase">
                    REALTIME STREAM
                  </span>
                </h2>
                <p className="text-xs text-zinc-500">
                  Target field: <span className="text-emerald-400">{selectedYField}</span> | Chronological sequence
                </p>
              </div>
            </div>

            {/* Chart Type & Axis Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Field Switcher */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 text-xs">
                <button
                  onClick={() => setSelectedYField('value')}
                  className={`px-2.5 py-1 font-bold transition-colors cursor-pointer ${
                    selectedYField === 'value'
                      ? 'bg-emerald-500 text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  PRIMARY VALUE
                </button>
                <button
                  onClick={() => setSelectedYField('secondaryValue')}
                  className={`px-2.5 py-1 font-bold transition-colors cursor-pointer ${
                    selectedYField === 'secondaryValue'
                      ? 'bg-cyan-500 text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  SECONDARY VALUE
                </button>
              </div>

              {/* Chart Type Switcher */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 text-xs">
                {(['area', 'line', 'bar', 'scatter'] as ChartType[]).map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setChartType(ct)}
                    className={`px-2.5 py-1 uppercase font-bold transition-colors cursor-pointer ${
                      chartType === ct
                        ? 'bg-zinc-800 text-emerald-400 border border-emerald-800'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {ct}
                  </button>
                ))}
              </div>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-2.5 py-1 text-xs border font-bold uppercase transition-colors cursor-pointer ${
                  showGrid
                    ? 'bg-zinc-900 border-zinc-700 text-emerald-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                }`}
              >
                GRID: {showGrid ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Chart Display Area / Loading State / Empty State */}
          <div className="relative min-h-[380px] w-full bg-[#030507] border border-zinc-900 p-4">
            {supabaseLoading ? (
              /* Loading State */
              <div className="h-[350px] flex flex-col items-center justify-center space-y-4">
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500 border-t-transparent"></div>
                  <Activity className="w-5 h-5 text-emerald-400 absolute" />
                </div>
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest animate-pulse">
                  CONNECTING REALTIME CHANNEL TO SUPABASE...
                </div>
                <p className="text-[11px] text-zinc-500 max-w-sm text-center">
                  Establishing real-time snapshot sync with /users/{user?.uid.slice(0, 10)}.../telemetry
                </p>
              </div>
            ) : supabaseTelemetry.length === 0 ? (
              /* Empty State */
              <div className="h-[350px] flex flex-col items-center justify-center space-y-4 text-center p-6">
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                  <Database className="w-6 h-6 text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    NO SUPABASE TELEMETRY RECORDS FOUND
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Your table at <code className="text-emerald-400">public.telemetry</code> is currently empty. Click below to quick-seed a realistic telemetry batch or start live ingestion.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={seedInitialTelemetry}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold uppercase shadow-[0_0_20px_rgba(0,255,102,0.3)] transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>SEED SAMPLE TELEMETRY BATCH (20 POINTS)</span>
                  </button>

                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase border border-zinc-700 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>CREATE SINGLE POINT</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Live Real-time Chart */
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={supabaseTelemetry} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="liveAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff66" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#00ff66" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="liveSecAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />}
                      <XAxis
                        dataKey="timestamp"
                        stroke="#52525b"
                        tick={{ fill: '#71717a', fontSize: 10 }}
                        tickLine={{ stroke: '#27272a' }}
                      />
                      <YAxis
                        stroke="#52525b"
                        tick={{ fill: '#71717a', fontSize: 10 }}
                        tickLine={{ stroke: '#27272a' }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d11',
                          borderColor: '#00ff66',
                          borderWidth: '1px',
                          borderRadius: '0px',
                          color: '#fff',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      />
                      {alertSettings.enabled && (
                        <>
                          <ReferenceLine
                            y={alertSettings.warningThreshold}
                            stroke="#f59e0b"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                              value: `WARN: ${alertSettings.warningThreshold}`,
                              fill: '#f59e0b',
                              fontSize: 10,
                              position: 'insideTopRight',
                            }}
                          />
                          <ReferenceLine
                            y={alertSettings.criticalThreshold}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            strokeWidth={2}
                            label={{
                              value: `CRIT: ${alertSettings.criticalThreshold}`,
                              fill: '#ef4444',
                              fontSize: 10,
                              position: 'insideTopRight',
                            }}
                          />
                          {alertSettings.floorThreshold > 0 && (
                            <ReferenceLine
                              y={alertSettings.floorThreshold}
                              stroke="#38bdf8"
                              strokeDasharray="2 2"
                              strokeWidth={1}
                              label={{
                                value: `FLOOR: ${alertSettings.floorThreshold}`,
                                fill: '#38bdf8',
                                fontSize: 10,
                                position: 'insideBottomRight',
                              }}
                            />
                          )}
                        </>
                      )}
                      <Area
                        type="monotone"
                        dataKey={selectedYField}
                        stroke={selectedYField === 'value' ? '#00ff66' : '#00f0ff'}
                        strokeWidth={2.5}
                        fill={selectedYField === 'value' ? 'url(#liveAreaGradient)' : 'url(#liveSecAreaGradient)'}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={supabaseTelemetry} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />}
                      <XAxis dataKey="timestamp" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} />
                      <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d11',
                          borderColor: '#00ff66',
                          borderWidth: '1px',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      />
                      {alertSettings.enabled && (
                        <>
                          <ReferenceLine
                            y={alertSettings.warningThreshold}
                            stroke="#f59e0b"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                              value: `WARN: ${alertSettings.warningThreshold}`,
                              fill: '#f59e0b',
                              fontSize: 10,
                              position: 'insideTopRight',
                            }}
                          />
                          <ReferenceLine
                            y={alertSettings.criticalThreshold}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            strokeWidth={2}
                            label={{
                              value: `CRIT: ${alertSettings.criticalThreshold}`,
                              fill: '#ef4444',
                              fontSize: 10,
                              position: 'insideTopRight',
                            }}
                          />
                          {alertSettings.floorThreshold > 0 && (
                            <ReferenceLine
                              y={alertSettings.floorThreshold}
                              stroke="#38bdf8"
                              strokeDasharray="2 2"
                              strokeWidth={1}
                              label={{
                                value: `FLOOR: ${alertSettings.floorThreshold}`,
                                fill: '#38bdf8',
                                fontSize: 10,
                                position: 'insideBottomRight',
                              }}
                            />
                          )}
                        </>
                      )}
                      <Line
                        type="monotone"
                        dataKey={selectedYField}
                        stroke={selectedYField === 'value' ? '#00ff66' : '#00f0ff'}
                        strokeWidth={2.5}
                        dot={{ fill: '#00ff66', r: 3 }}
                        activeDot={{ r: 6, fill: '#ffffff', stroke: '#00ff66' }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  ) : chartType === 'bar' ? (
                    <BarChart data={supabaseTelemetry} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />}
                      <XAxis dataKey="timestamp" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} />
                      <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d11',
                          borderColor: '#00ff66',
                          borderWidth: '1px',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      />
                      {alertSettings.enabled && (
                        <>
                          <ReferenceLine
                            y={alertSettings.warningThreshold}
                            stroke="#f59e0b"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                              value: `WARN: ${alertSettings.warningThreshold}`,
                              fill: '#f59e0b',
                              fontSize: 10,
                              position: 'insideTopRight',
                            }}
                          />
                          <ReferenceLine
                            y={alertSettings.criticalThreshold}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            strokeWidth={2}
                            label={{
                              value: `CRIT: ${alertSettings.criticalThreshold}`,
                              fill: '#ef4444',
                              fontSize: 10,
                              position: 'insideTopRight',
                            }}
                          />
                        </>
                      )}
                      <Bar
                        dataKey={selectedYField}
                        fill={selectedYField === 'value' ? '#00ff66' : '#00f0ff'}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  ) : (
                    <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />}
                      <XAxis dataKey="timestamp" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} />
                      <YAxis dataKey={selectedYField} stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d11',
                          borderColor: '#00ff66',
                          borderWidth: '1px',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      />
                      {alertSettings.enabled && (
                        <>
                          <ReferenceLine
                            y={alertSettings.warningThreshold}
                            stroke="#f59e0b"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                              value: `WARN: ${alertSettings.warningThreshold}`,
                              fill: '#f59e0b',
                              fontSize: 10,
                              position: 'insideTopRight',
                            }}
                          />
                          <ReferenceLine
                            y={alertSettings.criticalThreshold}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            strokeWidth={2}
                            label={{
                              value: `CRIT: ${alertSettings.criticalThreshold}`,
                              fill: '#ef4444',
                              fontSize: 10,
                              position: 'insideTopRight',
                            }}
                          />
                        </>
                      )}
                      <Scatter
                        data={supabaseTelemetry}
                        fill={selectedYField === 'value' ? '#00ff66' : '#00f0ff'}
                        isAnimationActive={false}
                      />
                    </ScatterChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Supabase Telemetry Records Table */}
        <div className="bg-zinc-950 border border-emerald-900/60 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  REAL-TIME SUPABASE DOCUMENTS (/users/{user?.uid.slice(0, 6)}.../telemetry)
                </h2>
                <p className="text-xs text-zinc-400">
                  Every row change in Supabase triggers reactive Realtime updates.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setCurrentPage(0);
                  }}
                  placeholder="Search records..."
                  className="bg-black border border-zinc-800 pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 w-40 sm:w-48"
                />
              </div>

              <button
                onClick={seedInitialTelemetry}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase border border-zinc-700 cursor-pointer"
                title="Add 20 sample points to table"
              >
                + SEED 20 PTS
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Delete all telemetry records from your Supabase table?')) {
                    clearAllTelemetry();
                  }
                }}
                disabled={supabaseTelemetry.length === 0}
                className="px-3 py-1.5 bg-red-950/40 hover:bg-red-950/80 text-red-400 text-xs font-bold uppercase border border-red-900 cursor-pointer disabled:opacity-40"
              >
                CLEAR ALL
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60">
                  <th className="p-3 font-bold uppercase">DOC ID</th>
                  <th className="p-3 font-bold uppercase">TIMESTAMP</th>
                  <th className="p-3 font-bold uppercase">METRIC NAME</th>
                  <th className="p-3 font-bold uppercase">VALUE (PRIMARY)</th>
                  <th className="p-3 font-bold uppercase">SEC VALUE</th>
                  <th className="p-3 font-bold uppercase">UNIT</th>
                  <th className="p-3 font-bold uppercase">NODE</th>
                  <th className="p-3 font-bold uppercase">STATUS</th>
                  <th className="p-3 font-bold uppercase text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-zinc-500 italic">
                      {supabaseTelemetry.length === 0
                        ? 'No rows in table. Click "+ SEED 20 PTS" or "ADD METRIC POINT" above.'
                        : 'No matching records found for query.'}
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((r) => {
                    const isBreached = breachMetrics.breachedIds.has(r.id);
                    const isCritical = r.value >= alertSettings.criticalThreshold;
                    const highlight = isBreached && alertSettings.highlightRows && alertSettings.enabled;

                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors ${
                          highlight
                            ? isCritical
                              ? 'bg-red-950/30 border-l-4 border-l-red-500 hover:bg-red-950/50'
                              : 'bg-amber-950/25 border-l-4 border-l-amber-500 hover:bg-amber-950/45'
                            : 'hover:bg-zinc-900/40'
                        }`}
                      >
                        <td className="p-3 font-mono text-[11px] text-zinc-400">
                          <code>{r.id.length > 18 ? `${r.id.slice(0, 15)}...` : r.id}</code>
                        </td>
                        <td className="p-3 text-zinc-400 whitespace-nowrap">{r.timestamp}</td>
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <span>{r.metricName}</span>
                          {highlight && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 border uppercase ${
                                isCritical
                                  ? 'bg-red-900 text-red-200 border-red-500 animate-pulse'
                                  : 'bg-amber-900 text-amber-200 border-amber-500'
                              }`}
                            >
                              {isCritical ? 'CRITICAL LIMIT' : 'EXCEEDS LIMIT'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-sm">
                          <span
                            className={
                              highlight
                                ? isCritical
                                  ? 'text-red-400'
                                  : 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {r.value}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-cyan-400">
                          {r.secondaryValue !== undefined ? r.secondaryValue : '—'}
                        </td>
                        <td className="p-3 text-zinc-400">{r.unit || '—'}</td>
                        <td className="p-3 text-zinc-400">{r.node || '—'}</td>
                        <td className="p-3">
                          <span
                            className={`text-[9px] px-2 py-0.5 font-bold uppercase border ${
                              highlight
                                ? isCritical
                                  ? 'bg-red-950 text-red-300 border-red-600'
                                  : 'bg-amber-950 text-amber-300 border-amber-600'
                                : r.status === 'SPIKE'
                                ? 'bg-amber-950 text-amber-400 border-amber-800'
                                : r.status === 'OPTIMAL'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : r.status === 'CRITICAL'
                                ? 'bg-red-950 text-red-400 border-red-800'
                                : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            {highlight ? (isCritical ? 'CRITICAL' : 'LIMIT SPIKE') : r.status || 'NORMAL'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingRecord(r)}
                              className="p-1 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete Supabase telemetry document ${r.id}?`)) {
                                  deleteTelemetryPoint(r.id);
                                }
                              }}
                              className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-zinc-900 text-xs text-zinc-400">
              <div>
                Showing {currentPage * rowsPerPage + 1} to{' '}
                {Math.min((currentPage + 1) * rowsPerPage, filteredRecords.length)} of{' '}
                {filteredRecords.length} records
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-white">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* API Key Management Section (Isolated under /users/{user.uid}/apiKeys) */}
        <div className="bg-zinc-950 border border-emerald-900/60 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  INGESTION API TOKENS (public.api_keys)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Authenticated tokens for external Kafka/WebSocket telemetry producers piping data into your Supabase table.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsGeneratingKey(!isGeneratingKey)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>GENERATE NEW KEY</span>
            </button>
          </div>

          {/* New Key Form Modal/Box */}
          {isGeneratingKey && (
            <form
              onSubmit={handleGenerateKey}
              className="p-4 bg-zinc-900 border border-emerald-500/40 space-y-3"
            >
              <label className="text-xs text-emerald-400 font-bold uppercase block">
                CREATE NEW TELEMETRY INGESTION KEY
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production Cluster Ingestor"
                  className="flex-1 bg-black border border-zinc-700 text-white text-xs px-3 py-2 outline-none focus:border-emerald-400"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-400 text-black text-xs font-bold uppercase cursor-pointer hover:bg-emerald-300"
                  >
                    CREATE KEY
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGeneratingKey(false)}
                    className="px-3 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold uppercase cursor-pointer hover:bg-zinc-700"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* API Keys Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60">
                  <th className="p-3 font-bold uppercase">LABEL</th>
                  <th className="p-3 font-bold uppercase">SECRET TOKEN</th>
                  <th className="p-3 font-bold uppercase">CREATED</th>
                  <th className="p-3 font-bold uppercase text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-zinc-500 italic">
                      No API keys generated yet. Click "GENERATE NEW KEY" above.
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        {k.name}
                      </td>
                      <td className="p-3 font-mono text-emerald-400/90">
                        <code>{k.key}</code>
                      </td>
                      <td className="p-3 text-zinc-400">{k.created}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopy(k.key)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-zinc-300 hover:text-emerald-400 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === k.key ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">COPIED</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>COPY</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteKey(k.id)}
                            className="p-1 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                            title="Revoke Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Telemetry Modal */}
      {user && (
        <AddTelemetryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={async (rec) => {
            await addTelemetryPoint(rec);
          }}
          userUid={user.uid}
        />
      )}

      {/* Edit Telemetry Modal */}
      {user && (
        <EditTelemetryModal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          record={editingRecord}
          onUpdate={async (id, updates) => {
            await updateTelemetryPoint(id, updates);
          }}
          onDelete={async (id) => {
            await deleteTelemetryPoint(id);
          }}
          userUid={user.uid}
        />
      )}

      {/* Alert Threshold Configuration Modal */}
      <AlertThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        currentSettings={alertSettings}
        onSave={handleUpdateAlertThresholds}
        availableMetricNames={availableMetricNames}
      />
    </div>
  );
};
