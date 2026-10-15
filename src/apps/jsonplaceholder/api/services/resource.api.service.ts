import { APIRequestContext } from '@playwright/test';
import { ApiClient, ApiResult } from '../../../../core/api.client';
import { SpecBuilder } from '../../../../core/spec.builder';
import { ApiRoutes } from '../routes/api.routes';
import { WriteMethod } from '../models/post.model';

/**
 * Resource-agnostic calls used by the cross-cutting cases: collection sizes,
 * routing behaviour (unknown resource, path casing), CORS preflight and
 * write verbs aimed at a collection URL.
 */
export class ResourceApiService {
  private readonly client: ApiClient;

  constructor(request: APIRequestContext) {
    this.client = new ApiClient(request);
  }

  async listResource(name: string): Promise<ApiResult> {
    return this.client.get(ApiRoutes.RESOURCES.LIST(name), SpecBuilder.create().build());
  }

  /**
   * GET an exact path as supplied - only for cases that test routing itself
   * (e.g. path casing), where the path string *is* the test data.
   */
  async getPath(path: string): Promise<ApiResult> {
    return this.client.get(path, SpecBuilder.create().build());
  }

  async preflightResource(name: string): Promise<ApiResult> {
    return this.client.options(ApiRoutes.RESOURCES.LIST(name), SpecBuilder.create().build());
  }

  /** Sends a write verb to the collection URL itself (`/posts`), not an item URL. */
  async writeToCollection(method: WriteMethod, name: string, payload: unknown): Promise<ApiResult> {
    const path = ApiRoutes.RESOURCES.LIST(name);
    const spec = SpecBuilder.create().withBody(payload).build();
    switch (method) {
      case 'POST':
        return this.client.post(path, spec);
      case 'PUT':
        return this.client.put(path, spec);
      case 'PATCH':
        return this.client.patch(path, spec);
      case 'DELETE':
        return this.client.delete(path, spec);
    }
  }
}
