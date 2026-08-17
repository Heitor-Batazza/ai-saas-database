import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

/**
 * --------------------------------------------------------------------------------
 * CONEXÃO COM O POSTGRESQL
 * --------------------------------------------------------------------------------
 * Utiliza o driver 'postgres' de alta performance com pooling de conexões
 * e injeta todo o nosso schema para habilitar a Query API do Drizzle com autocomplete.
 */

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_saas_db';

// Desabilita prefetch em ambientes serverless se necessário
export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export * from './schema.js';
