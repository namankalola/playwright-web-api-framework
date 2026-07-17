import { APIRequestContext } from '@playwright/test';
import { ApiClient, ApiResult } from '../../../../core/api.client';
import { SpecBuilder } from '../../../../core/spec.builder';
import { TokenManager } from '../core/token.manager';
import { ApiRoutes } from '../routes/api.routes';
import {
  CreateUserRequest,
  CreateUserResponse,
  GetUserResponse,
  ListUsersResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  User,
} from '../models/user.model';

/**
 * Common/reusable business-level API calls for the User domain.
 * This is the ONLY layer test files talk to for user operations - it
 * composes SpecBuilder + ApiClient + TokenManager + ApiRoutes + models,
 * and returns typed POJO results instead of raw responses.
 *
 * Test files never see RequestSpec, ApiClient, headers, or query params.
 */
export class UserApiService {
  private readonly client: ApiClient;

  constructor(
    request: APIRequestContext,
    private readonly tokenManager: TokenManager,
  ) {
    this.client = new ApiClient(request);
  }

  async listUsers(page = 1): Promise<{ result: ApiResult; users: User[] }> {
    const spec = SpecBuilder.create().withQueryParam('page', page).build();
    const result = await this.client.get(ApiRoutes.USERS.LIST, spec);
    const body = result.as<ListUsersResponse>();
    const users = result.ok ? body.data.map(User.fromResponse) : [];
    return { result, users };
  }

  async getUserById(id: number): Promise<{ result: ApiResult; user: User | null }> {
    const spec = SpecBuilder.create().build();
    const result = await this.client.get(ApiRoutes.USERS.BY_ID(id), spec);
    const user = result.ok ? User.fromResponse(result.as<GetUserResponse>().data) : null;
    return { result, user };
  }

  async createUser(payload: CreateUserRequest): Promise<{ result: ApiResult; created: CreateUserResponse | null }> {
    const token = await this.tokenManager.getToken();
    const spec = SpecBuilder.create().withAuthToken(token).withBody(payload).build();
    const result = await this.client.post(ApiRoutes.USERS.LIST, spec);
    return { result, created: result.ok ? result.as<CreateUserResponse>() : null };
  }

  async updateUser(
    id: number,
    payload: UpdateUserRequest,
  ): Promise<{ result: ApiResult; updated: UpdateUserResponse | null }> {
    const token = await this.tokenManager.getToken();
    const spec = SpecBuilder.create().withAuthToken(token).withBody(payload).build();
    const result = await this.client.put(ApiRoutes.USERS.BY_ID(id), spec);
    return { result, updated: result.ok ? result.as<UpdateUserResponse>() : null };
  }

  async deleteUser(id: number): Promise<ApiResult> {
    const token = await this.tokenManager.getToken();
    const spec = SpecBuilder.create().withAuthToken(token).build();
    return this.client.delete(ApiRoutes.USERS.BY_ID(id), spec);
  }
}
