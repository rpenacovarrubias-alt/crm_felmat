# Sistema de usuarios real (auth + roles + propiedades) — Design

**Fecha:** 2026-09-08
**Repo:** `crm_felmat`
**Origen:** Ricardo pidió generar credenciales de administrador general; el login actual
resultó ser una contraseña hardcodeada (`123456` para cualquier usuario existente en
IndexedDB, ver `src/hooks/useAuth.tsx`) sin backend real. Se pidió replicar el sistema
de usuarios ya construido y probado en `airbnb-cohost-app` /
`anfitrion.coanfitrionesmexico.com.mx` (proyecto "Hospitalidad Digital").

## Contexto

- Hoy `Property`, `User` y `PropertyShare` viven **solo en IndexedDB del navegador**
  (ver memoria `felmat-crm-arquitectura-indexeddb` y
  `felmat-ficha-personalizable-pendiente-backend`). Esto ya estaba anotado como
  pendiente: las fichas compartibles (`PropertyShare`) no son visibles para nadie
  fuera del navegador que las creó, incluida gente externa sin cuenta — el caso de
  uso principal de esa feature.
- `crm_felmat` ya tiene backend real para el módulo Anuncios: Prisma + Postgres
  (`POSTGRES_URL`), funciones serverless de Vercel en JS plano bajo `api/`, y un
  guard simple de API key (`api/_lib/auth.js`).
- El proyecto fuente a replicar (`airbnb-cohost-app`, backend "Hospitalidad Digital")
  usa: tabla Postgres `cohost_users` con `password_hash`/`salt` (PBKDF2, Node
  `crypto`, sin librerías nuevas), sesión firmada con HMAC (JWT casero), flujo de
  "olvidé mi contraseña" con token de 30 min y correo vía webhook n8n → Gmail, y una
  matriz de permisos por rol y por recurso (`src/permissions.ts` +
  `usePermissions.ts`).

## Alcance de esta migración

Confirmado con Ricardo:
- **Entra:** `User`, `Property`, `PropertyShare` → Postgres vía Prisma.
- **No entra (por ahora):** `Lead`, `Condominios`, `TarjetaDigital`/`AgentWebsite`,
  Airbnb, Contratos, Fianzas, Cotizaciones — siguen en IndexedDB. Quedan como
  candidatos para una migración futura si se decide llevar todo el CRM a backend.
- **Datos:** arranque limpio. Hoy solo hay 2 usuarios demo falsos
  (`admin@felmat.com` / `agente@felmat.com`) sin propiedades reales cargadas —
  no hay nada que migrar/preservar.
- **Permisos:** matriz completa por recurso (no solo admin/no-admin).
- **Correo transaccional:** mismo patrón que cohost — webhook n8n → Gmail. Ricardo
  confirmó que poseen el dominio `felmat.com.mx` y que más adelante configurarán un
  remitente propio (no Gmail) para estos correos; **eso queda fuera de este spec**,
  se documenta como mejora futura (ver "Fuera de alcance").

## Modelo de datos

Se agregan 3 modelos al `prisma/schema.prisma` existente (misma base que Anuncios).
Prefijo `Felmat*` / tablas `felmat_*` para evitar choque de nombres si la instancia
Postgres llega a compartirse con otro proyecto del ecosistema.

```prisma
model FelmatUser {
  id             String    @id @default(cuid())
  email          String    @unique
  passwordHash   String?
  salt           String?
  name           String
  lastName       String
  phone          String?
  avatar         String?
  role           String    // 'super_admin' | 'admin' | 'agent' | 'assistant'
  agencyId       String?
  isActive       Boolean   @default(true)
  propertyAccess Json      @default("[]") // string[] de Property.id; [] = todas
  config         Json?     // AgentConfig completo (branding, shareSettings, digitalCard...)
  lastLogin      DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  properties     FelmatProperty[]
  shares         FelmatPropertyShare[]

  @@map("felmat_users")
}

model FelmatProperty {
  id              String    @id @default(cuid())
  title           String
  description     String
  propertyType    String
  transactionType String
  price           Float
  priceCurrency   String    @default("MXN")
  maintenanceFee  Float?
  status          String
  location        Json      // Location
  features        Json      // PropertyFeatures
  images          Json      @default("[]") // PropertyImage[]
  agentId         String
  agent           FelmatUser @relation(fields: [agentId], references: [id])
  agencyId        String?
  slug            String    @unique
  metaTitle       String?
  metaDescription String?
  tags            Json      @default("[]")
  views           Int       @default(0)
  leadsCount      Int       @default(0)
  favoritesCount  Int       @default(0)
  publishedAt     DateTime?
  isPublished     Boolean   @default(false)
  isFeatured      Boolean   @default(false)
  commission      Float?
  commissionType  String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  shares          FelmatPropertyShare[]

  @@index([agentId])
  @@index([status])
  @@map("felmat_properties")
}

model FelmatPropertyShare {
  id                  String   @id @default(cuid())
  slug                String   @unique
  propertyId          String
  property            FelmatProperty @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  createdBy           String
  creator             FelmatUser @relation(fields: [createdBy], references: [id])
  overrideName        String?
  overridePhone       String?
  overrideWhatsapp    String?
  overrideEmail       String?
  overrideAvatar      String?
  overrideCertificate String?
  overrideBio         String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("felmat_property_shares")
}
```

## Backend

Convención del repo: funciones serverless Vercel en **JS plano + PrismaClient**
(no TypeScript + `pg` crudo como en cohost). La matemática de hashing/sesión es la
misma de cohost, solo trasladada a ese estilo.

### `api/_lib/session.js` (nuevo)
- `hashPassword(pw)` / `verifyPassword(pw, hash, salt)` — PBKDF2-SHA256, 100 000
  iteraciones, salt aleatorio de 16 bytes (`crypto.randomBytes`).
- `signSession({ sub, role, propertyAccess })` / `verifySession(token)` — HMAC
  firmado con `SESSION_SECRET` (env var nueva), expira a los 30 días.
- `signResetToken(userId)` / `verifyResetToken(token)` — mismo HMAC,
  `purpose: 'reset'` (nunca sirve como sesión), expira a los 30 minutos.

### `api/felmat-login.js` — `POST { email, password }`
Busca en `FelmatUser`, verifica hash, actualiza `lastLogin`, regresa
`{ user, token }`. A diferencia de cohost: si `passwordHash` es `null` (usuario
recién creado, aún no le llegó su password temporal) el login **falla** — nunca hay
cuentas "abiertas" sin contraseña.

### `api/felmat-users.js` — protegido con `Authorization: Bearer <token>`
- `GET` — lista usuarios, solo `super_admin`/`admin`.
- `POST` — crea usuario, solo `super_admin`/`admin`; genera password temporal
  (`crypto.randomBytes(9)`), la regresa una sola vez en la respuesta.
- `PUT` — tres flujos:
  - Autoservicio: requiere `currentPassword`, solo puede tocar su propio `id`.
  - Reset por admin: `autoGeneratePassword`, solo `super_admin`/`admin`.
  - Edición de perfil/rol: solo `super_admin`/`admin`.
  - Regla de jerarquía: solo `super_admin` puede editar/eliminar cuentas con rol
    `admin` o `super_admin`.
- `DELETE` — solo `super_admin`/`admin` (con la regla de jerarquía de arriba);
  bloquea que te elimines a ti mismo.

### `api/felmat-password-reset.js` — un solo endpoint, dos mitades
- `POST { email }` → respuesta genérica siempre (nunca revela si el correo existe),
  dispara webhook n8n `felmat-restablecer-contrasena` con el link.
- `POST { token, newPassword }` → valida el token de 30 min, actualiza
  `passwordHash`/`salt`.

### `api/felmat-send-credentials.js`
Solo `super_admin`/`admin`. Dispara webhook n8n `felmat-enviar-credenciales` para
reenviar usuario/password temporal generados por `felmat-users.js`.

### `api/felmat-properties.js` — protegido con sesión
- `GET` — lista propiedades; si el rol no es `super_admin`/`admin`, filtra por
  `propertyAccess` del usuario (`[]` = todas, mismo criterio que cohost).
- `POST`/`PUT`/`DELETE` — respetan `canEditProperty`/`canDeleteProperty` (dueño de
  la propiedad o admin).

### `api/felmat-property-shares.js` — dos modos en el mismo archivo
- Con sesión: el agente crea/edita sus fichas compartibles.
- **`GET ?slug=...` sin sesión** — lectura pública. Resuelve el pendiente original:
  alguien sin cuenta abre el link de una ficha y sí la ve, porque ya no depende de
  IndexedDB del navegador que la creó.

Variable de entorno nueva: `SESSION_SECRET` (Vercel + `.env` local).

## Permisos (`src/permissions.ts` + `src/hooks/usePermissions.ts`)

Mismo patrón que `airbnb-cohost-app/src/permissions.ts`: por rol, arrays de
recursos permitidos para `canCreate/canEdit/canDelete/canView/canDownload/
canConfigure`, más restricciones (`ownPropertiesOnly`, etc.).

Recursos: `properties, leads, condominios, airbnb, anuncios, contratos,
cotizaciones, fianzas, users, propertyShares`.

| Rol | Alcance |
|---|---|
| `super_admin` | Todo, sin restricciones. Único que puede editar/eliminar cuentas `admin`. |
| `admin` | Todo, sin restricciones, excepto gestionar cuentas `admin`/`super_admin`. |
| `agent` | CRUD solo en sus propios recursos (`ownPropertiesOnly` vía `propertyAccess`); sin gestión de usuarios. |
| `assistant` | Ver + editar leads/actividades de sus propiedades asignadas; sin eliminar, sin `contratos`/`fianzas` (financiero), sin usuarios. |

Reemplaza los checks sueltos hoy regados en `Sidebar.tsx`, `PropertyList.tsx`,
`useAuth.tsx` (`user.role === 'admin'`).

## Frontend

- `useAuth.tsx`: `login()` pasa a llamar `/api/felmat-login`. Nuevo wrapper
  `apiFetch` que adjunta `Authorization: Bearer <token>` en cada request (igual
  que `src/utils/apiFetch.ts` en cohost).
- Rutas nuevas `/olvide-contrasena` y `/restablecer`, páginas calcadas de
  `ForgotPassword.tsx`/`ResetPassword.tsx` de cohost, con la marca/paleta de Felmat
  (grises, azules oscuros, naranja de acento — perfil de contenido §10 del
  CLAUDE.md global).
- `UserManagement.tsx`, `PropertyForm.tsx`, `PropertyList.tsx` pasan de `dbManager`
  (IndexedDB) a los nuevos endpoints `/api/felmat-users` y `/api/felmat-properties`.
- Página pública de ficha (la que originalmente motivó esta conversación) se lee
  vía `/api/felmat-property-shares?slug=...` sin requerir sesión.

## n8n

Dos workflows nuevos en el servidor existente (`chatbotventas-n8n`), calcados de
los de cohost:
- `felmat-restablecer-contrasena` → webhook → Gmail con el link de reset.
- `felmat-enviar-credenciales` → webhook → Gmail con usuario/password temporal.

Ambos deben **esperar el `fetch` al webhook** antes de responder (bug ya
documentado en cohost: una función serverless sin await puede congelarse antes de
que el correo salga).

## Orden de implementación

1. Migración Prisma (3 modelos nuevos) contra `POSTGRES_URL`.
2. `SESSION_SECRET` nueva en Vercel + `.env`.
3. Backend: `_lib/session.js`, `felmat-login/users/password-reset/
   send-credentials/properties/property-shares.js`.
4. 2 workflows n8n.
5. Frontend: `AuthContext`/`useAuth` real, páginas de recuperación,
   `permissions.ts`/`usePermissions`, rewire de `UserManagement` y `Properties`.
6. Semilla del primer `super_admin` — script parametrizado por env vars de un solo
   uso (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`), **no hardcodeado**.
7. Verificación end-to-end: login, olvidar/restablecer contraseña, crear usuario
   `agent`, generar una ficha y abrirla sin sesión.

## Fuera de alcance (para specs futuros)

- Migrar `Lead`, `Condominios`, `TarjetaDigital`/`AgentWebsite`, Airbnb, Contratos,
  Fianzas, Cotizaciones de IndexedDB a Postgres.
- Remitente de correo propio sobre `felmat.com.mx` en vez de Gmail vía n8n —
  Ricardo confirmó que el dominio ya existe; cuando se configure, solo cambia el
  nodo de envío dentro de los 2 workflows n8n, no la lógica de la app.
- Recuperación de cuenta cuando el único `super_admin` pierde acceso a su correo
  (mismo caso límite que cohost documentó, no resuelto ahí tampoco).
