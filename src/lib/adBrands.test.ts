import { describe, it, expect } from 'vitest';
import { resolverBrandAnuncio, FELMAT_BRAND, HOSPITALIDAD_DIGITAL_BRAND } from './adBrands';

describe('resolverBrandAnuncio', () => {
  it('airbnb -> Hospitalidad Digital', () => {
    expect(resolverBrandAnuncio('airbnb')).toBe(HOSPITALIDAD_DIGITAL_BRAND);
  });

  it('propiedades -> Felmat', () => {
    expect(resolverBrandAnuncio('propiedades')).toBe(FELMAT_BRAND);
  });

  it('admin (Condominios) -> Felmat', () => {
    expect(resolverBrandAnuncio('admin')).toBe(FELMAT_BRAND);
  });
});
