import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = false,
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const bgClass = glass
    ? 'bg-white/80 dark:bg-zinc-800/75 mac-blur'
    : 'bg-white dark:bg-zinc-800';

  const hoverClass = hoverEffect
    ? 'hover:shadow-mac-hover transition-all duration-200'
    : '';

  return (
    <div
      className={`rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-mac ${bgClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
