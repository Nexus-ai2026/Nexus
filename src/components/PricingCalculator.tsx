import React, { useState } from 'react';
import { PricingPlan } from '../types';
import { Check, Sparkles, Zap, Shield, ChevronRight } from 'lucide-react';

export const PricingCalculator: React.FC = () => {
  const [isYearly, setIsYearly] = useState(true);
  const [eventsMillions, setEventsMillions] = useState(50);

  // Compute pricing multiplier based on event volume
  const scaleFactor = Math.sqrt(eventsMillions / 50);

  const plans: PricingPlan[] = [
    {
      id: 'dev',
      name: 'Developer Stream',
      tagline: 'Ideal for local debugging, prototypes, and small telemetry clusters.',
      priceMonthly: 0,
      priceYearly: 0,
      eventsLimit: 'Up to 10M Events / Mo',
      features: [
        'Single-cluster topology rendering',
        'Standard Canvas 2D engine',
        'Max 60 FPS capped',
        '100K active node mesh',
        'Community Discord Support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro Engine',
      tagline: 'For production streaming infrastructure requiring high frame rates.',
      priceMonthly: Math.round(79 * scaleFactor),
      priceYearly: Math.round(65 * scaleFactor),
      eventsLimit: `${eventsMillions}M Events / Mo`,
      features: [
        'Unlimited global cluster topology',
        'Hardware WebGL & Canvas Shaders',
        'Sub-millisecond latency pipeline',
        'Unlimited active node mesh',
        'Fourier Harmonic Synthesizer',
        '24/7 Dedicated Engineering SLA',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Cyber',
      tagline: 'Custom high-frequency trading, aerospace, and defense telemetry.',
      priceMonthly: Math.round(299 * scaleFactor),
      priceYearly: Math.round(249 * scaleFactor),
      eventsLimit: 'Custom Volume (1B+)',
      features: [
        'Custom GLSL Shader customizers',
        'Air-gapped on-prem deployment',
        'Zero-trust encryption & threat guard',
        'Custom hardware acceleration ASIC',
        'Dedicated Solutions Architect',
        'Custom SLA (< 0.1ms latency)',
      ],
    },
  ];

  return (
    <section id="pricing" className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase mb-3">
          <Zap className="w-3.5 h-3.5 text-emerald-400" /> TRANSPARENT PLAN CALCULATOR
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Flexible Pricing for <span className="text-emerald-400">Any Volume</span>
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Scale your visual data pipeline seamlessly from early stage prototypes to billion-event enterprise networks.
        </p>

        {/* Monthly/Yearly Toggle */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className={`text-xs font-mono ${!isYearly ? 'text-white font-bold' : 'text-zinc-400'}`}>
            MONTHLY
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-14 h-7 rounded-full bg-zinc-900 border border-emerald-500/40 p-1 cursor-pointer transition-colors"
          >
            <div
              className={`w-5 h-5 rounded-full bg-emerald-400 transition-transform ${
                isYearly ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-mono flex items-center gap-1 ${isYearly ? 'text-white font-bold' : 'text-zinc-400'}`}>
            ANNUAL <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-800">SAVE 20%</span>
          </span>
        </div>

        {/* Volume Slider */}
        <div className="mt-8 max-w-md mx-auto p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-2">
          <div className="flex justify-between text-zinc-300">
            <span>Monthly Telemetry Volume:</span>
            <strong className="text-emerald-400">{eventsMillions} Million Events</strong>
          </div>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={eventsMillions}
            onChange={(e) => setEventsMillions(Number(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const price = isYearly ? plan.priceYearly : plan.priceMonthly;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 bg-zinc-950 flex flex-col justify-between transition-all ${
                plan.popular
                  ? 'border-2 border-emerald-400 shadow-[0_0_35px_rgba(0,255,102,0.2)]'
                  : 'border border-emerald-950 hover:border-emerald-500/40'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-400 text-black font-mono font-bold text-[10px] rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,102,0.6)]">
                  RECOMMENDED FOR HIGH PERFORMANCE
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 min-h-[32px]">{plan.tagline}</p>
                </div>

                <div className="border-y border-zinc-900 py-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-mono font-black text-white">${price}</span>
                    <span className="text-xs font-mono text-zinc-400">/ month</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 block mt-1">
                    {plan.eventsLimit}
                  </span>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 text-xs text-zinc-300 font-mono">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`w-full mt-8 py-3 px-4 rounded-xl font-mono font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  plan.popular
                    ? 'bg-emerald-400 text-black hover:bg-emerald-300 shadow-[0_0_20px_rgba(0,255,102,0.4)]'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <span>DEPLOY STREAM NOW</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
