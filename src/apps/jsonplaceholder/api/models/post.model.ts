/**
 * Typed response models. JSONPlaceholder does no request validation, so
 * request payloads are deliberately `unknown` in the services - the negative
 * and edge cases send wrong-typed, extra-field and non-JSON bodies on purpose.
 */
export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

/** Any record from any collection - used where only `id` matters. */
export interface ApiRecord {
  id: number;
  [field: string]: unknown;
}

export type WriteMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
