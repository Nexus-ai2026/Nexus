import React, { useState, useEffect } from 'react';
import { X, Save, Activity, Trash2 } from 'lucide-react';
import { TelemetryRecord } from '../types';

interface EditTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: TelemetryRecord | null;
  onUpdate: (id: string, updates: Partial<TelemetryRecord>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  userUid: string;
}

export const EditTelemetryModal: React.FC<EditTelemetryModalProps> = ({
  isOpen,
  onClose,
  record,
  onUpdate,
  onDelete,
  userUid,
}) => {
  const [metricName, setMetricName] = useState('');
  const [value, setValue] = useState<number | ''>('');
  const [secondaryValue, setSecondaryValue] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [node, setNode] = useState('');
  const [status, setStatus] = useState('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setMetricName(record.metricName || '');
      setValue(record.value !== undefined ? record.value : '');
      setSecondaryValue(record.secondaryValue !== undefined ? record.secondaryValue : '');
      setUnit(record.unit || '');
      setNode(record.node || '');
      setStatus(record.status || 'NORMAL');
      setError(null);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value === '' || isNaN(Number(value))) {
      setError('Please enter a valid numeric value.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onUpdate(record.id, {
        metricName: metricName.trim(),
        value: Number(value),
        secondaryValue: secondaryValue !== '' ? Number(secondaryValue) : undefined,
        unit: unit.trim(),
        node: node.trim(),
        status: status.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update telemetry document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete Supabase telemetry point ${record.id}?`)) return;
    setIsSubmitting(true);
    try {
      await onDelete(record.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete telemetry document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-emerald-500/60 max-w-lg w-full p-6 shadow-[0_0_50px_rgba(0,255,102,0.15)] font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              EDIT SUPABASE TELEMETRY POINT
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Isolation Path Note */}
        <div className="my-4 p-2.5 bg-emerald-950/30 border border-emerald-900/60 text-[11px] text-emerald-400">
          <span className="font-bold">TARGET SUPABASE PATH:</span>
          <code className="block text-white mt-0.5 truncate">
            /users/{userUid}/telemetry/{record.id}
          </code>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-400 uppercase text-[10px] mb-1">
              METRIC NAME
            </label>
            <input
              type="text"
              required
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1">
                PRIMARY NUMERIC VALUE
              </label>
              <input
                type="number"
                step="any"
                required
                value={value}
                onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 text-emerald-400 font-bold px-3 py-2 outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1">
                SECONDARY VALUE
              </label>
              <input
                type="number"
                step="any"
                value={secondaryValue}
                onChange={(e) => setSecondaryValue(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 text-cyan-400 font-bold px-3 py-2 outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1">UNIT</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-2.5 py-2 outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1">NODE TAG</label>
              <input
                type="text"
                value={node}
                onChange={(e) => setNode(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-2.5 py-2 outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1">STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-2 py-2 outline-none focus:border-emerald-400"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="OPTIMAL">OPTIMAL</option>
                <option value="SPIKE">SPIKE</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs uppercase font-bold border border-red-800 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>DELETE DOC</span>
            </button>

            <div className="flex items-center gap-3">
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
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold uppercase shadow-[0_0_15px_rgba(0,255,102,0.3)] cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'UPDATING...' : 'SAVE CHANGES'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
