import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import FolgaModal from '../components/calendar/FolgaModal';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { api } from '../services/api';
import { Employee } from '../types';
import { useToast } from '../context/ToastContext';
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  CalendarPlus,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export const DaysOffPlannerPage: React.FC = () => {
  const { isViewer, isAdmin, departments: userDepartments } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'pendentes' | 'definidos' | 'alerta'>('pendentes');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('todos');

  // Modal individual
  const [folgaModalOpen, setFolgaModalOpen] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState<number | undefined>(undefined);

  // Assistente em Lote ("Definir todas as pendências")
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchAssignments, setBatchAssignments] = useState<Record<number, string>>({});
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const toast = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err: any) {
      toast.error('Erro ao carregar colaboradores', err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('folga-updated', handleUpdate);
    window.addEventListener('employee-updated', handleUpdate);
    return () => {
      window.removeEventListener('folga-updated', handleUpdate);
      window.removeEventListener('employee-updated', handleUpdate);
    };
  }, [loadData]);

  // Filtra lista de colaboradores
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase());

    const matchesDept = selectedDept === 'todos' || emp.department === selectedDept;

    let matchesFilter = true;
    if (filter === 'pendentes') {
      matchesFilter = emp.smartStatus === 'pendente';
    } else if (filter === 'definidos') {
      matchesFilter = emp.smartStatus === 'definida';
    } else if (filter === 'alerta') {
      matchesFilter = emp.smartStatus === 'pendente' || emp.smartStatus === 'proxima';
    }

    return matchesSearch && matchesDept && matchesFilter;
  });

  const pendingList = employees.filter(e => e.smartStatus === 'pendente');

  // Abre assistente em lote com sugestão de datas para os próximos dias
  const handleOpenBatchAssistant = () => {
    const initialDates: Record<number, string> = {};
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    pendingList.forEach((emp, index) => {
      // Distribui as folgas sugeridas ao longo dos próximos dias para evitar concentrar tudo no mesmo dia
      const suggestedDate = new Date(tomorrow);
      suggestedDate.setDate(suggestedDate.getDate() + (index % 4));
      initialDates[emp.id] = suggestedDate.toISOString().split('T')[0];
    });

    setBatchAssignments(initialDates);
    setBatchModalOpen(true);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchSubmitting(true);
    try {
      const items = Object.entries(batchAssignments).map(([empId, date]) => ({
        employee_id: Number(empId),
        date,
        type: 'dsr',
        notes: 'Definido via Assistente Rápido de Pendências',
      }));

      const res = await api.batchCreateDaysOff(items);
      toast.success(`${res.insertedCount} folgas agendadas com sucesso!`);
      if (res.errors && res.errors.length > 0) {
        toast.warning('Algumas folgas geraram observações', res.errors.join('; '));
      }
      setBatchModalOpen(false);
      loadData();
      window.dispatchEvent(new CustomEvent('folga-updated'));
    } catch (err: any) {
      toast.error('Erro ao processar folgas em lote', err.message);
    } finally {
      setBatchSubmitting(false);
    }
  };

  const departments = isAdmin
    ? ['todos', ...Array.from(new Set(employees.map(e => e.department)))]
    : ['todos', ...userDepartments.map(d => d.name)];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Topo com Callout de Pendências e Botão de Ação Rápida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Modo Planejar Folgas
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Identificação proativa de colaboradores sem descanso semanal planejado
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingList.length > 0 && !isViewer && (
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenBatchAssistant}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Definir todas as pendências ({pendingList.length})
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={loadData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Banner de Status de Inteligência */}
      <Card
        className={`p-4 ${
          pendingList.length > 0
            ? 'border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/15'
            : 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/15'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pendingList.length > 0 ? (
              <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {pendingList.length > 0
                  ? `${pendingList.length} ${
                      pendingList.length === 1 ? 'colaborador precisa' : 'colaboradores precisam'
                    } de atenção imediata`
                  : 'Excelente! Todos os funcionários ativos possuem folga planejada.'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {pendingList.length > 0
                  ? 'A CLT orienta que a folga ocorra após no máximo 6 dias de trabalho contínuo.'
                  : 'Nenhum atraso ou esquecimento identificado no ciclo semanal.'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Barra de Filtros e Busca */}
      <Card className="p-4 shadow-mac">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Tabs de Filtro */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setFilter('pendentes')}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'pendentes'
                  ? 'bg-white dark:bg-zinc-700 text-red-600 dark:text-red-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Pendentes ({pendingList.length})
            </button>
            <button
              onClick={() => setFilter('alerta')}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'alerta'
                  ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Em Alerta
            </button>
            <button
              onClick={() => setFilter('definidos')}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'definidos'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Definidos
            </button>
            <button
              onClick={() => setFilter('todos')}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'todos'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Todos ({employees.length})
            </button>
          </div>

          {/* Busca e Setor */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar colaborador..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-mac-blue/30"
              />
            </div>

            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'todos' ? 'Todos os Setores' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Tabela de Planejamento */}
      <Card className="overflow-hidden shadow-mac">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-zinc-50/50 dark:bg-zinc-800/40 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-4">Funcionário</th>
                <th className="py-3 px-3">Cargo & Setor</th>
                <th className="py-3 px-3">Última Folga</th>
                <th className="py-3 px-3">Próxima Folga</th>
                <th className="py-3 px-3">Dias s/ Folga</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-zinc-400">
                    Nenhum colaborador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const isPending = emp.smartStatus === 'pendente';
                  const isSoon = emp.smartStatus === 'proxima';

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors ${
                        isPending ? 'bg-red-50/15 dark:bg-red-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.name} size="sm" />
                          <div>
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {emp.name}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              Escala {emp.work_schedule_type} • {emp.work_regime}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <p className="text-xs text-zinc-800 dark:text-zinc-200">
                          {emp.position}
                        </p>
                        <p className="text-[10px] text-zinc-400">{emp.department}</p>
                      </td>

                      <td className="py-3.5 px-3 text-xs text-zinc-600 dark:text-zinc-300">
                        {emp.lastDayOff || '—'}
                      </td>

                      <td className="py-3.5 px-3 text-xs">
                        {emp.nextDayOff ? (
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {emp.nextDayOff}
                          </span>
                        ) : (
                          <span className="font-semibold text-red-500 dark:text-red-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Não definida
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {emp.daysSinceLastDayOff !== null && emp.daysSinceLastDayOff !== undefined ? (
                          <span className={emp.daysSinceLastDayOff >= 6 ? 'text-red-600 font-bold' : ''}>
                            {emp.daysSinceLastDayOff} dias
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <Badge
                          variant={
                            emp.smartStatus === 'pendente'
                              ? 'pendente'
                              : emp.smartStatus === 'proxima'
                              ? 'proxima'
                              : emp.smartStatus === 'definida'
                              ? 'definida'
                              : 'sem_escala'
                          }
                          size="sm"
                        >
                          {emp.statusLabel || emp.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isViewer && (
                          <Button
                            variant={isPending ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => {
                              setTargetEmployeeId(emp.id);
                              setFolgaModalOpen(true);
                            }}
                            icon={<CalendarPlus className="w-3.5 h-3.5" />}
                          >
                            {isPending ? 'Definir' : 'Editar'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Individual */}
      <FolgaModal
        isOpen={folgaModalOpen}
        onClose={() => setFolgaModalOpen(false)}
        initialEmployeeId={targetEmployeeId}
        onSuccess={() => {
          loadData();
          window.dispatchEvent(new CustomEvent('folga-updated'));
        }}
      />

      {/* Modal do Assistente em Lote */}
      <Modal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        title="Assistente de Resolução em Lote"
        subtitle={`Defina as datas de folga para os ${pendingList.length} colaboradores pendentes de uma só vez.`}
        maxWidth="xl"
      >
        <form onSubmit={handleBatchSubmit} className="space-y-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            O sistema distribuiu sugestões automáticas ao longo dos próximos dias para preservar a capacidade operacional. Você pode ajustar cada data antes de confirmar.
          </p>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {pendingList.map(emp => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {emp.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {emp.position} ({emp.department}) • Última: {emp.lastDayOff || 'Sem registro'}
                  </p>
                </div>

                <div className="w-44 shrink-0">
                  <input
                    type="date"
                    required
                    value={batchAssignments[emp.id] || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setBatchAssignments(prev => ({ ...prev, [emp.id]: val }));
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setBatchModalOpen(false)}
              disabled={batchSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={batchSubmitting}>
              Salvar Todas as Folgas
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DaysOffPlannerPage;
