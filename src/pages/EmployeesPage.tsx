import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import EmployeeModal from '../components/employees/EmployeeModal';
import EmployeeDetailDrawer from '../components/employees/EmployeeDetailDrawer';
import FolgaModal from '../components/calendar/FolgaModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { api } from '../services/api';
import { Employee } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  Search,
  Users,
  Briefcase,
  Building,
  CalendarCheck,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';

interface EmployeesPageProps {
  initialSelectedId?: number;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ initialSelectedId }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [departmentFilter, setDepartmentFilter] = useState<string>('todos');

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [detailEmployeeId, setDetailEmployeeId] = useState<number | null>(initialSelectedId || null);

  // Agendamento rápido de folga a partir do perfil
  const [folgaModalOpen, setFolgaModalOpen] = useState(false);
  const [folgaEmpId, setFolgaEmpId] = useState<number | undefined>(undefined);

  // Exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const toast = useToast();

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err: any) {
      toast.error('Erro ao listar funcionários', err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadEmployees();
    const handleUpdate = () => loadEmployees();
    window.addEventListener('employee-updated', handleUpdate);
    window.addEventListener('folga-updated', handleUpdate);
    return () => {
      window.removeEventListener('employee-updated', handleUpdate);
      window.removeEventListener('folga-updated', handleUpdate);
    };
  }, [loadEmployees]);

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await api.deleteEmployee(employeeToDelete.id);
      toast.success(`Funcionário ${employeeToDelete.name} excluído.`);
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
      if (detailEmployeeId === employeeToDelete.id) {
        setDetailEmployeeId(null);
      }
      loadEmployees();
      window.dispatchEvent(new CustomEvent('employee-updated'));
    } catch (err: any) {
      toast.error('Erro ao excluir funcionário', err.message);
    }
  };

  const { isViewer, isAdmin, departments: userDepartments } = useAuth();

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase()) ||
      emp.cpf.includes(search.replace(/\D/g, ''));

    const matchesStatus = statusFilter === 'todos' || emp.status === statusFilter;
    const matchesDept = departmentFilter === 'todos' || emp.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const departmentList = isAdmin
    ? ['todos', ...Array.from(new Set(employees.map(e => e.department)))]
    : ['todos', ...userDepartments.map((d: any) => d.name)];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Gestão da Equipe
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Cadastro completo de colaboradores, escalas contratuais e acompanhamento de DSR
          </p>
        </div>

        {!isViewer && (
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEmployeeToEdit(null);
              setIsCreateModalOpen(true);
            }}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Novo Funcionário
          </Button>
        )}
      </div>

      {/* Barra de Busca e Filtros */}
      <Card className="p-4 shadow-mac">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-full md:w-auto">
            {['todos', 'ativo', 'ferias', 'afastado', 'inativo'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Campo de Busca & Setor */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nome, cargo ou CPF..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-mac-blue/30"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              {departmentList.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'todos' ? 'Todos os Setores' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Grid de Funcionários */}
      {filteredEmployees.length === 0 ? (
        <Card className="p-12 text-center shadow-mac">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Nenhum funcionário encontrado
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Tente alterar os termos da busca ou cadastre um novo colaborador na equipe.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Adicionar Funcionário
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEmployees.map(emp => {
            const isPending = emp.smartStatus === 'pendente';

            return (
              <Card
                key={emp.id}
                hoverEffect
                className={`p-5 flex flex-col justify-between shadow-mac transition-all ${
                  isPending ? 'border-red-200/80 dark:border-red-900/40 bg-red-50/10 dark:bg-red-950/5' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={emp.name} size="md" />
                      <div className="truncate">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {emp.name}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {emp.position}
                        </p>
                      </div>
                    </div>

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
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Setor</span>
                      <p className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                        {emp.department}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Jornada</span>
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">
                        {emp.work_schedule_type} • {emp.weekly_hours}h
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Última Folga</span>
                      <p className="font-medium text-zinc-600 dark:text-zinc-400">
                        {emp.lastDayOff || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Próx. Folga</span>
                      <p className={`font-semibold ${emp.nextDayOff ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {emp.nextDayOff || 'Pendente'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas do Card */}
                <div className="mt-5 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                  <button
                    onClick={() => setDetailEmployeeId(emp.id)}
                    className="text-xs font-semibold text-mac-blue hover:text-mac-blue-hover flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver Perfil
                  </button>

                  {!isViewer && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEmployeeToEdit(emp);
                          setIsCreateModalOpen(true);
                        }}
                        title="Editar cadastro"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEmployeeToDelete(emp);
                          setDeleteConfirmOpen(true);
                        }}
                        title="Excluir colaborador"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Drawer com Perfil Completo do Funcionário */}
      <EmployeeDetailDrawer
        employeeId={detailEmployeeId}
        onClose={() => setDetailEmployeeId(null)}
        onEdit={(emp) => {
          setEmployeeToEdit(emp);
          setIsCreateModalOpen(true);
        }}
        onDelete={(emp) => {
          setEmployeeToDelete(emp);
          setDeleteConfirmOpen(true);
        }}
        onAddDayOff={(empId) => {
          setFolgaEmpId(empId);
          setFolgaModalOpen(true);
        }}
      />

      {/* Modal de Cadastro / Edição */}
      <EmployeeModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEmployeeToEdit(null);
        }}
        employeeToEdit={employeeToEdit}
        onSuccess={() => {
          loadEmployees();
          window.dispatchEvent(new CustomEvent('employee-updated'));
        }}
      />

      {/* Modal de Agendamento Rápido de Folga */}
      <FolgaModal
        isOpen={folgaModalOpen}
        onClose={() => setFolgaModalOpen(false)}
        initialEmployeeId={folgaEmpId}
        onSuccess={() => {
          loadEmployees();
          window.dispatchEvent(new CustomEvent('folga-updated'));
        }}
      />

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Colaborador"
        message={`Tem certeza que deseja excluir ${employeeToDelete?.name}? Todas as folgas e escalas associadas a este funcionário serão removidas.`}
        confirmLabel="Excluir Funcionário"
        isDestructive
      />
    </div>
  );
};

export default EmployeesPage;
