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

/** One scored row of the daily model comparison. */
export interface ComparisonRow {
  targetDate: string;
  model: string;
  /** Matched-population segment: all attractions / busy (realised P90>=40) / headliner. */
  segment?: 'all' | 'busy' | 'headliner';
  n: number;
  mae: string | number;
  bias: string | number;
  avgLeadDays: number;
}

/** Both model services plus their daily comparison. */
export interface MlMetrics {
  catboost: CatBoostMetrics;
  tft: TftMetrics;
  comparison: {
    rows: ComparisonRow[];
    count: number;
    note?: string;
  };
}

/** A scored row from the PCN intraday or Shape day-curve shadow board: MAE/bias plus mean
 * actual/predicted per (date, model, segment, lead bucket). Postgres numerics arrive as
 * `string | number`. */
export interface ShadowComparisonRow {
  targetDate: string;
  model: string;
  /** all / busy (realised P90>=40) / mid / quiet. */
  segment: string;
  /** Lead-time bucket; 'all' is the aggregate the verdict is computed over. */
  leadBucket: string;
  n: number;
  mae: string | number;
  bias: string | number;
  meanActual: string | number;
  meanPred: string | number;
}

/** PCN−CatBoost MAE delta per segment at lead 'all', n-weighted. delta>0 ⇒ PCN better. */
export interface IntradayVerdict {
  segment: string;
  n: number;
  pcnMae: number;
  catboostMae: number;
  delta: number;
  pcnWins: boolean;
}

/** Generic challenger−CatBoost MAE delta per segment at lead 'all', n-weighted.
 * delta>0 ⇒ challenger (e.g. Shape) better. */
export interface ChallengerVerdict {
  segment: string;
  n: number;
  challengerMae: number;
  catboostMae: number;
  delta: number;
  challengerWins: boolean;
}

/** PCN−persistence MAE delta per (forecast horizon, segment), n-weighted. delta>0 ⇒ PCN's
 * forecast beats a naive no-change baseline at that lead. */
export interface LeadCurveVerdict {
  leadBucket: string; // '1h' | '3h' | '6h'
  segment: string;
  n: number;
  pcnMae: number;
  persistMae: number;
  delta: number;
  pcnWins: boolean;
}

/** One board section. Each is produced independently server-side, so any one can fail
 * on its own ({ error }) or be empty before its shadow table exists ({ note }). */
export interface ComparisonSection<TRow, TVerdict> {
  rows?: TRow[];
  verdict?: TVerdict[];
  count?: number;
  note?: string;
  error?: string;
}

/** The model comparison board (`GET /v1/admin/ml-comparison`): daily TFT and two shadow boards. */
export interface MlComparisonBoard {
  timestamp: string;
  /** TFT vs CatBoost forward scoreboard (rows only, no verdict). */
  daily: ComparisonSection<ComparisonRow, never>;
  /** PCN vs CatBoost intraday shadow board + PCN−CatBoost verdict. */
  intraday: ComparisonSection<ShadowComparisonRow, IntradayVerdict>;
  /** Shape vs CatBoost day-curve shadow board + Shape−CatBoost verdict. */
  shape: ComparisonSection<ShadowComparisonRow, ChallengerVerdict>;
  /** PCN@{1h,3h,6h} vs persistence lead-curve board and verdict; absent on older API builds. */
  leadCurve?: ComparisonSection<ShadowComparisonRow, LeadCurveVerdict>;
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
  ml: MlMetrics;
}

/** One background job queue's counts. */
export interface QueueEntry {
  name: string;
  active: number;
  pending: number;
  failed: number;
  delayed: number;
  completed: number;
}

/** The admin queue-status endpoint's answer. */
export interface QueueStatusResponse {
  timestamp: string;
  queues: QueueEntry[];
}
