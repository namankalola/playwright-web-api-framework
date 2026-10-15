import { ExcelReader } from '../../../core/excel.reader';
import { jsonplaceholderConfig } from '../app.config';

/**
 * Thin wrapper over ExcelReader bound to this app's workbook. Fails loudly on
 * a missing testCaseId - ExcelReader returns an empty Map, which would
 * otherwise surface later as a confusing `undefined` assertion failure.
 */
export class TestData {
  static async load(): Promise<void> {
    await ExcelReader.loadWorkbook(jsonplaceholderConfig.testDataFile);
  }

  static async row(sheet: string, testCaseId: string): Promise<Map<string, string>> {
    const row = await ExcelReader.getTestDataRow(jsonplaceholderConfig.testDataFile, sheet, testCaseId);
    if (row.size === 0) throw new Error(`testCaseId '${testCaseId}' not found in sheet '${sheet}'`);
    return row;
  }

  /** All rows sharing one testCaseId - for cases that run the same check over several inputs. */
  static async rows(sheet: string, testCaseId: string): Promise<Array<Map<string, string>>> {
    const rows = await ExcelReader.getAllRowsForTestID(jsonplaceholderConfig.testDataFile, sheet, testCaseId);
    if (rows.length === 0) throw new Error(`testCaseId '${testCaseId}' not found in sheet '${sheet}'`);
    return rows;
  }
}
