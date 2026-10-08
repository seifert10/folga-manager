import { Router } from 'express';
import db from '../db/connection';
import { requireAuth, AuthRequest } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

// Buscar notificações ativas filtradas por escopo
router.get('/', (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let sql = `
      SELECT * FROM notifications
      WHERE 1=1
    `;
    const params: any[] = [];

    if (user.role !== 'ADMIN') {
      if (user.departmentIds.length === 0) {
        return res.json({ notifications: [], unreadCount: 0 });
      }
      const placeholders = user.departmentIds.map(() => '?').join(',');
      sql += ` AND (department_id IS NULL OR department_id IN (${placeholders}))`;
      params.push(...user.departmentIds);
    }

    sql += ` ORDER BY is_read ASC, created_at DESC LIMIT 20`;
    const notifications = db.prepare(sql).all(...params);

    let countSql = `SELECT count(*) as total FROM notifications WHERE is_read = 0`;
    const countParams: any[] = [];
    if (user.role !== 'ADMIN') {
      const placeholders = user.departmentIds.map(() => '?').join(',');
      countSql += ` AND (department_id IS NULL OR department_id IN (${placeholders}))`;
      countParams.push(...user.departmentIds);
    }
    const unreadCount: any = db.prepare(countSql).get(...countParams);

    res.json({
      notifications,
      unreadCount: unreadCount.total || 0
    });
  } catch (error: any) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// Marcar notificação individual como lida
router.put('/:id/read', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ?`).run(id);
    res.json({ message: 'Notificação marcada como lida' });
  } catch (error: any) {
    console.error('Erro ao atualizar notificação:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação' });
  }
});

// Marcar todas como lidas
router.put('/read-all', (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    if (user.role === 'ADMIN') {
      db.prepare(`UPDATE notifications SET is_read = 1 WHERE is_read = 0`).run();
    } else if (user.departmentIds.length > 0) {
      const placeholders = user.departmentIds.map(() => '?').join(',');
      db.prepare(`
        UPDATE notifications SET is_read = 1
        WHERE is_read = 0 AND (department_id IS NULL OR department_id IN (${placeholders}))
      `).run(...user.departmentIds);
    }
    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error: any) {
    console.error('Erro ao marcar todas notificações:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificações' });
  }
});

export default router;
