import { Router } from 'express';
import db from '../db/connection';
import { requireAuth, requireRole, AuthRequest, recordAuditLog } from '../middlewares/auth';

const router = Router();

// Todas as rotas de departamentos exigem autenticação
router.use(requireAuth);

// Listar departamentos
// ADMIN visualiza todos (incluindo inativos e contagem de funcionários)
// MANAGER/VIEWER visualizam os setores ativos de seu escopo
router.get('/', (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    let departments: any[] = [];

    if (user.role === 'ADMIN') {
      departments = db.prepare(`
        SELECT d.*, count(e.id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id
        GROUP BY d.id
        ORDER BY d.name ASC
      `).all() as any[];
    } else {
      // MANAGER / VIEWER vê apenas seus setores autorizados
      departments = db.prepare(`
        SELECT d.*, count(e.id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id
        WHERE d.id IN (${user.departmentIds.length > 0 ? user.departmentIds.join(',') : '0'}) AND d.active = 1
        GROUP BY d.id
        ORDER BY d.name ASC
      `).all() as any[];
    }

    res.json(departments);
  } catch (error: any) {
    console.error('Erro ao listar departamentos:', error);
    res.status(500).json({ error: 'Erro ao carregar setores' });
  }
});

// Cadastrar novo setor (Exclusivo ADMIN)
router.post('/', requireRole('ADMIN'), (req: AuthRequest, res) => {
  try {
    const { name, active = 1 } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'O nome do setor é obrigatório.' });
    }

    const cleanName = String(name).trim();
    const existing = db.prepare(`SELECT id FROM departments WHERE lower(name) = ?`).get(cleanName.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Já existe um setor cadastrado com este nome.' });
    }

    const insert = db.prepare(`
      INSERT INTO departments (name, active)
      VALUES (?, ?)
    `);

    const result = insert.run(cleanName, active ? 1 : 0);
    const newDeptId = Number(result.lastInsertRowid);

    recordAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'CRIOU_SETOR',
      entity: 'department',
      entityId: newDeptId,
      departmentId: newDeptId,
      details: `Administrador criou o setor "${cleanName}".`
    });

    res.status(201).json({
      id: newDeptId,
      name: cleanName,
      active: active ? 1 : 0,
      message: 'Setor cadastrado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao criar setor:', error);
    res.status(500).json({ error: 'Erro ao cadastrar novo setor' });
  }
});

// Atualizar setor (Exclusivo ADMIN)
router.put('/:id', requireRole('ADMIN'), (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing: any = db.prepare(`SELECT * FROM departments WHERE id = ?`).get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Setor não encontrado' });
    }

    const { name, active } = req.body;
    const newName = name !== undefined ? String(name).trim() : existing.name;
    const newActive = active !== undefined ? (active ? 1 : 0) : existing.active;

    if (name && name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = db.prepare(`SELECT id FROM departments WHERE lower(name) = ? AND id != ?`).get(newName.toLowerCase(), id);
      if (duplicate) {
        return res.status(400).json({ error: 'Outro setor já utiliza este nome.' });
      }
    }

    db.prepare(`
      UPDATE departments SET
        name = ?,
        active = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(newName, newActive, id);

    recordAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'ATUALIZOU_SETOR',
      entity: 'department',
      entityId: id,
      departmentId: id,
      oldValue: `${existing.name} (Ativo: ${existing.active})`,
      newValue: `${newName} (Ativo: ${newActive})`,
      details: `Administrador atualizou os dados do setor "${existing.name}".`
    });

    res.json({ message: 'Setor atualizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar setor:', error);
    res.status(500).json({ error: 'Erro ao atualizar setor' });
  }
});

// Desativar setor (Desativação lógica para preservar integridade histórica)
router.delete('/:id', requireRole('ADMIN'), (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing: any = db.prepare(`SELECT * FROM departments WHERE id = ?`).get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Setor não encontrado' });
    }

    // Desativação lógica obrigatória conforme regra 21
    db.prepare(`
      UPDATE departments SET active = 0, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(id);

    recordAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'DESATIVOU_SETOR',
      entity: 'department',
      entityId: id,
      departmentId: id,
      details: `Administrador desativou o setor "${existing.name}".`
    });

    res.json({ message: 'Setor desativado com sucesso (preservando histórico)' });
  } catch (error: any) {
    console.error('Erro ao desativar setor:', error);
    res.status(500).json({ error: 'Erro ao desativar setor' });
  }
});

export default router;
