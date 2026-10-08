import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, CalendarPlus, AlertTriangle, Calendar, FileText, Lightbulb, Moon, Sun, ArrowRight, User } from 'lucide-react';
import { api } from '../../services/api';
import { Employee } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { PageId } from '../layout/Sidebar';

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId, params?: any) => void;
  onOpenNewDayOffModal: () => void;
  onOpenNewEmployeeModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenNewDayOffModal,
  onOpenNewEmployeeModal,
}) => {
  const [query, setQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      api.getEmployees().then(setEmployees).catch(console.error);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const defaultActions: PaletteItem[] = [
    {
      id: 'action-new-day-off',
      title: 'Agendar nova folga',
      category: 'Ações Rápidas',
      icon: <CalendarPlus className="w-4 h-4 text-mac-blue" />,
      action: () => {
        onClose();
        onOpenNewDayOffModal();
      },
    },
    {
      id: 'action-new-employee',
      title: 'Cadastrar novo funcionário',
      category: 'Ações Rápidas',
      icon: <UserPlus className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onClose();
        onOpenNewEmployeeModal();
      },
    },
    {
      id: 'action-pending',
      title: 'Ver funcionários com folga pendente',
      category: 'Planejamento',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      action: () => {
        onClose();
        onNavigate('planner');
      },
    },
    {
      id: 'action-calendar',
      title: 'Abrir escala e calendário',
      category: 'Navegação',
      icon: <Calendar className="w-4 h-4 text-purple-500" />,
      action: () => {
        onClose();
        onNavigate('schedule');
      },
    },
    {
      id: 'action-reports',
      title: 'Ver relatórios e exportar CSV',
      category: 'Navegação',
      icon: <FileText className="w-4 h-4 text-blue-500" />,
      action: () => {
        onClose();
        onNavigate('reports');
      },
    },
    {
      id: 'action-tips',
      title: 'Dicas trabalhistas e CLT / DSR',
      category: 'Orientação',
      icon: <Lightbulb className="w-4 h-4 text-yellow-500" />,
      action: () => {
        onClose();
        onNavigate('legal-tips');
      },
    },
    {
      id: 'action-theme',
      title: `Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`,
      category: 'Preferências',
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />,
      action: () => {
        toggleTheme();
        onClose();
      },
    },
  ];

  // Filtra colaboradores pela query
  const filteredEmployees = query.trim()
    ? employees.filter(
        emp =>
          emp.name.toLowerCase().includes(query.toLowerCase()) ||
          emp.position.toLowerCase().includes(query.toLowerCase()) ||
          emp.department.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const employeeActions: PaletteItem[] = filteredEmployees.slice(0, 5).map(emp => ({
    id: `emp-${emp.id}`,
    title: emp.name,
    subtitle: `${emp.position} • ${emp.department} • Status: ${emp.statusLabel || emp.status}`,
    category: 'Colaboradores',
    icon: <User className="w-4 h-4 text-zinc-500" />,
    action: () => {
      onClose();
      onNavigate('employees', { selectedEmployeeId: emp.id });
    },
  }));

  const filteredDefaultActions = defaultActions.filter(act =>
    act.title.toLowerCase().includes(query.toLowerCase())
  );

  const combinedItems: PaletteItem[] = query.trim()
    ? [...employeeActions, ...filteredDefaultActions]
    : defaultActions;

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, combinedItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + combinedItems.length) % Math.max(1, combinedItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (combinedItems[selectedIndex]) {
          combinedItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, combinedItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Spotlight Box macOS */}
      <div className="relative w-full max-w-xl bg-white/95 dark:bg-zinc-900/95 mac-blur rounded-3xl border border-black/[0.08] dark:border-white/[0.12] shadow-mac-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08] gap-3">
          <Search className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Pesquisar funcionário, ação ou comando..."
            className="w-full bg-transparent text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[11px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {combinedItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
              Nenhum comando ou funcionário encontrado para "{query}"
            </div>
          ) : (
            combinedItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-mac-blue text-white'
                      : 'text-zinc-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium leading-tight truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p
                          className={`text-xs truncate mt-0.5 ${
                            isSelected
                              ? 'text-white/80'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-white/25 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.category}
                    </span>
                    <ArrowRight
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-white' : 'text-zinc-400'
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-zinc-50/70 dark:bg-zinc-800/50 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
          <span>Use as setas ↑ ↓ para navegar e Enter para selecionar</span>
          <span>Folga Manager Spotlight</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
