export type SmartStatus = 'definida' | 'proxima' | 'pendente' | 'sem_escala';
export type WorkRegime = 'CLT' | 'Estágio' | 'PJ';
export type WorkScheduleType = '6x1' | '5x2' | '12x36' | 'flexivel';
export type EmployeeStatus = 'ativo' | 'ferias' | 'afastado' | 'inativo';
export type DayOffType = 'dsr' | 'folga_compensatoria' | 'ferias' | 'ausencia_justificada' | 'afastamento' | 'outro';
export type DayOffStatus = 'planejada' | 'confirmada' | 'realizada';

export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';

export interface Department {
  id: number;
  name: string;
  active: number;
  created_at?: string;
  updated_at?: string;
  employee_count?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: number;
  departments: { id: number; name: string }[];
  departmentIds: number[];
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Employee {
  id: number;
  name: string;
  cpf: string;
  cpfFormatted?: string;
  position: string;
  department: string;
  department_id?: number;
  hire_date: string;
  work_regime: WorkRegime;
  weekly_hours: number;
  work_schedule_type: WorkScheduleType;
  avatar_url?: string | null;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
  // Campos calculados dinamicamente
  lastDayOff?: string | null;
  nextDayOff?: string | null;
  daysSinceLastDayOff?: number | null;
  daysUntilNextDayOff?: number | null;
  smartStatus?: SmartStatus;
  statusLabel?: string;
  alertMessage?: string;
  isWorkingToday?: boolean;
  isOffToday?: boolean;
}

export interface DayOff {
  id: number;
  employee_id: number;
  employee_name?: string;
  department?: string;
  department_id?: number;
  position?: string;
  date: string;
  type: DayOffType;
  status: DayOffStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkSchedule {
  id: number;
  employee_id: number;
  employee_name?: string;
  department?: string;
  department_id?: number;
  date: string;
  shift: 'manha' | 'tarde' | 'noite' | 'integral';
  status: 'trabalho' | 'folga' | 'ferias' | 'afastado';
  notes?: string;
}

export interface AttentionPendingEmployee {
  id: number;
  name: string;
  department: string;
  position: string;
  lastDayOff: string | null;
  daysSinceLastDayOff: number | null;
  alertMessage: string;
}

export interface AttentionCardData {
  status: 'critico' | 'atencao' | 'ok';
  title: string;
  subtitle: string;
  pendingEmployees: AttentionPendingEmployee[];
}

export interface WeekDayInfo {
  dateStr: string;
  label: string;
  dayName: string;
  isToday: boolean;
}

export interface WeekGridRow {
  employeeId: number;
  name: string;
  position: string;
  department: string;
  status: string;
  smartStatus: SmartStatus;
  statusLabel: string;
  days: {
    dateStr: string;
    type: 'trabalho' | 'folga' | 'ferias' | 'afastamento' | 'indefinido';
    detail: string;
    dayOffId: number | null;
  }[];
}

export interface DashboardData {
  todayStr: string;
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    workingToday: number;
    offToday: number;
    daysOffToday: number;
    pendingDaysOff: number;
    pending: number;
  };
  attentionCard: AttentionCardData;
  weekDays: WeekDayInfo[];
  weekGrid: WeekGridRow[];
  upcomingDaysOff: DayOff[];
  recentAlerts: AppNotification[];
}

export interface AuditLog {
  id: number;
  employee_id: number | null;
  employee_name?: string;
  user_id?: number | null;
  user_name?: string | null;
  action: string;
  entity?: string;
  entity_id?: number | null;
  department?: string;
  department_id?: number | null;
  position?: string;
  old_value?: string | null;
  new_value?: string | null;
  details?: string | null;
  created_at: string;
}

export interface AppNotification {
  id: number;
  type: 'critico' | 'aviso' | 'info' | 'sucesso';
  title: string;
  message: string;
  related_id?: number | null;
  department_id?: number | null;
  is_read: number;
  created_at: string;
}

export interface SettingsMap {
  company_name?: string;
  manager_name?: string;
  clt_alert_days?: string;
  onboarding_completed?: string;
  [key: string]: string | undefined;
}
