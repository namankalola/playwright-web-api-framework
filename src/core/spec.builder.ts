/**
 * Fluent request-spec builder, the TS analogue of RestAssured's
 * `given().header(...).queryParam(...).body(...)`.
 * Produces a plain RequestSpec object that ApiClient knows how to execute -
 * the builder itself has zero HTTP-execution logic.
 *
 * Deliberately app-agnostic: it carries no default headers beyond
 * Content-Type. App-specific auth headers (e.g. an account-level API key)
 * are attached by the caller via `.withHeader(...)`, not baked in here.
 */
export interface RequestSpec {
  headers: Record<string, string>;
  params: Record<string, string | number | boolean>;
  data?: unknown;
}

export class SpecBuilder {
  private headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  private params: Record<string, string | number | boolean> = {};
  private body: unknown;

  static create(): SpecBuilder {
    return new SpecBuilder();
  }

  withHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  withHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  withAuthToken(token: string): this {
    this.headers['Authorization'] = `Bearer ${token}`;
    return this;
  }

  withQueryParam(key: string, value: string | number | boolean): this {
    this.params[key] = value;
    return this;
  }

  withQueryParams(params: Record<string, string | number | boolean>): this {
    this.params = { ...this.params, ...params };
    return this;
  }

  withBody<T>(body: T): this {
    this.body = body;
    return this;
  }

  build(): RequestSpec {
    return {
      headers: this.headers,
      params: this.params,
      data: this.body,
    };
  }
}
