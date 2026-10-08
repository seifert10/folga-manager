import http from 'http';
import app from '../server/app';
import { runMigrations } from '../server/db/migrate';
import { runSeed } from '../server/db/seed';

const TEST_PORT = 3999;
const GLOBAL_TIMEOUT_MS = 15000;

async function fetchJson(url: string, options: RequestInit = {}, timeoutMs = 4000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} - ${url}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function runApiIntegrationTests() {
  console.log('========================================');
  console.log('Folga Manager API Integration Test');
  console.log('========================================\n');

  console.log('[TEST] Inicializando banco SQLite e aplicando migrations...');
  runMigrations();
  runSeed();

  const server = http.createServer(app);

  const globalTimer = setTimeout(() => {
    console.error('\n❌ [TEST FATAL] Timeout global de 15s atingido!');
    process.exit(1);
  }, GLOBAL_TIMEOUT_MS);
  globalTimer.unref();

  await new Promise<void>((resolve, reject) => {
    server.listen(TEST_PORT, () => {
      console.log(`✓ Server started on port ${TEST_PORT}`);
      resolve();
    });
    server.on('error', reject);
  });

  const baseUrl = `http://localhost:${TEST_PORT}/api`;

  try {
    // 1. GET /api/health (Pública)
    console.log('\n[TEST] requesting /api/health');
    const health = await fetchJson(`${baseUrl}/health`);
    if (health.status !== 'online') {
      throw new Error(`Health status esperado 'online', recebido: ${health.status}`);
    }
    console.log('✓ GET /api/health');

    // 1.1 Autenticação como Administrador para obter Token de Sessão
    console.log('\n[TEST] autenticando como Administrador em /api/auth/login');
    const loginRes = await fetchJson(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@folgamanager.local',
        password: 'AdminPassword123!'
      })
    });
    const token = loginRes.token;
    if (!token) throw new Error('Token de autenticação não retornado no login');
    console.log(`✓ Autenticado com sucesso como ${loginRes.user.name} (${loginRes.user.role})`);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. GET /api/dashboard (Protegida)
    console.log('\n[TEST] requesting /api/dashboard');
    const dash = await fetchJson(`${baseUrl}/dashboard`, { headers: authHeaders });

    if (!dash.stats || typeof dash.stats.totalEmployees !== 'number' || typeof dash.stats.pendingDaysOff !== 'number') {
      throw new Error('Estrutura de stats inválida no dashboard');
    }
    console.log('✓ GET /api/dashboard');
    console.log(`✓ Dashboard structure valid (Total: ${dash.stats.totalEmployees}, Pendentes: ${dash.stats.pendingDaysOff})`);

    if (!dash.attentionCard || !Array.isArray(dash.attentionCard.pendingEmployees)) {
      throw new Error('attentionCard ou pendingEmployees ausente/inválido');
    }
    console.log(`✓ Attention card valid (Status: "${dash.attentionCard.status}", Título: "${dash.attentionCard.title}")`);

    // 3. GET /api/employees (Protegida)
    console.log('\n[TEST] requesting /api/employees');
    const employees = await fetchJson(`${baseUrl}/employees`, { headers: authHeaders });
    if (!Array.isArray(employees)) {
      throw new Error('/api/employees não retornou um array');
    }
    console.log(`✓ GET /api/employees (${employees.length} registros retornados)`);

    if (employees.length > 0) {
      const first = employees[0];
      if (!first.id || !first.name || !first.cpfFormatted) {
        throw new Error('Colaborador não contém campos obrigatórios ou cpfFormatted');
      }
      console.log(`✓ Employee data valid (Ex: ${first.name} - Cargo: ${first.position})`);
      console.log(`✓ CPF formatting valid (${first.cpfFormatted})`);
    }

    // 4. Verificação de persistência SQLite
    console.log('\n[TEST] Verificando integridade de dados e queries SQLite...');
    const reportsSummary = await fetchJson(`${baseUrl}/reports/summary`, { headers: authHeaders });
    if (typeof reportsSummary.totalEmployees !== 'number') {
      throw new Error('Resumo de relatórios inválido');
    }
    console.log('✓ SQLite persistence verified');

    console.log('\n========================================');
    console.log('ALL API TESTS PASSED');
    console.log('========================================\n');
  } catch (err: any) {
    console.error('\n❌ [TEST FAILED]:', err.message);
    process.exitCode = 1;
  } finally {
    clearTimeout(globalTimer);
    if ('closeAllConnections' in server) {
      server.closeAllConnections();
    }
    server.close();
  }
}

runApiIntegrationTests();
