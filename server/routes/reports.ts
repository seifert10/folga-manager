import { Router } from 'express';
import db from '../db/connection';
import { formatYMD, calculateEmployeeStatus } from '../services/dsrRules';
import { formatCPF } from '../utils/cpf';
import { requireAuth, AuthRequest } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

// Resumo executivo para relatórios
router.get('/summary', (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const todayStr = formatYMD(new Date());

    let empSql = `
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE 1=1
    `;
    const empParams: any[] = [];
    if (user.role !== 'ADMIN') {
      if (user.departmentIds.length === 0) {
        return res.json({ statusCounts: { ativo: 0, ferias: 0, afastado: 0, inativo: 0 }, departmentSummary: {}, totalEmployees: 0, totalDaysOff: 0 });
      }
      const placeholders = user.departmentIds.map(() => '?').join(',');
      empSql += ` AND e.department_id IN (${placeholders})`;
      empParams.push(...user.departmentIds);
    }
    empSql += ` ORDER BY e.department_id, e.name`;
    const employees = db.prepare(empSql).all(...empParams) as any[];

    let daysOffSql = `
      SELECT d.*, e.name as employee_name, coalesce(dept.name, e.department) as department, e.position
      FROM days_off d
      JOIN employees e ON e.id = d.employee_id
      LEFT JOIN departments dept ON dept.id = e.department_id
      WHERE 1=1
    `;
    const daysOffParams: any[] = [];
    if (user.role !== 'ADMIN') {
      const placeholders = user.departmentIds.map(() => '?').join(',');
      daysOffSql += ` AND e.department_id IN (${placeholders})`;
      daysOffParams.push(...user.departmentIds);
    }
    daysOffSql += ` ORDER BY d.date DESC`;
    const daysOff = db.prepare(daysOffSql).all(...daysOffParams) as any[];

    const statusCounts = {
      ativo: 0,
      ferias: 0,
      afastado: 0,
      inativo: 0
    };

    const departmentSummary: Record<string, { total: number; daysOffCount: number; pendingCount: number }> = {};

    employees.forEach(emp => {
      const deptName = emp.department_name || emp.department;
      if (statusCounts[emp.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[emp.status as keyof typeof statusCounts]++;
      }

      if (!departmentSummary[deptName]) {
        departmentSummary[deptName] = { total: 0, daysOffCount: 0, pendingCount: 0 };
      }
      departmentSummary[deptName].total++;

      const calc = calculateEmployeeStatus(emp, todayStr);
      if (calc.smartStatus === 'pendente') {
        departmentSummary[deptName].pendingCount++;
      }
    });

    daysOff.forEach(d => {
      if (departmentSummary[d.department]) {
        departmentSummary[d.department].daysOffCount++;
      }
    });

    res.json({
      statusCounts,
      departmentSummary,
      totalEmployees: employees.length,
      totalDaysOff: daysOff.length
    });
  } catch (error: any) {
    console.error('Erro ao gerar resumo de relatórios:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// Exportação em formato CSV com isolamento estrito de escopo
router.get('/export-csv', (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { type = 'folgas', startDate, endDate, department } = req.query;

    if (!['folgas', 'pendencias', 'auditoria'].includes(String(type))) {
      return res.status(400).json({ error: 'Tipo de relatório inválido' });
    }

    // REGRA DE SEGURANÇA: Se um departamento específico foi solicitado, verificar se o gestor tem autorização
    if (department && user.role !== 'ADMIN') {
      const deptRow: any = db.prepare(`SELECT id FROM departments WHERE lower(name) = ?`).get(String(department).toLowerCase());
      if (!deptRow || !user.departmentIds.includes(deptRow.id)) {
        return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para exportar relatórios deste setor.' });
      }
    }

    let csvContent = '';
    let filename = `relatorio_${type}_${formatYMD(new Date())}.csv`;

    if (type === 'folgas') {
      let sql = `
        SELECT d.id, e.name, e.cpf, coalesce(dept.name, e.department) as department, e.position, d.date, d.type, d.status, d.notes, d.created_at
        FROM days_off d
        JOIN employees e ON e.id = d.employee_id
        LEFT JOIN departments dept ON dept.id = e.department_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (user.role !== 'ADMIN') {
        if (user.departmentIds.length === 0) return res.status(403).json({ error: 'Nenhum setor autorizado para exportação' });
        const placeholders = user.departmentIds.map(() => '?').join(',');
        sql += ` AND e.department_id IN (${placeholders})`;
        params.push(...user.departmentIds);
      }

      if (department) {
        sql += ` AND (e.department = ? OR dept.name = ?)`;
        params.push(department, department);
      }
      if (startDate) {
        sql += ` AND d.date >= ?`;
        params.push(startDate);
      }
      if (endDate) {
        sql += ` AND d.date <= ?`;
        params.push(endDate);
      }
      sql += ` ORDER BY d.date DESC, e.name ASC`;
      const rows = db.prepare(sql).all(...params) as any[];

      const header = ['ID', 'Colaborador', 'CPF', 'Setor', 'Cargo', 'Data da Folga', 'Tipo', 'Status', 'Observações', 'Registrado Em'];
      const lines = rows.map(r => [
        r.id,
        `"${r.name}"`,
        `"${formatCPF(r.cpf)}"`,
        `"${r.department}"`,
        `"${r.position}"`,
        r.date,
        `"${r.type}"`,
        `"${r.status}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
        `"${r.created_at}"`
      ].join(';'));

      csvContent = [header.join(';'), ...lines].join('\r\n');
    } else if (type === 'pendencias') {
      const todayStr = formatYMD(new Date());
      let sql = `
        SELECT e.*, d.name as department_name
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.status = 'ativo'
      `;
      const params: any[] = [];

      if (user.role !== 'ADMIN') {
        if (user.departmentIds.length === 0) return res.status(403).json({ error: 'Nenhum setor autorizado para exportação' });
        const placeholders = user.departmentIds.map(() => '?').join(',');
        sql += ` AND e.department_id IN (${placeholders})`;
        params.push(...user.departmentIds);
      }

      if (department) {
        sql += ` AND (e.department = ? OR d.name = ?)`;
        params.push(department, department);
      }

      sql += ` ORDER BY e.department_id, e.name`;
      const employees = db.prepare(sql).all(...params) as any[];

      const pendingRows = employees
        .map(emp => {
          const calc = calculateEmployeeStatus(emp, todayStr);
          return {
            ...calc,
            department: emp.department_name || emp.department
          };
        })
        .filter(c => c.smartStatus === 'pendente');

      const header = ['ID Colaborador', 'Nome', 'Setor', 'Cargo', 'Última Folga', 'Dias Sem Folga', 'Status', 'Alerta / Ação Necessária'];
      const lines = pendingRows.map(p => [
        p.employeeId,
        `"${p.name}"`,
        `"${p.department}"`,
        `"${p.position}"`,
        p.lastDayOff || 'Sem registro anterior',
        p.daysSinceLastDayOff !== null ? p.daysSinceLastDayOff : '—',
        `"${p.statusLabel}"`,
        `"${(p.alertMessage || '').replace(/"/g, '""')}"`
      ].join(';'));

      csvContent = [header.join(';'), ...lines].join('\r\n');
      filename = `pendencias_folgas_${formatYMD(new Date())}.csv`;
    } else if (type === 'auditoria') {
      let sql = `
        SELECT a.id, a.created_at, coalesce(a.user_name, 'Sistema') as user_name, coalesce(e.name, 'Geral') as employee_name, a.action, a.old_value, a.new_value, a.details
        FROM audit_logs a
        LEFT JOIN employees e ON e.id = a.employee_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (user.role !== 'ADMIN') {
        if (user.departmentIds.length === 0) return res.status(403).json({ error: 'Nenhum setor autorizado para exportação' });
        const placeholders = user.departmentIds.map(() => '?').join(',');
        sql += ` AND (a.department_id IN (${placeholders}) OR (a.department_id IS NULL AND e.department_id IN (${placeholders})))`;
        params.push(...user.departmentIds, ...user.departmentIds);
      }

      sql += ` ORDER BY a.created_at DESC LIMIT 500`;
      const rows = db.prepare(sql).all(...params) as any[];

      const header = ['ID', 'Data/Hora', 'Responsável', 'Colaborador', 'Ação', 'Valor Anterior', 'Novo Valor', 'Detalhes'];
      const lines = rows.map(r => [
        r.id,
        `"${r.created_at}"`,
        `"${r.user_name}"`,
        `"${r.employee_name}"`,
        `"${r.action}"`,
        `"${(r.old_value || '').replace(/"/g, '""')}"`,
        `"${(r.new_value || '').replace(/"/g, '""')}"`,
        `"${(r.details || '').replace(/"/g, '""')}"`
      ].join(';'));

      csvContent = [header.join(';'), ...lines].join('\r\n');
      filename = `historico_auditoria_${formatYMD(new Date())}.csv`;
    }

    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const contentBuffer = Buffer.from(csvContent, 'utf-8');
    const fullBuffer = Buffer.concat([bom, contentBuffer]);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fullBuffer);
  } catch (error: any) {
    console.error('Erro na exportação CSV:', error);
    res.status(500).json({ error: 'Erro ao exportar CSV' });
  }
});

export default router;
