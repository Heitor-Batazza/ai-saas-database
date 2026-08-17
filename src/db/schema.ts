import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
  customType,
} from 'drizzle-orm/pg-core';

/**
 * --------------------------------------------------------------------------------
 * TIPO CUSTOMIZADO: pgvector (Embeddings de IA)
 * --------------------------------------------------------------------------------
 * Armazena representações vetoriais de 1536 dimensões (padrão de modelos como
 * text-embedding-3-small da OpenAI ou text-embedding-004 do Gemini).
 */
export const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  },
});

/**
 * --------------------------------------------------------------------------------
 * ENUMS: Padronização de Estados e Permissões
 * --------------------------------------------------------------------------------
 */
export const planTierEnum = pgEnum('plan_tier', ['free', 'pro', 'enterprise']);
export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member']);
export const documentStatusEnum = pgEnum('document_status', ['processing', 'ready', 'failed']);
export const usageActionEnum = pgEnum('usage_action', [
  'ai_chat',
  'embedding_generation',
  'document_parsing',
]);

/**
 * --------------------------------------------------------------------------------
 * 1. TABELA: users (Usuários Globais)
 * --------------------------------------------------------------------------------
 * Guarda a identidade do usuário. Um usuário pode pertencer a múltiplos workspaces.
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * --------------------------------------------------------------------------------
 * 2. TABELA: workspaces (Multi-Tenancy / Organizações)
 * --------------------------------------------------------------------------------
 * Cada workspace isola completamente os dados de uma empresa/equipe.
 * Controla faturamento e saldo de créditos de IA.
 */
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  planTier: planTierEnum('plan_tier').default('free').notNull(),
  creditsBalance: integer('credits_balance').default(100).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * --------------------------------------------------------------------------------
 * 3. TABELA: workspace_members (Relação N:N entre Users e Workspaces)
 * --------------------------------------------------------------------------------
 * Define quem tem acesso a qual workspace e com qual papel (owner, admin, member).
 */
export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').default('member').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Garante que o mesmo usuário não seja adicionado duas vezes no mesmo workspace
    uniqueIndex('workspace_user_unique_idx').on(table.workspaceId, table.userId),
    index('workspace_members_user_idx').on(table.userId),
  ]
);

/**
 * --------------------------------------------------------------------------------
 * 4. TABELA: documents (Arquivos e Conteúdos Carregados)
 * --------------------------------------------------------------------------------
 * PDFs, manuais e planilhas enviados pelo cliente para a base de conhecimento.
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    uploadedById: uuid('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    fileUrl: text('file_url'),
    fileSize: integer('file_size'),
    mimeType: varchar('mime_type', { length: 100 }),
    status: documentStatusEnum('status').default('processing').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('documents_workspace_idx').on(table.workspaceId),
    index('documents_status_idx').on(table.status),
  ]
);

/**
 * --------------------------------------------------------------------------------
 * 5. TABELA: document_chunks (Pedaços de Texto + Vetor pgvector)
 * --------------------------------------------------------------------------------
 * Onde reside a inteligência: cada documento é dividido em "chunks" com seu embedding.
 */
export const documentChunks = pgTable(
  'document_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    tokenCount: integer('token_count'),
    embedding: vector1536('embedding'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('document_chunks_doc_idx').on(table.documentId),
    index('document_chunks_index_idx').on(table.documentId, table.chunkIndex),
  ]
);

/**
 * --------------------------------------------------------------------------------
 * 6. TABELA: usage_logs (Auditoria e Faturamento de Tokens)
 * --------------------------------------------------------------------------------
 * Rastreia cada chamada de IA, tokens gastos e custo em créditos para evitar abusos.
 */
export const usageLogs = pgTable(
  'usage_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: usageActionEnum('action').notNull(),
    tokensUsed: integer('tokens_used').default(0).notNull(),
    costInCredits: integer('cost_in_credits').default(1).notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('usage_logs_workspace_idx').on(table.workspaceId),
    index('usage_logs_created_at_idx').on(table.createdAt),
  ]
);

/**
 * --------------------------------------------------------------------------------
 * 7. TABELA: api_keys (Chaves de Integração Externa)
 * --------------------------------------------------------------------------------
 * Permite que clientes integrem seus próprios sistemas via API de forma autenticada.
 */
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    keyPrefix: varchar('key_prefix', { length: 16 }).notNull(), // Ex: 'sk_live_abc123'
    keyHash: varchar('key_hash', { length: 255 }).notNull().unique(), // Hash seguro SHA-256
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('api_keys_workspace_idx').on(table.workspaceId)]
);

/**
 * --------------------------------------------------------------------------------
 * RELAÇÕES (Drizzle Relations)
 * --------------------------------------------------------------------------------
 * Permite consultas aninhadas intuitivas com o Drizzle Query API (ex: db.query.workspaces.findFirst({ with: { members: true } }))
 */

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(workspaceMembers),
  documentsUploaded: many(documents),
  usageLogs: many(usageLogs),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  documents: many(documents),
  usageLogs: many(usageLogs),
  apiKeys: many(apiKeys),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [documents.workspaceId],
    references: [workspaces.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id],
  }),
  chunks: many(documentChunks),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}));

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [usageLogs.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [usageLogs.userId],
    references: [users.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [apiKeys.workspaceId],
    references: [workspaces.id],
  }),
}));

/**
 * --------------------------------------------------------------------------------
 * EXPORT DE TIPOS TYPESCRIPT
 * --------------------------------------------------------------------------------
 * Inferência automática de tipos estritos para uso no Backend e Frontend.
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;

export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
