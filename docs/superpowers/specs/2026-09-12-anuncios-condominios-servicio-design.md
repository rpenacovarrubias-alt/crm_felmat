# Diseño: Anuncios tipo "servicio" para Administración de Condominios

**Fecha:** 2026-09-12
**Estado:** Aprobado por el usuario, listo para plan de implementación.
**Pieza:** 1 de 4 del trabajo mayor "Anuncios editables + IA + publicación real"
(ver piezas 2-4 en "Fuera de alcance").

## Contexto

El enlace "Anuncios" del grupo **Admin. Condominios** en el sidebar
(`/anuncios`) y el de **AIRBNB** (`/airbnb/anuncios`) comparten hoy el mismo
componente `AnuncioForm.tsx`, pensado para una unidad inmobiliaria (título,
tipo de propiedad, colonia, ciudad, precio, recámaras, baños). Tiene sentido
para Airbnb (una unidad real) pero no para Condominios: un servicio de
administración no tiene colonia, precio ni recámaras. Además, en el esquema
actual `colonia`, `ciudad`, `precio`, `tipoPropiedad` y `modalidadRenta` son
columnas obligatorias en `Anuncio` -- hoy es literalmente imposible guardar
un anuncio de Condominios sin inventar una colonia y un precio falsos.

Propiedades no tiene ningún enlace a `/anuncios` en el sidebar hoy -- por lo
que esta ruta, en la práctica, ya le pertenece a Condominios. Nada se rompe
al redirigir su comportamiento por defecto.

De paso se confirmó, revisando el código, que dos piezas relacionadas están
simuladas y no hacen lo que aparentan:

- `AnuncioGenerator.tsx` ("Generador de Anuncios con IA") es un mock
  (`setTimeout` + plantilla fija de texto), no está conectado a ningún
  formulario todavía, y no llama a ningún modelo real.
- `api/publicar.js` (el botón "Publicar en..." de `ListaAnuncios.tsx` /
  `AnuncioDetail.tsx`) sí existe y sí se ejecuta, pero solo marca el canal
  como `PENDIENTE` en `PublicacionCanal` -- nunca llama al Graph API de Meta.

Ninguna de las dos se toca en esta pieza (son las piezas 2 y 3). Se dejan
documentadas aquí porque son las que motivaron separar el trabajo en 4
piezas en vez de intentarlo todo junto.

## Decisiones confirmadas con el usuario

1. **Un solo modelo `Anuncio`, con un campo `categoria`** ('PROPIEDAD' |
   'SERVICIO'), en vez de una tabla separada -- reutiliza `ListaAnuncios`,
   `AnuncioDetail`, el flujo de "Publicar en...", `ImagenAnuncio` y
   `PublicacionCanal` tal cual, con una rama condicional en el formulario.
2. **Estructura de texto para tipo SERVICIO:** título (nombre interno del
   anuncio, se usa en la lista) + un cuerpo/caption con selector de emojis
   integrado (no basta con el atajo del sistema operativo -- se pidió un
   selector visible en el editor).
3. **La imagen se compone con la plantilla de marca automáticamente** al
   subir la foto -- no se publica la foto cruda. Reutiliza la decisión ya
   tomada en `2026-09-11-plantillas-anuncios-redes-sociales-design.md`
   (composición en el navegador + subida a Vercel Blob), que hasta hoy solo
   existía como prototipo estático, nunca como código real.
4. **Editor multi-diapositiva completo:** un anuncio de Condominios admite
   de 1 a 10 fotos, cada una con su propio encabezado y subtítulo
   (compuestos independientemente), publicadas juntas como un carrusel real
   en Meta. El cuerpo/caption es uno solo, compartido por todo el carrusel
   -- así es como Meta publica carruseles (un caption, N imágenes).
5. **El pie de contacto de la plantilla es dinámico**, tomado de
   `name`/`lastName`/`phone` del asesor en sesión -- no un dato fijo. Así
   sirve para cualquier asesor de Condominios, no solo para quien lo probó
   primero.

## Correcciones a la redacción original de este documento

Al mapear qué archivos toca esta pieza (paso obligatorio antes de escribir el
plan) aparecieron dos problemas reales que esta versión ya corrige:

1. **Colisión de nombres:** `api/anuncios.js` ya usa `req.query.tipo` como
   filtro de `tipoPropiedad` (CASA/DEPARTAMENTO/...). Llamar `tipo` al nuevo
   discriminador PROPIEDAD/SERVICIO en el mismo modelo sería confuso y
   propenso a error (dos significados de "tipo" en el mismo archivo). El
   campo nuevo se llama **`categoria`**, no `tipo`.
2. **`ListaAnuncios.tsx` y `AnuncioDetail.tsx` truenan con datos nulos:**
   ambos renderizan hoy `anuncio.precio.toLocaleString(...)`,
   `anuncio.colonia`, `anuncio.recamaras`, `getTipoConfig(anuncio.tipoPropiedad)`
   sin ninguna verificación. En cuanto `precio`/`colonia`/`tipoPropiedad`
   pasen a ser opcionales, un anuncio SERVICIO real haría crashear estas dos
   pantallas (`.toLocaleString` sobre `null` truena). Como esta pieza es la
   que vuelve esos campos opcionales, corregir ambos archivos es parte
   necesaria de esta pieza, no un extra.

## Modelo de datos

```prisma
model Anuncio {
  // ...campos existentes sin cambio...
  categoria       String   @default("PROPIEDAD") // 'PROPIEDAD' | 'SERVICIO'
  colonia         String?  // antes String (obligatorio)
  ciudad          String?  // antes String (obligatorio)
  precio          Float?   // antes Float (obligatorio)
  tipoPropiedad   String?  // antes String (obligatorio)
  modalidadRenta  String?  // antes String (obligatorio)
  // recamaras/banos se quedan Int @default(0) sin cambio -- 0 es un
  // default inofensivo también para tipo SERVICIO, no vale la pena
  // volverlos opcionales.
}

model ImagenAnuncio {
  // ...campos existentes sin cambio...
  headline           String? // encabezado superpuesto en esta diapositiva (solo tipo SERVICIO)
  subtitulo          String? // subtítulo superpuesto en esta diapositiva (solo tipo SERVICIO)
  imagenCompuestaUrl String? // URL en Vercel Blob de la versión ya compuesta con marca -- es la que se publica
}
```

La validación de "colonia/ciudad/precio obligatorios cuando tipo=PROPIEDAD"
vive en el formulario y en `api/anuncios.js` / `api/anuncios/[id].js`, no en
la base de datos -- igual que ya se hace hoy con otros campos opcionales del
mismo modelo.

Migración seleccionada: `npx prisma migrate dev` (o `db push` en dev, según
el flujo que ya usa el proyecto) agregando las columnas nuevas y relajando
los `NOT NULL` de las cinco columnas listadas. No hay pérdida de datos: las
filas existentes ya traen valores reales en esas columnas y se les asigna
`categoria = 'PROPIEDAD'` por el default.

## Formulario (`AnuncioForm.tsx`)

Se determina `categoria` al crear: la ruta `/anuncios/nuevo` (contexto
Condominios, `modo === 'admin'`) crea siempre `categoria: 'SERVICIO'` a partir de
ahora. `/airbnb/anuncios/nuevo` sigue creando `categoria: 'PROPIEDAD'`, sin
cambios. Al editar, `categoria` viene del anuncio cargado y no se puede cambiar
después de creado (evita dejar a medio migrar un anuncio con campos de
ambos mundos).

Cuando `categoria === 'SERVICIO'`, el formulario reemplaza las tarjetas de
propiedad por:

- **Información general** -- un solo campo, "Título del anuncio" (nombre
  interno, aparece en `ListaAnuncios`). No hay tipo de propiedad, modalidad,
  colonia, ciudad, recámaras, baños, precio ni "Destacado".
- **Texto de la publicación** -- `Textarea` ligado a `descripcion`, con un
  botón de emojis al lado (nueva dependencia ligera de selector de emojis
  para React) que inserta el emoji en la posición del cursor. Este es el
  caption real que acompaña las N diapositivas al publicar.
- **Diapositivas** -- lista de 1 a 10 elementos. Cada elemento:
  - Subir/arrastrar una foto (reutiliza el mismo patrón de dropzone que
    `ImagenesUploader` ya tiene).
  - Campo "Encabezado" y campo "Subtítulo" (cortos, de una línea).
  - Vista previa real: el mismo componente `PlantillaCondominios` montado
    en miniatura -- no una simulación aparte, así lo que se ve es
    exactamente lo que se compone.
  - Botones subir/bajar (reordenar) y eliminar.
  - "+ Agregar diapositiva", deshabilitado al llegar a 10.

Cuando `categoria === 'PROPIEDAD'` el formulario se comporta exactamente igual
que hoy -- ningún cambio visible para Airbnb.

## Compositor

- `src/components/anuncios/templates/PlantillaCondominios.tsx` -- 1080×1080
  fijo (no responsive), recibe `{ headline: string, subtitulo: string,
  fotoUrl: string, contacto: { nombre: string, telefono: string } }`. Layout
  idéntico al aprobado en el carrusel: foto a pantalla completa, degradado
  diagonal oscuro, logo Felmat, encabezado/subtítulo, pie de contacto.
- `src/lib/generarImagenAnuncio.ts` -- renderiza a imagen una instancia
  montada fuera de pantalla de `PlantillaCondominios`. **No se agrega
  `html-to-image` como dependencia nueva:** `html2canvas` ya está instalado
  (`node_modules/html2canvas` v1.4.1) y ya se usa en `src/lib/pdfExport.ts`
  para lo mismo (DOM a canvas, para el PDF de fichas). Se reutiliza tal
  cual: `html2canvas(nodo, { width: 1080, height: 1080 })` seguido de
  `canvas.toDataURL('image/jpeg', 0.85)`. De paso se agrega `html2canvas`
  a `package.json` como dependencia directa (hoy es transitiva -- llega
  instalada porque alguna otra dependencia la trae, no porque el proyecto
  la declare -- y `pdfExport.ts` ya confía en que esté ahí; declararla
  explícitamente corrige ese riesgo latente de raíz para ambos usos, no
  solo para este nuevo). Se usa JPEG y no PNG -- un PNG de una foto real
  pesa varias veces más que un JPEG comparable, y ya nos mordió una vez el
  límite de ~4.5MB por request de las funciones de Vercel (bug real de
  fotos de propiedad, corregido antes con compresión en canvas). Usar JPEG
  aquí evita reabrir ese mismo problema.
- `api/felmat-upload-anuncio-image.js` -- nuevo endpoint. **Corrección
  importante:** este repo no tiene un solo patrón de autenticación para
  `api/*.js` -- `felmat-social-config.js` usa `getSession` (sesión real de
  usuario), pero todo el subsistema de Anuncios (`api/anuncios.js`,
  `api/anuncios/[id].js`, `api/publicar.js`) usa `requireApiKey` (un
  secreto compartido `ANUNCIOS_API_KEY`, ver `api/_lib/auth.js` --
  "el CRM no tiene sesiones server-side todavía", comentario ya desactualizado
  pero fiel a cómo funciona hoy este subsistema en particular). Este endpoint
  nuevo vive del lado de Anuncios y lo llama `anunciosApi.ts` (cuyo
  `apiFetch` ya manda el Bearer de `ANUNCIOS_API_KEY` en cada request, no
  una cookie de sesión) -- así que usa **`requireApiKey`**, igual que sus
  vecinos, no `getSession`. Arreglar el modelo de autenticación de todo el
  subsistema de Anuncios es un problema real pero separado, fuera de
  alcance aquí.
  Recibe un `{ dataUrl: string }` (igual que ya se hace con
  `ImagenAnuncio.url` hoy, sin librería de multipart nueva), decodifica el
  base64 y lo sube a Vercel Blob (`@vercel/blob`, nueva dependencia) con
  `access: 'public'`, regresa la URL pública. Se usa dos veces por
  diapositiva: una vez para la foto cruda recién subida (se guarda en
  `ImagenAnuncio.url`) y otra vez para el resultado compuesto (se guarda en
  `imagenCompuestaUrl`) -- mismo endpoint, dos llamadas, sin duplicar
  código.
- **Prerrequisito de infraestructura:** este endpoint necesita que el
  proyecto de Vercel tenga un Blob store creado y la variable de entorno
  `BLOB_READ_WRITE_TOKEN` configurada. Es un paso manual de una sola vez en
  el dashboard de Vercel -- se confirma al inicio del plan, antes de escribir
  código que dependa de él.
- Disparo de regeneración por diapositiva: al soltar/seleccionar una foto
  nueva, o al perder el foco (`onBlur`) de los campos de encabezado o
  subtítulo -- nunca en cada tecla, para no saturar la subida a Blob.
  Mientras se genera, esa diapositiva muestra un estado de carga; el
  `imagenCompuestaUrl` anterior se conserva hasta que la nueva composición
  termine (nunca se ve una diapositiva vacía a medio proceso).
- El pie de contacto se arma con `useAuth()` (`user.name`, `user.lastName`,
  `user.phone`) -- si el asesor no tiene teléfono cargado en su perfil, esa
  línea se omite en la plantilla en vez de mostrar un valor inventado.

## Pantallas de lista y detalle

`ListaAnuncios.tsx` (`GridView` y `ListView`) y `AnuncioDetail.tsx`
renderizan hoy, sin condición, `anuncio.precio.toLocaleString(...)`,
`anuncio.colonia`/`anuncio.ciudad`, `anuncio.recamaras`/`anuncio.banos` y
`getTipoConfig(anuncio.tipoPropiedad)`. En cuanto esos campos puedan ser
`null` (cualquier anuncio SERVICIO), estas pantallas truenan. Ambos archivos
necesitan una rama `anuncio.categoria === 'SERVICIO'`:

- Se omiten precio, colonia/ciudad, recámaras/baños y el badge de tipo de
  propiedad.
- El badge de estado, los íconos de canal (`CANALES`) y las estadísticas de
  vistas/contactos se quedan igual -- no dependen de ningún campo de
  propiedad.
- La miniatura/imagen principal usa `imagenes[0].imagenCompuestaUrl ||
  imagenes[0].url` en vez de solo `.url` -- para un anuncio SERVICIO ya
  compuesto, eso muestra la versión con marca; para uno PROPIEDAD (sin
  `imagenCompuestaUrl`) cae de vuelta al comportamiento actual sin cambiar
  nada.

## Fuera de alcance

- **Pieza 2** -- mejora de caption con IA real (reemplaza el mock de
  `AnuncioGenerator.tsx`), pensada para reusarse entre Condominios, Airbnb
  y a futuro Propiedades.
- **Pieza 3** -- conectar el botón "Publicar en..." ya existente al Graph
  API real de Meta, usando `FelmatSocialConfig` (credenciales por asesor) y
  las `imagenCompuestaUrl` que esta pieza empieza a generar.
- **Pieza 4** -- decidir y construir los cambios de Airbnb (¿texto libre
  igual que Condominios, o solo agregar IA + Publicar real a su formulario
  actual de unidad?). No se toca `AnuncioForm.tsx` en su rama `airbnb` en
  esta pieza, salvo por la adición no disruptiva del campo `categoria` (con
  default que preserva su comportamiento actual).
- Plantilla `PlantillaFicha.tsx` (Propiedad/Airbnb con foto+precio+badge) --
  sigue siendo solo diseño, no código, hasta que se retome esa parte del
  spec original.
- Sistema de planes Gratis/Dorado/Platino -- memoria
  `felmat-planes-suscripcion-redes-sociales-pendiente`, sin tocar.

## Prueba

1. `npx tsc --noEmit` y `npm run build` limpios.
2. Migración de esquema aplicada sin pérdida de datos: los anuncios de
   Airbnb existentes (`categoria` default 'PROPIEDAD') se siguen viendo y
   editando exactamente igual que antes de este cambio.
3. Crear un anuncio de Condominios real desde `/anuncios/nuevo`: confirmar
   que el formulario no pide colonia/precio/recámaras, que se pueden
   agregar hasta 10 diapositivas con encabezado/subtítulo propios, que cada
   una genera un JPEG de 1080×1080 en Vercel Blob (`imagenCompuestaUrl`
   responde 200, `image/jpeg`), y que el pie de contacto muestra los datos
   reales del asesor en sesión (probar con una sesión vía `signSession()`,
   nunca password real).
4. Confirmar que `ListaAnuncios.tsx` y `AnuncioDetail.tsx` muestran el
   anuncio de tipo SERVICIO sin errores (aunque el botón "Publicar" siga
   sin hacer nada real todavía -- eso es la pieza 3).
5. Verificación visual manual en el navegador del editor de diapositivas
   antes de dar por buena la composición.
