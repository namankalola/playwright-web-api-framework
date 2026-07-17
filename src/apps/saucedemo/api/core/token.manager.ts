import { APIRequestContext } from '@playwright/test';
import { ApiRoutes } from '../routes/api.routes';
import { LoginRequest, LoginResponse } from '../models/user.model';
import { Logger } from '../../core/logger';
import { envConfig } from '../../config/env.config';
import { SpecBuilder } from './spec.builder';

/**
 * Owns the full lifecycle of auth tokens: fetch, cache, expiry, refresh.
 * Services never call the login endpoint themselves - they ask
 * TokenManager for a valid token and it decides whether to reuse
 * a cached one or fetch a fresh one.
 *
 * A single instance is shared per test worker via the API fixture,
 * so parallel workers don't stampede the login endpoint per test.
 */
export class TokenManager {
  private token: string | null = null;
  private fetchedAt: number | null = null;
  private readonly ttlMs: number;

  constructor(
    private readonly request: APIRequestContext,
    ttlMinutes = 15,
  ) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  async getToken(): Promise<string> {
    if (this.token && this.isFresh()) {
      Logger.debug('Reusing cached auth token');
      return this.token;
    }
    return this.fetchNewToken();
  }

  invalidate(): void {
    this.token = null;
    this.fetchedAt = null;
  }

  private isFresh(): boolean {
    return this.fetchedAt !== null && Date.now() - this.fetchedAt < this.ttlMs;
  }

  private async fetchNewToken(): Promise<string> {
    const credentials: LoginRequest = {
      email: envConfig.apiAuthEmail,
      password: envConfig.apiAuthPassword,
    };

    const spec = SpecBuilder.create().withBody(credentials).build();

    Logger.step(`Authenticating as "${credentials.email}" to obtain API token`);
    const response = await this.request.post(ApiRoutes.AUTH.LOGIN, { headers: spec.headers, data: spec.data });

    if (!response.ok()) {
      throw new Error(`[TokenManager] Login failed with status ${response.status()}: ${await response.text()}`);
    }

    const body = (await response.json()) as LoginResponse;
    this.token = body.token;
    this.fetchedAt = Date.now();
    return this.token;
  }
}
