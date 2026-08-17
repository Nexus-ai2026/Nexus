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
}> = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="nexus-logo-gradient" x1="8" y1="8" x2="40" y2="40">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="45%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <filter id="nexus-logo-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Minimal network nodes */}
      <circle cx="10" cy="10" r="2" fill="#22d3ee" opacity="0.8" />
      <circle cx="38" cy="10" r="2" fill="#10b981" opacity="0.8" />
      <circle cx="10" cy="38" r="2" fill="#10b981" opacity="0.8" />
      <circle cx="38" cy="38" r="2" fill="#22d3ee" opacity="0.8" />

      {/* Network connections */}
      <path
        d="M10 10L24 24L38 10"
        stroke="#22d3ee"
        strokeWidth="1"
        opacity="0.35"
      />

      <path
        d="M10 38L24 24L38 38"
        stroke="#10b981"
        strokeWidth="1"
        opacity="0.35"
      />

      {/* N */}
      <path
        d="M11 36V12L37 36V12"
        stroke="url(#nexus-logo-gradient)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#nexus-logo-glow)"
      />

      {/* Center nexus point */}
      <circle
        cx="24"
        cy="24"
        r="2.5"
        fill="#ffffff"
      />

      <circle
        cx="24"
        cy="24"
        r="5"
        stroke="#22d3ee"
        strokeWidth="1"
        opacity="0.35"
      />
    </svg>
  );
};

export const NexusLogo: React.FC<NexusLogoProps> = ({
  size = 'md',
  variant = 'full',
  subtitle = 'UNDERSTANDS YOUR DATA',
  className = '',
  glow = true,
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 26
      : size === 'md'
      ? 34
      : size === 'lg'
      ? 42
      : 52;

  return (
    <div
      className={`flex items-center gap-3 select-none ${className}`}
    >
      {/* Logo mark */}
      <div
        className={`
          relative flex items-center justify-center
          w-[46px] h-[46px]
          rounded-xl
          bg-zinc-950
          border border-white/10
          transition-all duration-300
          group-hover:border-cyan-400/40
          ${glow ? 'shadow-[0_0_24px_rgba(34,211,238,0.12)]' : ''}
        `}
      >
        <NexusLogoIcon
          size={pixelSize}
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {variant === 'full' && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span
              className="
                text-[22px]
                sm:text-[24px]
                font-extrabold
                tracking-[0.16em]
                leading-none
                text-white
              "
            >
              NEXUS
            </span>

            <span
              className="
                w-1.5 h-1.5
                rounded-full
                bg-emerald-400
                shadow-[0_0_8px_rgba(52,211,153,0.8)]
              "
            />
          </div>

          {subtitle && (
            <span
              className="
                mt-1.5
                text-[8px]
                sm:text-[9px]
                font-medium
                tracking-[0.24em]
                text-zinc-500
              "
            >
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
        <path
          d="M4.93 4.93a10 10 0 0 1 14.14 0"
          className="opacity-60"
        />
        <path
          d="M7.76 7.76a6 6 0 0 1 8.48 0"
          className="opacity-90"
        />
        <polygon
          points="10 8 16 12 10 16 10 8"
          fill="currentColor"
          strokeWidth="0"
        />
      </svg>

      <span className="absolute -top-1 -right-1 flex h-2 w-2 pointer-events-none">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-90" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200" />
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
