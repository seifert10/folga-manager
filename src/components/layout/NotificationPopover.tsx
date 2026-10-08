import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, AlertCircle, AlertTriangle, Info, Check } from 'lucide-react';
import { api } from '../../services/api';
import { AppNotification } from '../../types';

interface NotificationPopoverProps {
  onNavigateToPlanner?: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  onNavigateToPlanner,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    api.getNotifications()
      .then(res => {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'critico':
        return <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
      case 'aviso':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'sucesso':
        return <Check className="w-4 h-4 text-emerald-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        aria-label="Central de Notificações"
        className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 dark:bg-zinc-850 dark:bg-zinc-900/95 mac-blur rounded-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-mac-modal z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08] bg-zinc-50/50 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Notificações
              </h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  {unreadCount} novas
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] flex items-center gap-1 text-mac-blue hover:text-mac-blue-hover font-medium"
              >
                <CheckCheck className="w-3 h-3" />
                Marcar lidas
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Nenhuma notificação no momento.
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-3.5 flex items-start gap-3 transition-colors ${
                    n.is_read ? 'opacity-60 bg-transparent' : 'bg-blue-50/20 dark:bg-blue-950/10'
                  }`}
                >
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-zinc-400 mt-1.5 block">
                      {n.created_at}
                    </span>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      title="Marcar como lida"
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {onNavigateToPlanner && (
            <div className="p-2 border-t border-black/[0.06] dark:border-white/[0.08] bg-zinc-50/50 dark:bg-zinc-800/40 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToPlanner();
                }}
                className="text-xs text-mac-blue hover:text-mac-blue-hover font-medium py-1 w-full"
              >
                Abrir Central de Pendências →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPopover;
