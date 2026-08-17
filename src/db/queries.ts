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
 * CONSULTA 1: Busca Relacional Completa (Joins Automáticos com Drizzle)
 * --------------------------------------------------------------------------------
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
 * CONSULTA 2: Agregação de Consumo de Tokens & Créditos
 * --------------------------------------------------------------------------------
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
 * CONSULTA 3: Busca Semântica por Similaridade Vetorial (RAG Core)
 * --------------------------------------------------------------------------------
 * Utiliza o operador de Distância de Cosseno (<=>) do pgvector no PostgreSQL.
 */
export async function findSimilarChunks(
  workspaceId: string,
  queryEmbedding: number[],
  limit = 3
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
    .where(eq(documents.workspaceId, workspaceId))
    .orderBy(desc(similarity))
    .limit(limit);
}

/**
 * --------------------------------------------------------------------------------
 * DEMONSTRAÇÃO EXECUTÁVEL
 * --------------------------------------------------------------------------------
 */
async function runDemo() {
  console.log('⚡ Executando consultas no Supabase...\n');

  // 1. Testar busca aninhada de Workspace
  console.log('🔍 [1] Buscando detalhes completos do workspace "tech-labs-ai":');
  const ws = await getWorkspaceWithDetails('tech-labs-ai');
  if (ws) {
    console.log(`🏢 Workspace: ${ws.name} (Plano: ${ws.planTier.toUpperCase()} | Créditos: ${ws.creditsBalance})`);
    console.log(`👥 Membros (${ws.members.length}):`, ws.members.map((m) => `${m.user.fullName} (${m.role})`).join(', '));
    console.log(`📄 Documentos (${ws.documents.length}):`, ws.documents.map((d) => d.title).join(', '));
  }

  console.log('\n------------------------------------------------------------\n');

  // 2. Testar métricas de consumo de IA
  if (ws) {
    console.log('📊 [2] Calculando consumo de IA e créditos gastos:');
    const usage = await getWorkspaceUsageSummary(ws.id);
    console.log(`Tokens Consumidos: ${usage.totalTokens}`);
    console.log(`Créditos Gastos: ${usage.totalCreditsSpent}`);
    console.log(`Chamadas de IA Registradas: ${usage.totalQueries}`);

    console.log('\n------------------------------------------------------------\n');

    // 3. Testar Busca Semântica Vetorial (RAG)
    console.log('🧠 [3] Testando Busca Semântica Vetorial com pgvector (Cálculo de Cosseno):');
    const mockQueryVector = Array.from({ length: 1536 }, () => Number((Math.random() * 2 - 1).toFixed(4)));
    const similarChunks = await findSimilarChunks(ws.id, mockQueryVector, 2);

    similarChunks.forEach((chunk, index) => {
      console.log(`\nResultado #${index + 1} (Score de Similaridade: ${(Number(chunk.similarityScore) * 100).toFixed(2)}%):`);
      console.log(`📖 Documento: "${chunk.documentTitle}"`);
      console.log(`💬 Trecho recuperado: "${chunk.content}"`);
    });
  }

  console.log('\n✅ Todas as consultas foram executadas com sucesso!');
  process.exit(0);
}

runDemo().catch((err) => {
  console.error('❌ Erro na consulta:', err);
  process.exit(1);
});
