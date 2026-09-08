import crypto from 'crypto';

// Misma matemática que api/_auth.ts de airbnb-cohost-app (PBKDF2 + HMAC sin
// librerías nuevas), trasladada al estilo JS plano de este repo.

const SECRET = () => process.env.SESSION_SECRET || '';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const RESET_MAX_AGE_MS = 30 * 60 * 1000;              // 30 minutos

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 32;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, storedHash) {
  if (!salt || !storedHash) return false;
  const computed = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256').toString('hex');
  const stored = Buffer.from(storedHash, 'hex');
  const attempt = Buffer.from(computed, 'hex');
  return stored.length === attempt.length && crypto.timingSafeEqual(stored, attempt);
}

function sign(body) {
  return crypto.createHmac('sha256', SECRET()).update(body).digest('base64url');
}

function verifyAndParse(token, maxAgeMs) {
  if (!token || !SECRET()) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (Date.now() - payload.iat > maxAgeMs) return null;
    return payload;
  } catch {
    return null;
  }
}

export function signSession({ sub, role, propertyAccess }) {
  const full = { sub, role, propertyAccess, iat: Date.now() };
  const body = Buffer.from(JSON.stringify(full)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifySession(token) {
  return verifyAndParse(token, SESSION_MAX_AGE_MS);
}

// Solo acepta payloads con forma de sesión real (con role) -- un token de
// reset firmado con el mismo secreto no debe colarse como sesión.
export function getSession(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const payload = verifySession(auth.slice('Bearer '.length));
  if (!payload || typeof payload.role !== 'string') return null;
  return payload;
}

export function signResetToken(userId) {
  const full = { sub: userId, purpose: 'reset', iat: Date.now() };
  const body = Buffer.from(JSON.stringify(full)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifyResetToken(token) {
  const payload = verifyAndParse(token, RESET_MAX_AGE_MS);
  if (!payload || payload.purpose !== 'reset') return null;
  return payload.sub;
}

export function isFullAdmin(role) {
  return role === 'super_admin' || role === 'admin';
}

export function isSuperAdmin(role) {
  return role === 'super_admin';
}

// Ver/listar: admin ve todo; agent/assistant solo lo propio (agentId) o lo
// que le hayan asignado explícitamente en propertyAccess.
export function canAccessProperty(session, property) {
  if (isFullAdmin(session.role)) return true;
  if (!property) return true;
  if (property.agentId === session.sub) return true;
  if (!session.propertyAccess || session.propertyAccess.length === 0) return false;
  return session.propertyAccess.includes(property.id);
}

// Editar/eliminar: solo el dueño (agentId) o admin -- propertyAccess NO basta,
// es solo para ver (ej. un assistant asignado a apoyar, no a modificar).
export function canEditProperty(session, property) {
  if (isFullAdmin(session.role)) return true;
  return property.agentId === session.sub;
}

export const canDeleteProperty = canEditProperty;
