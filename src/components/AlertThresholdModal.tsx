import React, { useState, useEffect } from 'react';
import { X, Bell, AlertTriangle, ShieldAlert, Check, Sliders, Volume2, VolumeX, Eye } from 'lucide-react';
import { AlertThresholdSettings } from '../types';

interface AlertThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AlertThresholdSettings;
  onSave: (newSettings: AlertThresholdSettings) => Promise<void>;
  availableMetricNames: string[];
}

export const AlertThresholdModal: React.FC<AlertThresholdModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
  availableMetricNames,
}) => {
  const [enabled, setEnabled] = useState(currentSettings.enabled);
  const [metricFilter, setMetricFilter] = useState(currentSettings.metricFilter || 'ALL');
  const [warningThreshold, setWarningThreshold] = useState(currentSettings.warningThreshold);
  const [criticalThreshold, setCriticalThreshold] = useState(currentSettings.criticalThreshold);
  const [floorThreshold, setFloorThreshold] = useState(currentSettings.floorThreshold || 0);
  const [highlightRows, setHighlightRows] = useState(currentSettings.highlightRows ?? true);
  const [soundAlert, setSoundAlert] = useState(currentSettings.soundAlert ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEnabled(currentSettings.enabled);
      setMetricFilter(currentSettings.metricFilter || 'ALL');
      setWarningThreshold(currentSettings.warningThreshold);
      setCriticalThreshold(currentSettings.criticalThreshold);
      setFloorThreshold(currentSettings.floorThreshold || 0);
      setHighlightRows(currentSettings.highlightRows ?? true);
      setSoundAlert(currentSettings.soundAlert ?? false);
      setError(null);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (warningThreshold <= 0 && criticalThreshold <= 0) {
      setError('Please provide valid positive numeric threshold limits.');
      return;
    }
    if (criticalThreshold < warningThreshold) {
      setError('Critical threshold should generally be greater than or equal to warning threshold.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSave({
        enabled,
        metricFilter,
        warningThreshold: Number(warningThreshold),
        criticalThreshold: Number(criticalThreshold),
        floorThreshold: Number(floorThreshold),
        highlightRows,
        soundAlert,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save alert thresholds to Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPreset = (warn: number, crit: number, floor: number) => {
    setWarningThreshold(warn);
    setCriticalThreshold(crit);
    setFloorThreshold(floor);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-amber-500/60 max-w-xl w-full p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-950/60 border border-amber-600/80 text-amber-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                CONFIGURE TELEMETRY ALERT THRESHOLDS
              </h3>
              <p className="text-[10px] text-zinc-400">
                Define automated numeric bounds to trigger visual UI alerts and chart breach lines.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Main Master Switch */}
          <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2">
              <Bell className={`w-4 h-4 ${enabled ? 'text-amber-400' : 'text-zinc-500'}`} />
              <div>
                <span className="font-bold text-white uppercase block text-xs">
                  ENABLE REAL-TIME THRESHOLD MONITORING
                </span>
                <span className="text-[10px] text-zinc-400">
                  Activates real-time breach detection, chart reference lines & UI warnings
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`px-3 py-1 text-xs font-bold uppercase border cursor-pointer transition-all ${
                enabled
                  ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {enabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Metric Scope Filter */}
          <div>
            <label className="block text-zinc-400 uppercase text-[10px] mb-1">
              APPLY THRESHOLD TO METRIC SCOPE
            </label>
            <select
              value={metricFilter}
              onChange={(e) => setMetricFilter(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 outline-none focus:border-amber-400 font-mono text-xs"
            >
              {availableMetricNames.map((m) => (
                <option key={m} value={m}>
                  {m === 'ALL' ? '🌐 ALL METRICS (GLOBAL THRESHOLD)' : `📊 ${m}`}
                </option>
              ))}
            </select>
          </div>

          {/* Threshold Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Warning Limit */}
            <div className="p-3 bg-zinc-900/80 border border-amber-900/60">
              <label className="block text-amber-400 uppercase text-[10px] font-bold mb-1">
                ⚠️ WARNING LIMIT (HIGH)
              </label>
              <input
                type="number"
                step="any"
                required
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                className="w-full bg-black border border-amber-700/80 text-amber-300 font-mono font-bold text-sm px-2.5 py-1.5 outline-none focus:border-amber-400"
              />
              <span className="text-[9px] text-zinc-500 mt-1 block">Triggers amber warning banner</span>
            </div>

            {/* Critical Limit */}
            <div className="p-3 bg-zinc-900/80 border border-red-900/60">
              <label className="block text-red-400 uppercase text-[10px] font-bold mb-1">
                🚨 CRITICAL LIMIT (PEAK)
              </label>
              <input
                type="number"
                step="any"
                required
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="w-full bg-black border border-red-700/80 text-red-300 font-mono font-bold text-sm px-2.5 py-1.5 outline-none focus:border-red-400"
              />
              <span className="text-[9px] text-zinc-500 mt-1 block">Triggers red spike alert</span>
            </div>

            {/* Floor Limit */}
            <div className="p-3 bg-zinc-900/80 border border-cyan-900/60">
              <label className="block text-cyan-400 uppercase text-[10px] font-bold mb-1">
                📉 FLOOR LIMIT (LOW)
              </label>
              <input
                type="number"
                step="any"
                value={floorThreshold}
                onChange={(e) => setFloorThreshold(Number(e.target.value))}
                className="w-full bg-black border border-cyan-700/80 text-cyan-300 font-mono font-bold text-sm px-2.5 py-1.5 outline-none focus:border-cyan-400"
              />
              <span className="text-[9px] text-zinc-500 mt-1 block">Warns if metric drops below</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-zinc-400 uppercase text-[10px] mb-1.5">
              QUICK THRESHOLD PRESETS
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset(450, 520, 200)}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] cursor-pointer"
              >
                Standard (450 / 520 / 200)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(500, 580, 250)}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] cursor-pointer"
              >
                Heavy Ingestion (500 / 580 / 250)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(600, 700, 300)}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] cursor-pointer"
              >
                High-Capacity Spike (600 / 700 / 300)
              </button>
            </div>
          </div>

          {/* Visual Notification Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 p-2.5 bg-zinc-900 border border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={highlightRows}
                onChange={(e) => setHighlightRows(e.target.checked)}
                className="accent-amber-400"
              />
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-zinc-300 text-xs">Highlight Breached Table Rows</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-zinc-900 border border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={soundAlert}
                onChange={(e) => setSoundAlert(e.target.checked)}
                className="accent-amber-400"
              />
              <div className="flex items-center gap-1.5">
                {soundAlert ? (
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                )}
                <span className="text-zinc-300 text-xs">Browser Audio Beep on Spike</span>
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs uppercase font-bold border border-zinc-700 cursor-pointer"
            >
              CANCEL
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold uppercase shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'SAVING TO SUPABASE...' : 'SAVE ALERT THRESHOLDS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
