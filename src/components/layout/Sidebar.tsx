import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarCheck,
  BarChart3,
  History,
  Lightbulb,
  Settings,
  X,
  Sparkles,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import TrafficLights from '../ui/TrafficLights';
import { useAuth } from '../../context/AuthContext';

export type PageId =
  | 'dashboard'
  | 'employees'
  | 'schedule'
  | 'planner'
  | 'reports'
  | 'history'
  | 'legal-tips'
  | 'settings'
  | 'admin-users'
  | 'admin-departments';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  pendingCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  pendingCount = 0,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { isAdmin, isViewer } = useAuth();

  // Menu Principal condicionado ao perfil
  const mainMenuItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees' as PageId, label: 'Funcionários', icon: Users },
    { id: 'schedule' as PageId, label: 'Escala', icon: Calendar },
    // Planejar Folgas (oculto para VIEWER)
    ...(!isViewer ? [{
      id: 'planner' as PageId,
      label: 'Folgas & Pendências',
      icon: CalendarCheck,
      badge: pendingCount > 0 ? `${pendingCount}` : undefined,
      badgeAlert: pendingCount > 0,
    }] : []),
    { id: 'reports' as PageId, label: 'Relatórios', icon: BarChart3 },
    // Histórico / Auditoria (oculto para VIEWER conforme requisito 25)
    ...(!isViewer ? [{ id: 'history' as PageId, label: 'Histórico', icon: History }] : []),
    { id: 'legal-tips' as PageId, label: 'Dicas Trabalhistas', icon: Lightbulb },
  ];

  // Seção Administrativa (exclusiva do ADMIN)
  const adminMenuItems = [
    { id: 'admin-users' as PageId, label: 'Usuários & Perfis', icon: ShieldCheck },
    { id: 'admin-departments' as PageId, label: 'Setores da Empresa', icon: Building2 },
    { id: 'settings' as PageId, label: 'Configurações', icon: Settings },
  ];

  const handleItemClick = (id: PageId) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Backdrop para mobile */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white/80 dark:bg-zinc-900/80 mac-blur border-r border-black/[0.06] dark:border-white/[0.08] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top bar da sidebar com TrafficLights estilo macOS */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <TrafficLights />
            <span className="text-[11px] font-medium tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
              macOS Edition
            </span>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo / Título do App */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-mac-blue flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Folga Manager
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-none mt-0.5">
                Escalas & DSR Inteligente
              </p>
            </div>
          </div>
        </div>

        {/* Links de navegação */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">
              Menu Principal
            </div>

            <div className="space-y-1">
              {mainMenuItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-left select-none ${
                      isActive
                        ? 'bg-mac-blue text-white shadow-sm shadow-blue-500/20 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/30 text-white'
                            : item.badgeAlert
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 animate-pulse'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção Administração exclusiva para Administradores */}
          {isAdmin && (
            <div>
              <div className="px-3 pb-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 tracking-wider uppercase">
                Administração
              </div>

              <div className="space-y-1">
                {adminMenuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-left select-none ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20 font-semibold'
                          : 'text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Card sutil na base da sidebar com aviso legal */}
        <div className="p-3.5 m-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-start gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="leading-tight">
              Apoio de gestão à CLT e DSR. Regras podem variar conforme CCT ou acordo coletivo.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
