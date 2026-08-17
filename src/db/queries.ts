import { db } from './index.js';
import {
  users,
  workspaces,
  workspaceMembers,
  documents,
  documentChunks,
  usageLogs,
  apiKeys,
} from './schema.js';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * --------------------------------------------------------------------------------
 * EXEMPLO 1: Consulta Relacional Completa (com Joins Automáticos)
 * --------------------------------------------------------------------------------
 * Busca um workspace pelo slug trazendo todos os membros, seus dados de usuário
 * e a lista de documentos cadastrados com apenas uma query eficiente.
 */
export async function getWorkspaceWithDetails(slug: string) {
  return await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, slug),
    with: {
      members: {
        with: {
          user: true,
        },
      },
      documents: {
        orderBy: [desc(documents.createdAt)],
      },
      apiKeys: true,
    },
  });
}

/**
 * --------------------------------------------------------------------------------
 * EXEMPLO 2: Rastreamento de Consumo de Tokens & Créditos por Workspace
 * --------------------------------------------------------------------------------
 * Agrupa todos os logs de uso de IA para calcular o total de tokens gastos
 * e o total de créditos consumidos no mês.
 */
export async function getWorkspaceUsageSummary(workspaceId: string) {
  const [summary] = await db
    .select({
      totalTokens: sql<number>`COALESCE(SUM(${usageLogs.tokensUsed}), 0)`,
      totalCreditsSpent: sql<number>`COALESCE(SUM(${usageLogs.costInCredits}), 0)`,
      totalQueries: sql<number>`COUNT(${usageLogs.id})`,
    })
    .from(usageLogs)
    .where(eq(usageLogs.workspaceId, workspaceId));

  return summary;
}

/**
 * --------------------------------------------------------------------------------
 * EXEMPLO 3: Busca Semântica por Similaridade Vetorial (RAG Core)
 * --------------------------------------------------------------------------------
 * Recebe o vetor da pergunta do usuário (1536 dimensões) e calcula a Distância
 * de Cosseno (<=> no PostgreSQL com pgvector) para achar os chunks mais relevantes.
 */
export async function findSimilarChunks(
  workspaceId: string,
  queryEmbedding: number[],
  limit = 5,
  similarityThreshold = 0.7
) {
  const similarity = sql<number>`1 - (${documentChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`;

  return await db
    .select({
      chunkId: documentChunks.id,
      documentId: documentChunks.documentId,
      content: documentChunks.content,
      similarityScore: similarity,
      documentTitle: documents.title,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(
      sql`${documents.workspaceId} = ${workspaceId} AND ${similarity} > ${similarityThreshold}`
    )
    .orderBy(desc(similarity))
    .limit(limit);
}
