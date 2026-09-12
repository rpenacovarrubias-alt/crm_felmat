# Anuncios tipo "servicio" para Condominios — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Condominios create a real "servicio de administración" anuncio (título + caption con emojis + de 1 a 10 diapositivas, cada una con su propia foto/encabezado/subtítulo compuestos con la plantilla de marca Felmat), sin reutilizar el formulario de ficha de propiedad que hoy no le sirve.

**Architecture:** Un solo modelo `Anuncio` con un nuevo campo `categoria` ('PROPIEDAD' | 'SERVICIO') que vuelve opcionales los campos de propiedad; `AnuncioForm.tsx` se ramifica por `categoria`; un nuevo componente `DiapositivasEditor` compone cada foto con `PlantillaCondominios` en el navegador (`html2canvas`, ya instalado) y sube tanto la foto cruda como el resultado compuesto a Vercel Blob a través de un endpoint nuevo.

**Tech Stack:** React 18 + TypeScript + Vite, Prisma/Postgres, Vercel serverless functions (JS plano), `html2canvas` (ya instalado, se declara como dependencia directa), `@vercel/blob` (nueva dependencia), `emoji-picker-react` (nueva dependencia).

## Global Constraints

- Spec de referencia: `docs/superpowers/specs/2026-09-12-anuncios-condominios-servicio-design.md` — cualquier duda sobre el "por qué" de una decisión se resuelve ahí, no se repite aquí.
- El campo discriminador se llama **`categoria`**, nunca `tipo` (colisiona con el filtro `tipo=tipoPropiedad` que ya existe en `api/anuncios.js`).
- Las imágenes compuestas se generan como **JPEG** (`toDataURL('image/jpeg', 0.85)`), nunca PNG — un PNG de una foto real puede superar el límite de ~4.5MB por request de las funciones de Vercel.
- El nuevo endpoint de subida usa **`requireApiKey`** (`api/_lib/auth.js`), igual que el resto del subsistema de Anuncios — nunca `getSession` (ese patrón es de otro subsistema y `anunciosApi.ts` no manda cookie de sesión).
- Nunca introducir el password real de un usuario en pruebas — usar `signSession()` para construir sesiones de prueba cuando se necesite autenticación real de otro subsistema.
- Migraciones de esquema (`npx prisma db push`) las ejecuta el usuario en su propia terminal, nunca un agente — es la convención ya establecida en este proyecto.
- Comentarios de commit terminan con `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `prisma/schema.prisma` | Modificar | `categoria` en `Anuncio`; `headline`/`subtitulo`/`imagenCompuestaUrl` en `ImagenAnuncio`; 5 columnas pasan a opcionales |
| `api/anuncios.js` | Modificar | Validación de campos de propiedad según `categoria`; pasa `headline`/`subtitulo`/`imagenCompuestaUrl` al crear imágenes |
| `api/anuncios/[id].js` | Modificar | Igual validación en PUT; `categoria` inmutable tras crear; mismos campos de imagen |
| `api/felmat-upload-anuncio-image.js` | Crear | Recibe una imagen en base64, la sube a Vercel Blob, regresa URL pública |
| `src/lib/anunciosApi.ts` | Modificar | Tipos `categoria`/campos opcionales/campos de diapositiva; nueva función `subirImagenAnuncio` |
| `src/lib/imageCompression.ts` | Crear | `compressImageToDataUrl`, extraída de `PropertyForm.tsx` para reusarla también en Condominios |
| `src/components/properties/PropertyForm.tsx` | Modificar | Importa `compressImageToDataUrl` del nuevo util en vez de definirla localmente |
| `src/components/anuncios/templates/PlantillaCondominios.tsx` | Crear | Componente visual 1080×1080 (foto + degradado + logo + encabezado/subtítulo + contacto) |
| `src/lib/generarImagenAnuncio.ts` | Crear | Envuelve `html2canvas` para renderizar un nodo montado a un data URL JPEG |
| `package.json` | Modificar | Declara `html2canvas`, agrega `@vercel/blob` y `emoji-picker-react` |
| `src/components/anuncios/ListaAnuncios.tsx` | Modificar | `GridView`/`ListView` no truenan con campos nulos; miniatura prefiere `imagenCompuestaUrl` |
| `src/components/anuncios/AnuncioDetail.tsx` | Modificar | Igual null-safety; imagen principal prefiere `imagenCompuestaUrl` |
| `src/components/anuncios/DiapositivasEditor.tsx` | Crear | Editor de 1 a 10 diapositivas (foto + encabezado + subtítulo + vista previa real + reordenar/eliminar) |
| `src/components/anuncios/AnuncioForm.tsx` | Modificar | Rama `categoria === 'SERVICIO'`: Información general + Texto de la publicación (con emojis) + `DiapositivasEditor` |

---

### Task 1: Migración de esquema — `categoria` y campos de diapositiva

**Files:**
- Modify: `prisma/schema.prisma:19-56` (modelo `Anuncio`)
- Modify: `prisma/schema.prisma:57-65` (modelo `ImagenAnuncio`)

**Interfaces:**
- Produces: columna `Anuncio.categoria` (`String`, default `"PROPIEDAD"`), columnas `Anuncio.colonia`/`ciudad`/`precio`/`tipoPropiedad`/`modalidadRenta` ahora nullable, columnas `ImagenAnuncio.headline`/`subtitulo`/`imagenCompuestaUrl` (todas `String?`).

- [ ] **Step 1: Editar el modelo `Anuncio`**

En `prisma/schema.prisma`, dentro de `model Anuncio { ... }`, cambia estas líneas:

```prisma
model Anuncio {
  id              String   @id @default(cuid())
  agentId         String
  modo            String   @default("admin")
  categoria       String   @default("PROPIEDAD") // 'PROPIEDAD' | 'SERVICIO'
  titulo          String
  subtitulo       String?
  slug            String   @unique
  descripcion     String?
  colonia         String?
  ciudad          String?
  estado          String   @default("BORRADOR")
  precio          Float?
  moneda          String   @default("MXN")
  periodo         String   @default("/mes")
  tipoPropiedad   String?
  modalidadRenta  String?
  recamaras       Int      @default(0)
  banos           Int      @default(0)
  destacado       Boolean  @default(false)
  fechaPublicacion DateTime?
  fechaExpiracion  DateTime?
  metaTitle       String?
  metaDescription String?
  vistas          Int      @default(0)
  contactos       Int      @default(0)
  imagenes        ImagenAnuncio[]
```

(deja el resto del modelo, incluyendo la relación `publicaciones` y cualquier `@@index`, exactamente como está — solo cambian `categoria` (nueva) y los `?` en `colonia`, `ciudad`, `precio`, `tipoPropiedad`, `modalidadRenta`).

- [ ] **Step 2: Editar el modelo `ImagenAnuncio`**

```prisma
model ImagenAnuncio {
  id                 String   @id @default(cuid())
  url                String
  esPrincipal        Boolean  @default(false)
  orden              Int      @default(0)
  headline           String?
  subtitulo          String?
  imagenCompuestaUrl String?
  anuncioId          String
  anuncio            Anuncio  @relation(fields: [anuncioId], references: [id], onDelete: Cascade)
  createdAt          DateTime @default(now())
}
```

- [ ] **Step 3: Formatear y validar el esquema**

Run: `npx prisma format && npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀` (o equivalente, sin errores)

- [ ] **Step 4: Generar el cliente de Prisma**

Run: `npx prisma generate`
Expected: `Generated Prisma Client` sin errores — esto solo actualiza los tipos TS locales, no toca la base de datos.

- [ ] **Step 5: Aplicar la migración — la ejecuta el usuario, no el agente**

Este paso cambia la base de datos de producción. Pide al usuario que corra, en su propia terminal, desde `C:\Proyectos\Felmat\crm_felmat`:

```bash
npx prisma db push
```

Expected (según lo ya visto en este proyecto para el mismo tipo de cambio): `Your database is now in sync with your Prisma schema.` Si Prisma pregunta por pérdida de datos por volver una columna nullable, confirmar que sí (nullable nunca borra datos existentes, solo relaja la restricción).

- [ ] **Step 6: Verificar la migración con una consulta de solo lectura**

Una vez que el usuario confirme que el paso 5 corrió bien, verificar (el agente puede correr esto, es de solo lectura):

Run: `npx prisma db execute --stdin <<< "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'Anuncio' AND column_name IN ('categoria', 'colonia', 'precio');"`
Expected: tres filas — `categoria` con `is_nullable = NO` (tiene default) y `colonia`/`precio` con `is_nullable = YES`.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma
git commit -m "$(cat <<'EOF'
feat: agrega categoria a Anuncio y campos de diapositiva a ImagenAnuncio

Permite anuncios de tipo SERVICIO (Condominios) sin colonia/precio/
tipoPropiedad falsos, y guarda encabezado/subtitulo/imagen compuesta
por diapositiva para el carrusel de administracion de condominios.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Backend — `categoria` y validación en `api/anuncios.js` / `api/anuncios/[id].js`

**Files:**
- Modify: `api/anuncios.js:1-81`
- Modify: `api/anuncios/[id].js:1-74`

**Interfaces:**
- Consumes: nada nuevo de otras tareas (usa Prisma Client ya regenerado en Task 1).
- Produces: `POST /api/anuncios` y `PUT /api/anuncios/:id` aceptan `categoria` y rechazan con 400 un anuncio PROPIEDAD sin sus campos requeridos; ambos guardan `headline`/`subtitulo`/`imagenCompuestaUrl` por imagen.

- [ ] **Step 1: Reescribir `api/anuncios.js` completo**

```javascript
import { PrismaClient } from '@prisma/client';
import { requireApiKey } from './_lib/auth.js';

const prisma = new PrismaClient();

const CAMPOS_PROPIEDAD_REQUERIDOS = ['colonia', 'ciudad', 'precio', 'tipoPropiedad', 'modalidadRenta'];

function validarCamposPropiedad(data) {
  if (data.categoria === 'SERVICIO') return null;
  const faltantes = CAMPOS_PROPIEDAD_REQUERIDOS.filter(
    (campo) => data[campo] === undefined || data[campo] === null || data[campo] === ''
  );
  if (faltantes.length > 0) {
    return `Faltan campos obligatorios para un anuncio de propiedad: ${faltantes.join(', ')}`;
  }
  return null;
}

export default async function handler(req, res) {
  if (!requireApiKey(req, res)) return;

  if (req.method === 'GET') {
    try {
      const { estado, tipo, modalidad, modo, agentId, q: busqueda, ordenar = 'recientes' } = req.query;

      const where = {};
      if (estado && estado !== ' ') where.estado = estado;
      if (tipo && tipo !== ' ') where.tipoPropiedad = tipo;
      if (modalidad && modalidad !== ' ') where.modalidadRenta = modalidad;
      if (modo) where.modo = modo;
      if (agentId) where.agentId = agentId;

      if (busqueda) {
        where.OR = [
          { titulo: { contains: busqueda, mode: 'insensitive' } },
          { colonia: { contains: busqueda, mode: 'insensitive' } },
          { ciudad: { contains: busqueda, mode: 'insensitive' } },
        ];
      }

      let orderBy = { createdAt: 'desc' };
      if (ordenar === 'antiguos') orderBy = { createdAt: 'asc' };
      if (ordenar === 'precio_alto') orderBy = { precio: 'desc' };
      if (ordenar === 'precio_bajo') orderBy = { precio: 'asc' };
      if (ordenar === 'vistas') orderBy = { vistas: 'desc' };

      const anuncios = await prisma.anuncio.findMany({
        where,
        orderBy,
        include: {
          imagenes: { orderBy: { orden: 'asc' }, take: 1 },
          publicaciones: true,
        },
      });

      return res.status(200).json(anuncios);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Error al cargar anuncios' });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;

      const errorValidacion = validarCamposPropiedad(data);
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const imagenes = data.imagenes;
      delete data.imagenes;
      const slugBase = data.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slug = `${slugBase}-${Date.now()}`;

      const anuncio = await prisma.anuncio.create({
        data: {
          ...data,
          slug,
          estado: 'BORRADOR',
          ...(imagenes?.length ? {
            imagenes: {
              create: imagenes.map((img, i) => ({
                url: img.url,
                esPrincipal: img.esPrincipal,
                orden: i,
                headline: img.headline || null,
                subtitulo: img.subtitulo || null,
                imagenCompuestaUrl: img.imagenCompuestaUrl || null,
              })),
            },
          } : {}),
        },
        include: { imagenes: { orderBy: { orden: 'asc' } }, publicaciones: true },
      });

      return res.status(201).json(anuncio);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Error al crear anuncio' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 2: Reescribir `api/anuncios/[id].js` completo**

```javascript
import { PrismaClient } from '@prisma/client';
import { requireApiKey } from '../_lib/auth.js';

const prisma = new PrismaClient();

const CAMPOS_PROPIEDAD_REQUERIDOS = ['colonia', 'ciudad', 'precio', 'tipoPropiedad', 'modalidadRenta'];

function validarCamposPropiedad(data) {
  if (data.categoria === 'SERVICIO') return null;
  const faltantes = CAMPOS_PROPIEDAD_REQUERIDOS.filter(
    (campo) => data[campo] === undefined || data[campo] === null || data[campo] === ''
  );
  if (faltantes.length > 0) {
    return `Faltan campos obligatorios para un anuncio de propiedad: ${faltantes.join(', ')}`;
  }
  return null;
}

export default async function handler(req, res) {
  if (!requireApiKey(req, res)) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const anuncio = await prisma.anuncio.findUnique({
        where: { id },
        include: {
          imagenes: { orderBy: { orden: 'asc' } },
          publicaciones: true,
        },
      });

      if (!anuncio) {
        return res.status(404).json({ error: 'Anuncio no encontrado' });
      }

      return res.status(200).json(anuncio);
    } catch (error) {
      return res.status(500).json({ error: 'Error al cargar anuncio' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const data = req.body;
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.slug;
      delete data.categoria; // inmutable después de crear -- ver spec

      const errorValidacion = await (async () => {
        const actual = await prisma.anuncio.findUnique({ where: { id }, select: { categoria: true } });
        if (!actual) return null; // el 404 lo maneja Prisma más abajo
        return validarCamposPropiedad({ ...data, categoria: actual.categoria });
      })();
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const imagenes = data.imagenes;
      delete data.imagenes;
      delete data.publicaciones;

      const anuncio = await prisma.anuncio.update({
        where: { id },
        data: {
          ...data,
          ...(imagenes ? {
            imagenes: {
              deleteMany: {},
              create: imagenes.map((img, i) => ({
                url: img.url,
                esPrincipal: img.esPrincipal,
                orden: i,
                headline: img.headline || null,
                subtitulo: img.subtitulo || null,
                imagenCompuestaUrl: img.imagenCompuestaUrl || null,
              })),
            },
          } : {}),
        },
        include: { imagenes: { orderBy: { orden: 'asc' } }, publicaciones: true },
      });

      return res.status(200).json(anuncio);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Error al actualizar anuncio' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.anuncio.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Error al eliminar anuncio' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 3: Probar manualmente contra la base real (con `vercel dev` o el deploy de preview)**

Run (ajusta el host si usas `vercel dev` local, y sustituye `<ANUNCIOS_API_KEY>` por el valor real de la variable de entorno):

```bash
curl -s -X POST http://localhost:3000/api/anuncios \
  -H "Authorization: Bearer <ANUNCIOS_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test","modo":"admin","categoria":"SERVICIO","titulo":"Prueba servicio"}'
```

Expected: `201` con un anuncio que trae `categoria: "SERVICIO"` y `colonia: null`, `precio: null`.

Run (debe fallar por faltarle los campos de propiedad):

```bash
curl -s -X POST http://localhost:3000/api/anuncios \
  -H "Authorization: Bearer <ANUNCIOS_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test","modo":"admin","titulo":"Prueba sin categoria"}'
```

Expected: `400` con `{"error":"Faltan campos obligatorios para un anuncio de propiedad: colonia, ciudad, precio, tipoPropiedad, modalidadRenta"}`.

Borra el anuncio de prueba creado (usa el `id` que regresó el primer curl):

```bash
curl -s -X DELETE http://localhost:3000/api/anuncios/<id> -H "Authorization: Bearer <ANUNCIOS_API_KEY>"
```

- [ ] **Step 4: Commit**

```bash
git add api/anuncios.js "api/anuncios/[id].js"
git commit -m "$(cat <<'EOF'
feat: valida categoria PROPIEDAD/SERVICIO y guarda campos de diapositiva

api/anuncios.js y api/anuncios/[id].js ya no asumen que todo anuncio
es una propiedad -- exigen colonia/ciudad/precio/tipoPropiedad/
modalidadRenta solo cuando categoria !== SERVICIO, y categoria es
inmutable despues de creado.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Backend — endpoint de subida de imágenes a Vercel Blob

**Files:**
- Create: `api/felmat-upload-anuncio-image.js`
- Modify: `package.json` (agrega `@vercel/blob`)

**Interfaces:**
- Consumes: `requireApiKey` de `api/_lib/auth.js` (ya existe).
- Produces: `POST /api/felmat-upload-anuncio-image` con body `{ dataUrl: string }` (un data URL `data:image/jpeg;base64,...` o similar) → `{ url: string }` con la URL pública en Vercel Blob. Esta forma la consume `subirImagenAnuncio` en Task 4.

- [ ] **Step 1: Confirmar (o crear) el Blob store del proyecto en Vercel — lo hace el usuario**

Pide al usuario que confirme, en el dashboard de Vercel del proyecto `crm_felmat` (pestaña Storage), que existe un Blob store conectado. Si no existe, que lo cree ahí mismo (botón "Create Database" → "Blob") y lo conecte al proyecto -- Vercel agrega automáticamente la variable de entorno `BLOB_READ_WRITE_TOKEN`. Sin este paso, Task 3 no se puede probar en producción/preview (sí se puede escribir el código igual).

- [ ] **Step 2: Instalar `@vercel/blob`**

Run: `npm install @vercel/blob`
Expected: se agrega `"@vercel/blob": "^<version>"` a `dependencies` en `package.json`.

- [ ] **Step 3: Crear `api/felmat-upload-anuncio-image.js`**

```javascript
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { requireApiKey } from './_lib/auth.js';

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  const [, contentType, base64] = match;
  return { contentType, buffer: Buffer.from(base64, 'base64') };
}

export default async function handler(req, res) {
  if (!requireApiKey(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsed = parseDataUrl(req.body?.dataUrl);
    if (!parsed) {
      return res.status(400).json({ error: 'dataUrl inválido -- se espera un data URL de imagen en base64' });
    }

    const ext = parsed.contentType.split('/')[1] || 'jpg';
    const blob = await put(`anuncios/${randomUUID()}.${ext}`, parsed.buffer, {
      access: 'public',
      contentType: parsed.contentType,
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error al subir la imagen' });
  }
}
```

- [ ] **Step 4: Probar contra el Blob store real**

Run (usa una imagen JPEG mínima real; en Windows Git Bash, genera un data URL de prueba desde Python que ya sabemos que está disponible en este entorno):

```bash
python3 -c "
import base64
data = base64.b64encode(bytes.fromhex('ffd8ffe000104a46494600010100000100010000ffdb004300030202020202030202020304030304050805050404050a070706080c0a0c0c0b0a0b0b0d0e12100d0e110e0b0b1016101113141515150c0f171816141812141514ffc9000b08000100010100022200ffcc000600100510ffda0008010100003f00d2cf20ffd9')).decode()
print('data:image/jpeg;base64,' + data)
" > /tmp/test-jpeg-dataurl.txt
curl -s -X POST http://localhost:3000/api/felmat-upload-anuncio-image \
  -H "Authorization: Bearer <ANUNCIOS_API_KEY>" \
  -H "Content-Type: application/json" \
  -d "{\"dataUrl\":\"$(cat /tmp/test-jpeg-dataurl.txt)\"}"
```

Expected: `200` con `{"url":"https://...public.blob.vercel-storage.com/anuncios/<uuid>.jpeg"}`. Confirma que esa URL responde `200` con `Content-Type: image/jpeg` al abrirla directamente (`curl -sI <url>`).

- [ ] **Step 5: Commit**

```bash
git add api/felmat-upload-anuncio-image.js package.json package-lock.json
git commit -m "$(cat <<'EOF'
feat: endpoint para subir imagenes de anuncios a Vercel Blob

Recibe un data URL en base64 (mismo patron que ya usa el resto de
Anuncios, sin libreria de multipart nueva) y regresa una URL publica
-- necesaria para componer y guardar las diapositivas del carrusel de
Condominios.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Frontend — tipos y cliente API (`anunciosApi.ts`)

**Files:**
- Modify: `src/lib/anunciosApi.ts`

**Interfaces:**
- Produces: `Anuncio.categoria: 'PROPIEDAD' | 'SERVICIO'`; `ImagenAnuncio.headline?: string`, `.subtitulo?: string`, `.imagenCompuestaUrl?: string`; `Anuncio.tipoPropiedad`/`.modalidadRenta`/`.colonia`/`.ciudad`/`.precio` ahora opcionales; nueva función `subirImagenAnuncio(dataUrl: string): Promise<{ url: string }>`.

- [ ] **Step 1: Editar los tipos y agregar `subirImagenAnuncio`**

Reemplaza el contenido de `src/lib/anunciosApi.ts` (líneas 8-50, las interfaces) y agrega la función al final:

```typescript
export type EstadoAnuncio = 'BORRADOR' | 'REVISION' | 'PUBLICADO' | 'PAUSADO' | 'EXPIRADO' | 'ARCHIVADO';
export type ModoAnuncio = 'admin' | 'airbnb';
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
```

Y al final del archivo, después de `publicarAnuncio`:

```typescript
export function subirImagenAnuncio(dataUrl: string): Promise<{ url: string }> {
  return apiFetch('/api/felmat-upload-anuncio-image', { method: 'POST', body: JSON.stringify({ dataUrl }) });
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos relacionados a `anunciosApi.ts` (`AnuncioForm.tsx`, `ListaAnuncios.tsx` y `AnuncioDetail.tsx` sí van a marcar errores de tipos opcionales hasta las Tasks 8 y 10 -- normal en este punto intermedio, se resuelven en esas tareas).

- [ ] **Step 3: Commit**

```bash
git add src/lib/anunciosApi.ts
git commit -m "$(cat <<'EOF'
feat: agrega categoria y campos de diapositiva a los tipos de Anuncio

Vuelve opcionales los campos de propiedad en el tipo Anuncio y agrega
subirImagenAnuncio() para el nuevo endpoint de Vercel Blob.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Frontend — extraer `compressImageToDataUrl` a un util compartido

**Files:**
- Create: `src/lib/imageCompression.ts`
- Modify: `src/components/properties/PropertyForm.tsx:81-103`

**Interfaces:**
- Produces: `compressImageToDataUrl(file: File): Promise<string>` — redimensiona a máximo 1600px por lado, JPEG calidad 0.82.

- [ ] **Step 1: Crear `src/lib/imageCompression.ts`**

```typescript
// Redimensiona a un máximo de 1600px por lado y reexporta como JPEG calidad
// 0.82 -- una foto de celular de varios MB queda en unos cientos de KB.
// Evita re-topar el límite de ~4.5MB por request de las funciones de Vercel
// (bug real ya corregido una vez en fotos de propiedad).
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.82;

export function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas_unsupported')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('image_load_failed'));
    img.src = URL.createObjectURL(file);
  });
}
```

- [ ] **Step 2: Actualizar `PropertyForm.tsx` para usar el util**

En `src/components/properties/PropertyForm.tsx`, borra las líneas 81-103 (la constante `MAX_IMAGE_DIMENSION`, `IMAGE_QUALITY` y la función `compressImageToDataUrl` completas) y en su lugar, junto a los demás imports (después de la línea 9, `import type { Property, ... } from '@/types';`), agrega:

```typescript
import { compressImageToDataUrl } from '@/lib/imageCompression';
```

- [ ] **Step 3: Verificar que compila y que el formulario de propiedades sigue subiendo fotos**

Run: `npx tsc --noEmit`
Expected: sin errores en `PropertyForm.tsx`.

Verificación manual: abrir `/propiedades/nueva` en el navegador, subir una foto real desde el celular/disco, confirmar que se ve la miniatura igual que antes de este cambio (el comportamiento no debe cambiar en absoluto, solo se movió el código).

- [ ] **Step 4: Commit**

```bash
git add src/lib/imageCompression.ts src/components/properties/PropertyForm.tsx
git commit -m "$(cat <<'EOF'
refactor: extrae compressImageToDataUrl a src/lib/imageCompression.ts

Antes vivia solo dentro de PropertyForm.tsx; el editor de diapositivas
de Condominios (Task 9) tambien necesita comprimir fotos antes de
subirlas, y duplicar la funcion violaria DRY.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Frontend — `PlantillaCondominios.tsx` (compositor visual)

**Files:**
- Create: `src/components/anuncios/templates/PlantillaCondominios.tsx`

**Interfaces:**
- Produces: `<PlantillaCondominios fotoUrl subtitulo headline contacto />`, un `<div>` de exactamente 1080×1080px. `contacto: { nombre: string; telefono?: string }`. Task 7 lo monta fuera de pantalla y lo captura con `html2canvas`; Task 9 lo usa también para la vista previa en vivo dentro del editor.

- [ ] **Step 1: Crear el componente**

```tsx
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
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/anuncios/templates/PlantillaCondominios.tsx
git commit -m "$(cat <<'EOF'
feat: componente PlantillaCondominios (compositor 1080x1080)

Primera plantilla de anuncio implementada en codigo real -- antes solo
existia como prototipo HTML estatico. La reusan tanto la vista previa
en vivo del editor de diapositivas como la generacion final de imagen.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Frontend — `generarImagenAnuncio.ts` (html2canvas → JPEG)

**Files:**
- Create: `src/lib/generarImagenAnuncio.ts`
- Modify: `package.json` (declara `html2canvas` como dependencia directa)

**Interfaces:**
- Consumes: nada de otras tareas directamente (opera sobre cualquier `HTMLElement`).
- Produces: `generarImagenAnuncio(nodo: HTMLElement): Promise<string>` — data URL JPEG calidad 0.85. Task 9 lo usa para convertir una instancia montada de `PlantillaCondominios` a imagen antes de subirla con `subirImagenAnuncio`.

- [ ] **Step 1: Declarar `html2canvas` como dependencia directa**

`html2canvas` (v1.4.1) ya está físicamente instalado en `node_modules` -- llega como dependencia transitiva y `src/lib/pdfExport.ts` ya lo importa sin declararlo. Agrega esta línea a `dependencies` en `package.json` (respeta el orden alfabético que ya sigue el archivo):

```json
"html2canvas": "^1.4.1",
```

Run: `npm install`
Expected: no cambia nada físico en `node_modules` (ya estaba resuelto a esa versión), pero `package-lock.json` ahora la registra como dependencia directa del proyecto.

- [ ] **Step 2: Crear `src/lib/generarImagenAnuncio.ts`**

```typescript
import html2canvas from 'html2canvas';

// Convierte un nodo del DOM (montado, aunque sea fuera de pantalla) a un
// data URL JPEG de 1080x1080. useCORS: true es necesario porque la foto de
// fondo vive en Vercel Blob, un origen distinto al de la app.
export async function generarImagenAnuncio(nodo: HTMLElement): Promise<string> {
  const canvas = await html2canvas(nodo, {
    width: 1080,
    height: 1080,
    scale: 1,
    useCORS: true,
    backgroundColor: '#0a0a15',
  });
  return canvas.toDataURL('image/jpeg', 0.85);
}
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores. (`html2canvas` trae sus propios tipos, no hace falta `@types/html2canvas`.)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/generarImagenAnuncio.ts
git commit -m "$(cat <<'EOF'
feat: generarImagenAnuncio (html2canvas a JPEG) + declara html2canvas

html2canvas ya se usaba en pdfExport.ts como dependencia transitiva no
declarada; declararla aqui corrige ese riesgo latente de raiz para
ambos usos, en vez de sumar html-to-image como libreria nueva.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Frontend — `ListaAnuncios.tsx` y `AnuncioDetail.tsx` no truenan con campos nulos

**Files:**
- Modify: `src/components/anuncios/ListaAnuncios.tsx:182-330` (aprox., `GridView` y `ListView`)
- Modify: `src/components/anuncios/AnuncioDetail.tsx:107-181`

**Interfaces:**
- Consumes: `Anuncio.categoria`, `.precio?`, `.colonia?`, `.tipoPropiedad?` de Task 4.
- Produces: ambas pantallas renderizan un anuncio `categoria === 'SERVICIO'` sin crashear; la imagen mostrada prefiere `imagenCompuestaUrl` sobre `url`.

- [ ] **Step 1: `ListaAnuncios.tsx` — `GridView`, tarjeta de imagen y badges**

Reemplaza el bloque de la tarjeta (líneas 182-223 aprox., desde `<Card key={anuncio.id}` hasta el cierre de `</CardContent>` que sigue a los badges/colonia/recámaras) por:

```tsx
          <Card key={anuncio.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white">
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
              {anuncio.imagenes?.length > 0 ? (
                <img src={anuncio.imagenes[0].imagenCompuestaUrl || anuncio.imagenes[0].url} alt={anuncio.titulo} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50"><ImageIcon className="w-12 h-12" /></div>
              )}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <Badge className={cn("border shadow-sm", estadoConfig.color)}><EstadoIcon className="w-3 h-3 mr-1" />{estadoConfig.label}</Badge>
                {anuncio.destacado && <Badge className="bg-amber-500 text-white border-amber-500 shadow-sm">⭐ Destacado</Badge>}
              </div>
              {anuncio.categoria !== 'SERVICIO' && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white font-bold text-lg">{formatPrice(anuncio.precio || 0, anuncio.moneda, anuncio.periodo)}</p>
                </div>
              )}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(`${basePath}/anuncios/${anuncio.id}`)}><Eye className="mr-2 h-4 w-4" />Ver detalle</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`${basePath}/anuncios/${anuncio.id}/editar`)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicar(anuncio)}><Copy className="mr-2 h-4 w-4" />Duplicar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setAnuncioPublicar(anuncio)}><Share2 className="mr-2 h-4 w-4" />Publicar en...</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => setAnuncioEliminar(anuncio)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardContent className="p-4">
              {anuncio.categoria === 'SERVICIO' ? (
                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 mb-3">Servicio de administración</Badge>
              ) : (
                <div className="flex gap-2 mb-3 flex-wrap">
                  <Badge variant="outline" className={cn("text-xs", getTipoConfig(anuncio.tipoPropiedad || '').color)}>{getTipoConfig(anuncio.tipoPropiedad || '').label}</Badge>
                  <Badge variant="outline" className={cn("text-xs", getModalidadConfig(anuncio.modalidadRenta || '').color)}>{getModalidadConfig(anuncio.modalidadRenta || '').label}</Badge>
                </div>
              )}
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm leading-tight">{anuncio.titulo}</h3>
              {anuncio.categoria !== 'SERVICIO' && (
                <>
                  <p className="text-sm text-gray-500 mb-3 flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{anuncio.colonia}, {anuncio.ciudad}</span></p>
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1"><BedDouble className="w-4 h-4 text-gray-400" />{anuncio.tipoPropiedad === 'ESTUDIO' ? 'Estudio' : `${anuncio.recamaras || 0} rec.`}</span>
                    <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-gray-400" />{anuncio.banos || 0} baños</span>
                  </div>
                </>
              )}
```

(El resto de `CardContent` -- los íconos de canal y el pie de vistas/contactos/fecha -- se queda exactamente igual, no depende de ningún campo de propiedad.)

- [ ] **Step 2: `ListaAnuncios.tsx` — `ListView`, celda de imagen y de anuncio/precio**

Reemplaza las celdas correspondientes (aprox. líneas 269-283):

```tsx
                <TableCell>
                  <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {anuncio.imagenes?.length > 0 ? <img src={anuncio.imagenes[0].imagenCompuestaUrl || anuncio.imagenes[0].url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-6 h-6" /></div>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[300px]">
                    <p className="font-medium text-gray-900 line-clamp-1 text-sm">{anuncio.titulo}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {anuncio.categoria === 'SERVICIO' ? (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium border bg-gray-100 text-gray-800">Servicio de administración</span>
                      ) : (
                        <>
                          <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium border", getTipoConfig(anuncio.tipoPropiedad || '').color)}>{getTipoConfig(anuncio.tipoPropiedad || '').label}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{anuncio.colonia}</span>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell><p className="font-semibold text-gray-900 text-sm">{anuncio.categoria === 'SERVICIO' ? '—' : formatPrice(anuncio.precio || 0, anuncio.moneda, anuncio.periodo)}</p></TableCell>
```

- [ ] **Step 3: `AnuncioDetail.tsx` — encabezado y tarjeta de precio**

Reemplaza el encabezado (líneas 116-121):

```tsx
          <div>
            <h1 className="text-2xl font-bold">{anuncio.titulo}</h1>
            {anuncio.categoria !== 'SERVICIO' && (
              <p className="text-muted-foreground text-sm flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />{anuncio.colonia}, {anuncio.ciudad}
              </p>
            )}
          </div>
```

Y la tarjeta de precio (líneas 166-181), incluyendo la imagen principal (línea 107 y 141):

```tsx
  const principal = anuncio.imagenes.find(i => i.esPrincipal) || anuncio.imagenes[0];
  const principalUrl = principal ? (principal.imagenCompuestaUrl || principal.url) : undefined;
```

```tsx
          <Card>
            <CardContent className="p-4 space-y-3">
              <Badge>{ESTADO_LABELS[anuncio.estado]}</Badge>
              {anuncio.categoria === 'SERVICIO' ? (
                <p className="text-sm text-muted-foreground">Anuncio de servicio -- sin precio ni unidad asociada.</p>
              ) : (
                <>
                  <p className="text-2xl font-bold text-primary">
                    ${(anuncio.precio || 0).toLocaleString('es-MX')} {anuncio.moneda} {anuncio.periodo}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{anuncio.recamaras}</span>
                    <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{anuncio.banos}</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{anuncio.vistas} vistas</span>
                <span>{anuncio.contactos} contactos</span>
              </div>
            </CardContent>
          </Card>
```

Y usa `principalUrl` en el `<img src={principalUrl} ...>` de la línea 141 (antes usaba `principal.url` directo).

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Verificación manual**

Con `npm run dev`, crear (vía `curl` como en Task 2, Step 3) un anuncio `categoria: "SERVICIO"` real con un par de imágenes de prueba, y abrirlo en `/anuncios` (grid y lista) y en `/anuncios/<id>` (detalle) -- confirmar que no hay ninguna pantalla en blanco ni error en consola, y que no se ve "$NaN" ni "undefined, undefined" en ningún lado.

- [ ] **Step 6: Commit**

```bash
git add src/components/anuncios/ListaAnuncios.tsx src/components/anuncios/AnuncioDetail.tsx
git commit -m "$(cat <<'EOF'
fix: ListaAnuncios y AnuncioDetail ya no truenan con anuncios SERVICIO

precio/colonia/tipoPropiedad ahora pueden ser null (Task 1) -- ambas
pantallas renderizaban esos campos sin verificar, incluyendo un
precio.toLocaleString() directo sobre null. La imagen mostrada ahora
prefiere imagenCompuestaUrl cuando existe.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Frontend — `DiapositivasEditor.tsx` (editor multi-diapositiva)

**Files:**
- Create: `src/components/anuncios/DiapositivasEditor.tsx`

**Interfaces:**
- Consumes: `compressImageToDataUrl` (Task 5), `subirImagenAnuncio` (Task 4), `PlantillaCondominios` (Task 6), `generarImagenAnuncio` (Task 7), `ImagenAnuncio` (Task 4), `ContactoPlantilla` (Task 6).
- Produces: `<DiapositivasEditor slides={ImagenAnuncio[]} onChange={(slides) => void} contacto={ContactoPlantilla} />`. Task 10 lo monta dentro de `AnuncioForm.tsx` para `categoria === 'SERVICIO'`.

- [ ] **Step 1: Crear el componente**

```tsx
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Trash2, Upload, Loader2, Plus } from 'lucide-react';
import { compressImageToDataUrl } from '@/lib/imageCompression';
import { subirImagenAnuncio, type ImagenAnuncio } from '@/lib/anunciosApi';
import { generarImagenAnuncio } from '@/lib/generarImagenAnuncio';
import { PlantillaCondominios, type ContactoPlantilla } from './templates/PlantillaCondominios';
import { toast } from 'sonner';

const MAX_DIAPOSITIVAS = 10;

interface DiapositivasEditorProps {
  slides: ImagenAnuncio[];
  onChange: (slides: ImagenAnuncio[]) => void;
  contacto: ContactoPlantilla;
}

export function DiapositivasEditor({ slides, onChange, contacto }: DiapositivasEditorProps) {
  const [generandoIdx, setGenerandoIdx] = useState<number | null>(null);
  const renderRef = useRef<HTMLDivElement>(null);

  // Recibe explícitamente el array base sobre el que fusionar el resultado
  // -- NUNCA cierra sobre el `slides` externo directamente, porque
  // handleFoto ya avanzó el estado (onChange(nuevas)) antes de llamar aquí,
  // y este closure quedaría con una copia vieja de `slides` durante los
  // ~300ms+ que tarda componer(). Fusionar contra esa copia vieja borraría
  // la `url` recién subida (bug real de stale closure, no hipotético).
  const componer = async (idx: number, baseSlides: ImagenAnuncio[]) => {
    const fotoUrl = baseSlides[idx]?.url;
    if (!fotoUrl) return;
    setGenerandoIdx(idx);
    try {
      // Se monta la plantilla real fuera de pantalla (vía portal a renderRef)
      // y se espera un frame para que la imagen de fondo cargue antes de
      // capturar -- si no, html2canvas puede capturar el fondo vacío.
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!renderRef.current) return;
      const dataUrl = await generarImagenAnuncio(renderRef.current);
      const { url } = await subirImagenAnuncio(dataUrl);
      onChange(baseSlides.map((s, i) => (i === idx ? { ...s, imagenCompuestaUrl: url } : s)));
    } catch (error) {
      toast.error('No se pudo componer la diapositiva. Intenta de nuevo.');
    } finally {
      setGenerandoIdx(null);
    }
  };

  const handleFoto = async (idx: number, file: File) => {
    try {
      const dataUrl = await compressImageToDataUrl(file);
      const { url } = await subirImagenAnuncio(dataUrl);
      const nuevas = slides.map((s, i) => (i === idx ? { ...s, url, imagenCompuestaUrl: '' } : s));
      onChange(nuevas);
      await componer(idx, nuevas);
    } catch (error) {
      toast.error('No se pudo subir la foto. Intenta de nuevo.');
    }
  };

  const handleTextoBlur = (idx: number) => {
    componer(idx, slides);
  };

  const actualizarCampo = (idx: number, campo: 'headline' | 'subtitulo', valor: string) => {
    onChange(slides.map((s, i) => (i === idx ? { ...s, [campo]: valor } : s)));
  };

  const agregar = () => {
    if (slides.length >= MAX_DIAPOSITIVAS) return;
    onChange([...slides, { url: '', esPrincipal: slides.length === 0, headline: '', subtitulo: '', imagenCompuestaUrl: '' }]);
  };

  const eliminar = (idx: number) => {
    const nuevas = slides.filter((_, i) => i !== idx);
    if (nuevas.length > 0 && !nuevas.some((s) => s.esPrincipal)) nuevas[0].esPrincipal = true;
    onChange(nuevas);
  };

  const mover = (idx: number, dir: -1 | 1) => {
    const destino = idx + dir;
    if (destino < 0 || destino >= slides.length) return;
    const nuevas = [...slides];
    [nuevas[idx], nuevas[destino]] = [nuevas[destino], nuevas[idx]];
    onChange(nuevas);
  };

  const slideGenerando = generandoIdx !== null ? slides[generandoIdx] : null;

  return (
    <div className="space-y-4">
      {slides.map((slide, idx) => (
        <Card key={idx}>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
            <div className="space-y-2">
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted">
                {generandoIdx === idx ? (
                  <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : slide.imagenCompuestaUrl ? (
                  <img src={slide.imagenCompuestaUrl} alt="" className="w-full h-full object-cover" />
                ) : slide.url ? (
                  <img src={slide.url} alt="" className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Upload className="w-6 h-6" /></div>
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFoto(idx, e.target.files[0])}
              />
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label>Encabezado</Label>
                <Input
                  value={slide.headline || ''}
                  onChange={(e) => actualizarCampo(idx, 'headline', e.target.value)}
                  onBlur={() => handleTextoBlur(idx)}
                  placeholder="Ej: Acceso digital, control total"
                />
              </div>
              <div className="space-y-1">
                <Label>Subtítulo</Label>
                <Input
                  value={slide.subtitulo || ''}
                  onChange={(e) => actualizarCampo(idx, 'subtitulo', e.target.value)}
                  onBlur={() => handleTextoBlur(idx)}
                  placeholder="Ej: Llave digital y videoportero desde tu celular"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" size="icon" disabled={idx === 0} onClick={() => mover(idx, -1)}><ArrowUp className="w-4 h-4" /></Button>
                <Button type="button" variant="outline" size="icon" disabled={idx === slides.length - 1} onClick={() => mover(idx, 1)}><ArrowDown className="w-4 h-4" /></Button>
                <Button type="button" variant="destructive" size="icon" onClick={() => eliminar(idx)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={agregar} disabled={slides.length >= MAX_DIAPOSITIVAS}>
        <Plus className="w-4 h-4 mr-2" />Agregar diapositiva ({slides.length}/{MAX_DIAPOSITIVAS})
      </Button>

      {/* Montaje fuera de pantalla para capturar con html2canvas -- ver componer() */}
      {slideGenerando &&
        createPortal(
          <div style={{ position: 'fixed', top: -9999, left: -9999 }}>
            <div ref={renderRef}>
              <PlantillaCondominios
                fotoUrl={slideGenerando.url}
                headline={slideGenerando.headline || ''}
                subtitulo={slideGenerando.subtitulo || ''}
                contacto={contacto}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default DiapositivasEditor;
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/anuncios/DiapositivasEditor.tsx
git commit -m "$(cat <<'EOF'
feat: editor de diapositivas para anuncios de servicio (Condominios)

Hasta 10 fotos, cada una con su propio encabezado/subtitulo,
compuestas en el navegador con PlantillaCondominios + html2canvas y
subidas a Vercel Blob al soltar la foto o al salir de los campos de
texto.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Frontend — `AnuncioForm.tsx`: rama `categoria === 'SERVICIO'`

**Files:**
- Modify: `src/components/anuncios/AnuncioForm.tsx` (reescritura completa)

**Interfaces:**
- Consumes: `DiapositivasEditor` (Task 9), `emoji-picker-react` (nueva dependencia), `useAuth()` (ya existe, expone `user.name`/`user.lastName`/`user.phone`).
- Produces: formulario funcional para crear/editar anuncios `categoria: 'SERVICIO'` desde `/anuncios/nuevo` (contexto Condominios).

- [ ] **Step 1: Instalar `emoji-picker-react`**

Run: `npm install emoji-picker-react`
Expected: se agrega a `dependencies` en `package.json`.

- [ ] **Step 2: Reescribir `AnuncioForm.tsx` completo**

```tsx
// ============================================
// FORMULARIO DE ANUNCIO (crear/editar) - admin y airbnb comparten esta página
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  obtenerAnuncio, crearAnuncio, actualizarAnuncio,
  type Anuncio, type ImagenAnuncio, type CategoriaAnuncio,
} from '@/lib/anunciosApi';
import { TIPOS_PROPIEDAD, MODALIDADES } from './ListaAnuncios';
import { DiapositivasEditor } from './DiapositivasEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Upload, Star, X, Loader2, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';

function generateSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36);
}

function ImagenesUploader({ imagenes, onChange }: { imagenes: ImagenAnuncio[]; onChange: (imgs: ImagenAnuncio[]) => void }) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const nueva: ImagenAnuncio = {
          url: e.target?.result as string,
          esPrincipal: imagenes.length === 0 && index === 0,
        };
        onChange([...imagenes, nueva]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImagen = (idx: number) => {
    const filtradas = imagenes.filter((_, i) => i !== idx);
    if (filtradas.length > 0 && !filtradas.some(i => i.esPrincipal)) filtradas[0].esPrincipal = true;
    onChange(filtradas);
  };

  const setPrincipal = (idx: number) => {
    onChange(imagenes.map((img, i) => ({ ...img, esPrincipal: i === idx })));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <input type="file" multiple accept="image/*" onChange={(e) => handleFiles(e.target.files)} className="hidden" id="anuncio-image-upload" />
        <label htmlFor="anuncio-image-upload" className="cursor-pointer">
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">Arrastra imágenes aquí o haz clic para seleccionar</p>
        </label>
      </div>

      {imagenes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {imagenes.map((img, idx) => (
            <div key={idx} className={cn("relative aspect-square rounded-lg overflow-hidden border-2", img.esPrincipal ? "border-primary" : "border-border")}>
              <img src={img.url} alt="" className="w-full h-full object-cover" />
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
        </div>
      )}
    </div>
  );
}

// Textarea nativo (no el wrapper de shadcn, que no reenvía ref) para poder
// insertar el emoji en la posición del cursor en vez de al final.
function CaptionConEmojis({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);

  const insertarEmoji = (data: EmojiClickData) => {
    const el = ref.current;
    if (!el) { onChange(value + data.emoji); return; }
    const inicio = el.selectionStart ?? value.length;
    const fin = el.selectionEnd ?? value.length;
    const nuevo = value.slice(0, inicio) + data.emoji + value.slice(fin);
    onChange(nuevo);
    setOpen(false);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = inicio + data.emoji.length;
    });
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Escribe el texto que acompaña al carrusel..."
        className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 pr-12 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] md:text-sm"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-8 w-8"><Smile className="w-4 h-4" /></Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="p-0 w-auto">
          <EmojiPicker onEmojiClick={insertarEmoji} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function AnuncioForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const modo = location.pathname.startsWith('/airbnb') ? 'airbnb' : 'admin';
  const basePath = modo === 'admin' ? '' : '/airbnb';
  const isEditing = !!id;
  // /anuncios (Condominios) crea SERVICIO desde ahora; /airbnb sigue en PROPIEDAD.
  const categoriaInicial: CategoriaAnuncio = modo === 'admin' ? 'SERVICIO' : 'PROPIEDAD';

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [categoria, setCategoria] = useState<CategoriaAnuncio>(categoriaInicial);

  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoPropiedad, setTipoPropiedad] = useState('CASA');
  const [modalidadRenta, setModalidadRenta] = useState(modo === 'airbnb' ? 'AIRBNB' : 'SIN_MUEBLES_LP');
  const [colonia, setColonia] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [precio, setPrecio] = useState('');
  const [periodo, setPeriodo] = useState('/mes');
  const [moneda, setMoneda] = useState('MXN');
  const [recamaras, setRecamaras] = useState('1');
  const [banos, setBanos] = useState('1');
  const [destacado, setDestacado] = useState(false);
  const [imagenes, setImagenes] = useState<ImagenAnuncio[]>([]);

  useEffect(() => {
    if (!id) return;
    obtenerAnuncio(id).then((a: Anuncio) => {
      setCategoria(a.categoria);
      setTitulo(a.titulo);
      setSubtitulo(a.subtitulo || '');
      setDescripcion(a.descripcion || '');
      setTipoPropiedad(a.tipoPropiedad || 'CASA');
      setModalidadRenta(a.modalidadRenta || 'SIN_MUEBLES_LP');
      setColonia(a.colonia || '');
      setCiudad(a.ciudad || '');
      setPrecio(a.precio?.toString() || '');
      setPeriodo(a.periodo);
      setMoneda(a.moneda);
      setRecamaras(a.recamaras.toString());
      setBanos(a.banos.toString());
      setDestacado(a.destacado);
      setImagenes(a.imagenes || []);
      setLoading(false);
    }).catch(() => {
      toast.error('No se pudo cargar el anuncio');
      navigate(`${basePath}/anuncios`);
    });
  }, [id, basePath, navigate]);

  const esServicio = categoria === 'SERVICIO';
  const puedeGuardar = esServicio ? !!titulo.trim() : !!(titulo.trim() && colonia.trim() && ciudad.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !puedeGuardar) return;
    setSaving(true);
    try {
      const data: Partial<Anuncio> = esServicio
        ? {
            titulo: titulo.trim(),
            descripcion: descripcion.trim() || undefined,
            destacado: false,
            imagenes,
          }
        : {
            titulo: titulo.trim(),
            subtitulo: subtitulo.trim() || undefined,
            descripcion: descripcion.trim() || undefined,
            tipoPropiedad,
            modalidadRenta,
            colonia: colonia.trim(),
            ciudad: ciudad.trim(),
            precio: Number(precio) || 0,
            periodo,
            moneda,
            recamaras: Number(recamaras) || 0,
            banos: Number(banos) || 0,
            destacado,
            imagenes,
          };

      if (isEditing && id) {
        await actualizarAnuncio(id, data);
        toast.success('Anuncio actualizado');
      } else {
        await crearAnuncio({ ...data, agentId: user.id, modo, categoria, slug: generateSlug(titulo) });
        toast.success('Anuncio creado como borrador');
      }
      navigate(`${basePath}/anuncios`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar el anuncio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/anuncios`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Editar anuncio' : 'Nuevo anuncio'}</h1>
          <p className="text-muted-foreground text-sm">{esServicio ? 'Anuncio de servicio de administración' : modo === 'airbnb' ? 'Anuncio de Airbnb' : 'Anuncio de propiedad'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {esServicio ? (
          <>
            <Card>
              <CardHeader><CardTitle className="text-base">Información general</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <Label>Título del anuncio *</Label>
                  <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Carrusel administración — septiembre" required />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Texto de la publicación</CardTitle></CardHeader>
              <CardContent>
                <CaptionConEmojis value={descripcion} onChange={setDescripcion} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Diapositivas</CardTitle></CardHeader>
              <CardContent>
                <DiapositivasEditor
                  slides={imagenes}
                  onChange={setImagenes}
                  contacto={{ nombre: `${user?.name || ''} ${user?.lastName || ''}`.trim(), telefono: user?.phone }}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle className="text-base">Información general</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Título *</Label>
                  <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Departamento amueblado zona centro" required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Subtítulo</Label>
                  <Input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Frase corta destacada (opcional)" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo de propiedad</Label>
                  <Select value={tipoPropiedad} onValueChange={setTipoPropiedad}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPOS_PROPIEDAD).map(([key, { label }]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Modalidad</Label>
                  <Select value={modalidadRenta} onValueChange={setModalidadRenta}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(MODALIDADES).map(([key, { label }]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Colonia *</Label>
                  <Input value={colonia} onChange={(e) => setColonia(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Ciudad *</Label>
                  <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Recámaras</Label>
                  <Input type="number" min={0} value={recamaras} onChange={(e) => setRecamaras(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Baños</Label>
                  <Input type="number" min={0} value={banos} onChange={(e) => setBanos(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Descripción</Label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={4}
                    className="border-input placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none md:text-sm"
                  />
                </div>
                <div className="flex items-center justify-between sm:col-span-2">
                  <Label htmlFor="destacado">Destacado</Label>
                  <Switch id="destacado" checked={destacado} onCheckedChange={setDestacado} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Precio</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Moneda</Label>
                  <Select value={moneda} onValueChange={setMoneda}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MXN">MXN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Precio *</Label>
                  <Input type="number" min={0} value={precio} onChange={(e) => setPrecio(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Periodo</Label>
                  <Select value={periodo} onValueChange={setPeriodo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="/mes">/mes</SelectItem>
                      <SelectItem value="/noche">/noche</SelectItem>
                      <SelectItem value="total">Precio total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Imágenes</CardTitle></CardHeader>
              <CardContent>
                <ImagenesUploader imagenes={imagenes} onChange={setImagenes} />
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(`${basePath}/anuncios`)}>Cancelar</Button>
          <Button type="submit" disabled={saving || !puedeGuardar}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isEditing ? 'Guardar cambios' : 'Crear anuncio'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AnuncioForm;
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Verificación manual en el navegador**

Con `npm run dev` (o `vercel dev` si se necesita el backend real), sesión iniciada como un usuario con rol que vea "Admin. Condominios":

1. Ir a `/anuncios/nuevo` -- confirmar que el formulario NO pide colonia/precio/recámaras, y que se ven las 3 tarjetas: Información general, Texto de la publicación (con el botón de emoji funcionando), Diapositivas.
2. Agregar una diapositiva, subir una foto real, escribir un encabezado y salir del campo (blur) -- confirmar que aparece el spinner y luego la miniatura ya compuesta (foto + logo + texto encima).
3. Agregar una segunda diapositiva con otra foto/encabezado distinto, reordenar con las flechas, y guardar el anuncio.
4. Confirmar en `/anuncios` que el nuevo anuncio aparece con la miniatura compuesta (no la foto cruda) y sin badges de precio/colonia.
5. Ir a `/airbnb/anuncios/nuevo` y confirmar que el formulario de Airbnb se ve exactamente igual que antes de este cambio (categoría PROPIEDAD, sin diapositivas ni emojis).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/anuncios/AnuncioForm.tsx
git commit -m "$(cat <<'EOF'
feat: AnuncioForm soporta anuncios de servicio (Condominios)

/anuncios/nuevo (contexto Condominios) crea categoria SERVICIO con
titulo + caption con emojis + editor de diapositivas; /airbnb sigue
creando PROPIEDAD sin ningun cambio de comportamiento.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Verificación final end-to-end

**Files:** ninguno nuevo -- solo validación de todo lo anterior en conjunto.

- [ ] **Step 1: Compilación y build completos**

Run: `npx tsc --noEmit && npm run build`
Expected: ambos sin errores.

- [ ] **Step 2: Recorrido completo de la Prueba del spec**

Repetir, en orden, los 5 puntos de la sección "Prueba" de `docs/superpowers/specs/2026-09-12-anuncios-condominios-servicio-design.md`:

1. Confirmar que un anuncio de Airbnb creado antes de esta pieza se sigue viendo y editando exactamente igual (categoría PROPIEDAD por default).
2. Crear un anuncio de Condominios real de punta a punta (formulario → Vercel Blob → guardado), con 2-3 diapositivas.
3. Confirmar que `imagenCompuestaUrl` de cada diapositiva responde `200` con `Content-Type: image/jpeg` al abrirla directamente.
4. Confirmar que `ListaAnuncios.tsx` y `AnuncioDetail.tsx` no truenan y se ven razonables para este anuncio.
5. Verificación visual manual del editor de diapositivas ya cubierta en Task 10, Step 4 -- reconfirmar aquí que sigue viéndose bien después de todos los cambios posteriores.

- [ ] **Step 3: Informar al usuario y cerrar la pieza**

Resumir al usuario: qué se construyó, qué falta (piezas 2, 3 y 4, tal como quedaron documentadas en "Fuera de alcance" del spec), y confirmar que puede probarlo él mismo en producción antes de arrancar la siguiente pieza.
