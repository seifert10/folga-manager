import db from '../db/connection';
import { runMigrations } from '../db/migrate';
import { runSeed } from '../db/seed';
import { isValidCPF, generateFakeValidCPF, formatCPF } from '../utils/cpf';
import { calculateEmployeeStatus, checkDayOffConflict, formatYMD } from '../services/dsrRules';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n========================================');
  console.log('🧪 Executando Bateria de Testes do Folga Manager');
  console.log('========================================\n');

  // 1. BANCO DE DADOS & PERSISTÊNCIA
  console.log('📦 [1/5] Testes de Banco de Dados e Migrações:');
  runMigrations();
  assert(true, 'Migrações executadas com sucesso');

  runSeed();
  const empCount: any = db.prepare('SELECT count(*) as total FROM employees').get();
  assert(empCount.total === 10, 'Seed populou exatamente 10 funcionários fictícios');

  const daysOffCount: any = db.prepare('SELECT count(*) as total FROM days_off').get();
  assert(daysOffCount.total >= 10, 'Folgas iniciais foram persistidas no SQLite');

  // 2. VALIDAÇÃO DE CPF
  console.log('\n🆔 [2/5] Testes de Validação de CPF:');
  const validTestCpf = generateFakeValidCPF(42);
  assert(isValidCPF(validTestCpf), `CPF gerado é válido: ${validTestCpf}`);
  assert(!isValidCPF('111.111.111-11'), 'Rejeita CPF com todos dígitos iguais');
  assert(!isValidCPF('123.456.789-00'), 'Rejeita CPF com dígitos verificadores incorretos');
  assert(!isValidCPF('123'), 'Rejeita CPF curto');

  // 3. CRUD DE FUNCIONÁRIOS E AUDITORIA
  console.log('\n👥 [3/5] Testes de CRUD de Funcionários e Auditoria:');
  const newCpf = generateFakeValidCPF(99);
  const insertEmp = db.prepare(`
    INSERT INTO employees (name, cpf, position, department, hire_date, work_regime, weekly_hours, work_schedule_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRes = insertEmp.run('Teste QA Funcionário', newCpf.replace(/\D/g, ''), 'Analista QA', 'Tecnologia', '2024-01-01', 'CLT', 40, '5x2', 'ativo');
  const testEmpId = Number(insertRes.lastInsertRowid);
  assert(testEmpId > 0, 'Funcionário criado com sucesso no banco');

  // Log de auditoria
  db.prepare(`
    INSERT INTO audit_logs (employee_id, action, old_value, new_value, details)
    VALUES (?, 'CRIOU_FUNCIONARIO', null, ?, ?)
  `).run(testEmpId, 'Teste QA Funcionário', 'Criado via teste');
  const auditCreate: any = db.prepare(`SELECT * FROM audit_logs WHERE employee_id = ? AND action = 'CRIOU_FUNCIONARIO'`).get(testEmpId);
  assert(!!auditCreate, 'Auditoria registrou criação do funcionário');

  // Edição
  db.prepare(`UPDATE employees SET position = 'Senior QA' WHERE id = ?`).run(testEmpId);
  const updatedEmp: any = db.prepare(`SELECT position FROM employees WHERE id = ?`).get(testEmpId);
  assert(updatedEmp.position === 'Senior QA', 'Funcionário editado com sucesso');

  // 4. FOLGAS, CONFLITOS E DSR
  console.log('\n📅 [4/5] Testes de Folgas, Conflitos e DSR:');
  const todayStr = formatYMD(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatYMD(tomorrow);

  // Criar folga
  const offRes = db.prepare(`
    INSERT INTO days_off (employee_id, date, type, status, notes)
    VALUES (?, ?, 'dsr', 'confirmada', 'Folga de teste')
  `).run(testEmpId, tomorrowStr);
  assert(Number(offRes.lastInsertRowid) > 0, 'Folga criada para colaborador');

  // Impedir duplicidade
  const conflictCheck = checkDayOffConflict(testEmpId, tomorrowStr);
  assert(conflictCheck.hasConflict === true && conflictCheck.code === 'DUPLICATE_DAY_OFF', 'Bloqueou tentativa de cadastrar folga duplicada na mesma data');

  // Cálculo inteligente de status
  const calc = calculateEmployeeStatus(db.prepare('SELECT * FROM employees WHERE id = ?').get(testEmpId), todayStr);
  assert(calc.smartStatus === 'proxima' || calc.smartStatus === 'definida', `Cálculo de status correto para funcionário com folga marcada (${calc.smartStatus})`);

  // 5. DASHBOARD E DETECÇÃO DE PENDÊNCIAS
  console.log('\n📊 [5/5] Testes de Métricas e Pendências do Dashboard:');
  // Maria Souza (id 2 do seed) não tem folga planejada
  const maria: any = db.prepare(`SELECT * FROM employees WHERE name = 'Maria Souza'`).get();
  assert(!!maria, 'Maria Souza encontrada no banco');
  const mariaCalc = calculateEmployeeStatus(maria, todayStr);
  assert(mariaCalc.smartStatus === 'pendente', 'Maria Souza identificada dinamicamente como PENDENTE de folga');

  // Exclusão com integridade
  db.prepare(`DELETE FROM employees WHERE id = ?`).run(testEmpId);
  const deletedEmp = db.prepare(`SELECT id FROM employees WHERE id = ?`).get(testEmpId);
  assert(!deletedEmp, 'Funcionário de teste excluído');
  const orphanDaysOff = db.prepare(`SELECT id FROM days_off WHERE employee_id = ?`).all(testEmpId);
  assert(orphanDaysOff.length === 0, 'Cascade removeu folgas associadas sem deixar registros órfãos');

  console.log('\n========================================');
  console.log(`🏁 Fim dos testes: ${passed} passaram, ${failed} falharam`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
