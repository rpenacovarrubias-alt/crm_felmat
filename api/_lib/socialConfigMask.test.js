import { describe, it, expect } from 'vitest';
import { maskToken, secretFieldUpdate } from './socialConfigMask.js';

describe('maskToken', () => {
  it('regresa null si no hay token', () => {
    expect(maskToken(null)).toBe(null);
    expect(maskToken(undefined)).toBe(null);
    expect(maskToken('')).toBe(null);
  });

  it('regresa los ultimos 4 caracteres con prefijo de puntos', () => {
    expect(maskToken('EAABsbCS1234567890')).toBe('••••7890');
  });

  it('funciona con tokens mas cortos que 4 caracteres sin revelar el token completo', () => {
    expect(maskToken('ab')).toBe('••••');
  });
});

describe('secretFieldUpdate', () => {
  it('llave ausente del body: no toca el campo', () => {
    expect(secretFieldUpdate({}, 'appSecret')).toEqual({ touched: false });
  });

  it('llave presente como string vacio: limpia a null', () => {
    expect(secretFieldUpdate({ appSecret: '' }, 'appSecret')).toEqual({ touched: true, value: null });
  });

  it('llave presente con contenido: usa ese valor', () => {
    expect(secretFieldUpdate({ appSecret: 'shhh' }, 'appSecret')).toEqual({ touched: true, value: 'shhh' });
  });
});
