import crypto from 'node:crypto';

/**
 * Gera um hash criptograficamente seguro com salt aleatório usando scrypt nativo.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Valida a senha contra o hash armazenado em tempo constante (proteção contra timing attacks).
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, keyHex] = parts;
    const keyBuffer = Buffer.from(keyHex, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, keyBuffer.length);
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
}

/**
 * Gera um token de sessão seguro com 64 caracteres hexadecimais (256 bits de entropia).
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
