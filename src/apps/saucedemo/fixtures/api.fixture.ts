import { test as base, request as playwrightRequest, APIRequestContext } from '@playwright/test';
import { TokenManager } from '../api/core/token.manager';
import { UserApiService } from '../api/services/user.api.service';
import { saucedemoConfig } from '../app.config';

interface ApiFixtures {
  apiRequestContext: APIRequestContext;
  tokenManager: TokenManager;
  userApiService: UserApiService;
}

/**
 * Extends Playwright's base `test` with a dedicated API request context
 * (separate from any UI `page`) plus ready-to-use service instances.
 * API-only specs import `test` from HERE, not from '@playwright/test' or
 * the UI `pages.fixture` - keeping UI and API concerns fully decoupled
 * even though both can share the same underlying framework/config.
 */
export const test = base.extend<ApiFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires a destructuring pattern here, even with no fixture deps
  apiRequestContext: async ({}, use) => {
    const context = await playwrightRequest.newContext({
      baseURL: saucedemoConfig.apiBaseUrl,
      timeout: saucedemoConfig.apiRequestTimeout,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(context);
    await context.dispose();
  },

  tokenManager: async ({ apiRequestContext }, use) => {
    await use(new TokenManager(apiRequestContext));
  },

  userApiService: async ({ apiRequestContext, tokenManager }, use) => {
    await use(new UserApiService(apiRequestContext, tokenManager));
  },
});

export { expect } from '@playwright/test';
