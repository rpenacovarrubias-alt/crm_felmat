# Diseño: mapa en PDF, datos reales del asesor, fichas personalizables

**Fecha:** 2026-08-01
**Estado:** Aprobado por el usuario, pendiente de plan de implementación
**Proyecto:** `crm_felmat` (CRM Inmobiliario Felmat)

## Contexto

Tras arreglar el flujo básico de compartir fichas (WhatsApp, link, PDF —
ver commits `a6803e98` y anteriores), el usuario pidió tres mejoras
relacionadas con la ficha pública de propiedad y sus datos de asesor:

1. El PDF solo muestra un código QR para la ubicación; falta una
   ilustración de mapa + el link de Google Maps como texto.
2. La tarjeta "Asesor" de la ficha (pública, PDF, y vista previa en el
   diálogo de compartir) a veces muestra datos de muestra en vez de los
   datos reales del asesor, incluso cuando la propiedad sí pertenece a
   un asesor real y con perfil completo.
3. Cuando alguien comparte una ficha, se necesita poder sustituir los
   datos de contacto mostrados por otros — de una persona que ni
   siquiera tiene que ser un usuario del CRM (ej. un colega externo, un
   referido) — sin alterar el registro original de la propiedad ni el
   asesor real asignado.

### Causa raíz de (2), confirmada con el usuario

El fallback hardcodeado en `PublicPropertyPage.tsx` y `pdfExport.ts`
usa el nombre **"Mayra Fajer"** — que coincide, por casualidad, con el
nombre de una asesora real ya cargada en el sistema. Cuando el
`agentId` de una propiedad no resuelve a un usuario real (por ejemplo,
porque un script de importación puso un id de asesor equivocado o
inexistente), la ficha cae al fallback, pero como el nombre "parece"
correcto, el problema pasa inadvertido — el teléfono y correo
mostrados sí son inventados, aunque el nombre no lo delate.

Además, `PropertyForm.tsx` nunca tuvo un campo para asignar o corregir
el asesor de una propiedad: `agentId` solo se fija una vez, al crear
(usando el id de quien la crea), y no hay forma de reasignarla desde la
interfaz. Cualquier vínculo roto (como el que probablemente introdujo
el script de importación de Wiggot) es permanente e invisible.

## Objetivos

- El PDF de ubicación debe incluir una vista de mapa ilustrativa además
  del QR ya existente, más el link de Google Maps en texto.
- La tarjeta de "Asesor" debe reflejar siempre datos reales cuando el
  `agentId` resuelve a un usuario real, y debe ser honesta (no fingir
  ser una persona específica) cuando no resuelve.
- Debe existir una forma, desde la interfaz, de asignar o corregir el
  asesor de una propiedad.
- Cualquier persona que ya pueda compartir una ficha debe poder generar
  una versión de esa ficha con datos de contacto personalizados —sin
  necesidad de que esa persona sea un usuario del CRM— sin afectar la
  ficha original ni los permisos de visibilidad existentes sobre el
  inventario.

## No objetivos

- No se cambia el modelo de permisos existente (quién puede ver
  propiedades de quién). La personalización de ficha usa exactamente
  el mismo alcance de visibilidad que ya existe hoy.
- No se implementa un mapa estático real (imagen de tiles) vía una API
  de pago; la ilustración es un pin/tarjeta hecho con CSS/DOM (igual
  que el resto del PDF), no una captura del mapa real — el QR y el
  link en texto son el respaldo funcional para llegar a la ubicación
  real.
- No se migra la base de datos de propiedades a Postgres (ver
  conversación previa sobre arquitectura de fondo) — eso sigue siendo
  un tema aparte.

---

## A. Mapa ilustrativo en el PDF

**Problema:** hoy el PDF solo tiene el QR agregado en la sesión
anterior; falta una referencia visual + el link en texto plano, para
quien no pueda o no quiera escanear el QR.

**Cambio:** en `pdfExport.ts`, en el mismo recuadro de "Ubicación"
(página 2), junto al QR:

- Agregar una miniatura ilustrativa con un pin de ubicación y el
  nombre de la colonia/ciudad (ilustración simple con CSS/DOM, sin
  depender de una imagen de mapa externa — evita el riesgo de "tainted
  canvas" ya documentado con imágenes sin CORS).
- Agregar el link de Google Maps como texto plano visible (no solo
  dentro del QR), para que se pueda copiar manualmente de una copia
  impresa o reenviar el PDF.

El QR se mantiene: en un documento impreso es la forma más rápida de
llegar al mapa desde un celular.

---

## B. Datos reales del asesor

### B.1 Fallback honesto

**Antes:** `agentName`, `agentPhone`, `agentEmail`, etc. caían a
`'Mayra Fajer'`, `'442 124 9613'`, `'diversainmobiliariosqueretaro@gmail.com'`
cuando `agent` era `null`.

**Después:** cuando no hay un asesor real vinculado (`agentId` no
resuelve a un `User`), la tarjeta de "Asesor" deja de mostrar una
identidad inventada. En su lugar:

- Nombre: "Grupo FELMAT" (marca, no persona).
- Sin teléfono/WhatsApp/certificado inventados — se omiten esos campos
  por completo (igual que ya se hace hoy cuando un campo real está
  vacío, ej. `showCertificate && user.config?.certificateNumber`).
- Correo: se mantiene un correo genérico de contacto de la agencia
  (esto sí es legítimo tener un valor por defecto, a diferencia de
  fingir un teléfono/nombre de persona) — pero se dejará configurable
  como constante nombrada, no repetido en cada archivo.

Este cambio aplica en `PublicPropertyPage.tsx`, `pdfExport.ts`, y el
`ShareDialog` de `PropertyDetail.tsx` (los tres puntos donde hoy existe
el mismo fallback duplicado).

### B.2 Asignar/corregir el asesor de una propiedad

**Cambio:** agregar un campo "Asesor asignado" en `PropertyForm.tsx`
(pestaña General), un `<select>` poblado con `useUsers()` (usuarios con
rol `agent` o `admin`, activos). Reglas:

- Visible y editable para `admin` siempre.
- Para un agente normal: visible pero de solo lectura, mostrando su
  propio nombre (no puede reasignar propiedades a otros agentes desde
  aquí — eso no formaba parte del pedido y evita tocar el modelo de
  permisos).
- Al crear una propiedad nueva, sigue por defecto siendo el usuario
  actual (comportamiento actual, sin cambios).
- Al editar, el admin puede cambiar el `agentId` a cualquier usuario
  real de la lista — así se corrige el vínculo roto de la propiedad de
  Mayra sin tocar código ni la base de datos directamente.

### B.3 Indicador de vínculo roto (solo dentro del CRM, no público)

En `PropertyDetail.tsx` (vista interna), si `property.agentId` no
resuelve a ningún usuario en `useUsers()`, mostrar un aviso visible
solo para quien tiene la propiedad abierta en el CRM (ej. un banner
ámbar "⚠ Esta propiedad no tiene un asesor válido asignado — corrígelo
en Editar"). Esto hace que el problema sea visible la próxima vez que
ocurra, en vez de descubrirse por casualidad meses después.

---

## C. Fichas personalizables ("Compartir personalizado")

### C.1 Modelo de datos

Nuevo store de IndexedDB, `propertyShares`, siguiendo el mismo patrón
ya usado por `propertyLists` (bump de `DB_VERSION` a 4):

```ts
interface PropertyShare {
  id: string;
  slug: string;           // único, index unique — es la URL pública
  propertyId: string;     // la propiedad original, sin modificarla
  createdBy: string;      // user.id de quien generó este link
  // Todos los campos de contacto son opcionales y de texto libre.
  // Si están vacíos, la ficha usa los datos reales del creador
  // (ya no el fallback falso descrito en B.1).
  overrideName?: string;
  overridePhone?: string;
  overrideWhatsapp?: string;
  overrideEmail?: string;
  overrideAvatar?: string;      // data URI, igual que el resto de imágenes
  overrideCertificate?: string;
  overrideBio?: string;
  createdAt: string;
  updatedAt: string;
}
```

Store: `keyPath: 'id'`, índices `slug` (unique) y `propertyId` (no
unique, para listar los envíos personalizados de una propiedad si se
necesita a futuro).

### C.2 Hook `usePropertyShares`

Mismo patrón que `usePropertyLists` en `useDatabase.ts`:
`create(propertyId, createdBy, overrides)`, `update`, `remove`,
`getBySlug(slug)`, `refresh`.

### C.3 Resolución en la ficha pública

`PublicPropertyPage.tsx` (y el hook `getBySlug` de `useProperties`) hoy
resuelve `/p/:slug` directo contra `properties.slug` o `properties.id`.
Cambio en el flujo de carga:

1. Primero intentar `usePropertyShares().getBySlug(identifier)`.
2. Si existe un `PropertyShare`, cargar la propiedad real vía
   `propertyId`, y calcular los datos de "Asesor" a mostrar como:
   `override.campo ?? datosRealesDelCreador.campo ?? (nada, ver B.1)`.
3. Si no existe un `PropertyShare` con ese slug, seguir el
   comportamiento actual (buscar directo en `properties`).

Esto evita tocar las rutas de `App.tsx` — todo sigue viviendo bajo
`/p/:slug`. La ficha "original" (`/p/<slug-de-la-propiedad>`) nunca
pasa por `propertyShares` y siempre muestra al asesor real — solo los
links generados explícitamente vía "Compartir personalizado" tienen
override.

### C.4 UI para crear un envío personalizado

En el `ShareDialog` de `PropertyDetail.tsx` (mismo diálogo que ya tiene
las pestañas WhatsApp / PDF / Enlace), agregar una sección
"Personalizar contacto para este envío" (colapsable, cerrada por
defecto) con: nombre, teléfono, WhatsApp, correo, certificado, foto —
todos opcionales. Al llenarlos y confirmar:

- Se crea un `PropertyShare` nuevo.
- El enlace, el mensaje de WhatsApp y el botón de PDF de ese diálogo
  pasan a usar la URL y los datos del share personalizado en vez de
  los de la ficha original, para esa sesión de compartir.
- Si el usuario no llena ningún campo, no se crea un `PropertyShare` —
  se comparte la ficha original tal cual (sin overhead innecesario).

### C.5 PDF con datos personalizados

`exportPropertyToPDF` ya recibe `agent: User | null`. Se generaliza el
tipo de ese parámetro a una forma más chica que cubra tanto un `User`
real como un override de `PropertyShare` (incluir solo los campos que
la función realmente usa: name, lastName, phone, email, avatar,
config.bio, config.whatsappNumber, config.certificateNumber — un
adaptador simple mapea cualquiera de los dos orígenes a esa forma antes
de llamar a `exportPropertyToPDF`).

### C.6 Alcance de permisos (sin cambios)

Quien ya puede abrir una ficha en `PropertyDetail.tsx` hoy (su propia
propiedad, o cualquiera si es admin) puede generar un
`PropertyShare` para ella. No se modifica `canViewAllProperties` ni el
filtro por `agentId` en `useProperties()`.

---

## Pruebas

- **B.1/B.3:** propiedad con `agentId` inválido → la ficha pública y el
  PDF no muestran nombre/teléfono inventados; el CRM muestra el aviso
  de vínculo roto.
- **B.2:** admin reasigna el asesor desde `PropertyForm`; la ficha
  pública refleja el cambio sin recargar código, solo los datos de
  IndexedDB.
- **C.1–C.3:** crear un `PropertyShare` con overrides parciales (solo
  teléfono, por ejemplo) → la ficha pública muestra ese teléfono pero
  el nombre real del creador (fallback a datos reales, no al fallback
  falso de B.1).
- **C.3:** abrir la ficha original (`/p/<slug-propiedad>`) después de
  crear un share personalizado → sigue mostrando al asesor real, sin
  contaminarse.
- **C.5:** descargar el PDF desde un link personalizado → usa los
  datos del override.
- Build (`npm run build`) y `tsc --noEmit` limpios antes de cada commit
  (igual que en el fix anterior).

## Migración de datos

`DB_VERSION` sube de 3 a 4 para crear el store `propertyShares`. No
requiere migrar datos existentes (store nuevo, vacío).
