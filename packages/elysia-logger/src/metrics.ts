export type HttpDurationBucket = 25 | 50 | 100 | 250 | 500 | 1000 | 2500 | 5000;
export const HTTP_DURATION_BUCKETS: HttpDurationBucket[] = [
  25, 50, 100, 250, 500, 1000, 2500, 5000,
];

export type AiDurationBucket = 250 | 500 | 1000 | 2000 | 5000 | 10000 | 30000;
export const AI_DURATION_BUCKETS: AiDurationBucket[] = [250, 500, 1000, 2000, 5000, 10000, 30000];

export type StatusFamily = '2xx' | '3xx' | '4xx' | '5xx';

export function getStatusFamily(status: number): StatusFamily {
  if (status >= 200 && status < 300) return '2xx';
  if (status >= 300 && status < 400) return '3xx';
  if (status >= 400 && status < 500) return '4xx';
  return '5xx';
}

export type MetricsSnapshot = {
  http: {
    totalRequests: number;
    requestsByRoute: Record<string, Record<StatusFamily, number>>;
    durationHistogram: Record<string, Record<number, number>>;
  };
  ai: {
    totalRequests: number;
    totalTokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    tokensByModel: Record<string, { prompt: number; completion: number; total: number }>;
    durationHistogram: Record<string, Record<number, number>>;
    toolExecutions: Record<string, { count: number; errors: number }>;
  };
  database: {
    totalBatches: number;
    totalStatements: number;
    durationHistogram: Record<number, number>;
  };
};

export class MetricsRegistry {
  private httpRequests: Record<string, Record<StatusFamily, number>> = {};
  private httpDurationHistogram: Record<string, Record<number, number>> = {};
  private totalHttpRequests = 0;

  private totalAiRequests = 0;
  private totalAiTokens = { prompt: 0, completion: 0, total: 0 };
  private aiTokensByModel: Record<string, { prompt: number; completion: number; total: number }> =
    {};
  private aiDurationHistogram: Record<string, Record<number, number>> = {};
  private aiToolExecutions: Record<string, { count: number; errors: number }> = {};

  private totalDbBatches = 0;
  private totalDbStatements = 0;
  private dbDurationHistogram: Record<number, number> = {};

  recordHttpRequest(method: string, route: string, status: number, durationMs: number): void {
    this.totalHttpRequests++;
    const key = `${method.toUpperCase()} ${route}`;
    const statusFamily = getStatusFamily(status);

    if (!this.httpRequests[key]) {
      this.httpRequests[key] = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
    }
    this.httpRequests[key][statusFamily]++;

    if (!this.httpDurationHistogram[key]) {
      this.httpDurationHistogram[key] = {};
      for (const bucket of HTTP_DURATION_BUCKETS) {
        this.httpDurationHistogram[key][bucket] = 0;
      }
      this.httpDurationHistogram[key][Infinity] = 0;
    }

    let placed = false;
    for (const bucket of HTTP_DURATION_BUCKETS) {
      if (durationMs <= bucket) {
        this.httpDurationHistogram[key][bucket]++;
        placed = true;
        break;
      }
    }
    if (!placed) {
      this.httpDurationHistogram[key][Infinity]++;
    }
  }

  recordAiGeneration(params: {
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    durationMs: number;
  }): void {
    const { model, durationMs } = params;
    const promptTokens = params.inputTokens ?? params.promptTokens ?? 0;
    const completionTokens = params.outputTokens ?? params.completionTokens ?? 0;
    const totalTokens = params.totalTokens ?? promptTokens + completionTokens;

    this.totalAiRequests++;
    this.totalAiTokens.prompt += promptTokens;
    this.totalAiTokens.completion += completionTokens;
    this.totalAiTokens.total += totalTokens;

    if (!this.aiTokensByModel[model]) {
      this.aiTokensByModel[model] = { prompt: 0, completion: 0, total: 0 };
    }
    this.aiTokensByModel[model].prompt += promptTokens;
    this.aiTokensByModel[model].completion += completionTokens;
    this.aiTokensByModel[model].total += totalTokens;

    if (!this.aiDurationHistogram[model]) {
      this.aiDurationHistogram[model] = {};
      for (const bucket of AI_DURATION_BUCKETS) {
        this.aiDurationHistogram[model][bucket] = 0;
      }
      this.aiDurationHistogram[model][Infinity] = 0;
    }

    let placed = false;
    for (const bucket of AI_DURATION_BUCKETS) {
      if (durationMs <= bucket) {
        this.aiDurationHistogram[model][bucket]++;
        placed = true;
        break;
      }
    }
    if (!placed) {
      this.aiDurationHistogram[model][Infinity]++;
    }
  }

  recordAiToolExecution(toolName: string, isError: boolean): void {
    if (!this.aiToolExecutions[toolName]) {
      this.aiToolExecutions[toolName] = { count: 0, errors: 0 };
    }
    this.aiToolExecutions[toolName].count++;
    if (isError) {
      this.aiToolExecutions[toolName].errors++;
    }
  }

  recordD1Batch(statementCount: number, durationMs: number): void {
    this.totalDbBatches++;
    this.totalDbStatements += statementCount;

    let placed = false;
    for (const bucket of HTTP_DURATION_BUCKETS) {
      if (durationMs <= bucket) {
        this.dbDurationHistogram[bucket] = (this.dbDurationHistogram[bucket] || 0) + 1;
        placed = true;
        break;
      }
    }
    if (!placed) {
      this.dbDurationHistogram[Infinity] = (this.dbDurationHistogram[Infinity] || 0) + 1;
    }
  }

  getSnapshot(): MetricsSnapshot {
    return {
      http: {
        totalRequests: this.totalHttpRequests,
        requestsByRoute: JSON.parse(JSON.stringify(this.httpRequests)),
        durationHistogram: JSON.parse(JSON.stringify(this.httpDurationHistogram)),
      },
      ai: {
        totalRequests: this.totalAiRequests,
        totalTokens: { ...this.totalAiTokens },
        tokensByModel: JSON.parse(JSON.stringify(this.aiTokensByModel)),
        durationHistogram: JSON.parse(JSON.stringify(this.aiDurationHistogram)),
        toolExecutions: JSON.parse(JSON.stringify(this.aiToolExecutions)),
      },
      database: {
        totalBatches: this.totalDbBatches,
        totalStatements: this.totalDbStatements,
        durationHistogram: { ...this.dbDurationHistogram },
      },
    };
  }

  reset(): void {
    this.httpRequests = {};
    this.httpDurationHistogram = {};
    this.totalHttpRequests = 0;
    this.totalAiRequests = 0;
    this.totalAiTokens = { prompt: 0, completion: 0, total: 0 };
    this.aiTokensByModel = {};
    this.aiDurationHistogram = {};
    this.aiToolExecutions = {};
    this.totalDbBatches = 0;
    this.totalDbStatements = 0;
    this.dbDurationHistogram = {};
  }
}

export const metrics = new MetricsRegistry();
