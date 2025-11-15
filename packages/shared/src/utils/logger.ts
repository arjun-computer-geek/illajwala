type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  isProd?: boolean;
  logLevel?: LogLevel;
}

export class Logger {
  private isProd: boolean;
  private logLevel: LogLevel;

  constructor(config: LoggerConfig = {}) {
    this.isProd = config.isProd ?? process.env.NODE_ENV === 'production';
    this.logLevel = config.logLevel || (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private formatLog(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): LogEntry {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (context) {
      logEntry.context = context;
    }

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        ...(this.isProd ? {} : { stack: error.stack }),
      };
    }

    return logEntry;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private output(level: LogLevel, entry: LogEntry) {
    if (!this.shouldLog(level)) {
      return;
    }

    if (this.isProd) {
      // In production, output structured JSON for log aggregation
      console.log(JSON.stringify(entry));
    } else {
      // In development, output formatted logs
      const prefix = `[${entry.timestamp}] ${level.toUpperCase()}`;
      if (entry.error) {
        console.error(`${prefix}: ${entry.message}`, entry.error, entry.context);
      } else if (entry.context) {
        console.log(`${prefix}: ${entry.message}`, entry.context);
      } else {
        console.log(`${prefix}: ${entry.message}`);
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.output('debug', this.formatLog('debug', message, context));
  }

  info(message: string, context?: Record<string, unknown>) {
    this.output('info', this.formatLog('info', message, context));
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.output('warn', this.formatLog('warn', message, context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.output('error', this.formatLog('error', message, context, error));
  }
}

export const createLogger = (config?: LoggerConfig) => new Logger(config);
