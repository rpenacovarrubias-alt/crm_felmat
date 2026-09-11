# Diseño: Configuración de Redes Sociales — Fase 1

**Fecha:** 2026-09-11
**Estado:** Aprobado por el usuario, listo para plan de implementación.

## Contexto

`crm_felmat` ya tiene un sistema de Anuncios real en Postgres (`Anuncio` +
`PublicacionCanal`, con `modo: 'admin' | 'airbnb'`) pensado para que n8n
publique automáticamente en redes sociales, pero las funciones que de verdad
hablan con Facebook/Instagram (`src/lib/social-apis/facebook.ts`,
`instagram.ts`) son stubs (`// TODO: Implementar con Facebook Graph API`,
simulan con `setTimeout`). Tampoco hay ningún lugar real donde guardar las
credenciales de Meta necesarias para que esas funciones existan de verdad.

Existe una pantalla `SocialConfig.tsx` que parece una configuración de APIs
sociales, pero es enteramente de prueba: vive en estado de React que se borra
al recargar, y solo la URL de webhook de n8n se guarda (en `localStorage`,
no en el servidor). No sirve como base real.

Esta es la **Fase 1** de una construcción en dos etapas que el usuario pidió
explícitamente dividir: aquí solo se construye la UI y el guardado real de
credenciales, sección por sección. Conectar esas credenciales a funciones que
de verdad publiquen o respondan mensajes en Meta es Fase 2, deliberadamente
fuera de este alcance.

## Decisiones confirmadas con el usuario

1. **3 configuraciones independientes**, no 2: Propiedades, Admin.
   Condominios y AIRBNB cada una con su propia Página de Facebook / cuenta de
   Instagram — no comparten credenciales aunque dos de ellas sean la misma
   empresa.
2. **Permisos:** cualquier usuario autenticado puede ver/editar la
   configuración de una sección (no hay `adminOnly` en estos 3 grupos del
   sidebar hoy, así que no se introduce una restricción nueva).
3. **Navegación:** "Redes Sociales" es un link plano más dentro de cada uno
   de los 3 grupos existentes del sidebar (mismo patrón que "Inventario",
   "Cotizaciones", etc.) — no un menú anidado de 2 niveles nuevo. Lleva a una
   página con 2 tarjetas (Facebook / Instagram) que abren el formulario de
   esa plataforma.

## Modelo de datos

Nuevo modelo Prisma `FelmatSocialConfig`, una fila por combinación
sección × plataforma (6 filas totales, creadas bajo demanda con upsert, no
sembradas de antemano):

```prisma
model FelmatSocialConfig {
  id          String   @id @default(cuid())
  section     String   // 'propiedades' | 'condominios' | 'airbnb'
  platform    String   // 'facebook' | 'instagram'
  enabled     Boolean  @default(false)
  appId       String?
  appSecret   String?
  accountId   String?  // Page ID (facebook) o Instagram Business Account ID (instagram)
  accessToken String?
  updatedBy   String
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())

  @@unique([section, platform])
  @@map("felmat_social_config")
}
```

`appSecret` y `accessToken` se guardan en texto plano -- mismo nivel de
protección que el resto de esta base de datos (no hay cifrado de campo en
ningún modelo de este proyecto hoy). Es una limitación conocida, aceptada
explícitamente para esta fase; cifrado a nivel de campo queda como mejora
futura si se pide.

## Backend

`api/felmat-social-config.js`, siguiendo el patrón exacto de
`api/felmat-properties.js` (whitelist de campos, `getSession`/autenticación):

- **GET** `?section=propiedades&platform=facebook` -> una config, o sin
  query params -> las 6 (creadas o no). Nunca regresa `appSecret` ni
  `accessToken` completos: en su lugar, `hasAppSecret: boolean` y
  `accessTokenPreview: string | null` (últimos 4 caracteres, ej. `"…1a2b"`)
  -- mismo principio que el resto del backend nunca expone
  `passwordHash`/`salt`.
- **PUT** body `{ section, platform, enabled, appId, appSecret?, accountId,
  accessToken? }` -> upsert por `[section, platform]`. Si `appSecret` o
  `accessToken` vienen `undefined` en el body, se conserva el valor existente
  en la base (permite editar solo `enabled`/`appId`/`accountId` sin tener que
  re-escribir el secret cada vez); si vienen como string vacío explícito,
  se borran. `updatedBy` se toma de `session.sub`, nunca del body.
- Requiere sesión válida (cualquier rol) -- `getSession(req)`, 401 si no hay
  sesión. No hay chequeo de rol adicional (decisión #2 arriba).

## Frontend

- `src/lib/socialConfigApi.ts` -- cliente delgado (`getSocialConfig`,
  `saveSocialConfig`), mismo patrón que `apiFetch`.
- `src/pages/RedesSociales.tsx` -- recibe `section` por prop/ruta, muestra 2
  tarjetas grandes (Facebook / Instagram) con su estado actual (Activo /
  Inactivo, según `enabled`). Clic en una lleva al formulario.
- `src/components/social/SocialConfigForm.tsx` -- formulario reutilizable
  para las 6 combinaciones. 4 campos (App ID, App Secret, Account ID --
  label cambia a "Page ID" o "Instagram Business Account ID" según
  `platform`--, Access Token) + switch `enabled`. Los campos de secret
  arrancan vacíos con placeholder `hasAppSecret ? '••••••••1a2b' : ''`;
  escribir algo nuevo lo reemplaza, dejarlo vacío conserva el valor actual.
  Guardar hace PUT y muestra toast de éxito/error (patrón `sonner` ya usado
  en el resto del CRM).

**Rutas nuevas en `App.tsx`** (dentro del grupo protegido/autenticado):
```
/propiedades/redes-sociales                    -> RedesSociales section="propiedades"
/propiedades/redes-sociales/facebook            -> SocialConfigForm
/propiedades/redes-sociales/instagram           -> SocialConfigForm
/condominios/redes-sociales                     -> RedesSociales section="condominios"
/condominios/redes-sociales/facebook            -> SocialConfigForm
/condominios/redes-sociales/instagram           -> SocialConfigForm
/airbnb/redes-sociales                          -> RedesSociales section="airbnb"
/airbnb/redes-sociales/facebook                 -> SocialConfigForm
/airbnb/redes-sociales/instagram                -> SocialConfigForm
```

**Sidebar (`Sidebar.tsx`):** se agrega `{ label: 'Redes Sociales', href:
'.../redes-sociales', icon: Share2 }` al final de `items` en
`propertiesGroup`, `adminCondominiosGroup` y `airbnbGroup`. `Share2` ya está
importado (se usa en "Listas compartidas"). Los `isXActive` de cada grupo en
`Sidebar.tsx` ya usan `startsWith` sobre el prefijo de esa sección
(`/propiedades`, `/airbnb`), así que las nuevas rutas activan el grupo
correcto sin tocar esa lógica -- excepto `condominios`, que hoy no tiene un
prefijo propio (`isAdminCondominiosActive` usa rutas sueltas como
`/carta-presentacion`, `/admin/condominios`); se le agrega
`location.pathname.startsWith('/condominios')` a esa condición.

## Fuera de alcance (Fase 2)

- Las funciones reales de `src/lib/social-apis/facebook.ts` e
  `instagram.ts` (siguen siendo stubs).
- Cualquier workflow de n8n que lea esta configuración y publique de verdad.
- Recepción/respuesta de mensajes y comentarios (requiere suscripción de
  webhooks de Meta, verify token, etc. -- ninguno de esos campos se agrega
  todavía, YAGNI hasta que exista el consumidor).
- Validar las credenciales contra la API real de Meta ("Probar conexión")
  -- por ahora el formulario solo guarda; probar conexión real es Fase 2.

## Prueba

1. `npx tsc --noEmit` limpio.
2. Con sesión real (signSession, nunca password real): PUT a las 6
   combinaciones, confirmar upsert correcto y que GET nunca regresa el
   secret/token completos.
3. En el navegador: entrar a cada una de las 3 secciones, confirmar que
   "Redes Sociales" aparece en el sidebar, lleva a las 2 tarjetas, y que
   guardar un formulario persiste tras recargar la página (a diferencia del
   `SocialConfig.tsx` viejo).
