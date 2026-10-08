import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import {
  Users,
  Clock,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface OnboardingModalProps {
  onFinish?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onFinish }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const completed = localStorage.getItem('folga_onboarding_completed');
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('folga_onboarding_completed', 'true');
    setIsOpen(false);
    if (onFinish) onFinish();
  };

  const steps = [
    {
      num: 1,
      title: 'Cadastre sua equipe',
      description: 'Informe os colaboradores, cargos, setores e contratos (CLT, Estágio, PJ). O sistema valida CPFs automaticamente.',
      icon: <Users className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500',
    },
    {
      num: 2,
      title: 'Defina a jornada',
      description: 'Configure escalas como 6x1, 5x2 ou 12x36 e a carga horária semanal. Cada regime possui suas particularidades de descanso.',
      icon: <Clock className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-500',
    },
    {
      num: 3,
      title: 'Planeje as folgas (DSR)',
      description: 'Defina o Descanso Semanal Remunerado. O sistema impede duplicidades e alerta sobre intervalos longos sem descanso.',
      icon: <CalendarCheck className="w-5 h-5 text-emerald-500" />,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500',
    },
    {
      num: 4,
      title: 'O sistema cuida dos alertas',
      description: 'Abra o Folga Manager todos os dias: o card "Atenção do Gestor" informará imediatamente quem precisa de ação antes que você esqueça.',
      icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-500',
    },
  ];

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleComplete}
      maxWidth="lg"
      showTrafficLights={true}
    >
      <div className="text-center py-2 space-y-6">
        {/* Header do Onboarding */}
        <div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-mac-blue to-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Bem-vindo ao Folga Manager 👋
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
            Controle inteligente de equipe, folgas e escalas. Nenhum funcionário deve ser esquecido na hora de planejar a folga.
          </p>
        </div>

        {/* 4 Passos Essenciais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {steps.map(s => (
            <div
              key={s.num}
              className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-3"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Passo {s.num}
                </span>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {s.title}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer orientativo */}
        <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300 text-left">
          ⚖ <strong>Aviso legal:</strong> O Folga Manager é uma ferramenta de apoio gerencial à CLT. Sempre confirme regras específicas com o RH ou contabilidade da sua empresa.
        </div>

        {/* Botão de Conclusão */}
        <div className="flex items-center justify-center pt-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto px-8"
            onClick={handleComplete}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Começar a Usar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OnboardingModal;
