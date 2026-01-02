// =====================================================
// LOGGER UTILITY
// Sistema de logging para Atlas Solar
// =====================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

const LOG_COLORS = {
  debug: '\x1b[36m',   // Cyan
  info: '\x1b[32m',    // Green
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  reset: '\x1b[0m',    // Reset
};

function formatLog(entry: LogEntry): string {
  const color = LOG_COLORS[entry.level] || LOG_COLORS.reset;
  const levelUpper = entry.level.toUpperCase().padEnd(5);
  
  let log = `${color}[${entry.timestamp}] ${levelUpper}${LOG_COLORS.reset} ${entry.message}`;
  
  if (entry.data) {
    log += ` ${JSON.stringify(entry.data)}`;
  }
  
  return log;
}

function createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    data,
  };
}

export const logger = {
  debug(message: string, data?: any) {
    if (process.env.NODE_ENV !== 'production') {
      const entry = createLogEntry('debug', message, data);
      console.debug(formatLog(entry));
    }
  },
  
  info(message: string, data?: any) {
    const entry = createLogEntry('info', message, data);
    console.info(formatLog(entry));
  },
  
  warn(message: string, data?: any) {
    const entry = createLogEntry('warn', message, data);
    console.warn(formatLog(entry));
  },
  
  error(message: string, error?: any) {
    const entry = createLogEntry('error', message, {
      message: error?.message,
      stack: error?.stack,
      ...error,
    });
    console.error(formatLog(entry));
  },
};

export default logger;
