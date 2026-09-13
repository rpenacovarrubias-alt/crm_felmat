import { describe, it, expect } from 'vitest';
import { resolverContextoAnuncio } from './anunciosApi';

describe('resolverContextoAnuncio', () => {
  it('airbnb -> modo airbnb, categoria PROPIEDAD', () => {
    expect(resolverContextoAnuncio('/airbnb/anuncios/nuevo')).toEqual({
      modo: 'airbnb', categoria: 'PROPIEDAD', rutaBase: '/airbnb/anuncios',
    });
  });

  it('propiedades/ficha -> modo propiedades, categoria PROPIEDAD', () => {
    expect(resolverContextoAnuncio('/propiedades/ficha/nuevo')).toEqual({
      modo: 'propiedades', categoria: 'PROPIEDAD', rutaBase: '/propiedades/ficha',
    });
  });

  it('propiedades/anuncios -> modo propiedades, categoria SERVICIO', () => {
    expect(resolverContextoAnuncio('/propiedades/anuncios/nuevo')).toEqual({
      modo: 'propiedades', categoria: 'SERVICIO', rutaBase: '/propiedades/anuncios',
    });
  });

  it('default (bare /anuncios, Condominios) -> modo admin, categoria SERVICIO', () => {
    expect(resolverContextoAnuncio('/anuncios/nuevo')).toEqual({
      modo: 'admin', categoria: 'SERVICIO', rutaBase: '/anuncios',
    });
  });

  it('propiedades/ficha and propiedades/anuncios never cross-match', () => {
    expect(resolverContextoAnuncio('/propiedades/ficha/abc123').categoria).toBe('PROPIEDAD');
    expect(resolverContextoAnuncio('/propiedades/anuncios/abc123').categoria).toBe('SERVICIO');
  });
});
