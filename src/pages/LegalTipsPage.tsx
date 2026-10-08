import React from 'react';
import Card from '../components/ui/Card';
import {
  Lightbulb,
  ShieldAlert,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Scale,
} from 'lucide-react';

export const LegalTipsPage: React.FC = () => {
  const tips = [
    {
      id: 'dsr-conceito',
      title: 'Descanso Semanal Remunerado (DSR)',
      category: 'Conceito Fundamental',
      icon: <Calendar className="w-5 h-5 text-mac-blue" />,
      content:
        'Todo empregado tem direito a um descanso semanal remunerado de 24 horas consecutivas, preferencialmente aos domingos (Art. 67 da CLT e Lei 605/1949). O DSR é direito irrenunciável e garante a recuperação física e mental do trabalhador.',
      practicalTip:
        'Evite deixar o agendamento da folga para a última hora. Planeje com pelo menos uma semana de antecedência.',
    },
    {
      id: 'limite-dias',
      title: 'Limite Máximo de Dias Consecutivos (Escala 6x1)',
      category: 'Prevenção de Passivo',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      content:
        'Na escala 6x1, o descanso deve ser concedido após no máximo 6 dias consecutivos de trabalho. A concessão do descanso no 7º dia consecutivo descaracteriza a periodicidade semanal e acarreta a remuneração em dobro (Orientação Jurisprudencial 410 da SDI-1 do TST).',
      practicalTip:
        'O Folga Manager emite um alerta automático caso um colaborador esteja a mais de 5 dias sem folga agendada.',
    },
    {
      id: 'domingos-revezamento',
      title: 'Trabalho aos Domingos e Revezamento',
      category: 'Escala em Comércio & Serviços',
      icon: <Clock className="w-5 h-5 text-purple-500" />,
      content:
        'Para empresas autorizadas a funcionar aos domingos, deve ser estabelecida uma escala de revezamento para que o repouso coincida periodicamente com o domingo. Em atividades comerciais, a lei determina que a folga deve recair no domingo pelo menos a cada 3 semanas (ou conforme Convenção Coletiva de Trabalho - CCT).',
      practicalTip:
        'Sempre consulte a Convenção Coletiva do seu sindicato patronal/laboral, pois ela pode estipular regras mais favoráveis.',
    },
    {
      id: 'intervalo-interjornada',
      title: 'Intervalo Interjornada (Mínimo de 11 Horas)',
      category: 'Segurança & Saúde',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      content:
        'Entre 2 (duas) jornadas de trabalho haverá um período mínimo de 11 (onze) horas consecutivas para descanso (Artigo 66 da CLT). Além disso, quando o descanso semanal remunerado se junta ao intervalo entre jornadas, somam-se 35 horas consecutivas de repouso (11h + 24h).',
      practicalTip:
        'Atenção ao mudar o colaborador de turno noturno para diurno: respeite rigorosamente as 11 horas de intervalo.',
    },
    {
      id: 'acordos-coletivos',
      title: 'Convenções e Acordos Coletivos (CCT / ACT)',
      category: 'Normas Específicas',
      icon: <FileText className="w-5 h-5 text-indigo-500" />,
      content:
        'Com a Reforma Trabalhista (Art. 611-A da CLT), acordos e convenções coletivas possuem força de lei sobre diversos pontos da jornada de trabalho, banco de horas e intervalos. Regras específicas de determinadas categorias (como vigilantes, porteiros, frentistas, saúde) prevalecem.',
      practicalTip:
        'Tenha sempre uma cópia da CCT da sua categoria arquivada e alinhada com o setor de Recursos Humanos ou Contabilidade.',
    },
    {
      id: 'registro-historico',
      title: 'Comunicação Prévia e Registro Imutável',
      category: 'Gestão de Pessoas',
      icon: <Scale className="w-5 h-5 text-teal-500" />,
      content:
        'A transparência nas escalas é elemento fundamental para manter a equipe motivada e prevenir reclamações trabalhistas. Divulgar a escala mensal ou quinzenal com antecedência permite que o colaborador organize sua vida pessoal.',
      practicalTip:
        'Toda alteração de folga no Folga Manager gera automaticamente um registro de auditoria com data, hora e justificativa.',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <span>Dicas Trabalhistas & Base Legal CLT</span>
          <Lightbulb className="w-5 h-5 text-amber-500" />
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Conceitos gerais e orientações práticas para planejamento seguro de jornadas e descansos
        </p>
      </div>

      {/* AVISO LEGAL OBRIGATÓRIO EM DESTAQUE */}
      <Card className="p-5 border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 shadow-mac">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Aviso Orientativo — Não Substitui Orientação Jurídica ou RH
            </h3>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-1 leading-relaxed">
              Este sistema fornece apoio ao planejamento de escalas e não substitui orientação do RH, contador ou profissional jurídico. Regras podem variar conforme categoria profissional, convenção coletiva, acordo coletivo e contrato de trabalho. O cumprimento das regras da CLT deve ser sempre validado com o departamento competente.
            </p>
          </div>
        </div>
      </Card>

      {/* Grid de Dicas e Boas Práticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tips.map(tip => (
          <Card key={tip.id} className="p-5 flex flex-col justify-between shadow-mac hover:border-black/10 dark:hover:border-white/15 transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    {tip.icon}
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {tip.title}
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {tip.category}
                </span>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {tip.content}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] bg-zinc-50/60 dark:bg-zinc-800/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 flex items-start gap-2">
                <span className="font-bold text-mac-blue shrink-0">Prática do Gestor:</span>
                <span>{tip.practicalTip}</span>
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LegalTipsPage;
