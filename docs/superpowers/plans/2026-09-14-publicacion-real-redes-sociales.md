# Publicación real a Facebook/Instagram — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el simulacro de "Publicar en..." por publicación real al Graph API de Meta (Facebook + Instagram) para las 3 secciones (Propiedades/Ficha, Airbnb, Condominios), incluyendo el carrusel real de Meta para Condominios.

**Architecture:** Una plantilla visual nueva (`PlantillaFicha.tsx`, marca como parámetro) compone y sube a Blob la foto principal de Propiedades/Airbnb, reusando exactamente el patrón ya en producción de Condominios. Un módulo de funciones puras (`api/_lib/metaPublish.js`) habla con el Graph API real, sin saber nada de Prisma ni de secciones. `api/publicar.js` orquesta: resuelve credenciales por sección real del anuncio, resuelve qué imagen(es) publicar según `categoria`, llama a `metaPublish.js`, guarda el resultado real.

**Tech Stack:** React 18 + TS + Vite, Prisma/Postgres, Vercel serverless functions (JS plano), Graph API de Meta `v21.0` vía `fetch` nativo (sin SDK de Meta).

## Global Constraints

- Spec de referencia: `docs/superpowers/specs/2026-09-14-publicacion-real-redes-sociales-design.md`.
- Solo los canales `FACEBOOK` e `INSTAGRAM` reciben publicación real; `WEB`/`GOOGLE_BUSINESS` se quedan exactamente como hoy (`PENDIENTE`, sin llamar a nada).
- El caption es `anuncio.descripcion` tal cual -- nunca se genera ni se modifica con IA en esta pieza.
- Sin renovación automática de tokens de Meta -- un token inválido se refleja tal cual en `errorMsg` con el mensaje real que regresa Meta.
- `PlantillaFicha.tsx` no tiene campo de m² -- ese campo no existe en el modelo `Anuncio` real (corrección a una suposición del prototipo original).
- Solo la foto principal (`esPrincipal`) de Propiedades/Airbnb se compone y sube a Blob -- las demás fotos de la galería se quedan en base64 como hoy, fuera de alcance.
- Instagram exige entre 2 y 10 imágenes para un carrusel real -- un anuncio de Condominios con exactamente 1 diapositiva se publica como imagen única en ambas redes, no como error.
- Commit messages terminan con `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/lib/adBrands.ts` | Crear | `AdBrand`, presets Felmat/Hospitalidad Digital, `resolverBrandAnuncio(modo)` |
| `src/lib/adBrands.test.ts` | Crear | 3 casos de `resolverBrandAnuncio` |
| `src/components/anuncios/templates/PlantillaFicha.tsx` | Crear | Compositor visual 1080×1080 (foto + badge + precio + ubicación + logo), marca como parámetro |
| `src/components/anuncios/AnuncioForm.tsx` | Modificar | Rama PROPIEDAD compone y sube a Blob la foto principal (cubre Propiedades y Airbnb a la vez) |
| `api/_lib/metaPublish.js` | Crear | 4 funciones puras: FB/IG × imagen única/carrusel, hablan de verdad con el Graph API |
| `api/_lib/metaPublish.test.js` | Crear | Fetch mockeado -- verifica forma de las llamadas y manejo de éxito/error |
| `api/publicar.js` | Modificar (reescritura) | Orquesta: resuelve sección/credenciales/imágenes, llama a `metaPublish.js`, guarda resultado real |
| `src/lib/anunciosApi.ts` | Modificar | `PublicacionAnuncio.errorMsg?: string` |
| `src/components/anuncios/ListaAnuncios.tsx` | Modificar | Tooltip con el `errorMsg` real cuando un canal está en `ERROR` |
| `src/components/anuncios/AnuncioDetail.tsx` | Modificar | Estado "Error" distinto (con `errorMsg` en tooltip) en vez de mostrar "Publicar" como si nunca se hubiera intentado |

---

### Task 1: `src/lib/adBrands.ts` -- marca como parámetro

**Files:**
- Create: `src/lib/adBrands.ts`
- Test: `src/lib/adBrands.test.ts`

**Interfaces:**
- Consumes: `ModoAnuncio` de `src/lib/anunciosApi.ts` (ya existe: `'admin' | 'airbnb' | 'propiedades'`).
- Produces: `AdBrand` (tipo), `FELMAT_BRAND`, `HOSPITALIDAD_DIGITAL_BRAND`, `resolverBrandAnuncio(modo: ModoAnuncio): AdBrand`. Los consume Task 2 (`PlantillaFicha.tsx`) y Task 3 (`AnuncioForm.tsx`).

- [ ] **Step 1: Crear `src/lib/adBrands.ts`**

```typescript
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
```

- [ ] **Step 2: Confirmar que los assets de marca existen**

Run: `ls public/logo-felmat-gold.png public/brand/hospitalidad-digital/logo.png`
Expected: ambos archivos existen (ya se copiaron al repo en una pieza anterior -- ver commit `fb5f26af`). Si `logo.png` de Hospitalidad Digital no aparece con ese nombre exacto, ajusta `HOSPITALIDAD_DIGITAL_BRAND.logoUrl` al nombre real que sí exista bajo `public/brand/hospitalidad-digital/`.

- [ ] **Step 3: Crear `src/lib/adBrands.test.ts`**

```typescript
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
```

- [ ] **Step 4: Correr el test**

Run: `npx vitest run src/lib/adBrands.test.ts`
Expected: `3 passed`

- [ ] **Step 5: Verificar tsc**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/lib/adBrands.ts src/lib/adBrands.test.ts
git commit -m "$(cat <<'EOF'
feat: agrega adBrands.ts (marca como parametro para plantillas)

FELMAT_BRAND y HOSPITALIDAD_DIGITAL_BRAND, resueltos por modo del
anuncio -- Airbnb usa Hospitalidad Digital (cuentas propias, nunca
compartidas con Felmat), Propiedades y Condominios usan Felmat.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `PlantillaFicha.tsx` -- compositor visual

**Files:**
- Create: `src/components/anuncios/templates/PlantillaFicha.tsx`

**Interfaces:**
- Consumes: `AdBrand` de Task 1.
- Produces: `<PlantillaFicha fotoUrl brand badge precio moneda periodo colonia ciudad recamaras banos />`, un `<div>` de exactamente 1080×1080px. Task 3 lo monta fuera de pantalla y lo captura con `html2canvas` (ya existente, `generarImagenAnuncio`).

- [ ] **Step 1: Crear el componente**

```tsx
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
```

- [ ] **Step 2: Verificar tsc**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/anuncios/templates/PlantillaFicha.tsx
git commit -m "$(cat <<'EOF'
feat: componente PlantillaFicha (compositor 1080x1080, marca parametrizada)

Sirve tanto para Propiedades (Ficha, marca Felmat, badge VENTA/RENTA)
como para Airbnb (marca Hospitalidad Digital, badge AIRBNB) -- mismo
componente, distinto brand/badge segun quien lo use (Task 3).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Componer la foto principal en `AnuncioForm.tsx` (rama PROPIEDAD)

**Files:**
- Modify: `src/components/anuncios/AnuncioForm.tsx`

**Interfaces:**
- Consumes: `resolverBrandAnuncio` (Task 1), `PlantillaFicha` (Task 2), `generarImagenAnuncio` y `subirImagenAnuncio` (ya existentes, usados igual que en `DiapositivasEditor.tsx`).
- Produces: al subir/cambiar la foto principal o al salir de precio/colonia/ciudad/periodo, `imagenes` (el `ImagenAnuncio` marcado `esPrincipal`) termina con `imagenCompuestaUrl` poblado -- el mismo campo que ya usa `api/anuncios.js`/`api/anuncios/[id].js` al guardar (sin cambios ahí, ya lo hacen desde antes).

Esta rama es compartida entre Propiedades (Ficha) y Airbnb -- este cambio cubre las dos secciones a la vez, no una después de la otra.

- [ ] **Step 1: Agregar imports**

En `src/components/anuncios/AnuncioForm.tsx`, agrega a los imports existentes:

```tsx
import { createPortal } from 'react-dom';
```

y junto a los demás imports de `@/lib`/componentes:

```tsx
import { subirImagenAnuncio } from '@/lib/anunciosApi'; // agregar al import ya existente de anunciosApi, no duplicar la línea
import { generarImagenAnuncio } from '@/lib/generarImagenAnuncio';
import { resolverBrandAnuncio } from '@/lib/adBrands';
import { PlantillaFicha } from './templates/PlantillaFicha';
```

Concretamente, la línea 9 actual:

```tsx
  obtenerAnuncio, crearAnuncio, actualizarAnuncio, resolverContextoAnuncio,
```

pasa a:

```tsx
  obtenerAnuncio, crearAnuncio, actualizarAnuncio, resolverContextoAnuncio, subirImagenAnuncio,
```

- [ ] **Step 2: `ImagenesUploader` acepta `componiendoPrincipal` y muestra un spinner sobre la foto principal**

Reemplaza la firma y el bloque del `<img>` principal dentro de `ImagenesUploader` (líneas 40 y 89-103 actuales):

```tsx
function ImagenesUploader({ imagenes, onChange, componiendoPrincipal }: { imagenes: ImagenAnuncio[]; onChange: (imgs: ImagenAnuncio[]) => void; componiendoPrincipal?: boolean }) {
```

```tsx
          {imagenes.map((img, idx) => (
            <div key={idx} className={cn("relative aspect-square rounded-lg overflow-hidden border-2", img.esPrincipal ? "border-primary" : "border-border")}>
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              {img.esPrincipal && componiendoPrincipal && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.esPrincipal && (
                  <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setPrincipal(idx)} title="Establecer como principal">
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeImagen(idx)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {img.esPrincipal && <Badge className="absolute top-2 left-2 bg-primary">Principal</Badge>}
            </div>
          ))}
```

(`Loader2` ya está importado en este archivo -- no hace falta agregarlo.)

- [ ] **Step 3: Estado y función `componerFicha` dentro de `AnuncioForm`**

Justo después de la línea `const [imagenes, setImagenes] = useState<ImagenAnuncio[]>([]);`, agrega:

```tsx
  const [componiendoFicha, setComponiendoFicha] = useState(false);
  const renderFichaRef = useRef<HTMLDivElement>(null);

  // Mismo patrón ya en producción para Condominios (DiapositivasEditor.tsx):
  // se recibe fotoUrl explícito (nunca se lee `imagenes` por dentro) para no
  // cerrar sobre un array desactualizado cuando se llama en el mismo tick
  // que un onChange previo (ver el bug real ya corregido ahí).
  const componerFicha = async (fotoUrl: string) => {
    if (!fotoUrl) return;
    setComponiendoFicha(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!renderFichaRef.current) return;
      const dataUrl = await generarImagenAnuncio(renderFichaRef.current);
      const { url } = await subirImagenAnuncio(dataUrl);
      setImagenes((prev) => prev.map((img) => (img.esPrincipal ? { ...img, imagenCompuestaUrl: url } : img)));
    } catch (error) {
      toast.error('No se pudo componer la imagen del anuncio. Intenta de nuevo.');
    } finally {
      setComponiendoFicha(false);
    }
  };

  const handleFichaBlur = () => {
    const principal = imagenes.find((i) => i.esPrincipal);
    if (principal?.url) componerFicha(principal.url);
  };

  const principalFicha = imagenes.find((i) => i.esPrincipal);
```

- [ ] **Step 4: Disparar la composición al subir/cambiar la foto principal**

Reemplaza (dentro de la rama PROPIEDAD del JSX, tarjeta "Imágenes"):

```tsx
                <ImagenesUploader imagenes={imagenes} onChange={setImagenes} />
```

por:

```tsx
                <ImagenesUploader
                  imagenes={imagenes}
                  onChange={(imgs) => {
                    setImagenes(imgs);
                    const principal = imgs.find((i) => i.esPrincipal);
                    if (principal?.url) componerFicha(principal.url);
                  }}
                  componiendoPrincipal={componiendoFicha}
                />
```

- [ ] **Step 5: Disparar la composición al salir de los campos que afectan la plantilla**

En la tarjeta "Información general" (rama PROPIEDAD), agrega `onBlur={handleFichaBlur}` a Colonia y Ciudad:

```tsx
                  <Input value={colonia} onChange={(e) => setColonia(e.target.value)} onBlur={handleFichaBlur} required />
```

```tsx
                  <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} onBlur={handleFichaBlur} required />
```

En la tarjeta "Precio", agrega `onBlur={handleFichaBlur}` al campo Precio, y dispara la composición también al cambiar Periodo (el badge VENTA/RENTA depende de él, no solo del blur de un input de texto):

```tsx
                  <Input type="number" min={0} value={precio} onChange={(e) => setPrecio(e.target.value)} onBlur={handleFichaBlur} required />
```

```tsx
                  <Select value={periodo} onValueChange={(v) => { setPeriodo(v); handleFichaBlur(); }}>
```

(`handleFichaBlur()` aquí se llama después de `setPeriodo(v)` -- para cuando `componerFicha` capture el DOM 300ms+ después, React ya habrá vuelto a renderizar con el `periodo` nuevo, así que el portal del Step 6 lo refleja correctamente.)

- [ ] **Step 6: Portal fuera de pantalla para capturar `PlantillaFicha`**

Justo antes del `</div>` final del componente (después del `</form>`, mismo nivel que el `return (<div className="p-6...">`), agrega:

```tsx
      {componiendoFicha && principalFicha?.url &&
        createPortal(
          <div style={{ position: 'fixed', top: -9999, left: -9999 }}>
            <div ref={renderFichaRef}>
              <PlantillaFicha
                fotoUrl={principalFicha.url}
                brand={resolverBrandAnuncio(modo)}
                badge={modo === 'airbnb' ? 'AIRBNB' : periodo === 'total' ? 'VENTA' : 'RENTA'}
                precio={Number(precio) || 0}
                moneda={moneda}
                periodo={periodo}
                colonia={colonia}
                ciudad={ciudad}
                recamaras={Number(recamaras) || 0}
                banos={Number(banos) || 0}
              />
            </div>
          </div>,
          document.body
        )}
```

(`principalFicha` se recalcula en cada render a partir de `imagenes` -- es intencional, mismo patrón que `slideGenerando` en `DiapositivasEditor.tsx`: el portal siempre debe leer el estado más reciente en el momento en que React lo pinta, no un valor capturado antes.)

- [ ] **Step 7: Verificar tsc**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 8: Verificación manual**

Con un servidor local corriendo contra la base real (`npx vercel dev`), en `/propiedades/ficha/nuevo`:
1. Sube una foto -- confirma que aparece el spinner sobre la foto principal y que, al terminar, `imagenes[0].imagenCompuestaUrl` (revisa la Network tab o agrega un `console.log` temporal) es una URL real de Vercel Blob.
2. Cambia el precio y sal del campo (blur) -- confirma que se dispara una nueva composición.
3. Cambia Periodo a "Precio total" -- confirma que también se dispara.
4. Repite en `/airbnb/anuncios/nuevo` -- confirma que la plantilla usa el logo de Hospitalidad Digital, no el de Felmat.

Si no hay forma de correr un navegador real en este paso, deja explícito en el reporte qué se verificó por tsc/build/lectura de código y qué queda pendiente de que el usuario lo confirme.

- [ ] **Step 9: Commit**

```bash
git add src/components/anuncios/AnuncioForm.tsx
git commit -m "$(cat <<'EOF'
feat: compone y sube a Blob la foto principal de Propiedades/Airbnb

La rama PROPIEDAD de AnuncioForm (compartida entre Propiedades/Ficha y
Airbnb) ahora genera imagenCompuestaUrl con PlantillaFicha al subir la
foto principal o al salir de precio/colonia/ciudad/periodo -- mismo
patron ya en produccion para Condominios. Marca y badge dependen de
modo (Felmat+VENTA/RENTA para Propiedades, Hospitalidad Digital+AIRBNB
para Airbnb).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `api/_lib/metaPublish.js` -- funciones puras del Graph API

**Files:**
- Create: `api/_lib/metaPublish.js`
- Test: `api/_lib/metaPublish.test.js`

**Interfaces:**
- Consumes: nada de otras tareas -- solo `fetch` nativo.
- Produces: `publicarFacebookImagenUnica`, `publicarFacebookCarrusel`, `publicarInstagramImagenUnica`, `publicarInstagramCarrusel` -- todas `async ({ accountId, accessToken, imageUrl(s), caption }) => { success: true, externalId, externalUrl } | { success: false, errorMsg }`. Las consume Task 5 (`api/publicar.js`).

- [ ] **Step 1: Crear `api/_lib/metaPublish.js`**

```javascript
const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function graphPost(pathSegment, params, accessToken) {
  const body = new URLSearchParams({ ...params, access_token: accessToken });
  const res = await fetch(`${GRAPH_BASE}/${pathSegment}`, { method: 'POST', body });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Error de Meta (${res.status})`);
  }
  return json;
}

async function graphGet(pathSegment, params, accessToken) {
  const qs = new URLSearchParams({ ...params, access_token: accessToken });
  const res = await fetch(`${GRAPH_BASE}/${pathSegment}?${qs}`);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Error de Meta (${res.status})`);
  }
  return json;
}

async function obtenerPermalinkInstagram(mediaId, accessToken) {
  try {
    const info = await graphGet(mediaId, { fields: 'permalink' }, accessToken);
    return info.permalink || null;
  } catch {
    return null;
  }
}

export async function publicarFacebookImagenUnica({ accountId, accessToken, imageUrl, caption }) {
  try {
    const result = await graphPost(`${accountId}/photos`, { url: imageUrl, caption }, accessToken);
    const externalId = result.post_id || result.id;
    return { success: true, externalId, externalUrl: `https://www.facebook.com/${externalId}` };
  } catch (error) {
    return { success: false, errorMsg: error.message };
  }
}

export async function publicarFacebookCarrusel({ accountId, accessToken, imageUrls, caption }) {
  try {
    const photoIds = [];
    for (const imageUrl of imageUrls) {
      const foto = await graphPost(`${accountId}/photos`, { url: imageUrl, published: 'false' }, accessToken);
      photoIds.push(foto.id);
    }
    const attachedMedia = JSON.stringify(photoIds.map((id) => ({ media_fbid: id })));
    const post = await graphPost(`${accountId}/feed`, { message: caption, attached_media: attachedMedia }, accessToken);
    return { success: true, externalId: post.id, externalUrl: `https://www.facebook.com/${post.id}` };
  } catch (error) {
    return { success: false, errorMsg: error.message };
  }
}

export async function publicarInstagramImagenUnica({ accountId, accessToken, imageUrl, caption }) {
  try {
    const creado = await graphPost(`${accountId}/media`, { image_url: imageUrl, caption }, accessToken);
    const publicado = await graphPost(`${accountId}/media_publish`, { creation_id: creado.id }, accessToken);
    const permalink = await obtenerPermalinkInstagram(publicado.id, accessToken);
    return { success: true, externalId: publicado.id, externalUrl: permalink || 'https://www.instagram.com/' };
  } catch (error) {
    return { success: false, errorMsg: error.message };
  }
}

export async function publicarInstagramCarrusel({ accountId, accessToken, imageUrls, caption }) {
  if (imageUrls.length < 2 || imageUrls.length > 10) {
    return { success: false, errorMsg: 'Instagram requiere entre 2 y 10 imágenes para un carrusel' };
  }
  try {
    const itemIds = [];
    for (const imageUrl of imageUrls) {
      const item = await graphPost(`${accountId}/media`, { image_url: imageUrl, is_carousel_item: 'true' }, accessToken);
      itemIds.push(item.id);
    }
    const carrusel = await graphPost(`${accountId}/media`, { media_type: 'CAROUSEL', children: itemIds.join(','), caption }, accessToken);
    const publicado = await graphPost(`${accountId}/media_publish`, { creation_id: carrusel.id }, accessToken);
    const permalink = await obtenerPermalinkInstagram(publicado.id, accessToken);
    return { success: true, externalId: publicado.id, externalUrl: permalink || 'https://www.instagram.com/' };
  } catch (error) {
    return { success: false, errorMsg: error.message };
  }
}
```

- [ ] **Step 2: Crear `api/_lib/metaPublish.test.js`**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  publicarFacebookImagenUnica, publicarFacebookCarrusel,
  publicarInstagramImagenUnica, publicarInstagramCarrusel,
} from './metaPublish.js';

function mockFetchOnce(body, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

describe('metaPublish', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('publicarFacebookImagenUnica: éxito construye externalUrl con post_id', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockFetchOnce({ id: 'photo1', post_id: '123_456' }));
    const resultado = await publicarFacebookImagenUnica({ accountId: '123', accessToken: 'tok', imageUrl: 'https://x/img.jpg', caption: 'hola' });
    expect(resultado).toEqual({ success: true, externalId: '123_456', externalUrl: 'https://www.facebook.com/123_456' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v21.0/123/photos');
    expect(options.method).toBe('POST');
    const body = new URLSearchParams(options.body);
    expect(body.get('url')).toBe('https://x/img.jpg');
    expect(body.get('caption')).toBe('hola');
    expect(body.get('access_token')).toBe('tok');
  });

  it('publicarFacebookImagenUnica: error de Meta regresa success false con el mensaje real', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockFetchOnce({ error: { message: 'Invalid OAuth access token' } }, false, 400));
    const resultado = await publicarFacebookImagenUnica({ accountId: '123', accessToken: 'malo', imageUrl: 'https://x/img.jpg', caption: '' });
    expect(resultado).toEqual({ success: false, errorMsg: 'Invalid OAuth access token' });
  });

  it('publicarFacebookCarrusel: sube cada foto sin publicar y las adjunta en un solo post', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockFetchOnce({ id: 'p1' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'p2' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: '123_789' }));
    const resultado = await publicarFacebookCarrusel({ accountId: '123', accessToken: 'tok', imageUrls: ['https://x/1.jpg', 'https://x/2.jpg'], caption: 'carrusel' });
    expect(resultado).toEqual({ success: true, externalId: '123_789', externalUrl: 'https://www.facebook.com/123_789' });
    expect(global.fetch).toHaveBeenCalledTimes(3);
    const feedCall = global.fetch.mock.calls[2];
    expect(feedCall[0]).toBe('https://graph.facebook.com/v21.0/123/feed');
    const feedBody = new URLSearchParams(feedCall[1].body);
    expect(JSON.parse(feedBody.get('attached_media'))).toEqual([{ media_fbid: 'p1' }, { media_fbid: 'p2' }]);
  });

  it('publicarInstagramImagenUnica: crea, publica y obtiene el permalink real', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockFetchOnce({ id: 'creation1' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'media1' }))
      .mockResolvedValueOnce(mockFetchOnce({ permalink: 'https://www.instagram.com/p/ABC123/' }));
    const resultado = await publicarInstagramImagenUnica({ accountId: '999', accessToken: 'tok', imageUrl: 'https://x/img.jpg', caption: 'hola ig' });
    expect(resultado).toEqual({ success: true, externalId: 'media1', externalUrl: 'https://www.instagram.com/p/ABC123/' });
  });

  it('publicarInstagramCarrusel: rechaza con menos de 2 imágenes sin llamar a fetch', async () => {
    global.fetch = vi.fn();
    const resultado = await publicarInstagramCarrusel({ accountId: '999', accessToken: 'tok', imageUrls: ['https://x/1.jpg'], caption: '' });
    expect(resultado.success).toBe(false);
    expect(resultado.errorMsg).toMatch(/entre 2 y 10/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('publicarInstagramCarrusel: crea un item por imagen, agrupa en un contenedor, publica', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockFetchOnce({ id: 'item1' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'item2' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'carousel1' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'media2' }))
      .mockResolvedValueOnce(mockFetchOnce({ permalink: 'https://www.instagram.com/p/XYZ/' }));
    const resultado = await publicarInstagramCarrusel({ accountId: '999', accessToken: 'tok', imageUrls: ['https://x/1.jpg', 'https://x/2.jpg'], caption: 'carrusel ig' });
    expect(resultado).toEqual({ success: true, externalId: 'media2', externalUrl: 'https://www.instagram.com/p/XYZ/' });
    const carouselCall = global.fetch.mock.calls[2];
    const carouselBody = new URLSearchParams(carouselCall[1].body);
    expect(carouselBody.get('children')).toBe('item1,item2');
    expect(carouselBody.get('media_type')).toBe('CAROUSEL');
  });
});
```

- [ ] **Step 3: Correr los tests**

Run: `npx vitest run api/_lib/metaPublish.test.js`
Expected: `6 passed`

- [ ] **Step 4: Verificar tsc**

Run: `npx tsc --noEmit`
Expected: sin errores (este archivo es `.js` plano, no debería generar errores de TS).

- [ ] **Step 5: Commit**

```bash
git add api/_lib/metaPublish.js api/_lib/metaPublish.test.js
git commit -m "$(cat <<'EOF'
feat: metaPublish.js -- funciones reales del Graph API de Meta

4 funciones puras (Facebook/Instagram x imagen unica/carrusel), sin
saber nada de Prisma ni de secciones. El carrusel de Instagram exige
2-10 imagenes (validado antes de llamar a Meta). 6/6 tests con fetch
mockeado, verificando forma real de las llamadas y manejo de exito/
error.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `api/publicar.js` -- orquestación real

**Files:**
- Modify: `api/publicar.js` (reescritura completa)

**Interfaces:**
- Consumes: las 4 funciones de `api/_lib/metaPublish.js` (Task 4).
- Produces: `POST /api/publicar` sigue aceptando `{ anuncioId, canales }`. Para `FACEBOOK`/`INSTAGRAM`, `PublicacionCanal` termina con `estado: 'PUBLICADO'` (+ `externalId`, `externalUrl`, `publicadoAt`) o `estado: 'ERROR'` (+ `errorMsg`) real -- nunca más `PENDIENTE` a secas para esos dos canales.

**Cambio de comportamiento deliberado, documentado aquí para que el reviewer no lo marque como desviación no pedida:** antes, CUALQUIER intento de publicar (incluso a un canal simulado) pasaba el anuncio de `BORRADOR` a `REVISION`. Ahora esa transición solo ocurre si al menos un canal quedó realmente en `PUBLICADO` -- tiene más sentido semántico una vez que existen estados reales, y el spec lo aprobó como parte de esta pieza.

- [ ] **Step 1: Reescribir `api/publicar.js` completo**

```javascript
import { PrismaClient } from '@prisma/client';
import { requireApiKey } from './_lib/auth.js';
import {
  publicarFacebookImagenUnica, publicarFacebookCarrusel,
  publicarInstagramImagenUnica, publicarInstagramCarrusel,
} from './_lib/metaPublish.js';

const prisma = new PrismaClient();

// modo='admin' en el modelo Anuncio significa "Condominios" (nombre
// heredado del sidebar) -- FelmatSocialConfig usa 'condominios' como
// section real. Ver resolverContextoAnuncio en src/lib/anunciosApi.ts.
const SECCION_POR_MODO = { admin: 'condominios', airbnb: 'airbnb', propiedades: 'propiedades' };

function resolverImagenes(anuncio) {
  if (anuncio.categoria === 'SERVICIO') {
    return anuncio.imagenes
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((img) => img.imagenCompuestaUrl)
      .filter(Boolean);
  }
  const principal = anuncio.imagenes.find((img) => img.esPrincipal);
  return principal?.imagenCompuestaUrl ? [principal.imagenCompuestaUrl] : [];
}

async function publicarEnMeta(canal, config, imageUrls, caption) {
  const credenciales = { accountId: config.accountId, accessToken: config.accessToken };
  if (canal === 'FACEBOOK') {
    return imageUrls.length > 1
      ? publicarFacebookCarrusel({ ...credenciales, imageUrls, caption })
      : publicarFacebookImagenUnica({ ...credenciales, imageUrl: imageUrls[0], caption });
  }
  return imageUrls.length > 1
    ? publicarInstagramCarrusel({ ...credenciales, imageUrls, caption })
    : publicarInstagramImagenUnica({ ...credenciales, imageUrl: imageUrls[0], caption });
}

export default async function handler(req, res) {
  if (!requireApiKey(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { anuncioId, canales } = req.body;

    if (!anuncioId || !canales || !Array.isArray(canales)) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const anuncio = await prisma.anuncio.findUnique({
      where: { id: anuncioId },
      include: { imagenes: true },
    });

    if (!anuncio) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    const seccion = SECCION_POR_MODO[anuncio.modo] || anuncio.modo;

    const resultados = await Promise.all(
      canales.map(async (canal) => {
        const existente = await prisma.publicacionCanal.findUnique({
          where: { anuncioId_canal: { anuncioId, canal } },
        });

        if (existente?.estado === 'PUBLICADO') {
          return { canal, estado: 'ya_publicado', mensaje: 'Ya estaba publicado' };
        }

        if (canal !== 'FACEBOOK' && canal !== 'INSTAGRAM') {
          const publicacion = await prisma.publicacionCanal.upsert({
            where: { anuncioId_canal: { anuncioId, canal } },
            update: { estado: 'PENDIENTE', updatedAt: new Date() },
            create: { anuncioId, canal, estado: 'PENDIENTE' },
          });
          return { canal, estado: 'pendiente', publicacionId: publicacion.id };
        }

        const config = await prisma.felmatSocialConfig.findUnique({
          where: { userId_section_platform: { userId: anuncio.agentId, section: seccion, platform: canal.toLowerCase() } },
        });

        if (!config || !config.enabled || !config.accountId || !config.accessToken) {
          const mensaje = `Este asesor no tiene configurada su conexión de ${canal} para ${seccion}`;
          const publicacion = await prisma.publicacionCanal.upsert({
            where: { anuncioId_canal: { anuncioId, canal } },
            update: { estado: 'ERROR', errorMsg: mensaje, updatedAt: new Date() },
            create: { anuncioId, canal, estado: 'ERROR', errorMsg: mensaje },
          });
          return { canal, estado: 'error', publicacionId: publicacion.id };
        }

        const imageUrls = resolverImagenes(anuncio);
        if (imageUrls.length === 0) {
          const mensaje = 'Genera la imagen del anuncio antes de publicar';
          const publicacion = await prisma.publicacionCanal.upsert({
            where: { anuncioId_canal: { anuncioId, canal } },
            update: { estado: 'ERROR', errorMsg: mensaje, updatedAt: new Date() },
            create: { anuncioId, canal, estado: 'ERROR', errorMsg: mensaje },
          });
          return { canal, estado: 'error', publicacionId: publicacion.id };
        }

        const caption = anuncio.descripcion || '';
        const resultado = await publicarEnMeta(canal, config, imageUrls, caption);

        const publicacion = await prisma.publicacionCanal.upsert({
          where: { anuncioId_canal: { anuncioId, canal } },
          update: resultado.success
            ? { estado: 'PUBLICADO', externalId: resultado.externalId, externalUrl: resultado.externalUrl, errorMsg: null, publicadoAt: new Date(), updatedAt: new Date() }
            : { estado: 'ERROR', errorMsg: resultado.errorMsg, updatedAt: new Date() },
          create: resultado.success
            ? { anuncioId, canal, estado: 'PUBLICADO', externalId: resultado.externalId, externalUrl: resultado.externalUrl, publicadoAt: new Date() }
            : { anuncioId, canal, estado: 'ERROR', errorMsg: resultado.errorMsg },
        });

        return { canal, estado: resultado.success ? 'publicado' : 'error', publicacionId: publicacion.id };
      })
    );

    if (anuncio.estado === 'BORRADOR' && resultados.some((r) => r.estado === 'publicado')) {
      await prisma.anuncio.update({
        where: { id: anuncioId },
        data: { estado: 'REVISION' },
      });
    }

    return res.status(200).json({
      success: true,
      resultados,
      mensaje: 'Publicaciones procesadas',
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error al publicar' });
  }
}
```

- [ ] **Step 2: Verificar tsc**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Verificación en vivo -- caso "sin configurar"**

Con un servidor local corriendo contra la base real (`npx vercel dev`), y un anuncio real de prueba (usa un `agentId` real que exista y que NO tenga `FelmatSocialConfig` para `propiedades`/`facebook`):

```bash
curl -s -X POST http://localhost:3000/api/publicar \
  -H "Authorization: Bearer <ANUNCIOS_API_KEY>" -H "Content-Type: application/json" \
  -d '{"anuncioId":"<id-real>","canales":["FACEBOOK"]}'
```

Expected: `200` con `resultados: [{ canal: 'FACEBOOK', estado: 'error', ... }]`, y al consultar `GET /api/anuncios/<id-real>` el canal `FACEBOOK` en `publicaciones` trae `estado: 'ERROR'` y `errorMsg` con el mensaje real ("Este asesor no tiene configurada...").

- [ ] **Step 4: Verificación en vivo -- caso "sin imagen compuesta"**

Con un anuncio real donde SÍ exista `FelmatSocialConfig` habilitado para ese asesor/sección/plataforma pero cuya foto principal todavía no tenga `imagenCompuestaUrl` (anuncio recién creado, foto subida pero sin esperar a que termine de componerse): repite el `curl` -- confirma `errorMsg: 'Genera la imagen del anuncio antes de publicar'`.

- [ ] **Step 5: Si el usuario ya cargó credenciales reales de Meta** (App ID/Account ID/Access Token reales de una Page o cuenta de Instagram Business real): repite el `curl` contra ese anuncio -- confirma `estado: 'PUBLICADO'`, `externalId` real, y que `externalUrl` abre la publicación real en Meta. Si todavía no hay credenciales reales cargadas, deja este paso explícitamente pendiente en el reporte -- no es bloqueante para el resto del plan.

- [ ] **Step 6: Commit**

```bash
git add api/publicar.js
git commit -m "$(cat <<'EOF'
feat: api/publicar.js publica de verdad a Facebook/Instagram

Reemplaza el simulacro (PENDIENTE fijo) por llamadas reales via
metaPublish.js: resuelve la seccion real del anuncio (modo=admin ->
condominios), busca las credenciales del asesor dueño, elige la(s)
imagen(es) segun categoria (principal para PROPIEDAD, carrusel
ordenado para SERVICIO), y guarda el resultado real -- PUBLICADO con
externalId/externalUrl o ERROR con el mensaje real de Meta. La
transicion BORRADOR->REVISION ahora solo ocurre si algun canal quedo
PUBLICADO de verdad (antes ocurria con cualquier intento).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Mostrar el error real en la UI

**Files:**
- Modify: `src/lib/anunciosApi.ts`
- Modify: `src/components/anuncios/ListaAnuncios.tsx`
- Modify: `src/components/anuncios/AnuncioDetail.tsx`

**Interfaces:**
- Consumes: `PublicacionCanal.errorMsg` (ya lo escribe Task 5).
- Produces: el asesor ve, en un tooltip, por qué falló un canal -- en vez de que un `ERROR` real se vea igual que "nunca se intentó".

- [ ] **Step 1: Agregar `errorMsg` al tipo `PublicacionAnuncio`**

En `src/lib/anunciosApi.ts`, cambia:

```typescript
export interface PublicacionAnuncio {
  canal: string;
  estado: string;
  externalUrl?: string;
  publicadoAt?: string;
}
```

por:

```typescript
export interface PublicacionAnuncio {
  canal: string;
  estado: string;
  externalUrl?: string;
  errorMsg?: string;
  publicadoAt?: string;
}
```

- [ ] **Step 2: `ListaAnuncios.tsx` -- incluir `errorMsg` en `getEstadoPublicacion` y en los dos tooltips**

Cambia el `return` de `getEstadoPublicacion` (línea ~173):

```typescript
    return { estado: pub.estado.toLowerCase(), errorMsg: pub.errorMsg, ...estados[pub.estado] || { color: 'bg-gray-400', textColor: 'text-gray-500', label: pub.estado } };
```

En `GridView` (línea ~248), cambia el `title`:

```tsx
                    <div key={canal} className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors", pub.estado === 'publicado' ? "bg-green-100 border-green-500" : "bg-gray-50 border-gray-200")} title={pub.estado === 'error' && pub.errorMsg ? `${CANALES[canal].label}: ${pub.label} — ${pub.errorMsg}` : `${CANALES[canal].label}: ${pub.label}`}>
```

En `ListView` (línea ~316), el mismo cambio:

```tsx
                        <div key={canal} className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors", pub.estado === 'publicado' ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50")} title={pub.estado === 'error' && pub.errorMsg ? `${CANALES[canal].label}: ${pub.label} — ${pub.errorMsg}` : `${CANALES[canal].label}: ${pub.label}`}>
```

- [ ] **Step 3: `AnuncioDetail.tsx` -- estado "Error" distinto, con `errorMsg` en tooltip**

Reemplaza el bloque del `.map` de canales (líneas ~194-211):

```tsx
              {CANALES.map(canal => {
                const pub = anuncio.publicaciones.find(p => p.canal === canal);
                const publicado = pub?.estado === 'PUBLICADO';
                const pendiente = pub?.estado === 'PENDIENTE';
                const conError = pub?.estado === 'ERROR';
                return (
                  <div key={canal} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {publicado && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                      {CANAL_LABELS[canal]}
                    </span>
                    {publicado ? (
                      <span className="text-xs text-green-600">Publicado</span>
                    ) : pendiente ? (
                      <span className="text-xs text-amber-600">Pendiente</span>
                    ) : conError ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={publicando}
                        onClick={() => handlePublicarCanal(canal)}
                        title={pub?.errorMsg || 'Error al publicar'}
                        className="text-red-600 hover:text-red-700"
                      >
                        Reintentar
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" disabled={publicando} onClick={() => handlePublicarCanal(canal)}>
                        Publicar
                      </Button>
                    )}
                  </div>
                );
              })}
```

- [ ] **Step 4: Verificar tsc**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/lib/anunciosApi.ts src/components/anuncios/ListaAnuncios.tsx src/components/anuncios/AnuncioDetail.tsx
git commit -m "$(cat <<'EOF'
feat: muestra el error real de Meta en la UI de Publicar

Antes un canal en ERROR se veia identico a uno nunca intentado
(mismo boton "Publicar"). Ahora AnuncioDetail distingue "Reintentar"
en rojo con el mensaje real de Meta en el tooltip, y los badges de
canal en ListaAnuncios (grid y lista) tambien lo muestran.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Verificación final end-to-end

**Files:** ninguno nuevo -- validación de todo lo anterior en conjunto.

- [ ] **Step 1: Compilación, tests y build completos**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: los tres sin errores (vitest debe incluir los 9 tests nuevos de esta pieza -- 3 de `adBrands.test.ts` + 6 de `metaPublish.test.js` -- más todos los que ya existían).

- [ ] **Step 2: Recorrido completo de la Prueba del spec**

Repetir, en orden, los 7 puntos de la sección "Prueba" de `docs/superpowers/specs/2026-09-14-publicacion-real-redes-sociales-design.md`:

1. Crear una Ficha de Propiedades real, confirmar `imagenCompuestaUrl` real en Blob (ya cubierto en Task 3, Step 8 -- reconfirmar aquí tras los cambios de las tareas siguientes).
2. Repetir para Airbnb -- marca Hospitalidad Digital, badge AIRBNB, precio `/noche`.
3. Si hay credenciales reales de Meta: publicar una Ficha real a Facebook e Instagram (ya cubierto en Task 5, Step 5 -- reconfirmar).
4. Publicar un anuncio de Condominios con 3+ diapositivas -- confirmar carrusel real en ambas redes (no solo la primera imagen).
5. Publicar un anuncio de Condominios con exactamente 1 diapositiva -- confirmar imagen única en Instagram, no error.
6. Probar el canal sin configurar -- confirmar `ERROR` con mensaje claro (ya cubierto en Task 5, Step 3).
7. Confirmar que la UI (Task 6) muestra el error real en el tooltip para un canal en `ERROR`.

- [ ] **Step 3: Informar al usuario y cerrar la pieza**

Resumir qué se construyó, qué se pudo probar en vivo con credenciales reales y qué falta que el usuario confirme (si todavía no había cargado credenciales de Meta al momento de esta tarea).
