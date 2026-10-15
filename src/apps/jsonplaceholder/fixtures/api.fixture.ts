import { test as base, request as playwrightRequest, APIRequestContext } from '@playwright/test';
import { PostApiService } from '../api/services/post.api.service';
import { CommentApiService } from '../api/services/comment.api.service';
import { ResourceApiService } from '../api/services/resource.api.service';
import { jsonplaceholderConfig } from '../app.config';

interface ApiFixtures {
  apiRequestContext: APIRequestContext;
  postApiService: PostApiService;
  commentApiService: CommentApiService;
  resourceApiService: ResourceApiService;
}

/**
 * JSONPlaceholder is API-only, so this is the app's only fixture file (no
 * `pages.fixture.ts`). Specs import `test`/`expect` from HERE, never from
 * '@playwright/test' or another app's fixtures.
 */
export const test = base.extend<ApiFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires a destructuring pattern here, even with no fixture deps
  apiRequestContext: async ({}, use) => {
    const context = await playwrightRequest.newContext({
      baseURL: jsonplaceholderConfig.apiBaseUrl,
      timeout: jsonplaceholderConfig.apiRequestTimeout,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(context);
    await context.dispose();
  },

  postApiService: async ({ apiRequestContext }, use) => {
    await use(new PostApiService(apiRequestContext));
  },

  commentApiService: async ({ apiRequestContext }, use) => {
    await use(new CommentApiService(apiRequestContext));
  },

  resourceApiService: async ({ apiRequestContext }, use) => {
    await use(new ResourceApiService(apiRequestContext));
  },
});

export { expect } from '@playwright/test';
