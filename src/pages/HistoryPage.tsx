import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { api } from '../services/api';
import { AuditLog, Employee } from '../types';
import { useToast } from '../context/ToastContext';
import {
  History as HistoryIcon,
  Download,
  Filter,
  Calendar,
  Clock,
  User,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('todos');
  const [selectedAction, setSelectedAction] = useState<string>('todas');

  const toast = useToast();

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedEmployeeId !== 'todos') params.employeeId = Number(selectedEmployeeId);
      if (selectedAction !== 'todas') params.action = selectedAction;

      const [logsData, empsData] = await Promise.all([
        api.getAuditLogs(params),
        api.getEmployees(),
      ]);

      setLogs(logsData);
      setEmployees(empsData);
    } catch (err: any) {
      toast.error('Erro ao carregar histórico de auditoria', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployeeId, selectedAction, toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleExportCsv = async () => {
    try {
      toast.info('Exportando auditoria...', 'Gerando arquivo CSV');
      await api.downloadCsv('auditoria');
      toast.success('Download concluído', 'Histórico de auditoria exportado com sucesso');
    } catch (err: any) {
      toast.error('Erro na exportação', err.message);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CRIOU_FOLGA':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            CRIOU FOLGA
          </span>
        );
      case 'ALTEROU_FOLGA':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            ALTEROU FOLGA
          </span>
        );
      case 'EXCLUIU_FOLGA':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
            EXCLUIU FOLGA
          </span>
        );
      case 'CRIOU_FUNCIONARIO':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            NOVO COLABORADOR
          </span>
        );
      case 'ATUALIZOU_FUNCIONARIO':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            EDITOU COLABORADOR
          </span>
        );
      case 'EXCLUIU_FUNCIONARIO':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            REMOVEU COLABORADOR
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Histórico de Alterações & Auditoria
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Registro imutável de todas as ações executadas pelo gestor na escala e folgas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportCsv}
            icon={<Download className="w-4 h-4" />}
          >
            Exportar Histórico (CSV)
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={loadLogs}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <Card className="p-4 shadow-mac">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <Filter className="w-4 h-4 text-zinc-400" />
            <span>Filtros de Auditoria:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="todos">Todos os Funcionários</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>

            <select
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="todas">Todas as Ações</option>
              <option value="CRIOU_FOLGA">Criação de Folga</option>
              <option value="ALTEROU_FOLGA">Alteração de Folga</option>
              <option value="EXCLUIU_FOLGA">Exclusão de Folga</option>
              <option value="CRIOU_FUNCIONARIO">Criação de Funcionário</option>
              <option value="ATUALIZOU_FUNCIONARIO">Atualização de Funcionário</option>
              <option value="EXCLUIU_FUNCIONARIO">Exclusão de Funcionário</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Linha do Tempo de Auditoria */}
      <Card className="p-6 shadow-mac">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-400">
            Nenhum registro de alteração encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="relative border-l border-zinc-200 dark:border-zinc-700/80 ml-4 space-y-6">
            {logs.map(log => (
              <div key={log.id} className="relative pl-6 group">
                {/* Marcador na linha */}
                <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-800 border-2 border-mac-blue shadow-xs" />

                <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] hover:border-black/[0.08] dark:hover:border-white/[0.12] transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      {log.employee_name && (
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {log.employee_name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{log.created_at}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-2.5 leading-relaxed">
                    {log.details}
                  </p>

                  {(log.old_value || log.new_value) && (
                    <div className="mt-2.5 pt-2 border-t border-black/[0.03] dark:border-white/[0.04] flex flex-wrap items-center gap-2 text-[11px]">
                      {log.old_value && (
                        <div className="flex items-center gap-1 text-zinc-400 line-through">
                          <span>Anterior:</span>
                          <span>{log.old_value}</span>
                        </div>
                      )}
                      {log.old_value && log.new_value && (
                        <ArrowRight className="w-3 h-3 text-zinc-400" />
                      )}
                      {log.new_value && (
                        <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <span>Novo:</span>
                          <span>{log.new_value}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default HistoryPage;
