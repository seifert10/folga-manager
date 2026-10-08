import React, { useState, useEffect } from 'react';
import Sidebar, { PageId } from './Sidebar';
import Header from './Header';
import CommandPalette from '../command/CommandPalette';
import FolgaModal from '../calendar/FolgaModal';
import EmployeeModal from '../employees/EmployeeModal';
import OnboardingModal from '../onboarding/OnboardingModal';
import { api } from '../../services/api';

interface AppLayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId, params?: any) => void;
  children: React.ReactNode;
  pageTitle: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  onNavigate,
  children,
  pageTitle,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [newDayOffModalOpen, setNewDayOffModalOpen] = useState(false);
  const [newEmployeeModalOpen, setNewEmployeeModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Carrega contagem de pendências para o badge da sidebar
  const loadPendingCount = () => {
    api.getDashboard()
      .then(data => {
        setPendingCount(data.stats.pendingDaysOff);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  // Atalho global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-mac-bg-light dark:bg-mac-bg-dark text-zinc-800 dark:text-zinc-100 flex transition-colors duration-200">
      {/* Sidebar macOS */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        pendingCount={pendingCount}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Conteúdo Principal com margem para a Sidebar no desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header Superior */}
        <Header
          title={pageTitle}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenNewDayOffModal={() => setNewDayOffModalOpen(true)}
          onNavigateToPlanner={() => onNavigate('planner')}
        />

        {/* Área de Visualização da Página */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Rodapé institucional com aviso legal obrigatório discreto */}
        <footer className="py-4 px-6 border-t border-black/[0.04] dark:border-white/[0.06] text-center text-xs text-zinc-400 dark:text-zinc-500">
          <p>
            Folga Manager © 2026 — Apoio ao planejamento de escalas e jornada conforme conceitos gerais da CLT.
          </p>
          <p className="text-[11px] mt-1 text-zinc-400/80">
            Este sistema não substitui orientação contábil, jurídica ou do departamento de Recursos Humanos.
          </p>
        </footer>
      </div>

      {/* Spotlight Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={onNavigate}
        onOpenNewDayOffModal={() => setNewDayOffModalOpen(true)}
        onOpenNewEmployeeModal={() => setNewEmployeeModalOpen(true)}
      />

      {/* Modal Rápido de Nova Folga */}
      <FolgaModal
        isOpen={newDayOffModalOpen}
        onClose={() => setNewDayOffModalOpen(false)}
        onSuccess={() => {
          loadPendingCount();
          // Notifica recarga para a página ativa através de evento customizado
          window.dispatchEvent(new CustomEvent('folga-updated'));
        }}
      />

      {/* Modal Rápido de Novo Funcionário */}
      <EmployeeModal
        isOpen={newEmployeeModalOpen}
        onClose={() => setNewEmployeeModalOpen(false)}
        onSuccess={() => {
          loadPendingCount();
          window.dispatchEvent(new CustomEvent('employee-updated'));
        }}
      />

      {/* Onboarding de Primeiro Acesso */}
      <OnboardingModal />
    </div>
  );
};

export default AppLayout;
