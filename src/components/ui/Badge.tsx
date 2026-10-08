import React from 'react';

type BadgeVariant =
  | 'definida'
  | 'proxima'
  | 'pendente'
  | 'sem_escala'
  | 'dsr'
  | 'compensatoria'
  | 'ferias'
  | 'afastamento'
  | 'trabalho'
  | 'neutro';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutro',
  children,
  showDot = true,
  className = '',
  size = 'md',
}) => {
  const styles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
    definida: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-800/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    proxima: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/40',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500 animate-pulse',
    },
    pendente: {
      bg: 'bg-red-50 dark:bg-red-950/40 border-red-200/70 dark:border-red-800/40',
      text: 'text-red-700 dark:text-red-300',
      dot: 'bg-red-500 animate-ping',
    },
    sem_escala: {
      bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
      text: 'text-zinc-600 dark:text-zinc-400',
      dot: 'bg-zinc-400',
    },
    dsr: {
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-800/40',
      text: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500',
    },
    compensatoria: {
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/70 dark:border-purple-800/40',
      text: 'text-purple-700 dark:text-purple-300',
      dot: 'bg-purple-500',
    },
    ferias: {
      bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200/70 dark:border-cyan-800/40',
      text: 'text-cyan-700 dark:text-cyan-300',
      dot: 'bg-cyan-500',
    },
    afastamento: {
      bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200/70 dark:border-orange-800/40',
      text: 'text-orange-700 dark:text-orange-300',
      dot: 'bg-orange-500',
    },
    trabalho: {
      bg: 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200/70 dark:border-zinc-700/60',
      text: 'text-zinc-700 dark:text-zinc-300',
      dot: 'bg-zinc-400',
    },
    neutro: {
      bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
      text: 'text-zinc-600 dark:text-zinc-400',
      dot: 'bg-zinc-400',
    },
  };

  const current = styles[variant] || styles.neutro;
  const sizeClass = size === 'sm' ? 'text-[11px] py-0.5 px-2 gap-1' : 'text-xs py-1 px-2.5 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${current.bg} ${current.text} ${sizeClass} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          <span className={`h-2 w-2 rounded-full ${current.dot}`} />
        </span>
      )}
      {children}
    </span>
  );
};

export default Badge;
