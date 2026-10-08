import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { WeekDayInfo, WeekGridRow } from '../../types';
import { Calendar, ChevronRight } from 'lucide-react';

interface WeekCalendarCardProps {
  weekDays: WeekDayInfo[];
  weekGrid: WeekGridRow[];
  onSelectEmployeeDay: (employeeId: number, dateStr: string, currentDayOffId: number | null) => void;
  onNavigateToSchedule: () => void;
}

export const WeekCalendarCard: React.FC<WeekCalendarCardProps> = ({
  weekDays,
  weekGrid,
  onSelectEmployeeDay,
  onNavigateToSchedule,
}) => {
  const getCellBadge = (type: string, detail: string) => {
    switch (type) {
      case 'folga':
        return (
          <span className="inline-block w-full py-1 px-1.5 rounded-lg text-[11px] font-semibold text-center bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 shadow-2xs">
            FOLGA
          </span>
        );
      case 'ferias':
        return (
          <span className="inline-block w-full py-1 px-1.5 rounded-lg text-[11px] font-semibold text-center bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50 shadow-2xs">
            FÉRIAS
          </span>
        );
      case 'afastamento':
        return (
          <span className="inline-block w-full py-1 px-1.5 rounded-lg text-[11px] font-semibold text-center bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50 shadow-2xs">
            AFAST.
          </span>
        );
      default:
        return (
          <span className="inline-block w-full py-1 px-1.5 rounded-lg text-[11px] text-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            Trab.
          </span>
        );
    }
  };

  return (
    <Card className="p-5 overflow-hidden shadow-mac">
      <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Folgas e Escala da Semana
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Visão de Segunda a Domingo. Clique em qualquer dia para alterar ou agendar folga.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToSchedule}
          className="text-xs font-semibold text-mac-blue hover:text-mac-blue-hover flex items-center gap-1 transition-colors"
        >
          Ver Escala Completa
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid da semana */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-black/[0.04] dark:border-white/[0.06]">
              <th className="pb-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 w-44">
                Colaborador
              </th>
              {weekDays.map(wd => (
                <th
                  key={wd.dateStr}
                  className={`pb-3 text-center text-xs font-semibold ${
                    wd.isToday
                      ? 'text-mac-blue font-bold'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="uppercase text-[10px] tracking-wider">
                      {wd.dayName}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                        wd.isToday
                          ? 'bg-mac-blue text-white shadow-xs'
                          : ''
                      }`}
                    >
                      {wd.label}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
            {weekGrid.map(row => (
              <tr key={row.employeeId} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="py-2.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        row.smartStatus === 'pendente'
                          ? 'bg-red-500 animate-pulse'
                          : row.smartStatus === 'proxima'
                          ? 'bg-amber-500'
                          : row.smartStatus === 'definida'
                          ? 'bg-emerald-500'
                          : 'bg-zinc-400'
                      }`}
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {row.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                        {row.position}
                      </p>
                    </div>
                  </div>
                </td>

                {row.days.map(d => (
                  <td key={d.dateStr} className="py-2.5 px-1 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectEmployeeDay(row.employeeId, d.dateStr, d.dayOffId)}
                      className="w-full cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                      title={`${row.name} em ${d.dateStr}: ${d.detail} (Clique para alterar)`}
                    >
                      {getCellBadge(d.type, d.detail)}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legenda de Cores Discretas */}
      <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="font-semibold text-zinc-600 dark:text-zinc-300">Legenda:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span>Folga / DSR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
          <span>Férias</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
          <span>Afastamento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-zinc-300 dark:bg-zinc-600" />
          <span>Trabalho Programado</span>
        </div>
      </div>
    </Card>
  );
};

export default WeekCalendarCard;
