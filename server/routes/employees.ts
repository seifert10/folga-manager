import { Router } from 'express';
import db from '../db/connection';
import { isValidCPF, formatCPF } from '../utils/cpf';
import { calculateEmployeeStatus, formatYMD } from '../services/dsrRules';
import { requireAuth, requireMutation, AuthRequest, recordAuditLog, hasDepartmentAccess, hasEmployeeAccess } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

// Listar funcionários com filtragem estrita por escopo de setores
router.get('/', (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { search, department, status, workSchedule } = req.query;

    let sql = `
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Isolamento por escopo de setor (ADMIN tem acesso global; MANAGER e VIEWER restritos aos seus setores)
    if (user.role !== 'ADMIN') {
      if (user.departmentIds.length === 0) {
        return res.json([]);
      }
      const placeholders = user.departmentIds.map(() => '?').join(',');
      sql += ` AND e.department_id IN (${placeholders})`;
      params.push(...user.departmentIds);
    }

    if (search) {
      sql += ` AND (e.name LIKE ? OR e.cpf LIKE ? OR e.position LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (department) {
      sql += ` AND (e.department = ? OR d.name = ?)`;
      params.push(department, department);
    }
    if (status) {
      sql += ` AND e.status = ?`;
      params.push(status);
    }
    if (workSchedule) {
      sql += ` AND e.work_schedule_type = ?`;
      params.push(workSchedule);
    }

    sql += ` ORDER BY e.name ASC`;
    const employees = db.prepare(sql).all(...params) as any[];

    const todayStr = formatYMD(new Date());
    const enriched = employees.map(emp => {
      const calc = calculateEmployeeStatus(emp, todayStr);
      return {
        ...emp,
        department: emp.department_name || emp.department,
        cpfFormatted: formatCPF(emp.cpf),
        lastDayOff: calc.lastDayOff,
        nextDayOff: calc.nextDayOff,
        daysSinceLastDayOff: calc.daysSinceLastDayOff,
        daysUntilNextDayOff: calc.daysUntilNextDayOff,
        smartStatus: calc.smartStatus,
        statusLabel: calc.statusLabel,
        alertMessage: calc.alertMessage,
        isWorkingToday: calc.isWorkingToday,
        isOffToday: calc.isOffToday
      };
    });

    res.json(enriched);
  } catch (error: any) {
    console.error('Erro ao listar funcionários:', error);
    res.status(500).json({ error: 'Erro ao buscar funcionários' });
  }
});

// Detalhes completos do funcionário com bloqueio estrito 403 Forbidden fora do escopo
router.get('/:id', (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const id = parseInt(req.params.id, 10);
    const employee: any = db.prepare(`
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.id = ?
    `).get(id);

    if (!employee) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    // REGRA CRÍTICA DE SEGURANÇA: Se o funcionário estiver fora do escopo do usuário, retornar 403 Forbidden
    if (user.role !== 'ADMIN' && !user.departmentIds.includes(employee.department_id)) {
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para visualizar colaboradores deste setor.' });
    }

    const todayStr = formatYMD(new Date());
    const calc = calculateEmployeeStatus(employee, todayStr);

    const pastDaysOff = db.prepare(`
      SELECT * FROM days_off
      WHERE employee_id = ? AND date <= ?
      ORDER BY date DESC
      LIMIT 20
    `).all(id, todayStr) as any[];

    const futureDaysOff = db.prepare(`
      SELECT * FROM days_off
      WHERE employee_id = ? AND date > ?
      ORDER BY date ASC
      LIMIT 20
    `).all(id, todayStr) as any[];

    const auditTrail = db.prepare(`
      SELECT * FROM audit_logs
      WHERE employee_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).all(id) as any[];

    const currentMonthPrefix = todayStr.substring(0, 7);
    const daysOffThisMonth: any = db.prepare(`
      SELECT count(*) as total FROM days_off
      WHERE employee_id = ? AND date LIKE ?
    `).get(id, `${currentMonthPrefix}%`);

    const daysWorkedThisMonth: any = db.prepare(`
      SELECT count(*) as total FROM work_schedules
      WHERE employee_id = ? AND date LIKE ? AND status = 'trabalho'
    `).get(id, `${currentMonthPrefix}%`);

    res.json({
      ...employee,
      department: employee.department_name || employee.department,
      cpfFormatted: formatCPF(employee.cpf),
      calc,
      pastDaysOff,
      futureDaysOff,
      auditTrail,
      metrics: {
        daysOffThisMonth: daysOffThisMonth.total || 0,
        daysWorkedThisMonth: daysWorkedThisMonth.total || 0,
        lastDayOff: calc.lastDayOff,
        nextDayOff: calc.nextDayOff,
        daysSinceLastDayOff: calc.daysSinceLastDayOff
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar detalhes do funcionário:', error);
    res.status(500).json({ error: 'Erro ao carregar perfil do funcionário' });
  }
});

// Cadastrar novo funcionário com verificação de escopo e bloqueio de VIEWER
router.post('/', requireMutation, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const {
      name,
      cpf,
      position,
      department,
      department_id,
      hire_date,
      work_regime = 'CLT',
      weekly_hours = 44,
      work_schedule_type = '6x1',
      avatar_url,
      status = 'ativo'
    } = req.body;

    if (!name || !cpf || !position || (!department && !department_id) || !hire_date) {
      return res.status(400).json({ error: 'Campos obrigatórios: Nome, CPF, Cargo, Setor e Data de Admissão.' });
    }

    let resolvedDeptId: number | null = department_id ? Number(department_id) : null;
    let resolvedDeptName = department ? String(department).trim() : '';

    if (resolvedDeptId) {
      const deptRow: any = db.prepare(`SELECT name FROM departments WHERE id = ?`).get(resolvedDeptId);
      if (deptRow) resolvedDeptName = deptRow.name;
    } else if (resolvedDeptName) {
      const deptRow: any = db.prepare(`SELECT id FROM departments WHERE lower(name) = ?`).get(resolvedDeptName.toLowerCase());
      if (deptRow) resolvedDeptId = deptRow.id;
    }

    if (!resolvedDeptId) {
      // Cria ou vincula a setor padrão se não existir
      const defaultDept: any = db.prepare(`SELECT id, name FROM departments WHERE active = 1 ORDER BY id ASC LIMIT 1`).get();
      resolvedDeptId = defaultDept ? defaultDept.id : 1;
      resolvedDeptName = resolvedDeptName || (defaultDept ? defaultDept.name : 'Geral');
    }

    const finalDeptId: number = resolvedDeptId!;

    // REGRA DE SEGURANÇA: Gestor só pode criar colaborador em setores autorizados
    if (user.role !== 'ADMIN' && !user.departmentIds.includes(finalDeptId)) {
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para cadastrar colaboradores neste setor.' });
    }

    const cleanCPF = String(cpf).replace(/\D/g, '');
    if (!isValidCPF(cleanCPF)) {
      return res.status(400).json({ error: 'CPF inválido. Verifique os dígitos verificadores informados.' });
    }

    const existing = db.prepare(`SELECT id FROM employees WHERE cpf = ?`).get(cleanCPF);
    if (existing) {
      return res.status(400).json({ error: 'Já existe um funcionário cadastrado com este CPF.' });
    }

    const insert = db.prepare(`
      INSERT INTO employees (name, cpf, position, department, department_id, hire_date, work_regime, weekly_hours, work_schedule_type, avatar_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      name.trim(),
      cleanCPF,
      position.trim(),
      resolvedDeptName,
      resolvedDeptId,
      hire_date,
      work_regime,
      Number(weekly_hours),
      work_schedule_type,
      avatar_url || null,
      status
    );

    const newId = Number(result.lastInsertRowid);

    // Registra na auditoria com vínculo do gestor e do setor
    recordAuditLog({
      employeeId: newId,
      userId: user.id,
      userName: user.name,
      action: 'CRIOU_FUNCIONARIO',
      entity: 'employee',
      entityId: newId,
      departmentId: resolvedDeptId,
      newValue: name,
      details: `${user.name} cadastrou colaborador ${name} no cargo ${position} (${resolvedDeptName}).`
    });

    res.status(201).json({
      id: newId,
      message: 'Funcionário cadastrado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao cadastrar funcionário:', error);
    res.status(500).json({ error: 'Erro ao cadastrar funcionário' });
  }
});

// Atualizar funcionário com validação de escopo
router.put('/:id', requireMutation, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const id = parseInt(req.params.id, 10);
    const existing: any = db.prepare(`SELECT * FROM employees WHERE id = ?`).get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    // REGRA DE SEGURANÇA: Bloqueia tentativa de editar funcionário fora do escopo
    if (user.role !== 'ADMIN' && !user.departmentIds.includes(existing.department_id)) {
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para alterar colaboradores deste setor.' });
    }

    const {
      name,
      cpf,
      position,
      department,
      department_id,
      hire_date,
      work_regime,
      weekly_hours,
      work_schedule_type,
      avatar_url,
      status
    } = req.body;

    let targetDeptId = existing.department_id;
    let targetDeptName = existing.department;

    if (department_id !== undefined) {
      targetDeptId = Number(department_id);
      const dRow: any = db.prepare(`SELECT name FROM departments WHERE id = ?`).get(targetDeptId);
      if (dRow) targetDeptName = dRow.name;
    } else if (department !== undefined) {
      targetDeptName = String(department).trim();
      const dRow: any = db.prepare(`SELECT id FROM departments WHERE lower(name) = ?`).get(targetDeptName.toLowerCase());
      if (dRow) targetDeptId = dRow.id;
    }

    // Não permite mover o funcionário para um setor não autorizado
    if (user.role !== 'ADMIN' && !user.departmentIds.includes(targetDeptId)) {
      return res.status(403).json({ error: 'Acesso negado. Você não pode transferir um colaborador para um setor não autorizado.' });
    }

    let cleanCPF = existing.cpf;
    if (cpf) {
      cleanCPF = String(cpf).replace(/\D/g, '');
      if (!isValidCPF(cleanCPF)) {
        return res.status(400).json({ error: 'CPF inválido.' });
      }
      const duplicate = db.prepare(`SELECT id FROM employees WHERE cpf = ? AND id != ?`).get(cleanCPF, id);
      if (duplicate) {
        return res.status(400).json({ error: 'Outro funcionário já utiliza este CPF.' });
      }
    }

    db.prepare(`
      UPDATE employees SET
        name = ?,
        cpf = ?,
        position = ?,
        department = ?,
        department_id = ?,
        hire_date = ?,
        work_regime = ?,
        weekly_hours = ?,
        work_schedule_type = ?,
        avatar_url = ?,
        status = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      name !== undefined ? name.trim() : existing.name,
      cleanCPF,
      position !== undefined ? position.trim() : existing.position,
      targetDeptName,
      targetDeptId,
      hire_date || existing.hire_date,
      work_regime || existing.work_regime,
      weekly_hours !== undefined ? Number(weekly_hours) : existing.weekly_hours,
      work_schedule_type || existing.work_schedule_type,
      avatar_url !== undefined ? avatar_url : existing.avatar_url,
      status || existing.status,
      id
    );

    recordAuditLog({
      employeeId: id,
      userId: user.id,
      userName: user.name,
      action: 'ATUALIZOU_FUNCIONARIO',
      entity: 'employee',
      entityId: id,
      departmentId: targetDeptId,
      oldValue: `${existing.name} (${existing.position})`,
      newValue: `${name || existing.name} (${position || existing.position})`,
      details: `${user.name} atualizou os dados cadastrais do colaborador.`
    });

    res.json({ message: 'Funcionário atualizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar funcionário:', error);
    res.status(500).json({ error: 'Erro ao atualizar funcionário' });
  }
});

// Excluir funcionário com validação de escopo
router.delete('/:id', requireMutation, (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const id = parseInt(req.params.id, 10);
    const existing: any = db.prepare(`SELECT * FROM employees WHERE id = ?`).get(id);

    if (!existing) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    // REGRA DE SEGURANÇA: Bloqueia exclusão de funcionário fora do escopo
    if (user.role !== 'ADMIN' && !user.departmentIds.includes(existing.department_id)) {
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para excluir colaboradores deste setor.' });
    }

    recordAuditLog({
      employeeId: id,
      userId: user.id,
      userName: user.name,
      action: 'EXCLUIU_FUNCIONARIO',
      entity: 'employee',
      entityId: id,
      departmentId: existing.department_id,
      oldValue: existing.name,
      details: `${user.name} excluiu o colaborador ${existing.name} (${existing.position}).`
    });

    db.prepare(`DELETE FROM employees WHERE id = ?`).run(id);

    res.json({ message: 'Funcionário excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir funcionário:', error);
    res.status(500).json({ error: 'Erro ao excluir funcionário' });
  }
});

export default router;
