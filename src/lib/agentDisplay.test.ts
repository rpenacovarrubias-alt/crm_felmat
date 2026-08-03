import { describe, it, expect } from 'vitest';
import { resolveAgentDisplay, AGENCY_FALLBACK_EMAIL } from './agentDisplay';

describe('resolveAgentDisplay', () => {
  it('usa un contacto generico de la agencia cuando no hay asesor real (sin inventar una persona)', () => {
    const result = resolveAgentDisplay(null);
    expect(result.isRealAgent).toBe(false);
    expect(result.name).toBe('Grupo FELMAT');
    expect(result.email).toBe(AGENCY_FALLBACK_EMAIL);
    expect(result.phone).toBeUndefined();
    expect(result.whatsapp).toBeUndefined();
    expect(result.certificateNumber).toBeUndefined();
  });

  it('usa los datos reales del asesor cuando existe', () => {
    const result = resolveAgentDisplay({
      name: 'Mayra',
      lastName: 'Fajer',
      phone: '4421234567',
      email: 'mayra@felmat.com',
      avatar: 'data:image/png;base64,abc',
      config: {
        bio: 'Asesora certificada en Querétaro',
        certificateNumber: 'FELMAT-002',
        whatsappNumber: '4421234567',
      },
    });
    expect(result.isRealAgent).toBe(true);
    expect(result.name).toBe('Mayra Fajer');
    expect(result.phone).toBe('4421234567');
    expect(result.email).toBe('mayra@felmat.com');
    expect(result.role).toBe('Asesora certificada en Querétaro');
    expect(result.certificateNumber).toBe('FELMAT-002');
  });

  it('el override sustituye solo los campos que trae, sobre los datos reales del asesor', () => {
    const result = resolveAgentDisplay(
      { name: 'Mayra', lastName: 'Fajer', phone: '4421234567', email: 'mayra@felmat.com' },
      { overridePhone: '5559999999' }
    );
    expect(result.isRealAgent).toBe(true);
    expect(result.name).toBe('Mayra Fajer');
    expect(result.phone).toBe('5559999999');
    expect(result.email).toBe('mayra@felmat.com');
  });

  it('el override puede dar identidad a una ficha aunque no haya asesor real vinculado', () => {
    const result = resolveAgentDisplay(null, {
      overrideName: 'Juan Pérez (referido)',
      overridePhone: '4429998877',
    });
    expect(result.isRealAgent).toBe(true);
    expect(result.name).toBe('Juan Pérez (referido)');
    expect(result.phone).toBe('4429998877');
    expect(result.email).toBe(AGENCY_FALLBACK_EMAIL);
  });

  it('un override sin certificado no debe traer un certificado heredado de ningun lado', () => {
    const result = resolveAgentDisplay(null, {
      overrideName: 'Juan Pérez (referido)',
      overridePhone: '4429998877',
    });
    expect(result.certificateNumber).toBeUndefined();
  });
});
