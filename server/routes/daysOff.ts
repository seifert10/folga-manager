import { Router } from 'express';
import db from '../db/connection';
import { checkDayOffConflict } from '../services/dsrRules';
import { requireAuth, requireMutation, AuthRequest, recordAuditLog } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

// Listar folgas com filtragem por escopo
router.get('/', (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { startDate, endDate, employeeId, type, month } = req.query;

    let sql = `
      SELECT d.*, e.name as employee_name, e.department, e.position, e.department_id
      FROM days_off d
      JOIN employees e ON e.id = d.employee_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Isolamento por escopo de setores
    if (user.role !== 'ADMIN') {
      if (user.departmentIds.length === 0) return res.json([]);
      const placeholders = user.departmentIds.map(() => '?').join(',');
      sql += ` AND e.department_id IN (${placeholders})`;
      params.push(...user.departmentIds);
    }

    if (employeeId) {
      sql += ` AND d.employee_id = ?`;
      params.push(employeeId);
    }
    if (type) {
      sql += ` AND d.type = ?`;
      params.push(type);
    }
    if (month) {
      sql += ` AND d.date LIKE ?`;
      params.push(`${month}%`);
    } else {
      if (startDate) {
        sql += ` AND d.date >= ?`;
        params.push(startDate);
      }
      if (endDate) {
        sql += ` AND d.date <= ?`;
        params.push(endDate);
      }
    }

    sql += ` ORDER BY d.date ASC, e.name ASC`;
    const daysOff = db.prepare(sql).all(...params);

    res.json(daysOff);
  } catch (error: any) {
    console.error('Erro ao listar folgas:', error);
    res.status(500).json({ error: 'Erro ao buscar folgas' });
  }
});

// Cadastrar folga com validação estrita de escopo
router.post('/', requireMutation, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const {
      employee_id,
      date,
      type = 'dsr',
      status = 'confirmada',
      notes = ''
    } = req.body;

    if (!employee_id || !date) {
      return res.status(400).json({ error: 'Colaborador e Data são obrigatórios.' });
    }

    const empId = Number(employee_id);
    const emp: any = db.prepare(`SELECT name, department, department_id FROM employees WHERE id = ?`).get(empId);
    if (!emp) {
      return res.status(404).json({ error: 'Colaborador não encontrado.' });
    }

    // REGRA DE SEGURANÇA: Bloqueia agendamento de folga para colaborador fora do escopo
    if (user.role !== 'ADMIN' && !user.departmentIds.includes(emp.department_id)) {
      return res.status(403).json({ error: 'Acesso negado. Você não pode programar folgas para colaboradores deste setor.' });
    }

    const conflict = checkDayOffConflict(empId, date);
    if (conflict.hasConflict) {
      return res.status(400).json({
        error: conflict.message,
        code: conflict.code
      });
    }

    const insert = db.prepare(`
      INSERT INTO days_off (employee_id, date, type, status, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insert.run(empId, date, type, status, notes || null);
    const newId = Number(result.lastInsertRowid);

    // Sincroniza escala
    const schedExisting: any = db.prepare(`SELECT id FROM work_schedules WHERE employee_id = ? AND date = ?`).get(empId, date);
    if (schedExisting) {
      db.prepare(`UPDATE work_schedules SET status = 'folga' WHERE id = ?`).run(schedExisting.id);
    } else {
      db.prepare(`INSERT INTO work_schedules (employee_id, date, status, notes) VALUES (?, ?, 'folga', 'Folga agendada')`).run(empId, date);
    }

    const typeNames: Record<string, string> = {
      dsr: 'Descanso Semanal (DSR)',
      folga_compensatoria: 'Folga Compensatória',
      ferias: 'Férias',
      ausencia_justificada: 'Ausência Justificada',
      afastamento: 'Afastamento',
      outro: 'Outro'
    };
    const typeLabel = typeNames[type] || type;

    recordAuditLog({
      employeeId: empId,
      userId: user.id,
      userName: user.name,
      action: 'CRIOU_FOLGA',
      entity: 'days_off',
      entityId: newId,
      departmentId: emp.department_id,
      newValue: `${date} (${typeLabel})`,
      details: `${user.name} agendou folga para ${emp.name} em ${date} [${typeLabel}].`
    });

    res.status(201).json({
      id: newId,
      message: 'Folga agendada com sucesso',
      warning: conflict.warning || null
    });
  } catch (error: any) {
    console.error('Erro ao agendar folga:', error);
    res.status(500).json({ error: 'Erro ao agendar folga' });
  }
});

// Atualizar folga com validação estrita de escopo
router.put('/:id', requireMutation, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const id = parseInt(req.params.id, 10);
    const existing: any = db.prepare(`
      SELECT d.*, e.name as employee_name, e.department_id
      FROM days_off d
      JOIN employees e ON e.id = d.employee_id
      WHERE d.id = ?
    `).get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Folga não encontrada' });
    }

    // REGRA DE SEGURANÇA: Se o colaborador for de setor fora do escopo, retorna 403
    if (user.role !== 'ADMIN' && !user.departmentIds.includes(existing.department_id)) {
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para alterar folgas deste setor.' });
    }

    const { date, type, status, notes } = req.body;
    const targetDate = date || existing.date;

    if (date && date !== existing.date) {
      const conflict = checkDayOffConflict(existing.employee_id, date);
      if (conflict.hasConflict) {
        return res.status(400).json({ error: conflict.message });
      }
    }

    db.prepare(`
      UPDATE days_off SET
        date = ?,
        type = ?,
        status = ?,
        notes = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      targetDate,
      type || existing.type,
      status || existing.status,
      notes !== undefined ? notes : existing.notes,
      id
    );

    recordAuditLog({
      employeeId: existing.employee_id,
      userId: user.id,
      userName: user.name,
      action: 'ALTEROU_FOLGA',
      entity: 'days_off',
      entityId: id,
      departmentId: existing.department_id,
      oldValue: `${existing.date} (${existing.type})`,
      newValue: `${targetDate} (${type || existing.type})`,
      details: `${user.name} alterou a folga de ${existing.employee_name} de ${existing.date} para ${targetDate}.`
    });

    res.json({ message: 'Folga atualizada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar folga:', error);
    res.status(500).json({ error: 'Erro ao atualizar folga' });
  }
});

// Excluir folga com validação estrita de escopo
router.delete('/:id', requireMutation, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const id = parseInt(req.params.id, 10);
    const existing: any = db.prepare(`
      SELECT d.*, e.name as employee_name, e.department_id
      FROM days_off d
      JOIN employees e ON e.id = d.employee_id
      WHERE d.id = ?
    `).get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Folga não encontrada' });
    }

    // REGRA DE SEGURANÇA: Bloqueia exclusão de folga fora do escopo
    if (user.role !== 'ADMIN' && !user.departmentIds.includes(existing.department_id)) {
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para remover folgas deste setor.' });
    }

    // Reverte escala
    db.prepare(`
      UPDATE work_schedules SET status = 'trabalho'
      WHERE employee_id = ? AND date = ? AND status = 'folga'
    `).run(existing.employee_id, existing.date);

    recordAuditLog({
      employeeId: existing.employee_id,
      userId: user.id,
      userName: user.name,
      action: 'EXCLUIU_FOLGA',
      entity: 'days_off',
      entityId: id,
      departmentId: existing.department_id,
      oldValue: `${existing.date} (${existing.type})`,
      details: `${user.name} removeu a folga de ${existing.employee_name} na data ${existing.date}.`
    });

    db.prepare(`DELETE FROM days_off WHERE id = ?`).run(id);

    res.json({ message: 'Folga excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir folga:', error);
    res.status(500).json({ error: 'Erro ao excluir folga' });
  }
});

// Agendamento em lote (Batch) com verificação de escopo
router.post('/batch', requireMutation, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Lista de folgas vazia ou inválida.' });
    }

    // Valida todos os colaboradores contra o escopo antes de inserir
    if (user.role !== 'ADMIN') {
      for (const item of items) {
        const emp: any = db.prepare(`SELECT department_id FROM employees WHERE id = ?`).get(item.employee_id);
        if (!emp || !user.departmentIds.includes(emp.department_id)) {
          return res.status(403).json({ error: `Acesso negado. O colaborador ID ${item.employee_id} não pertence aos seus setores autorizados.` });
        }
      }
    }

    let insertedCount = 0;
    const errors: string[] = [];

    items.forEach((item: any) => {
      const emp: any = db.prepare(`SELECT name, department_id FROM employees WHERE id = ?`).get(item.employee_id);
      if (!emp) {
        errors.push(`Colaborador ID ${item.employee_id} não encontrado.`);
        return;
      }

      const conflict = checkDayOffConflict(item.employee_id, item.date);
      if (conflict.hasConflict) {
        errors.push(`${emp.name}: ${conflict.message}`);
        return;
      }

      const insert = db.prepare(`
        INSERT INTO days_off (employee_id, date, type, status, notes)
        VALUES (?, ?, ?, 'confirmada', ?)
      `);
      const result = insert.run(item.employee_id, item.date, item.type || 'dsr', item.notes || null);
      const newOffId = Number(result.lastInsertRowid);
      insertedCount++;

      recordAuditLog({
        employeeId: item.employee_id,
        userId: user.id,
        userName: user.name,
        action: 'CRIOU_FOLGA',
        entity: 'days_off',
        entityId: newOffId,
        departmentId: emp.department_id,
        newValue: `${item.date} (${item.type || 'dsr'})`,
        details: `${user.name} agendou folga em lote para ${emp.name} em ${item.date}.`
      });
    });

    res.json({
      success: true,
      insertedCount,
      errors
    });
  } catch (error: any) {
    console.error('Erro no agendamento em lote:', error);
    res.status(500).json({ error: 'Erro no agendamento em lote de folgas' });
  }
});

export default router;
