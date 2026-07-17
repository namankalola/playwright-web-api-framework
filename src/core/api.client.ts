import { APIRequestContext, APIResponse } from '@playwright/test';
import { RequestSpec } from './spec.builder';
import { Logger } from '../../core/logger';

/**
 * ApiClient is the API-layer equivalent of WebActions: the ONLY class that
 * calls Playwright's `request.get/post/put/patch/delete`. Every call is
 * logged, timed, and given a consistent error-wrapping strategy.
 *
 * Service classes (e.g. UserApiService) depend on this - they never touch
 * `APIRequestContext` directly.
 */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async get(path: string, spec: RequestSpec = { headers: {}, params: {} }): Promise<ApiResult> {
    return this.execute('GET', path, spec, () =>
      this.request.get(path, { headers: spec.headers, params: this.stringifyParams(spec.params) }),
    );
  }

  async post(path: string, spec: RequestSpec = { headers: {}, params: {} }): Promise<ApiResult> {
    return this.execute('POST', path, spec, () =>
      this.request.post(path, { headers: spec.headers, params: this.stringifyParams(spec.params), data: spec.data }),
    );
  }

  async put(path: string, spec: RequestSpec = { headers: {}, params: {} }): Promise<ApiResult> {
    return this.execute('PUT', path, spec, () =>
      this.request.put(path, { headers: spec.headers, params: this.stringifyParams(spec.params), data: spec.data }),
    );
  }

  async patch(path: string, spec: RequestSpec = { headers: {}, params: {} }): Promise<ApiResult> {
    return this.execute('PATCH', path, spec, () =>
      this.request.patch(path, { headers: spec.headers, params: this.stringifyParams(spec.params), data: spec.data }),
    );
  }

  async delete(path: string, spec: RequestSpec = { headers: {}, params: {} }): Promise<ApiResult> {
    return this.execute('DELETE', path, spec, () =>
      this.request.delete(path, { headers: spec.headers, params: this.stringifyParams(spec.params), data: spec.data }),
    );
  }

  private async execute(
    method: string,
    path: string,
    spec: RequestSpec,
    fn: () => Promise<APIResponse>,
  ): Promise<ApiResult> {
    const start = Date.now();
    Logger.step(`API ${method} ${path}`);
    Logger.debug(`Request spec for ${method} ${path}`, { headers: spec.headers, params: spec.params });
    try {
      const response = await fn();
      const durationMs = Date.now() - start;
      Logger.info(`API ${method} ${path} -> ${response.status()} (${durationMs}ms)`);
      return new ApiResult(response, await this.safeJson(response));
    } catch (error) {
      Logger.error(`API ${method} ${path} failed`, error instanceof Error ? error.message : error);
      throw new Error(`[ApiClient] ${method} ${path} failed -> ${(error as Error).message}`);
    }
  }

  private async safeJson(response: APIResponse): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return undefined; // non-JSON or empty body (e.g. 204 No Content)
    }
  }

  private stringifyParams(params: Record<string, string | number | boolean>): Record<string, string> {
    return Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]));
  }
}

/**
 * Wraps a raw Playwright APIResponse + parsed body together, with small
 * convenience helpers services/tests use instead of poking at `response` directly.
 */
export class ApiResult {
  constructor(
    public readonly response: APIResponse,
    public readonly body: unknown,
  ) {}

  get status(): number {
    return this.response.status();
  }

  get ok(): boolean {
    return this.response.ok();
  }

  as<T>(): T {
    return this.body as T;
  }
}
