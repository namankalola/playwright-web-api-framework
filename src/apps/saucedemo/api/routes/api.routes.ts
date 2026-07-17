/**
 * Centralized endpoint definitions. No test, service, or client file should
 * ever hard-code a URL string - everything routes through here so a base
 * path change or API versioning bump touches exactly one file.
 */
export class ApiRoutes {
  static readonly AUTH = {
    LOGIN: '/api/login',
    REGISTER: '/api/register',
  };

  static readonly USERS = {
    LIST: '/api/users',
    BY_ID: (id: number | string): string => `/api/users/${id}`,
  };

  static readonly RESOURCES = {
    LIST: '/api/unknown',
    BY_ID: (id: number | string): string => `/api/unknown/${id}`,
  };
}
