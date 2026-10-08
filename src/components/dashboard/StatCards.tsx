import React from 'react';
import Card from '../ui/Card';
import { Users, Briefcase, CalendarCheck, AlertTriangle } from 'lucide-react';

interface StatCardsProps {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    workingToday: number;
    offToday: number;
    pendingDaysOff: number;
  };
  onNavigateToPlanner?: () => void;
  onNavigateToEmployees?: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  stats,
  onNavigateToPlanner,
  onNavigateToEmployees,
}) => {
  const cards = [
    {
      id: 'total',
      label: 'Equipe Cadastrada',
      value: stats.totalEmployees,
      subValue: `${stats.activeEmployees} ativos`,
      icon: <Users className="w-5 h-5 text-blue-500" />,
      bgIcon: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500',
      onClick: onNavigateToEmployees,
    },
    {
      id: 'working',
      label: 'Trabalhando Hoje',
      value: stats.workingToday,
      subValue: 'Em atividade regular',
      icon: <Briefcase className="w-5 h-5 text-indigo-500" />,
      bgIcon: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500',
    },
    {
      id: 'off',
      label: 'De Folga Hoje',
      value: stats.offToday,
      subValue: 'DSR / Compensatória / Férias',
      icon: <CalendarCheck className="w-5 h-5 text-emerald-500" />,
      bgIcon: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500',
    },
    {
      id: 'pending',
      label: 'Pendências de Folga',
      value: stats.pendingDaysOff,
      subValue: stats.pendingDaysOff === 0 ? 'Tudo em dia' : 'Exigem ação do gestor',
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      bgIcon: stats.pendingDaysOff > 0 ? 'bg-red-50 dark:bg-red-950/40 text-red-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400',
      isAlert: stats.pendingDaysOff > 0,
      onClick: onNavigateToPlanner,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <Card
          key={card.id}
          hoverEffect={!!card.onClick}
          onClick={card.onClick}
          className={`p-5 flex items-center justify-between ${
            card.onClick ? 'cursor-pointer' : ''
          } ${
            card.isAlert ? 'border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10' : ''
          }`}
        >
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
              {card.label}
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 tracking-tight">
              {card.value}
            </h3>
            <p
              className={`text-xs mt-1 ${
                card.isAlert
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              {card.subValue}
            </p>
          </div>

          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${card.bgIcon}`}>
            {card.icon}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default StatCards;
