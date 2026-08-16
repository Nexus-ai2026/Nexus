export type AccentTheme = 'neon-green' | 'electric-cyan' | 'cyber-lime' | 'phosphor-mint';

export interface ThemeConfig {
  id: AccentTheme;
  name: string;
  primaryHex: string;
  glowRgb: string;
  accentClass: string;
  textNeonClass: string;
  borderClass: string;
}

export type DataSourceType = 'supabase' | 'csv' | 'json' | 'websocket' | 'sample';
export type ChartType = 'line' | 'area' | 'bar' | 'scatter';

export interface TelemetryRecord {
  id: string;
  userId: string;
  metricName: string;
  value: number;
  secondaryValue?: number;
  unit?: string;
  node?: string;
  status?: string;
  timestamp: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AlertThresholdSettings {
  enabled: boolean;
  metricFilter: string;
  warningThreshold: number;
  criticalThreshold: number;
  floorThreshold: number;
  highlightRows: boolean;
  soundAlert: boolean;
}

export interface DatasetState {
  id: string;
  name: string;
  sourceType: DataSourceType;
  data: Record<string, any>[];
  columns: string[];
  numericColumns: string[];
  timeColumns: string[];
  stringColumns: string[];
  xAxisField: string;
  yAxisField: string;
  secondaryYAxisField?: string;
  rowCount: number;
  isLive: boolean;
  lastUpdated: string;
}

export interface CalculatedMetrics {
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  median: number | null;
  latest: number | null;
  sum: number | null;
  stdDev: number | null;
}

export interface WebSocketConfig {
  url: string;
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';
  messageCount: number;
  byteCount: number;
  lastPayload: any;
  lastTimestamp: string | null;
  errorMessage: string | null;
  maxPoints: number;
}

export interface StudioParameters {
  chartType: ChartType;
  strokeWidth: number;
  pointRadius: number;
  smoothCurve: boolean;
  showGrid: boolean;
  glowIntensity: number;
  rollingWindowSize: number;
  enableDownsampling: boolean;
  accentColor: AccentTheme;
}

export interface VisControlParams {
  particleCount: number;
  speed: number;
  connectionDistance: number;
  waveFrequency: number;
  glowIntensity: number;
  showGrid: boolean;
  burstMode: boolean;
  accentColor: AccentTheme;
}

export interface MetricStreamPoint {
  time: string;
  throughput: number;
  latencyP50: number;
  latencyP99: number;
  activeNodes: number;
  bufferHealth: number;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'SUCCESS' | 'METRIC';
  message: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badge: string;
  type: 'canvas' | 'chart' | 'code' | 'mesh';
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  eventsLimit: string;
  features: string[];
  popular?: boolean;
}

