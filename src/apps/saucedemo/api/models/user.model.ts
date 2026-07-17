/**
 * POJO-equivalent layer: plain typed models for request payloads and
 * response bodies. Kept free of any HTTP/Playwright concerns - identical
 * spirit to Java DTO/POJO classes used with RestAssured/Jackson.
 */

// ---- Request DTOs ----
export interface CreateUserRequest {
  name: string;
  job: string;
}

export interface UpdateUserRequest {
  name?: string;
  job?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ---- Response DTOs ----
export interface CreateUserResponse {
  id: string;
  name: string;
  job: string;
  createdAt: string;
}

export interface UpdateUserResponse {
  name: string;
  job: string;
  updatedAt: string;
}

export interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

export interface GetUserResponse {
  data: UserData;
}

export interface ListUsersResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: UserData[];
}

export interface LoginResponse {
  token: string;
}

export interface ApiErrorResponse {
  error: string;
}

/**
 * Thin model class demonstrating mapping/behavior beyond a plain interface -
 * mirrors a Java POJO with helper methods (equals/toString-style needs).
 */
export class User {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {}

  static fromResponse(data: UserData): User {
    return new User(data.id, data.email, data.first_name, data.last_name);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
