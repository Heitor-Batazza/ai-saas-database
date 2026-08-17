import { db } from './index.js';
import { users, workspaces, workspaceMembers } from './schema.js';
import { eq } from 'drizzle-orm';

/**
 * --------------------------------------------------------------------------------
 * SCRIPT PRÁTICO: Adicionar um Novo Usuário e Vinculá-lo a um Workspace
 * --------------------------------------------------------------------------------
 * Este script demonstra como criar um novo usuário e associá-lo como "admin"
 * na empresa existente "Tech Labs AI".
 */

async function addNewUser() {
  console.log('👤 [1] Inserindo novo usuário na tabela `users`...');

  // 1. Inserir o novo usuário
  const [newUser] = await db
    .insert(users)
    .values({
      email: 'marina.costa@techlabs.com',
      fullName: 'Marina Costa',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    })
    .returning(); // Retorna o registro completo recém-criado com o ID gerado

  console.log(`✅ Usuário criado com sucesso:`);
  console.log(`   - ID: ${newUser.id}`);
  console.log(`   - Nome: ${newUser.fullName}`);
  console.log(`   - E-mail: ${newUser.email}`);

  // 2. Buscar o workspace existente "tech-labs-ai"
  console.log('\n🏢 [2] Buscando workspace "tech-labs-ai" para vincular o membro...');
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, 'tech-labs-ai'),
  });

  if (!workspace) {
    console.error('❌ Workspace não encontrado!');
    process.exit(1);
  }

  // 3. Vincular a nova usuária ao workspace como 'admin'
  console.log('\n👥 [3] Vinculando Marina Costa como "admin" no workspace...');
  const [membership] = await db
    .insert(workspaceMembers)
    .values({
      workspaceId: workspace.id,
      userId: newUser.id,
      role: 'admin',
    })
    .returning();

  console.log(`✅ Membro adicionado com sucesso! (Papel: ${membership.role.toUpperCase()})`);
  console.log('\n🎉 Operação concluída! Abra o Supabase Table Editor para ver a nova linha.');
  process.exit(0);
}

addNewUser().catch((err) => {
  console.error('❌ Erro ao adicionar usuário:', err);
  process.exit(1);
});
