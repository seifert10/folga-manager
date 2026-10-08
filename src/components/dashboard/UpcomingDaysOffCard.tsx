import React from 'react';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { DayOff } from '../../types';
import { CalendarClock, ArrowRight } from 'lucide-react';

interface UpcomingDaysOffCardProps {
  upcomingDaysOff: DayOff[];
  onNavigateToSchedule: () => void;
  onEditDayOff: (dayOff: DayOff) => void;
}

export const UpcomingDaysOffCard: React.FC<UpcomingDaysOffCardProps> = ({
  upcomingDaysOff,
  onNavigateToSchedule,
  onEditDayOff,
}) => {
  const formatRelativeDay = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const target = new Date(dateStr + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');
    const diff = Math.round((target.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Amanhã';
    if (diff === 2) return 'Em 2 dias';

    const dayOfWeek = target.toLocaleDateString('pt-BR', { weekday: 'short' });
    const formatted = `${String(target.getDate()).padStart(2, '0')}/${String(target.getMonth() + 1).padStart(2, '0')}`;
    return `${dayOfWeek}, ${formatted}`;
  };

  return (
    <Card className="p-5 shadow-mac flex flex-col h-full">
      <div className="flex items-center justify-between pb-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-mac-blue flex items-center justify-center">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Próximas Folgas Programadas
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Previsão para os próximos 14 dias
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToSchedule}
          className="text-xs font-semibold text-mac-blue hover:text-mac-blue-hover flex items-center gap-1"
        >
          Ver todas
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto space-y-2">
        {upcomingDaysOff.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            Nenhuma folga futura agendada no momento.
          </div>
        ) : (
          upcomingDaysOff.map(item => (
            <div
              key={item.id}
              onClick={() => onEditDayOff(item)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border border-transparent hover:border-black/[0.04] dark:hover:border-white/[0.06] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={item.employee_name || 'Funcionário'} size="sm" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-mac-blue transition-colors truncate">
                    {item.employee_name}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                    {item.position} • {item.department}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={item.type === 'ferias' ? 'ferias' : item.type === 'afastamento' ? 'afastamento' : 'dsr'} size="sm">
                  {formatRelativeDay(item.date)}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default UpcomingDaysOffCard;
