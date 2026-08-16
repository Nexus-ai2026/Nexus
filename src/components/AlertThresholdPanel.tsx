import React from 'react';
import {
  AlertTriangle,
  Bell,
  Sliders,
  ShieldAlert,
  CheckCircle,
  TrendingUp,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Eye,
  Settings,
} from 'lucide-react';
import { AlertThresholdSettings, TelemetryRecord } from '../types';

interface AlertThresholdPanelProps {
  settings: AlertThresholdSettings;
  onUpdateSettings: (newSettings: Partial<AlertThresholdSettings>) => void;
  onOpenModal: () => void;
  latestRecord: TelemetryRecord | null;
  activeBreachesCount: number;
  criticalBreachesCount: number;
  availableMetricNames: string[];
}

export const AlertThresholdPanel: React.FC<AlertThresholdPanelProps> = ({
  settings,
  onUpdateSettings,
  onOpenModal,
  latestRecord,
  activeBreachesCount,
  criticalBreachesCount,
  availableMetricNames,
}) => {
  const isBreached =
    settings.enabled &&
    latestRecord &&
    (settings.metricFilter === 'ALL' || latestRecord.metricName === settings.metricFilter) &&
    (latestRecord.value >= settings.warningThreshold ||
      (settings.floorThreshold > 0 && latestRecord.value <= settings.floorThreshold));

  const isCritical =
    settings.enabled &&
    latestRecord &&
    (settings.metricFilter === 'ALL' || latestRecord.metricName === settings.metricFilter) &&
    latestRecord.value >= settings.criticalThreshold;

  return (
    <div
      className={`p-5 transition-all font-mono border ${
        isCritical
          ? 'bg-red-950/40 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.25)]'
          : isBreached
          ? 'bg-amber-950/30 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
          : 'bg-zinc-950 border-zinc-800'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2 border shrink-0 ${
              isCritical
                ? 'bg-red-900 text-red-300 border-red-500 animate-pulse'
                : isBreached
                ? 'bg-amber-900 text-amber-300 border-amber-500 animate-pulse'
                : settings.enabled
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-zinc-900 text-zinc-500 border-zinc-700'
            }`}
          >
            {isCritical ? (
              <ShieldAlert className="w-5 h-5" />
            ) : isBreached ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                ALERT THRESHOLD SENTINEL
              </h2>
              {settings.enabled ? (
                isCritical ? (
                  <span className="px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] uppercase animate-pulse border border-red-400">
                    🚨 CRITICAL LIMIT BREACH DETECTED
                  </span>
                ) : isBreached ? (
                  <span className="px-2 py-0.5 bg-amber-600 text-black font-bold text-[10px] uppercase animate-pulse border border-amber-400">
                    ⚠️ WARNING THRESHOLD EXCEEDED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 font-bold text-[10px] uppercase border border-emerald-800">
                    ✓ NOMINAL / WITHIN BOUNDS
                  </span>
                )
              ) : (
                <span className="px-2 py-0.5 bg-zinc-900 text-zinc-500 font-bold text-[10px] uppercase border border-zinc-800">
                  MONITORING DISABLED
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live numeric boundary evaluation synchronized with Supabase user preferences.
            </p>
          </div>
        </div>

        {/* Master Toggle & Quick Settings Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onUpdateSettings({ enabled: !settings.enabled })}
            className={`px-3 py-1.5 text-xs font-bold uppercase border transition-all cursor-pointer ${
              settings.enabled
                ? 'bg-amber-950/80 text-amber-300 border-amber-600 hover:bg-amber-900'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            {settings.enabled ? 'SENTINEL: ON' : 'SENTINEL: OFF'}
          </button>

          <button
            onClick={onOpenModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold uppercase transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>CONFIGURE LIMITS</span>
          </button>
        </div>
      </div>

      {/* Inline Quick Threshold Controls & Telemetry Metric Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        {/* Warning Threshold Config */}
        <div className="p-3 bg-zinc-900/90 border border-amber-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-400 uppercase font-bold">WARNING LIMIT (HIGH)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <input
              type="number"
              step="10"
              value={settings.warningThreshold}
              onChange={(e) => onUpdateSettings({ warningThreshold: Number(e.target.value) })}
              className="w-24 bg-black border border-amber-700 text-amber-300 font-mono font-black text-lg px-2 py-0.5 outline-none focus:border-amber-400"
            />
            <span className="text-[11px] text-zinc-400 font-mono">MB/s</span>
          </div>
          <div className="text-[10px] text-zinc-500">
            {activeBreachesCount > 0
              ? `${activeBreachesCount} point(s) exceed warning`
              : 'All points within warning'}
          </div>
        </div>

        {/* Critical Threshold Config */}
        <div className="p-3 bg-zinc-900/90 border border-red-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-red-400 uppercase font-bold">CRITICAL LIMIT (PEAK)</span>
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <input
              type="number"
              step="10"
              value={settings.criticalThreshold}
              onChange={(e) => onUpdateSettings({ criticalThreshold: Number(e.target.value) })}
              className="w-24 bg-black border border-red-700 text-red-300 font-mono font-black text-lg px-2 py-0.5 outline-none focus:border-red-400"
            />
            <span className="text-[11px] text-zinc-400 font-mono">MB/s</span>
          </div>
          <div className="text-[10px] text-zinc-500">
            {criticalBreachesCount > 0
              ? `🚨 ${criticalBreachesCount} point(s) exceed peak`
              : 'Zero peak breaches recorded'}
          </div>
        </div>

        {/* Metric Scope Filter */}
        <div className="p-3 bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase font-bold">MONITORED METRIC</span>
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="my-2">
            <select
              value={settings.metricFilter}
              onChange={(e) => onUpdateSettings({ metricFilter: e.target.value })}
              className="w-full bg-black border border-zinc-700 text-zinc-200 text-xs px-2 py-1 outline-none focus:border-amber-400 font-mono"
            >
              {availableMetricNames.map((name) => (
                <option key={name} value={name}>
                  {name === 'ALL' ? 'ALL METRICS (GLOBAL)' : name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-[10px] text-zinc-500">
            Scope: {settings.metricFilter === 'ALL' ? 'Global telemetry stream' : settings.metricFilter}
          </div>
        </div>

        {/* Active Alert State & Value Comparison */}
        <div
          className={`p-3 border flex flex-col justify-between ${
            isCritical
              ? 'bg-red-950/60 border-red-600'
              : isBreached
              ? 'bg-amber-950/60 border-amber-600'
              : 'bg-zinc-900/90 border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase font-bold">LATEST TELEMETRY VALUE</span>
            <TrendingUp
              className={`w-3.5 h-3.5 ${
                isCritical ? 'text-red-400' : isBreached ? 'text-amber-400' : 'text-emerald-400'
              }`}
            />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-xl font-black font-mono ${
                isCritical ? 'text-red-400' : isBreached ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {latestRecord?.value !== undefined ? latestRecord.value.toFixed(1) : '—'}
            </span>
            <span className="text-[11px] text-zinc-400">
              {latestRecord?.unit || 'MB/s'}
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 truncate">
            {latestRecord ? (
              isCritical ? (
                <span className="text-red-400 font-bold">
                  +{((latestRecord.value - settings.criticalThreshold)).toFixed(1)} above critical!
                </span>
              ) : isBreached ? (
                <span className="text-amber-400 font-bold">
                  +{((latestRecord.value - settings.warningThreshold)).toFixed(1)} above warning!
                </span>
              ) : (
                <span className="text-emerald-400">
                  {settings.warningThreshold - latestRecord.value > 0
                    ? `Safe margin: ${(settings.warningThreshold - latestRecord.value).toFixed(1)}`
                    : 'Within normal limits'}
                </span>
              )
            ) : (
              'Awaiting telemetry stream...'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
