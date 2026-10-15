/**
 * Turns Excel cell text into the values specs pass to services. Excel only
 * stores strings, so request bodies / expected responses are kept as JSON
 * text in the sheet and parsed here - keeping the parsing rules in one place
 * instead of repeated in every spec.
 */
export class DataParser {
  /** Parses a JSON cell. Blank cell -> undefined (column not used by that row). */
  static json<T = unknown>(cell: string | undefined): T | undefined {
    return cell ? (JSON.parse(cell) as T) : undefined;
  }

  /**
   * Builds a request body from `requestBody` + `bodyType`:
   * - `json` (default): parsed into an object, serialized by Playwright.
   * - `raw`: sent byte-for-byte as a Buffer, so malformed JSON or
   *   non-JSON text reaches the server unchanged (a plain string would be
   *   re-serialized as a JSON string literal under a JSON content type).
   */
  static body(requestBody: string | undefined, bodyType: string | undefined): unknown {
    if (bodyType === 'raw') return Buffer.from(requestBody ?? '');
    return DataParser.json(requestBody);
  }

  static int(cell: string | undefined): number {
    return Number(cell);
  }

  /** Comma-separated list cell -> trimmed array, e.g. `1,2` -> ['1', '2']. */
  static list(cell: string | undefined): string[] {
    return (cell ?? '').split(',').map((v) => v.trim()).filter(Boolean);
  }

  /**
   * Schema cell `field:type|field:type` -> entries, e.g.
   * `userId:number|id:number|title:string` -> [['userId','number'], ...].
   */
  static schema(cell: string | undefined): Array<[string, string]> {
    return DataParser.list((cell ?? '').replace(/\|/g, ',')).map((pair) => pair.split(':') as [string, string]);
  }
}
