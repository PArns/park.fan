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
  // CPU package temperature (°C); null on non-Linux or when no sensor is exposed.
  temperatureC: number | null;
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

export interface HostSwap {
  totalGB: number;
  usedGB: number;
  usedPct: number;
}

export interface HostSensor {
  chip: string;
  label: string;
  tempC: number;
}

export interface HostMetrics {
  cpu: HostCpu;
  memory: HostMemory;
  // null on non-Linux hosts or when no swap is configured.
  swap: HostSwap | null;
  disk: HostDisk | { error: string };
  // All hwmon temperature sensors (coretemp cores, NVMe, ACPI, NIC, Wi-Fi…).
  sensors?: HostSensor[];
  uptimeHours: number;
}

export interface FreshnessMetrics {
  latestQueueTime: string | null;
  queueStaleMinutes: number | null;
  queueRowsLastHour: number;
  latestWeatherDate: string | null;
  weatherStaleHours: number | null;
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

export interface TftTrainingProgress {
  chunk: number;
  n_chunks: number;
  step: number;
  max_steps: number;
  pct: number;
  loss: number | null;
  updated_at: number;
}

export interface MlTrainingStatus {
  is_training: boolean;
  current_version?: string;
  started_at?: string;
  status: string;
  version?: string;
  error?: string;
  finished_at?: string | null;
  // TFT (nf-service) reports live chunk/step progress while training; null otherwise.
  progress?: TftTrainingProgress | null;
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

export interface MlTftActiveModel {
  version: string;
  trainedAt: string | null;
  horizon: number | null;
  parkScope: string | null;
}

export interface TftMetrics {
  service: string;
  training: MlTrainingStatus;
  health: MlTftHealth;
  activeModel: MlTftActiveModel | null;
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

export interface GpuDevice {
  index: number | null;
  name: string;
  temperatureC: number | null;
  utilizationGpuPct: number | null;
  utilizationMemPct: number | null;
  memoryUsedMB: number | null;
  memoryTotalMB: number | null;
  memoryUsedPct: number | null;
  powerW: number | null;
  powerLimitW: number | null;
}

export interface GpuMetrics {
  available: boolean;
  count?: number;
  gpus?: GpuDevice[];
  reason?: string;
  error?: string;
}

export interface SystemHealthResponse {
  timestamp: string;
  host: HostMetrics;
  gpu?: GpuMetrics;
  postgres: PostgresMetrics;
  redis: RedisMetrics;
  freshness?: FreshnessMetrics;
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
