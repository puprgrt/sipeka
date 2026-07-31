import pino from 'pino';

/**
 * Structured Logger menggunakan Pino
 * Mendukung JSON logging untuk production-ready monitoring
 */
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  /**
   * Pretty printing untuk development
   */
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,

  /**
   * Base fields yang akan ditambahkan ke setiap log
   */
  base: {
    env: process.env.NODE_ENV,
    version: '1.0.0',
  },

  /**
   * Timestamp format
   */
  timestamp: pino.stdTimeFunctions.isoTime,

  /**
   * Serializers untuk menangani object khusus
   */
  serializers: {
    req: (request: any) => ({
      id: request.id,
      method: request.method,
      path: request.path,
      url: request.url,
      remoteAddress: request.ip,
      userAgent: request.headers['user-agent'],
    }),
    res: (response: any) => ({
      statusCode: response.statusCode,
      responseTime: `${response.responseTime}ms`,
    }),
    err: pino.stdSerializers.err,
  },
});

/**
 * Child logger dengan context
 */
export const createChildLogger = (context: Record<string, any>) => {
  return logger.child(context);
};
