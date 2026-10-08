import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Users,
  CalendarCheck,
  Building,
  CheckCircle2,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const toast = useToast();

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getReportsSummary();
      setSummary(data);
    } catch (err: any) {
      toast.error('Erro ao carregar resumo de relatórios', err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleDownloadCsv = async (type: 'folgas' | 'pendencias' | 'auditoria') => {
    try {
      toast.info('Gerando exportação...', 'Preparando relatório para download');
      await api.downloadCsv(type, undefined, startDate || undefined, endDate || undefined);
      toast.success('Download concluído!', `Relatório de ${type} baixado com sucesso.`);
    } catch (err: any) {
      toast.error('Erro na exportação', err.message || 'Falha ao baixar CSV');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Relatórios & Exportação
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Métricas de conformidade, cobertura de escala e exportação em formato compatível com Excel
          </p>
        </div>
      </div>

      {/* Cards de Exportação Rápida (CSV) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Exportar Folgas */}
        <Card className="p-5 flex flex-col justify-between shadow-mac hover:border-mac-blue/40 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-mac-blue flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Relatório Geral de Folgas
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Exporta todas as folgas, descansos e férias com dados completos do colaborador e justificativas.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => handleDownloadCsv('folgas')}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Baixar Folgas (CSV)
            </Button>
          </div>
        </Card>

        {/* Exportar Pendências */}
        <Card className="p-5 flex flex-col justify-between shadow-mac hover:border-red-400/40 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Pendências & Alertas DSR
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Lista dos colaboradores com risco de extrapolação dos 6 dias ou sem descanso agendado.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-red-600 hover:text-red-700 dark:text-red-400"
              onClick={() => handleDownloadCsv('pendencias')}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Baixar Pendências (CSV)
            </Button>
          </div>
        </Card>

        {/* Exportar Auditoria */}
        <Card className="p-5 flex flex-col justify-between shadow-mac hover:border-purple-400/40 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Histórico de Auditoria
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Trilha auditável de todas as criações, edições e exclusões executadas no sistema.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => handleDownloadCsv('auditoria')}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Baixar Auditoria (CSV)
            </Button>
          </div>
        </Card>
      </div>

      {/* Resumo Consolidado por Setor */}
      <Card className="p-6 shadow-mac">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Distribuição e Cobertura por Setor
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Visão de colaboradores ativos, volume de folgas e pendências registradas em cada departamento
        </p>

        {loading || !summary ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            Carregando indicadores...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-black/[0.06] dark:border-white/[0.08] text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Departamento / Setor</th>
                  <th className="py-3 px-3 text-center">Total Colaboradores</th>
                  <th className="py-3 px-3 text-center">Folgas Registradas</th>
                  <th className="py-3 px-3 text-center">Pendências de Folga</th>
                  <th className="py-3 px-3 text-right">Situação Geral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
                {Object.entries(summary.departmentSummary || {}).map(([dept, data]: any) => (
                  <tr key={dept} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 text-xs">
                    <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                      {dept}
                    </td>
                    <td className="py-3 px-3 text-center text-zinc-600 dark:text-zinc-300">
                      {data.total}
                    </td>
                    <td className="py-3 px-3 text-center text-zinc-600 dark:text-zinc-300">
                      {data.daysOffCount}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold">
                      {data.pendingCount > 0 ? (
                        <span className="text-red-500 font-bold">{data.pendingCount} pendente(s)</span>
                      ) : (
                        <span className="text-emerald-500">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Badge
                        variant={data.pendingCount > 0 ? 'pendente' : 'definida'}
                        size="sm"
                      >
                        {data.pendingCount > 0 ? 'Exige Atenção' : 'Conforme'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
