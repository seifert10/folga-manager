import { Request, Response, NextFunction } from 'express';
import db from '../db/connection';

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  active: number;
  departments: { id: number; name: string }[];
  departmentIds: number[];
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Middleware que exige token de sessão válido.
 * Extrai o token do cabeçalho `Authorization: Bearer <token>`.
 * Retorna 401 Unauthorized se ausente, inválido ou expirado.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso não autorizado. Token de autenticação ausente.' });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({ error: 'Token de autenticação inválido.' });
    }

    const session = db.prepare(`
      SELECT s.token, s.expires_at, u.id, u.name, u.email, u.role, u.active
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ?
    `).get(token) as any;

    if (!session) {
      return res.status(401).json({ error: 'Sessão inválida ou não encontrada. Faça login novamente.' });
    }

    if (!session.active) {
      return res.status(401).json({ error: 'Usuário desativado pelo administrador.' });
    }

    if (new Date(session.expires_at).getTime() < Date.now()) {
      db.prepare(`DELETE FROM user_sessions WHERE token = ?`).run(token);
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }

    // Carrega setores autorizados
    let userDepts: { id: number; name: string }[] = [];
    if (session.role === 'ADMIN') {
      userDepts = db.prepare(`SELECT id, name FROM departments WHERE active = 1 ORDER BY name ASC`).all() as any[];
    } else {
      userDepts = db.prepare(`
        SELECT d.id, d.name
        FROM user_departments ud
        JOIN departments d ON d.id = ud.department_id
        WHERE ud.user_id = ? AND d.active = 1
        ORDER BY d.name ASC
      `).all(session.id) as any[];
    }

    req.user = {
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      active: session.active,
      departments: userDepts,
      departmentIds: userDepts.map(d => d.id)
    };

    next();
  } catch (error: any) {
    console.error('Erro no middleware requireAuth:', error);
    res.status(500).json({ error: 'Erro interno na validação de autenticação.' });
  }
}

/**
 * Middleware que restringe acesso a perfis específicos.
 * Retorna 403 Forbidden se o perfil não for permitido.
 */
export function requireRole(...allowedRoles: ('ADMIN' | 'MANAGER' | 'VIEWER')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso proibido. Seu perfil não tem permissão para esta ação.' });
    }
    next();
  };
}

/**
 * Middleware que bloqueia VIEWER em operações de escrita (POST, PUT, DELETE).
 * Retorna 403 Forbidden se o usuário for VIEWER.
 */
export function requireMutation(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  if (req.user.role === 'VIEWER') {
    return res.status(403).json({ error: 'Acesso proibido. Usuário somente leitura não pode realizar alterações.' });
  }
  next();
}

/**
 * Verifica se o usuário autenticado possui acesso ao setor informado.
 */
export function hasDepartmentAccess(user: AuthenticatedUser, departmentId: number | string): boolean {
  if (user.role === 'ADMIN') return true;
  return user.departmentIds.includes(Number(departmentId));
}

/**
 * Verifica se o usuário autenticado possui acesso ao funcionário informado.
 */
export function hasEmployeeAccess(user: AuthenticatedUser, employeeId: number | string): boolean {
  if (user.role === 'ADMIN') return true;
  const emp: any = db.prepare(`SELECT department_id FROM employees WHERE id = ?`).get(Number(employeeId));
  if (!emp) return false;
  return user.departmentIds.includes(emp.department_id);
}

/**
 * Registra evento de auditoria com vínculo de usuário e setor.
 */
export function recordAuditLog(params: {
  employeeId?: number | null;
  userId?: number | null;
  userName?: string | null;
  action: string;
  entity?: string;
  entityId?: number | null;
  departmentId?: number | null;
  oldValue?: string | null;
  newValue?: string | null;
  details?: string | null;
}) {
  try {
    let resolvedDeptId = params.departmentId || null;
    if (!resolvedDeptId && params.employeeId) {
      const emp: any = db.prepare(`SELECT department_id FROM employees WHERE id = ?`).get(params.employeeId);
      if (emp) resolvedDeptId = emp.department_id;
    }

    db.prepare(`
      INSERT INTO audit_logs (employee_id, user_id, user_name, action, entity, entity_id, department_id, old_value, new_value, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      params.employeeId || null,
      params.userId || null,
      params.userName || null,
      params.action,
      params.entity || 'employee',
      params.entityId || null,
      resolvedDeptId,
      params.oldValue || null,
      params.newValue || null,
      params.details || null
    );
  } catch (error: any) {
    console.error('Falha ao gravar log de auditoria:', error);
  }
}
