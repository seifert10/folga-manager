import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import FolgaModal from '../components/calendar/FolgaModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { api } from '../services/api';
import { Employee, DayOff } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Users,
  Sun,
  Trash2,
  Edit2,
  Clock,
} from 'lucide-react';

type ViewMode = 'mes' | 'semana' | 'dia';

export const SchedulePage: React.FC = () => {
  const { isViewer } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('mes');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('todos');

  // Modais de folga
  const [folgaModalOpen, setFolgaModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);
  const [selectedDateStr, setSelectedDateStr] = useState<string | undefined>(undefined);

  // Exclusão de folga
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDayOffId, setSelectedDayOffId] = useState<number | null>(null);

  const toast = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const monthPrefix = `${year}-${month}`;

      const [empsRes, daysOffRes] = await Promise.all([
        api.getEmployees(),
        api.getDaysOff({ month: monthPrefix }),
      ]);

      setEmployees(empsRes);
      setDaysOff(daysOffRes);
    } catch (err: any) {
      toast.error('Erro ao carregar escala', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentDate, toast]);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('folga-updated', handleUpdate);
    return () => window.removeEventListener('folga-updated', handleUpdate);
  }, [loadData]);

  // Navegação no calendário
  const handlePrev = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (viewMode === 'mes') next.setMonth(next.getMonth() - 1);
      else if (viewMode === 'semana') next.setDate(next.getDate() - 7);
      else next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (viewMode === 'mes') next.setMonth(next.getMonth() + 1);
      else if (viewMode === 'semana') next.setDate(next.getDate() + 7);
      else next.setDate(next.getDate() + 1);
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDeleteDayOff = async () => {
    if (!selectedDayOffId) return;
    try {
      await api.deleteDayOff(selectedDayOffId);
      toast.success('Folga excluída com sucesso');
      setDeleteModalOpen(false);
      setSelectedDayOffId(null);
      loadData();
      window.dispatchEvent(new CustomEvent('folga-updated'));
    } catch (err: any) {
      toast.error('Erro ao excluir folga', err.message);
    }
  };

  // Departamentos disponíveis
  const departments = ['todos', ...Array.from(new Set(employees.map(e => e.department)))];

  // Helper para visualização Mensal
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = dom, 1 = seg...
    const adjustedFirstDay = (firstDayIndex + 6) % 7; // Seg = 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().split('T')[0];
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Dias do mês anterior
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const dayNum = totalDaysPrevMonth - i;
      const prevMonth = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      const dStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({ dateStr: dStr, dayNum, isCurrentMonth: false, isToday: dStr === todayStr });
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateStr: dStr, dayNum: i, isCurrentMonth: true, isToday: dStr === todayStr });
    }

    // Dias do mês seguinte para completar matriz de 35 ou 42
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = month === 11 ? 1 : month + 2;
      const nextYear = month === 11 ? year + 1 : year;
      const dStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateStr: dStr, dayNum: i, isCurrentMonth: false, isToday: dStr === todayStr });
    }

    return (
      <div className="grid grid-cols-7 gap-px bg-black/[0.06] dark:bg-white/[0.08] rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08]">
        {/* Cabeçalho dias da semana */}
        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
          <div
            key={day}
            className="bg-zinc-50 dark:bg-zinc-850 p-2 text-center text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}

        {/* Células de dias */}
        {days.map(d => {
          const dayOffsInDay = daysOff.filter(
            off => off.date === d.dateStr && (selectedDept === 'todos' || off.department === selectedDept)
          );

          return (
            <div
              key={d.dateStr}
              onClick={() => {
                if (isViewer) return;
                setSelectedDateStr(d.dateStr);
                setSelectedEmployeeId(undefined);
                setFolgaModalOpen(true);
              }}
              className={`min-h-[100px] p-2 bg-white dark:bg-zinc-800 flex flex-col justify-between ${
                isViewer ? 'cursor-default' : 'cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-700/50'
              } transition-colors ${
                !d.isCurrentMonth ? 'opacity-40 bg-zinc-50/50 dark:bg-zinc-850/50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                    d.isToday
                      ? 'bg-mac-blue text-white shadow-xs'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {d.dayNum}
                </span>

                {dayOffsInDay.length > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                    {dayOffsInDay.length} {dayOffsInDay.length === 1 ? 'folga' : 'folgas'}
                  </span>
                )}
              </div>

              {/* Lista compacta de colaboradores de folga */}
              <div className="mt-1 space-y-1 overflow-y-auto max-h-16">
                {dayOffsInDay.map(off => (
                  <div
                    key={off.id}
                    onClick={e => {
                      if (isViewer) return;
                      e.stopPropagation();
                      setSelectedDayOffId(off.id);
                      setDeleteModalOpen(true);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center justify-between group shadow-2xs ${
                      off.type === 'ferias'
                        ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-200'
                        : off.type === 'afastamento'
                        ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-200'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                    }`}
                  >
                    <span className="truncate">{off.employee_name}</span>
                    {!isViewer && (
                      <Trash2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-red-500 shrink-0 ml-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper para visualização Diária
  const renderDayView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOffsToday = daysOff.filter(off => off.date === dateStr);
    const offEmployeeIds = new Set(dayOffsToday.map(d => d.employee_id));

    const workingEmployees = employees.filter(
      e => e.status === 'ativo' && !offEmployeeIds.has(e.id) && (selectedDept === 'todos' || e.department === selectedDept)
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colaboradores de Folga Hoje */}
        <Card className="p-5 shadow-mac border-emerald-200 dark:border-emerald-900/40">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Colaboradores de Folga ({dayOffsToday.length})
              </h3>
            </div>
            {!isViewer && (
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  setSelectedDateStr(dateStr);
                  setFolgaModalOpen(true);
                }}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Adicionar Folga
              </Button>
            )}
          </div>

          <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
            {dayOffsToday.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-8">
                Nenhum colaborador de folga registrado para este dia.
              </p>
            ) : (
              dayOffsToday.map(off => (
                <div
                  key={off.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={off.employee_name || 'Funcionário'} size="sm" />
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {off.employee_name}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {off.position} • {off.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={off.type === 'ferias' ? 'ferias' : off.type === 'afastamento' ? 'afastamento' : 'dsr'} size="sm">
                      {off.type === 'dsr' ? 'DSR Semanal' : off.type}
                    </Badge>
                    {!isViewer && (
                      <button
                        onClick={() => {
                          setSelectedDayOffId(off.id);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Colaboradores em Trabalho Hoje */}
        <Card className="p-5 shadow-mac">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Colaboradores em Atividade ({workingEmployees.length})
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
            {workingEmployees.map(emp => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06]"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={emp.name} size="sm" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {emp.name}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {emp.position} • {emp.department} • Escala {emp.work_schedule_type}
                    </p>
                  </div>
                </div>

                {!isViewer && (
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => {
                      setSelectedEmployeeId(emp.id);
                      setSelectedDateStr(dateStr);
                      setFolgaModalOpen(true);
                    }}
                    icon={<CalendarIcon className="w-3.5 h-3.5" />}
                  >
                    Marcar Folga
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const formattedMonthYear = currentDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header da Escala */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Escala & Calendário
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Gerencie folgas, descansos semanais remunerados e turnos da equipe
          </p>
        </div>

        {!isViewer && (
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setSelectedEmployeeId(undefined);
              setSelectedDateStr(new Date().toISOString().split('T')[0]);
              setFolgaModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Nova Folga
          </Button>
        )}
      </div>

      {/* Controles de Navegação e Filtros */}
      <Card className="p-4 shadow-mac">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Navegação de Mês/Dia */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              Hoje
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 capitalize ml-2">
              {formattedMonthYear}
            </span>
          </div>

          {/* Modo de Visualização e Filtro por Setor */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'todos' ? 'Todos os Setores' : dept}
                </option>
              ))}
            </select>

            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
              <button
                onClick={() => setViewMode('mes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'mes'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setViewMode('dia')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'dia'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Dia
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Visualização Ativa */}
      {viewMode === 'mes' ? renderMonthView() : renderDayView()}

      {/* Modal para agendar nova folga */}
      <FolgaModal
        isOpen={folgaModalOpen}
        onClose={() => setFolgaModalOpen(false)}
        initialEmployeeId={selectedEmployeeId}
        initialDate={selectedDateStr}
        onSuccess={() => {
          loadData();
          window.dispatchEvent(new CustomEvent('folga-updated'));
        }}
      />

      {/* Diálogo de confirmação para exclusão de folga */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteDayOff}
        title="Excluir Folga Registrada"
        message="Tem certeza que deseja excluir esta folga? A escala será atualizada e o evento registrado na auditoria."
        confirmLabel="Excluir Folga"
        isDestructive
      />
    </div>
  );
};

export default SchedulePage;
