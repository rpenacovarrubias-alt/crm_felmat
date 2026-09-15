# Diseño: Publicación real a Facebook/Instagram (Propiedades, Airbnb, Condominios)

**Fecha:** 2026-09-14
**Estado:** Aprobado por el usuario, listo para plan de implementación.
**Pieza:** "Pieza 3" del trabajo mayor de Anuncios/Redes Sociales -- la pieza
que faltaba desde el spec original de Redes Sociales Fase 1
(`2026-09-11-redes-sociales-config-fase1-design.md`, sección "Fuera de
alcance") y desde el spec de plantillas de anuncios
(`2026-09-11-plantillas-anuncios-redes-sociales-design.md`, que dejó
`PlantillaFicha.tsx` sin construir).

## Contexto

Hoy existen, ya en producción:

- `FelmatSocialConfig` -- credenciales reales de Meta (App ID, App Secret,
  Account ID/Page ID, Access Token) guardadas **por asesor y por sección**
  (`propiedades` | `condominios` | `airbnb`, cada una con Facebook e
  Instagram independientes). Airbnb nunca comparte cuenta con Propiedades
  ni Condominios -- esto ya está resuelto desde Fase 1, no se toca aquí.
- El botón "Publicar en..." en `ListaAnuncios.tsx`/`AnuncioDetail.tsx`, y el
  modelo `PublicacionCanal` (con `externalId`, `externalUrl`, `errorMsg`,
  `publicadoAt` ya en el esquema) -- pero `api/publicar.js` es un
  simulacro: solo pone el canal en `PENDIENTE`, nunca llama a Meta.
- Condominios (`categoria: SERVICIO`) ya genera, por diapositiva, una
  imagen compuesta con marca en Vercel Blob (`ImagenAnuncio.imagenCompuestaUrl`,
  vía `PlantillaCondominios` + `html2canvas` + `subirImagenAnuncio`).
- Propiedades (Ficha) y Airbnb (`categoria: PROPIEDAD`) **no** tienen esto
  todavía: sus fotos siguen guardándose como base64 directo en Postgres
  (`ImagenesUploader` en `AnuncioForm.tsx`, `FileReader.readAsDataURL`),
  sin subir nunca a Blob ni componerse con marca. `PlantillaFicha.tsx`
  (la plantilla foto+precio+badge del spec original) nunca se construyó.

Meta necesita una URL pública real para leer una imagen al publicar -- así
que Propiedades y Airbnb no pueden publicar nada de verdad hasta que
tengan su propia imagen compuesta en Blob, igual que ya tiene Condominios.

## Decisiones confirmadas con el usuario

1. **Se construye una sola vez, sirve para las 3 secciones.** La lógica
   real de llamar al Graph API de Meta (`api/_lib/metaPublish.js` +
   `api/publicar.js` reescrito) no sabe nada de "sección" -- solo recibe
   credenciales + imagen(es) + caption. Cada sección solo aporta lo que le
   falta para tener una imagen compuesta lista.
2. **Propiedades (Ficha) y Airbnb comparten la misma pieza visual nueva**,
   porque ya comparten el mismo formulario y el mismo tipo de anuncio
   (`categoria: PROPIEDAD`, rama de `AnuncioForm.tsx` hoy sin componer):
   `PlantillaFicha.tsx`, con la marca y el badge como parámetros --
   Felmat + VENTA/RENTA para Propiedades, Hospitalidad Digital + "AIRBNB"
   para Airbnb. Se construye ahora para ambas al mismo tiempo, no una
   después de la otra.
3. **Badge VENTA/RENTA** (solo Propiedades) sale de `periodo`:
   `periodo === 'total'` → VENTA, cualquier otro valor (`/mes`, `/noche`)
   → RENTA. Airbnb no usa esta lógica -- su badge es siempre "AIRBNB" con
   precio `/noche`.
4. **Condominios publica el carrusel real completo**, no solo la
   diapositiva principal -- Instagram (2 a 10 imágenes, coincide con el
   máximo de 10 diapositivas del editor) y Facebook (varias fotos en una
   sola publicación) con sus mecánicas reales, no simplificadas.
   Caso borde: un anuncio de Condominios con **una sola diapositiva** no
   se puede publicar como carrusel en Instagram (mínimo 2) -- en ese caso
   se publica como imagen única automáticamente en ambas redes, no como
   error.
5. **El caption es el campo `descripcion` del anuncio, tal cual lo escribió
   el asesor** -- no se genera con IA en esta pieza (esa es otra pieza ya
   identificada, "Pieza 2").
6. **Sin renovación automática de tokens de Meta.** Un token vencido o
   inválido se refleja tal cual en `errorMsg` con el mensaje real que
   regresa el Graph API -- no hay refresh flow en esta pieza.
7. **Solo los canales FACEBOOK e INSTAGRAM reciben publicación real** --
   `WEB`/`GOOGLE_BUSINESS` (si algún día se usan) se quedan exactamente
   como están hoy (marcan `PENDIENTE`, sin llamar a nada).

## Corrección a una suposición del prototipo original

El mockup estático original de "Ficha" mostraba un ícono de "130 m²" --
ese campo **no existe** en el modelo `Anuncio` real (nunca se construyó un
campo de superficie). `PlantillaFicha.tsx` muestra únicamente datos reales
del anuncio: precio, ubicación (colonia/ciudad), recámaras, baños. No se
inventa ni se agrega un campo de m² para esta pieza.

## Modelo de "marca" (brand config) -- por fin implementado en código

Esto ya estaba documentado en el spec de plantillas de anuncios pero nunca
se escribió como código real:

```typescript
// src/lib/adBrands.ts
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

// Resuelto por `modo` del anuncio -- no por sección de FelmatSocialConfig,
// que es un concepto de credenciales, no de identidad visual.
export function resolverBrandAnuncio(modo: 'admin' | 'airbnb' | 'propiedades'): AdBrand {
  return modo === 'airbnb' ? HOSPITALIDAD_DIGITAL_BRAND : FELMAT_BRAND;
}
```

`PlantillaCondominios.tsx` (ya existente) sigue con el logo de Felmat
hardcodeado tal cual está -- no se refactoriza para usar `adBrands.ts` en
esta pieza (funciona, tocarlo sin necesidad sería alcance extra).

## `PlantillaFicha.tsx` -- nueva

1080×1080 fijo (mismo patrón que `PlantillaCondominios.tsx`), recibe:

```typescript
interface PlantillaFichaProps {
  fotoUrl: string;
  brand: AdBrand;
  badge: string;              // 'VENTA' | 'RENTA' | 'AIRBNB'
  precio: number;
  moneda: string;
  periodo: string;            // '/mes' | '/noche' | 'total'
  colonia: string;
  ciudad: string;
  recamaras: number;
  banos: number;
}
```

Layout: foto real a pantalla completa, degradado inferior oscuro, badge
(color de `brand.primaryColor`) arriba-izquierda con el texto de `badge`,
precio grande abajo (formateado con `moneda`, y el sufijo del `periodo`
salvo cuando es `'total'`), ubicación como texto secundario, fila de
íconos recámaras/baños (sin m², ver corrección arriba), logo de `brand`
pequeño en la esquina inferior derecha sobre una placa blanca (mismo
tratamiento que ya usa Condominios para el logo).

## Compositing en `AnuncioForm.tsx` (rama PROPIEDAD)

Esta rama ya es compartida entre Propiedades y Airbnb -- construir esto
una vez cubre las dos secciones. Sigue el mismo patrón ya aprobado y en
producción para Condominios (`DiapositivasEditor.tsx`):

- Al subir/cambiar la foto marcada `esPrincipal`, o al salir (`blur`) de
  los campos precio/colonia/ciudad/periodo, se recompone: se monta
  `PlantillaFicha` fuera de pantalla con `resolverBrandAnuncio(modo)` y el
  badge correspondiente, se captura con `generarImagenAnuncio` (JPEG
  0.85, ya existente), se sube con `subirImagenAnuncio` (ya existente), y
  el resultado se guarda en el `imagenCompuestaUrl` de esa imagen
  principal.
- Solo la foto principal se compone y sube a Blob. Las demás fotos de la
  galería (si el asesor sube varias) siguen exactamente como hoy --
  base64 en Postgres, sin cambio. Esto es un límite intencional: subir
  *todas* las fotos de la galería a Blob es un problema real pero
  separado (afecta también al resto de la app, no solo a esta pieza) y no
  bloquea la publicación, que solo necesita la principal.

## `api/_lib/metaPublish.js` -- nuevo, funciones puras

No sabe nada de Prisma ni de `Anuncio` -- solo recibe credenciales,
imagen(es) y caption, y regresa el resultado real de Meta.

```javascript
// Facebook -- imagen única
export async function publicarFacebookImagenUnica({ accountId, accessToken, imageUrl, caption }) {
  // POST https://graph.facebook.com/v21.0/{accountId}/photos
  // body: { url: imageUrl, caption, access_token: accessToken }
  // éxito: { success: true, externalId, externalUrl }
  // error: { success: false, errorMsg } -- el mensaje real que regresa Meta
}

// Facebook -- múltiples fotos en una sola publicación (el "carrusel" de Facebook)
export async function publicarFacebookCarrusel({ accountId, accessToken, imageUrls, caption }) {
  // 1. Por cada imageUrl: POST /{accountId}/photos con published=false -> junta los photo_id
  // 2. POST /{accountId}/feed con attached_media: photo_ids.map(id => ({ media_fbid: id })), message: caption
}

// Instagram -- imagen única
export async function publicarInstagramImagenUnica({ accountId, accessToken, imageUrl, caption }) {
  // 1. POST /{accountId}/media { image_url: imageUrl, caption } -> creation_id
  // 2. POST /{accountId}/media_publish { creation_id }
}

// Instagram -- carrusel real (2 a 10 imágenes)
export async function publicarInstagramCarrusel({ accountId, accessToken, imageUrls, caption }) {
  // 1. Por cada imageUrl: POST /{accountId}/media { image_url, is_carousel_item: true } -> item container id
  // 2. POST /{accountId}/media { media_type: 'CAROUSEL', children: [...item ids], caption } -> carousel container id
  // 3. POST /{accountId}/media_publish { creation_id: carousel container id }
}
```

Versión del Graph API: `v21.0`, fijada como constante en el archivo (fácil
de subir de versión después si Meta la deprecia).

## `api/publicar.js` -- reescrito

Reemplaza el simulacro actual. Por cada canal solicitado:

1. Si el canal no es `FACEBOOK` ni `INSTAGRAM`, se comporta exactamente
   como hoy (marca `PENDIENTE`) -- sin cambio.
2. Resuelve la sección real del anuncio a partir de su `modo`:
   `modo: 'admin'` → `section: 'condominios'`, `modo: 'airbnb'` →
   `section: 'airbnb'`, `modo: 'propiedades'` → `section: 'propiedades'`.
3. Busca `FelmatSocialConfig` para `{ userId: anuncio.agentId, section,
   platform: canal.toLowerCase() }`. Si no existe o `enabled: false`, el
   canal queda en `ERROR` con un mensaje claro ("Este asesor no tiene
   configurada su conexión de [red] para [sección]") -- nunca se intenta
   publicar a ciegas.
4. Resuelve qué imagen(es) publicar según `categoria`:
   - `PROPIEDAD` (Propiedades/Ficha, Airbnb): la `imagenCompuestaUrl` de
     la foto `esPrincipal`. Si no existe (nunca se compuso), `ERROR` con
     mensaje claro ("Genera la imagen del anuncio antes de publicar").
   - `SERVICIO` (Condominios): el arreglo de `imagenCompuestaUrl` de
     todas las diapositivas, en orden. Si alguna diapositiva no tiene
     `imagenCompuestaUrl` todavía, se excluye de la publicación (no
     bloquea las demás) -- pero si ninguna la tiene, `ERROR`.
5. Elige la función de `metaPublish.js` según categoría y cantidad de
   imágenes: 1 imagen → `*ImagenUnica`; 2 o más → `*Carrusel` (excepto
   Instagram con exactamente 1 imagen disponible, que siempre usa
   `publicarInstagramImagenUnica`, nunca carrusel).
6. Guarda el resultado real en `PublicacionCanal`: éxito →
   `estado: 'PUBLICADO'`, `externalId`, `externalUrl`, `publicadoAt: now()`;
   fallo → `estado: 'ERROR'`, `errorMsg` con el mensaje real de Meta (o el
   mensaje claro de los pasos 3/4 si nunca se llegó a llamar a Meta).

## Fuera de alcance

- Mejora de caption con IA (Pieza 2, ya identificada).
- Renovación automática de tokens de Meta.
- Refactorizar `PlantillaCondominios.tsx` para usar `adBrands.ts` (ya
  funciona, no se toca).
- Subir *todas* las fotos de la galería de Propiedades/Airbnb a Blob (solo
  la principal, ver arriba) -- riesgo real pre-existente, separado.
- Publicar automáticamente al guardar el anuncio -- "Publicar en..." sigue
  siendo una acción manual del asesor, como hoy.

## Prueba

**Prerrequisito real:** para probar la publicación de verdad contra Meta
(no solo el código), se necesita al menos una sección con credenciales
reales ya cargadas en `/propiedades/redes-sociales` (o condominios/airbnb)
-- App ID, Account ID/Page ID y Access Token reales de una app de Meta ya
aprobada para esas páginas. Sin esto, la prueba se queda en verificar que
el código maneja correctamente el caso "sin configurar" (paso 3 de
`api/publicar.js`).

1. `npx tsc --noEmit` y `npm run build` limpios.
2. Crear una Ficha de Propiedades real, confirmar que subir la foto
   principal genera `imagenCompuestaUrl` (foto + badge VENTA o RENTA +
   precio + logo Felmat) en Vercel Blob.
3. Repetir para Airbnb -- confirmar marca Hospitalidad Digital, badge
   "AIRBNB", precio con `/noche`.
4. Si hay credenciales reales de Meta disponibles: publicar una Ficha real
   a Facebook e Instagram, confirmar `PublicacionCanal` con `PUBLICADO`,
   `externalId` real, y que el `externalUrl` abre la publicación real en
   Meta.
5. Publicar un anuncio de Condominios con 3+ diapositivas -- confirmar
   carrusel real en ambas redes (no solo la primera imagen).
6. Publicar un anuncio de Condominios con exactamente 1 diapositiva --
   confirmar que Instagram lo publica como imagen única, no como error de
   "carrusel inválido".
7. Probar el canal sin configurar (un asesor sin `FelmatSocialConfig` para
   esa sección/plataforma) -- confirmar `ERROR` con mensaje claro, nunca
   un intento silencioso.
