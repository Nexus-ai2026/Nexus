import React, { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Wifi, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Metrics = {
  registered_users: number;
  datasets_processed: number;
  visualizations_created: number;
  api_requests: number;
  error_rate: number;
};

export const LiveTickerBar: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    registered_users: 0,
    datasets_processed: 0,
    visualizations_created: 0,
    api_requests: 0,
    error_rate: 0,
  });

  const loadMetrics = async () => {
    const { data, error } = await supabase.rpc('get_public_metrics');

    if (!error && data) {
      setMetrics(data);
    }
  };

  useEffect(() => {
    loadMetrics();

    const interval = setInterval(loadMetrics, 30000);

    return () => clearInterval(interval);
  }, []);

  const items = [
    {
      label: 'REGISTERED USERS',
      value: metrics.registered_users.toLocaleString(),
      icon: Users,
    },
    {
      label: 'DATASETS PROCESSED',
      value: metrics.datasets_processed.toLocaleString(),
      icon: HardDrive,
    },
    {
      label: 'VISUALIZATIONS',
      value: metrics.visualizations_created.toLocaleString(),
      icon: Cpu,
    },
    {
      label: 'API REQUESTS',
      value: metrics.api_requests.toLocaleString(),
      icon: Wifi,
    },
    {
      label: 'ERROR RATE',
      value: `${metrics.error_rate.toFixed(2)}%`,
      icon: Activity,
    },
  ];

  return (
    <section className="w-full bg-zinc-950 border-y border-emerald-950/60 py-4 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex flex-col p-3 rounded-xl bg-zinc-900/60 border border-emerald-900/30 hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-zinc-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  {item.label}
                </span>

                <span className="text-emerald-400 font-bold">
                  LIVE
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
