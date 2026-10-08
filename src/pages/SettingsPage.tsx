import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Building,
  User,
  Sliders,
  Moon,
  Sun,
  RotateCcw,
  CheckCircle2,
  Shield,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [companyName, setCompanyName] = useState('Mercado & Varejo Modelo Ltda');
  const [managerName, setManagerName] = useState('Gestor Operacional');
  const [cltAlertDays, setCltAlertDays] = useState('6');
  const [loading, setLoading] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  useEffect(() => {
    api.getSettings()
      .then(settings => {
        if (settings.company_name) setCompanyName(settings.company_name);
        if (settings.manager_name) setManagerName(settings.manager_name);
        if (settings.clt_alert_days) setCltAlertDays(settings.clt_alert_days);
      })
      .catch(console.error);
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateSettings({
        company_name: companyName,
        manager_name: managerName,
        clt_alert_days: cltAlertDays,
      });
      toast.success('Configurações salvas com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao salvar configurações', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Configurações do Sistema
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Parâmetros operacionais, preferências de interface e identificação da empresa
        </p>
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-700 dark:text-amber-300">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Modo somente leitura. Apenas administradores do sistema podem alterar os parâmetros organizacionais.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-5">
        {/* Identificação da Empresa e Gestor */}
        <Card className="p-6 shadow-mac space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <Building className="w-4 h-4 text-mac-blue" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Identificação Organizacional
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome da Empresa / Unidade"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Ex: Supermercados Aliança Ltda"
              disabled={!isAdmin}
              required
            />

            <Input
              label="Nome do Gestor Responsável"
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              placeholder="Ex: Carlos Menezes"
              disabled={!isAdmin}
              required
            />
          </div>
        </Card>

        {/* Parâmetros de Conformidade CLT / DSR */}
        <Card className="p-6 shadow-mac space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <Sliders className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Regras e Limites de Alerta
            </h3>
          </div>

          <div className="space-y-3">
            <Input
              label="Tolerância de Trabalho Contínuo antes do Alerta (Dias)"
              type="number"
              value={cltAlertDays}
              onChange={e => setCltAlertDays(e.target.value)}
              min="1"
              max="7"
              disabled={!isAdmin}
              helperText="Padrão legal recomendado: 6 dias consecutivos. O sistema alertará quando a escala atingir este limite sem folga."
              required
            />
          </div>
        </Card>

        {/* Preferências de Aparência (macOS Theme) */}
        <Card className="p-6 shadow-mac space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Aparência do Aplicativo
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Tema Ativo: {theme === 'dark' ? 'Modo Escuro (Dark Mode)' : 'Modo Claro (Light Mode)'}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Inspirado no visual elegante do macOS Sequoia com modo escuro nativo
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={toggleTheme}
            >
              Alternar Tema
            </Button>
          </div>
        </Card>

        {isAdmin && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="submit" variant="primary" loading={loading}>
              Salvar Configurações
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsPage;
