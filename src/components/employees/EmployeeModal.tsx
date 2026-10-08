import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { api } from '../../services/api';
import { Employee, WorkRegime, WorkScheduleType, EmployeeStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { AlertCircle, User, Briefcase, Calendar } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeToEdit?: Employee | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employeeToEdit,
}) => {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('Operações');
  const [hireDate, setHireDate] = useState('');
  const [workRegime, setWorkRegime] = useState<WorkRegime>('CLT');
  const [weeklyHours, setWeeklyHours] = useState('44');
  const [workScheduleType, setWorkScheduleType] = useState<WorkScheduleType>('6x1');
  const [status, setStatus] = useState<EmployeeStatus>('ativo');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      if (employeeToEdit) {
        setName(employeeToEdit.name);
        setCpf(employeeToEdit.cpfFormatted || employeeToEdit.cpf);
        setPosition(employeeToEdit.position);
        setDepartment(employeeToEdit.department);
        setHireDate(employeeToEdit.hire_date);
        setWorkRegime(employeeToEdit.work_regime);
        setWeeklyHours(String(employeeToEdit.weekly_hours));
        setWorkScheduleType(employeeToEdit.work_schedule_type);
        setStatus(employeeToEdit.status);
      } else {
        setName('');
        setCpf('');
        setPosition('');
        setDepartment('Operações');
        const today = new Date().toISOString().split('T')[0];
        setHireDate(today);
        setWorkRegime('CLT');
        setWeeklyHours('44');
        setWorkScheduleType('6x1');
        setStatus('ativo');
      }
      setErrorMessage(null);
    }
  }, [isOpen, employeeToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !cpf.trim() || !position.trim() || !department.trim() || !hireDate) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const payload: Partial<Employee> = {
        name: name.trim(),
        cpf: cpf.trim(),
        position: position.trim(),
        department: department.trim(),
        hire_date: hireDate,
        work_regime: workRegime,
        weekly_hours: Number(weeklyHours),
        work_schedule_type: workScheduleType,
        status,
      };

      if (employeeToEdit) {
        await api.updateEmployee(employeeToEdit.id, payload);
        toast.success('Funcionário atualizado com sucesso!');
      } else {
        await api.createEmployee(payload);
        toast.success('Funcionário cadastrado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar funcionário.');
    } finally {
      setLoading(false);
    }
  };

  const [availableDepartments, setAvailableDepartments] = useState<{ value: string; label: string; id: number }[]>([]);

  useEffect(() => {
    async function fetchDepts() {
      try {
        const depts = await api.getDepartments();
        const activeDepts = depts.filter(d => d.active);
        const options = activeDepts.map(d => ({ value: d.name, label: d.name, id: d.id }));
        setAvailableDepartments(options);
        if (options.length > 0 && !employeeToEdit) {
          setDepartment(options[0].value);
        }
      } catch {
        // Fallback
      }
    }
    if (isOpen) {
      fetchDepts();
    }
  }, [isOpen, employeeToEdit]);

  const departmentOptions = availableDepartments.length > 0
    ? availableDepartments
    : [
        { value: 'Cozinha', label: 'Cozinha' },
        { value: 'Salão', label: 'Salão' },
        { value: 'Bar', label: 'Bar' },
        { value: 'Caixa', label: 'Caixa' },
        { value: 'Administrativo', label: 'Administrativo' },
      ];

  const regimeOptions = [
    { value: 'CLT', label: 'CLT (Efetivo)' },
    { value: 'Estágio', label: 'Estágio' },
    { value: 'PJ', label: 'Prestador PJ' },
  ];

  const scheduleOptions = [
    { value: '6x1', label: 'Escala 6x1 (6 dias trabalhados x 1 descanso)' },
    { value: '5x2', label: 'Escala 5x2 (5 dias trabalhados x 2 descansos)' },
    { value: '12x36', label: 'Escala 12x36 (12h de trabalho x 36h descanso)' },
    { value: 'flexivel', label: 'Jornada Flexível' },
  ];

  const statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'ferias', label: 'Férias' },
    { value: 'afastado', label: 'Afastado (Atestado/Licença)' },
    { value: 'inativo', label: 'Inativo' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? 'Editar Funcionário' : 'Cadastrar Novo Funcionário'}
      subtitle="Dados contratuais e configuração de jornada de trabalho"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nome Completo *"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: João da Silva"
            icon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="CPF (Apenas números ou formatado) *"
            value={cpf}
            onChange={e => setCpf(e.target.value)}
            placeholder="000.000.000-00"
            helperText="Validação automática de dígitos verificadores"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Cargo *"
            value={position}
            onChange={e => setPosition(e.target.value)}
            placeholder="Ex: Operador de Caixa"
            icon={<Briefcase className="w-4 h-4" />}
            required
          />

          <Select
            label="Setor / Departamento *"
            value={department}
            onChange={e => setDepartment(e.target.value)}
            options={departmentOptions}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Data de Admissão *"
            type="date"
            value={hireDate}
            onChange={e => setHireDate(e.target.value)}
            icon={<Calendar className="w-4 h-4" />}
            required
          />

          <Select
            label="Regime de Contratação *"
            value={workRegime}
            onChange={e => setWorkRegime(e.target.value as WorkRegime)}
            options={regimeOptions}
            required
          />

          <Input
            label="Carga Horária Semanal (Horas)"
            type="number"
            value={weeklyHours}
            onChange={e => setWeeklyHours(e.target.value)}
            placeholder="44"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Tipo de Escala *"
            value={workScheduleType}
            onChange={e => setWorkScheduleType(e.target.value as WorkScheduleType)}
            options={scheduleOptions}
            required
          />

          <Select
            label="Status do Colaborador *"
            value={status}
            onChange={e => setStatus(e.target.value as EmployeeStatus)}
            options={statusOptions}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {employeeToEdit ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeModal;
