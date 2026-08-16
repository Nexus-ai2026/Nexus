import React from 'react';
import { Sparkles, Terminal, Activity, Github, Twitter, Disc as Discord } from 'lucide-react';
import { NexusLogo, LiveDemoIcon, SpeedLaunchIcon } from './NexusLogo';

interface FooterCTAProps {
  onOpenTerminal: () => void;
}

export const FooterCTA: React.FC<FooterCTAProps> = ({ onOpenTerminal }) => {
  return (
    <footer className="w-full bg-black border-t border-emerald-950/80 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Glowing CTA Banner */}
        <div className="relative rounded-3xl bg-zinc-950 border border-emerald-500/40 p-8 sm:p-12 overflow-hidden shadow-[0_0_60px_rgba(0,255,102,0.15)] text-center space-y-6">
          <div className="absolute inset-0 bg-radial-gradient opacity-60 pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-mono uppercase shadow-[0_0_20px_rgba(0,255,102,0.35)] tracking-wider">
              <SpeedLaunchIcon className="w-4 h-4 text-emerald-400 animate-pulse" size={18} />
              <span className="font-bold">START VISUALIZING IN 60 SECONDS</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Upgrade to <span className="text-emerald-400 text-shadow-[0_0_20px_rgba(0,255,102,0.5)]">Neon Telemetry</span>?
            </h2>

            <p className="text-sm text-zinc-300 max-w-xl mx-auto font-normal">
              Join thousands of quantitative engineers, network analysts, and data architects rendering high-frequency streams with zero frame drops.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href="#visualizations"
                className="px-8 py-3.5 text-sm font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-[0_0_30px_rgba(0,255,102,0.6)] hover:shadow-[0_0_45px_rgba(0,255,102,0.8)] cursor-pointer flex items-center gap-2.5 group"
              >
                <LiveDemoIcon className="w-4 h-4 text-black group-hover:scale-110 transition-transform" size={18} />
                <span>EXPLORE VISUAL DEMOS NOW</span>
              </a>

              <button
                onClick={onOpenTerminal}
                className="px-6 py-3.5 text-sm font-mono text-emerald-400 bg-zinc-900 border border-emerald-500/40 hover:border-emerald-400 rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Terminal className="w-4 h-4" /> LAUNCH TERMINAL ⌘K
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation & Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs font-mono pt-8 border-t border-zinc-900">
          <div className="space-y-3">
            <NexusLogo variant="full" size="sm" subtitle="Real-time Visual Engine" />
            <p className="text-zinc-500 leading-relaxed">
              Sub-millisecond real-time data topology & telemetry visual engine for next-generation systems.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              ALL SYSTEMS OPERATIONAL • 99.998% UPTIME
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">VISUAL ENGINES</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><a href="#visualizations" className="hover:text-emerald-400 transition-colors">Cluster Mesh Topology</a></li>
              <li><a href="#visualizations" className="hover:text-emerald-400 transition-colors">Fourier Harmonic Waveform</a></li>
              <li><a href="#visualizations" className="hover:text-emerald-400 transition-colors">Streaming Telemetry Chart</a></li>
              <li><a href="#visualizations" className="hover:text-emerald-400 transition-colors">Orbital Radar Sweep</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">DEVELOPERS</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><button onClick={onOpenTerminal} className="hover:text-emerald-400 transition-colors cursor-pointer">TypeScript SDK</button></li>
              <li><button onClick={onOpenTerminal} className="hover:text-emerald-400 transition-colors cursor-pointer">Python Stream Engine</button></li>
              <li><button onClick={onOpenTerminal} className="hover:text-emerald-400 transition-colors cursor-pointer">Go Pipeline Connector</button></li>
              <li><button onClick={onOpenTerminal} className="hover:text-emerald-400 transition-colors cursor-pointer">REST / gRPC Endpoints</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-xs">GLOBAL EDGE LATENCY</h4>
            <div className="space-y-1.5 text-zinc-400 text-[11px]">
              <div className="flex justify-between"><span>US-East (NYC)</span><span className="text-emerald-400 font-bold">4.2ms</span></div>
              <div className="flex justify-between"><span>EU-Central (FRA)</span><span className="text-emerald-400 font-bold">11.8ms</span></div>
              <div className="flex justify-between"><span>Asia-East (TYO)</span><span className="text-emerald-400 font-bold">14.1ms</span></div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-zinc-600">
          <div>© 2026 NEXUS INC. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-emerald-400 transition-colors">Security Audit</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
