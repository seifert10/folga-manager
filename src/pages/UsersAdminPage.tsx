import React, { useState, useEffect } from 'react';
import { User, Department, UserRole } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Users, Plus, Edit2, ShieldAlert, CheckCircle2, XCircle, Shield, Briefcase, Eye } from 'lucide-react';

export const UsersAdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MANAGER' as UserRole,
    departmentIds: [] as number[],
    active: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, deptsData] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
    } catch (err: any) {
      toast.error('Erro ao carregar dados de usuários', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'MANAGER',
      departmentIds: departments.length > 0 ? [departments[0].id] : [],
      active: 1,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '', // Em branco para não alterar
      role: u.role,
      departmentIds: u.departmentIds || [],
      active: u.active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      toast.warning('Ação não permitida', 'Você não pode desativar sua própria conta de administrador.');
      return;
    }

    const nextStatus = targetUser.active ? false : true;
    try {
      await api.toggleUserStatus(targetUser.id, nextStatus);
      toast.success('Status atualizado', `Usuário ${targetUser.name} ${nextStatus ? 'ativado' : 'desativado'} com sucesso!`);
      loadData();
    } catch (err: any) {
      toast.error('Erro ao alterar status', err.message);
    }
  };

  const handleDepartmentToggle = (deptId: number) => {
    setFormData(prev => {
      const exists = prev.departmentIds.includes(deptId);
      if (exists) {
        return { ...prev, departmentIds: prev.departmentIds.filter(id => id !== deptId) };
      } else {
        return { ...prev, departmentIds: [...prev.departmentIds, deptId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Nome e E-mail são obrigatórios.');
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      setFormError('Para novos usuários, a senha é obrigatória e deve ter pelo menos 6 caracteres.');
      return;
    }

    if (formData.role !== 'ADMIN' && formData.departmentIds.length === 0) {
      setFormError('Selecione pelo menos um setor autorizado para o gestor ou visualizador.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          departmentIds: formData.role === 'ADMIN' ? [] : formData.departmentIds,
          active: formData.active,
          ...(formData.password ? { password: formData.password } : {}),
        });
        toast.success('Sucesso', 'Usuário atualizado com sucesso!');
      } else {
        await api.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          departmentIds: formData.role === 'ADMIN' ? [] : formData.departmentIds,
          active: formData.active,
        });
        toast.success('Sucesso', 'Novo usuário cadastrado com sucesso!');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao salvar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Shield className="w-3 h-3" />
            Administrador
          </span>
        );
      case 'MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Briefcase className="w-3 h-3" />
            Gestor
          </span>
        );
      case 'VIEWER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <Eye className="w-3 h-3" />
            Visualizador
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-zinc-900/70 mac-blur p-5 sm:p-6 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Administração de Usuários
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Controle central de acesso. Gerencie perfis, permissões e setores autorizados para cada gestor.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          icon={<Plus className="w-4 h-4" />}
          className="shadow-sm shadow-blue-500/20"
        >
          Novo Usuário
        </Button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white/80 dark:bg-zinc-900/80 mac-blur rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-zinc-50/50 dark:bg-zinc-800/30 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <th className="py-3.5 px-6">Nome / Identificação</th>
                <th className="py-3.5 px-6">E-mail</th>
                <th className="py-3.5 px-6">Perfil</th>
                <th className="py-3.5 px-6">Setores Autorizados</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <div className="w-6 h-6 border-2 border-mac-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Carregando usuários...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    Nenhum usuário cadastrado além do administrador principal.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-zinc-900 dark:text-zinc-100">
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-[10px] text-zinc-400 font-normal">(Você)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-zinc-600 dark:text-zinc-300 font-mono text-xs">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-6">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-3.5 px-6">
                      {u.role === 'ADMIN' ? (
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Acesso global
                        </span>
                      ) : u.departments && u.departments.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {u.departments.map(d => (
                            <span
                              key={d.id}
                              className="px-2 py-0.5 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-medium"
                            >
                              {d.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Nenhum setor atribuído
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      {u.active ? (
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
                          onClick={() => handleOpenEditModal(u)}
                          icon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant={u.active ? 'danger' : 'secondary'}
                          size="sm"
                          disabled={u.id === currentUser?.id}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.active ? 'Desativar' : 'Ativar'}
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

      {/* Modal de Criação / Edição de Usuário */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Editar Usuário — ${editingUser.name}` : 'Cadastrar Novo Usuário'}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="ex: Carlos Silva"
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-mac-blue text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              E-mail de Acesso *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="ex: carlos@empresa.com.br"
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-mac-blue text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              {editingUser ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha de Acesso *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? '••••••••••••' : 'Mínimo de 6 caracteres'}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-mac-blue text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Perfil de Acesso *
              </label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-mac-blue text-zinc-900 dark:text-zinc-100"
              >
                <option value="MANAGER">Gestor Operacional (MANAGER)</option>
                <option value="ADMIN">Administrador Geral (ADMIN)</option>
                <option value="VIEWER">Apenas Leitura (VIEWER)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Status da Conta
              </label>
              <select
                value={formData.active}
                onChange={e => setFormData({ ...formData, active: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-mac-blue text-zinc-900 dark:text-zinc-100"
              >
                <option value={1}>Ativo</option>
                <option value={0}>Inativo</option>
              </select>
            </div>
          </div>

          {/* Seleção de Setores Autorizados */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Setores Autorizados (Escopo de Acesso)
            </label>

            {formData.role === 'ADMIN' ? (
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>
                  <strong>Acesso Global:</strong> Usuários com perfil Administrador possuem autorização irrestrita sobre todos os setores e funcionários.
                </span>
              </div>
            ) : (
              <div className="space-y-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 max-h-48 overflow-y-auto">
                {departments.map(dept => {
                  const isChecked = formData.departmentIds.includes(dept.id);
                  return (
                    <label
                      key={dept.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors text-xs text-zinc-800 dark:text-zinc-200"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleDepartmentToggle(dept.id)}
                        className="w-4 h-4 rounded text-mac-blue focus:ring-mac-blue"
                      />
                      <span className="font-semibold">{dept.name}</span>
                      {!dept.active && (
                        <span className="text-[10px] text-amber-500">(Inativo)</span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
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
              {isSubmitting ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersAdminPage;
