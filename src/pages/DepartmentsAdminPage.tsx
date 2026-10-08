import React, { useState, useEffect } from 'react';
import { Department } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Building2, Plus, Edit2, AlertTriangle, Users } from 'lucide-react';

export const DepartmentsAdminPage: React.FC = () => {
  const toast = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [isActive, setIsActive] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (err: any) {
      toast.error('Erro ao carregar setores', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setDeptName('');
    setIsActive(1);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (d: Department) => {
    setEditingDept(d);
    setDeptName(d.name);
    setIsActive(d.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (dept: Department) => {
    const nextStatus = dept.active ? 0 : 1;
    try {
      await api.updateDepartment(dept.id, { active: nextStatus });
      toast.success('Status atualizado', `Setor "${dept.name}" ${nextStatus ? 'ativado' : 'desativado'} com sucesso!`);
      loadDepartments();
    } catch (err: any) {
      toast.error('Erro ao alterar status do setor', err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!deptName.trim()) {
      setFormError('O nome do setor é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDept) {
        await api.updateDepartment(editingDept.id, {
          name: deptName.trim(),
          active: isActive,
        });
        toast.success('Sucesso', 'Setor atualizado com sucesso!');
      } else {
        await api.createDepartment({
          name: deptName.trim(),
          active: isActive,
        });
        toast.success('Sucesso', 'Novo setor cadastrado com sucesso!');
      }
      setIsModalOpen(false);
      loadDepartments();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao salvar setor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-zinc-900/70 mac-blur p-5 sm:p-6 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-mac-blue flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Administração de Setores & Departamentos
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Cadastre os setores operacionais. Setores com histórico são preservados com desativação lógica.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          icon={<Plus className="w-4 h-4" />}
        >
          Novo Setor
        </Button>
      </div>

      {/* Lista de Setores */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-mac overflow-hidden">
        <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Todos os Setores Cadastrados
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
              {departments.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.08] text-zinc-400 font-semibold uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-850/50">
                <th className="py-3 px-6">Nome do Setor</th>
                <th className="py-3 px-6">Funcionários Vinculados</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-400">
                    Carregando setores...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-400">
                    Nenhum setor cadastrado no momento.
                  </td>
                </tr>
              ) : (
                departments.map(d => (
                  <tr key={d.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-zinc-400" />
                      <span>{d.name}</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        {d.employee_count !== undefined ? d.employee_count : 0} colaboradores
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      {d.active ? (
                        <Badge variant="definida">Ativo</Badge>
                      ) : (
                        <Badge variant="pendente">Inativo</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(d)}
                          icon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant={d.active ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => handleToggleStatus(d)}
                        >
                          {d.active ? 'Desativar' : 'Reativar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição de Setor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? `Editar Setor — ${editingDept.name}` : 'Cadastrar Novo Setor'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nome do Setor *
            </label>
            <input
              type="text"
              required
              value={deptName}
              onChange={e => setDeptName(e.target.value)}
              placeholder="ex: Cozinha, Salão, Bar, Caixa..."
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-mac-blue text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Status Operacional
            </label>
            <select
              value={isActive}
              onChange={e => setIsActive(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-mac-blue text-zinc-900 dark:text-zinc-100"
            >
              <option value={1}>Ativo (disponível para escalas e novos colaboradores)</option>
              <option value={0}>Inativo (desativado logicamente preservando histórico)</option>
            </select>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              Setores nunca são removidos fisicamente do banco para garantir a integridade da auditoria e das escalas passadas.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : editingDept ? 'Salvar Alterações' : 'Criar Setor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentsAdminPage;
