export interface CpuLoad {
  '1m': number;
  '5m': number;
  '15m': number;
}

export interface HostCpu {
  cores: number;
  model: string;
  load: CpuLoad;
  loadPct: number | null;
}

export interface HostMemory {
  totalGB: number;
  usedGB: number;
  usedPct: number;
}

export interface HostDisk {
  totalGB: number;
  freeGB: number;
  usedPct: number;
}

export interface HostMetrics {
  cpu: HostCpu;
  memory: HostMemory;
  disk: HostDisk | { error: string };
  uptimeHours: number;
}

export interface PostgresMetrics {
  status: string;
  connections: number;
  activeQueries: number;
  maxConnections: number;
  connectionsPct: number | null;
  dbSizeGB: number;
  cacheHitPct: number | null;
}

export interface RedisMetrics {
  status: string;
  usedMemoryMB: number;
  maxMemoryMB: number | null;
  connectedClients: number;
  keys: number;
  hitRatePct: number | null;
  uptimeHours: number;
}

export interface MlTrainingStatus {
  is_training: boolean;
  current_version?: string;
  started_at?: string;
  status: string;
  version?: string;
  error?: string;
}

export interface MlActiveModel {
  version: string;
  mae: number | null;
  rmse: number | null;
  mape: number | null;
  r2: number | null;
  trainSamples: number;
  trainedAt: string;
}

export interface MlTftHealth {
  status: string;
  model_trained: boolean;
  park_scope: string;
  horizon: number;
}

export interface CatBoostMetrics {
  service: string;
  training: MlTrainingStatus;
  activeModel: MlActiveModel | null;
}

export interface TftMetrics {
  service: string;
  training: MlTrainingStatus;
  health: MlTftHealth;
}

export interface ComparisonRow {
  targetDate: string;
  model: string;
  n: number;
  mae: string | number;
  bias: string | number;
  avgLeadDays: number;
}

export interface MlMetrics {
  catboost: CatBoostMetrics;
  tft: TftMetrics;
  comparison: {
    rows: ComparisonRow[];
    count: number;
    note?: string;
  };
}

export interface SystemHealthResponse {
  timestamp: string;
  host: HostMetrics;
  postgres: PostgresMetrics;
  redis: RedisMetrics;
  ml: MlMetrics;
}

export interface QueueEntry {
  name: string;
  active: number;
  pending: number;
  failed: number;
  delayed: number;
  completed: number;
}

export interface QueueStatusResponse {
  timestamp: string;
  queues: QueueEntry[];
}
