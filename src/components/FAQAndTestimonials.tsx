import React, { useState } from 'react';
import { ChevronDown, MessageSquare, Quote, ShieldCheck, Star } from 'lucide-react';

export const FAQAndTestimonials: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const testimonials = [
    {
      quote:
        'Nexus transformed our real-time high-frequency trading dashboard. Rendering 1.2M points at 60 FPS in dark mode with zero frame drops felt like moving from a slide show to instantaneous telemetry.',
      author: 'Dr. Elena Rostova',
      role: 'Head of Quantitative Infrastructure, Nova Capital',
      metric: '60 FPS @ 1.2M NODES',
    },
    {
      quote:
        'The canvas particle attraction and Fourier wave visualizer made complex acoustic spectrum analysis simple for our engineers. The aesthetic is second to none.',
      author: 'Marcus Vance',
      role: 'Principal Systems Architect, Cyberdyne Dynamics',
      metric: '< 0.38ms LATENCY',
    },
    {
      quote:
        'Replacing our legacy charts with Nexus cut client memory overhead by 92%. Our telemetry feeds look like something straight out of a futuristic film.',
      author: 'Siddharth Nair',
      role: 'Lead Data Visualization Specialist, Apex Networks',
      metric: '-92% MEMORY USAGE',
    },
  ];

  const faqs = [
    {
      q: 'How does Nexus achieve sub-millisecond visual rendering latency?',
      a: 'Nexus uses a zero-copy WebGL and HTML5 Canvas pipeline that bypasses JavaScript heap garbage collection by piping raw binary telemetry buffers directly to GPU texture memory.',
    },
    {
      q: 'Can I integrate Nexus with existing WebSocket and Kafka streams?',
      a: 'Yes! The Nexus TypeScript SDK and REST/gRPC endpoints support native streaming connectors for Apache Kafka, RabbitMQ, WebSocket feeds, and standard Prometheus metrics.',
    },
    {
      q: 'Is dark mode with neon accents customizable for custom branding?',
      a: 'Absolutely. While dark obsidian with neon green is our signature aesthetic, you can switch accent color palettes (Electric Cyan, Cyber Lime, Phosphor Mint) or pass custom GLSL color shaders.',
    },
    {
      q: 'Does Nexus support mobile devices and responsive touch screens?',
      a: 'Yes, all canvas visualizers adapt to screen width via ResizeObserver and support multi-touch particle attraction and ripple shockwaves.',
    },
  ];

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-20">
      {/* Testimonials */}
      <div className="space-y-10">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase mb-3">
            <Quote className="w-3.5 h-3.5 text-emerald-400" /> INDUSTRY VALIDATION
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Trusted by <span className="text-emerald-400">Low-Latency Teams</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-zinc-950 rounded-2xl border border-emerald-500/20 p-6 flex flex-col justify-between space-y-4 hover:border-emerald-400/50 transition-all shadow-[0_0_20px_rgba(0,255,102,0.03)]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 text-emerald-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-emerald-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {t.metric}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 italic leading-relaxed">"{t.quote}"</p>
              </div>

              <div className="border-t border-zinc-900 pt-3">
                <h4 className="text-sm font-bold text-white">{t.author}</h4>
                <p className="text-[11px] font-mono text-zinc-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-black text-white tracking-tight">
            Frequently Asked <span className="text-emerald-400">Questions</span>
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="rounded-xl bg-zinc-950 border border-emerald-950/80 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-4 text-left text-sm font-bold text-white flex items-center justify-between hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-emerald-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 text-xs font-mono text-zinc-400 border-t border-zinc-900/60 pt-3 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
