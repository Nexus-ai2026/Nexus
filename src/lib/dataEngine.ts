import Papa from 'papaparse';
import { CalculatedMetrics, DatasetState, DataSourceType } from '../types';

/**
 * Flattens nested JSON objects into single level key-value pairs.
 * e.g., { user: { score: 95 } } -> { "user.score": 95 }
 */
export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  if (!obj || typeof obj !== 'object') {
    return result;
  }

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }

  return result;
}

/**
 * Checks if a value is numeric (number or numeric string).
 */
export function isNumeric(val: any): boolean {
  if (val === null || val === undefined || val === '') return false;
  if (typeof val === 'number') return !isNaN(val) && isFinite(val);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return false;
    const num = Number(trimmed);
    return !isNaN(num) && isFinite(num);
  }
  return false;
}

/**
 * Converts a value to clean number or null without inventing values.
 */
export function parseNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isFinite(val) ? val : null;
  if (typeof val === 'string') {
    const num = Number(val.trim());
    return !isNaN(num) && isFinite(num) ? num : null;
  }
  return null;
}

/**
 * Checks if a string looks like a date/timestamp or time field.
 */
export function isDateOrTime(val: any): boolean {
  if (!val) return false;
  if (typeof val === 'number' && val > 1000000000 && val < 2500000000000) {
    // Unix timestamp in s or ms
    return true;
  }
  if (typeof val === 'string') {
    const s = val.trim();
    // Check ISO date format or time format (HH:mm:ss)
    if (/^\d{4}-\d{2}-\d{2}/.test(s) || /^\d{2}:\d{2}(:\d{2})?/.test(s)) return true;
    const parsed = Date.parse(s);
    return !isNaN(parsed) && s.length > 5;
  }
  return false;
}

/**
 * Detects column types across rows.
 */
export function analyzeColumns(rows: Record<string, any>[]): {
  columns: string[];
  numericColumns: string[];
  timeColumns: string[];
  stringColumns: string[];
} {
  if (!rows || rows.length === 0) {
    return { columns: [], numericColumns: [], timeColumns: [], stringColumns: [] };
  }

  // Collect all unique keys from the first 100 sample rows
  const sampleSize = Math.min(rows.length, 100);
  const columnSet = new Set<string>();

  for (let i = 0; i < sampleSize; i++) {
    const row = rows[i];
    if (row && typeof row === 'object') {
      Object.keys(row).forEach((k) => columnSet.add(k));
    }
  }

  const columns = Array.from(columnSet);
  const numericColumns: string[] = [];
  const timeColumns: string[] = [];
  const stringColumns: string[] = [];

  for (const col of columns) {
    let numericCount = 0;
    let dateCount = 0;
    let totalSampled = 0;

    for (let i = 0; i < sampleSize; i++) {
      const val = rows[i]?.[col];
      if (val !== undefined && val !== null && val !== '') {
        totalSampled++;
        if (isNumeric(val)) {
          numericCount++;
        }
        if (isDateOrTime(val) || /time|date|timestamp|hour|day|min/i.test(col)) {
          dateCount++;
        }
      }
    }

    const numericRatio = totalSampled > 0 ? numericCount / totalSampled : 0;
    const isColumnNameTimeLike = /time|date|timestamp|hour|created|updated/i.test(col);

    if (isColumnNameTimeLike || (dateCount > 0 && dateCount / totalSampled > 0.6)) {
      timeColumns.push(col);
    }

    if (numericRatio >= 0.7) {
      numericColumns.push(col);
    } else {
      stringColumns.push(col);
    }
  }

  return { columns, numericColumns, timeColumns, stringColumns };
}

/**
 * Parse CSV string using PapaParse with automatic typing and validation.
 */
export function parseCSVData(csvText: string, filename = 'uploaded_data.csv'): {
  dataset: DatasetState | null;
  error: string | null;
} {
  if (!csvText || !csvText.trim()) {
    return { dataset: null, error: 'The uploaded CSV file is completely empty.' };
  }

  try {
    const parseResult = Papa.parse(csvText.trim(), {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      const fatalErrors = parseResult.errors.filter((e) => e.type !== 'FieldMismatch');
      if (fatalErrors.length > 0) {
        return {
          dataset: null,
          error: `CSV Parsing error at row ${fatalErrors[0].row || 1}: ${fatalErrors[0].message}`,
        };
      }
    }

    const rawRows = (parseResult.data as Record<string, any>[]).filter(
      (r) => r && typeof r === 'object' && Object.keys(r).length > 0
    );

    if (rawRows.length === 0) {
      return { dataset: null, error: 'No valid data rows could be extracted from this CSV.' };
    }

    // Clean column keys (remove leading/trailing spaces)
    const cleanedRows = rawRows.map((row) => {
      const cleanRow: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        cleanRow[key.trim()] = value;
      }
      return cleanRow;
    });

    const { columns, numericColumns, timeColumns, stringColumns } = analyzeColumns(cleanedRows);

    if (columns.length === 0) {
      return { dataset: null, error: 'No column headers found in CSV.' };
    }

    if (numericColumns.length === 0) {
      return {
        dataset: null,
        error:
          'No numeric columns detected in this CSV. Please include at least one column with numbers (e.g. latency, revenue, temperature).',
      };
    }

    // Select smart default X and Y fields
    const defaultX =
      timeColumns[0] ||
      columns.find((c) => /time|date|timestamp|idx|id|index|name|label/i.test(c)) ||
      columns[0];
    const defaultY =
      numericColumns.find((c) => c !== defaultX) || numericColumns[0];

    const dataset: DatasetState = {
      id: `csv-${Date.now()}`,
      name: filename,
      sourceType: 'csv',
      data: cleanedRows,
      columns,
      numericColumns,
      timeColumns,
      stringColumns,
      xAxisField: defaultX,
      yAxisField: defaultY,
      secondaryYAxisField: numericColumns.length > 1 && numericColumns[1] !== defaultX ? numericColumns[1] : undefined,
      rowCount: cleanedRows.length,
      isLive: false,
      lastUpdated: new Date().toISOString(),
    };

    return { dataset, error: null };
  } catch (err: any) {
    return { dataset: null, error: `Failed to parse CSV: ${err?.message || 'Unknown error'}` };
  }
}

/**
 * Parse JSON text (array of objects or object with array) with flattening.
 */
export function parseJSONData(jsonText: string, filename = 'uploaded_data.json'): {
  dataset: DatasetState | null;
  error: string | null;
} {
  if (!jsonText || !jsonText.trim()) {
    return { dataset: null, error: 'JSON content is empty.' };
  }

  try {
    const parsed = JSON.parse(jsonText.trim());
    let rawArray: any[] = [];

    if (Array.isArray(parsed)) {
      rawArray = parsed;
    } else if (parsed && typeof parsed === 'object') {
      // Check if it has a property that is an array (e.g. data, items, rows, points, values)
      const arrayKey = Object.keys(parsed).find(
        (k) => Array.isArray(parsed[k]) && parsed[k].length > 0
      );
      if (arrayKey) {
        rawArray = parsed[arrayKey];
      } else {
        // Single object wrapper
        rawArray = [parsed];
      }
    }

    if (!Array.isArray(rawArray) || rawArray.length === 0) {
      return {
        dataset: null,
        error: 'JSON must contain an array of objects or an object with an array property (e.g., [ { ... } ] or { "data": [ ... ] }).',
      };
    }

    // Flatten each item
    const flattenedRows = rawArray.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return flattenObject(item);
      }
      return { value: item };
    });

    const { columns, numericColumns, timeColumns, stringColumns } = analyzeColumns(flattenedRows);

    if (columns.length === 0) {
      return { dataset: null, error: 'No valid attributes detected in JSON.' };
    }

    if (numericColumns.length === 0) {
      return {
        dataset: null,
        error:
          'No numeric fields detected in this JSON. At least one numeric field is required to render charts.',
      };
    }

    const defaultX =
      timeColumns[0] ||
      columns.find((c) => /time|date|timestamp|idx|id|index|name|label/i.test(c)) ||
      columns[0];
    const defaultY =
      numericColumns.find((c) => c !== defaultX) || numericColumns[0];

    const dataset: DatasetState = {
      id: `json-${Date.now()}`,
      name: filename,
      sourceType: 'json',
      data: flattenedRows,
      columns,
      numericColumns,
      timeColumns,
      stringColumns,
      xAxisField: defaultX,
      yAxisField: defaultY,
      secondaryYAxisField: numericColumns.length > 1 && numericColumns[1] !== defaultX ? numericColumns[1] : undefined,
      rowCount: flattenedRows.length,
      isLive: false,
      lastUpdated: new Date().toISOString(),
    };

    return { dataset, error: null };
  } catch (err: any) {
    return {
      dataset: null,
      error: `Invalid JSON syntax: ${err?.message || 'Check for missing brackets or commas'}`,
    };
  }
}

/**
 * Calculate accurate mathematical metrics from real dataset without fabrication.
 */
export function calculateDatasetMetrics(
  rows: Record<string, any>[],
  field: string
): CalculatedMetrics {
  if (!rows || rows.length === 0 || !field) {
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

  const validNumbers: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const num = parseNumber(rows[i][field]);
    if (num !== null) {
      validNumbers.push(num);
    }
  }

  if (validNumbers.length === 0) {
    return {
      count: rows.length,
      min: null,
      max: null,
      avg: null,
      median: null,
      latest: null,
      sum: null,
      stdDev: null,
    };
  }

  const count = validNumbers.length;
  let min = validNumbers[0];
  let max = validNumbers[0];
  let sum = 0;

  for (let i = 0; i < count; i++) {
    const v = validNumbers[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }

  const avg = +(sum / count).toFixed(3);

  // Calculate Median
  const sorted = [...validNumbers].sort((a, b) => a - b);
  let median: number;
  const mid = Math.floor(count / 2);
  if (count % 2 !== 0) {
    median = sorted[mid];
  } else {
    median = +((sorted[mid - 1] + sorted[mid]) / 2).toFixed(3);
  }

  // Calculate Std Deviation
  const variance =
    validNumbers.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / count;
  const stdDev = +Math.sqrt(variance).toFixed(3);

  // Latest is the last received valid point
  const latest = validNumbers[validNumbers.length - 1];

  return {
    count,
    min: +min.toFixed(3),
    max: +max.toFixed(3),
    avg,
    median,
    latest: +latest.toFixed(3),
    sum: +sum.toFixed(3),
    stdDev,
  };
}

/**
 * Downsample large datasets for 60fps rendering performance.
 */
export function downsampleData(
  data: Record<string, any>[],
  maxPoints = 200
): Record<string, any>[] {
  if (!data || data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  const sampled: Record<string, any>[] = [];

  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }

  // Ensure the last real point is preserved
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }

  return sampled;
}

/**
 * Sample test datasets (Clearly labeled SAMPLE DATA).
 */
export function getSampleDatasets(): Record<string, DatasetState> {
  // 1. Server Telemetry
  const serverRows: Record<string, any>[] = [];
  const now = Date.now();
  for (let i = 40; i >= 0; i--) {
    const t = new Date(now - i * 3000);
    serverRows.push({
      time: t.toTimeString().split(' ')[0],
      timestamp: Math.floor(t.getTime() / 1000),
      cpu: +(32 + Math.sin(i * 0.4) * 22 + (i % 7 === 0 ? 18 : 0)).toFixed(1),
      memory: +(58 + Math.cos(i * 0.3) * 14).toFixed(1),
      latencyP99: +(14.2 + Math.sin(i * 0.6) * 8.5 + (i % 9 === 0 ? 15 : 0)).toFixed(1),
      activeSockets: Math.floor(850 + Math.sin(i * 0.2) * 200),
      packetLossPct: +(0.02 + (i % 8 === 0 ? 0.4 : 0.01)).toFixed(3),
    });
  }

  // 2. Financial Crypto Assets
  const financialRows: Record<string, any>[] = [];
  let basePrice = 64200;
  for (let i = 0; i < 35; i++) {
    const delta = (Math.sin(i * 0.5) + (Math.random() - 0.48) * 2) * 350;
    basePrice = Math.max(1000, basePrice + delta);
    financialRows.push({
      minute: `12:${(i < 10 ? '0' : '') + i}`,
      priceUSD: +basePrice.toFixed(2),
      volumeBTC: +(12.4 + Math.abs(Math.sin(i * 0.8)) * 45).toFixed(2),
      rsi: +(45 + Math.sin(i * 0.3) * 25).toFixed(1),
      orderBookSpread: +(0.8 + Math.random() * 1.4).toFixed(2),
    });
  }

  // 3. IoT Climate & Power Sensor Matrix
  const iotRows: Record<string, any>[] = [];
  for (let i = 0; i < 30; i++) {
    iotRows.push({
      sensorId: `NODE-${(i % 5) + 1}`,
      sampleIndex: i + 1,
      temperatureC: +(22.4 + Math.sin(i * 0.3) * 6.5).toFixed(2),
      humidityPct: +(48 + Math.cos(i * 0.35) * 15).toFixed(1),
      voltageV: +(3.28 + Math.sin(i * 0.7) * 0.15).toFixed(3),
      powerWatts: +(18.5 + Math.sin(i * 0.4) * 8.2).toFixed(1),
    });
  }

  // 4. E-Commerce Traffic & Conversion
  const ecommerceRows: Record<string, any>[] = [];
  for (let h = 0; h < 24; h++) {
    const traffic = Math.floor(1200 + Math.sin((h - 6) * 0.25) * 900);
    const cartAdds = Math.floor(traffic * 0.18 + Math.random() * 40);
    const orders = Math.floor(cartAdds * 0.42 + Math.random() * 15);
    ecommerceRows.push({
      hourOfDay: `${h}:00`,
      visitors: traffic,
      cartAdds,
      orders,
      revenueUSD: +(orders * 85.5 + Math.random() * 200).toFixed(2),
      conversionPct: +((orders / Math.max(1, traffic)) * 100).toFixed(2),
    });
  }

  return {
    'sample-server': {
      id: 'sample-server',
      name: 'Server Telemetry Stream [SAMPLE DATA]',
      sourceType: 'sample',
      data: serverRows,
      columns: ['time', 'timestamp', 'cpu', 'memory', 'latencyP99', 'activeSockets', 'packetLossPct'],
      numericColumns: ['cpu', 'memory', 'latencyP99', 'activeSockets', 'packetLossPct'],
      timeColumns: ['time', 'timestamp'],
      stringColumns: [],
      xAxisField: 'time',
      yAxisField: 'cpu',
      secondaryYAxisField: 'memory',
      rowCount: serverRows.length,
      isLive: false,
      lastUpdated: new Date().toISOString(),
    },
    'sample-financial': {
      id: 'sample-financial',
      name: 'Financial Market Orderbook [SAMPLE DATA]',
      sourceType: 'sample',
      data: financialRows,
      columns: ['minute', 'priceUSD', 'volumeBTC', 'rsi', 'orderBookSpread'],
      numericColumns: ['priceUSD', 'volumeBTC', 'rsi', 'orderBookSpread'],
      timeColumns: ['minute'],
      stringColumns: [],
      xAxisField: 'minute',
      yAxisField: 'priceUSD',
      secondaryYAxisField: 'volumeBTC',
      rowCount: financialRows.length,
      isLive: false,
      lastUpdated: new Date().toISOString(),
    },
    'sample-iot': {
      id: 'sample-iot',
      name: 'IoT Sensor Array Matrix [SAMPLE DATA]',
      sourceType: 'sample',
      data: iotRows,
      columns: ['sensorId', 'sampleIndex', 'temperatureC', 'humidityPct', 'voltageV', 'powerWatts'],
      numericColumns: ['temperatureC', 'humidityPct', 'voltageV', 'powerWatts'],
      timeColumns: [],
      stringColumns: ['sensorId'],
      xAxisField: 'sampleIndex',
      yAxisField: 'temperatureC',
      secondaryYAxisField: 'powerWatts',
      rowCount: iotRows.length,
      isLive: false,
      lastUpdated: new Date().toISOString(),
    },
    'sample-ecommerce': {
      id: 'sample-ecommerce',
      name: 'E-Commerce Conversion Flow [SAMPLE DATA]',
      sourceType: 'sample',
      data: ecommerceRows,
      columns: ['hourOfDay', 'visitors', 'cartAdds', 'orders', 'revenueUSD', 'conversionPct'],
      numericColumns: ['visitors', 'cartAdds', 'orders', 'revenueUSD', 'conversionPct'],
      timeColumns: ['hourOfDay'],
      stringColumns: [],
      xAxisField: 'hourOfDay',
      yAxisField: 'revenueUSD',
      secondaryYAxisField: 'orders',
      rowCount: ecommerceRows.length,
      isLive: false,
      lastUpdated: new Date().toISOString(),
    },
  };
}
