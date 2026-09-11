import { describe, it, expect } from 'vitest';
import { maskToken } from './socialConfigMask.js';

describe('maskToken', () => {
  it('regresa null si no hay token', () => {
    expect(maskToken(null)).toBe(null);
    expect(maskToken(undefined)).toBe(null);
    expect(maskToken('')).toBe(null);
  });

  it('regresa los ultimos 4 caracteres con prefijo de puntos', () => {
    expect(maskToken('EAABsbCS1234567890')).toBe('••••7890');
  });

  it('funciona con tokens mas cortos que 4 caracteres', () => {
    expect(maskToken('ab')).toBe('••••ab');
  });
});
