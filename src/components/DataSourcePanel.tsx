import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { AccentTheme } from '../types';
import { THEME_CONFIGS } from '../lib/theme';
import {
  Upload,
  FileSpreadsheet,
  FileCode,
  Radio,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Table,
  Sliders,
  Play,
  Square,
  Activity,
  Layers,
  ChevronDown,
  RefreshCw,
  Clock,
  TrendingUp,
  Hash,
  Database,
  Wifi,
  WifiOff,
  Code2,
} from 'lucide-react';

interface DataSourcePanelProps {
  accentTheme: AccentTheme;
}

export const DataSourcePanel: React.FC<DataSourcePanelProps> = ({ accentTheme }) => {
  const theme = THEME_CONFIGS[accentTheme];
  const {
    currentDataset,
    allDatasets,
    metrics,
    secondaryMetrics,
    wsConfig,
    dataError,
    clearDataError,
    loadCSV,
    loadJSON,
    loadSample,
    selectDataset,
    setAxes,
    connectWebSocket,
    disconnectWebSocket,
    setWsMaxPoints,
  } = useData();

  const [activeTab, setActiveTab] = useState<'csv' | 'json' | 'websocket' | 'samples' | 'preview'>('csv');
  const [dragOver, setDragOver] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');
  const [wsUrlInput, setWsUrlInput] = useState(wsConfig.url);
  const [previewPage, setPreviewPage] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File Handlers
  const handleFileUpload = (file: File) => {
    clearDataError();
    const reader = new FileReader();

    if (file.name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text')) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const success = loadCSV(text, file.name);
          if (success) {
            setActiveTab('preview');
          }
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.json') || file.type.includes('json')) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const success = loadJSON(text, file.name);
          if (success) {
            setActiveTab('preview');
          }
        }
      };
      reader.readAsText(file);
    } else {
      // Default try parsing as CSV, if fails try JSON
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          if (!loadCSV(text, file.name)) {
            loadJSON(text, file.name);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePasteJSON = () => {
    if (!jsonInputText.trim()) return;
    const success = loadJSON(jsonInputText, `pasted-data-${new Date().toLocaleTimeString()}.json`);
    if (success) {
      setActiveTab('preview');
      setJsonInputText('');
    }
  };

  const rowsPerPage = 8;
  const totalPages = currentDataset ? Math.ceil(currentDataset.data.length / rowsPerPage) : 0;
  const paginatedRows = currentDataset
    ? currentDataset.data.slice(previewPage * rowsPerPage, (previewPage + 1) * rowsPerPage)
    : [];

  return (
    <section id="datasource" className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-mono">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs uppercase mb-3">
            <Database className="w-3.5 h-3.5 text-emerald-400" /> REAL DATA INGESTION ENGINE
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Data Source <span className="text-emerald-400">Control Panel</span>
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Import real tabular data or connect live WebSocket streams. Automatically parses column types, calculates accurate statistics, and powers reactive telemetry charts.
          </p>
        </div>

        {/* Active Dataset Selector */}
        {allDatasets.length > 0 && (
          <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-emerald-900/60 text-xs">
            <span className="text-zinc-500 hidden sm:inline">DATASET:</span>
            <select
              value={currentDataset?.id || ''}
              onChange={(e) => selectDataset(e.target.value)}
              className="bg-zinc-900 text-emerald-400 font-bold px-3 py-1.5 rounded-lg border border-emerald-500/40 focus:outline-none cursor-pointer max-w-[240px] truncate"
            >
              {allDatasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.rowCount} rows)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error State Banner */}
      {dataError && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 flex items-start justify-between gap-3 animate-fade-in shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <strong className="text-white block text-xs">DATA VALIDATION ERROR</strong>
              <span className="text-xs">{dataError}</span>
            </div>
          </div>
          <button
            onClick={clearDataError}
            className="text-xs text-red-400 hover:text-white px-2 py-1 bg-red-900/40 rounded border border-red-800"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-zinc-950 rounded-2xl border border-emerald-500/30 p-6 shadow-[0_0_40px_rgba(0,255,102,0.06)] space-y-6">
        {/* Sub Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'csv', label: 'CSV Upload', icon: FileSpreadsheet },
              { id: 'json', label: 'JSON Ingestion', icon: FileCode },
              { id: 'websocket', label: 'Live WebSocket', icon: Radio },
              { id: 'samples', label: 'Sample Datasets', icon: Sparkles },
              { id: 'preview', label: 'Data Table & Axes', icon: Table },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-400 text-black font-black shadow-[0_0_15px_rgba(0,255,102,0.4)]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.id === 'websocket' && wsConfig.status === 'connected' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                  )}
                </button>
              );
            })}
          </div>

          {currentDataset && (
            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {currentDataset.name.replace(' [SAMPLE DATA]', '')}
              </span>
              <span className="text-zinc-600">|</span>
              <span>{currentDataset.rowCount} rows</span>
              <span className="text-zinc-600">|</span>
              <span>{currentDataset.numericColumns.length} numeric cols</span>
            </div>
          )}
        </div>

        {/* TAB 1: CSV Upload */}
        {activeTab === 'csv' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-emerald-400 bg-emerald-950/30 shadow-[0_0_30px_rgba(0,255,102,0.2)]'
                  : 'border-zinc-800 hover:border-emerald-500/60 bg-zinc-900/40 hover:bg-zinc-900/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="max-w-md mx-auto space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(0,255,102,0.2)]">
                  <Upload className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-base font-bold text-white">Drag & Drop CSV file or Browse</h3>
                <p className="text-xs text-zinc-400">
                  Parses real RFC 4180 CSV tables directly in-browser. Columns and numeric fields are auto-detected with strict fidelity (no fabricated values).
                </p>
                <button
                  type="button"
                  className="px-4 py-2 bg-zinc-900 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-400 hover:text-black transition-all cursor-pointer"
                >
                  SELECT CSV FILE (.csv)
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <span className="text-emerald-400 font-bold block">✓ Supported CSV Formats:</span>
              <p>• Header row with column labels (e.g. <code className="text-white">timestamp, latency, cpu, memory</code>)</p>
              <p>• Comma, tab, or semicolon separated values</p>
              <p>• Automatic type inference for numbers, strings, and timestamp strings</p>
            </div>
          </div>
        )}

        {/* TAB 2: JSON Ingestion */}
        {activeTab === 'json' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drag drop json */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/60 rounded-2xl p-6 text-center cursor-pointer bg-zinc-900/40 flex flex-col items-center justify-center"
              >
                <FileCode className="w-10 h-10 text-emerald-400 mb-2" />
                <h4 className="text-sm font-bold text-white">Upload JSON File (.json)</h4>
                <p className="text-xs text-zinc-400 mt-1">Supports arrays of objects or nested telemetry trees.</p>
              </div>

              {/* Paste JSON */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-300 font-bold block">Paste Raw JSON Array or Object:</label>
                <textarea
                  value={jsonInputText}
                  onChange={(e) => setJsonInputText(e.target.value)}
                  placeholder={'[\n  { "time": "12:00", "cpu": 45.2, "latency": 18.5 },\n  { "time": "12:01", "cpu": 68.1, "latency": 22.3 }\n]'}
                  rows={6}
                  className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-xs text-emerald-300 font-mono focus:border-emerald-400 focus:outline-none resize-none"
                />
                <button
                  onClick={handlePasteJSON}
                  disabled={!jsonInputText.trim()}
                  className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-bold text-xs rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.3)]"
                >
                  PARSE & LOAD JSON DATA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Live WebSocket Stream */}
        {activeTab === 'websocket' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* WS Control Form */}
              <div className="lg:col-span-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-300 font-bold flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" /> WebSocket Endpoint URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={wsUrlInput}
                      onChange={(e) => setWsUrlInput(e.target.value)}
                      placeholder="wss://echo.websocket.org"
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                    {wsConfig.status === 'connected' ? (
                      <button
                        onClick={disconnectWebSocket}
                        className="px-4 py-2 bg-red-900/80 border border-red-500/60 hover:bg-red-800 text-red-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" /> DISCONNECT
                      </button>
                    ) : (
                      <button
                        onClick={() => connectWebSocket(wsUrlInput)}
                        disabled={wsConfig.status === 'connecting'}
                        className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(0,255,102,0.4)]"
                      >
                        {wsConfig.status === 'connecting' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> CONNECTING...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" /> CONNECT WS
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Rolling Window buffer size */}
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="font-bold">Rolling Memory Window (Max Points):</span>
                    <strong className="text-emerald-400">{wsConfig.maxPoints} points</strong>
                  </div>
                  <div className="flex gap-2">
                    {[25, 50, 100, 200, 500].map((count) => (
                      <button
                        key={count}
                        onClick={() => setWsMaxPoints(count)}
                        className={`flex-1 py-1 rounded text-[11px] transition-all cursor-pointer ${
                          wsConfig.maxPoints === count
                            ? 'bg-emerald-400 text-black font-bold'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Limits browser memory allocation while maintaining high-frequency real-time updates.
                  </p>
                </div>

                {/* Status Indicator Bar */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">CONNECTION STATE</span>
                    <span
                      className={`font-bold flex items-center gap-1.5 mt-0.5 ${
                        wsConfig.status === 'connected'
                          ? 'text-emerald-400'
                          : wsConfig.status === 'connecting'
                          ? 'text-amber-400'
                          : wsConfig.status === 'error'
                          ? 'text-red-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {wsConfig.status === 'connected' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          LIVE STREAMING
                        </>
                      ) : wsConfig.status === 'connecting' ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                          CONNECTING
                        </>
                      ) : wsConfig.status === 'error' ? (
                        <>
                          <WifiOff className="w-3 h-3 text-red-400" />
                          FAILED
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3 text-zinc-500" />
                          STANDBY
                        </>
                      )}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">MESSAGES IN</span>
                    <span className="font-bold text-white text-base mt-0.5 block">
                      {wsConfig.messageCount.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">DATA RECEIVED</span>
                    <span className="font-bold text-cyan-400 text-base mt-0.5 block">
                      {(wsConfig.byteCount / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </div>

              {/* Latest Raw JSON Payload Inspector */}
              <div className="lg:col-span-6 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-emerald-400" /> Latest Received WebSocket Payload:
                  </span>
                  {wsConfig.lastTimestamp && (
                    <span className="text-zinc-500 text-[11px]">Last: {wsConfig.lastTimestamp}</span>
                  )}
                </div>

                <div className="h-[180px] bg-black rounded-xl border border-zinc-800 p-3 overflow-auto text-[11px] font-mono text-emerald-300">
                  {wsConfig.lastPayload ? (
                    <pre>{JSON.stringify(wsConfig.lastPayload, null, 2)}</pre>
                  ) : (
                    <span className="text-zinc-600 italic">
                      // Waiting for incoming WebSocket data packets...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Sample Testing Datasets (Clearly labeled SAMPLE DATA) */}
        {activeTab === 'samples' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Built-in Test Sample Datasets</h3>
                <span className="text-xs text-amber-400 font-mono block">
                  ★ Clearly labeled SAMPLE DATA (FOR TESTING ONLY)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  id: 'sample-server',
                  name: 'Server Telemetry',
                  desc: 'CPU %, Memory %, Latency P99, Sockets, Packet Loss',
                  icon: Activity,
                  rows: '41 rows',
                },
                {
                  id: 'sample-financial',
                  name: 'Financial Market',
                  desc: 'Price USD, Volume BTC, RSI, Orderbook Spread',
                  icon: Radio,
                  rows: '35 ticks',
                },
                {
                  id: 'sample-iot',
                  name: 'IoT Sensor Array',
                  desc: 'Temperature °C, Humidity %, Voltage, Power Watts',
                  icon: Layers,
                  rows: '30 reads',
                },
                {
                  id: 'sample-ecommerce',
                  name: 'E-Commerce Flow',
                  desc: 'Visitors, Cart Adds, Orders, Revenue USD, Conversion %',
                  icon: Sliders,
                  rows: '24 hours',
                },
              ].map((sample) => {
                const Icon = sample.icon;
                const isSelected = currentDataset?.id === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => loadSample(sample.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-[150px] ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_20px_rgba(0,255,102,0.25)]'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-emerald-500/50'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <Icon className="w-4 h-4 text-emerald-400" />
                        <span className="px-1.5 py-0.5 text-[9px] bg-amber-950/80 text-amber-400 rounded border border-amber-800/60 font-bold">
                          SAMPLE DATA
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{sample.name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{sample.desc}</p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-zinc-800">
                      <span>{sample.rows}</span>
                      <span className="text-emerald-400 font-bold">
                        {isSelected ? '✓ ACTIVE' : 'LOAD DATA →'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5 / Global: Data Table & Axis Mapping */}
        {currentDataset && (
          <div className="space-y-6 pt-4 border-t border-zinc-800/80">
            {/* Axis Selectors & Real Metrics Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* X-Axis Field */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> Select X-Axis (Domain / Time / Index):
                </label>
                <select
                  value={currentDataset.xAxisField}
                  onChange={(e) =>
                    setAxes(e.target.value, currentDataset.yAxisField, currentDataset.secondaryYAxisField)
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-emerald-400 focus:outline-none cursor-pointer"
                >
                  {currentDataset.columns.map((col) => (
                    <option key={col} value={col}>
                      {col} {currentDataset.timeColumns.includes(col) ? '🕒 (Time/Date)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary Y-Axis Field */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Select Primary Y-Axis (Metric):
                </label>
                <select
                  value={currentDataset.yAxisField}
                  onChange={(e) =>
                    setAxes(currentDataset.xAxisField, e.target.value, currentDataset.secondaryYAxisField)
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:border-emerald-400 focus:outline-none cursor-pointer"
                >
                  {currentDataset.numericColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Secondary Y-Axis Field */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" /> Secondary Y-Axis (Optional Series):
                </label>
                <select
                  value={currentDataset.secondaryYAxisField || ''}
                  onChange={(e) =>
                    setAxes(currentDataset.xAxisField, currentDataset.yAxisField, e.target.value || undefined)
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-cyan-400 font-bold focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  <option value="">-- None (Single Series) --</option>
                  {currentDataset.numericColumns
                    .filter((c) => c !== currentDataset.yAxisField)
                    .map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Accurate Calculated Metrics Bar (Never fake numbers for real data) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-400 font-bold">
                  ACTUAL DATASET STATISTICAL METRICS for <span className="text-emerald-400 font-black">{currentDataset.yAxisField}</span>:
                </span>
                <span className="text-zinc-500 text-[11px]">Computed mathematically from {metrics.count} rows</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs font-mono">
                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">TOTAL ROWS</span>
                  <span className="font-bold text-white text-sm">{metrics.count}</span>
                </div>

                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">MINIMUM</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {metrics.min !== null ? metrics.min : 'N/A'}
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">MAXIMUM</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {metrics.max !== null ? metrics.max : 'N/A'}
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">AVERAGE (MEAN)</span>
                  <span className="font-bold text-cyan-400 text-sm">
                    {metrics.avg !== null ? metrics.avg : 'N/A'}
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">MEDIAN</span>
                  <span className="font-bold text-cyan-400 text-sm">
                    {metrics.median !== null ? metrics.median : 'N/A'}
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">LATEST / CURRENT</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {metrics.latest !== null ? metrics.latest : 'N/A'}
                  </span>
                </div>

                <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">SUM TOTAL</span>
                  <span className="font-bold text-zinc-300 text-sm">
                    {metrics.sum !== null ? metrics.sum : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Real Data Preview Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 font-bold flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  Live Preview of Uploaded Rows (Page {previewPage + 1} of {Math.max(1, totalPages)}):
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewPage((p) => Math.max(0, p - 1))}
                      disabled={previewPage === 0}
                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 disabled:opacity-40 text-xs rounded hover:bg-zinc-800 text-zinc-300"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPreviewPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={previewPage >= totalPages - 1}
                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 disabled:opacity-40 text-xs rounded hover:bg-zinc-800 text-zinc-300"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              <div className="w-full overflow-x-auto rounded-xl border border-zinc-800 bg-black/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400">
                      <th className="py-2 px-3 border-r border-zinc-800/60 w-10 text-zinc-600">#</th>
                      {currentDataset.columns.map((col) => {
                        const isX = col === currentDataset.xAxisField;
                        const isY = col === currentDataset.yAxisField;
                        const isSecY = col === currentDataset.secondaryYAxisField;
                        const isNum = currentDataset.numericColumns.includes(col);
                        return (
                          <th key={col} className="py-2 px-3 border-r border-zinc-800/60 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-bold ${
                                  isY
                                    ? 'text-emerald-400'
                                    : isSecY
                                    ? 'text-cyan-400'
                                    : isX
                                    ? 'text-amber-300'
                                    : 'text-zinc-300'
                                }`}
                              >
                                {col}
                              </span>
                              {isY && (
                                <span className="px-1 py-0.2 bg-emerald-950 text-emerald-400 rounded text-[9px] border border-emerald-800 font-mono">
                                  Y-AXIS
                                </span>
                              )}
                              {isSecY && (
                                <span className="px-1 py-0.2 bg-cyan-950 text-cyan-400 rounded text-[9px] border border-cyan-800 font-mono">
                                  Y2
                                </span>
                              )}
                              {isX && (
                                <span className="px-1 py-0.2 bg-amber-950 text-amber-300 rounded text-[9px] border border-amber-800 font-mono">
                                  X-AXIS
                                </span>
                              )}
                              {isNum && !isY && !isSecY && (
                                <span className="text-[9px] text-zinc-600 font-mono">#</span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-zinc-900/80 hover:bg-zinc-900/50 transition-colors"
                      >
                        <td className="py-2 px-3 border-r border-zinc-800/60 text-zinc-600 text-[10px]">
                          {previewPage * rowsPerPage + idx + 1}
                        </td>
                        {currentDataset.columns.map((col) => {
                          const val = row[col];
                          const isY = col === currentDataset.yAxisField;
                          const isSecY = col === currentDataset.secondaryYAxisField;
                          return (
                            <td
                              key={col}
                              className={`py-2 px-3 border-r border-zinc-800/60 whitespace-nowrap ${
                                isY
                                  ? 'text-emerald-300 font-bold bg-emerald-950/20'
                                  : isSecY
                                  ? 'text-cyan-300 font-bold bg-cyan-950/20'
                                  : 'text-zinc-300'
                              }`}
                            >
                              {val !== null && val !== undefined ? String(val) : <span className="text-zinc-600 italic">null</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
