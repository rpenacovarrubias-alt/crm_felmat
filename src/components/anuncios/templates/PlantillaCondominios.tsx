export interface ContactoPlantilla {
  nombre: string;
  telefono?: string;
}

export interface PlantillaCondominiosProps {
  fotoUrl: string;
  headline: string;
  subtitulo: string;
  contacto: ContactoPlantilla;
}

// Composición fija de 1080x1080 -- foto real a pantalla completa, degradado
// diagonal oscuro, logo Felmat, encabezado/subtítulo y pie de contacto.
// Mismo tratamiento visual aprobado en el carrusel de Condominios (ver
// docs/superpowers/specs/2026-09-11-plantillas-anuncios-redes-sociales-design.md).
export function PlantillaCondominios({ fotoUrl, headline, subtitulo, contacto }: PlantillaCondominiosProps) {
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
          inset: 0,
          background: 'linear-gradient(100deg, rgba(10,10,25,0.88) 0%, rgba(10,10,25,0.62) 38%, rgba(10,10,25,0.08) 68%, rgba(10,10,25,0) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: 90,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 26px', marginBottom: 48 }}>
          <img src="/logo-felmat-gold.png" alt="Felmat" style={{ height: 90, objectFit: 'contain', display: 'block' }} />
        </div>
        {headline && (
          <h1
            style={{
              color: '#fff',
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: 700,
              margin: '0 0 28px',
              textShadow: '0 2px 14px rgba(0,0,0,.35)',
            }}
          >
            {headline}
          </h1>
        )}
        {subtitulo && (
          <p
            style={{
              color: '#e4e4f0',
              fontSize: 30,
              fontWeight: 400,
              maxWidth: 620,
              lineHeight: 1.4,
              margin: '0 0 56px',
            }}
          >
            {subtitulo}
          </p>
        )}
        <div style={{ display: 'flex', gap: 36, color: '#fff', fontSize: 27, fontWeight: 600 }}>
          {contacto.telefono && <span>📞 {contacto.telefono}</span>}
          <span>{contacto.nombre} · Asesor Inmobiliario</span>
        </div>
      </div>
    </div>
  );
}

export default PlantillaCondominios;
