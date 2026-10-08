import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const dbPath = path.join(dbDir, 'folga_manager.db');

export const db = new DatabaseSync(dbPath);

// Ativa chaves estrangeiras e modo WAL para alta performance e confiabilidade
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export default db;
