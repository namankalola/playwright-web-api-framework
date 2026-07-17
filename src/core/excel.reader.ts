import Exceljs from 'exceljs';
import { Logger } from './logger';

export class ExcelReader {
  private static workbookData = new Map<string, Record<string, string>[]>();
  private static workbook: Exceljs.Workbook | null = null;
  private static loadedFile = '';

  private static async ensureWorkbook(filePath: string): Promise<Exceljs.Workbook> {
    if (this.workbook && this.loadedFile === filePath) {
      return this.workbook;
    }
    Logger.info(`Loading workbook from: ${filePath}`);
    this.workbook = new Exceljs.Workbook();
    await this.workbook.xlsx.readFile(filePath);
    this.loadedFile = filePath;
    return this.workbook;
  }

  private static worksheetToRecords(worksheet: Exceljs.Worksheet): Record<string, string>[] {
    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell, col) => {
      headers[col - 1] = cell.text.trim();
    });
    const rows: Record<string, string>[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = row.getCell(index + 1).text.trim();
      });
      rows.push(record);
    });
    return rows;
  }

  static async getExcelFile(sheetName: string, filePath: string): Promise<{ workbook: Exceljs.Workbook; worksheet: Exceljs.Worksheet }> {
    const workbook = await this.ensureWorkbook(filePath);
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      throw new Error(
        `Worksheet '${sheetName}' was not found in '${filePath}'.`
      );
    }
    return { workbook, worksheet };
  }

  static async getColumnIdxByName(filePath: string, sheetName: string, columnName: string): Promise<number> {
    const { worksheet } = await this.getExcelFile(sheetName, filePath);
    const header = worksheet.getRow(1);
    for (let i = 1; i <= header.cellCount; i++) {
      if (header.getCell(i).text.trim() === columnName) {
        return i;
      }
    }
    throw new Error(`Column '${columnName}' not found.`);
  }

  static async getTestDataRow(filePath: string, sheetName: string, testID: string): Promise<Map<string, string>> {
    const rows = await this.getAllRowsFromSheet(filePath, sheetName);
    const result = rows.find(r => r.get('testCaseId') === testID);
    return result ?? new Map<string, string>();
  }

  static async getAllRowsForTestID(filePath: string, sheetName: string, testID: string): Promise<Array<Map<string, string>>> {
    const rows = await this.getAllRowsFromSheet(filePath, sheetName);
    return rows.filter(r => r.get('testCaseId') === testID);
  }

  static async loadWorkbook(filePath: string): Promise<void> {
    if (this.workbookData.size > 0 && this.loadedFile === filePath) {
      return;
    }
    this.workbookData.clear();
    const workbook = await this.ensureWorkbook(filePath);
    workbook.eachSheet(sheet => {
      this.workbookData.set(
        sheet.name,
        this.worksheetToRecords(sheet)
      );
    });
  }

  static getSheet(sheetName: string): Record<string, string>[] {
    const sheet = this.workbookData.get(sheetName);
    if (!sheet) {
      throw new Error(`Sheet '${sheetName}' not found.`);
    }
    return sheet;
  }

  static getAllRows(sheetName: string, testCaseId: string): Record<string, string>[] {
    const rows = this.getSheet(sheetName)
      .filter(r => r.testCaseId === testCaseId);
    if (rows.length === 0) {
      throw new Error(
        `TestCaseID '${testCaseId}' not found in '${sheetName}'.`
      );
    }
    return rows;
  }

  static getWorkbook(): Map<string, Record<string, string>[]> {
    return this.workbookData;
  }

  static clearWorkbook(): void {
    this.workbookData.clear();
    this.workbook = null;
    this.loadedFile = '';
    Logger.info("Datasheets closed and workbook object released");
  }

  static async getAllRowsFromSheet(filePath: string, sheetName: string): Promise<Array<Map<string, string>>> {
    if (this.workbookData.size === 0 || this.loadedFile !== filePath) {
      await this.loadWorkbook(filePath);
    }
    const sheet = this.getSheet(sheetName);
    return sheet.map(record => new Map(Object.entries(record)));
  }
}