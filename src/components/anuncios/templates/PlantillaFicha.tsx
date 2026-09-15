import { BedDouble, Bath } from 'lucide-react';
import type { AdBrand } from '@/lib/adBrands';

export interface PlantillaFichaProps {
  fotoUrl: string;
  brand: AdBrand;
  badge: string; // 'VENTA' | 'RENTA' | 'AIRBNB'
  precio: number;
  moneda: string;
  periodo: string; // '/mes' | '/noche' | 'total'
  colonia: string;
  ciudad: string;
  recamaras: number;
  banos: number;
}

function formatearPrecio(precio: number, moneda: string, periodo: string): string {
  const monto = new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(precio);
  return periodo === 'total' ? monto : `${monto} ${periodo}`;
}

// Composición fija de 1080x1080 -- foto real a pantalla completa, degradado
// inferior, badge de marca, precio, ubicación, recámaras/baños, logo.
// Sirve tanto para Propiedades (Ficha) como para Airbnb -- la marca y el
// badge llegan como parámetros (ver docs/superpowers/specs/2026-09-14-
// publicacion-real-redes-sociales-design.md). Sin ícono de m² -- ese campo
// no existe en el modelo Anuncio real.
export function PlantillaFicha({ fotoUrl, brand, badge, precio, moneda, periodo, colonia, ciudad, recamaras, banos }: PlantillaFichaProps) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, "Segoe UI", Roboto, sans-serif',
        background: '#0a0a15',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${fotoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '46%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 48,
          left: 48,
          background: brand.primaryColor,
          color: '#fff',
          padding: '16px 28px',
          borderRadius: 999,
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: 0.5,
        }}
      >
        {badge}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 44,
          right: 44,
          height: 96,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 16,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <img src={brand.logoUrl} alt={brand.name} style={{ height: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ position: 'absolute', left: 48, right: 48, bottom: 44, color: '#fff' }}>
        <p style={{ fontSize: 76, fontWeight: 800, lineHeight: 1, margin: '0 0 12px', textShadow: '0 2px 12px rgba(0,0,0,.4)' }}>
          {formatearPrecio(precio, moneda, periodo)}
        </p>
        <p style={{ fontSize: 32, fontWeight: 500, opacity: 0.92, margin: '0 0 24px' }}>
          {colonia}, {ciudad}
        </p>
        <div style={{ display: 'flex', gap: 36, fontSize: 30, fontWeight: 600, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><BedDouble size={28} /> {recamaras}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Bath size={28} /> {banos}</span>
        </div>
      </div>
    </div>
  );
}

export default PlantillaFicha;
