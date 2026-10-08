import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { AttentionCardData } from '../../types';
import { AlertCircle, AlertTriangle, CheckCircle2, ArrowRight, CalendarPlus } from 'lucide-react';

interface AttentionCardProps {
  data: AttentionCardData;
  onResolvePending: () => void;
  onScheduleDayOff: (employeeId: number) => void;
}

export const AttentionCard: React.FC<AttentionCardProps> = ({
  data,
  onResolvePending,
  onScheduleDayOff,
}) => {
  const isCritico = data.status === 'critico';
  const isAtencao = data.status === 'atencao';
  const isOk = data.status === 'ok';

  const cardBorderClass = isCritico
    ? 'border-red-200 dark:border-red-900/60 bg-gradient-to-b from-red-50/40 to-white dark:from-red-950/20 dark:to-zinc-800'
    : isAtencao
    ? 'border-amber-200 dark:border-amber-900/60 bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-zinc-800'
    : 'border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50/40 to-white dark:from-emerald-950/20 dark:to-zinc-800';

  return (
    <Card className={`p-6 ${cardBorderClass} relative overflow-hidden transition-all duration-300 shadow-mac`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isCritico
                ? 'bg-red-500 text-white shadow-red-500/30'
                : isAtencao
                ? 'bg-amber-500 text-white shadow-amber-500/30'
                : 'bg-emerald-500 text-white shadow-emerald-500/30'
            }`}
          >
            {isCritico && <AlertCircle className="w-6 h-6 animate-pulse" />}
            {isAtencao && <AlertTriangle className="w-6 h-6" />}
            {isOk && <CheckCircle2 className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                {isOk ? 'STATUS DA ESCALA' : 'ATENÇÃO DO GESTOR'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isCritico ? 'bg-red-500 animate-ping' : isAtencao ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-0.5">
              {data.title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              {data.subtitle}
            </p>
          </div>
        </div>

        {/* Botão de Resolução Direta */}
        {!isOk && (
          <div className="shrink-0 flex items-center">
            <Button
              variant={isCritico ? 'danger' : 'primary'}
              size="md"
              onClick={onResolvePending}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Definir folgas pendentes
            </Button>
          </div>
        )}
      </div>

      {/* Lista de Colaboradores com Pendências */}
      {data.pendingEmployees && data.pendingEmployees.length > 0 && (
        <div className="mt-5 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Colaboradores que necessitam de agendamento de DSR:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {data.pendingEmployees.map(emp => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] shadow-xs hover:border-black/10 dark:hover:border-white/15 transition-all"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {emp.name}
                    </p>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {emp.position} • {emp.department}
                  </p>
                  <p className="text-[10px] text-red-500 dark:text-red-400 font-medium mt-1">
                    {emp.alertMessage}
                  </p>
                </div>

                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => onScheduleDayOff(emp.id)}
                  title="Agendar folga agora"
                  icon={<CalendarPlus className="w-3.5 h-3.5 text-mac-blue" />}
                >
                  Definir
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AttentionCard;
