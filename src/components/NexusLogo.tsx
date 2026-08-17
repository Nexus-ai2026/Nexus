import React from 'react';

interface NexusLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full';
  subtitle?: string;
  className?: string;
  glow?: boolean;
}

export const NexusLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${className}`}
    >
      <defs>
        {/* Deep Luxury Sapphire to Emerald Gradients */}
        <linearGradient id="nexus-hex-top" x1="20" y1="10" x2="80" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="40%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        <linearGradient id="nexus-hex-left" x1="10" y1="40" x2="60" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <linearGradient id="nexus-hex-right" x1="40" y1="40" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="nexus-facet-bevel" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
        </linearGradient>

        {/* Ambient Bloom Filter */}
        <filter id="nexus-luxury-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background Micro Network Mesh Grid */}
      <circle cx="50" cy="50" r="44" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />

      {/* Central Interconnection Node Rays */}
      <line x1="50" y1="30" x2="28" y2="68" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="2 2" />
      <line x1="50" y1="30" x2="72" y2="68" stroke="#06b6d4" strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="2 2" />
      <line x1="28" y1="68" x2="72" y2="68" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="2 2" />

      {/* --- TOP HEXAGON NODE (Primary Cluster) --- */}
      <g filter="url(#nexus-luxury-glow)">
        {/* Main Solid Hexagon */}
        <polygon
          points="50,8 70,19.5 70,42.5 50,54 30,42.5 30,19.5"
          fill="url(#nexus-hex-top)"
          stroke="#60a5fa"
          strokeWidth="1.2"
        />
        {/* Hexagon Top Bevel Highlight */}
        <polygon
          points="50,11 67,21 50,31 33,21"
          fill="url(#nexus-facet-bevel)"
          opacity="0.6"
        />
        {/* Core Center Pulse */}
        <circle cx="50" cy="31" r="3.5" fill="#ffffff" />
        <circle cx="50" cy="31" r="1.5" fill="#0284c7" />
      </g>

      {/* --- BOTTOM-LEFT HEXAGON NODE --- */}
      <g filter="url(#nexus-luxury-glow)">
        <polygon
          points="28,46 48,57.5 48,80.5 28,92 8,80.5 8,57.5"
          fill="url(#nexus-hex-left)"
          stroke="#34d399"
          strokeWidth="1.2"
        />
        {/* Top Facet */}
        <polygon
          points="28,49 45,59 28,69 11,59"
          fill="url(#nexus-facet-bevel)"
          opacity="0.5"
        />
        {/* Center Node */}
        <circle cx="28" cy="69" r="3" fill="#ffffff" />
        <circle cx="28" cy="69" r="1.5" fill="#059669" />
      </g>

      {/* --- BOTTOM-RIGHT HEXAGON NODE --- */}
      <g filter="url(#nexus-luxury-glow)">
        <polygon
          points="72,46 92,57.5 92,80.5 72,92 52,80.5 52,57.5"
          fill="url(#nexus-hex-right)"
          stroke="#38bdf8"
          strokeWidth="1.2"
        />
        {/* Top Facet */}
        <polygon
          points="72,49 89,59 72,69 55,59"
          fill="url(#nexus-facet-bevel)"
          opacity="0.5"
        />
        {/* Center Node */}
        <circle cx="72" cy="69" r="3" fill="#ffffff" />
        <circle cx="72" cy="69" r="1.5" fill="#0284c7" />
      </g>

      {/* Glowing Center Bridge Intersection Spark */}
      <circle cx="50" cy="50" r="2" fill="#38bdf8" className="animate-ping" opacity="0.8" />
    </svg>
  );
};

export const NexusLogo: React.FC<NexusLogoProps> = ({
  size = 'md',
  variant = 'full',
  subtitle = 'Understands Your Data',
  className = '',
  glow = true,
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 24
      : size === 'md'
      ? 32
      : size === 'lg'
      ? 42
      : 52;

  const boxPixel = pixelSize + 12;

  return (
    <div className={`flex items-center gap-3.5 group select-none ${className}`}>
      {/* Hex-Frame Emblem Container */}
      <div
        className="relative flex items-center justify-center bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border border-cyan-500/30 group-hover:border-cyan-400/80 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.12)] group-hover:shadow-[0_0_30px_rgba(56,189,248,0.3)] backdrop-blur-md"
        style={{ width: `${boxPixel}px`, height: `${boxPixel}px` }}
      >
        <NexusLogoIcon size={pixelSize} className="group-hover:scale-105" />
        {glow && (
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-emerald-500/20 rounded-xl blur-md -z-10 group-hover:opacity-100 opacity-60 transition-opacity duration-300"></div>
        )}
      </div>

      {variant === 'full' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2 leading-none">
            {/* Bold Premium Display Wordmark matching reference */}
            <span className="text-21px font-black tracking-[0.12em] text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-cyan-200 group-hover:to-emerald-300 transition-all font-sans">
              NEXUS
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]"></span>
          </div>
          {subtitle && (
            <span className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase mt-1 font-semibold">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const LiveDemoIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size = 18,
}) => {
  return (
    <span className="relative inline-flex items-center justify-center shrink-0">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M4.93 4.93a10 10 0 0 1 14.14 0" className="opacity-60" />
        <path d="M7.76 7.76a6 6 0 0 1 8.48 0" className="opacity-90" />
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" strokeWidth="0" />
      </svg>
      <span className="absolute -top-1 -right-1 flex h-2 w-2 pointer-events-none">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-90"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
      </span>
    </span>
  );
};

export const SpeedLaunchIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size = 16,
}) => {
  return (
    <span className="relative inline-flex items-center justify-center shrink-0">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M12 2v3M4.93 4.93l2.12 2.12M2 12h3M19.07 4.93l-2.12 2.12M22 12h-3"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M3.5 14.5a8.5 8.5 0 1 1 17 0"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />
        <path
          d="M12 13l4-5-5 1.5-2.5 2.5 3.5 1z"
          fill="#00f2fe"
          stroke="#ffffff"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="13" r="2" fill="#34d399" />
        <path
          d="M9.5 14.5L7.5 17.5M10.5 15.5L10 18"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
};


