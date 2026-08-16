import React, { useEffect, useRef } from 'react';
import { Cpu, ShieldCheck, Zap, Globe, CpuIcon, Layers, Server, Activity } from 'lucide-react';

export const FeatureBentoGrid: React.FC = () => {
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mini rotating WebGL-like canvas
  useEffect(() => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const renderMini = () => {
      const w = (canvas.width = canvas.parentElement?.clientWidth || 200);
      const h = (canvas.height = 140);
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = '#050709';
      ctx.fillRect(0, 0, w, h);

      // Rotating Hexagon
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.beginPath();
      const sides = 6;
      const radius = 40;
      for (let i = 0; i < sides; i++) {
        const a = (i * 2 * Math.PI) / sides;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 12;
      ctx.stroke();

      ctx.restore();

      angle += 0.02;
      animId = requestAnimationFrame(renderMini);
    };

    animId = requestAnimationFrame(renderMini);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <section id="features" className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase mb-3">
          <Layers className="w-3.5 h-3.5 text-emerald-400" /> BENTO ARCHITECTURE
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Engineered for <span className="text-emerald-400">Ultra-High Throughput</span>
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Built from the ground up for low-latency visual data aggregation, hardware acceleration, and zero-loss topology streaming.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Large Feature 1 */}
        <div className="md:col-span-2 bg-zinc-950 rounded-2xl border border-emerald-500/20 hover:border-emerald-400/50 p-6 transition-all group shadow-[0_0_20px_rgba(0,255,102,0.04)] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                <Zap className="w-6 h-6" />
              </span>
              <span className="text-xs font-mono text-emerald-400 border border-emerald-800 bg-emerald-950/60 px-2.5 py-1 rounded-full">
                0.38ms LATENCY
              </span>
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
              Zero-Copy Streaming Vector Pipeline
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bypasses standard CPU memory allocations by piping telemetry binary buffers directly into WebGL texture units for instant, high-frame-rate rendering.
            </p>
          </div>

          {/* Animated Mini Pulse Pipeline */}
          <div className="mt-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 font-mono text-xs text-zinc-300 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>BUFFER STREAM: LIVE</span>
              <span className="text-emerald-400">4,281,000 OPS/SEC</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 bg-emerald-400 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>

        {/* Feature 2: Hardware Acceleration */}
        <div className="bg-zinc-950 rounded-2xl border border-emerald-500/20 hover:border-emerald-400/50 p-6 transition-all group shadow-[0_0_20px_rgba(0,255,102,0.04)] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                <Cpu className="w-6 h-6" />
              </span>
              <span className="text-xs font-mono text-cyan-400">60 FPS GUARANTEE</span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              GPU Hardware Canvas Shader
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Custom GLSL shaders handle particle physics, bloom bloom, and magnetic field forces directly on the GPU.
            </p>
          </div>

          <div className="mt-4 rounded-xl overflow-hidden border border-emerald-900/40">
            <canvas ref={miniCanvasRef} className="w-full h-32 block" />
          </div>
        </div>

        {/* Feature 3: Anomaly Guard */}
        <div className="bg-zinc-950 rounded-2xl border border-emerald-500/20 hover:border-emerald-400/50 p-6 transition-all group shadow-[0_0_20px_rgba(0,255,102,0.04)]">
          <div className="space-y-3">
            <span className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 inline-block">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              Automatic Threat & Spike Detection
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real-time statistical anomaly monitoring flags latency spikes, buffer overflows, and rogue data nodes in under 2 milliseconds.
            </p>
          </div>
        </div>

        {/* Feature 4: Geo Edge Grid */}
        <div className="md:col-span-2 bg-zinc-950 rounded-2xl border border-emerald-500/20 hover:border-emerald-400/50 p-6 transition-all group shadow-[0_0_20px_rgba(0,255,102,0.04)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                Global Edge Synchronization Grid
              </h3>
              <p className="text-xs text-zinc-400">
                Synchronized state distribution across 45+ global edge locations with sub-15ms regional cross-pings.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full">
              45 REGIONS
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-2">
            {[
              { region: 'US-EAST (NYC)', ping: '4.2ms' },
              { region: 'EU-CENTRAL (FRA)', ping: '11.8ms' },
              { region: 'ASIA-EAST (TYO)', ping: '14.1ms' },
              { region: 'US-WEST (SFO)', ping: '6.5ms' },
            ].map((r, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col">
                <span className="text-zinc-500 text-[10px]">{r.region}</span>
                <span className="text-emerald-400 font-bold">{r.ping}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
