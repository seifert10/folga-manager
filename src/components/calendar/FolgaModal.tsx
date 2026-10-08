import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { api } from '../../services/api';
import { Employee, DayOffType } from '../../types';
import { useToast } from '../../context/ToastContext';
import { AlertCircle, Calendar } from 'lucide-react';

interface FolgaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialEmployeeId?: number;
  initialDate?: string;
}

export const FolgaModal: React.FC<FolgaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeId,
  initialDate,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [type, setType] = useState<DayOffType>('dsr');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      api.getEmployees({ status: 'ativo' })
        .then(data => {
          setEmployees(data);
          if (initialEmployeeId) {
            setEmployeeId(String(initialEmployeeId));
          } else if (data.length > 0 && !employeeId) {
            setEmployeeId(String(data[0].id));
          }
        })
        .catch(console.error);

      if (initialDate) {
        setDate(initialDate);
      } else {
        const today = new Date();
        setDate(today.toISOString().split('T')[0]);
      }
      setNotes('');
      setErrorMessage(null);
    }
  }, [isOpen, initialEmployeeId, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!employeeId || !date) {
      setErrorMessage('Selecione o colaborador e a data da folga.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createDayOff({
        employee_id: Number(employeeId),
        date,
        type,
        status: 'confirmada',
        notes,
      });

      if (res.warning) {
        toast.warning('Folga agendada com observação', res.warning);
      } else {
        toast.success('Folga agendada com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao cadastrar folga.');
    } finally {
      setLoading(false);
    }
  };

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.name} — ${emp.position} (${emp.department})`,
  }));

  const typeOptions = [
    { value: 'dsr', label: 'Descanso Semanal Remunerado (DSR)' },
    { value: 'folga_compensatoria', label: 'Folga Compensatória (Banco de Horas)' },
    { value: 'ferias', label: 'Férias Regulamentares' },
    { value: 'ausencia_justificada', label: 'Ausência Justificada / Atestado' },
    { value: 'afastamento', label: 'Afastamento' },
    { value: 'outro', label: 'Outro' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agendar Folga / Descanso"
      subtitle="Defina o dia de folga e mantenha a escala em dia"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Select
          label="Colaborador *"
          value={employeeId}
          onChange={e => setEmployeeId(e.target.value)}
          options={employeeOptions}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Data da Folga *"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            icon={<Calendar className="w-4 h-4" />}
            required
          />

          <Select
            label="Tipo de Descanso *"
            value={type}
            onChange={e => setType(e.target.value as DayOffType)}
            options={typeOptions}
            required
          />
        </div>

        <Input
          label="Observações (Opcional)"
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Ex: Troca de folga com colega, folga de aniversário, etc."
        />

        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/[0.04] dark:border-white/[0.06] text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          💡 <strong>Dica de Gestão:</strong> A CLT orienta que o DSR deve ocorrer preferencialmente aos domingos e dentro do ciclo semanal para escalas 6x1.
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Salvar Folga
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FolgaModal;
