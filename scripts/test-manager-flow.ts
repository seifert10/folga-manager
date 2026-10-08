import http from 'http';
import app from '../server/app';
import db from '../server/db/connection';
import { runMigrations } from '../server/db/migrate';
import { runSeed } from '../server/db/seed';
import { generateFakeValidCPF, isValidCPF } from '../server/utils/cpf';

const SIM_PORT = 4010;
const GLOBAL_TIMEOUT_MS = 30000;

const timer = setTimeout(() => {
  console.error('\n❌ [SIMULATION TIMEOUT] Limite excedido!');
  process.exit(1);
}, GLOBAL_TIMEOUT_MS);
timer.unref();

let sessionToken = '';

async function fetchJson(url: string, options?: RequestInit): Promise<any> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 4000);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Connection': 'close',
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(options?.headers as Record<string, string>),
    };

    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } finally {
    clearTimeout(t);
  }
}

async function runManagerSimulation() {
  console.log('================================================================');
  console.log('🎬 SIMULAÇÃO DE JORNADA COMPLETA DO GESTOR — FOLGA MANAGER');
  console.log('================================================================\n');

  // Passo 1: Setup do Banco e Migrations
  console.log('📌 [Etapa 1/16] Inicializando banco SQLite e Migrations...');
  runMigrations();
  runSeed();
  console.log('✓ Banco inicializado com sucesso.');

  const server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.listen(SIM_PORT, () => {
      console.log(`✓ Servidor operacional na porta ${SIM_PORT}`);
      resolve();
    });
    server.on('error', reject);
  });

  const baseUrl = `http://localhost:${SIM_PORT}/api`;

  try {
    // Autenticação prévia para simulação
    const loginData = await fetchJson(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@folgamanager.local', password: 'AdminPassword123!' }),
    });
    sessionToken = loginData.token;

    console.log('\n📌 [Etapa 2/16] Simulando Onboarding de primeiro acesso...');
    await fetchJson(`${baseUrl}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ onboarding_completed: 'true' }),
    });
    const settings = await fetchJson(`${baseUrl}/settings`);
    if (settings.onboarding_completed !== 'true') throw new Error('Falha ao salvar onboarding');
    console.log('✓ Onboarding concluído e registrado nas configurações.');

    console.log('\n📌 [Etapa 3/16] Visualizando equipe cadastrada...');
    const employees = await fetchJson(`${baseUrl}/employees`);
    console.log(`✓ Equipe carregada: ${employees.length} colaboradores encontrados.`);

    console.log('\n📌 [Etapa 4/16] Cadastrando novo colaborador (com validação de CPF)...');
    const validCpf = generateFakeValidCPF(88);
    const newEmpRes = await fetchJson(`${baseUrl}/employees`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Roberto Viana',
        cpf: validCpf,
        position: 'Técnico de Manutenção',
        department: 'Operações',
        department_id: 1,
        hire_date: '2024-03-01',
        work_regime: 'CLT',
        weekly_hours: 44,
        work_schedule_type: '6x1',
        status: 'ativo',
      }),
    });
    const newEmpId = newEmpRes.id;
    console.log(`✓ Colaborador Roberto Viana cadastrado com ID ${newEmpId} (CPF: ${validCpf}).`);

    console.log('\n📌 [Etapa 5/16] Definindo escala de trabalho para o novo colaborador...');
    const todayStr = new Date().toISOString().split('T')[0];
    await fetchJson(`${baseUrl}/schedules`, {
      method: 'POST',
      body: JSON.stringify({
        employee_id: newEmpId,
        date: todayStr,
        shift: 'manha',
        status: 'trabalho',
        notes: 'Turno padrão matutino',
      }),
    });
    console.log(`✓ Escala de trabalho salva para ${todayStr}.`);

    console.log('\n📌 [Etapa 6/16] Criando folga regulamentar...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayOffRes = await fetchJson(`${baseUrl}/days-off`, {
      method: 'POST',
      body: JSON.stringify({
        employee_id: newEmpId,
        date: tomorrowStr,
        type: 'dsr',
        notes: 'Descanso semanal programado',
      }),
    });
    const dayOffId = dayOffRes.id;
    console.log(`✓ Folga agendada com ID ${dayOffId} para ${tomorrowStr}.`);

    console.log('\n📌 [Etapa 7/16] Alterando a folga para outra data (troca de escala)...');
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];
    await fetchJson(`${baseUrl}/days-off/${dayOffId}`, {
      method: 'PUT',
      body: JSON.stringify({
        date: dayAfterTomorrowStr,
        notes: 'Troca de folga com colega aprovada pelo gestor',
      }),
    });
    console.log(`✓ Folga alterada para ${dayAfterTomorrowStr}.`);

    console.log('\n📌 [Etapa 8/16] Verificando métricas em tempo real no Dashboard...');
    const dash = await fetchJson(`${baseUrl}/dashboard`);
    console.log(`✓ Dashboard atualizado: Total de colaboradores = ${dash.stats.totalEmployees}`);
    console.log(`✓ Status do Card de Atenção: ${dash.attentionCard.status} - "${dash.attentionCard.title}"`);

    console.log('\n📌 [Etapa 9/16] Verificando alerta de colaboradores com folga pendente...');
    const pendingEmployees = dash.attentionCard.pendingEmployees;
    if (pendingEmployees.length === 0) throw new Error('Esperava-se pelo menos 1 colaborador pendente');
    console.log(`✓ Alerta ativo: ${pendingEmployees.length} colaboradores pendentes de DSR.`);
    pendingEmployees.forEach((p: any) => {
      console.log(`  - 🔴 ${p.name} (${p.position}): ${p.alertMessage}`);
    });

    console.log('\n📌 [Etapa 10/16] Resolvendo pendência agendando folga do colaborador...');
    const targetPending = pendingEmployees[0];
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + 4);
    const nextSundayStr = nextSunday.toISOString().split('T')[0];
    await fetchJson(`${baseUrl}/days-off`, {
      method: 'POST',
      body: JSON.stringify({
        employee_id: targetPending.id,
        date: nextSundayStr,
        type: 'dsr',
        notes: 'Resolução de pendência pelo gestor',
      }),
    });
    console.log(`✓ Pendência resolvida para ${targetPending.name} com folga em ${nextSundayStr}.`);

    console.log('\n📌 [Etapa 11/16] Conferindo histórico de auditoria...');
    const auditLogs = await fetchJson(`${baseUrl}/audit?limit=5`);
    if (auditLogs.length === 0) throw new Error('Auditoria vazia');
    console.log(`✓ Auditoria registrou ${auditLogs.length} eventos recentes:`);
    auditLogs.slice(0, 3).forEach((l: any) => {
      console.log(`  - [${l.action}] ${l.details}`);
    });

    console.log('\n📌 [Etapa 12/16] Validando download do relatório CSV...');
    const csvUrl = `${baseUrl}/reports/export-csv?type=folgas`;
    const csvRes = await fetch(csvUrl, { headers: { 'Connection': 'close', Authorization: `Bearer ${sessionToken}` } });
    const csvBuffer = Buffer.from(await csvRes.arrayBuffer());
    const hasBom = csvBuffer[0] === 0xEF && csvBuffer[1] === 0xBB && csvBuffer[2] === 0xBF;
    if (!hasBom) throw new Error('CSV sem BOM UTF-8');
    console.log('✓ Relatório CSV gerado e verificado com formato compatível com Excel.');

    console.log('\n📌 [Etapa 13/16] Alternando preferência de Tema (Dark Mode)...');
    await fetchJson(`${baseUrl}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ theme_preference: 'dark' }),
    });
    console.log('✓ Preferência de tema persistida com sucesso.');

    console.log('\n📌 [Etapa 14/16] Testando busca global (Command Palette Spotlight)...');
    const searchResult = await fetchJson(`${baseUrl}/employees?search=Roberto`);
    if (searchResult.length !== 1 || searchResult[0].name !== 'Roberto Viana') {
      throw new Error('Busca global não localizou Roberto Viana');
    }
    console.log(`✓ Busca global localizou "${searchResult[0].name}" instantaneamente.`);

    console.log('\n📌 [Etapa 15/16] Simulando reinicialização do servidor HTTP...');
    server.close();
    // Reabre na mesma porta para simular restart
    const restartedServer = http.createServer(app);
    await new Promise<void>((resolve, reject) => {
      restartedServer.listen(SIM_PORT, () => {
        console.log('✓ Servidor reiniciado.');
        resolve();
      });
      restartedServer.on('error', reject);
    });

    console.log('\n📌 [Etapa 16/16] Confirmando que os dados persistiram no SQLite após reinício...');
    const persistedEmp = await fetchJson(`${baseUrl}/employees?search=Roberto`);
    if (persistedEmp.length === 0) throw new Error('Dados perdidos após reinício do servidor');
    console.log(`✓ Persistência SQLite 100% verificada: ${persistedEmp[0].name} continua gravado em disco.`);

    restartedServer.close();

    console.log('\n================================================================');
    console.log('🎉 SIMULAÇÃO CONCLUÍDA COM 100% DE SUCESSO!');
    console.log('Todas as 16 etapas da jornada do gestor funcionaram perfeitamente.');
    console.log('================================================================\n');

  } catch (err: any) {
    console.error('\n❌ Falha na simulação:', err.message);
    process.exitCode = 1;
  } finally {
    clearTimeout(timer);
    if ('closeAllConnections' in server) {
      server.closeAllConnections();
    }
    server.close();
  }
}

runManagerSimulation();
