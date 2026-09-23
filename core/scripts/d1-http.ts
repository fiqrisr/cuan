import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Minimal D1Database binding implementation that talks to the remote
 * Cloudflare D1 REST API instead of a local wrangler proxy.
 *
 * Implements the binding surface drizzle-orm/better-auth actually use:
 * `prepare()` (+ bind/first/all/run/raw) and `batch()` (executed sequentially;
 * the REST API has no multi-statement transaction semantics). `dump()` and
 * Sessions (read-replication bookmark routing) are not supported.
 */

type RestQueryEntry = {
  results: Record<string, unknown>[];
  success: boolean;
  meta: Record<string, unknown>;
};

type RestQueryResponse = {
  success: boolean;
  errors: { code?: number; message?: string }[];
  result: RestQueryEntry[];
};

function apiBaseUrl(): string {
  // Overridable so tests can point the client at a local mock server.
  return process.env.CLOUDFLARE_API_BASE_URL ?? 'https://api.cloudflare.com/client/v4';
}

function toD1Result(entry: RestQueryEntry): D1Result<Record<string, unknown>> {
  return {
    results: entry.results ?? [],
    success: true as const,
    meta: {
      duration: 0,
      size_after: 0,
      rows_read: 0,
      rows_written: 0,
      last_row_id: 0,
      changed_db: false,
      changes: 0,
      ...entry.meta,
    } as D1Meta & Record<string, unknown>,
  };
}

class D1HttpStatement implements D1PreparedStatement {
  #params: unknown[] = [];

  constructor(
    private readonly database: D1HttpDatabase,
    private readonly sql: string,
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    this.#params = values;
    return this;
  }

  /** @internal Exposed for D1HttpDatabase.batch(). */
  execute(): Promise<D1Result<Record<string, unknown>>> {
    return this.database.query(this.sql, this.#params);
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const { results } = await this.execute();
    const row = results[0];
    if (row == null) return null;
    return (colName === undefined ? row : row[colName]) as T | null;
  }

  run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return this.execute() as Promise<D1Result<T>>;
  }

  all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return this.execute() as Promise<D1Result<T>>;
  }

  raw<T = unknown[]>(options: { columnNames: true }): Promise<[string[], ...T[]]>;
  raw<T = unknown[]>(options?: { columnNames?: false }): Promise<T[]>;
  async raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[] | [string[], ...T[]]> {
    const { results } = await this.execute();
    // D1 REST returns rows as objects keyed by column name (in column order),
    // the same mapping drizzle itself applies to batch results.
    const rows = results.map(row => Object.values(row));
    if (options?.columnNames) {
      const names = results[0] ? Object.keys(results[0]) : [];
      return [names, ...rows] as T[];
    }
    return rows as T[];
  }
}

class D1HttpDatabase implements D1Database {
  readonly #accountId: string;
  readonly #databaseId: string;
  readonly #token: string;

  constructor(accountId: string, databaseId: string, token: string) {
    this.#accountId = accountId;
    this.#databaseId = databaseId;
    this.#token = token;
  }

  async query(sql: string, params: unknown[]): Promise<D1Result<Record<string, unknown>>> {
    const response = await fetch(
      `${apiBaseUrl()}/accounts/${this.#accountId}/d1/database/${this.#databaseId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.#token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      },
    );

    const body = (await response.json().catch(() => null)) as RestQueryResponse | null;
    if (!response.ok || !body?.success) {
      const details =
        body?.errors
          ?.map(error => error.message)
          .filter(Boolean)
          .join('; ') ?? `HTTP ${response.status}`;
      throw new Error(`D1 HTTP query failed: ${details}`);
    }
    const entry = body.result?.[0];
    if (!entry) {
      throw new Error('D1 HTTP query returned no result entry');
    }
    return toD1Result(entry);
  }

  prepare(query: string): D1PreparedStatement {
    return new D1HttpStatement(this, query);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<Record<string, unknown>>[] = [];
    for (const statement of statements) {
      results.push(await (statement as D1HttpStatement).execute());
    }
    return results as D1Result<T>[];
  }

  async exec(query: string): Promise<D1ExecResult> {
    const { meta } = await this.query(query, []);
    return { count: meta.changes, duration: meta.duration };
  }

  withSession(): D1DatabaseSession {
    // The REST API always hits the primary; a pass-through session is enough
    // for drizzle, which never uses bookmark routing.
    return {
      prepare: sql => this.prepare(sql),
      batch: statements => this.batch(statements),
      getBookmark: () => null,
    };
  }

  async dump(): Promise<ArrayBuffer> {
    throw new Error('dump() is not supported over the D1 REST API');
  }
}

/**
 * Resolve the remote database id from wrangler.toml, the single source of
 * truth for which D1 database the deployed Worker uses.
 */
export function getRemoteDatabaseId(): string {
  const configPath = path.resolve(import.meta.dir, '../wrangler.toml');
  const match = readFileSync(configPath, 'utf8').match(/^\s*database_id\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error('database_id not found in wrangler.toml');
  }
  return match[1];
}

function requireCredential(name: string, value: string | undefined): string {
  if (!value || value === 'dummy') {
    throw new Error(
      `${name} must be set to a real value (core/.env) to operate on the remote D1 database.`,
    );
  }
  return value;
}

function resolveToken(): string {
  // .env files in this repo use either name; prefer the D1-scoped token.
  const token = process.env.CLOUDFLARE_D1_TOKEN ?? process.env.CLOUDFLARE_API_TOKEN;
  return requireCredential('CLOUDFLARE_D1_TOKEN (or CLOUDFLARE_API_TOKEN)', token);
}

/**
 * Build a D1Database binding backed by the remote Cloudflare REST API.
 * Credentials come from the environment; the database id comes from
 * wrangler.toml so seed data always lands in the deployed database.
 */
export function createRemoteD1Database(): D1Database {
  const accountId = requireCredential('CLOUDFLARE_ACCOUNT_ID', process.env.CLOUDFLARE_ACCOUNT_ID);
  const token = resolveToken();
  return new D1HttpDatabase(accountId, getRemoteDatabaseId(), token);
}
