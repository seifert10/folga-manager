import app from './app';
import { runMigrations } from './db/migrate';
import { runSeed } from './db/seed';
import db from './db/connection';

const PORT = Number(process.env.PORT) || 3001;

// Garante migrações ao iniciar
runMigrations();

// Garante população inicial se o banco for novo (deploy em produção)
try {
  const userRow: any = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!userRow || userRow.count === 0) {
    console.log('🌱 Banco vazio detectado. Aplicando sementes iniciais automáticas...');
    runSeed();
  }
} catch (e: any) {
  console.error('Nota de inicialização de dados:', e.message);
}

export const server = app.listen(PORT, () => {
  console.log(`🚀 Folga Manager Server rodando na porta ${PORT}`);
  console.log(`📡 Endpoints disponíveis em http://localhost:${PORT}/api`);
});

export default app;
