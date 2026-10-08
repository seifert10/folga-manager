import React, { useState, useEffect } from 'react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { api } from '../../services/api';
import { Employee, DayOff, AuditLog } from '../../types';
import {
  X,
  Calendar,
  Briefcase,
  Building,
  Clock,
  CalendarClock,
  History,
  CheckCircle2,
  CalendarCheck,
  Edit2,
  Trash2,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface EmployeeDetailDrawerProps {
  employeeId: number | null;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onAddDayOff: (employeeId: number) => void;
}

export const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
  employeeId,
  onClose,
  onEdit,
  onDelete,
  onAddDayOff,
}) => {
  const { isViewer } = useAuth();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'perfil' | 'folgas' | 'auditoria'>('perfil');

  useEffect(() => {
    if (employeeId) {
      setLoading(true);
      api.getEmployeeById(employeeId)
        .then(setDetails)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setDetails(null);
    }
  }, [employeeId]);

  if (!employeeId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Panel macOS */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border-l border-black/[0.08] dark:border-white/[0.1] shadow-2xl z-50 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header do Painel */}
        <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-zinc-50/60 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            {details && <Avatar name={details.name} size="md" />}
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {details?.name || 'Carregando...'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {details?.position} • {details?.department}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar painel"
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs de Navegação do Perfil */}
        <div className="px-5 pt-3 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center gap-4 bg-zinc-50/30 dark:bg-zinc-800/20">
          <button
            onClick={() => setActiveTab('perfil')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'perfil'
                ? 'border-mac-blue text-mac-blue'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('folgas')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'folgas'
                ? 'border-mac-blue text-mac-blue'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Histórico de Folgas
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'auditoria'
                ? 'border-mac-blue text-mac-blue'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Auditoria & Alterações
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading || !details ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 border-2 border-mac-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'perfil' && (
                <div className="space-y-5">
                  {/* Status DSR & Inteligência */}
                  <Card className="p-4 border-black/[0.06] dark:border-white/[0.08] bg-zinc-50/50 dark:bg-zinc-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-500">Status de Folga</span>
                      <Badge
                        variant={
                          details.calc?.smartStatus === 'pendente'
                            ? 'pendente'
                            : details.calc?.smartStatus === 'proxima'
                            ? 'proxima'
                            : details.calc?.smartStatus === 'definida'
                            ? 'definida'
                            : 'sem_escala'
                        }
                      >
                        {details.calc?.statusLabel || details.status}
                      </Badge>
                    </div>

                    {details.calc?.alertMessage && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl mt-2">
                        {details.calc.alertMessage}
                      </p>
                    )}
                  </Card>

                  {/* 3 Indicadores do Mês */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] text-center">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">Folgas no Mês</p>
                      <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                        {details.metrics?.daysOffThisMonth || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] text-center">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">Dias Trab. Mês</p>
                      <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                        {details.metrics?.daysWorkedThisMonth || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] text-center">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">Dias s/ Folga</p>
                      <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                        {details.metrics?.daysSinceLastDayOff !== null ? details.metrics.daysSinceLastDayOff : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Ficha Cadastral */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Informações Cadastrais
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40">
                        <span className="text-zinc-400 block text-[11px]">CPF</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {details.cpfFormatted}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40">
                        <span className="text-zinc-400 block text-[11px]">Regime de Trabalho</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {details.work_regime} ({details.weekly_hours}h/sem)
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40">
                        <span className="text-zinc-400 block text-[11px]">Escala Regulamentar</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          Escala {details.work_schedule_type}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40">
                        <span className="text-zinc-400 block text-[11px]">Data de Admissão</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {details.hire_date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Próxima Folga Programada */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-mac-blue font-semibold uppercase tracking-wider">
                        Próximo Descanso
                      </span>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                        {details.metrics?.nextDayOff || 'Folga pendente de agendamento'}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onAddDayOff(details.id)}
                      icon={<CalendarCheck className="w-3.5 h-3.5" />}
                    >
                      Agendar
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'folgas' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Próximas Folgas Agendadas ({details.futureDaysOff?.length || 0})
                    </h4>
                    {details.futureDaysOff?.length === 0 ? (
                      <p className="text-xs text-zinc-400 py-3">Nenhuma folga futura agendada.</p>
                    ) : (
                      <div className="space-y-2">
                        {details.futureDaysOff.map((f: DayOff) => (
                          <div
                            key={f.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06]"
                          >
                            <div>
                              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{f.date}</p>
                              {f.notes && <p className="text-[10px] text-zinc-400">{f.notes}</p>}
                            </div>
                            <Badge variant={f.type === 'ferias' ? 'ferias' : f.type === 'afastamento' ? 'afastamento' : 'dsr'} size="sm">
                              {f.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Histórico Passado ({details.pastDaysOff?.length || 0})
                    </h4>
                    {details.pastDaysOff?.length === 0 ? (
                      <p className="text-xs text-zinc-400 py-3">Nenhum registro anterior.</p>
                    ) : (
                      <div className="space-y-2">
                        {details.pastDaysOff.map((f: DayOff) => (
                          <div
                            key={f.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06]"
                          >
                            <div>
                              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{f.date}</p>
                              {f.notes && <p className="text-[10px] text-zinc-400">{f.notes}</p>}
                            </div>
                            <span className="text-[10px] text-zinc-400">{f.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'auditoria' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Registros de Auditoria
                  </h4>

                  {details.auditTrail?.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-6 text-center">Nenhum registro para este colaborador.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {details.auditTrail.map((log: AuditLog) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-black/[0.04] dark:border-white/[0.06] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-mac-blue text-[11px]">{log.action}</span>
                            <span className="text-[10px] text-zinc-400">{log.created_at}</span>
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
                            {log.details}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer com Ações (oculto para perfil somente leitura) */}
        {details && !isViewer && (
          <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-zinc-50/80 dark:bg-zinc-800/60 flex items-center justify-between">
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(details)}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Excluir
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(details)}
                icon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Editar Cadastro
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailDrawer;
