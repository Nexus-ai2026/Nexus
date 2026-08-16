import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, X, Play, RefreshCw, Zap, Shield, ChevronRight } from 'lucide-react';
import { TerminalLog } from '../types';

interface TerminalConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TerminalConsoleModal: React.FC<TerminalConsoleModalProps> = ({ isOpen, onClose }) => {
  const [activeLang, setActiveLang] = useState<'ts' | 'python' | 'go' | 'rust' | 'curl'>('ts');
  const [copied, setCopied] = useState(false);
  const [isStreamingLogs, setIsStreamingLogs] = useState(false);
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: '1',
      timestamp: '10:59:01.002',
      level: 'INFO',
      message: 'Nexus Client v4.8 initialized with TLS 1.3 encryption',
    },
    {
      id: '2',
      timestamp: '10:59:01.045',
      level: 'SUCCESS',
      message: 'Connected to primary socket endpoint wss://stream.nexus.io/v1/topology',
    },
    {
      id: '3',
      timestamp: '10:59:01.120',
      level: 'METRIC',
      message: 'Subscribed to 1,284,912 active node vectors [Mesh Cluster Alpha]',
    },
  ]);

  // Code Snippets
  const codeSnippets = {
    ts: `import { NexusClient } from '@nexus/sdk';

const client = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY,
  cluster: 'us-east-1',
  renderEngine: 'canvas-gl',
});

// Subscribe to real-time topology stream
const stream = await client.subscribeTopology({
  particleDensity: 100,
  glowBloom: true,
  maxLatencyMs: 0.5,
});

stream.on('point', (vector) => {
  console.log(\`[Nexus] Node \${vector.id} Latency: \${vector.latencyMs}ms\`);
});`,

    python: `from nexus import NexusStreamEngine

engine = NexusStreamEngine(
    api_key="nexus_sk_live_99812a",
    cluster="eu-central-1",
    fps_target=60
)

# Connect to real-time visualization pipeline
@engine.on_frame
def render_vector_frame(frame_data):
    print(f"Processed {frame_data.particles_count} particles at {frame_data.fps} FPS")

engine.start_streaming()`,

    go: `package main

import (
	"fmt"
	"github.com/nexus-io/sdk/v4"
)

func main() {
	client := nexus.NewClient("nexus_sk_live_99812a")
	stream, err := client.ConnectStream("us-east-1")
	if err != nil {
		panic(err)
	}

	for vector := range stream.Events() {
		fmt.Printf("[Nexus Go] Node: %s Latency: %.2fms\\n", vector.ID, vector.Latency)
	}
}`,

    rust: `use nexus_sdk::NexusEngine;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::error::Error>> {
    let mut engine = NexusEngine::builder()
        .api_key("nexus_sk_live_99812a")
        .build()
        .await?;

    println!("Nexus Rust Pipeline Streaming Active...");
    Ok(())
}`,

    curl: `curl -X POST "https://api.nexus.io/v1/telemetry/stream" \\
  -H "Authorization: Bearer nexus_sk_live_99812a" \\
  -H "Content-Type: application/json" \\
  -d '{
    "cluster": "us-east-1",
    "nodes": 1200,
    "fpsTarget": 60,
    "glowBloom": true
  }'`,
  };

  // Log Stream Simulator
  useEffect(() => {
    if (!isStreamingLogs) return;

    const interval = setInterval(() => {
      const now = new Date();
      const ts = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const messages = [
        { level: 'INFO', msg: `Received binary telemetry packet frame #${Math.floor(Math.random() * 90000 + 10000)}` },
        { level: 'METRIC', msg: `Stream Throughput: ${(45 + Math.random() * 10).toFixed(1)} GB/s | Latency: ${(0.3 + Math.random() * 0.1).toFixed(2)}ms` },
        { level: 'SUCCESS', msg: `Zero-copy buffer synced with 1,284,912 topology nodes` },
      ] as const;

      const randomEntry = messages[Math.floor(Math.random() * messages.length)];

      setLogs((prev) => [
        ...prev.slice(-15),
        {
          id: String(Date.now()),
          timestamp: ts,
          level: randomEntry.level,
          message: randomEntry.msg,
        },
      ]);
    }, 1200);

    return () => clearInterval(interval);
  }, [isStreamingLogs]);

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-zinc-950 rounded-2xl border border-emerald-500/40 shadow-[0_0_50px_rgba(0,255,102,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Terminal Titlebar */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-emerald-900/40">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <span className="text-xs font-mono text-zinc-300 ml-2 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" /> NEXUS DEVELOPER CONSOLE // STREAM TERMINAL
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
          {/* Language Tab Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              {(
                [
                  { id: 'ts', label: 'TypeScript SDK' },
                  { id: 'python', label: 'Python Engine' },
                  { id: 'go', label: 'Go Pipeline' },
                  { id: 'rust', label: 'Rust Worker' },
                  { id: 'curl', label: 'cURL API' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLang(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    activeLang === tab.id
                      ? 'bg-emerald-500 text-black font-bold shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                      : 'text-zinc-400 hover:text-white bg-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-emerald-400 text-zinc-300 hover:text-emerald-400 rounded-lg cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'COPIED!' : 'COPY CODE'}
            </button>
          </div>

          {/* Code Viewer Box */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-950/80 text-emerald-300 overflow-x-auto leading-relaxed shadow-inner">
            <pre><code>{codeSnippets[activeLang]}</code></pre>
          </div>

          {/* Live Terminal Log Streamer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> LIVE WEBSOCKET LOG OUTPUT STREAM
              </span>

              <button
                onClick={() => setIsStreamingLogs(!isStreamingLogs)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer ${
                  isStreamingLogs
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50 animate-pulse'
                    : 'bg-emerald-400 text-black font-bold hover:bg-emerald-300'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                {isStreamingLogs ? 'STREAMING ACTIVE...' : 'EXECUTE STREAM DEMO'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2 h-48 overflow-y-auto font-mono text-[11px]">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <span className="text-zinc-500 shrink-0">[{log.timestamp}]</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] shrink-0 font-bold ${
                      log.level === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : log.level === 'METRIC'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-zinc-200">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>STATUS: ONLINE (0.38ms RTT)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg cursor-pointer"
          >
            CLOSE TERMINAL
          </button>
        </div>
      </div>
    </div>
  );
};
