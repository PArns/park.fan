/** Host load averages over one, five and fifteen minutes. */
export interface CpuLoad {
  '1m': number;
  '5m': number;
  '15m': number;
}

/** The API host's CPU, as the admin system-health page shows it. */
export interface HostCpu {
  cores: number;
  model: string;
  load: CpuLoad;
  loadPct: number | null;
  // CPU package temperature (°C); null on non-Linux or when no sensor is exposed.
  temperatureC: number | null;
}

/** The API host's memory use. */
export interface HostMemory {
  totalGB: number;
  usedGB: number;
  usedPct: number;
}

/** The API host's disk use. */
export interface HostDisk {
  totalGB: number;
  freeGB: number;
  usedPct: number;
}

/** The API host's swap use. */
export interface HostSwap {
  totalGB: number;
  usedGB: number;
  usedPct: number;
}

/** One hardware temperature sensor on the API host. */
export interface HostSensor {
  chip: string;
  label: string;
  tempC: number;
}

/** Everything the system-health endpoint reports about the API host. */
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

/** How recent the newest queue and weather data in the database are. */
export interface FreshnessMetrics {
  latestQueueTime: string | null;
  queueStaleMinutes: number | null;
  queueRowsLastHour: number;
  latestWeatherDate: string | null;
  weatherStaleHours: number | null;
}

/**
 * What the site statistic's flusher has not written yet and what it dropped. `healthy` is false once
 * a window waits longer than three runs or one is parked.
 */
export interface SiteAnalyticsHealth {
  /** Windows in Redis, the current one included. */
  pendingWindows: number;
  /** Of those, the ones the next run will write. */
  readyWindows: number;
  /** Minutes since the oldest pending window began; `null` without one. */
  oldestPendingMinutes: number | null;
  /** Windows set aside after repeated failures. */
  parkedWindows: number;
  /** Visits not yet ended: active ones and those idle until the next run. */
  openVisits: number;
  lastFlushAt: string | null;
  /** Drop and overflow counts by reason. */
  dropsToday: Record<string, number>;
  dropsYesterday: Record<string, number>;
  healthy: boolean;
}

/** Postgres health for the admin page. */
export interface PostgresMetrics {
  status: string;
  connections: number;
  activeQueries: number;
  maxConnections: number;
  connectionsPct: number | null;
  dbSizeGB: number;
  cacheHitPct: number | null;
}

/** Redis health for the admin page. */
export interface RedisMetrics {
  status: string;
  usedMemoryMB: number;
  maxMemoryMB: number | null;
  connectedClients: number;
  keys: number;
  hitRatePct: number | null;
  uptimeHours: number;
}

/** Live chunk and step progress of a TFT training run. */
export interface TftTrainingProgress {
  chunk: number;
  n_chunks: number;
  step: number;
  max_steps: number;
  pct: number;
  loss: number | null;
  updated_at: number;
}

/** A model service's training state. */
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

/** The CatBoost model currently serving, with its error metrics. */
export interface MlActiveModel {
  version: string;
  mae: number | null;
  rmse: number | null;
  mape: number | null;
  r2: number | null;
  trainSamples: number;
  trainedAt: string;
}

/** The TFT service's health check. */
export interface MlTftHealth {
  status: string;
  model_trained: boolean;
  park_scope: string;
  horizon: number;
}

/** CatBoost service state for the admin page. */
export interface CatBoostMetrics {
  service: string;
  training: MlTrainingStatus;
  activeModel: MlActiveModel | null;
}

/** The TFT model currently serving. */
export interface MlTftActiveModel {
  version: string;
  trainedAt: string | null;
  horizon: number | null;
  parkScope: string | null;
}

/** TFT service state for the admin page. */
export interface TftMetrics {
  service: string;
  training: MlTrainingStatus;
  health: MlTftHealth;
  activeModel: MlTftActiveModel | null;
}

/** Both model services. */
export interface MlMetrics {
  catboost: CatBoostMetrics;
  tft: TftMetrics;
}

/** One GPU on the API host. */
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

/** The API host's GPUs, or why they could not be read. */
export interface GpuMetrics {
  available: boolean;
  count?: number;
  gpus?: GpuDevice[];
  reason?: string;
  error?: string;
}

/** The admin system-health endpoint's answer. */
export interface SystemHealthResponse {
  timestamp: string;
  host: HostMetrics;
  gpu?: GpuMetrics;
  postgres: PostgresMetrics;
  redis: RedisMetrics;
  freshness?: FreshnessMetrics;
  /** Absent on an older API; `{ error }` when the section could not be read. */
  siteAnalytics?: SiteAnalyticsHealth | { error: string };
  ml: MlMetrics;
}

/** One background job queue's counts. */
export interface QueueEntry {
  name: string;
  active: number;
  pending: number;
  /** Every failure the queue still keeps, however old. */
  failed: number;
  /**
   * The failures no later run of the same job has succeeded since. An API that does not send it
   * yet leaves every failure open.
   */
  failedOpen?: number;
  delayed: number;
  completed: number;
}

/** The admin queue-status endpoint's answer. */
export interface QueueStatusResponse {
  timestamp: string;
  queues: QueueEntry[];
}
