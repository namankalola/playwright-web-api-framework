import { APIRequestContext } from '@playwright/test';
import { ApiClient, ApiResult } from '../../../../core/api.client';
import { SpecBuilder } from '../../../../core/spec.builder';
import { ApiRoutes } from '../routes/api.routes';

/**
 * Business-level calls for the Post domain: list/filter, get by id, nested
 * comments, create, replace (PUT), patch and delete. Test files talk to this
 * layer only - they never see routes, headers, or ApiClient.
 *
 * Ids are `string | number` because the negative cases pass non-numeric ids
 * (`abc`, `1.5`, `01`) straight from Excel.
 */
export class PostApiService {
  private readonly client: ApiClient;

  constructor(request: APIRequestContext) {
    this.client = new ApiClient(request);
  }

  async listPosts(query = ''): Promise<ApiResult> {
    return this.client.get(ApiRoutes.withQuery(ApiRoutes.POSTS.LIST, query), SpecBuilder.create().build());
  }

  async listPostsWithTrailingSlash(): Promise<ApiResult> {
    return this.client.get(ApiRoutes.POSTS.LIST_TRAILING_SLASH, SpecBuilder.create().build());
  }

  async getPost(id: string | number): Promise<ApiResult> {
    return this.client.get(ApiRoutes.POSTS.BY_ID(id), SpecBuilder.create().build());
  }

  async getPostComments(id: string | number): Promise<ApiResult> {
    return this.client.get(ApiRoutes.POSTS.COMMENTS(id), SpecBuilder.create().build());
  }

  async headPost(id: string | number): Promise<ApiResult> {
    return this.client.head(ApiRoutes.POSTS.BY_ID(id), SpecBuilder.create().build());
  }

  /** `contentType` overrides the default `application/json` (e.g. `text/plain`). */
  async createPost(payload: unknown, contentType = ''): Promise<ApiResult> {
    const builder = SpecBuilder.create().withBody(payload);
    if (contentType) builder.withHeader('Content-Type', contentType);
    return this.client.post(ApiRoutes.POSTS.LIST, builder.build());
  }

  /** POST against an item URL (`/posts/{id}`) - not a valid create target. */
  async createAtPost(id: string | number, payload: unknown): Promise<ApiResult> {
    return this.client.post(ApiRoutes.POSTS.BY_ID(id), SpecBuilder.create().withBody(payload).build());
  }

  async createPostComment(id: string | number, payload: unknown): Promise<ApiResult> {
    return this.client.post(ApiRoutes.POSTS.COMMENTS(id), SpecBuilder.create().withBody(payload).build());
  }

  async replacePost(id: string | number, payload: unknown): Promise<ApiResult> {
    return this.client.put(ApiRoutes.POSTS.BY_ID(id), SpecBuilder.create().withBody(payload).build());
  }

  async patchPost(id: string | number, payload: unknown): Promise<ApiResult> {
    return this.client.patch(ApiRoutes.POSTS.BY_ID(id), SpecBuilder.create().withBody(payload).build());
  }

  async deletePost(id: string | number): Promise<ApiResult> {
    return this.client.delete(ApiRoutes.POSTS.BY_ID(id), SpecBuilder.create().build());
  }
}
