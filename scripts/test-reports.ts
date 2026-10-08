import http from 'http';
import app from '../server/app';
import { runMigrations } from '../server/db/migrate';
import { runSeed } from '../server/db/seed';

const TEST_PORT = 4005;
const GLOBAL_TIMEOUT_MS = 30000;

// Timeout global de segurança
const globalTimer = setTimeout(() => {
  console.error('\n❌ [REPORT TEST TIMEOUT] Limite de 30s excedido!');
  process.exit(1);
}, GLOBAL_TIMEOUT_MS);
globalTimer.unref();

interface FetchResult {
  status: number;
  contentType: string;
  hasBom: boolean;
  text: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Connection': 'close',
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verifica presença física do Byte Order Mark UTF-8 (EF BB BF)
    const hasBom = buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
    const text = buffer.subarray(hasBom ? 3 : 0).toString('utf-8');

    return {
      status: response.status,
      contentType,
      hasBom,
      text,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runReportsTest() {
  console.log('========================================');
  console.log('Folga Manager - Reports API Test');
  console.log('========================================\n');

  console.log('[CSV TEST] Inicializando banco e aplicando seeds...');
  runMigrations();
  runSeed();

  const server = http.createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.listen(TEST_PORT, () => {
      console.log(`[CSV TEST] Starting server`);
      console.log(`✓ Server started on port ${TEST_PORT}`);
      resolve();
    });
    server.on('error', reject);
  });

  const baseUrl = `http://localhost:${TEST_PORT}/api`;

  try {
    // 1. Health check (público)
    console.log('[CSV TEST] Testing /api/health...');
    const health = await fetchWithTimeout(`${baseUrl}/health`);
    if (health.status !== 200) {
      throw new Error(`Health retornou status ${health.status}`);
    }
    console.log('✓ Health endpoint (OK)\n');

    // 1.1 Autenticação como Administrador
    console.log('[CSV TEST] Autenticando como Administrador em /api/auth/login...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@folgamanager.local', password: 'AdminPassword123!' })
    });
    const loginData = await loginRes.json();
    if (!loginData.token) throw new Error('Falha na autenticação do teste de relatórios');
    const authHeaders = { Authorization: `Bearer ${loginData.token}` };
    console.log('✓ Autenticado com sucesso\n');

    // 2. Testar Folgas CSV
    console.log('[CSV TEST] Testing folgas...');
    const folgasRes = await fetchWithTimeout(`${baseUrl}/reports/export-csv?type=folgas`, { headers: authHeaders });
    if (folgasRes.status !== 200) {
      throw new Error(`Folgas CSV retornou status ${folgasRes.status}`);
    }
    if (!folgasRes.contentType.includes('text/csv')) {
      throw new Error(`Content-Type incorreto: ${folgasRes.contentType}`);
    }
    if (!folgasRes.hasBom) {
      throw new Error('Folgas CSV não possui UTF-8 BOM binário (0xEF 0xBB 0xBF) no início');
    }
    const folgasFirstLine = folgasRes.text.split('\r\n')[0];
    if (!folgasFirstLine.includes('Colaborador') || !folgasFirstLine.includes('Data da Folga')) {
      throw new Error(`Cabeçalho de folgas inesperado: ${folgasFirstLine}`);
    }
    console.log('✓ Folgas CSV');
    console.log('  HTTP 200');
    console.log(`  Content-Type: ${folgasRes.contentType}`);
    console.log('  UTF-8 BOM: OK');
    console.log(`  Header: ${folgasFirstLine}\n`);

    // 3. Testar Pendências CSV
    console.log('[CSV TEST] Testing pendencias...');
    const pendenciasRes = await fetchWithTimeout(`${baseUrl}/reports/export-csv?type=pendencias`, { headers: authHeaders });
    if (pendenciasRes.status !== 200) {
      throw new Error(`Pendencias CSV retornou status ${pendenciasRes.status}`);
    }
    if (!pendenciasRes.contentType.includes('text/csv')) {
      throw new Error(`Content-Type incorreto: ${pendenciasRes.contentType}`);
    }
    if (!pendenciasRes.hasBom) {
      throw new Error('Pendencias CSV não possui UTF-8 BOM binário (0xEF 0xBB 0xBF) no início');
    }
    const pendenciasFirstLine = pendenciasRes.text.split('\r\n')[0];
    if (!pendenciasFirstLine.includes('ID Colaborador') || !pendenciasFirstLine.includes('Última Folga')) {
      throw new Error(`Cabeçalho de pendencias inesperado: ${pendenciasFirstLine}`);
    }
    console.log('✓ Pendencias CSV');
    console.log('  HTTP 200');
    console.log(`  Content-Type: ${pendenciasRes.contentType}`);
    console.log('  UTF-8 BOM: OK');
    console.log(`  Header: ${pendenciasFirstLine}\n`);

    // 4. Testar Auditoria CSV
    console.log('[CSV TEST] Testing auditoria...');
    const auditoriaRes = await fetchWithTimeout(`${baseUrl}/reports/export-csv?type=auditoria`, { headers: authHeaders });
    if (auditoriaRes.status !== 200) {
      throw new Error(`Auditoria CSV retornou status ${auditoriaRes.status}`);
    }
    if (!auditoriaRes.contentType.includes('text/csv')) {
      throw new Error(`Content-Type incorreto: ${auditoriaRes.contentType}`);
    }
    if (!auditoriaRes.hasBom) {
      throw new Error('Auditoria CSV não possui UTF-8 BOM binário (0xEF 0xBB 0xBF) no início');
    }
    const auditoriaFirstLine = auditoriaRes.text.split('\r\n')[0];
    if (!auditoriaFirstLine.includes('Data/Hora') || !auditoriaFirstLine.includes('Ação')) {
      throw new Error(`Cabeçalho de auditoria inesperado: ${auditoriaFirstLine}`);
    }
    console.log('✓ Auditoria CSV');
    console.log('  HTTP 200');
    console.log(`  Content-Type: ${auditoriaRes.contentType}`);
    console.log('  UTF-8 BOM: OK');
    console.log(`  Header: ${auditoriaFirstLine}\n`);

    // 5. Testar tipo inválido
    console.log('[CSV TEST] Testing invalid type (deve retornar 400)...');
    const invalidRes = await fetchWithTimeout(`${baseUrl}/reports/export-csv?type=invalido`, { headers: authHeaders });
    if (invalidRes.status !== 400) {
      throw new Error(`Tipo inválido esperava 400, recebeu ${invalidRes.status}`);
    }
    console.log('✓ Tipo inválido rejeitado com HTTP 400\n');

    console.log('========================================');
    console.log('REPORT TESTS PASSED');
    console.log('========================================\n');
  } catch (err: any) {
    console.error('\n❌ FAILED: Reports Test');
    console.error('Reason:', err.message);
    process.exitCode = 1;
  } finally {
    clearTimeout(globalTimer);
    if ('closeAllConnections' in server) {
      server.closeAllConnections();
    }
    server.close(() => {
      console.log('✓ Server closed');
    });
  }
}

runReportsTest();
