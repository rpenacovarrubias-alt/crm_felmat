import { describe, it, expect } from 'vitest';
import { resolveTargetUserId } from './felmat-social-config.js';

describe('resolveTargetUserId', () => {
  it('sin userId solicitado: regresa el propio usuario', () => {
    const session = { sub: 'user-a', role: 'agent' };
    expect(resolveTargetUserId(session, undefined)).toEqual({ userId: 'user-a', forbidden: false });
  });

  it('userId solicitado igual al propio: regresa el propio usuario', () => {
    const session = { sub: 'user-a', role: 'agent' };
    expect(resolveTargetUserId(session, 'user-a')).toEqual({ userId: 'user-a', forbidden: false });
  });

  it('no super_admin pide el userId de otro: forbidden, cae al propio', () => {
    const session = { sub: 'user-a', role: 'agent' };
    expect(resolveTargetUserId(session, 'user-b')).toEqual({ userId: 'user-a', forbidden: true });
  });

  it('super_admin pide el userId de otro: se le concede ese userId', () => {
    const session = { sub: 'admin-1', role: 'super_admin' };
    expect(resolveTargetUserId(session, 'user-b')).toEqual({ userId: 'user-b', forbidden: false });
  });

  it('super_admin sin userId solicitado: regresa su propio userId, sin caso especial', () => {
    const session = { sub: 'admin-1', role: 'super_admin' };
    expect(resolveTargetUserId(session, undefined)).toEqual({ userId: 'admin-1', forbidden: false });
  });

  it('requestedUserId no-string (ej. array de query param duplicado): se trata como ausente', () => {
    const session = { sub: 'user-a', role: 'agent' };
    expect(resolveTargetUserId(session, ['user-b', 'user-c'])).toEqual({ userId: 'user-a', forbidden: false });
  });
});
