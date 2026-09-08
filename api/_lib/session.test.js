import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword, verifyPassword, signSession, verifySession, getSession,
  signResetToken, verifyResetToken, isFullAdmin, isSuperAdmin,
  canAccessProperty, canEditProperty, canDeleteProperty,
} from './session.js';

describe('session', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-secret-not-for-prod';
  });

  it('hashPassword + verifyPassword: contraseña correcta pasa, incorrecta falla', () => {
    const { salt, hash } = hashPassword('Fridasufrida09.');
    expect(verifyPassword('Fridasufrida09.', salt, hash)).toBe(true);
    expect(verifyPassword('otra-cosa', salt, hash)).toBe(false);
  });

  it('signSession + verifySession: token válido regresa el payload', () => {
    const token = signSession({ sub: 'u1', role: 'super_admin', propertyAccess: [] });
    const session = verifySession(token);
    expect(session.sub).toBe('u1');
    expect(session.role).toBe('super_admin');
  });

  it('verifySession: token alterado se rechaza', () => {
    const token = signSession({ sub: 'u1', role: 'agent', propertyAccess: [] });
    const [body, sig] = token.split('.');
    const tampered = `${body}.${sig.slice(0, -1)}${sig.slice(-1) === 'a' ? 'b' : 'a'}`;
    expect(verifySession(tampered)).toBeNull();
  });

  it('signResetToken + verifyResetToken: token de reset regresa el userId', () => {
    const resetToken = signResetToken('u2');
    expect(verifyResetToken(resetToken)).toBe('u2');
  });

  it('getSession: un token de reset no sirve como sesión (no trae role)', () => {
    const resetToken = signResetToken('u3');
    const fakeReq = { headers: { authorization: `Bearer ${resetToken}` } };
    expect(getSession(fakeReq)).toBeNull();
  });

  it('getSession: sin header Authorization regresa null', () => {
    expect(getSession({ headers: {} })).toBeNull();
  });

  it('isFullAdmin / isSuperAdmin', () => {
    expect(isFullAdmin('super_admin')).toBe(true);
    expect(isFullAdmin('admin')).toBe(true);
    expect(isFullAdmin('agent')).toBe(false);
    expect(isSuperAdmin('admin')).toBe(false);
    expect(isSuperAdmin('super_admin')).toBe(true);
  });

  it('canAccessProperty: admin ve todo; agent solo lo suyo o lo asignado', () => {
    const own = { agentId: 'u1', id: 'p1' };
    const ajena = { agentId: 'u2', id: 'p2' };
    expect(canAccessProperty({ role: 'admin', sub: 'ux', propertyAccess: [] }, ajena)).toBe(true);
    expect(canAccessProperty({ role: 'agent', sub: 'u1', propertyAccess: [] }, own)).toBe(true);
    expect(canAccessProperty({ role: 'agent', sub: 'u1', propertyAccess: [] }, ajena)).toBe(false);
    expect(canAccessProperty({ role: 'agent', sub: 'u1', propertyAccess: ['p2'] }, ajena)).toBe(true);
  });

  it('canEditProperty / canDeleteProperty: solo dueño o admin', () => {
    const ajena = { agentId: 'u2', id: 'p2' };
    expect(canEditProperty({ role: 'admin', sub: 'ux' }, ajena)).toBe(true);
    expect(canEditProperty({ role: 'agent', sub: 'u2' }, ajena)).toBe(true);
    expect(canEditProperty({ role: 'agent', sub: 'u1' }, ajena)).toBe(false);
    expect(canDeleteProperty({ role: 'agent', sub: 'u1' }, ajena)).toBe(false);
  });
});
