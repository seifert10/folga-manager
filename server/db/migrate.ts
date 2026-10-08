import db from './connection';

export function runMigrations() {
  console.log('🔄 Executando migrações do banco SQLite...');

  // 1. Criação das tabelas base e novas entidades (departamentos, usuários, sessões)
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MANAGER' CHECK(role IN ('ADMIN', 'MANAGER', 'VIEWER')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS user_departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      department_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
      UNIQUE(user_id, department_id)
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cpf TEXT UNIQUE NOT NULL,
      position TEXT NOT NULL,
      department TEXT NOT NULL,
      department_id INTEGER DEFAULT 1,
      hire_date TEXT NOT NULL,
      work_regime TEXT NOT NULL DEFAULT 'CLT',
      weekly_hours INTEGER NOT NULL DEFAULT 44,
      work_schedule_type TEXT NOT NULL DEFAULT '6x1',
      avatar_url TEXT,
      status TEXT NOT NULL DEFAULT 'ativo',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS days_off (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'dsr',
      status TEXT NOT NULL DEFAULT 'confirmada',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS work_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      shift TEXT NOT NULL DEFAULT 'integral',
      status TEXT NOT NULL DEFAULT 'trabalho',
      notes TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL DEFAULT 'employee',
      entity_id INTEGER,
      department_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      related_id INTEGER,
      department_id INTEGER,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );
  `);

  // 2. Migrações incrementais em bancos já existentes (adiciona colunas sem perder dados)
  try {
    const empColumns = db.prepare(`PRAGMA table_info(employees)`).all() as any[];
    const hasDeptId = empColumns.some(c => c.name === 'department_id' || c.name === 'departmentId');
    if (!hasDeptId) {
      db.exec(`ALTER TABLE employees ADD COLUMN department_id INTEGER;`);
      db.exec(`UPDATE employees SET department_id = 1 WHERE department_id IS NULL;`);
    }
  } catch (err: any) {
    console.error('Nota de migração employees:', err.message);
  }

  try {
    const auditColumns = db.prepare(`PRAGMA table_info(audit_logs)`).all() as any[];
    const colNames = auditColumns.map(c => c.name);
    if (!colNames.includes('user_id')) db.exec(`ALTER TABLE audit_logs ADD COLUMN user_id INTEGER;`);
    if (!colNames.includes('user_name')) db.exec(`ALTER TABLE audit_logs ADD COLUMN user_name TEXT;`);
    if (!colNames.includes('entity')) db.exec(`ALTER TABLE audit_logs ADD COLUMN entity TEXT DEFAULT 'employee';`);
    if (!colNames.includes('entity_id')) db.exec(`ALTER TABLE audit_logs ADD COLUMN entity_id INTEGER;`);
    if (!colNames.includes('department_id')) db.exec(`ALTER TABLE audit_logs ADD COLUMN department_id INTEGER;`);
  } catch (err: any) {
    console.error('Nota de migração audit_logs:', err.message);
  }

  try {
    const notifColumns = db.prepare(`PRAGMA table_info(notifications)`).all() as any[];
    const notifColNames = notifColumns.map(c => c.name);
    if (!notifColNames.includes('department_id')) db.exec(`ALTER TABLE notifications ADD COLUMN department_id INTEGER;`);
  } catch (err: any) {
    console.error('Nota de migração notifications:', err.message);
  }

  // 3. Índices de alta performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
    CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
    CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
    CREATE INDEX IF NOT EXISTS idx_user_departments_user ON user_departments(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_departments_dep ON user_departments(department_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_days_off_employee_date ON days_off(employee_id, date);
    CREATE INDEX IF NOT EXISTS idx_days_off_date ON days_off(date);
    CREATE INDEX IF NOT EXISTS idx_work_schedules_employee_date ON work_schedules(employee_id, date);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_department ON audit_logs(department_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_department ON notifications(department_id);
  `);

  console.log('✅ Migrações aplicadas com sucesso!');
}

if (process.argv[1]?.includes('migrate')) {
  runMigrations();
}
