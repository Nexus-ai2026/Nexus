import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { AccentTheme, VisControlParams, ChartType } from '../types';
import { THEME_CONFIGS } from '../lib/theme';
import {
  Sliders,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Download,
  Code,
  Layers,
  TrendingUp,
  Activity,
  Zap,
  CheckCircle2,
} from 'lucide-react';

interface VisualStudioSandboxProps {
  accentTheme: AccentTheme;
}

export const VisualStudioSandbox: React.FC<VisualStudioSandboxProps> = ({ accentTheme }) => {
  const theme = THEME_CONFIGS[accentTheme];
  const { studioParams, updateStudioParams, currentDataset } = useData();

  const [activeTab, setActiveTab] = useState<'chart-params' | 'canvas-particles'>('chart-params');

  const [particleParams, setParticleParams] = useState<VisControlParams>({
    particleCount: 80,
    speed: 1.2,
    connectionDistance: 130,
    waveFrequency: 3,
    glowIntensity: 20,
    showGrid: true,
    burstMode: false,
    accentColor: accentTheme,
  });

  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas Sandbox Rendering
  useEffect(() => {
    if (activeTab !== 'canvas-particles') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    const height = (canvas.height = 420);

    // Initialize sandbox particles
    const particles = Array.from({ length: particleParams.particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * particleParams.speed * 2,
      vy: (Math.random() - 0.5) * particleParams.speed * 2,
      r: Math.random() * 2 + 1.5,
    }));

    const renderSandbox = () => {
      ctx.fillStyle = '#050709';
      ctx.fillRect(0, 0, width, height);

      // Grid
      if (particleParams.showGrid) {
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Update & Draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = theme.primaryHex;
        ctx.shadowColor = theme.primaryHex;
        ctx.shadowBlur = particleParams.glowIntensity;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw mesh lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < particleParams.connectionDistance) {
            const alpha = (1 - dist / particleParams.connectionDistance) * 0.4;
            ctx.strokeStyle = `rgba(${theme.glowRgb}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(renderSandbox);
    };

    animId = requestAnimationFrame(renderSandbox);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, particleParams, accentTheme]);

  const handleCopyConfig = () => {
    const config = {
      chartConfig: studioParams,
      activeDataset: currentDataset?.name,
      activeAxes: {
        x: currentDataset?.xAxisField,
        y: currentDataset?.yAxisField,
        y2: currentDataset?.secondaryYAxisField,
      },
      particleEngine: particleParams,
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="sandbox" className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs uppercase mb-3">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" /> VISUAL RENDERING STUDIO
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Visual Studio <span className="text-emerald-400">Sandbox</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-xl">
            Real-time visual parameter tuning. Changes dynamically modify chart curve smoothness, line weights, grid overlays, and canvas render loops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyConfig}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-zinc-900 border border-emerald-500/40 text-emerald-400 rounded-xl hover:bg-emerald-400 hover:text-black transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.15)]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" /> COPIED JSON
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> EXPORT CONFIG
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-zinc-950 rounded-2xl border border-emerald-500/30 p-6 shadow-[0_0_40px_rgba(0,255,102,0.06)]">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sub-tab selection */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-4 text-xs">
            <button
              onClick={() => setActiveTab('chart-params')}
              className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'chart-params'
                  ? 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Chart Rendering
            </button>
            <button
              onClick={() => setActiveTab('canvas-particles')}
              className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'canvas-particles'
                  ? 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Particle Topology
            </button>
          </div>

          {activeTab === 'chart-params' ? (
            <div className="space-y-4 text-xs">
              {/* Chart Type Selector */}
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold block">Engine Topology:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['area', 'line', 'bar', 'scatter'] as ChartType[]).map((ct) => (
                    <button
                      key={ct}
                      onClick={() => updateStudioParams({ chartType: ct })}
                      className={`py-2 rounded-lg uppercase text-[11px] font-bold transition-all cursor-pointer ${
                        studioParams.chartType === ct
                          ? 'bg-emerald-400 text-black'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stroke Width Slider */}
              <div className="space-y-1.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <div className="flex justify-between text-zinc-300">
                  <span>Line Stroke Width:</span>
                  <span className="text-emerald-400 font-bold">{studioParams.strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="0.5"
                  value={studioParams.strokeWidth}
                  onChange={(e) => updateStudioParams({ strokeWidth: Number(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Point Dot Radius */}
              <div className="space-y-1.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <div className="flex justify-between text-zinc-300">
                  <span>Data Point Dot Radius:</span>
                  <span className="text-emerald-400 font-bold">{studioParams.pointRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={studioParams.pointRadius}
                  onChange={(e) => updateStudioParams({ pointRadius: Number(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Smooth Spline Curve Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-zinc-300 font-bold">Monotone Spline Smoothing</span>
                <input
                  type="checkbox"
                  checked={studioParams.smoothCurve}
                  onChange={(e) => updateStudioParams({ smoothCurve: e.target.checked })}
                  className="w-4 h-4 accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Grid Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-zinc-300 font-bold">Cartesian Grid Overlay</span>
                <input
                  type="checkbox"
                  checked={studioParams.showGrid}
                  onChange={(e) => updateStudioParams({ showGrid: e.target.checked })}
                  className="w-4 h-4 accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Downsampling Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <div>
                  <span className="text-zinc-300 font-bold block">60 FPS Downsampling Guard</span>
                  <span className="text-[10px] text-zinc-500">Auto-samples datasets &gt; 250 rows</span>
                </div>
                <input
                  type="checkbox"
                  checked={studioParams.enableDownsampling}
                  onChange={(e) => updateStudioParams({ enableDownsampling: e.target.checked })}
                  className="w-4 h-4 accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Particle Count */}
              <div className="space-y-1.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <div className="flex justify-between text-zinc-300">
                  <span>Particle Node Density:</span>
                  <span className="text-emerald-400 font-bold">{particleParams.particleCount}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="160"
                  value={particleParams.particleCount}
                  onChange={(e) => setParticleParams((p) => ({ ...p, particleCount: Number(e.target.value) }))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Speed */}
              <div className="space-y-1.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <div className="flex justify-between text-zinc-300">
                  <span>Kinetic Velocity:</span>
                  <span className="text-emerald-400 font-bold">{particleParams.speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="4"
                  step="0.2"
                  value={particleParams.speed}
                  onChange={(e) => setParticleParams((p) => ({ ...p, speed: Number(e.target.value) }))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Connection Distance */}
              <div className="space-y-1.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <div className="flex justify-between text-zinc-300">
                  <span>Mesh Link Distance:</span>
                  <span className="text-emerald-400 font-bold">{particleParams.connectionDistance}px</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="220"
                  value={particleParams.connectionDistance}
                  onChange={(e) =>
                    setParticleParams((p) => ({ ...p, connectionDistance: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Glow */}
              <div className="space-y-1.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <div className="flex justify-between text-zinc-300">
                  <span>Photonic Glow Radius:</span>
                  <span className="text-emerald-400 font-bold">{particleParams.glowIntensity}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={particleParams.glowIntensity}
                  onChange={(e) =>
                    setParticleParams((p) => ({ ...p, glowIntensity: Number(e.target.value) }))
                  }
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Screen */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
            <span className="text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              REAL-TIME PARAMETER PREVIEW CANVAS
            </span>
            <span className="text-emerald-400 font-bold">60.0 FPS</span>
          </div>

          <div className="w-full h-[400px] bg-zinc-950 rounded-xl border border-emerald-900/40 relative overflow-hidden flex items-center justify-center">
            {activeTab === 'canvas-particles' ? (
              <canvas ref={canvasRef} className="w-full h-full block" />
            ) : (
              <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-400 shadow-[0_0_25px_rgba(0,255,102,0.2)]">
                  <TrendingUp className="w-10 h-10 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-base">Reactive Parameters Synced</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                    Modifications to stroke width ({studioParams.strokeWidth}px), spline mode ({studioParams.smoothCurve ? 'Enabled' : 'Linear'}), and chart style ({studioParams.chartType.toUpperCase()}) are instantly applied to the Reactive Telemetry Suite above.
                  </p>
                </div>
                <a
                  href="#visualizations"
                  className="px-4 py-2 bg-emerald-400 text-black font-bold text-xs rounded-xl hover:bg-emerald-300 transition-all cursor-pointer"
                >
                  VIEW APPLIED CHART IN TELEMETRY SUITE ↑
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
