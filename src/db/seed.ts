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

/**
 * --------------------------------------------------------------------------------
 * SCRIPT DE SEED: Povoamento de Dados para Testes Locais
 * --------------------------------------------------------------------------------
 * Cria uma estrutura completa de teste com:
 * 1. Usuário Administrador
 * 2. Workspace Pro com 500 créditos
 * 3. Documento de Engenharia
 * 4. Chunks de texto com embeddings simulados (1536 dimensões)
 * 5. Logs de consumo de tokens
 */

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // 1. Criar Usuário
    const [user] = await db
      .insert(users)
      .values({
        email: 'heitor@example.com',
        fullName: 'Heitor Batazza',
        avatarUrl: 'https://github.com/Heitor-Batazza.png',
      })
      .returning();

    console.log(`✅ Usuário criado: ${user.fullName} (${user.id})`);

    // 2. Criar Workspace
    const [workspace] = await db
      .insert(workspaces)
      .values({
        name: 'Tech Labs AI',
        slug: 'tech-labs-ai',
        planTier: 'pro',
        creditsBalance: 500,
      })
      .returning();

    console.log(`✅ Workspace criado: ${workspace.name} (${workspace.id})`);

    // 3. Vincular Usuário como Owner do Workspace
    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    });

    console.log(`✅ Membro vinculado como Owner`);

    // 4. Criar Documento de Exemplo
    const [doc] = await db
      .insert(documents)
      .values({
        workspaceId: workspace.id,
        uploadedById: user.id,
        title: 'Manual de Engenharia de Prompts e RAG v1.0.pdf',
        fileSize: 1024 * 350, // 350 KB
        mimeType: 'application/pdf',
        status: 'ready',
        metadata: {
          totalPages: 12,
          category: 'technical-spec',
        },
      })
      .returning();

    console.log(`✅ Documento criado: ${doc.title} (${doc.id})`);

    // 5. Criar Chunks com Embeddings Simulados (1536 floats)
    const mockEmbedding = Array.from({ length: 1536 }, () => Number((Math.random() * 2 - 1).toFixed(4)));

    await db.insert(documentChunks).values([
      {
        documentId: doc.id,
        chunkIndex: 0,
        content: 'Introdução à Arquitetura RAG: O Retrieval-Augmented Generation conecta LLMs a bancos de dados externos.',
        tokenCount: 22,
        embedding: mockEmbedding,
      },
      {
        documentId: doc.id,
        chunkIndex: 1,
        content: 'Uso do pgvector no PostgreSQL: Permite calcular similaridade por cosseno em milissegundos usando índices HNSW.',
        tokenCount: 24,
        embedding: mockEmbedding,
      },
    ]);

    console.log(`✅ Chunks vetoriais inseridos com embeddings de 1536 dimensões`);

    // 6. Registrar Log de Consumo de Tokens
    await db.insert(usageLogs).values({
      workspaceId: workspace.id,
      userId: user.id,
      action: 'ai_chat',
      tokensUsed: 1450,
      costInCredits: 2,
      metadata: {
        model: 'gemini-1.5-pro',
        promptTokens: 1100,
        completionTokens: 350,
      },
    });

    console.log(`✅ Log de consumo de tokens registrado`);

    console.log('🎉 Seed concluído com sucesso total!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  }
}

seed();
