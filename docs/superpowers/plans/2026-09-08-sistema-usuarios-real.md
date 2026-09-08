# Sistema de usuarios real (auth + roles + propiedades) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el login demo de `crm_felmat` (password hardcodeada `123456` en IndexedDB) por un backend real en Postgres — usuarios con hash PBKDF2, sesión firmada con HMAC, recuperación de contraseña por correo, matriz de permisos por rol, y `Property`/`PropertyShare` movidos de IndexedDB a Postgres para que las fichas compartibles sean visibles a cualquiera sin cuenta.

**Architecture:** 3 modelos Prisma nuevos (`FelmatUser`, `FelmatProperty`, `FelmatPropertyShare`) sobre la misma `POSTGRES_URL` que ya usa Anuncios. 7 funciones serverless de Vercel en JS plano bajo `api/`, mismo estilo que `api/anuncios.js`. La capa de integración con el frontend son 3 hooks ya existentes (`useAuth`, `useUsers`, `useProperties`, `usePropertyShares`) — se reescribe su interior para llamar a la API en vez de IndexedDB, preservando exactamente la misma forma exportada, así que los componentes que los consumen (`PropertyList`, `PropertyForm`, `PublicPropertyPage`, `UserManagement`, y ~20 archivos más) no cambian.

**Tech Stack:** React 18 + TypeScript + Vite, Prisma 5 + `@prisma/client`, Postgres, Vercel Serverless Functions (Node, JS plano), Node `crypto` (PBKDF2 + HMAC, sin librerías nuevas), n8n (webhooks → Gmail), Vitest.

## Global Constraints

- Backend en `api/*.js` (JS plano, no TypeScript) — sigue la convención existente de `api/anuncios.js`.
- Hashing de contraseña: PBKDF2-SHA256, 100 000 iteraciones, vía Node `crypto` — sin `bcrypt` ni dependencias nuevas.
- Sesión: HMAC firmado con `crypto.createHmac`, no JWT de librería — vía `SESSION_SECRET` (env var nueva).
- Sin datos que migrar: se arranca limpio (spec §"Migración de datos").
- Correo transaccional vía webhook n8n → Gmail (no API de email transaccional nueva).
- Roles: `super_admin`, `admin`, `agent`, `assistant` (ya declarados en `src/types/index.ts:6`). Solo `super_admin` puede tocar cuentas `admin`/`super_admin`.
- Spec completo: `docs/superpowers/specs/2026-09-08-sistema-usuarios-real-design.md`.

---

### Task 1: Modelo de datos en Prisma

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: modelos `FelmatUser`, `FelmatProperty`, `FelmatPropertyShare` (tablas `felmat_users`, `felmat_properties`, `felmat_property_shares`) — todas las tareas siguientes dependen de estos modelos vía `@prisma/client`.

- [ ] **Step 1: Agregar los 3 modelos al final de `prisma/schema.prisma`**

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
  propertyAccess Json      @default("[]") // string[] de FelmatProperty.id; [] = todas (solo aplica a agent/assistant)
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

- [ ] **Step 2: Traer las variables de entorno de Vercel al `.env` local (el proyecto ya está enlazado a `crm-felmat`)**

Run: `npx vercel env pull .env`
Expected: crea/actualiza `.env` con al menos `POSTGRES_URL=...` (ya existía para Anuncios).

- [ ] **Step 3: Agregar `SESSION_SECRET` a Vercel (producción, preview y desarrollo) y al `.env` local**

```bash
SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")
printf '%s' "$SECRET" | npx vercel env add SESSION_SECRET production
printf '%s' "$SECRET" | npx vercel env add SESSION_SECRET preview
printf '%s' "$SECRET" | npx vercel env add SESSION_SECRET development
printf '\nSESSION_SECRET=%s\n' "$SECRET" >> .env
```
Expected: 3 confirmaciones de Vercel CLI ("Added Environment Variable SESSION_SECRET...") y una línea nueva `SESSION_SECRET=...` en `.env`.

- [ ] **Step 4: Sincronizar el schema contra Postgres (no hay carpeta `prisma/migrations` — este proyecto usa `db push`, no `migrate dev`)**

Run: `npx prisma db push`
Expected: `Your database is now in sync with your Prisma schema.` y regenera el cliente.

- [ ] **Step 5: Verificar que las 3 tablas existen y están vacías**

Run: `node --input-type=module -e "import {PrismaClient} from '@prisma/client'; const p=new PrismaClient(); console.log(await p.felmatUser.count(), await p.felmatProperty.count(), await p.felmatPropertyShare.count()); await p.$disconnect();"`
Expected: `0 0 0`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: agrega modelos FelmatUser/FelmatProperty/FelmatPropertyShare a Prisma"
```

(`.env` no se comitea — ya está en `.gitignore`.)

---

### Task 2: Utilidades de sesión y contraseña (`api/_lib/session.js`)

**Files:**
- Create: `api/_lib/session.js`
- Test: `api/_lib/session.test.js`

**Interfaces:**
- Produces: `hashPassword(password)`, `verifyPassword(password, salt, storedHash)`, `signSession({sub, role, propertyAccess})`, `verifySession(token)`, `getSession(req)`, `signResetToken(userId)`, `verifyResetToken(token)`, `isFullAdmin(role)`, `isSuperAdmin(role)`, `canAccessProperty(session, property)`, `canEditProperty(session, property)`, `canDeleteProperty(session, property)` — usados por todas las funciones `api/felmat-*.js` de las tareas 4-9.

- [ ] **Step 1: Escribir el test (fallará porque el archivo no existe)**

```js
// api/_lib/session.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword, verifyPassword, signSession, verifySession, getSession,
  signResetToken, verifyResetToken, isFullAdmin, isSuperAdmin,
  canAccessProperty, canEditProperty, canDeleteProperty,
} from './session.js';

describe('session', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-secret-not-for-prod';
  });

  it('hashPassword + verifyPassword: contraseña correcta pasa, incorrecta falla', () => {
    const { salt, hash } = hashPassword('Fridasufrida09.');
    expect(verifyPassword('Fridasufrida09.', salt, hash)).toBe(true);
    expect(verifyPassword('otra-cosa', salt, hash)).toBe(false);
  });

  it('signSession + verifySession: token válido regresa el payload', () => {
    const token = signSession({ sub: 'u1', role: 'super_admin', propertyAccess: [] });
    const session = verifySession(token);
    expect(session.sub).toBe('u1');
    expect(session.role).toBe('super_admin');
  });

  it('verifySession: token alterado se rechaza', () => {
    const token = signSession({ sub: 'u1', role: 'agent', propertyAccess: [] });
    const [body, sig] = token.split('.');
    const tampered = `${body}.${sig.slice(0, -1)}${sig.slice(-1) === 'a' ? 'b' : 'a'}`;
    expect(verifySession(tampered)).toBeNull();
  });

  it('signResetToken + verifyResetToken: token de reset regresa el userId', () => {
    const resetToken = signResetToken('u2');
    expect(verifyResetToken(resetToken)).toBe('u2');
  });

  it('getSession: un token de reset no sirve como sesión (no trae role)', () => {
    const resetToken = signResetToken('u3');
    const fakeReq = { headers: { authorization: `Bearer ${resetToken}` } };
    expect(getSession(fakeReq)).toBeNull();
  });

  it('getSession: sin header Authorization regresa null', () => {
    expect(getSession({ headers: {} })).toBeNull();
  });

  it('isFullAdmin / isSuperAdmin', () => {
    expect(isFullAdmin('super_admin')).toBe(true);
    expect(isFullAdmin('admin')).toBe(true);
    expect(isFullAdmin('agent')).toBe(false);
    expect(isSuperAdmin('admin')).toBe(false);
    expect(isSuperAdmin('super_admin')).toBe(true);
  });

  it('canAccessProperty: admin ve todo; agent solo lo suyo o lo asignado', () => {
    const own = { agentId: 'u1', id: 'p1' };
    const ajena = { agentId: 'u2', id: 'p2' };
    expect(canAccessProperty({ role: 'admin', sub: 'ux', propertyAccess: [] }, ajena)).toBe(true);
    expect(canAccessProperty({ role: 'agent', sub: 'u1', propertyAccess: [] }, own)).toBe(true);
    expect(canAccessProperty({ role: 'agent', sub: 'u1', propertyAccess: [] }, ajena)).toBe(false);
    expect(canAccessProperty({ role: 'agent', sub: 'u1', propertyAccess: ['p2'] }, ajena)).toBe(true);
  });

  it('canEditProperty / canDeleteProperty: solo dueño o admin', () => {
    const ajena = { agentId: 'u2', id: 'p2' };
    expect(canEditProperty({ role: 'admin', sub: 'ux' }, ajena)).toBe(true);
    expect(canEditProperty({ role: 'agent', sub: 'u2' }, ajena)).toBe(true);
    expect(canEditProperty({ role: 'agent', sub: 'u1' }, ajena)).toBe(false);
    expect(canDeleteProperty({ role: 'agent', sub: 'u1' }, ajena)).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npx vitest run api/_lib/session.test.js`
Expected: FAIL — `Cannot find module './session.js'`

- [ ] **Step 3: Implementar `api/_lib/session.js`**

```js
import crypto from 'crypto';

// Misma matemática que api/_auth.ts de airbnb-cohost-app (PBKDF2 + HMAC sin
// librerías nuevas), trasladada al estilo JS plano de este repo.

const SECRET = () => process.env.SESSION_SECRET || '';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const RESET_MAX_AGE_MS = 30 * 60 * 1000;              // 30 minutos

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 32;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, storedHash) {
  if (!salt || !storedHash) return false;
  const computed = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha256').toString('hex');
  const stored = Buffer.from(storedHash, 'hex');
  const attempt = Buffer.from(computed, 'hex');
  return stored.length === attempt.length && crypto.timingSafeEqual(stored, attempt);
}

function sign(body) {
  return crypto.createHmac('sha256', SECRET()).update(body).digest('base64url');
}

function verifyAndParse(token, maxAgeMs) {
  if (!token || !SECRET()) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (Date.now() - payload.iat > maxAgeMs) return null;
    return payload;
  } catch {
    return null;
  }
}

export function signSession({ sub, role, propertyAccess }) {
  const full = { sub, role, propertyAccess, iat: Date.now() };
  const body = Buffer.from(JSON.stringify(full)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifySession(token) {
  return verifyAndParse(token, SESSION_MAX_AGE_MS);
}

// Solo acepta payloads con forma de sesión real (con role) -- un token de
// reset firmado con el mismo secreto no debe colarse como sesión.
export function getSession(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const payload = verifySession(auth.slice('Bearer '.length));
  if (!payload || typeof payload.role !== 'string') return null;
  return payload;
}

export function signResetToken(userId) {
  const full = { sub: userId, purpose: 'reset', iat: Date.now() };
  const body = Buffer.from(JSON.stringify(full)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function verifyResetToken(token) {
  const payload = verifyAndParse(token, RESET_MAX_AGE_MS);
  if (!payload || payload.purpose !== 'reset') return null;
  return payload.sub;
}

export function isFullAdmin(role) {
  return role === 'super_admin' || role === 'admin';
}

export function isSuperAdmin(role) {
  return role === 'super_admin';
}

// Ver/listar: admin ve todo; agent/assistant solo lo propio (agentId) o lo
// que le hayan asignado explícitamente en propertyAccess.
export function canAccessProperty(session, property) {
  if (isFullAdmin(session.role)) return true;
  if (!property) return true;
  if (property.agentId === session.sub) return true;
  if (!session.propertyAccess || session.propertyAccess.length === 0) return false;
  return session.propertyAccess.includes(property.id);
}

// Editar/eliminar: solo el dueño (agentId) o admin -- propertyAccess NO basta,
// es solo para ver (ej. un assistant asignado a apoyar, no a modificar).
export function canEditProperty(session, property) {
  if (isFullAdmin(session.role)) return true;
  return property.agentId === session.sub;
}

export const canDeleteProperty = canEditProperty;
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npx vitest run api/_lib/session.test.js`
Expected: PASS — 9 tests.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/session.js api/_lib/session.test.js
git commit -m "feat: agrega hashing PBKDF2 y sesion HMAC (api/_lib/session.js)"
```

---

### Task 3: Semilla del primer `super_admin`

**Files:**
- Create: `prisma/seed-super-admin.js`

**Interfaces:**
- Consumes: `hashPassword` de `api/_lib/session.js` (Task 2).
- Produces: un registro en `felmat_users` listo para hacer login en la Task 4.

- [ ] **Step 1: Crear el script, parametrizado por variables de entorno (nunca hardcodear credenciales)**

```js
// prisma/seed-super-admin.js
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../api/_lib/session.js';

const prisma = new PrismaClient();

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME || 'Admin';
const lastName = process.env.SEED_ADMIN_LASTNAME || '';

if (!email || !password) {
  console.error('Faltan SEED_ADMIN_EMAIL y/o SEED_ADMIN_PASSWORD en el entorno.');
  process.exit(1);
}

const { salt, hash } = hashPassword(password);
const normalizedEmail = email.toLowerCase().trim();

const user = await prisma.felmatUser.upsert({
  where: { email: normalizedEmail },
  update: { passwordHash: hash, salt, role: 'super_admin', isActive: true },
  create: {
    email: normalizedEmail,
    name,
    lastName,
    role: 'super_admin',
    isActive: true,
    passwordHash: hash,
    salt,
  },
});

console.log(`super_admin listo: ${user.email} (id: ${user.id})`);
await prisma.$disconnect();
```

- [ ] **Step 2: Correrlo para crear la cuenta de Ricardo**

Run:
```bash
SEED_ADMIN_EMAIL="admin@felmat.com.mx" SEED_ADMIN_PASSWORD="Fridasufrida09." SEED_ADMIN_NAME="Admin" node prisma/seed-super-admin.js
```
Expected: `super_admin listo: admin@felmat.com.mx (id: ...)`

- [ ] **Step 3: Verificar en la base**

Run: `node --input-type=module -e "import {PrismaClient} from '@prisma/client'; const p=new PrismaClient(); const u=await p.felmatUser.findUnique({where:{email:'admin@felmat.com.mx'}}); console.log(u.role, u.isActive, !!u.passwordHash); await p.\$disconnect();"`
Expected: `super_admin true true`

- [ ] **Step 4: Commit**

```bash
git add prisma/seed-super-admin.js
git commit -m "feat: script de semilla para el primer super_admin"
```

---

### Task 4: `api/felmat-login.js`

**Files:**
- Create: `api/felmat-login.js`

**Interfaces:**
- Consumes: `verifyPassword`, `signSession` (Task 2); tabla `felmat_users` (Task 1); cuenta seed (Task 3).
- Produces: `POST /api/felmat-login` → `{ result: 'ok'|'not_found'|'inactive'|'no_password_set'|'wrong_password', user?, token? }`, consumido por `useAuth.tsx` en la Task 12.

- [ ] **Step 1: Implementar**

```js
import { PrismaClient } from '@prisma/client';
import { verifyPassword, signSession } from './_lib/session.js';

const prisma = new PrismaClient();

const SAFE_USER_SELECT = {
  id: true, email: true, name: true, lastName: true, phone: true, avatar: true,
  role: true, agencyId: true, isActive: true, propertyAccess: true, config: true,
  lastLogin: true, createdAt: true, updatedAt: true,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ result: 'method_not_allowed' });

  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ result: 'missing_fields' });

  const found = await prisma.felmatUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!found) return res.status(200).json({ result: 'not_found' });
  if (!found.isActive) return res.status(200).json({ result: 'inactive' });
  // Nunca hay cuentas "abiertas": si aun no le llega su password temporal,
  // el login falla en vez de dejarla entrar sin contrasena (a diferencia de cohost).
  if (!found.passwordHash || !found.salt) return res.status(200).json({ result: 'no_password_set' });

  if (!verifyPassword(password, found.salt, found.passwordHash)) {
    return res.status(200).json({ result: 'wrong_password' });
  }

  const updated = await prisma.felmatUser.update({
    where: { id: found.id },
    data: { lastLogin: new Date() },
    select: SAFE_USER_SELECT,
  });

  const token = signSession({ sub: updated.id, role: updated.role, propertyAccess: updated.propertyAccess });
  return res.status(200).json({ result: 'ok', user: updated, token });
}
```

- [ ] **Step 2: Levantar las funciones serverless localmente**

Run: `npx vercel dev --listen 4181` (déjalo corriendo en una terminal aparte para esta tarea y las siguientes)
Expected: `Ready! Available at http://localhost:4181`

- [ ] **Step 3: Verificar login correcto e incorrecto contra la cuenta seed**

Run:
```bash
curl -s -X POST http://localhost:4181/api/felmat-login -H "Content-Type: application/json" -d '{"email":"admin@felmat.com.mx","password":"Fridasufrida09."}'
```
Expected: JSON con `"result":"ok"`, un `user.role":"super_admin"` y un `token`.

Run:
```bash
curl -s -X POST http://localhost:4181/api/felmat-login -H "Content-Type: application/json" -d '{"email":"admin@felmat.com.mx","password":"incorrecta"}'
```
Expected: `{"result":"wrong_password"}`

- [ ] **Step 4: Commit**

```bash
git add api/felmat-login.js
git commit -m "feat: endpoint de login real contra Postgres (api/felmat-login.js)"
```

---

### Task 5: `api/felmat-users.js`

**Files:**
- Create: `api/felmat-users.js`

**Interfaces:**
- Consumes: `getSession`, `isFullAdmin`, `isSuperAdmin`, `hashPassword`, `verifyPassword` (Task 2).
- Produces: `GET` (directorio público si no hay sesión admin, lista completa si la hay) · `POST` (crear, solo admin) · `PUT` (`autoGeneratePassword` / `newPassword`+`currentPassword` / `newPassword` sin `currentPassword` / `toggleActive` / edición de perfil) · `DELETE?id=` — consumido por `useAuth.tsx` (Task 12) y `useUsers()` (Task 13).

- [ ] **Step 1: Implementar**

```js
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getSession, isFullAdmin, isSuperAdmin, hashPassword, verifyPassword } from './_lib/session.js';

const prisma = new PrismaClient();

const SAFE_USER_SELECT = {
  id: true, email: true, name: true, lastName: true, phone: true, avatar: true,
  role: true, agencyId: true, isActive: true, propertyAccess: true, config: true,
  lastLogin: true, createdAt: true, updatedAt: true,
};

// Directorio publico: solo lo necesario para mostrar contacto del agente en
// fichas/paginas publicas -- nunca lastLogin, propertyAccess ni estado interno.
const PUBLIC_DIRECTORY_SELECT = {
  id: true, name: true, lastName: true, phone: true, email: true, avatar: true,
  role: true, config: true,
};

function genTempPassword() {
  return crypto.randomBytes(9).toString('base64url');
}

// Solo super_admin puede tocar cuentas admin/super_admin.
function canManageTarget(session, targetRole) {
  if (isSuperAdmin(session.role)) return true;
  if (targetRole === 'admin' || targetRole === 'super_admin') return false;
  return isFullAdmin(session.role);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const session = getSession(req);
    if (session && isFullAdmin(session.role)) {
      const users = await prisma.felmatUser.findMany({ select: SAFE_USER_SELECT, orderBy: { createdAt: 'asc' } });
      return res.status(200).json(users);
    }
    const users = await prisma.felmatUser.findMany({
      where: { isActive: true },
      select: PUBLIC_DIRECTORY_SELECT,
      orderBy: { createdAt: 'asc' },
    });
    return res.status(200).json(users);
  }

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'POST') {
    if (!isFullAdmin(session.role)) return res.status(403).json({ error: 'forbidden' });
    const b = req.body ?? {};
    if (!b.email || !b.name || !b.lastName || !b.role) return res.status(400).json({ error: 'missing_fields' });
    if (!canManageTarget(session, b.role)) return res.status(403).json({ error: 'forbidden' });

    const tempPassword = genTempPassword();
    const { salt, hash } = hashPassword(tempPassword);

    const created = await prisma.felmatUser.create({
      data: {
        email: b.email.toLowerCase().trim(),
        name: b.name,
        lastName: b.lastName,
        phone: b.phone || null,
        role: b.role,
        agencyId: b.agencyId || null,
        propertyAccess: b.propertyAccess ?? [],
        config: b.config ?? null,
        isActive: b.isActive ?? true,
        passwordHash: hash,
        salt,
      },
      select: SAFE_USER_SELECT,
    });
    return res.status(201).json({ ok: true, user: created, tempPassword });
  }

  if (req.method === 'PUT') {
    const b = req.body ?? {};
    if (!b.id) return res.status(400).json({ error: 'missing_id' });

    const target = await prisma.felmatUser.findUnique({ where: { id: b.id } });
    if (!target) return res.status(404).json({ error: 'not_found' });

    if (b.autoGeneratePassword) {
      if (!isFullAdmin(session.role) || !canManageTarget(session, target.role)) return res.status(403).json({ error: 'forbidden' });
      const tempPassword = genTempPassword();
      const { salt, hash } = hashPassword(tempPassword);
      await prisma.felmatUser.update({ where: { id: b.id }, data: { passwordHash: hash, salt } });
      return res.status(200).json({ ok: true, tempPassword });
    }

    if (b.newPassword) {
      if (b.currentPassword) {
        if (session.sub !== b.id) return res.status(403).json({ error: 'forbidden' });
        if (!verifyPassword(b.currentPassword, target.salt, target.passwordHash)) {
          return res.status(401).json({ error: 'wrong_current_password' });
        }
      } else {
        if (!isFullAdmin(session.role) || !canManageTarget(session, target.role)) return res.status(403).json({ error: 'forbidden' });
      }
      const { salt, hash } = hashPassword(b.newPassword);
      await prisma.felmatUser.update({ where: { id: b.id }, data: { passwordHash: hash, salt } });
      return res.status(200).json({ ok: true });
    }

    if (b.toggleActive) {
      if (!isFullAdmin(session.role) || !canManageTarget(session, target.role)) return res.status(403).json({ error: 'forbidden' });
      const updated = await prisma.felmatUser.update({
        where: { id: b.id },
        data: { isActive: !target.isActive },
        select: SAFE_USER_SELECT,
      });
      return res.status(200).json({ ok: true, user: updated });
    }

    if (!isFullAdmin(session.role) || !canManageTarget(session, target.role)) return res.status(403).json({ error: 'forbidden' });
    if (b.role && !canManageTarget(session, b.role)) return res.status(403).json({ error: 'forbidden' });
    const updated = await prisma.felmatUser.update({
      where: { id: b.id },
      data: {
        name: b.name ?? target.name,
        lastName: b.lastName ?? target.lastName,
        email: b.email ? b.email.toLowerCase().trim() : target.email,
        phone: b.phone ?? target.phone,
        role: b.role ?? target.role,
        agencyId: b.agencyId ?? target.agencyId,
        isActive: typeof b.isActive === 'boolean' ? b.isActive : target.isActive,
        propertyAccess: b.propertyAccess ?? target.propertyAccess,
        config: b.config ?? target.config,
        avatar: b.avatar ?? target.avatar,
      },
      select: SAFE_USER_SELECT,
    });
    return res.status(200).json({ ok: true, user: updated });
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'missing_id' });
    if (id === session.sub) return res.status(400).json({ error: 'cannot_delete_self' });
    const target = await prisma.felmatUser.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: 'not_found' });
    if (!isFullAdmin(session.role) || !canManageTarget(session, target.role)) return res.status(403).json({ error: 'forbidden' });
    await prisma.felmatUser.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
```

- [ ] **Step 2: Verificar el directorio público (sin sesión) y la creación de un agente (con sesión admin)**

Run (directorio público, reemplaza nada — no requiere token):
```bash
curl -s http://localhost:4181/api/felmat-users
```
Expected: arreglo JSON con el `super_admin` seed, solo campos públicos (sin `lastLogin`).

Run (guarda el `token` de la Task 4 en `$TOKEN`, crea un agente):
```bash
curl -s -X POST http://localhost:4181/api/felmat-users -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"email":"agente.prueba@felmat.com.mx","name":"Agente","lastName":"Prueba","role":"agent"}'
```
Expected: `{"ok":true,"user":{...,"role":"agent"},"tempPassword":"..."}`

- [ ] **Step 3: Commit**

```bash
git add api/felmat-users.js
git commit -m "feat: CRUD de usuarios con directorio publico y jerarquia de roles"
```

---

### Task 6: `api/felmat-password-reset.js`

**Files:**
- Create: `api/felmat-password-reset.js`

**Interfaces:**
- Consumes: `hashPassword`, `signResetToken`, `verifyResetToken` (Task 2).
- Produces: `POST { email }` (dispara webhook n8n) · `POST { token, newPassword }` (aplica el cambio) — consumido por `ForgotPassword.tsx`/`ResetPassword.tsx` (Task 14). Requiere el workflow n8n `felmat-restablecer-contrasena` (Task 10) para que el correo realmente llegue.

- [ ] **Step 1: Implementar**

```js
import { PrismaClient } from '@prisma/client';
import { hashPassword, signResetToken, verifyResetToken } from './_lib/session.js';

const prisma = new PrismaClient();

const NOTIFY_WEBHOOK = 'https://chatbotventas-n8n.h0w0dc.easypanel.host/webhook/felmat-restablecer-contrasena';
const APP_URL = 'https://crm-felmat.vercel.app';

function isNumericOnly(s) {
  return /^\d+$/.test(s);
}
function validatePasswordStrength(pw) {
  if (!pw) return 'missing_password';
  if (isNumericOnly(pw)) {
    if (pw.length < 4) return 'weak_password';
  } else if (pw.length < 8) {
    return 'weak_password';
  }
  return null;
}

async function handleForgot(email, res) {
  const user = await prisma.felmatUser.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Respuesta generica siempre -- no revelar si el correo existe o no.
  if (user && user.isActive) {
    const token = signResetToken(user.id);
    const resetUrl = `${APP_URL}/restablecer?token=${encodeURIComponent(token)}`;
    // Hay que esperar este fetch: sin await, Vercel puede congelar la funcion
    // antes de que el correo salga aunque la respuesta ya sea 200.
    await fetch(NOTIFY_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: user.name, email: user.email, resetUrl }),
    });
  }

  return res.status(200).json({ ok: true });
}

async function handleReset(token, newPassword, res) {
  const userId = verifyResetToken(token);
  if (!userId) return res.status(401).json({ error: 'invalid_or_expired_token' });

  const pwError = validatePasswordStrength(newPassword);
  if (pwError) return res.status(400).json({ error: pwError });

  const { salt, hash } = hashPassword(newPassword);
  try {
    await prisma.felmatUser.update({ where: { id: userId }, data: { passwordHash: hash, salt } });
  } catch {
    return res.status(404).json({ error: 'not_found' });
  }
  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const body = req.body ?? {};
  if (body.token || body.newPassword) {
    if (!body.token || !body.newPassword) return res.status(400).json({ error: 'missing_fields' });
    return handleReset(body.token, body.newPassword, res);
  }

  if (!body.email) return res.status(400).json({ error: 'missing_email' });
  return handleForgot(body.email, res);
}
```

- [ ] **Step 2: Verificar la mitad de "reset" con un token generado a mano (la mitad "forgot" se valida completa en la Task 10, cuando el webhook ya existe)**

Run:
```bash
node --input-type=module -e "
import { signResetToken } from './api/_lib/session.js';
console.log(signResetToken('$(node --input-type=module -e "import {PrismaClient} from '@prisma/client'; const p=new PrismaClient(); const u=await p.felmatUser.findUnique({where:{email:'admin@felmat.com.mx'}}); console.log(u.id); await p.\$disconnect();")'));
"
```
Toma el token impreso y:
```bash
curl -s -X POST http://localhost:4181/api/felmat-password-reset -H "Content-Type: application/json" -d '{"token":"<TOKEN>","newPassword":"Fridasufrida09."}'
```
Expected: `{"ok":true}`. Confirma con un login (`Task 4, Step 3`) que la contraseña sigue funcionando (no cambió porque restableciste con la misma).

- [ ] **Step 3: Commit**

```bash
git add api/felmat-password-reset.js
git commit -m "feat: endpoint de olvide/restablecer contrasena (token 30 min)"
```

---

### Task 7: `api/felmat-send-credentials.js`

**Files:**
- Create: `api/felmat-send-credentials.js`

**Interfaces:**
- Consumes: `getSession`, `isFullAdmin` (Task 2).
- Produces: `POST { userId, tempPassword }` (solo admin) — consumido desde `UserManagement.tsx` vía `useAuth.tsx` (Task 12). Requiere el workflow n8n `felmat-enviar-credenciales` (Task 10).

- [ ] **Step 1: Implementar**

```js
import { PrismaClient } from '@prisma/client';
import { getSession, isFullAdmin } from './_lib/session.js';

const prisma = new PrismaClient();

const NOTIFY_WEBHOOK = 'https://chatbotventas-n8n.h0w0dc.easypanel.host/webhook/felmat-enviar-credenciales';
const LOGIN_URL = 'https://crm-felmat.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const session = getSession(req);
  if (!session || !isFullAdmin(session.role)) return res.status(403).json({ error: 'forbidden' });

  const { userId, tempPassword } = req.body ?? {};
  if (!userId || !tempPassword) return res.status(400).json({ error: 'missing_fields' });

  const user = await prisma.felmatUser.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'not_found' });

  // Hay que esperar este fetch -- mismo motivo que en felmat-password-reset.js.
  const webhookRes = await fetch(NOTIFY_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: user.name, email: user.email, password: tempPassword, loginUrl: LOGIN_URL }),
  });
  if (!webhookRes.ok) return res.status(502).json({ error: 'webhook_failed' });

  return res.status(200).json({ ok: true });
}
```

- [ ] **Step 2: Verificar el guard de permisos (aún sin webhook real, debe fallar en el fetch, no en la autorización)**

Run:
```bash
curl -s -X POST http://localhost:4181/api/felmat-send-credentials -H "Content-Type: application/json" -d '{"userId":"x","tempPassword":"y"}'
```
Expected: `{"error":"forbidden"}` (sin `Authorization`, correcto).

- [ ] **Step 3: Commit**

```bash
git add api/felmat-send-credentials.js
git commit -m "feat: endpoint para reenviar credenciales generadas por admin"
```

---

### Task 8: `api/felmat-properties.js`

**Files:**
- Create: `api/felmat-properties.js`

**Interfaces:**
- Consumes: `getSession`, `isFullAdmin`, `canAccessProperty`, `canEditProperty`, `canDeleteProperty` (Task 2).
- Produces: `GET` (público si trae `?id=`/`?slug=` y está publicada; lista filtrada con sesión) · `PUT { id, incrementViews: true }` (público) · `POST`/`PUT`/`DELETE?id=` (con sesión, respetan dueño/admin) — consumido por `useProperties()` (Task 13) y la página pública de ficha (Task 13/16).

- [ ] **Step 1: Implementar**

```js
import { PrismaClient } from '@prisma/client';
import { getSession, isFullAdmin, canAccessProperty, canEditProperty, canDeleteProperty } from './_lib/session.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const lookup = req.query.id || req.query.slug;
    const session = getSession(req);

    if (lookup) {
      const property = await prisma.felmatProperty.findFirst({ where: { OR: [{ id: lookup }, { slug: lookup }] } });
      if (!property) return res.status(404).json({ error: 'not_found' });
      if (!session) {
        if (!property.isPublished) return res.status(404).json({ error: 'not_found' });
        return res.status(200).json(property);
      }
      if (!canAccessProperty(session, property)) return res.status(403).json({ error: 'forbidden' });
      return res.status(200).json(property);
    }

    if (!session) return res.status(401).json({ error: 'unauthorized' });
    let where;
    if (isFullAdmin(session.role)) {
      where = req.query.agentId ? { agentId: req.query.agentId } : {};
    } else {
      where = { OR: [{ agentId: session.sub }, { id: { in: session.propertyAccess ?? [] } }] };
    }
    const properties = await prisma.felmatProperty.findMany({ where, orderBy: { createdAt: 'desc' } });
    return res.status(200).json(properties);
  }

  if (req.method === 'PUT' && req.body && req.body.incrementViews) {
    const id = req.body.id;
    if (!id) return res.status(400).json({ error: 'missing_id' });
    const updated = await prisma.felmatProperty
      .update({ where: { id }, data: { views: { increment: 1 } }, select: { id: true, views: true } })
      .catch(() => null);
    if (!updated) return res.status(404).json({ error: 'not_found' });
    return res.status(200).json({ ok: true, views: updated.views });
  }

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'POST') {
    const b = req.body ?? {};
    if (!b.title || !b.slug || !b.propertyType || !b.transactionType || b.price == null) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    const agentId = isFullAdmin(session.role) && b.agentId ? b.agentId : session.sub;
    const created = await prisma.felmatProperty.create({
      data: {
        title: b.title,
        description: b.description || '',
        propertyType: b.propertyType,
        transactionType: b.transactionType,
        price: b.price,
        priceCurrency: b.priceCurrency || 'MXN',
        maintenanceFee: b.maintenanceFee ?? null,
        status: b.status || 'disponible',
        location: b.location ?? {},
        features: b.features ?? {},
        images: b.images ?? [],
        agentId,
        agencyId: b.agencyId ?? null,
        slug: b.slug,
        metaTitle: b.metaTitle ?? null,
        metaDescription: b.metaDescription ?? null,
        tags: b.tags ?? [],
        isPublished: b.isPublished ?? false,
        isFeatured: b.isFeatured ?? false,
        commission: b.commission ?? null,
        commissionType: b.commissionType ?? null,
        publishedAt: b.isPublished ? new Date() : null,
      },
    });
    return res.status(201).json(created);
  }

  if (req.method === 'PUT') {
    const b = req.body ?? {};
    if (!b.id) return res.status(400).json({ error: 'missing_id' });
    const existing = await prisma.felmatProperty.findUnique({ where: { id: b.id } });
    if (!existing) return res.status(404).json({ error: 'not_found' });
    if (!canEditProperty(session, existing)) return res.status(403).json({ error: 'forbidden' });

    const data = { ...b };
    delete data.id;
    if (data.isPublished && !existing.isPublished) data.publishedAt = new Date();
    const updated = await prisma.felmatProperty.update({ where: { id: b.id }, data });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'missing_id' });
    const existing = await prisma.felmatProperty.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'not_found' });
    if (!canDeleteProperty(session, existing)) return res.status(403).json({ error: 'forbidden' });
    await prisma.felmatProperty.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
```

- [ ] **Step 2: Verificar creación (con sesión admin) y lectura pública de una propiedad publicada**

Run (crea, con `$TOKEN` del super_admin):
```bash
curl -s -X POST http://localhost:4181/api/felmat-properties -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"title":"Casa de prueba","slug":"casa-de-prueba","propertyType":"casa","transactionType":"venta","price":1000000,"status":"disponible","isPublished":true}'
```
Expected: `201` con la propiedad creada; anota su `id`.

Run (lectura pública, sin `Authorization`):
```bash
curl -s "http://localhost:4181/api/felmat-properties?slug=casa-de-prueba"
```
Expected: `200` con la propiedad completa (porque `isPublished:true`).

- [ ] **Step 3: Commit**

```bash
git add api/felmat-properties.js
git commit -m "feat: CRUD de propiedades con lectura publica de publicadas"
```

---

### Task 9: `api/felmat-property-shares.js`

**Files:**
- Create: `api/felmat-property-shares.js`

**Interfaces:**
- Consumes: `getSession`, `canAccessProperty` (Task 2).
- Produces: `GET ?slug=` (público, sin sesión) · `POST` (con sesión, crea la ficha solo si la propiedad es accesible para quien la pide) — consumido por `usePropertyShares()` (Task 13). Este es el endpoint que hace visible una ficha a alguien sin cuenta.

- [ ] **Step 1: Implementar**

```js
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getSession, canAccessProperty } from './_lib/session.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const slug = req.query.slug;
    if (!slug) return res.status(400).json({ error: 'missing_slug' });
    // Lectura publica -- sin sesion. Resuelve el pendiente de origen: alguien
    // sin cuenta en el CRM abre el link y si ve la ficha.
    const share = await prisma.felmatPropertyShare.findUnique({ where: { slug } });
    if (!share) return res.status(404).json({ error: 'not_found' });
    return res.status(200).json(share);
  }

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'POST') {
    const b = req.body ?? {};
    if (!b.propertyId) return res.status(400).json({ error: 'missing_property_id' });

    // No basta con estar autenticado: solo quien tiene acceso a la propiedad
    // (dueno, admin, o acceso asignado) puede generar una ficha para ella --
    // si no, cualquier agente podria crear una ficha con SUS datos de contacto
    // sobre una propiedad ajena.
    const property = await prisma.felmatProperty.findUnique({ where: { id: b.propertyId } });
    if (!property) return res.status(404).json({ error: 'property_not_found' });
    if (!canAccessProperty(session, property)) return res.status(403).json({ error: 'forbidden' });

    const created = await prisma.felmatPropertyShare.create({
      data: {
        slug: `c-${crypto.randomBytes(6).toString('base64url')}`,
        propertyId: b.propertyId,
        createdBy: session.sub,
        overrideName: b.overrideName ?? null,
        overridePhone: b.overridePhone ?? null,
        overrideWhatsapp: b.overrideWhatsapp ?? null,
        overrideEmail: b.overrideEmail ?? null,
        overrideAvatar: b.overrideAvatar ?? null,
        overrideCertificate: b.overrideCertificate ?? null,
        overrideBio: b.overrideBio ?? null,
      },
    });
    return res.status(201).json(created);
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
```

- [ ] **Step 2: Verificar creación (con sesión) y lectura pública (sin sesión)**

Run (usa el `id` de la propiedad creada en la Task 8):
```bash
curl -s -X POST http://localhost:4181/api/felmat-property-shares -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"propertyId":"<PROPERTY_ID>","overrideName":"Mayra Fajer"}'
```
Expected: `201` con `slug` tipo `c-xxxxxxxxxxxx`.

Run:
```bash
curl -s "http://localhost:4181/api/felmat-property-shares?slug=<SLUG>"
```
Expected: `200` con la misma ficha, sin `Authorization`.

- [ ] **Step 3: Commit**

```bash
git add api/felmat-property-shares.js
git commit -m "feat: fichas compartibles con lectura publica sin sesion"
```

---

### Task 10: Workflows n8n de correo

**Files:**
- N/A (se construyen directamente en el n8n de Ricardo vía las herramientas MCP `mcp__n8n__*`, no como archivos en este repo).

**Interfaces:**
- Consumes: contrato de payload ya fijado en las Tasks 6 y 7.
- Produces: 2 webhooks activos que las Tasks 6 y 7 ya están apuntando a llamar.

- [ ] **Step 1: Preparación — leer referencia del SDK y confirmar credencial de Gmail existente**

Llamar `mcp__n8n__get_workflow_sdk_reference` y `mcp__n8n__list_credentials` (buscar una credencial de Gmail ya conectada en este n8n — reutilizarla, no crear una nueva).

- [ ] **Step 2: Crear `felmat-restablecer-contrasena`**

Vía `mcp__n8n__create_workflow_from_code`: Webhook trigger (`POST /webhook/felmat-restablecer-contrasena`) → nodo Gmail "Send" usando la credencial encontrada en Step 1. Payload de entrada: `{ name, email, resetUrl }`. Cuerpo del correo en español, con el link `resetUrl` y la nota "Este enlace expira en 30 minutos." Publicar el workflow (`mcp__n8n__publish_workflow`).

- [ ] **Step 3: Crear `felmat-enviar-credenciales`**

Mismo patrón: Webhook trigger (`POST /webhook/felmat-enviar-credenciales`) → Gmail "Send". Payload de entrada: `{ name, email, password, loginUrl }`. Cuerpo del correo con usuario, contraseña temporal y el link de `loginUrl`, más una línea pidiendo cambiarla al entrar. Publicar el workflow.

- [ ] **Step 4: Verificar de punta a punta contra los endpoints reales**

Run:
```bash
curl -s -X POST http://localhost:4181/api/felmat-password-reset -H "Content-Type: application/json" -d '{"email":"admin@felmat.com.mx"}'
```
Expected: `{"ok":true}` y un correo real llega a `admin@felmat.com.mx` (o a quien reciba ese buzón hoy) con el link de restablecer.

- [ ] **Step 5: No hay commit de código en este repo para esta tarea** — deja constancia en el mensaje de la Task 3 del plan de ejecución (o en un comentario del PR) de que ambos workflows quedaron publicados.

---

### Task 11: Matriz de permisos (`src/permissions.ts`)

**Files:**
- Create: `src/permissions.ts`
- Create: `src/hooks/usePermissions.ts`
- Test: `src/permissions.test.ts`
- Modify: `src/types/index.ts:8-22` (agregar `propertyAccess` a `User`)

**Interfaces:**
- Consumes: `UserRole` de `src/types/index.ts:6`; `useAuth()` de `src/hooks/useAuth.tsx` (Task 12).
- Produces: `usePermissions()` → `{ role, canCreate, canEdit, canDelete, canView, canManageUsers, hasPropertyAccess, restrictions }`, disponible para reemplazar checks sueltos en componentes existentes (fuera de alcance de este plan tocar cada uno; queda disponible para usarse).

- [ ] **Step 1: Agregar `propertyAccess` al tipo `User`**

En `src/types/index.ts`, dentro de `export interface User { ... }` (línea 8), agregar el campo después de `agencyId?: string;`:

```ts
  agencyId?: string;
  propertyAccess?: string[]; // ids de Property asignados explicitamente (agent/assistant); [] o undefined = solo lo propio
```

- [ ] **Step 2: Escribir el test (fallará porque `src/permissions.ts` no existe)**

```ts
// src/permissions.test.ts
import { describe, it, expect } from 'vitest';
import { canCreate, canEdit, canDeleteResource, canView, canManageUsers, hasPropertyAccess } from './permissions';

describe('permissions', () => {
  it('super_admin y admin pueden todo, incluida gestion de usuarios', () => {
    expect(canCreate('super_admin', 'users')).toBe(true);
    expect(canDeleteResource('admin', 'properties')).toBe(true);
    expect(canManageUsers('admin')).toBe(true);
    expect(canManageUsers('super_admin')).toBe(true);
  });

  it('agent no puede gestionar usuarios', () => {
    expect(canManageUsers('agent')).toBe(false);
    expect(canView('agent', 'users')).toBe(false);
  });

  it('assistant no puede eliminar nada (restriccion noDelete) aunque el recurso este en canDelete', () => {
    expect(canEdit('assistant', 'leads')).toBe(true);
    expect(canDeleteResource('assistant', 'leads')).toBe(false);
  });

  it('hasPropertyAccess: agent ve su propia propiedad, no la ajena sin acceso asignado', () => {
    const propia = { agentId: 'u1', id: 'p1' };
    const ajena = { agentId: 'u2', id: 'p2' };
    expect(hasPropertyAccess('agent', 'u1', [], propia)).toBe(true);
    expect(hasPropertyAccess('agent', 'u1', [], ajena)).toBe(false);
    expect(hasPropertyAccess('agent', 'u1', ['p2'], ajena)).toBe(true);
  });

  it('admin no tiene restriccion ownPropertiesOnly', () => {
    expect(hasPropertyAccess('admin', 'u1', [], { agentId: 'otro', id: 'p9' })).toBe(true);
  });
});
```

- [ ] **Step 3: Correr el test para verificar que falla**

Run: `npx vitest run src/permissions.test.ts`
Expected: FAIL — `Cannot find module './permissions'`

- [ ] **Step 4: Implementar `src/permissions.ts`**

```ts
import type { UserRole } from '@/types';

export type PermResource =
  | 'properties' | 'leads' | 'condominios' | 'airbnb' | 'anuncios'
  | 'contratos' | 'cotizaciones' | 'fianzas' | 'users' | 'propertyShares';

export interface RolePermissions {
  canCreate: PermResource[];
  canEdit: PermResource[];
  canDelete: PermResource[];
  canView: PermResource[];
  canDownload: PermResource[];
  canConfigure: PermResource[];
  restrictions: {
    ownPropertiesOnly: boolean;
    noDelete: boolean;
  };
}

const ALL_RESOURCES: PermResource[] = [
  'properties', 'leads', 'condominios', 'airbnb', 'anuncios',
  'contratos', 'cotizaciones', 'fianzas', 'users', 'propertyShares',
];

const AGENT_RESOURCES: PermResource[] = [
  'properties', 'leads', 'condominios', 'airbnb', 'anuncios',
  'contratos', 'cotizaciones', 'fianzas', 'propertyShares',
];

const ASSISTANT_EDITABLE: PermResource[] = ['leads', 'propertyShares'];
const ASSISTANT_VIEWABLE: PermResource[] = ['properties', 'leads', 'condominios', 'airbnb', 'propertyShares'];

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  super_admin: {
    canCreate: ALL_RESOURCES, canEdit: ALL_RESOURCES, canDelete: ALL_RESOURCES,
    canView: ALL_RESOURCES, canDownload: ALL_RESOURCES, canConfigure: ALL_RESOURCES,
    restrictions: { ownPropertiesOnly: false, noDelete: false },
  },
  admin: {
    canCreate: ALL_RESOURCES, canEdit: ALL_RESOURCES, canDelete: ALL_RESOURCES,
    canView: ALL_RESOURCES, canDownload: ALL_RESOURCES, canConfigure: ALL_RESOURCES,
    restrictions: { ownPropertiesOnly: false, noDelete: false },
  },
  agent: {
    canCreate: AGENT_RESOURCES, canEdit: AGENT_RESOURCES, canDelete: AGENT_RESOURCES,
    canView: AGENT_RESOURCES, canDownload: ['cotizaciones', 'contratos'], canConfigure: [],
    restrictions: { ownPropertiesOnly: true, noDelete: false },
  },
  assistant: {
    canCreate: ASSISTANT_EDITABLE, canEdit: ASSISTANT_EDITABLE, canDelete: [],
    canView: ASSISTANT_VIEWABLE, canDownload: [], canConfigure: [],
    restrictions: { ownPropertiesOnly: true, noDelete: true },
  },
};

export function canCreate(role: UserRole, resource: PermResource): boolean {
  return ROLE_PERMISSIONS[role].canCreate.includes(resource);
}
export function canEdit(role: UserRole, resource: PermResource): boolean {
  return ROLE_PERMISSIONS[role].canEdit.includes(resource);
}
export function canDeleteResource(role: UserRole, resource: PermResource): boolean {
  if (ROLE_PERMISSIONS[role].restrictions.noDelete) return false;
  return ROLE_PERMISSIONS[role].canDelete.includes(resource);
}
export function canView(role: UserRole, resource: PermResource): boolean {
  return ROLE_PERMISSIONS[role].canView.includes(resource);
}
export function canManageUsers(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}
export function hasPropertyAccess(
  role: UserRole,
  userId: string,
  userPropertyAccess: string[],
  property: { agentId: string; id: string },
): boolean {
  if (!ROLE_PERMISSIONS[role].restrictions.ownPropertiesOnly) return true;
  if (property.agentId === userId) return true;
  return userPropertyAccess.includes(property.id);
}
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `npx vitest run src/permissions.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 6: Implementar `src/hooks/usePermissions.ts`**

```ts
import { useAuth } from '@/hooks/useAuth';
import {
  ROLE_PERMISSIONS, canCreate, canEdit, canDeleteResource, canView,
  canManageUsers, hasPropertyAccess, type PermResource,
} from '@/permissions';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role ?? 'assistant';

  return {
    role,
    canCreate: (resource: PermResource) => canCreate(role, resource),
    canEdit: (resource: PermResource) => canEdit(role, resource),
    canDelete: (resource: PermResource) => canDeleteResource(role, resource),
    canView: (resource: PermResource) => canView(role, resource),
    canManageUsers: canManageUsers(role),
    hasPropertyAccess: (property: { agentId: string; id: string }) =>
      user ? hasPropertyAccess(role, user.id, user.propertyAccess ?? [], property) : false,
    restrictions: ROLE_PERMISSIONS[role].restrictions,
  };
}
```

- [ ] **Step 7: `npm run lint` para confirmar que no rompió tipos**

Run: `npm run lint`
Expected: sin errores nuevos relacionados a `permissions.ts`, `usePermissions.ts` o `types/index.ts`.

- [ ] **Step 8: Commit**

```bash
git add src/permissions.ts src/permissions.test.ts src/hooks/usePermissions.ts src/types/index.ts
git commit -m "feat: matriz de permisos por rol y recurso (usePermissions)"
```

---

### Task 12: `apiFetch` + `useAuth.tsx` real + envío de credenciales al crear usuario

**Files:**
- Create: `src/utils/apiFetch.ts`
- Modify: `src/hooks/useAuth.tsx` (reemplazo completo del archivo)
- Modify: `src/components/users/UserManagement.tsx:150-160`

**Interfaces:**
- Consumes: `/api/felmat-login`, `/api/felmat-users`, `/api/felmat-send-credentials` (Tasks 4, 5, 7).
- Produces: `useAuth()` mantiene exactamente la misma forma que ya consumen `Sidebar`, `PropertyList`, `PropertyForm`, etc. (`user, users, isAuthenticated, isLoading, isAdmin, isAgent, login, logout, updateUser, hasRole, createUser, updateUserById, deleteUser, toggleUserStatus, canManageUsers, canDeleteProperty, canEditProperty, canViewAllProperties, canViewAllLeads`), más `refreshUsers` y `sendCredentials` nuevos. `createUser` ahora regresa `{ user, tempPassword }` en vez de `User` (el único call site, `UserManagement.tsx`, no usaba el valor de retorno — no rompe nada).

- [ ] **Step 1: Crear `src/utils/apiFetch.ts`**

```ts
const TOKEN_KEY = 'felmat_auth_token';

let inMemoryToken: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
})();

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (inMemoryToken) headers.set('Authorization', `Bearer ${inMemoryToken}`);
  return fetch(input, { ...init, headers });
}
```

- [ ] **Step 2: Reemplazar `src/hooks/useAuth.tsx` completo**

```tsx
// ============================================
// SISTEMA DE AUTENTICACIÓN MULTIUSUARIO - BACKEND REAL (Postgres)
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import { apiFetch, setAuthToken, getAuthToken } from '@/utils/apiFetch';

const AUTH_STORAGE_KEY = 'felmat_auth_user';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ user: User; tempPassword: string }>;
  updateUserById: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  sendCredentials: (userId: string, tempPassword: string) => Promise<void>;
  canManageUsers: boolean;
  canDeleteProperty: (propertyAgentId: string) => boolean;
  canEditProperty: (propertyAgentId: string) => boolean;
  canViewAllProperties: boolean;
  canViewAllLeads: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsers = useCallback(async () => {
    const res = await apiFetch('/api/felmat-users');
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => {
    (async () => {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      const token = getAuthToken();
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser) as User);
        } catch {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
      await refreshUsers();
      setIsLoading(false);
    })();
  }, [refreshUsers]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const res = await apiFetch('/api/felmat-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (json.result === 'ok' && json.user) {
      setAuthToken(json.token);
      setUser(json.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(json.user));
      await refreshUsers();
      return true;
    }
    return false;
  }, [refreshUsers]);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    const res = await apiFetch('/api/felmat-users', {
      method: 'PUT',
      body: JSON.stringify({ id: user.id, ...updates }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo actualizar el perfil');
    setUser(json.user);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(json.user));
    setUsers(prev => prev.map(u => (u.id === json.user.id ? json.user : u)));
  }, [user]);

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const createUser = useCallback(async (
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ user: User; tempPassword: string }> => {
    const res = await apiFetch('/api/felmat-users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo crear el usuario');
    await refreshUsers();
    return { user: json.user, tempPassword: json.tempPassword };
  }, [refreshUsers]);

  const updateUserById = useCallback(async (id: string, updates: Partial<User>): Promise<void> => {
    const res = await apiFetch('/api/felmat-users', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo actualizar el usuario');
    await refreshUsers();
  }, [refreshUsers]);

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/felmat-users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo eliminar el usuario');
    await refreshUsers();
  }, [refreshUsers]);

  const toggleUserStatus = useCallback(async (id: string): Promise<void> => {
    const res = await apiFetch('/api/felmat-users', {
      method: 'PUT',
      body: JSON.stringify({ id, toggleActive: true }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo cambiar el estado');
    await refreshUsers();
  }, [refreshUsers]);

  const sendCredentials = useCallback(async (userId: string, tempPassword: string): Promise<void> => {
    const res = await apiFetch('/api/felmat-send-credentials', {
      method: 'POST',
      body: JSON.stringify({ userId, tempPassword }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo enviar el correo de credenciales');
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isAgent = user?.role === 'agent';
  const canManageUsers = isAdmin;

  const canDeleteProperty = useCallback((propertyAgentId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return propertyAgentId === user.id;
  }, [user, isAdmin]);

  const canEditProperty = useCallback((propertyAgentId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return propertyAgentId === user.id;
  }, [user, isAdmin]);

  const canViewAllProperties = isAdmin;
  const canViewAllLeads = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user, users, isAuthenticated: !!user, isLoading, isAdmin, isAgent,
        login, logout, updateUser, hasRole, createUser, updateUserById, deleteUser,
        toggleUserStatus, refreshUsers, sendCredentials, canManageUsers,
        canDeleteProperty, canEditProperty, canViewAllProperties, canViewAllLeads,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(roles?: UserRole[]) {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
    if (!isLoading && isAuthenticated && roles && !hasRole(roles)) {
      window.location.href = '/unauthorized';
    }
  }, [isLoading, isAuthenticated, roles, hasRole]);

  return { user, isLoading };
}
```

- [ ] **Step 3: En `src/components/users/UserManagement.tsx`, mandar las credenciales por correo justo después de crear el usuario**

Reemplazar (líneas 150-160):
```tsx
      } else {
        await createUser({
          name: formData.name,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          isActive: formData.isActive,
          config: userConfig,
        });
      }
```
por:
```tsx
      } else {
        const { user: created, tempPassword } = await createUser({
          name: formData.name,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          isActive: formData.isActive,
          config: userConfig,
        });
        try {
          await sendCredentials(created.id, tempPassword);
          alert(`Usuario creado. Le enviamos sus credenciales por correo a ${created.email}.`);
        } catch {
          alert(`Usuario creado, pero no se pudo enviar el correo. Contraseña temporal: ${tempPassword}`);
        }
      }
```

Y agregar `sendCredentials` a la desestructuración de `useAuth()` en la línea 75:
```tsx
  const { users, createUser, updateUserById, deleteUser, toggleUserStatus, sendCredentials, user: currentUser } = useAuth();
```

- [ ] **Step 4: `npm run lint` para confirmar que `UserManagement.tsx` y `useAuth.tsx` compilan**

Run: `npm run lint`
Expected: sin errores nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/utils/apiFetch.ts src/hooks/useAuth.tsx src/components/users/UserManagement.tsx
git commit -m "feat: useAuth real contra la API (login, roles, gestion de usuarios)"
```

---

### Task 13: Hooks de datos (`useUsers`, `useProperties`, `usePropertyShares`) contra la API

**Files:**
- Modify: `src/hooks/useDatabase.ts:249-289` (`useUsers`)
- Modify: `src/hooks/useDatabase.ts:292-355` (`useProperties`)
- Modify: `src/hooks/useDatabase.ts:781-802` (`usePropertyShares`)

**Interfaces:**
- Consumes: `/api/felmat-users`, `/api/felmat-properties`, `/api/felmat-property-shares` (Tasks 5, 8, 9); `apiFetch` (Task 12).
- Produces: mismas formas exactas que antes — `useUsers()` → `{ users, loading, create, update, remove, refresh }`; `useProperties(agentId?)` → `{ properties, loading, create, update, remove, refresh, incrementViews, getBySlug }`; `usePropertyShares()` → `{ create, getBySlug }`. Ningún componente consumidor (`PropertyList`, `PropertyForm`, `PublicPropertyPage`, `PropertyDetail`, y ~17 más) cambia.

- [ ] **Step 1: Agregar el import de `apiFetch` al inicio de `src/hooks/useDatabase.ts`** (junto a los demás imports existentes, sin tocar los que ya están)

```ts
import { apiFetch } from '@/utils/apiFetch';
```

- [ ] **Step 2: Reemplazar el cuerpo de `useUsers` (líneas 249-289)**

```ts
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await apiFetch('/api/felmat-users');
    const data = res.ok ? await res.json() : [];
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const res = await apiFetch('/api/felmat-users', { method: 'POST', body: JSON.stringify(user) });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo crear el usuario');
    await refresh();
    return json.user;
  };

  const update = async (id: string, updates: Partial<User>): Promise<void> => {
    const res = await apiFetch('/api/felmat-users', { method: 'PUT', body: JSON.stringify({ id, ...updates }) });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo actualizar el usuario');
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/felmat-users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo eliminar el usuario');
    await refresh();
  };

  return { users, loading, create, update, remove, refresh };
}
```

- [ ] **Step 3: Reemplazar el cuerpo de `useProperties` (líneas 292-355)**

```ts
export function useProperties(agentId?: string) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const url = agentId ? `/api/felmat-properties?agentId=${encodeURIComponent(agentId)}` : '/api/felmat-properties';
    const res = await apiFetch(url);
    const data = res.ok ? await res.json() : [];
    setProperties(data);
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'leadsCount' | 'favoritesCount'>): Promise<Property> => {
    const res = await apiFetch('/api/felmat-properties', { method: 'POST', body: JSON.stringify(property) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'No se pudo crear la propiedad');
    await refresh();
    return json;
  };

  const update = async (id: string, updates: Partial<Property>): Promise<void> => {
    const res = await apiFetch('/api/felmat-properties', { method: 'PUT', body: JSON.stringify({ id, ...updates }) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'No se pudo actualizar la propiedad');
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/felmat-properties?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'No se pudo eliminar la propiedad');
    await refresh();
  };

  const incrementViews = async (id: string): Promise<void> => {
    await apiFetch('/api/felmat-properties', { method: 'PUT', body: JSON.stringify({ id, incrementViews: true }) });
  };

  const getBySlug = async (slug: string): Promise<Property | null> => {
    const res = await apiFetch(`/api/felmat-properties?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    return res.json();
  };

  return { properties, loading, create, update, remove, refresh, incrementViews, getBySlug };
}
```

- [ ] **Step 4: Reemplazar el cuerpo de `usePropertyShares` (líneas 781-802)**

```ts
export function usePropertyShares() {
  const create = async (
    input: Omit<PropertyShare, 'id' | 'slug' | 'createdAt' | 'updatedAt'>
  ): Promise<PropertyShare> => {
    const res = await apiFetch('/api/felmat-property-shares', { method: 'POST', body: JSON.stringify(input) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'No se pudo crear la ficha compartida');
    return json;
  };

  const getBySlug = async (slug: string): Promise<PropertyShare | null> => {
    const res = await apiFetch(`/api/felmat-property-shares?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    return res.json();
  };

  return { create, getBySlug };
}
```

- [ ] **Step 5: `npm run lint` y `npm run build` para confirmar que los ~21 consumidores de estos hooks siguen compilando sin cambios**

Run: `npm run lint && npm run build`
Expected: ambos terminan sin errores (los consumidores no cambiaron, solo el interior de los 3 hooks).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useDatabase.ts
git commit -m "feat: useUsers/useProperties/usePropertyShares contra la API real"
```

---

### Task 14: Páginas de recuperación de contraseña

**Files:**
- Create: `src/pages/ForgotPassword.tsx`
- Create: `src/pages/ResetPassword.tsx`
- Modify: `src/App.tsx` (import + 2 rutas nuevas)

**Interfaces:**
- Consumes: `/api/felmat-password-reset` (Task 6).
- Produces: rutas públicas `/olvide-contrasena` y `/restablecer`.

- [ ] **Step 1: Crear `src/pages/ForgotPassword.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/felmat-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // misma respuesta se muestre o no falle la red -- no delatar si el correo existe
    }
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-700">GRUPO FELMAT</h1>
            <p className="text-xs text-muted-foreground">CRM Inmobiliario</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recuperar contraseña</CardTitle>
            <CardDescription>
              {sent
                ? `Si ${email.trim()} tiene una cuenta, te enviamos un correo con un enlace para restablecer tu contraseña. El enlace expira en 30 minutos.`
                : 'Ingresa tu correo y te mandamos un enlace para restablecer tu contraseña.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <Link to="/login" className="text-sm text-primary hover:underline">Volver a iniciar sesión</Link>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Correo electrónico</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@felmat.com.mx"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </Button>
                <Link to="/login" className="block text-sm text-primary hover:underline text-center">
                  Volver a iniciar sesión
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ForgotPassword;
```

- [ ] **Step 2: Crear `src/pages/ResetPassword.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const isNumericOnly = (s: string) => /^\d+$/.test(s);

const validatePasswordStrength = (pw: string): string | null => {
  if (!pw) return 'Ingresa una contraseña.';
  if (isNumericOnly(pw)) {
    if (pw.length < 4) return 'El PIN numérico debe tener al menos 4 dígitos.';
  } else if (pw.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  return null;
};

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('El enlace no es válido. Pide uno nuevo.');
      return;
    }
    const pwError = validatePasswordStrength(newPw);
    if (pwError) { setError(pwError); return; }
    if (newPw !== confirmPw) { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/felmat-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: newPw }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(
          json.error === 'invalid_or_expired_token'
            ? 'Este enlace ya venció o no es válido. Pide uno nuevo.'
            : 'No se pudo restablecer la contraseña.',
        );
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError('Error de red. Intenta de nuevo.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-700">GRUPO FELMAT</h1>
            <p className="text-xs text-muted-foreground">CRM Inmobiliario</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nueva contraseña</CardTitle>
            {!token && !done && <CardDescription>Este enlace no es válido.</CardDescription>}
          </CardHeader>
          <CardContent>
            {done ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">Tu contraseña se actualizó correctamente.</p>
                <Link to="/login"><Button className="w-full">Ir a iniciar sesión</Button></Link>
              </>
            ) : !token ? (
              <Link to="/olvide-contrasena" className="text-sm text-primary hover:underline">Pedir un enlace nuevo</Link>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-new-pw">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="reset-new-pw"
                      type={showPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="8+ caracteres o PIN de 4+ dígitos"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm-pw">Confirmar contraseña</Label>
                  <Input
                    id="reset-confirm-pw"
                    type={showPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repite la contraseña"
                  />
                </div>
                {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? 'Guardando...' : 'Restablecer contraseña'}
                </Button>
                <Link to="/login" className="block text-sm text-primary hover:underline text-center">
                  Volver a iniciar sesión
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ResetPassword;
```

- [ ] **Step 3: Registrar las rutas en `src/App.tsx`**

Junto a los demás `lazy(() => import(...))` de páginas públicas (cerca de `const Login = ...`), agregar:

```tsx
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
```

Y junto a `<Route path="/login" element={<Login />} />` (línea 80), agregar:

```tsx
        <Route path="/olvide-contrasena" element={<ForgotPassword />} />
        <Route path="/restablecer" element={<ResetPassword />} />
```

- [ ] **Step 4: Verificación manual en el navegador**

Con `npm run dev` corriendo (y `vercel dev --listen 4181` de la Task 4 activo para que el proxy de `/api` funcione), abrir `http://localhost:5173/olvide-contrasena`, escribir `admin@felmat.com.mx`, enviar, y confirmar que llega el correo real (workflow de la Task 10) con un link a `/restablecer?token=...` que carga el formulario de nueva contraseña.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ForgotPassword.tsx src/pages/ResetPassword.tsx src/App.tsx
git commit -m "feat: paginas de olvide/restablecer contrasena"
```

---

### Task 15: Verificación de punta a punta

**Files:** ninguno nuevo — solo verificación manual sobre lo construido en las Tasks 1-14.

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: confirmación de que el sistema completo funciona antes de darlo por terminado.

- [ ] **Step 1: `npm run build` limpio**

Run: `npm run build`
Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 2: Levantar todo localmente**

Run (en dos terminales): `npx vercel dev --listen 4181` y `npm run dev`

- [ ] **Step 3: Recorrido manual en el navegador (usar el Browser pane)**

1. Ir a `http://localhost:5173/login`, entrar con `admin@felmat.com.mx` / `Fridasufrida09.` → debe redirigir al dashboard.
2. Ir a `/admin/usuarios`, crear un agente nuevo → debe llegar un correo real con sus credenciales (workflow de la Task 10) y aparecer en la lista con rol "Agente".
3. Cerrar sesión, entrar con las credenciales del agente recién creado → debe funcionar.
4. Como agente, crear una propiedad y publicarla; confirmar que en `/propiedades` solo ve las suyas (no las de otros agentes si los hay).
5. Generar una ficha compartible de esa propiedad (`PropertyShare`).
6. Abrir el link de la ficha (`/p/:slug` o el patrón que use `PublicPropertyPage`) **en una ventana de incógnito, sin sesión** → debe verse completa, con los datos del agente.
7. Desde `/login`, ir a "¿Olvidaste tu contraseña?", pedir el reset para `admin@felmat.com.mx`, abrir el link del correo, poner una contraseña nueva, y volver a iniciar sesión con ella.

Expected: los 7 pasos funcionan sin errores en consola del navegador.

- [ ] **Step 4: Commit final (si Step 3 requirió ajustes)**

```bash
git add -A
git commit -m "fix: ajustes de verificacion end-to-end del sistema de usuarios real"
```
