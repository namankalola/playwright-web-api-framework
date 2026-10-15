import { APIRequestContext } from '@playwright/test';
import { ApiClient, ApiResult } from '../../../../core/api.client';
import { SpecBuilder } from '../../../../core/spec.builder';
import { ApiRoutes } from '../routes/api.routes';

/** Business-level calls for the top-level `/comments` collection (filter route). */
export class CommentApiService {
  private readonly client: ApiClient;

  constructor(request: APIRequestContext) {
    this.client = new ApiClient(request);
  }

  /** `query` is a raw query string, e.g. `postId=1` or `postId=1&postId=2`. */
  async filterComments(query: string): Promise<ApiResult> {
    return this.client.get(ApiRoutes.withQuery(ApiRoutes.COMMENTS.LIST, query), SpecBuilder.create().build());
  }
}
