import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { AccentTheme, ChartType } from '../types';
import { THEME_CONFIGS } from '../lib/theme';
import { downsampleData } from '../lib/dataEngine';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Activity,
  Layers,
  Radio,
  Sliders,
  Play,
  Pause,
  RefreshCcw,
  Zap,
  Target,
  Maximize2,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Dot,
  FileSpreadsheet,
  Database,
} from 'lucide-react';

interface VisualizationSuiteProps {
  accentTheme: AccentTheme;
}

export const VisualizationSuite: React.FC<VisualizationSuiteProps> = ({ accentTheme }) => {
  const [activeTab, setActiveTab] = useState<'realtime-chart' | 'mesh' | 'waveform' | 'radar'>('realtime-chart');
  const theme = THEME_CONFIGS[accentTheme];

  const {
    currentDataset,
    metrics,
    secondaryMetrics,
    studioParams,
    updateStudioParams,
    wsConfig,
    disconnectWebSocket,
    connectWebSocket,
  } = useData();

  const [selectedChartType, setSelectedChartType] = useState<ChartType>('area');
  const [isPaused, setIsPaused] = useState(false);

  // Sync with studioParams if changed externally
  useEffect(() => {
    if (studioParams.chartType) {
      setSelectedChartType(studioParams.chartType);
    }
  }, [studioParams.chartType]);

  const handleChartTypeChange = (ct: ChartType) => {
    setSelectedChartType(ct);
    updateStudioParams({ chartType: ct });
  };

  // Prepare display data with optional downsampling for rendering performance
  const displayData = useMemo(() => {
    if (!currentDataset || !currentDataset.data || currentDataset.data.length === 0) {
      return [];
    }

    const rawData = currentDataset.data;
    if (rawData.length > 250 && studioParams.enableDownsampling) {
      return downsampleData(rawData, 250);
    }
    return rawData;
  }, [currentDataset, studioParams.enableDownsampling]);

  // Waveform Canvas Effect
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [waveType, setWaveType] = useState<'sine' | 'sawtooth' | 'fourier'>('fourier');
  const [waveFreq, setWaveFreq] = useState(2);
  const [waveAmp, setWaveAmp] = useState(40);

  useEffect(() => {
    if (activeTab !== 'waveform') return;
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const renderWave = () => {
      const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const height = (canvas.height = 360);

      ctx.fillStyle = '#080b0e';
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = 'rgba(0,255,102,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Main Waveform
      ctx.beginPath();
      ctx.strokeStyle = theme.primaryHex;
      ctx.lineWidth = 3;
      ctx.shadowColor = theme.primaryHex;
      ctx.shadowBlur = 15;

      const centerY = height / 2;

      for (let x = 0; x < width; x++) {
        const t = (x / width) * Math.PI * 2 * waveFreq + phase;
        let y = centerY;

        if (waveType === 'sine') {
          y += Math.sin(t) * waveAmp;
        } else if (waveType === 'sawtooth') {
          y += ((t % (Math.PI * 2)) / Math.PI - 1) * waveAmp;
        } else {
          // Fourier Harmonics Sum
          y += (Math.sin(t) + 0.33 * Math.sin(3 * t) + 0.2 * Math.sin(5 * t)) * waveAmp;
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Spectrum Bars at bottom
      const barCount = 32;
      const barWidth = width / barCount - 4;
      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.abs(Math.sin(phase + i * 0.2)) * 80 + 10;
        const x = i * (barWidth + 4) + 2;
        const y = height - barHeight;

        ctx.fillStyle = `rgba(${theme.glowRgb}, ${0.2 + (barHeight / 90) * 0.6})`;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      phase += 0.04;
      animId = requestAnimationFrame(renderWave);
    };

    animId = requestAnimationFrame(renderWave);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, waveType, waveFreq, waveAmp, accentTheme]);

  // Radar Canvas Effect
  useEffect(() => {
    if (activeTab !== 'radar') return;
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const targets = Array.from({ length: 8 }, () => ({
      dist: Math.random() * 120 + 30,
      angle: Math.random() * Math.PI * 2,
      id: `SAT-${Math.floor(Math.random() * 899 + 100)}`,
    }));

    const renderRadar = () => {
      const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const height = (canvas.height = 360);
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(cx, cy) - 20;

      ctx.fillStyle = '#050709';
      ctx.fillRect(0, 0, width, height);

      // Radar Concentric Circles
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.15)';
      ctx.lineWidth = 1;

      [0.25, 0.5, 0.75, 1].forEach((rRatio) => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * rRatio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // Sweeping Beam Line
      const sweepX = cx + Math.cos(angle) * maxR;
      const sweepY = cy + Math.sin(angle) * maxR;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.strokeStyle = theme.primaryHex;
      ctx.lineWidth = 2;
      ctx.shadowColor = theme.primaryHex;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Sweeping Sector Fade
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, angle - 0.4, angle);
      ctx.fillStyle = `rgba(${theme.glowRgb}, 0.15)`;
      ctx.fill();

      // Targets
      targets.forEach((tgt) => {
        const tx = cx + Math.cos(tgt.angle) * tgt.dist;
        const ty = cy + Math.sin(tgt.angle) * tgt.dist;

        const diff = Math.abs((angle % (Math.PI * 2)) - tgt.angle);
        const isHit = diff < 0.2;

        ctx.beginPath();
        ctx.arc(tx, ty, isHit ? 6 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isHit ? theme.primaryHex : 'rgba(0, 255, 102, 0.5)';
        if (isHit) {
          ctx.shadowColor = theme.primaryHex;
          ctx.shadowBlur = 10;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isHit) {
          ctx.strokeStyle = theme.primaryHex;
          ctx.strokeRect(tx - 10, ty - 10, 20, 20);
          ctx.font = '9px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(tgt.id, tx + 12, ty + 3);
        }
      });

      angle += 0.03;
      animId = requestAnimationFrame(renderRadar);
    };

    animId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(animId);
  }, [activeTab, accentTheme]);

  const xField = currentDataset?.xAxisField || 'time';
  const yField = currentDataset?.yAxisField || '';
  const secYField = currentDataset?.secondaryYAxisField;

  return (
    <section id="visualizations" className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-mono">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs uppercase mb-3">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> REAL DATA VISUALIZATION ENGINE
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Reactive Telemetry <span className="text-emerald-400">Suite</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-xl">
            Directly rendering the active dataset values with Line, Area, Bar, and Scatter engines. Mathematical stats are computed purely from actual loaded data.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded-xl border border-emerald-950/60 overflow-x-auto">
          {[
            { id: 'realtime-chart', label: 'Data Visualizer', icon: Activity },
            { id: 'mesh', label: 'Cluster Mesh', icon: Layers },
            { id: 'waveform', label: 'Signal Spectrum', icon: Radio },
            { id: 'radar', label: 'Radar Sweep', icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-400 text-black font-black shadow-[0_0_15px_rgba(0,255,102,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Visual Display Stage */}
      <div className="w-full bg-zinc-950 rounded-2xl border border-emerald-500/30 p-6 shadow-[0_0_40px_rgba(0,255,102,0.08)] relative overflow-hidden">
        {/* Tab 1: Real-time Data Visualizer (Line, Area, Bar, Scatter) */}
        {activeTab === 'realtime-chart' && (
          <div className="space-y-6">
            {/* Header controls bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                {currentDataset?.isLive ? (
                  <span className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    LIVE STREAMING ({currentDataset.rowCount} points)
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-xs text-cyan-400 font-bold">
                    <Database className="w-4 h-4 text-cyan-400" />
                    DATASET: {currentDataset?.name} ({currentDataset?.rowCount || 0} rows)
                  </span>
                )}

                <span className="text-zinc-600 hidden sm:inline">|</span>
                <span className="text-xs text-zinc-400">
                  X: <strong className="text-amber-300">{xField}</strong> • Y: <strong className="text-emerald-400">{yField || 'None'}</strong>
                  {secYField && (
                    <> • Y2: <strong className="text-cyan-400">{secYField}</strong></>
                  )}
                </span>
              </div>

              {/* Chart Type Selector */}
              <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
                {[
                  { id: 'area', label: 'Area', icon: TrendingUp },
                  { id: 'line', label: 'Line', icon: LineChartIcon },
                  { id: 'bar', label: 'Bar', icon: BarChart3 },
                  { id: 'scatter', label: 'Scatter', icon: Dot },
                ].map((ct) => {
                  const Icon = ct.icon;
                  const isSelected = selectedChartType === ct.id;
                  return (
                    <button
                      key={ct.id}
                      onClick={() => handleChartTypeChange(ct.id as ChartType)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-400 text-black font-bold shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {ct.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Render Selected Chart */}
            {!yField || displayData.length === 0 ? (
              <div className="h-[340px] flex flex-col items-center justify-center text-center p-6 bg-zinc-900/30 rounded-xl border border-zinc-800/80">
                <FileSpreadsheet className="w-10 h-10 text-emerald-400/60 mb-2 animate-pulse" />
                <h4 className="text-base font-bold text-white">No Numeric Data Selected</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-md">
                  Please upload a CSV / JSON file or select a sample dataset in the Data Source panel below with at least one numeric field.
                </p>
                <a
                  href="#datasource"
                  className="mt-4 px-4 py-2 bg-emerald-400 text-black font-bold text-xs rounded-xl hover:bg-emerald-300 transition-all cursor-pointer"
                >
                  GO TO DATA SOURCE PANEL →
                </a>
              </div>
            ) : (
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {selectedChartType === 'area' ? (
                    <AreaChart data={displayData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.primaryHex} stopOpacity={0.65} />
                          <stop offset="95%" stopColor={theme.primaryHex} stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="secondaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      {studioParams.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#18241d" />}
                      <XAxis
                        dataKey={xField}
                        stroke="#52525b"
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d10',
                          borderColor: 'rgba(0, 255, 102, 0.4)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Area
                        type={studioParams.smoothCurve ? 'monotone' : 'linear'}
                        dataKey={yField}
                        name={yField}
                        stroke={theme.primaryHex}
                        strokeWidth={studioParams.strokeWidth}
                        fillOpacity={1}
                        fill="url(#primaryAreaGrad)"
                        isAnimationActive={!currentDataset?.isLive}
                      />
                      {secYField && (
                        <Area
                          type={studioParams.smoothCurve ? 'monotone' : 'linear'}
                          dataKey={secYField}
                          name={secYField}
                          stroke="#00f0ff"
                          strokeWidth={studioParams.strokeWidth}
                          fillOpacity={1}
                          fill="url(#secondaryAreaGrad)"
                          isAnimationActive={!currentDataset?.isLive}
                        />
                      )}
                    </AreaChart>
                  ) : selectedChartType === 'line' ? (
                    <LineChart data={displayData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      {studioParams.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#18241d" />}
                      <XAxis
                        dataKey={xField}
                        stroke="#52525b"
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d10',
                          borderColor: 'rgba(0, 255, 102, 0.4)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Line
                        type={studioParams.smoothCurve ? 'monotone' : 'linear'}
                        dataKey={yField}
                        name={yField}
                        stroke={theme.primaryHex}
                        strokeWidth={studioParams.strokeWidth}
                        dot={{ r: studioParams.pointRadius, fill: theme.primaryHex }}
                        activeDot={{ r: studioParams.pointRadius + 3 }}
                        isAnimationActive={!currentDataset?.isLive}
                      />
                      {secYField && (
                        <Line
                          type={studioParams.smoothCurve ? 'monotone' : 'linear'}
                          dataKey={secYField}
                          name={secYField}
                          stroke="#00f0ff"
                          strokeWidth={studioParams.strokeWidth}
                          dot={{ r: studioParams.pointRadius, fill: '#00f0ff' }}
                          activeDot={{ r: studioParams.pointRadius + 3 }}
                          isAnimationActive={!currentDataset?.isLive}
                        />
                      )}
                    </LineChart>
                  ) : selectedChartType === 'bar' ? (
                    <BarChart data={displayData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      {studioParams.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#18241d" />}
                      <XAxis
                        dataKey={xField}
                        stroke="#52525b"
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d10',
                          borderColor: 'rgba(0, 255, 102, 0.4)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey={yField}
                        name={yField}
                        fill={theme.primaryHex}
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={!currentDataset?.isLive}
                      />
                      {secYField && (
                        <Bar
                          dataKey={secYField}
                          name={secYField}
                          fill="#00f0ff"
                          radius={[4, 4, 0, 0]}
                          isAnimationActive={!currentDataset?.isLive}
                        />
                      )}
                    </BarChart>
                  ) : (
                    <ScatterChart margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      {studioParams.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#18241d" />}
                      <XAxis
                        dataKey={xField}
                        name={xField}
                        stroke="#52525b"
                        tick={{ fill: '#71717a', fontSize: 11 }}
                      />
                      <YAxis
                        dataKey={yField}
                        name={yField}
                        stroke="#52525b"
                        tick={{ fill: '#71717a', fontSize: 11 }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{
                          backgroundColor: '#090d10',
                          borderColor: 'rgba(0, 255, 102, 0.4)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Scatter
                        name={yField}
                        data={displayData}
                        fill={theme.primaryHex}
                        isAnimationActive={!currentDataset?.isLive}
                      />
                    </ScatterChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}

            {/* Metrics Footer (Real Math only) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-900 text-xs">
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 block text-[10px]">AVG ({yField || 'N/A'})</span>
                <span className="text-base font-bold text-emerald-400">
                  {metrics.avg !== null ? metrics.avg : '—'}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 block text-[10px]">PEAK / MAX</span>
                <span className="text-base font-bold text-cyan-400">
                  {metrics.max !== null ? metrics.max : '—'}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 block text-[10px]">MINIMUM</span>
                <span className="text-base font-bold text-white">
                  {metrics.min !== null ? metrics.min : '—'}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 block text-[10px]">LATEST VALUE</span>
                <span className="text-base font-bold text-amber-400">
                  {metrics.latest !== null ? metrics.latest : '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Signal Spectrum Waveform */}
        {activeTab === 'waveform' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3 text-xs">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-bold">FOURIER HARMONIC SYNTHESIZER [SYNTHETIC DEMO]</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-400">WAVE TYPE:</span>
                {(['fourier', 'sine', 'sawtooth'] as const).map((wt) => (
                  <button
                    key={wt}
                    onClick={() => setWaveType(wt)}
                    className={`px-2.5 py-1 rounded text-[11px] uppercase cursor-pointer ${
                      waveType === wt
                        ? 'bg-emerald-400 text-black font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {wt}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full h-[360px] rounded-xl overflow-hidden border border-emerald-900/40 bg-zinc-950">
              <canvas ref={waveCanvasRef} className="w-full h-full block" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="flex items-center gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <span className="text-zinc-400">FREQUENCY: {waveFreq} Hz</span>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={waveFreq}
                  onChange={(e) => setWaveFreq(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <span className="text-zinc-400">AMPLITUDE: {waveAmp}</span>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={waveAmp}
                  onChange={(e) => setWaveAmp(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cluster Mesh */}
        {activeTab === 'mesh' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Layers className="w-4 h-4" />
                <span className="font-bold">CYBERNETIC NODE CLUSTER TOPOLOGY [SYNTHETIC DEMO]</span>
              </div>
              <span className="text-zinc-500">SIMULATED SPATIAL VIEW</span>
            </div>

            <div className="h-[360px] w-full rounded-xl bg-zinc-950 border border-emerald-900/40 relative flex items-center justify-center text-center p-6">
              <div className="space-y-3 max-w-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 mb-2 shadow-[0_0_20px_rgba(0,255,102,0.3)]">
                  <Layers className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white">Full Cluster Topology Stream</h3>
                <p className="text-zinc-400 text-xs">
                  Inspect cluster hierarchy, parent-child routing vectors, and dynamic load balancing across geo-distributed nodes.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <a
                    href="#sandbox"
                    className="px-4 py-2 bg-emerald-400 text-black font-bold rounded-lg hover:bg-emerald-300 transition-all cursor-pointer"
                  >
                    TUNE CLUSTER PARAMS
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Radar Sweep */}
        {activeTab === 'radar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <Target className="w-4 h-4" />
                <span className="font-bold">ORBITAL DATA RADAR & VECTOR SCANNER [SYNTHETIC DEMO]</span>
              </div>
              <span className="text-emerald-400">8 SATELLITES LOCKED</span>
            </div>

            <div className="relative w-full h-[360px] rounded-xl overflow-hidden border border-emerald-900/40 bg-zinc-950">
              <canvas ref={radarCanvasRef} className="w-full h-full block" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
