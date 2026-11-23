import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(packageRoot, '.env') });

const connectionUri = process.env.DATABASE_URL || 'mysql://pantau_user:pantau_pass@127.0.0.1:3306/pantaunegeri';

// Create connection pool
export const poolConnection = mysql.createPool(connectionUri);
export const db = drizzle(poolConnection, { schema, mode: 'default' });

export * from './schema.js';
