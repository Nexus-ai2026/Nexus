import { supabase } from './supabase';
import { handleSupabaseError, OperationType } from './supabaseErrors';
import { TelemetryRecord } from '../types';


export interface TelemetryStatistics {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  latest: number;
  sum: number;
  stdDev: number;
}

export function computeTelemetryStatistics(
  records: TelemetryRecord[],
  metricFilter?: string
): TelemetryStatistics | null {
  const filtered = metricFilter
    ? records.filter((r) => r.metricName === metricFilter)
    : records;

  if (!filtered || filtered.length === 0) return null;

  const validValues = filtered
    .map((r) => r.value)
    .filter((v) => typeof v === 'number' && !isNaN(v));

  if (validValues.length === 0) return null;

  const count = validValues.length;
  let min = validValues[0];
  let max = validValues[0];
  let sum = 0;

  for (let i = 0; i < count; i++) {
    const v = validValues[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const avg = +(sum / count).toFixed(3);

  const sorted = [...validValues].sort((a, b) => a - b);
  let median: number;
  const mid = Math.floor(count / 2);
  if (count % 2 !== 0) {
    median = sorted[mid];
  } else {
    median = +((sorted[mid - 1] + sorted[mid]) / 2).toFixed(3);
  }

  const variance =
    validValues.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / count;
  const stdDev = +Math.sqrt(variance).toFixed(3);

  const latest = validValues[validValues.length - 1];

  return {
    count,
    min: +min.toFixed(3),
    max: +max.toFixed(3),
    avg,
    median: +median.toFixed(3),
    latest: +latest.toFixed(3),
    sum: +sum.toFixed(3),
    stdDev,
  };
}

export function subscribeToUserTelemetry(
  userId: string,
  onData: (records: TelemetryRecord[]) => void,
  onError: (error: Error) => void
): () => void {
  if (!userId) {
    onData([]);
    return () => {};
  }

  // Initial fetch
  supabase
    .from('telemetry')
    .select('*')
    .eq('user_id', userId)
    .order('createdAt', { ascending: true })
    .then(({ data, error }) => {
      if (error) {
        handleSupabaseError(error, OperationType.LIST, `telemetry/${userId}`).catch(onError);
        return;
      }
      if (data) {
        onData(data as any as TelemetryRecord[]);
      }
    });

  // Subscribe to changes
  const channel = supabase
    .channel(`telemetry_user_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'telemetry',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        // Simple approach: re-fetch all on any change to maintain sort order
        supabase
          .from('telemetry')
          .select('*')
          .eq('user_id', userId)
          .order('createdAt', { ascending: true })
          .then(({ data, error }) => {
            if (error) {
              handleSupabaseError(error, OperationType.LIST, `telemetry/${userId}`).catch(onError);
              return;
            }
            if (data) {
              onData(data as any as TelemetryRecord[]);
            }
          });
      }
    )
    .subscribe((status, err) => {
      if (err) {
        onError(err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function addSupabaseTelemetryPoint(
  userId: string,
  record: {
    metricName: string;
    value: number;
    secondaryValue?: number;
    unit?: string;
    node?: string;
    status?: string;
    timestamp?: string;
  }
): Promise<string> {
  if (!userId) throw new Error('Authentication required to record telemetry.');

  const docId = `tel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  
  const payload = {
    id: docId,
    user_id: userId,
    metricName: record.metricName.trim() || 'Telemetry Stream',
    value: Number(record.value),
    secondaryValue: record.secondaryValue !== undefined ? Number(record.secondaryValue) : null,
    unit: record.unit || 'ops/s',
    node: record.node || 'node-us-east-1',
    status: record.status || 'NORMAL',
    timestamp: record.timestamp || now.toTimeString().split(' ')[0],
  };

  const { error } = await supabase.from('telemetry').insert(payload);
  if (error) {
    await handleSupabaseError(error, OperationType.CREATE, `telemetry`);
  }
  return docId;
}

export async function updateSupabaseTelemetryPoint(
  userId: string,
  docId: string,
  updates: {
    metricName?: string;
    value?: number;
    secondaryValue?: number;
    unit?: string;
    node?: string;
    status?: string;
  }
): Promise<void> {
  if (!userId || !docId) throw new Error('Valid User ID and Document ID required.');

  const payload: Record<string, any> = { updatedAt: new Date().toISOString() };
  if (updates.metricName !== undefined) payload.metricName = updates.metricName;
  if (updates.value !== undefined) payload.value = Number(updates.value);
  if (updates.secondaryValue !== undefined) payload.secondaryValue = Number(updates.secondaryValue);
  if (updates.unit !== undefined) payload.unit = updates.unit;
  if (updates.node !== undefined) payload.node = updates.node;
  if (updates.status !== undefined) payload.status = updates.status;

  const { error } = await supabase
    .from('telemetry')
    .update(payload)
    .match({ id: docId, user_id: userId });

  if (error) {
    await handleSupabaseError(error, OperationType.UPDATE, `telemetry/${docId}`);
  }
}

export async function deleteSupabaseTelemetryPoint(
  userId: string,
  docId: string
): Promise<void> {
  if (!userId || !docId) throw new Error('Valid User ID and Document ID required.');

  const { error } = await supabase
    .from('telemetry')
    .delete()
    .match({ id: docId, user_id: userId });

  if (error) {
    await handleSupabaseError(error, OperationType.DELETE, `telemetry/${docId}`);
  }
}

export async function seedInitialSupabaseTelemetry(userId: string): Promise<void> {
  if (!userId) throw new Error('Authentication required to seed telemetry.');

  const now = Date.now();
  const nodes = ['us-east-1a', 'us-east-1b', 'eu-central-1', 'ap-southeast-1'];
  const metrics = [
    { name: 'Core Ingestion Throughput', unit: 'MB/s', base: 450, variance: 80 },
  ];

  const insertData = [];
  for (let i = 20; i >= 1; i--) {
    const pointTime = new Date(now - i * 4000);
    const docId = `seed_tel_${now - i * 4000}_${i}`;
    const m = metrics[0];
    const val = +(m.base + Math.sin((20 - i) * 0.4) * m.variance + (Math.random() * 20 - 10)).toFixed(2);
    const secVal = +(12 + Math.cos((20 - i) * 0.3) * 5 + Math.random() * 2).toFixed(2);
    
    insertData.push({
      id: docId,
      user_id: userId,
      metricName: m.name,
      value: val,
      secondaryValue: secVal,
      unit: m.unit,
      node: nodes[i % nodes.length],
      status: val > 500 ? 'SPIKE' : val < 390 ? 'OPTIMAL' : 'NORMAL',
      timestamp: pointTime.toTimeString().split(' ')[0],
      createdAt: pointTime.toISOString(),
      updatedAt: pointTime.toISOString(),
    });
  }

  const { error } = await supabase.from('telemetry').insert(insertData);
  if (error) {
    await handleSupabaseError(error, OperationType.WRITE, `telemetry`);
  }
}

export async function clearAllSupabaseTelemetry(
  userId: string,
  records: TelemetryRecord[]
): Promise<void> {
  if (!userId) return;
  if (!records || records.length === 0) return;

  // Supabase delete with match on userId is efficient
  const { error } = await supabase
    .from('telemetry')
    .delete()
    .eq('user_id', userId);

  if (error) {
    await handleSupabaseError(error, OperationType.DELETE, `telemetry`);
  }
}
