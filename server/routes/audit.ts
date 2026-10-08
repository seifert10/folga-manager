import { Router } from 'express';
import db from '../db/connection';
import { requireAuth, AuthRequest } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

// Buscar histórico de auditoria com filtragem por escopo
router.get('/', (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { employeeId, action, limit = 100 } = req.query;

    let sql = `
      SELECT a.*, e.name as employee_name, coalesce(dept.name, e.department) as department, e.position
      FROM audit_logs a
      LEFT JOIN employees e ON e.id = a.employee_id
      LEFT JOIN departments dept ON dept.id = a.department_id OR dept.id = e.department_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Isolamento por escopo de setores
    if (user.role !== 'ADMIN') {
      if (user.departmentIds.length === 0) return res.json([]);
      const placeholders = user.departmentIds.map(() => '?').join(',');
      sql += ` AND (a.department_id IN (${placeholders}) OR (a.department_id IS NULL AND e.department_id IN (${placeholders})))`;
      params.push(...user.departmentIds, ...user.departmentIds);
    }

    if (employeeId) {
      sql += ` AND a.employee_id = ?`;
      params.push(employeeId);
    }
    if (action) {
      sql += ` AND a.action = ?`;
      params.push(action);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const logs = db.prepare(sql).all(...params);
    res.json(logs);
  } catch (error: any) {
    console.error('Erro ao buscar histórico de alterações:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de auditoria' });
  }
});

export default router;
