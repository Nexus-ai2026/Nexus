import React, { useEffect, useRef, useState } from 'react';
import { AccentTheme } from '../types';
import { THEME_CONFIGS } from '../lib/theme';
import { Play, Pause, RefreshCw, Zap, Sliders, Sparkles, Layers, Maximize2 } from 'lucide-react';
import { LiveDemoIcon } from './NexusLogo';

interface HeroCanvasProps {
  accentTheme: AccentTheme;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  pulsePhase: number;
  energy: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

export const HeroCanvas: React.FC<HeroCanvasProps> = ({ accentTheme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isRunning, setIsRunning] = useState(true);
  const [particleCount, setParticleCount] = useState(70);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [glowEnabled, setGlowEnabled] = useState(true);
  const [mode, setMode] = useState<'mesh' | 'cluster' | 'matrix' | 'force'>('mesh');
  const [fps, setFps] = useState(60);
  const [activeConnections, setActiveConnections] = useState(0);

  const theme = THEME_CONFIGS[accentTheme];

  // Mouse tracking
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // Initialize Particles
  const initParticles = (width: number, height: number, count: number) => {
    const arr: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 2.5 + 1.5;
      arr.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius,
        baseRadius: radius,
        color: theme.primaryHex,
        pulsePhase: Math.random() * Math.PI * 2,
        energy: Math.random(),
      });
    }
    particlesRef.current = arr;
  };

  // Canvas Resize & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initParticles(width, height, particleCount);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(container);

    const render = () => {
      if (!isRunning) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Calculate FPS
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      // Clear Canvas with subtle fade for motion trail
      ctx.fillStyle = 'rgba(5, 7, 9, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Draw Background Subtle Grid
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update & Render Particles
      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      let totalConn = 0;
      const maxDistance = mode === 'cluster' ? 180 : 120;

      // Update particles physics
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.pulsePhase += 0.03;
        const pulse = Math.sin(p.pulsePhase) * 0.8 + 1;

        // Mode specific movement
        if (mode === 'matrix') {
          p.vy = (p.baseRadius * 1.2) * speedMultiplier;
          p.vx = (Math.sin(p.pulsePhase * 0.5) * 0.3);
          p.y += p.vy;
          if (p.y > height) {
            p.y = 0;
            p.x = Math.random() * width;
          }
        } else {
          p.x += p.vx * speedMultiplier;
          p.y += p.vy * speedMultiplier;

          // Bounce off boundaries
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }

        // Mouse Magnetic Attraction
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const force = (150 - dist) / 150;
            p.x += (dx / dist) * force * 2.5 * speedMultiplier;
            p.y += (dy / dist) * force * 2.5 * speedMultiplier;
            p.radius = p.baseRadius * 2;
          } else {
            p.radius = p.baseRadius * pulse;
          }
        } else {
          p.radius = p.baseRadius * pulse;
        }

        // Draw Connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            totalConn++;
            const alpha = (1 - dist / maxDistance) * 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);

            ctx.strokeStyle = `rgba(${theme.glowRgb}, ${alpha})`;
            ctx.lineWidth = alpha * 1.8;

            if (glowEnabled && alpha > 0.3) {
              ctx.shadowColor = theme.primaryHex;
              ctx.shadowBlur = 8;
            } else {
              ctx.shadowBlur = 0;
            }

            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }

        // Draw Particle Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = theme.primaryHex;

        if (glowEnabled) {
          ctx.shadowColor = theme.primaryHex;
          ctx.shadowBlur = p.radius * 4;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      }

      setActiveConnections(totalConn);

      // Render Ripples
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 4 * speedMultiplier;
        r.opacity -= 0.02 * speedMultiplier;

        if (r.opacity <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${theme.glowRgb}, ${r.opacity})`;
        ctx.lineWidth = 2;
        if (glowEnabled) {
          ctx.shadowColor = theme.primaryHex;
          ctx.shadowBlur = 10;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Render Mouse Cursor Ring
      if (mouse.active) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 25, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${theme.glowRgb}, 0.4)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [isRunning, particleCount, speedMultiplier, glowEnabled, mode, accentTheme]);

  // Handle Mouse Events
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add Ripple Shockwave
    ripplesRef.current.push({
      x,
      y,
      radius: 5,
      maxRadius: 180,
      opacity: 0.9,
    });

    // Spawn 5 burst particles at click location
    for (let i = 0; i < 5; i++) {
      const radius = Math.random() * 3 + 2;
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius,
        baseRadius: radius,
        color: theme.primaryHex,
        pulsePhase: Math.random() * Math.PI * 2,
        energy: 1,
      });
    }
  };

  const triggerBurst = () => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Trigger center burst
    ripplesRef.current.push({
      x: width / 2,
      y: height / 2,
      radius: 10,
      maxRadius: width * 0.7,
      opacity: 1,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="relative w-full h-[520px] sm:h-[620px] rounded-2xl bg-zinc-950 border border-emerald-500/30 overflow-hidden shadow-[0_0_50px_rgba(0,255,102,0.12)] group cursor-crosshair select-none"
    >
      {/* Background HTML5 Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Radial Center Glow overlay */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40"></div>

      {/* Top HUD Stats Overlay */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-950/80 backdrop-blur-md rounded-xl border border-emerald-900/40 text-xs font-mono pointer-events-auto z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 font-bold">REAL-TIME ENGINE</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-zinc-400 border-l border-zinc-800 pl-3">
            <span>FPS: <strong className="text-white">{fps}</strong></span>
            <span>NODES: <strong className="text-white">{particlesRef.current.length}</strong></span>
            <span>LINKS: <strong className="text-emerald-400">{activeConnections}</strong></span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
          {(['mesh', 'cluster', 'matrix'] as const).map((m) => (
            <button
              key={m}
              onClick={(e) => {
                e.stopPropagation();
                setMode(m);
              }}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-md uppercase transition-all cursor-pointer ${
                mode === m
                  ? 'bg-emerald-500 text-black font-bold shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Center Overlay Text Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none z-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono tracking-widest uppercase mb-4 shadow-[0_0_20px_rgba(0,255,102,0.2)]">
          <Zap className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          SEE YOUR DATA CLEARLY • EXPLORE IT IN REAL TIME
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl leading-none">
          Next-Gen <span className="text-emerald-400 text-shadow-[0_0_25px_rgba(0,255,102,0.6)]">Real-Time</span> Data Visualization
        </h1>

        <p className="mt-4 text-sm sm:text-lg text-zinc-300 max-w-2xl font-normal leading-relaxed">
          Connect your data, explore it visually, and understand what matters faster. NEXUS gives you one clear workspace for turning complex data into actionable insights.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 pointer-events-auto">
          <a
            href="#visualizations"
            className="px-6 py-3 text-sm font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-[0_0_30px_rgba(0,255,102,0.5)] hover:shadow-[0_0_45px_rgba(0,255,102,0.8)] flex items-center gap-2.5 cursor-pointer group"
          >
            <LiveDemoIcon className="w-4 h-4 text-black group-hover:scale-110 transition-transform" size={18} />
            <span>START FREE</span>
          </a>

          <a
            href="visualizations"
            className="px-6 py-3 text-sm font-bold text-zinc-200 bg-zinc-900/90 border border-emerald-500/40 hover:border-emerald-400 hover:text-emerald-400 rounded-xl backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            SEE HOW IT WORKS
          </a>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-950/90 backdrop-blur-md rounded-xl border border-emerald-900/40 text-xs font-mono pointer-events-auto z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRunning(!isRunning);
            }}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-400 text-zinc-300 hover:text-emerald-400 cursor-pointer"
            title={isRunning ? 'Pause Canvas' : 'Play Canvas'}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerBurst();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" /> BURST WAVE
          </button>

          {/* Speed selector */}
          <div className="hidden md:flex items-center gap-1 text-zinc-400">
            <span>SPEED:</span>
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={(e) => {
                  e.stopPropagation();
                  setSpeedMultiplier(spd);
                }}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  speedMultiplier === spd
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Node Slider */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-zinc-400 text-[11px]">DENSITY ({particleCount}):</span>
          <input
            type="range"
            min="30"
            max="150"
            value={particleCount}
            onChange={(e) => {
              e.stopPropagation();
              setParticleCount(Number(e.target.value));
            }}
            className="w-24 sm:w-32 accent-emerald-400 cursor-pointer"
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setGlowEnabled(!glowEnabled);
            }}
            className={`px-2.5 py-1 rounded text-[11px] font-mono border ${
              glowEnabled
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
          >
            GLOW {glowEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
