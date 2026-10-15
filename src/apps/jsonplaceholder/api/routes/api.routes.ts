/**
 * Centralized endpoint definitions. No test, service, or client file should
 * ever hard-code a URL string - everything routes through here.
 *
 * Query strings are appended as raw strings (`withQuery`) rather than via
 * SpecBuilder params because some cases need a repeated key
 * (`postId=1&postId=2`), which a key/value params object cannot express.
 */
export class ApiRoutes {
  static readonly POSTS = {
    LIST: '/posts',
    LIST_TRAILING_SLASH: '/posts/',
    BY_ID: (id: number | string): string => `/posts/${id}`,
    COMMENTS: (id: number | string): string => `/posts/${id}/comments`,
  };

  static readonly COMMENTS = {
    LIST: '/comments',
  };

  /** Top-level collection by name - posts, comments, albums, photos, todos, users. */
  static readonly RESOURCES = {
    LIST: (name: string): string => `/${name}`,
  };

  static withQuery(path: string, query: string): string {
    return query ? `${path}?${query}` : path;
  }
}
