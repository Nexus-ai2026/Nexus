import React from 'react';
import { Activity, Cpu, HardDrive, Wifi, ArrowUpRight } from 'lucide-react';

export const LiveTickerBar: React.FC = () => {
  const metrics = [
  {
    label: 'ACTIVE USERS',
    value: '0',
    change: 'LIVE',
    icon: Activity,
  },
  {
    label: 'DATASETS PROCESSED',
    value: '0',
    change: 'LIVE',
    icon: HardDrive,
  },
  {
    label: 'VISUALIZATIONS',
    value: '0',
    change: 'LIVE',
    icon: Cpu,
  },
  {
    label: 'API REQUESTS',
    value: '0',
    change: 'LIVE',
    icon: Wifi,
  },
  {
    label: 'ERROR RATE',
    value: '0%',
    change: 'LIVE',
    icon: Activity,
  },
];

  

  return (
    <section className="w-full bg-zinc-950 border-y border-emerald-950/60 py-4 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex flex-col p-3 rounded-xl bg-zinc-900/60 border border-emerald-900/30 hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-zinc-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  {item.label}
                </span>
                <span className="text-emerald-400 flex items-center font-bold">
                  <ArrowUpRight className="w-3 h-3" />
                  {item.change}
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                {item.value}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
