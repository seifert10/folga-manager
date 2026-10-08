import { Router } from 'express';
import db from '../db/connection';
import { verifyPassword, generateSessionToken } from '../utils/auth';
import { requireAuth, AuthRequest } from '../middlewares/auth';

const router = Router();

// Login de usuário
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user: any = db.prepare(`SELECT * FROM users WHERE lower(email) = ?`).get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique o e-mail e a senha informados.' });
    }

    if (!user.active) {
      return res.status(401).json({ error: 'Esta conta de usuário foi desativada pelo administrador.' });
    }

    const isValid = verifyPassword(String(password), user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique o e-mail e a senha informados.' });
    }

    // Gera token de sessão (7 dias de validade)
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO user_sessions (token, user_id, expires_at)
      VALUES (?, ?, ?)
    `).run(token, user.id, expiresAt);

    // Carrega setores autorizados
    let userDepts: { id: number; name: string }[] = [];
    if (user.role === 'ADMIN') {
      userDepts = db.prepare(`SELECT id, name FROM departments WHERE active = 1 ORDER BY name ASC`).all() as any[];
    } else {
      userDepts = db.prepare(`
        SELECT d.id, d.name
        FROM user_departments ud
        JOIN departments d ON d.id = ud.department_id
        WHERE ud.user_id = ? AND d.active = 1
        ORDER BY d.name ASC
      `).all(user.id) as any[];
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        departments: userDepts,
        departmentIds: userDepts.map(d => d.id)
      }
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Falha no processo de autenticação.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      db.prepare(`DELETE FROM user_sessions WHERE token = ?`).run(token);
    }
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error: any) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro ao processar logout' });
  }
});

// Dados do usuário logado
router.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
