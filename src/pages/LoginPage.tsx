import React, { useState } from 'react';
import { CalendarCheck, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TrafficLights from '../components/ui/TrafficLights';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha de acesso.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar. Verifique seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const testAccounts = [
    {
      role: 'ADMIN',
      title: 'Administrador Geral',
      subtitle: 'Acesso Global a Todos os Setores',
      email: 'admin@folgamanager.local',
      password: 'AdminPassword123!',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    },
    {
      role: 'MANAGER',
      title: 'Carlos Silva (Cozinha)',
      subtitle: 'Gestor Operacional — Setor Cozinha',
      email: 'cozinha@folgamanager.local',
      password: 'CozinhaPassword123!',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    },
    {
      role: 'MANAGER',
      title: 'Maria Santos (Salão)',
      subtitle: 'Gestora Operacional — Setor Salão',
      email: 'salao@folgamanager.local',
      password: 'SalaoPassword123!',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    },
    {
      role: 'MANAGER',
      title: 'João Pereira (Cozinha + Bar)',
      subtitle: 'Gestor Operacional — Cozinha e Bar',
      email: 'operacoes@folgamanager.local',
      password: 'OperacoesPassword123!',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    },
    {
      role: 'VIEWER',
      title: 'Ana Clara (Visualização)',
      subtitle: 'Usuário Leitor (Sem Permissão de Edição)',
      email: 'visualizacao@folgamanager.local',
      password: 'ViewerPassword123!',
      badgeColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
    }
  ];

  const fillCredentials = (acc: typeof testAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-100 via-zinc-50 to-blue-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900 flex items-center justify-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Painel Esquerdo: Formulário de Login */}
        <div className="lg:col-span-7 bg-white/90 dark:bg-zinc-900/90 mac-blur rounded-3xl border border-black/[0.08] dark:border-white/[0.08] p-6 sm:p-10 shadow-2xl shadow-zinc-300/40 dark:shadow-black/60 flex flex-col justify-between">
          <div>
            {/* Top Bar macOS */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-black/[0.05] dark:border-white/[0.05]">
              <TrafficLights />
              <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>Autenticação Segura</span>
              </div>
            </div>

            {/* Cabeçalho do App */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-mac-blue flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Folga Manager
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Gestão Inteligente de Escalas e DSR (CLT)
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Acesse seu painel
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Entre com suas credenciais ou selecione uma conta de demonstração.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  E-mail corporativo
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: admin@folgamanager.local"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-zinc-50/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-mac-blue text-zinc-900 dark:text-zinc-100 transition-all placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-zinc-50/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-mac-blue text-zinc-900 dark:text-zinc-100 transition-all placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-mac-blue hover:bg-blue-600 active:scale-[0.99] text-white text-sm font-semibold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
            <span>Folga Manager v2.0 (Multi-Gestor)</span>
            <span>CLT & Escalas 6x1</span>
          </div>
        </div>

        {/* Painel Direito: Acesso Rápido com Contas de Demonstração */}
        <div className="lg:col-span-5 bg-zinc-50/80 dark:bg-zinc-900/60 mac-blur rounded-3xl border border-black/[0.06] dark:border-white/[0.06] p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Acesso Rápido para Testes
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              Clique em um dos perfis pré-configurados para preencher as credenciais e testar o isolamento de escopo:
            </p>

            <div className="space-y-2.5">
              {testAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillCredentials(acc)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all duration-150 flex items-start justify-between group hover:scale-[1.01] hover:shadow-sm ${
                    email === acc.email
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-mac-blue dark:border-blue-700 shadow-xs'
                      : 'bg-white/80 dark:bg-zinc-800/80 border-black/[0.04] dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-mac-blue transition-colors">
                        {acc.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                      {acc.subtitle}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-1">
                      {acc.email}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 uppercase tracking-wider ${acc.badgeColor}`}>
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 p-3 rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.04] text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Perfil define permissões; setores autorizados definem o escopo.</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
