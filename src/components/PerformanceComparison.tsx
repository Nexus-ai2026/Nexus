import React, { useState } from 'react';
import { Activity, Check, X, Zap, Shield, Sparkles } from 'lucide-react';

export const PerformanceComparison: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'fps' | 'latency' | 'memory'>('fps');

  return (
    <section id="benchmarks" className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase mb-3">
          <Activity className="w-3.5 h-3.5 text-emerald-400" /> PERFORMANCE BENCHMARKS
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Tested Against <span className="text-emerald-400">Legacy Visualization Tools</span>
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          See how Nexus compares against traditional monitoring stacks when processing 1 Million+ high-frequency events per second.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="w-full bg-zinc-950 rounded-2xl border border-emerald-500/30 overflow-hidden shadow-[0_0_30px_rgba(0,255,102,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-zinc-900/90 border-b border-emerald-950/80 text-zinc-400">
                <th className="p-4 text-sm font-bold text-white">CAPABILITY / METRIC</th>
                <th className="p-4 text-emerald-400 font-bold bg-emerald-950/40 border-x border-emerald-800/60">
                  ⚡ NEXUS ENGINE
                </th>
                <th className="p-4">TRADITIONAL DASHBOARDS</th>
                <th className="p-4">GENERIC CANVAS LIBS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              <tr>
                <td className="p-4 text-white font-medium">Render Frame Rate @ 1M Nodes</td>
                <td className="p-4 text-emerald-400 font-bold bg-emerald-950/20 border-x border-emerald-800/40">
                  60 FPS Solid
                </td>
                <td className="p-4 text-red-400">8 - 14 FPS (Laggy)</td>
                <td className="p-4 text-yellow-400">22 FPS</td>
              </tr>

              <tr>
                <td className="p-4 text-white font-medium">End-to-End Visual Latency</td>
                <td className="p-4 text-emerald-400 font-bold bg-emerald-950/20 border-x border-emerald-800/40">
                  &lt; 0.38 ms
                </td>
                <td className="p-4 text-zinc-400">45.0 ms</td>
                <td className="p-4 text-zinc-400">12.5 ms</td>
              </tr>

              <tr>
                <td className="p-4 text-white font-medium">Client Memory Overhead</td>
                <td className="p-4 text-emerald-400 font-bold bg-emerald-950/20 border-x border-emerald-800/40">
                  14 MB RAM
                </td>
                <td className="p-4 text-zinc-400">380 MB RAM</td>
                <td className="p-4 text-zinc-400">120 MB RAM</td>
              </tr>

              <tr>
                <td className="p-4 text-white font-medium">Zero-Copy WebGL Pipeline</td>
                <td className="p-4 text-emerald-400 bg-emerald-950/20 border-x border-emerald-800/40">
                  <Check className="w-5 h-5 text-emerald-400" />
                </td>
                <td className="p-4 text-zinc-500">
                  <X className="w-5 h-5 text-zinc-600" />
                </td>
                <td className="p-4 text-zinc-500">
                  <X className="w-5 h-5 text-zinc-600" />
                </td>
              </tr>

              <tr>
                <td className="p-4 text-white font-medium">Interactive Particle Physics</td>
                <td className="p-4 text-emerald-400 bg-emerald-950/20 border-x border-emerald-800/40">
                  <Check className="w-5 h-5 text-emerald-400" />
                </td>
                <td className="p-4 text-zinc-500">
                  <X className="w-5 h-5 text-zinc-600" />
                </td>
                <td className="p-4 text-yellow-400 font-medium">Partial</td>
              </tr>

              <tr>
                <td className="p-4 text-white font-medium">Real-Time Fourier Synthesizer</td>
                <td className="p-4 text-emerald-400 bg-emerald-950/20 border-x border-emerald-800/40">
                  <Check className="w-5 h-5 text-emerald-400" />
                </td>
                <td className="p-4 text-zinc-500">
                  <X className="w-5 h-5 text-zinc-600" />
                </td>
                <td className="p-4 text-zinc-500">
                  <X className="w-5 h-5 text-zinc-600" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
