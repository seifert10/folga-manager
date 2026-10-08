import React, { useState, useEffect, useCallback } from 'react';
import AttentionCard from '../components/dashboard/AttentionCard';
import StatCards from '../components/dashboard/StatCards';
import WeekCalendarCard from '../components/dashboard/WeekCalendarCard';
import UpcomingDaysOffCard from '../components/dashboard/UpcomingDaysOffCard';
import FolgaModal from '../components/calendar/FolgaModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { api } from '../services/api';
import { DashboardData, DayOff } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { PageId } from '../components/layout/Sidebar';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: PageId, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, isViewer } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal de folga rápida ao clicar em um dia da semana
  const [folgaModalOpen, setFolgaModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<number | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  // Confirmação para exclusão de folga se clicar em uma existente
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dayOffToDelete, setDayOffToDelete] = useState<number | null>(null);

  const toast = useToast();

  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao carregar dados do dashboard', err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboard();
    const handleUpdate = () => loadDashboard();
    window.addEventListener('folga-updated', handleUpdate);
    window.addEventListener('employee-updated', handleUpdate);
    return () => {
      window.removeEventListener('folga-updated', handleUpdate);
      window.removeEventListener('employee-updated', handleUpdate);
    };
  }, [loadDashboard]);

  // Saudação personalizada
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getFormattedCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleSelectEmployeeDay = (employeeId: number, dateStr: string, currentDayOffId: number | null) => {
    if (isViewer) return;
    if (currentDayOffId) {
      // Já tem folga: abre opção para gerenciar ou excluir
      setDayOffToDelete(currentDayOffId);
      setDeleteConfirmOpen(true);
    } else {
      // Não tem folga: abre modal para agendar
      setSelectedEmpId(employeeId);
      setSelectedDate(dateStr);
      setFolgaModalOpen(true);
    }
  };

  const handleDeleteDayOff = async () => {
    if (!dayOffToDelete) return;
    try {
      await api.deleteDayOff(dayOffToDelete);
      toast.success('Folga removida com sucesso');
      setDeleteConfirmOpen(false);
      setDayOffToDelete(null);
      loadDashboard();
      window.dispatchEvent(new CustomEvent('folga-updated'));
    } catch (err: any) {
      toast.error('Erro ao remover folga', err.message);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-mac-blue border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-400">Carregando painel de controle...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner de Boas-vindas do Gestor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <span>{getGreeting()}, {user?.name || 'Gestor'}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize mt-0.5">
            {getFormattedCurrentDate()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('legal-tips')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100/70 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Dicas CLT & DSR
          </button>
        </div>
      </div>

      {/* CARD PRIORITÁRIO NÚMERO 1: Atenção do Gestor */}
      <AttentionCard
        data={data.attentionCard}
        onResolvePending={() => onNavigate('planner')}
        onScheduleDayOff={(empId) => {
          if (isViewer) return;
          setSelectedEmpId(empId);
          setSelectedDate(undefined);
          setFolgaModalOpen(true);
        }}
      />

      {/* 4 Cards de Estatísticas Rápidas */}
      <StatCards
        stats={data.stats}
        onNavigateToPlanner={() => onNavigate('planner')}
        onNavigateToEmployees={() => onNavigate('employees')}
      />

      {/* Seção Principal: Calendário Semanal + Próximas Folgas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeekCalendarCard
            weekDays={data.weekDays}
            weekGrid={data.weekGrid}
            onSelectEmployeeDay={handleSelectEmployeeDay}
            onNavigateToSchedule={() => onNavigate('schedule')}
          />
        </div>

        <div className="lg:col-span-1">
          <UpcomingDaysOffCard
            upcomingDaysOff={data.upcomingDaysOff}
            onNavigateToSchedule={() => onNavigate('schedule')}
            onEditDayOff={(dayOff) => {
              if (isViewer) return;
              setDayOffToDelete(dayOff.id);
              setDeleteConfirmOpen(true);
            }}
          />
        </div>
      </div>

      {/* Modal para agendar folga em data específica */}
      <FolgaModal
        isOpen={folgaModalOpen}
        onClose={() => setFolgaModalOpen(false)}
        initialEmployeeId={selectedEmpId}
        initialDate={selectedDate}
        onSuccess={() => {
          loadDashboard();
          window.dispatchEvent(new CustomEvent('folga-updated'));
        }}
      />

      {/* Diálogo de confirmação para exclusão de folga */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteDayOff}
        title="Remover Folga Registrada"
        message="Deseja realmente remover esta folga? O colaborador retornará para a escala normal de trabalho e a alteração será registrada na auditoria."
        confirmLabel="Remover Folga"
        isDestructive
      />
    </div>
  );
};

export default DashboardPage;
