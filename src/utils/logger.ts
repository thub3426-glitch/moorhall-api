/**
 * Simple logger utility
 * Provides consistent logging across the application
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

type LogLevel = keyof typeof levels;

function shouldLog(level: LogLevel): boolean {
  const currentLevel = levels[LOG_LEVEL as LogLevel] ?? levels.info;
  return levels[level] >= currentLevel;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

const logger = {
  debug: (message: string, data?: any) => {
    if (shouldLog('debug')) {
      console.log(`[${formatTimestamp()}] DEBUG: ${message}`, data ? data : '');
    }
  },

  info: (message: string, data?: any) => {
    if (shouldLog('info')) {
      console.log(`[${formatTimestamp()}] INFO: ${message}`, data ? data : '');
    }
  },

  warn: (message: string, data?: any) => {
    if (shouldLog('warn')) {
      console.warn(`[${formatTimestamp()}] WARN: ${message}`, data ? data : '');
    }
  },

  error: (message: string, data?: any) => {
    if (shouldLog('error')) {
      console.error(`[${formatTimestamp()}] ERROR: ${message}`, data ? data : '');
    }
  },
};

export default logger;
