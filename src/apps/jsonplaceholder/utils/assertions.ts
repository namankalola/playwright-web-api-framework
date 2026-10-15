import { expect } from '../fixtures/api.fixture';
import { ApiRecord } from '../api/models/post.model';
import { DataParser } from './data.parser';

/**
 * Reusable collection-level assertions shared by the list/nested/filter
 * specs. Each one compares a response array against expected values taken
 * from an Excel row - never against literals.
 */
export class ListAssertions {
  /** Count, plus first/last id when those columns are filled in. */
  static expectIdRange(records: ApiRecord[], row: Map<string, string>): void {
    expect(records).toHaveLength(DataParser.int(row.get('expectedCount')));
    if (row.get('expectedFirstId')) expect(records[0]?.id).toBe(DataParser.int(row.get('expectedFirstId')));
    if (row.get('expectedLastId')) expect(records.at(-1)?.id).toBe(DataParser.int(row.get('expectedLastId')));
  }

  /** Every record has every `field:type` from the schema cell. Reports all mismatches at once. */
  static expectSchema(records: ApiRecord[], schemaCell: string | undefined): void {
    const mismatches = records.flatMap((record) =>
      DataParser.schema(schemaCell)
        .filter(([field, type]) => typeof record[field] !== type)
        .map(([field, type]) => `id ${record.id}: ${field} is ${typeof record[field]}, expected ${type}`),
    );
    expect(mismatches).toEqual([]);
  }

  /** Every record's `field` (stringified) is one of `allowed`. */
  static expectFieldIn(records: ApiRecord[], field: string, allowed: string[]): void {
    const offenders = records.filter((record) => !allowed.includes(String(record[field]))).map((record) => record.id);
    expect(offenders).toEqual([]);
  }
}
