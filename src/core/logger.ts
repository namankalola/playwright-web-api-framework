/* eslint-disable no-console */
type LogLevel = 'INFO' | 'STEP' | 'WARN' | 'ERROR' | 'DEBUG';

export class Logger {
  static timestamp(): string {
    return new Date().toISOString();
  }

  static write(level: LogLevel, message: string, meta?: unknown): void {
    const line = `[${this.timestamp()}] [${level}] ${message}`;
    if (meta !== undefined) {
      console.log(line, meta);
    } else {
      console.log(line);
    }
  }

  static info(message: string, meta?: unknown): void {
    this.write('INFO', message, meta);
  }

  static step(message: string): void {
    this.write('STEP', `➤ ${message}`);
  }

  static warn(message: string, meta?: unknown): void {
    this.write('WARN', message, meta);
  }

  static error(message: string, meta?: unknown): void {
    this.write('ERROR', message, meta);
  }

  static debug(message: string, meta?: unknown): void {
    if (process.env.DEBUG) {
      this.write('DEBUG', message, meta);
    }
  }
}
