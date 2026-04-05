// Simple structured logger (can be replaced with pino when dependencies are installed)
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: unknown;
}

const formatLog = (level: LogLevel, data: LogData, message?: string) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    level,
    time: timestamp,
    service: 'visiondesk-api',
    ...data,
    ...(message && { msg: message }),
  };
  return JSON.stringify(logEntry);
};

export const logger = {
  debug: (data: LogData | string, message?: string) => {
    if (process.env.NODE_ENV === 'development') {
      const logData = typeof data === 'string' ? { msg: data } : data;
      console.debug(formatLog('debug', logData, message));
    }
  },
  info: (data: LogData | string, message?: string) => {
    const logData = typeof data === 'string' ? { msg: data } : data;
    console.info(formatLog('info', logData, message));
  },
  warn: (data: LogData | string, message?: string) => {
    const logData = typeof data === 'string' ? { msg: data } : data;
    console.warn(formatLog('warn', logData, message));
  },
  error: (data: LogData | string, message?: string) => {
    const logData = typeof data === 'string' ? { msg: data } : data;
    console.error(formatLog('error', logData, message));
  },
};

export default logger;
