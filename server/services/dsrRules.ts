import db from '../db/connection';

export interface EmployeeStatusCalculation {
  employeeId: number;
  name: string;
  department: string;
  position: string;
  status: string; // 'ativo' | 'ferias' | 'afastado' | 'inativo'
  workScheduleType: string; // '6x1' | '5x2' | '12x36'
  lastDayOff: string | null;
  nextDayOff: string | null;
  daysSinceLastDayOff: number | null;
  daysUntilNextDayOff: number | null;
  smartStatus: 'definida' | 'proxima' | 'pendente' | 'sem_escala';
  statusLabel: string;
  alertMessage?: string;
  isWorkingToday: boolean;
  isOffToday: boolean;
}

export function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function diffInDays(dateStrA: string, dateStrB: string): number {
  const a = new Date(dateStrA + 'T00:00:00');
  const b = new Date(dateStrB + 'T00:00:00');
  const diffTime = a.getTime() - b.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula dinamicamente a situação de folga e conformidade DSR de cada colaborador
 */
export function calculateEmployeeStatus(employee: any, todayStr: string = formatYMD(new Date())): EmployeeStatusCalculation {
  if (employee.status !== 'ativo') {
    const label = employee.status === 'ferias' ? 'Em férias regulamentares' :
                  employee.status === 'afastado' ? 'Em afastamento' : 'Inativo';
    return {
      employeeId: employee.id,
      name: employee.name,
      department: employee.department,
      position: employee.position,
      status: employee.status,
      workScheduleType: employee.work_schedule_type || '6x1',
      lastDayOff: null,
      nextDayOff: null,
      daysSinceLastDayOff: null,
      daysUntilNextDayOff: null,
      smartStatus: 'sem_escala',
      statusLabel: label,
      alertMessage: undefined,
      isWorkingToday: false,
      isOffToday: employee.status === 'ferias' || employee.status === 'afastado'
    };
  }

  // Busca última folga realizada ou no passado (<= hoje)
  const lastOffRow: any = db.prepare(`
    SELECT date, type FROM days_off
    WHERE employee_id = ? AND date <= ?
    ORDER BY date DESC
    LIMIT 1
  `).get(employee.id, todayStr);

  // Busca próxima folga agendada (>= hoje)
  const nextOffRow: any = db.prepare(`
    SELECT date, type FROM days_off
    WHERE employee_id = ? AND date >= ?
    ORDER BY date ASC
    LIMIT 1
  `).get(employee.id, todayStr);

  // Verifica se está de folga hoje
  const offTodayRow: any = db.prepare(`
    SELECT id, type FROM days_off
    WHERE employee_id = ? AND date = ?
  `).get(employee.id, todayStr);

  // Verifica escala de hoje
  const schedTodayRow: any = db.prepare(`
    SELECT status FROM work_schedules
    WHERE employee_id = ? AND date = ?
  `).get(employee.id, todayStr);

  const isOffToday = !!offTodayRow || schedTodayRow?.status === 'folga';
  const isWorkingToday = !isOffToday && (schedTodayRow?.status === 'trabalho' || !schedTodayRow);

  const lastDayOff = lastOffRow ? lastOffRow.date : null;
  const nextDayOff = nextOffRow ? nextOffRow.date : null;

  const daysSinceLastDayOff = lastDayOff ? diffInDays(todayStr, lastDayOff) : null;
  const daysUntilNextDayOff = nextDayOff ? diffInDays(nextDayOff, todayStr) : null;

  let smartStatus: 'definida' | 'proxima' | 'pendente' | 'sem_escala' = 'definida';
  let statusLabel = 'Folga definida';
  let alertMessage: string | undefined = undefined;

  // Regras de atenção para o Gestor (CLT / DSR):
  // Limite de tolerância: para escala 6x1, não deve passar de 6 dias seguidos sem DSR
  const maxConsecutiveWork = employee.work_schedule_type === '5x2' ? 5 : 6;

  if (isOffToday) {
    smartStatus = 'definida';
    statusLabel = 'De folga hoje';
  } else if (!nextDayOff) {
    // Não possui próxima folga agendada nos registros futuros
    smartStatus = 'pendente';
    if (daysSinceLastDayOff !== null && daysSinceLastDayOff >= maxConsecutiveWork) {
      statusLabel = 'Folga atrasada / urgente';
      alertMessage = `Atenção: ${employee.name} está há ${daysSinceLastDayOff} dias sem folga registrada. Recomenda-se programar o DSR imediatamente.`;
    } else {
      statusLabel = 'Folga não definida';
      alertMessage = `${employee.name} ainda não possui folga registrada para a semana corrente.`;
    }
  } else {
    // Possui próxima folga
    if (daysUntilNextDayOff !== null && daysUntilNextDayOff <= 2) {
      smartStatus = 'proxima';
      statusLabel = daysUntilNextDayOff === 1 ? 'Folga amanhã' : `Folga em ${daysUntilNextDayOff} dias`;
    } else if (daysUntilNextDayOff !== null && daysUntilNextDayOff > maxConsecutiveWork && (daysSinceLastDayOff === null || daysSinceLastDayOff > 4)) {
      smartStatus = 'pendente';
      statusLabel = 'Intervalo longo sem folga';
      alertMessage = `Atenção ao descanso semanal: intervalo planejado excede a recomendação de 6 dias de trabalho consecutivo.`;
    } else {
      smartStatus = 'definida';
      statusLabel = 'Folga planejada';
    }
  }

  return {
    employeeId: employee.id,
    name: employee.name,
    department: employee.department,
    position: employee.position,
    status: employee.status,
    workScheduleType: employee.work_schedule_type || '6x1',
    lastDayOff,
    nextDayOff,
    daysSinceLastDayOff,
    daysUntilNextDayOff,
    smartStatus,
    statusLabel,
    alertMessage,
    isWorkingToday,
    isOffToday
  };
}

/**
 * Validação de conflitos antes de cadastrar uma folga
 */
export function checkDayOffConflict(employeeId: number, dateStr: string) {
  // 1. Já possui folga nesta data?
  const existing: any = db.prepare(`
    SELECT id, type FROM days_off WHERE employee_id = ? AND date = ?
  `).get(employeeId, dateStr);

  if (existing) {
    return {
      hasConflict: true,
      code: 'DUPLICATE_DAY_OFF',
      message: 'Já existe uma folga cadastrada para este colaborador nesta mesma data.'
    };
  }

  // 2. Colaborador em férias ou afastado nesta data?
  const emp: any = db.prepare(`SELECT status, name, department FROM employees WHERE id = ?`).get(employeeId);
  if (emp && (emp.status === 'ferias' || emp.status === 'afastado')) {
    return {
      hasConflict: false,
      warning: `Colaborador encontra-se atualmente com status "${emp.status}". Certifique-se de manter o histórico alinhado.`
    };
  }

  // 3. Verifica se muitos colaboradores do mesmo departamento estão de folga nesta data
  if (emp) {
    const countSameDept: any = db.prepare(`
      SELECT count(*) as total FROM days_off d
      JOIN employees e ON e.id = d.employee_id
      WHERE e.department = ? AND d.date = ?
    `).get(emp.department, dateStr);

    const totalDeptEmp: any = db.prepare(`
      SELECT count(*) as total FROM employees
      WHERE department = ? AND status = 'ativo'
    `).get(emp.department);

    if (totalDeptEmp.total > 1 && countSameDept.total >= Math.ceil(totalDeptEmp.total * 0.5)) {
      return {
        hasConflict: false,
        warning: `Atenção: mais de 50% dos colaboradores do setor "${emp.department}" estarão de folga nesta data (${countSameDept.total + 1} de ${totalDeptEmp.total}). Verifique a cobertura operacional.`
      };
    }
  }

  return { hasConflict: false };
}
