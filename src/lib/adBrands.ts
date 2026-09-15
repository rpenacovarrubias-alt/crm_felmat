import type { ModoAnuncio } from './anunciosApi';

export interface AdBrand {
  key: 'felmat' | 'hospitalidad_digital';
  name: string;
  logoUrl: string;
  primaryColor: string;
}

export const FELMAT_BRAND: AdBrand = {
  key: 'felmat',
  name: 'Felmat',
  logoUrl: '/logo-felmat-gold.png',
  primaryColor: '#C9932E',
};

export const HOSPITALIDAD_DIGITAL_BRAND: AdBrand = {
  key: 'hospitalidad_digital',
  name: 'Hospitalidad Digital',
  logoUrl: '/brand/hospitalidad-digital/logo.png',
  primaryColor: '#1a1a2e',
};

// Resuelto por el `modo` del anuncio -- Airbnb usa la marca hermana
// Hospitalidad Digital (cuentas de redes sociales propias, nunca
// compartidas con Felmat); Propiedades y Condominios usan Felmat.
export function resolverBrandAnuncio(modo: ModoAnuncio): AdBrand {
  return modo === 'airbnb' ? HOSPITALIDAD_DIGITAL_BRAND : FELMAT_BRAND;
}
