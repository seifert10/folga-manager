import http from 'http';
import app from '../server/app';
import { runMigrations } from '../server/db/migrate';
import { runSeed } from '../server/db/seed';
import db from '../server/db/connection';
import { generateFakeValidCPF } from '../server/utils/cpf';

const AUTH_TEST_PORT = 4020;
const TIMEOUT_MS = 25000;

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function request(url: string, options: RequestInit = {}): Promise<{ status: number; data: any; headers: Headers }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'close',
        ...options.headers,
      },
      signal: controller.signal
    });

    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return {
      status: res.status,
      data,
      headers: res.headers
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runAuthTestSuite() {
  console.log('================================================================');
  console.log('🛡️  SUÍTE DE TESTES DE AUTENTICAÇÃO, RBAC E ISOLAMENTO DE ESCOPO');
  console.log('================================================================\n');

  console.log('[SETUP] Preparando banco de dados SQLite...');
  runMigrations();
  runSeed();

  const server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.listen(AUTH_TEST_PORT, () => {
      console.log(`✓ Servidor de testes ativo na porta ${AUTH_TEST_PORT}\n`);
      resolve();
    });
    server.on('error', reject);
  });

  const baseUrl = `http://localhost:${AUTH_TEST_PORT}/api`;

  try {
    // -------------------------------------------------------------
    // BLOCO 1: PROTEÇÃO DIRETA DA API (401 Unauthorized)
    // -------------------------------------------------------------
    console.log('🔒 [1/6] Testes de Proteção Direta da API HTTP:');

    const unauthEmp = await request(`${baseUrl}/employees`);
    assert(unauthEmp.status === 401, 'Bloqueia acesso a /api/employees sem token (401 Unauthorized)');

    const unauthDash = await request(`${baseUrl}/dashboard`);
    assert(unauthDash.status === 401, 'Bloqueia acesso a /api/dashboard sem token (401 Unauthorized)');

    const badToken = await request(`${baseUrl}/employees`, {
      headers: { Authorization: 'Bearer token-falso-ou-adulterado' }
    });
    assert(badToken.status === 401, 'Bloqueia acesso com token adulterado/inválido (401 Unauthorized)');

    const badLogin = await request(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@folgamanager.local', password: 'SenhaTotalmenteIncorreta' })
    });
    assert(badLogin.status === 401, 'Rejeita login com senha incorreta (401 Unauthorized)');

    // -------------------------------------------------------------
    // BLOCO 2: ADMIN — ACESSO GLOBAL E CRUD ADMINISTRATIVO
    // -------------------------------------------------------------
    console.log('\n👑 [2/6] Testes do Perfil ADMIN (Acesso Global):');

    const adminLogin = await request(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@folgamanager.local', password: 'AdminPassword123!' })
    });
    assert(adminLogin.status === 200 && !!adminLogin.data.token, 'Login de ADMIN realizado com sucesso');
    const adminToken = adminLogin.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    const adminEmp = await request(`${baseUrl}/employees`, { headers: adminHeaders });
    assert(adminEmp.status === 200 && adminEmp.data.length === 10, 'ADMIN visualiza todos os 10 colaboradores (todos os setores)');

    const adminDash = await request(`${baseUrl}/dashboard`, { headers: adminHeaders });
    assert(adminDash.status === 200 && adminDash.data.stats.totalEmployees === 10, 'Dashboard do ADMIN exibe total global de colaboradores');

    // CRUD de Setores (ADMIN)
    const newDeptRes = await request(`${baseUrl}/departments`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ name: 'Delivery Expresso' })
    });
    assert(newDeptRes.status === 201 && newDeptRes.data.id > 0, 'ADMIN cria novo setor (Delivery Expresso)');
    const createdDeptId = newDeptRes.data.id;

    const editDeptRes = await request(`${baseUrl}/departments/${createdDeptId}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ name: 'Delivery & Entregas' })
    });
    assert(editDeptRes.status === 200, 'ADMIN edita setor existente');

    // CRUD de Usuários (ADMIN)
    const newUserRes = await request(`${baseUrl}/users`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Gestor Teste Delivery',
        email: 'delivery@folgamanager.local',
        password: 'DeliveryPassword123!',
        role: 'MANAGER',
        departmentIds: [createdDeptId]
      })
    });
    assert(newUserRes.status === 201 && newUserRes.data.id > 0, 'ADMIN cria novo usuário gestor vinculado ao setor Delivery');
    const createdUserId = newUserRes.data.id;

    // Relatórios e Auditoria Globais
    const adminReports = await request(`${baseUrl}/reports/summary`, { headers: adminHeaders });
    assert(adminReports.status === 200 && adminReports.data.totalEmployees === 10, 'ADMIN acessa relatório global com todos os setores');

    const adminAudit = await request(`${baseUrl}/audit`, { headers: adminHeaders });
    assert(adminAudit.status === 200 && adminAudit.data.length > 0, 'ADMIN acessa auditoria completa do sistema');

    // -------------------------------------------------------------
    // BLOCO 3: MANAGER — COZINHA (ISOLAMENTO DE ESCOPO E 403 FORBIDDEN)
    // -------------------------------------------------------------
    console.log('\n👨‍🍳 [3/6] Testes do Perfil MANAGER (Cozinha):');

    const cozinhaLogin = await request(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'cozinha@folgamanager.local', password: 'CozinhaPassword123!' })
    });
    assert(cozinhaLogin.status === 200 && cozinhaLogin.data.user.role === 'MANAGER', 'Login do Gestor da Cozinha realizado');
    const cozinhaToken = cozinhaLogin.data.token;
    const cozinhaHeaders = { Authorization: `Bearer ${cozinhaToken}` };

    const cozinhaEmp = await request(`${baseUrl}/employees`, { headers: cozinhaHeaders });
    const allCozinha = cozinhaEmp.data.every((e: any) => e.department_id === 1 || e.department === 'Cozinha');
    assert(cozinhaEmp.status === 200 && cozinhaEmp.data.length === 3 && allCozinha, 'Gestor da Cozinha visualiza EXCLUSIVAMENTE funcionários da Cozinha (3 colaboradores)');

    const joaoCozinha = cozinhaEmp.data.find((e: any) => e.name === 'João Silva');
    assert(!!joaoCozinha, 'Acessa João Silva (Cozinha)');

    // Criação de folga na Cozinha
    const nextFriday = '2026-09-25';
    const folgaCozinhaRes = await request(`${baseUrl}/days-off`, {
      method: 'POST',
      headers: cozinhaHeaders,
      body: JSON.stringify({
        employee_id: joaoCozinha.id,
        date: nextFriday,
        type: 'dsr',
        notes: 'DSR agendado pelo gestor da Cozinha'
      })
    });
    assert(folgaCozinhaRes.status === 201, 'Gestor da Cozinha agenda folga para colaborador da Cozinha');
    const createdOffId = folgaCozinhaRes.data.id;

    // Alteração de folga na Cozinha
    const alterouFolgaRes = await request(`${baseUrl}/days-off/${createdOffId}`, {
      method: 'PUT',
      headers: cozinhaHeaders,
      body: JSON.stringify({ notes: 'Observação atualizada pelo gestor da Cozinha' })
    });
    assert(alterouFolgaRes.status === 200, 'Gestor da Cozinha altera folga da Cozinha');

    // 403 FORBIDDEN: Tentativa de acessar colaborador do Salão
    const mariaSalao: any = db.prepare(`SELECT id, department_id FROM employees WHERE name = 'Maria Souza'`).get();
    const probeSalao = await request(`${baseUrl}/employees/${mariaSalao.id}`, { headers: cozinhaHeaders });
    assert(probeSalao.status === 403, 'CRÍTICO: Bloqueia Gestor da Cozinha ao tentar acessar colaborador do Salão (403 Forbidden)');

    // 403 FORBIDDEN: Tentativa de alterar colaborador do Salão
    const putSalao = await request(`${baseUrl}/employees/${mariaSalao.id}`, {
      method: 'PUT',
      headers: cozinhaHeaders,
      body: JSON.stringify({ position: 'Supervisora Geral' })
    });
    assert(putSalao.status === 403, 'CRÍTICO: Bloqueia Gestor da Cozinha ao tentar alterar colaborador do Salão (403 Forbidden)');

    // 403 FORBIDDEN: Tentativa de agendar folga para colaborador do Salão
    const folgaSalao = await request(`${baseUrl}/days-off`, {
      method: 'POST',
      headers: cozinhaHeaders,
      body: JSON.stringify({
        employee_id: mariaSalao.id,
        date: '2026-09-30',
        type: 'dsr'
      })
    });
    assert(folgaSalao.status === 403, 'CRÍTICO: Bloqueia agendamento de folga para funcionário fora do escopo (403 Forbidden)');

    // 403 FORBIDDEN: Tentativa de exportar relatório do Salão
    const exportSalao = await request(`${baseUrl}/reports/export-csv?type=folgas&department=Salão`, {
      headers: cozinhaHeaders
    });
    assert(exportSalao.status === 403, 'CRÍTICO: Bloqueia exportação CSV de setor não autorizado (403 Forbidden)');

    // 403 FORBIDDEN: Tentativa de acessar rotas administrativas
    const probeUsers = await request(`${baseUrl}/users`, { headers: cozinhaHeaders });
    assert(probeUsers.status === 403, 'Bloqueia gestor de acessar lista administrativa de usuários (403 Forbidden)');

    // -------------------------------------------------------------
    // BLOCO 4: MANAGER — COZINHA + BAR (MÚLTIPLOS SETORES)
    // -------------------------------------------------------------
    console.log('\n🍻 [4/6] Testes do Perfil MANAGER (Cozinha + Bar):');

    const opsLogin = await request(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'operacoes@folgamanager.local', password: 'OperacoesPassword123!' })
    });
    assert(opsLogin.status === 200, 'Login do Gestor de Operações (Cozinha + Bar) realizado');
    const opsToken = opsLogin.data.token;
    const opsHeaders = { Authorization: `Bearer ${opsToken}` };

    const opsEmp = await request(`${baseUrl}/employees`, { headers: opsHeaders });
    const opsDepts = new Set(opsEmp.data.map((e: any) => e.department));
    assert(
      opsEmp.status === 200 &&
      opsDepts.has('Cozinha') &&
      opsDepts.has('Bar') &&
      !opsDepts.has('Salão') &&
      !opsDepts.has('Administrativo'),
      'Gestor de Operações acessa Cozinha e Bar (5 colaboradores), sem acesso a Salão ou Administrativo'
    );

    const probeSalaoOps = await request(`${baseUrl}/employees/${mariaSalao.id}`, { headers: opsHeaders });
    assert(probeSalaoOps.status === 403, 'Gestor de Cozinha+Bar bloqueado ao acessar colaborador do Salão (403 Forbidden)');

    // -------------------------------------------------------------
    // BLOCO 5: VIEWER — SOMENTE LEITURA
    // -------------------------------------------------------------
    console.log('\n👁️  [5/6] Testes do Perfil VIEWER (Somente Leitura):');

    const viewerLogin = await request(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'visualizacao@folgamanager.local', password: 'ViewerPassword123!' })
    });
    assert(viewerLogin.status === 200 && viewerLogin.data.user.role === 'VIEWER', 'Login do usuário VIEWER realizado');
    const viewerToken = viewerLogin.data.token;
    const viewerHeaders = { Authorization: `Bearer ${viewerToken}` };

    const viewerEmp = await request(`${baseUrl}/employees`, { headers: viewerHeaders });
    assert(viewerEmp.status === 200 && viewerEmp.data.length > 0, 'VIEWER visualiza lista de colaboradores com sucesso');

    const viewerCreateEmp = await request(`${baseUrl}/employees`, {
      method: 'POST',
      headers: viewerHeaders,
      body: JSON.stringify({
        name: 'Tentativa Hacker',
        cpf: generateFakeValidCPF(77),
        position: 'Teste',
        department_id: 1,
        hire_date: '2024-01-01'
      })
    });
    assert(viewerCreateEmp.status === 403, 'Bloqueia VIEWER de cadastrar colaborador (403 Forbidden)');

    const viewerCreateOff = await request(`${baseUrl}/days-off`, {
      method: 'POST',
      headers: viewerHeaders,
      body: JSON.stringify({
        employee_id: joaoCozinha.id,
        date: '2026-09-29',
        type: 'dsr'
      })
    });
    assert(viewerCreateOff.status === 403, 'Bloqueia VIEWER de criar folga (403 Forbidden)');

    const viewerSchedule = await request(`${baseUrl}/schedules`, {
      method: 'POST',
      headers: viewerHeaders,
      body: JSON.stringify({
        employee_id: joaoCozinha.id,
        date: '2026-09-29',
        shift: 'manha',
        status: 'trabalho'
      })
    });
    assert(viewerSchedule.status === 403, 'Bloqueia VIEWER de alterar escala (403 Forbidden)');

    // -------------------------------------------------------------
    // BLOCO 6: CENÁRIO E2E PRINCIPAL DO GESTOR CARLOS
    // -------------------------------------------------------------
    console.log('\n🎯 [6/6] Cenário E2E Principal — Jornada do Gestor Carlos (Cozinha):');

    // 1. Carlos faz login
    const carlosLogin = await request(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'cozinha@folgamanager.local', password: 'CozinhaPassword123!' })
    });
    assert(carlosLogin.status === 200, 'Passo 1: Carlos faz login');
    const cHeaders = { Authorization: `Bearer ${carlosLogin.data.token}` };

    // 2. Abre Dashboard e vê Cozinha
    const cDash = await request(`${baseUrl}/dashboard`, { headers: cHeaders });
    assert(cDash.data.stats.totalEmployees === 3, 'Passo 2: Carlos abre Dashboard e vê somente os 3 funcionários da Cozinha');

    // 3. Visualiza colaboradores da Cozinha
    const cEmps = await request(`${baseUrl}/employees`, { headers: cHeaders });
    assert(cEmps.data.length === 3, 'Passo 3: Lista de funcionários contém apenas Cozinha');

    // 4. Define folga para colaborador da Cozinha (Marcos Lima)
    const marcos = cEmps.data.find((e: any) => e.name.includes('Marcos'));
    const cOffRes = await request(`${baseUrl}/days-off`, {
      method: 'POST',
      headers: cHeaders,
      body: JSON.stringify({
        employee_id: marcos.id,
        date: '2026-09-28',
        type: 'dsr',
        notes: 'DSR definido por Carlos'
      })
    });
    assert(cOffRes.status === 201, 'Passo 4: Carlos agenda folga para Marcos Lima na Cozinha');

    // 5. Auditoria registra alteração com Carlos Silva e Setor Cozinha
    const cAudit = await request(`${baseUrl}/audit?limit=1`, { headers: cHeaders });
    assert(
      cAudit.data.length > 0 &&
      cAudit.data[0].user_name.includes('Carlos') &&
      cAudit.data[0].department_id === 1,
      'Passo 5: Auditoria registra alteração realizada por Carlos Silva no setor Cozinha'
    );

    // 6. Carlos tenta acessar colaborador do Salão -> 403
    const cAttack1 = await request(`${baseUrl}/employees/${mariaSalao.id}`, { headers: cHeaders });
    assert(cAttack1.status === 403, 'Passo 6: Carlos tenta acessar funcionário do Salão diretamente -> 403 Forbidden');

    // 7. Carlos tenta alterar folga do Salão -> 403
    const salaoOff: any = db.prepare(`SELECT d.id FROM days_off d JOIN employees e ON e.id = d.employee_id WHERE e.department_id = 2 LIMIT 1`).get();
    const cAttack2 = await request(`${baseUrl}/days-off/${salaoOff.id}`, {
      method: 'PUT',
      headers: cHeaders,
      body: JSON.stringify({ date: '2026-09-29' })
    });
    assert(cAttack2.status === 403, 'Passo 7: Carlos tenta alterar folga do Salão -> 403 Forbidden');

    // 8. Carlos tenta exportar relatório do Salão -> 403
    const cAttack3 = await request(`${baseUrl}/reports/export-csv?type=folgas&department=Salão`, { headers: cHeaders });
    assert(cAttack3.status === 403, 'Passo 8: Carlos tenta exportar relatório do Salão -> 403 Forbidden');

    // 9. Logout de Carlos
    const cLogout = await request(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: cHeaders
    });
    assert(cLogout.status === 200, 'Passo 9: Logout de Carlos realizado com sucesso');

    const cPostLogout = await request(`${baseUrl}/employees`, { headers: cHeaders });
    assert(cPostLogout.status === 401, 'Passo 9.1: Token de Carlos invalidado imediatamente após logout (401 Unauthorized)');

    // 10. Login como ADMIN
    const finalAdminLogin = await request(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@folgamanager.local', password: 'AdminPassword123!' })
    });
    const finalAdminHeaders = { Authorization: `Bearer ${finalAdminLogin.data.token}` };
    assert(finalAdminLogin.status === 200, 'Passo 10: Login como Administrador realizado');

    // 11. ADMIN visualiza todos os setores
    const finalAdminDash = await request(`${baseUrl}/dashboard`, { headers: finalAdminHeaders });
    assert(finalAdminDash.data.stats.totalEmployees === 10, 'Passo 11: ADMIN visualiza todos os setores e funcionários');

    // 12. ADMIN visualiza alteração feita por Carlos na auditoria global
    const finalAdminAudit = await request(`${baseUrl}/audit?limit=10`, { headers: finalAdminHeaders });
    const foundCarlosEvent = finalAdminAudit.data.some((l: any) => l.user_name && l.user_name.includes('Carlos'));
    assert(foundCarlosEvent, 'Passo 12: ADMIN visualiza alteração feita por Carlos na auditoria global');

    console.log('\n================================================================');
    console.log(`🏁 RESULTADO: ${passed} testes passaram com sucesso, ${failed} falharam.`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err: any) {
    console.error('\n❌ [TEST FATAL]:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runAuthTestSuite();
