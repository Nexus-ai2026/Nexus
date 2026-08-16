import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext.tsx';
import {
  DatasetState,
  CalculatedMetrics,
  WebSocketConfig,
  StudioParameters,
  TelemetryRecord,
  ChartType,
  AccentTheme,
} from '../types';
import {
  parseCSVData,
  parseJSONData,
  calculateDatasetMetrics,
  getSampleDatasets,
  flattenObject,
  isNumeric,
  analyzeColumns,
} from '../lib/dataEngine';
import {
  subscribeToUserTelemetry,
  computeTelemetryStatistics,
  addSupabaseTelemetryPoint,
  updateSupabaseTelemetryPoint,
  deleteSupabaseTelemetryPoint,
  seedInitialSupabaseTelemetry,
  clearAllSupabaseTelemetry,
} from '../lib/supabaseTelemetry';

interface DataContextType {
  currentDataset: DatasetState | null;
  allDatasets: DatasetState[];
  metrics: CalculatedMetrics;
  secondaryMetrics: CalculatedMetrics | null;
  studioParams: StudioParameters;
  wsConfig: WebSocketConfig;
  dataError: string | null;
  clearDataError: () => void;
  // File & Stream Parsers (Separate features)
  loadCSV: (csvText: string, filename?: string) => boolean;
  loadJSON: (jsonText: string, filename?: string) => boolean;
  loadSample: (sampleKey: 'sample-server' | 'sample-financial' | 'sample-iot' | 'sample-ecommerce') => void;
  selectDataset: (id: string) => void;
  setAxes: (xAxis: string, yAxis: string, secondaryYAxis?: string) => void;
  updateStudioParams: (params: Partial<StudioParameters>) => void;
  connectWebSocket: (url: string) => void;
  disconnectWebSocket: () => void;
  setWsMaxPoints: (count: number) => void;
  // Supabase Live Telemetry (User Isolated to /users/{currentUser.uid}/telemetry)
  supabaseTelemetry: TelemetryRecord[];
  supabaseMetrics: CalculatedMetrics;
  supabaseLoading: boolean;
  supabaseError: string | null;
  clearSupabaseError: () => void;
  addTelemetryPoint: (record: {
    metricName: string;
    value: number;
    secondaryValue?: number;
    unit?: string;
    node?: string;
    status?: string;
    timestamp?: string;
  }) => Promise<string | undefined>;
  updateTelemetryPoint: (id: string, updates: Partial<TelemetryRecord>) => Promise<void>;
  deleteTelemetryPoint: (id: string) => Promise<void>;
  seedInitialTelemetry: () => Promise<void>;
  clearAllTelemetry: () => Promise<void>;
  isSupabaseStreaming: boolean;
  toggleSupabaseStream: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

const DEFAULT_STUDIO_PARAMS: StudioParameters = {
  chartType: 'area',
  strokeWidth: 2.5,
  pointRadius: 3,
  smoothCurve: true,
  showGrid: true,
  glowIntensity: 20,
  rollingWindowSize: 50,
  enableDownsampling: true,
  accentColor: 'neon-green',
};

const DEFAULT_WS_CONFIG: WebSocketConfig = {
  url: 'wss://ws.postman-echo.com/raw',
  status: 'idle',
  messageCount: 0,
  byteCount: 0,
  lastPayload: null,
  lastTimestamp: null,
  errorMessage: null,
  maxPoints: 50,
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const samples = useMemo(() => getSampleDatasets(), []);

  // Supabase Telemetry State
  const [supabaseTelemetry, setSupabaseTelemetry] = useState<TelemetryRecord[]>([]);
  const [supabaseLoading, setSupabaseLoading] = useState<boolean>(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [isSupabaseStreaming, setIsSupabaseStreaming] = useState<boolean>(false);
  const liveFeederInterval = useRef<any>(null);

  const [allDatasets, setAllDatasets] = useState<DatasetState[]>(() => [
    samples['sample-server'],
    samples['sample-financial'],
    samples['sample-iot'],
    samples['sample-ecommerce'],
  ]);

  const [currentDatasetId, setCurrentDatasetId] = useState<string>('sample-server');
  const [studioParams, setStudioParams] = useState<StudioParameters>(DEFAULT_STUDIO_PARAMS);
  const [wsConfig, setWsConfig] = useState<WebSocketConfig>(DEFAULT_WS_CONFIG);
  const [dataError, setDataError] = useState<string | null>(null);

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);
  const simulatedWsInterval = useRef<any>(null);

  // Clear errors
  const clearDataError = () => setDataError(null);
  const clearSupabaseError = () => setSupabaseError(null);

  // Real-time Supabase Listener strictly bound to public.telemetry (user_id)
  useEffect(() => {
    if (!user || !user.uid) {
      setSupabaseTelemetry([]);
      setSupabaseLoading(false);
      setSupabaseError(null);
      // Remove supabase dataset if logged out
      setAllDatasets((prev) => prev.filter((d) => d.id !== 'supabase-telemetry'));
      if (currentDatasetId === 'supabase-telemetry') {
        setCurrentDatasetId('sample-server');
      }
      return;
    }

    setSupabaseLoading(true);
    setSupabaseError(null);

    const unsubscribe = subscribeToUserTelemetry(
      user.uid,
      (records) => {
        setSupabaseTelemetry(records);
        setSupabaseLoading(false);
        setSupabaseError(null);

        // Convert Supabase telemetry into a reactive DatasetState
        const supabaseRows = records.map((r) => ({
          id: r.id,
          time: r.timestamp,
          timestamp: r.timestamp,
          metricName: r.metricName,
          value: r.value,
          secondaryValue: r.secondaryValue !== undefined ? r.secondaryValue : 0,
          unit: r.unit || '',
          node: r.node || '',
          status: r.status || 'NORMAL',
        }));

        const supabaseDataset: DatasetState = {
          id: 'supabase-telemetry',
          name: `🔥 Live Supabase Telemetry (/users/${user.uid.slice(0, 6)}.../telemetry)`,
          sourceType: 'supabase',
          data: supabaseRows,
          columns: ['time', 'metricName', 'value', 'secondaryValue', 'unit', 'node', 'status', 'id'],
          numericColumns: ['value', 'secondaryValue'],
          timeColumns: ['time', 'timestamp'],
          stringColumns: ['metricName', 'unit', 'node', 'status', 'id'],
          xAxisField: 'time',
          yAxisField: 'value',
          secondaryYAxisField: 'secondaryValue',
          rowCount: supabaseRows.length,
          isLive: true,
          lastUpdated: new Date().toISOString(),
        };

        setAllDatasets((prev) => {
          const filtered = prev.filter((d) => d.id !== 'supabase-telemetry');
          return [supabaseDataset, ...filtered];
        });
      },
      (err) => {
        setSupabaseLoading(false);
        setSupabaseError(err.message || 'Error subscribing to Supabase real-time telemetry.');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Compute Supabase metrics instantly from current live snapshot
  const supabaseMetrics = useMemo(() => {
    return computeTelemetryStatistics(supabaseTelemetry);
  }, [supabaseTelemetry]);

  // Active dataset
  const currentDataset = useMemo(() => {
    return allDatasets.find((d) => d.id === currentDatasetId) || allDatasets[0] || null;
  }, [allDatasets, currentDatasetId]);

  // Active metrics calculation
  const metrics = useMemo(() => {
    if (!currentDataset || !currentDataset.yAxisField) {
      return {
        count: 0,
        min: null,
        max: null,
        avg: null,
        median: null,
        latest: null,
        sum: null,
        stdDev: null,
      };
    }
    // If it's the supabase dataset, use accurate supabase metrics
    if (currentDataset.id === 'supabase-telemetry' && currentDataset.yAxisField === 'value') {
      return supabaseMetrics;
    }
    return calculateDatasetMetrics(currentDataset.data, currentDataset.yAxisField);
  }, [currentDataset, supabaseMetrics]);

  const secondaryMetrics = useMemo(() => {
    if (!currentDataset || !currentDataset.secondaryYAxisField) return null;
    return calculateDatasetMetrics(currentDataset.data, currentDataset.secondaryYAxisField);
  }, [currentDataset]);

  // Telemetry Operations with Supabase Auth User Isolation
  const addTelemetryPoint = async (record: {
    metricName: string;
    value: number;
    secondaryValue?: number;
    unit?: string;
    node?: string;
    status?: string;
    timestamp?: string;
  }) => {
    if (!user) {
      setSupabaseError('Please sign in to add telemetry records to Supabase.');
      return undefined;
    }
    try {
      const docId = await addSupabaseTelemetryPoint(user.uid, record);
      return docId;
    } catch (err: any) {
      setSupabaseError(err?.message || 'Failed to add telemetry point to Supabase.');
      throw err;
    }
  };

  const updateTelemetryPoint = async (id: string, updates: Partial<TelemetryRecord>) => {
    if (!user) {
      setSupabaseError('Please sign in to update telemetry records in Supabase.');
      return;
    }
    try {
      await updateSupabaseTelemetryPoint(user.uid, id, updates);
    } catch (err: any) {
      setSupabaseError(err?.message || 'Failed to update telemetry record in Supabase.');
      throw err;
    }
  };

  const deleteTelemetryPoint = async (id: string) => {
    if (!user) {
      setSupabaseError('Please sign in to delete telemetry records from Supabase.');
      return;
    }
    try {
      await deleteSupabaseTelemetryPoint(user.uid, id);
    } catch (err: any) {
      setSupabaseError(err?.message || 'Failed to delete telemetry record from Supabase.');
      throw err;
    }
  };

  const seedInitialTelemetry = async () => {
    if (!user) {
      setSupabaseError('Please sign in to seed telemetry records into Supabase.');
      return;
    }
    try {
      setSupabaseLoading(true);
      await seedInitialSupabaseTelemetry(user.uid);
    } catch (err: any) {
      setSupabaseError(err?.message || 'Failed to seed telemetry batch into Supabase.');
    } finally {
      setSupabaseLoading(false);
    }
  };

  const clearAllTelemetry = async () => {
    if (!user) return;
    try {
      setSupabaseLoading(true);
      await clearAllSupabaseTelemetry(user.uid, supabaseTelemetry);
    } catch (err: any) {
      setSupabaseError(err?.message || 'Failed to clear telemetry from Supabase.');
    } finally {
      setSupabaseLoading(false);
    }
  };

  // Live Supabase Stream Generator: periodically writes documents into Supabase /users/{user.uid}/telemetry
  const toggleSupabaseStream = () => {
    if (!user) {
      setSupabaseError('Authentication required to stream telemetry directly to Supabase.');
      return;
    }

    if (isSupabaseStreaming) {
      if (liveFeederInterval.current) {
        clearInterval(liveFeederInterval.current);
        liveFeederInterval.current = null;
      }
      setIsSupabaseStreaming(false);
    } else {
      setIsSupabaseStreaming(true);
      liveFeederInterval.current = setInterval(async () => {
        if (!user) return;
        const now = new Date();
        const baseVal = 460 + Math.sin(Date.now() / 5000) * 120;
        const randomJitter = (Math.random() * 30 - 15);
        const val = +(baseVal + randomJitter).toFixed(2);
        const secVal = +(10 + Math.cos(Date.now() / 4000) * 6 + Math.random() * 2).toFixed(2);
        const nodes = ['us-east-1a', 'us-east-1b', 'eu-west-1a', 'ap-southeast-1'];

        try {
          await addSupabaseTelemetryPoint(user.uid, {
            metricName: 'Live Cluster Ingestion',
            value: val,
            secondaryValue: secVal,
            unit: 'MB/s',
            node: nodes[Math.floor(Math.random() * nodes.length)],
            status: val > 550 ? 'SPIKE' : val < 380 ? 'OPTIMAL' : 'NORMAL',
            timestamp: now.toTimeString().split(' ')[0],
          });
        } catch (err) {
          console.error('Auto streaming telemetry error:', err);
        }
      }, 2000);
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (liveFeederInterval.current) {
        clearInterval(liveFeederInterval.current);
      }
    };
  }, []);

  // CSV & JSON Parsers (Separate features)
  const userPrefix = user?.uid ? `usr-${user.uid}-` : 'guest-';

  const loadCSV = (csvText: string, filename = 'uploaded_data.csv'): boolean => {
    setDataError(null);
    const { dataset, error } = parseCSVData(csvText, filename);

    if (error || !dataset) {
      setDataError(error || 'Failed to process CSV file.');
      return false;
    }

    dataset.id = `${userPrefix}csv-${Date.now()}`;
    setAllDatasets((prev) => [dataset, ...prev]);
    setCurrentDatasetId(dataset.id);
    return true;
  };

  const loadJSON = (jsonText: string, filename = 'uploaded_data.json'): boolean => {
    setDataError(null);
    const { dataset, error } = parseJSONData(jsonText, filename);

    if (error || !dataset) {
      setDataError(error || 'Failed to process JSON file.');
      return false;
    }

    dataset.id = `${userPrefix}json-${Date.now()}`;
    setAllDatasets((prev) => [dataset, ...prev]);
    setCurrentDatasetId(dataset.id);
    return true;
  };

  const loadSample = (sampleKey: 'sample-server' | 'sample-financial' | 'sample-iot' | 'sample-ecommerce') => {
    setDataError(null);
    const sample = samples[sampleKey];
    if (sample) {
      const freshSamples = getSampleDatasets();
      const freshSample = freshSamples[sampleKey];
      setAllDatasets((prev) => {
        const filtered = prev.filter((d) => d.id !== sampleKey);
        return [freshSample, ...filtered];
      });
      setCurrentDatasetId(sampleKey);
    }
  };

  const selectDataset = (id: string) => {
    setDataError(null);
    const found = allDatasets.find((d) => d.id === id);
    if (found) {
      setCurrentDatasetId(id);
    }
  };

  const setAxes = (xAxis: string, yAxis: string, secondaryYAxis?: string) => {
    if (!currentDataset) return;
    setAllDatasets((prev) =>
      prev.map((d) =>
        d.id === currentDataset.id
          ? {
              ...d,
              xAxisField: xAxis,
              yAxisField: yAxis,
              secondaryYAxisField: secondaryYAxis,
            }
          : d
      )
    );
  };

  const updateStudioParams = (params: Partial<StudioParameters>) => {
    setStudioParams((prev) => ({ ...prev, ...params }));
  };

  const setWsMaxPoints = (count: number) => {
    const clamped = Math.max(10, Math.min(1000, count));
    setWsConfig((prev) => ({ ...prev, maxPoints: clamped }));
    updateStudioParams({ rollingWindowSize: clamped });
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (simulatedWsInterval.current) {
      clearInterval(simulatedWsInterval.current);
      simulatedWsInterval.current = null;
    }
    setWsConfig((prev) => ({
      ...prev,
      status: 'disconnected',
    }));
  };

  // Clean up WS on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (simulatedWsInterval.current) {
        clearInterval(simulatedWsInterval.current);
      }
    };
  }, []);

  // Connect WebSocket implementation
  const connectWebSocket = (targetUrl: string) => {
    disconnectWebSocket();
    setDataError(null);

    const trimmedUrl = targetUrl.trim();
    if (!trimmedUrl) {
      setDataError('Please provide a valid WebSocket URL (e.g., wss://echo.websocket.org).');
      return;
    }

    if (!/^wss?:\/\/.+/i.test(trimmedUrl)) {
      setDataError('Invalid WebSocket URL schema. Must start with ws:// or wss://.');
      setWsConfig((prev) => ({
        ...prev,
        url: trimmedUrl,
        status: 'error',
        errorMessage: 'Invalid protocol. Expected wss:// or ws://',
      }));
      return;
    }

    setWsConfig({
      url: trimmedUrl,
      status: 'connecting',
      messageCount: 0,
      byteCount: 0,
      lastPayload: null,
      lastTimestamp: null,
      errorMessage: null,
      maxPoints: studioParams.rollingWindowSize || 50,
    });

    const wsDatasetId = `${userPrefix}ws-live`;

    setAllDatasets((prev) => {
      const existing = prev.find((d) => d.id === wsDatasetId);
      if (existing) {
        return prev.map((d) =>
          d.id === wsDatasetId
            ? {
                ...d,
                data: [],
                rowCount: 0,
                isLive: true,
                lastUpdated: new Date().toISOString(),
              }
            : d
        );
      } else {
        const newWsDataset: DatasetState = {
          id: wsDatasetId,
          name: `Live WebSocket Stream (${trimmedUrl.replace(/^wss?:\/\//, '').split('/')[0]})`,
          sourceType: 'websocket',
          data: [],
          columns: ['time', 'timestamp'],
          numericColumns: [],
          timeColumns: ['time', 'timestamp'],
          stringColumns: [],
          xAxisField: 'time',
          yAxisField: '',
          rowCount: 0,
          isLive: true,
          lastUpdated: new Date().toISOString(),
        };
        return [newWsDataset, ...prev];
      }
    });

    setCurrentDatasetId(wsDatasetId);

    try {
      const socket = new WebSocket(trimmedUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsConfig((prev) => ({
          ...prev,
          status: 'connected',
          errorMessage: null,
        }));

        if (trimmedUrl.includes('echo') || trimmedUrl.includes('postman')) {
          simulatedWsInterval.current = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              const now = new Date();
              const payload = {
                timestamp: Math.floor(now.getTime() / 1000),
                time: now.toTimeString().split(' ')[0],
                cpu: +(35 + Math.random() * 30 + Math.sin(Date.now() / 4000) * 15).toFixed(1),
                memory: +(55 + Math.cos(Date.now() / 6000) * 12).toFixed(1),
                latency: +(12 + Math.random() * 15).toFixed(2),
                requestsSec: Math.floor(450 + Math.random() * 200),
              };
              socket.send(JSON.stringify(payload));
            }
          }, 1500);
        }
      };

      socket.onmessage = (event) => {
        const rawData = event.data;
        const byteLen = typeof rawData === 'string' ? rawData.length : (rawData.byteLength || 0);

        let parsed: any;
        try {
          parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        } catch {
          setWsConfig((prev) => ({
            ...prev,
            messageCount: prev.messageCount + 1,
            byteCount: prev.byteCount + byteLen,
            lastPayload: String(rawData).slice(0, 200),
            lastTimestamp: new Date().toLocaleTimeString(),
          }));
          return;
        }

        const flattened = typeof parsed === 'object' && parsed !== null ? flattenObject(parsed) : { value: parsed };
        const now = new Date();
        const timeStr = flattened.time || flattened.timestamp || now.toTimeString().split(' ')[0];
        flattened.time = String(timeStr);

        setWsConfig((prev) => ({
          ...prev,
          messageCount: prev.messageCount + 1,
          byteCount: prev.byteCount + byteLen,
          lastPayload: parsed,
          lastTimestamp: now.toLocaleTimeString(),
        }));

        setAllDatasets((prev) =>
          prev.map((d) => {
            if (d.id !== wsDatasetId) return d;

            const maxLimit = wsConfig.maxPoints || 50;
            const updatedData = [...d.data, flattened].slice(-maxLimit);

            const { columns, numericColumns, timeColumns, stringColumns } = analyzeColumns(updatedData);

            let xAxis = d.xAxisField;
            if (!xAxis || !columns.includes(xAxis)) {
              xAxis = timeColumns[0] || columns[0] || 'time';
            }

            let yAxis = d.yAxisField;
            if (!yAxis || !numericColumns.includes(yAxis)) {
              yAxis = numericColumns.find((c) => c !== xAxis) || numericColumns[0] || '';
            }

            let secYAxis = d.secondaryYAxisField;
            if (numericColumns.length > 1 && (!secYAxis || !numericColumns.includes(secYAxis))) {
              secYAxis = numericColumns.find((c) => c !== xAxis && c !== yAxis);
            }

            return {
              ...d,
              data: updatedData,
              columns,
              numericColumns,
              timeColumns,
              stringColumns,
              xAxisField: xAxis,
              yAxisField: yAxis,
              secondaryYAxisField: secYAxis,
              rowCount: updatedData.length,
              lastUpdated: now.toISOString(),
            };
          })
        );
      };

      socket.onerror = () => {
        setWsConfig((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: 'WebSocket connection failed or interrupted.',
        }));
      };

      socket.onclose = () => {
        setWsConfig((prev) => ({
          ...prev,
          status: prev.status === 'connecting' ? 'error' : 'disconnected',
          errorMessage: prev.status === 'connecting' ? 'Connection timed out or refused.' : null,
        }));
      };
    } catch (err: any) {
      setWsConfig((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err?.message || 'Failed to instantiate WebSocket client.',
      }));
      setDataError(`WebSocket error: ${err?.message || 'Could not connect'}`);
    }
  };

  return (
    <DataContext.Provider
      value={{
        currentDataset,
        allDatasets,
        metrics,
        secondaryMetrics,
        studioParams,
        wsConfig,
        dataError,
        clearDataError,
        loadCSV,
        loadJSON,
        loadSample,
        selectDataset,
        setAxes,
        updateStudioParams,
        connectWebSocket,
        disconnectWebSocket,
        setWsMaxPoints,
        // Supabase real-time exports
        supabaseTelemetry,
        supabaseMetrics,
        supabaseLoading,
        supabaseError,
        clearSupabaseError,
        addTelemetryPoint,
        updateTelemetryPoint,
        deleteTelemetryPoint,
        seedInitialTelemetry,
        clearAllTelemetry,
        isSupabaseStreaming,
        toggleSupabaseStream,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
