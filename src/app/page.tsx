import { getWorkspaceWithDetails, getWorkspaceUsageSummary } from '@/db/queries';
import { 
  Building2, 
  Users, 
  FileText, 
  Zap, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Plus
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 1. Busca os dados reais diretamente do Supabase na renderização
  const workspace = await getWorkspaceWithDetails('tech-labs-ai');
  const usage = workspace ? await getWorkspaceUsageSummary(workspace.id) : null;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex">
      {/* Barra Lateral de Navegação (Sidebar) */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0b0f19]/60 backdrop-blur-xl p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">TechLabs AI</h1>
              <span className="text-xs text-indigo-400 font-medium">Enterprise Core</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <a href="#" className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-indigo-600/10 text-indigo-400 font-medium text-sm border border-indigo-500/20">
              <Building2 className="w-4 h-4" />
              Dashboard
            </a>
            <a href="#documents" className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 text-sm transition">
              <FileText className="w-4 h-4" />
              Documentos & IA
            </a>
            <a href="#team" className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 text-sm transition">
              <Users className="w-4 h-4" />
              Equipe & Membros
            </a>
            <a href="#usage" className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 text-sm transition">
              <Zap className="w-4 h-4" />
              Consumo de Tokens
            </a>
          </nav>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>Banco de Dados:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Conectado
            </span>
          </div>
          <p className="text-[11px] text-slate-500">PostgreSQL + pgvector (Supabase)</p>
        </div>
      </aside>

      {/* Conteúdo Principal do Dashboard */}
      <main className="flex-1 p-6 md:p-10 space-y-8 max-w-7xl mx-auto overflow-y-auto">
        {/* Cabeçalho */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {workspace?.name || 'Workspace'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Plano {workspace?.planTier}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Gestão de dados e inteligência vetorial conectada ao Supabase
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs text-slate-400 block">Saldo de Créditos</span>
                <span className="text-sm font-bold text-white">{workspace?.creditsBalance || 0} créditos</span>
              </div>
            </div>
          </div>
        </header>

        {/* Cards de Métricas Principais */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Membros da Equipe</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{workspace?.members?.length || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Usuários com acesso ao workspace</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Documentos Indexados</span>
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{workspace?.documents?.length || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Base de conhecimento em RAG</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Tokens de IA Gastos</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{usage?.totalTokens || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Total acumulado no mês</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Motor Vetorial</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">pgvector</div>
            <p className="text-xs text-slate-500 mt-1">1536 dimensões ativas</p>
          </div>
        </section>

        {/* Grid com Tabelas de Dados Reais: Membros & Documentos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seção de Membros da Equipe */}
          <section id="team" className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Membros da Equipe
              </h3>
              <span className="text-xs text-slate-500">{workspace?.members?.length || 0} cadastrados</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {workspace?.members?.map((member) => (
                <div key={member.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {member.user.avatarUrl ? (
                      <img 
                        src={member.user.avatarUrl} 
                        alt={member.user.fullName} 
                        className="w-9 h-9 rounded-full object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-400">
                        {member.user.fullName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-white block">{member.user.fullName}</span>
                      <span className="text-xs text-slate-400">{member.user.email}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${
                    member.role === 'owner' 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                      : member.role === 'admin' 
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Seção de Documentos na Base */}
          <section id="documents" className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Documentos & Conhecimento
              </h3>
              <span className="text-xs text-slate-500">{workspace?.documents?.length || 0} arquivos</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {workspace?.documents?.map((doc) => (
                <div key={doc.id} className="py-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium text-white block truncate max-w-[240px] sm:max-w-xs">
                      {doc.title}
                    </span>
                    <span className="text-xs text-slate-500">
                      Tamanho: {(doc.fileSize ? (doc.fileSize / 1024).toFixed(0) : 0)} KB • Tipo: {doc.mimeType}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
