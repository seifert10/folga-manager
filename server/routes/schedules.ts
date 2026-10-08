import { Router } from 'express';
import db from '../db/connection';
import { requireAuth, requireMutation, AuthRequest, recordAuditLog } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

// Buscar escalas com filtro por escopo de setores
router.get('/', (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { startDate, endDate, employeeId } = req.query;

    let sql = `
      SELECT s.*, e.name as employee_name, e.department, e.position, e.department_id
      FROM work_schedules s
      JOIN employees e ON e.id = s.employee_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Isolamento de escopo por setor
    if (user.role !== 'ADMIN') {
      if (user.departmentIds.length === 0) return res.json([]);
      const placeholders = user.departmentIds.map(() => '?').join(',');
      sql += ` AND e.department_id IN (${placeholders})`;
      params.push(...user.departmentIds);
    }

    if (startDate) {
      sql += ` AND s.date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND s.date <= ?`;
      params.push(endDate);
    }
    if (employeeId) {
      sql += ` AND s.employee_id = ?`;
      params.push(employeeId);
    }

    sql += ` ORDER BY s.date ASC`;
    const schedules = db.prepare(sql).all(...params);

    res.json(schedules);
  } catch (error: any) {
    console.error('Erro ao buscar escalas:', error);
    res.status(500).json({ error: 'Erro ao buscar escalas de trabalho' });
  }
});

// Definir ou atualizar escala de trabalho
router.post('/', requireMutation, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { employee_id, date, shift = 'integral', status = 'trabalho', notes = '' } = req.body;

    if (!employee_id || !date) {
      return res.status(400).json({ error: 'Colaborador e data são obrigatórios' });
    }

    const empId = Number(employee_id);
    const emp: any = db.prepare(`SELECT name, department_id FROM employees WHERE id = ?`).get(empId);
    if (!emp) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    // REGRA DE SEGURANÇA: Bloqueia alteração de escala fora do escopo do gestor
    if (user.role !== 'ADMIN' && !user.departmentIds.includes(emp.department_id)) {
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para alterar escalas deste setor.' });
    }

    const existing: any = db.prepare(`SELECT id, status, shift FROM work_schedules WHERE employee_id = ? AND date = ?`).get(empId, date);

    if (existing) {
      db.prepare(`
        UPDATE work_schedules SET shift = ?, status = ?, notes = ? WHERE id = ?
      `).run(shift, status, notes, existing.id);

      recordAuditLog({
        employeeId: empId,
        userId: user.id,
        userName: user.name,
        action: 'ALTEROU_ESCALA',
        entity: 'work_schedules',
        entityId: existing.id,
        departmentId: emp.department_id,
        oldValue: `${existing.shift} (${existing.status})`,
        newValue: `${shift} (${status})`,
        details: `${user.name} atualizou a escala de ${emp.name} em ${date} para ${shift} (${status}).`
      });
    } else {
      const result = db.prepare(`
        INSERT INTO work_schedules (employee_id, date, shift, status, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(empId, date, shift, status, notes);

      recordAuditLog({
        employeeId: empId,
        userId: user.id,
        userName: user.name,
        action: 'CRIOU_ESCALA',
        entity: 'work_schedules',
        entityId: Number(result.lastInsertRowid),
        departmentId: emp.department_id,
        newValue: `${shift} (${status})`,
        details: `${user.name} registrou nova escala para ${emp.name} em ${date}: ${shift} (${status}).`
      });
    }

    res.json({ message: 'Escala salva com sucesso' });
  } catch (error: any) {
    console.error('Erro ao salvar escala:', error);
    res.status(500).json({ error: 'Erro ao salvar escala' });
  }
});

export default router;
