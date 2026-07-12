import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolClient } from 'pg';
import * as schema from './schema.ts';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to determine if an error is a connection-related termination
function isConnectionError(err: any): boolean {
  if (!err) return false;
  const errMsg = String(err.message || err).toLowerCase();
  return (
    errMsg.includes('connection terminated') ||
    errMsg.includes('unexpected') ||
    errMsg.includes('closed') ||
    errMsg.includes('broken pipe') ||
    errMsg.includes('socket') ||
    errMsg.includes('timeout') ||
    err.code === 'ECONNRESET' ||
    err.code === 'EPIPE'
  );
}

export const createPool = () => {
  const poolConfig: any = {
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
  };

  if (process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'))) {
    poolConfig.connectionString = process.env.DATABASE_URL;
  } else {
    poolConfig.host = process.env.SQL_HOST;
    poolConfig.user = process.env.SQL_USER;
    poolConfig.password = process.env.SQL_PASSWORD;
    poolConfig.database = process.env.SQL_DB_NAME;
  }

  poolConfig.max = 15;
  const rawPool = new Pool(poolConfig);

  // Wrap pool.query to retry once on connection errors with a progressive delay
  const origQuery = rawPool.query;
  rawPool.query = function (this: any, ...args: any[]): any {
    const lastArg = args[args.length - 1];
    const callback = typeof lastArg === 'function' ? lastArg : null;

    if (callback) {
      const queryArgs = args.slice(0, -1);
      const executeWithCallback = (attempt: number) => {
        return origQuery.call(rawPool, ...queryArgs, (err: any, res: any) => {
          if (err && isConnectionError(err) && attempt < 3) {
            const delay = attempt * 150;
            console.warn(`Connection error during pool.query callback (attempt ${attempt}), retrying in ${delay}ms:`, err.message);
            return setTimeout(() => executeWithCallback(attempt + 1), delay);
          }
          callback(err, res);
        });
      };
      return executeWithCallback(1);
    } else {
      const executeWithPromise = async (attempt: number): Promise<any> => {
        try {
          return await origQuery.apply(rawPool, args as any);
        } catch (err: any) {
          if (isConnectionError(err) && attempt < 3) {
            const delay = attempt * 150;
            console.warn(`Connection error during pool.query Promise (attempt ${attempt}), retrying in ${delay}ms:`, err.message);
            await sleep(delay);
            return await executeWithPromise(attempt + 1);
          }
          throw err;
        }
      };
      return executeWithPromise(1);
    }
  } as any;

  // Wrap pool.connect to retry once on connection errors with a progressive delay
  const origConnect = rawPool.connect;
  rawPool.connect = function (this: any, ...args: any[]): any {
    const callback = typeof args[0] === 'function' ? args[0] : null;

    if (callback) {
      const executeConnect = (attempt: number) => {
        return origConnect.call(rawPool, (err: any, client: any, release: any) => {
          if (err && isConnectionError(err) && attempt < 3) {
            const delay = attempt * 150;
            console.warn(`Connection error during pool.connect callback (attempt ${attempt}), retrying in ${delay}ms:`, err.message);
            return setTimeout(() => executeConnect(attempt + 1), delay);
          }
          callback(err, client, release);
        });
      };
      return executeConnect(1);
    } else {
      const executeConnectPromise = async (attempt: number): Promise<PoolClient> => {
        try {
          return await origConnect.apply(rawPool, args as any);
        } catch (err: any) {
          if (isConnectionError(err) && attempt < 3) {
            const delay = attempt * 150;
            console.warn(`Connection error during pool.connect Promise (attempt ${attempt}), retrying in ${delay}ms:`, err.message);
            await sleep(delay);
            return executeConnectPromise(attempt + 1);
          }
          throw err;
        }
      };
      return executeConnectPromise(1);
    }
  } as any;

  return rawPool;
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });


