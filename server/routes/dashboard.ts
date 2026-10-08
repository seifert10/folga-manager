import { Router } from 'express';
import db from '../db/connection';
import { calculateEmployeeStatus, formatYMD } from '../services/dsrRules';
import { requireAuth, AuthRequest } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/', (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const todayStr = (req.query.date as string) || formatYMD(new Date());

    // 1. Busca colaboradores respeitando o escopo do usuário
    let empSql = `
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE 1=1
    `;
    const empParams: any[] = [];

    if (user.role !== 'ADMIN') {
      if (user.departmentIds.length === 0) {
        return res.json({
          todayStr,
          stats: { totalEmployees: 0, activeEmployees: 0, workingToday: 0, offToday: 0, daysOffToday: 0, pendingDaysOff: 0, pending: 0 },
          attentionCard: { status: 'ok', title: 'Nenhum setor autorizado', subtitle: 'Solicite ao administrador a atribuição de setores para seu usuário.', pendingEmployees: [] },
          weekDays: [],
          weekGrid: [],
          upcomingDaysOff: [],
          recentAlerts: []
        });
      }
      const placeholders = user.departmentIds.map(() => '?').join(',');
      empSql += ` AND e.department_id IN (${placeholders})`;
      empParams.push(...user.departmentIds);
    }

    empSql += ` ORDER BY e.name ASC`;
    const allEmployees = db.prepare(empSql).all(...empParams) as any[];

    // 2. Calcula status de cada um
    const calculatedList = allEmployees.map(emp => {
      const calc = calculateEmployeeStatus(emp, todayStr);
      return {
        ...calc,
        department: emp.department_name || emp.department,
        department_id: emp.department_id
      };
    });

    const totalEmployees = allEmployees.length;
    const activeEmployees = allEmployees.filter(e => e.status === 'ativo').length;
    const workingToday = calculatedList.filter(c => c.isWorkingToday).length;
    const offToday = calculatedList.filter(c => c.isOffToday).length;

    // Colaboradores que precisam de atenção
    const pendingList = calculatedList.filter(c => c.smartStatus === 'pendente');
    const upcomingList = calculatedList.filter(c => c.smartStatus === 'proxima');

    // Monta o Card de Atenção do Gestor / Administrador
    let attentionStatus: 'critico' | 'atencao' | 'ok' = 'ok';
    let attentionTitle = 'Todos os funcionários possuem folga planejada.';
    let attentionSubtitle = 'Nenhuma pendência ou atraso de DSR identificado para a escala atual.';

    if (totalEmployees === 0) {
      attentionStatus = 'ok';
      attentionTitle = 'Tudo em dia';
      attentionSubtitle = 'Nenhum funcionário cadastrado no escopo atual.';
    } else if (pendingList.length > 0) {
      attentionStatus = 'critico';
      if (user.role === 'ADMIN') {
        // Para ADMIN: breakdown por departamento (ex: Cozinha: 1, Salão: 1)
        const countsByDept: Record<string, number> = {};
        pendingList.forEach(p => {
          countsByDept[p.department] = (countsByDept[p.department] || 0) + 1;
        });
        const deptSummaryText = Object.entries(countsByDept).map(([d, c]) => `${d}: ${c}`).join(' · ');
        attentionTitle = `${pendingList.length} ${pendingList.length === 1 ? 'funcionário precisa' : 'funcionários precisam'} de atenção (${deptSummaryText})`;
      } else {
        attentionTitle = `${pendingList.length} ${pendingList.length === 1 ? 'funcionário precisa' : 'funcionários precisam'} de atenção`;
      }
      attentionSubtitle = 'Existem colaboradores sem o descanso semanal remunerado programado ou em risco de ultrapassar o limite contínuo de trabalho.';
    } else if (upcomingList.length > 0) {
      attentionStatus = 'atencao';
      attentionTitle = `${upcomingList.length} folgas programadas para os próximos dias`;
      attentionSubtitle = 'Escala em andamento. Certifique-se de que as substituições e turnos estão alinhados.';
    }

    // 3. Resumo da Semana Corrente
    const todayDate = new Date(todayStr + 'T00:00:00');
    const dayOfWeek = todayDate.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(todayDate);
    monday.setDate(monday.getDate() - diffToMonday);

    const weekDays: { dateStr: string; label: string; dayName: string; isToday: boolean }[] = [];
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const dStr = formatYMD(d);
      weekDays.push({
        dateStr: dStr,
        label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        dayName: dayNames[i],
        isToday: dStr === todayStr
      });
    }

    const startOfWeek = weekDays[0].dateStr;
    const endOfWeek = weekDays[6].dateStr;

    // Busca folgas da semana dentro do escopo
    let daysOffSql = `
      SELECT d.*, e.name as employee_name, e.position, coalesce(dept.name, e.department) as department
      FROM days_off d
      JOIN employees e ON e.id = d.employee_id
      LEFT JOIN departments dept ON dept.id = e.department_id
      WHERE d.date BETWEEN ? AND ?
    `;
    const daysOffParams: any[] = [startOfWeek, endOfWeek];
    if (user.role !== 'ADMIN') {
      const placeholders = user.departmentIds.map(() => '?').join(',');
      daysOffSql += ` AND e.department_id IN (${placeholders})`;
      daysOffParams.push(...user.departmentIds);
    }
    const daysOffWeek = db.prepare(daysOffSql).all(...daysOffParams) as any[];

    // Busca escalas de trabalho da semana dentro do escopo
    let schedSql = `
      SELECT s.*, e.name as employee_name
      FROM work_schedules s
      JOIN employees e ON e.id = s.employee_id
      WHERE s.date BETWEEN ? AND ?
    `;
    const schedParams: any[] = [startOfWeek, endOfWeek];
    if (user.role !== 'ADMIN') {
      const placeholders = user.departmentIds.map(() => '?').join(',');
      schedSql += ` AND e.department_id IN (${placeholders})`;
      schedParams.push(...user.departmentIds);
    }
    const schedulesWeek = db.prepare(schedSql).all(...schedParams) as any[];

    // Mapeia visualização semanal por funcionário
    const weekGrid = allEmployees.map(emp => {
      const days = weekDays.map(wd => {
        const offRecord = daysOffWeek.find(d => d.employee_id === emp.id && d.date === wd.dateStr);
        const schedRecord = schedulesWeek.find(s => s.employee_id === emp.id && s.date === wd.dateStr);

        let type: 'trabalho' | 'folga' | 'ferias' | 'afastamento' | 'indefinido' = 'trabalho';
        let detail = 'Trabalho normal';

        if (emp.status === 'ferias') {
          type = 'ferias';
          detail = 'Férias';
        } else if (emp.status === 'afastado') {
          type = 'afastamento';
          detail = 'Afastado';
        } else if (offRecord) {
          type = offRecord.type === 'ferias' ? 'ferias' :
                 offRecord.type === 'afastamento' ? 'afastamento' : 'folga';
          detail = offRecord.type === 'dsr' ? 'DSR Semanal' :
                   offRecord.type === 'folga_compensatoria' ? 'Compensatória' :
                   offRecord.type;
        } else if (schedRecord?.status === 'folga') {
          type = 'folga';
          detail = 'Folga';
        }

        return {
          dateStr: wd.dateStr,
          type,
          detail,
          dayOffId: offRecord ? offRecord.id : null
        };
      });

      const calc = calculatedList.find(c => c.employeeId === emp.id);

      return {
        employeeId: emp.id,
        name: emp.name,
        position: emp.position,
        department: emp.department_name || emp.department,
        status: emp.status,
        smartStatus: calc?.smartStatus || 'sem_escala',
        statusLabel: calc?.statusLabel || '',
        days
      };
    });

    // 4. Próximas Folgas Programadas no escopo
    let upcomingSql = `
      SELECT d.*, e.name as employee_name, e.position, coalesce(dept.name, e.department) as department
      FROM days_off d
      JOIN employees e ON e.id = d.employee_id
      LEFT JOIN departments dept ON dept.id = e.department_id
      WHERE d.date >= ? AND d.date <= date(?, '+14 days')
    `;
    const upcomingParams: any[] = [todayStr, todayStr];
    if (user.role !== 'ADMIN') {
      const placeholders = user.departmentIds.map(() => '?').join(',');
      upcomingSql += ` AND e.department_id IN (${placeholders})`;
      upcomingParams.push(...user.departmentIds);
    }
    upcomingSql += ` ORDER BY d.date ASC LIMIT 8`;
    const upcomingDaysOff = db.prepare(upcomingSql).all(...upcomingParams) as any[];

    // 5. Alertas recentes no escopo
    let alertSql = `
      SELECT * FROM notifications
      WHERE is_read = 0
    `;
    const alertParams: any[] = [];
    if (user.role !== 'ADMIN') {
      const placeholders = user.departmentIds.map(() => '?').join(',');
      alertSql += ` AND (department_id IS NULL OR department_id IN (${placeholders}))`;
      alertParams.push(...user.departmentIds);
    }
    alertSql += ` ORDER BY created_at DESC LIMIT 5`;
    const recentAlerts = db.prepare(alertSql).all(...alertParams);

    res.json({
      todayStr,
      stats: {
        totalEmployees,
        activeEmployees,
        workingToday,
        offToday,
        daysOffToday: offToday,
        pendingDaysOff: pendingList.length,
        pending: pendingList.length
      },
      attentionCard: {
        status: attentionStatus,
        title: attentionTitle,
        subtitle: attentionSubtitle,
        pendingEmployees: pendingList.map(p => ({
          id: p.employeeId,
          name: p.name,
          department: p.department,
          position: p.position,
          lastDayOff: p.lastDayOff,
          daysSinceLastDayOff: p.daysSinceLastDayOff,
          alertMessage: p.alertMessage || 'Folga não definida nesta semana.'
        }))
      },
      weekDays,
      weekGrid,
      upcomingDaysOff,
      recentAlerts
    });
  } catch (error: any) {
    console.error('Erro ao processar métricas do dashboard:', error);
    res.status(500).json({ error: 'Falha ao carregar métricas do dashboard' });
  }
});

export default router;
