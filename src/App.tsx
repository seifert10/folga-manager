import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import { PageId } from './components/layout/Sidebar';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import DaysOffPlannerPage from './pages/DaysOffPlannerPage';
import SchedulePage from './pages/SchedulePage';
import HistoryPage from './pages/HistoryPage';
import ReportsPage from './pages/ReportsPage';
import LegalTipsPage from './pages/LegalTipsPage';
import SettingsPage from './pages/SettingsPage';
import UsersAdminPage from './pages/UsersAdminPage';
import DepartmentsAdminPage from './pages/DepartmentsAdminPage';
import LoginPage from './pages/LoginPage';

function AppContent() {
  const { isAuthenticated, isLoading, isAdmin, isViewer } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-mac-blue border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Iniciando Folga Manager...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const pageTitles: Record<PageId, string> = {
    dashboard: 'Dashboard Principal',
    employees: 'Gestão de Funcionários',
    schedule: 'Escala & Calendário',
    planner: 'Planejamento de Folgas & Pendências',
    reports: 'Relatórios & Exportação',
    history: 'Histórico de Alterações',
    'legal-tips': 'Dicas Trabalhistas & Legislação CLT',
    settings: 'Configurações do Sistema',
    'admin-users': 'Administração de Usuários & Perfis',
    'admin-departments': 'Administração de Setores da Empresa',
  };

  // Se um não-administrador tentar acessar página restrita, redireciona para o dashboard
  const activePage: PageId =
    (!isAdmin && (currentPage === 'admin-users' || currentPage === 'admin-departments' || currentPage === 'settings')) ||
    (isViewer && (currentPage === 'planner' || currentPage === 'history'))
      ? 'dashboard'
      : currentPage;

  return (
    <AppLayout
      currentPage={activePage}
      onNavigate={(page) => setCurrentPage(page)}
      pageTitle={pageTitles[activePage] || 'Folga Manager'}
    >
      {activePage === 'dashboard' ? (
        <DashboardPage onNavigate={(page: PageId) => setCurrentPage(page)} />
      ) : activePage === 'employees' ? (
        <EmployeesPage />
      ) : activePage === 'planner' ? (
        <DaysOffPlannerPage />
      ) : activePage === 'schedule' ? (
        <SchedulePage />
      ) : activePage === 'reports' ? (
        <ReportsPage />
      ) : activePage === 'history' ? (
        <HistoryPage />
      ) : activePage === 'legal-tips' ? (
        <LegalTipsPage />
      ) : activePage === 'settings' ? (
        <SettingsPage />
      ) : activePage === 'admin-users' ? (
        <UsersAdminPage />
      ) : activePage === 'admin-departments' ? (
        <DepartmentsAdminPage />
      ) : null}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
