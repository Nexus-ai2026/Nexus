import React from 'react';

interface NexusLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full';
  subtitle?: string;
  className?: string;
  glow?: boolean;
}

export const NexusLogoIcon: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 32, className = '' }) => {
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
        <linearGradient
          id="nexus-mark"
          x1="20"
          y1="15"
          x2="80"
          y2="85"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>

        <filter
          id="nexus-glow"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Minimal N mark */}
      <g filter="url(#nexus-glow)">
        <path
          d="M22 74V26L50 74V26"
          stroke="url(#nexus-mark)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M50 26L78 74V26"
          stroke="url(#nexus-mark)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Small connection nodes */}
      <circle cx="22" cy="26" r="4" fill="#22d3ee" />
      <circle cx="50" cy="74" r="4" fill="#10b981" />
      <circle cx="78" cy="26" r="4" fill="#34d399" />
    </svg>
  );
};

export const NexusLogo: React.FC<NexusLogoProps> = ({
  size = 'md',
  variant = 'full',
  subtitle = 'Understand your data',
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
    <div
      className={`flex items-center gap-3 group select-none ${className}`}
    >
      <div
        className="relative flex items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 transition-all duration-300 group-hover:border-emerald-400/50 group-hover:bg-zinc-900"
        style={{
          width: `${boxPixel}px`,
          height: `${boxPixel}px`,
        }}
      >
        <NexusLogoIcon
          size={pixelSize}
          className="group-hover:scale-105"
        />

        {glow && (
          <div className="absolute -inset-1 -z-10 rounded-xl bg-emerald-400/10 blur-md opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
        )}
      </div>

      {variant === 'full' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2 leading-none">
            <span className="font-sans text-[21px] font-black tracking-[0.12em] text-white transition-colors duration-300 group-hover:text-emerald-300">
              NEXUS
            </span>

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>

          {subtitle && (
            <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const LiveDemoIcon: React.FC<{
  className?: string;
  size?: number;
}> = ({ className = 'w-4 h-4', size = 18 }) => {
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
        <polygon
          points="10 8 16 12 10 16 10 8"
          fill="currentColor"
          strokeWidth="0"
        />
      </svg>

      <span className="absolute -top-1 -right-1 flex h-2 w-2 pointer-events-none">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-90" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-200" />
      </span>
    </span>
  );
};

export const SpeedLaunchIcon: React.FC<{
  className?: string;
  size?: number;
}> = ({ className = 'w-4 h-4', size = 16 }) => {
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
