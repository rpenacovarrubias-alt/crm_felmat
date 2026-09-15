// ============================================
// CLIENTE PARA LA API DE ANUNCIOS (Postgres + Prisma vía Vercel serverless)
// ============================================
// A diferencia del resto del CRM (IndexedDB local), Anuncios vive en una base
// de datos real para que n8n pueda leer/publicar automáticamente en Facebook,
// Instagram, etc. Ver api/anuncios*.js y prisma/schema.prisma.

export type EstadoAnuncio = 'BORRADOR' | 'REVISION' | 'PUBLICADO' | 'PAUSADO' | 'EXPIRADO' | 'ARCHIVADO';
export type ModoAnuncio = 'admin' | 'airbnb' | 'propiedades';
export type CategoriaAnuncio = 'PROPIEDAD' | 'SERVICIO';

export interface ImagenAnuncio {
  url: string;
  esPrincipal: boolean;
  orden?: number;
  headline?: string;
  subtitulo?: string;
  imagenCompuestaUrl?: string;
}

export interface PublicacionAnuncio {
  canal: string;
  estado: string;
  externalUrl?: string;
  errorMsg?: string;
  publicadoAt?: string;
}

export interface Anuncio {
  id: string;
  agentId: string;
  modo: ModoAnuncio;
  categoria: CategoriaAnuncio;
  titulo: string;
  subtitulo?: string;
  slug: string;
  descripcion?: string;
  tipoPropiedad?: string;
  modalidadRenta?: string;
  colonia?: string;
  ciudad?: string;
  precio?: number;
  periodo: string;
  moneda: string;
  estado: EstadoAnuncio;
  destacado: boolean;
  recamaras: number;
  banos: number;
  createdAt: string;
  updatedAt: string;
  fechaPublicacion?: string;
  imagenes: ImagenAnuncio[];
  publicaciones: PublicacionAnuncio[];
  vistas: number;
  contactos: number;
}

const API_KEY = import.meta.env.VITE_ANUNCIOS_API_KEY || '';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.status === 204 ? (null as T) : res.json();
}

export interface FiltrosAnuncios {
  agentId?: string;
  modo?: ModoAnuncio;
  categoria?: CategoriaAnuncio;
  estado?: string;
  tipo?: string;
  modalidad?: string;
  q?: string;
  ordenar?: string;
}

export interface ContextoAnuncio {
  modo: ModoAnuncio;
  categoria: CategoriaAnuncio;
  rutaBase: string;
}

// Único lugar que decide modo/categoría/ruta a partir de la URL -- lo usan
// Anuncios.tsx, ListaAnuncios.tsx, AnuncioForm.tsx y AnuncioDetail.tsx.
// Condominios y Airbnb tienen una categoría fija por modo; Propiedades es
// el primer caso con las dos categorías bajo el mismo modo, distinguidas
// por la ruta en vez de por el modo.
export function resolverContextoAnuncio(pathname: string): ContextoAnuncio {
  if (pathname.startsWith('/airbnb')) {
    return { modo: 'airbnb', categoria: 'PROPIEDAD', rutaBase: '/airbnb/anuncios' };
  }
  if (pathname.startsWith('/propiedades/ficha')) {
    return { modo: 'propiedades', categoria: 'PROPIEDAD', rutaBase: '/propiedades/ficha' };
  }
  if (pathname.startsWith('/propiedades/anuncios')) {
    return { modo: 'propiedades', categoria: 'SERVICIO', rutaBase: '/propiedades/anuncios' };
  }
  return { modo: 'admin', categoria: 'SERVICIO', rutaBase: '/anuncios' };
}

export function listarAnuncios(filtros: FiltrosAnuncios): Promise<Anuncio[]> {
  const qs = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => { if (v) qs.set(k, v); });
  return apiFetch(`/api/anuncios?${qs.toString()}`);
}

export function obtenerAnuncio(id: string): Promise<Anuncio> {
  return apiFetch(`/api/anuncios/${id}`);
}

export function crearAnuncio(data: Partial<Anuncio>): Promise<Anuncio> {
  return apiFetch('/api/anuncios', { method: 'POST', body: JSON.stringify(data) });
}

export function actualizarAnuncio(id: string, data: Partial<Anuncio>): Promise<Anuncio> {
  return apiFetch(`/api/anuncios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function eliminarAnuncio(id: string): Promise<void> {
  return apiFetch(`/api/anuncios/${id}`, { method: 'DELETE' });
}

export function duplicarAnuncio(id: string): Promise<Anuncio> {
  return apiFetch(`/api/anuncios/${id}/duplicar`, { method: 'POST' });
}

export function publicarAnuncio(anuncioId: string, canales: string[]): Promise<{ success: boolean; resultados: unknown[]; mensaje: string }> {
  return apiFetch('/api/publicar', { method: 'POST', body: JSON.stringify({ anuncioId, canales }) });
}

export function subirImagenAnuncio(dataUrl: string): Promise<{ url: string }> {
  return apiFetch('/api/felmat-upload-anuncio-image', { method: 'POST', body: JSON.stringify({ dataUrl }) });
}
