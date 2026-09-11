# Redes Sociales — Corrección a modelo por asesor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir la Fase 1 de Redes Sociales (ya en producción) de "credenciales compartidas por sección" a "credenciales propias de cada asesor, por sección" -- con `super_admin` pudiendo ver/editar las de cualquier asesor con fines de soporte.

**Architecture:** Se agrega `userId` a `FelmatSocialConfig` (único ahora es `[userId, section, platform]`). El backend resuelve "de quién son las credenciales" a partir de la sesión por defecto, y solo permite que `super_admin` apunte explícitamente a otro usuario (vía query param en GET, vía campo del body en PUT -- ambos ignorados/rechazados para cualquier otro rol). El frontend agrega un selector "Viendo como" visible solo para `super_admin`.

**Tech Stack:** Igual que el resto del proyecto -- React 18 + TypeScript + Vite, Prisma + Postgres, Vercel serverless (JS plano), Vitest, shadcn/ui.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-11-redes-sociales-por-asesor-correction-design.md`
- Único de la tabla: `[userId, section, platform]` (antes `[section, platform]`).
- Un usuario normal (`agent`/`assistant`/`admin`) SOLO puede leer/escribir sus propias filas (`userId === session.sub`), sin excepción.
- Solo `super_admin` (usar `isSuperAdmin(session.role)` de `api/_lib/session.js`, ya existe) puede leer/escribir las de otro usuario, vía `?userId=` en GET o `userId` en el body de PUT.
- Un `userId` de otro usuario en el body de PUT, mandado por alguien que NO es `super_admin`, se ignora en silencio (se usa `session.sub`) -- nunca se rechaza la request completa por esto, solo se corrige el dueño.
- Un `userId` de otro usuario en el query de GET, mandado por alguien que NO es `super_admin`, sí se rechaza explícitamente con 403.
- `updatedBy` sigue siendo siempre `session.sub` (quién hizo el cambio), sin importar de quién sea la fila.
- Nunca usar la password real del usuario para probar nada -- `signSession()` de `api/_lib/session.js` para todas las sesiones de prueba.
- Todo lo demás de Fase 1 (masking de secrets, preserve-on-omit/clear-on-empty-string, whitelist de section/platform, "Fuera de alcance") sigue igual, sin cambios.

---

### Task 1: Modelo Prisma -- `userId` en `FelmatSocialConfig`

**Files:**
- Modify: `prisma/schema.prisma` (modelo `FelmatSocialConfig`, líneas 163-178, y modelo `FelmatUser`, agregar relación inversa)

**Interfaces:**
- Produces: columna `userId` en `felmat_social_config`, FK a `felmat_users`, único compuesto `[userId, section, platform]` (Prisma genera el nombre de índice `userId_section_platform`, usado por Task 2 en `where: { userId_section_platform: {...} } }`).

- [ ] **Step 1: Reemplazar el modelo `FelmatSocialConfig` completo**

Reemplaza el bloque actual (líneas 163-178 de `prisma/schema.prisma`) por:

```prisma
model FelmatSocialConfig {
  id          String   @id @default(cuid())
  userId      String
  user        FelmatUser @relation(fields: [userId], references: [id], onDelete: Cascade)
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

  @@unique([userId, section, platform])
  @@map("felmat_social_config")
}
```

- [ ] **Step 2: Agregar el lado inverso de la relación en `FelmatUser`**

En el modelo `FelmatUser`, junto a las otras relaciones existentes (`properties`, `shares`), agrega:

```prisma
  socialConfigs  FelmatSocialConfig[]
```

- [ ] **Step 3: Aplicar el cambio a la base de datos real**

Run: `npx prisma db push`
Expected: output termina con `Your database is now in sync with your Prisma schema.` La tabla `felmat_social_config` está vacía en producción hoy (confirmado por el controlador) -- este es un cambio de esquema limpio, no hay filas existentes que Prisma deba migrar o que puedan quedar huérfanas.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): agrega userId a FelmatSocialConfig -- credenciales son por asesor, no compartidas

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Backend -- ownership y soporte de `super_admin`

**Files:**
- Modify: `api/felmat-social-config.js`

**Interfaces:**
- Consumes: `isSuperAdmin(role)` de `api/_lib/session.js` (ya existe, exportada, firma `isSuperAdmin(role: string): boolean`). `session.sub` (id del usuario autenticado).
- Produces: mismo contrato de respuesta que antes (`toPublic()` sin cambios en su forma de salida), pero ahora resuelto contra `userId`. Tasks 3+ consumen: `GET /api/felmat-social-config?section=X&platform=Y[&userId=Z]`, `GET /api/felmat-social-config[?userId=Z]` (listado), `PUT` con `userId?` opcional en el body.

- [ ] **Step 1: Reescribir el handler completo**

Reemplaza el contenido completo de `api/felmat-social-config.js` por:

```javascript
import { PrismaClient } from '@prisma/client';
import { getSession, isSuperAdmin } from './_lib/session.js';
import { maskToken, secretFieldUpdate } from './_lib/socialConfigMask.js';

const prisma = new PrismaClient();

const SECTIONS = ['propiedades', 'condominios', 'airbnb'];
const PLATFORMS = ['facebook', 'instagram'];

function toPublic(row, section, platform) {
  if (!row) {
    return { section, platform, enabled: false, appId: null, accountId: null, hasAppSecret: false, accessTokenPreview: null };
  }
  return {
    section: row.section,
    platform: row.platform,
    enabled: row.enabled,
    appId: row.appId,
    accountId: row.accountId,
    hasAppSecret: !!row.appSecret,
    accessTokenPreview: maskToken(row.accessToken),
  };
}

// ponytail: resuelve de quien son las credenciales que se van a leer/escribir.
// Por defecto siempre el propio usuario -- un userId de otra persona solo se
// respeta si quien pide es super_admin (soporte). Nunca se confia en el body
// ni en el query de un usuario normal para esto.
function resolveTargetUserId(session, requestedUserId) {
  if (!requestedUserId || requestedUserId === session.sub) return { userId: session.sub, forbidden: false };
  if (isSuperAdmin(session.role)) return { userId: requestedUserId, forbidden: false };
  return { userId: session.sub, forbidden: true };
}

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'GET') {
    const { section, platform, userId: requestedUserId } = req.query;
    const target = resolveTargetUserId(session, requestedUserId);
    if (target.forbidden) return res.status(403).json({ error: 'forbidden' });

    if (section || platform) {
      if (!SECTIONS.includes(section)) return res.status(400).json({ error: 'invalid_section' });
      if (!PLATFORMS.includes(platform)) return res.status(400).json({ error: 'invalid_platform' });
      const row = await prisma.felmatSocialConfig.findUnique({
        where: { userId_section_platform: { userId: target.userId, section, platform } },
      });
      return res.status(200).json(toPublic(row, section, platform));
    }
    const rows = await prisma.felmatSocialConfig.findMany({ where: { userId: target.userId } });
    return res.status(200).json(rows.map((r) => toPublic(r, r.section, r.platform)));
  }

  if (req.method === 'PUT') {
    const b = req.body ?? {};
    if (!SECTIONS.includes(b.section)) return res.status(400).json({ error: 'invalid_section' });
    if (!PLATFORMS.includes(b.platform)) return res.status(400).json({ error: 'invalid_platform' });

    // Un userId de otro usuario en el body solo se respeta si eres
    // super_admin; para cualquier otro rol se ignora en silencio (se sigue
    // guardando en la fila propia) -- no se rechaza la request por esto.
    const targetUserId = b.userId && isSuperAdmin(session.role) ? b.userId : session.sub;

    // appSecret/accessToken solo se tocan si vienen en el body -- omitirlos
    // conserva el valor guardado, mandar '' los borra. Logica en
    // secretFieldUpdate (api/_lib/socialConfigMask.js) para poder probarla
    // sin Prisma.
    const data = {
      enabled: !!b.enabled,
      appId: b.appId || null,
      accountId: b.accountId || null,
      updatedBy: session.sub,
    };
    const appSecretUpdate = secretFieldUpdate(b, 'appSecret');
    if (appSecretUpdate.touched) data.appSecret = appSecretUpdate.value;
    const accessTokenUpdate = secretFieldUpdate(b, 'accessToken');
    if (accessTokenUpdate.touched) data.accessToken = accessTokenUpdate.value;

    const row = await prisma.felmatSocialConfig.upsert({
      where: { userId_section_platform: { userId: targetUserId, section: b.section, platform: b.platform } },
      update: data,
      create: { userId: targetUserId, section: b.section, platform: b.platform, ...data },
    });
    return res.status(200).json(toPublic(row, row.section, row.platform));
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
```

- [ ] **Step 2: Verificar en vivo contra un servidor local (`vercel dev`), nunca con password real**

Levanta un servidor local (`npx vercel dev --listen 4181` en background desde la raíz del repo; si el puerto ya está ocupado por una sesión anterior, mata el proceso viejo primero con `netstat -ano | grep :4181` y `Stop-Process`/`kill`). Corre este script contra `http://localhost:4181` (ajusta el puerto si usaste otro):

```bash
node --env-file=.env -e "
import('./api/_lib/session.js').then(async ({signSession}) => {
  const base = 'http://localhost:4181';
  const tokenA = signSession({sub:'test-agent-a', role:'agent', propertyAccess:[]});
  const tokenB = signSession({sub:'test-agent-b', role:'agent', propertyAccess:[]});
  const tokenSuper = signSession({sub:'test-super', role:'super_admin', propertyAccess:[]});
  const authA = {Authorization:'Bearer '+tokenA, 'Content-Type':'application/json'};
  const authB = {Authorization:'Bearer '+tokenB, 'Content-Type':'application/json'};
  const authSuper = {Authorization:'Bearer '+tokenSuper, 'Content-Type':'application/json'};

  // 1. A guarda sus credenciales
  let r = await fetch(base+'/api/felmat-social-config', {method:'PUT', headers:authA, body: JSON.stringify({
    section:'propiedades', platform:'facebook', enabled:true, appId:'a-app-id', accountId:'a-account-id', appSecret:'a-secret', accessToken:'a-token-1234',
  })});
  console.log('A guarda:', r.status, JSON.stringify(await r.json()));

  // 2. B lee la misma combinacion (sin userId) -> debe ver SUS PROPIAS filas vacias, nunca las de A
  r = await fetch(base+'/api/felmat-social-config?section=propiedades&platform=facebook', {headers:authB});
  const bReads = await r.json();
  console.log('B lee lo suyo (debe ser vacio, no lo de A):', r.status, JSON.stringify(bReads), 'aislado de A:', bReads.appId === null);

  // 3. B intenta leer explicitamente lo de A -> 403
  r = await fetch(base+'/api/felmat-social-config?section=propiedades&platform=facebook&userId=test-agent-a', {headers:authB});
  console.log('B pide ver lo de A -> 403:', r.status === 403);

  // 4. B intenta escribir con userId=A en el body -> se ignora, escribe en lo suyo
  r = await fetch(base+'/api/felmat-social-config', {method:'PUT', headers:authB, body: JSON.stringify({
    section:'propiedades', platform:'facebook', enabled:true, appId:'b-tratando-de-ser-a', accountId:'x', userId:'test-agent-a',
  })});
  const bWrite = await r.json();
  console.log('B intenta escribir como A, se ignora:', r.status, JSON.stringify(bWrite));
  r = await fetch(base+'/api/felmat-social-config?section=propiedades&platform=facebook', {headers:authA});
  const aStillIntact = await r.json();
  console.log('A sigue intacto tras el intento de B:', aStillIntact.appId === 'a-app-id');

  // 5. super_admin lee lo de A explicitamente -> si funciona
  r = await fetch(base+'/api/felmat-social-config?section=propiedades&platform=facebook&userId=test-agent-a', {headers:authSuper});
  const superReadsA = await r.json();
  console.log('super_admin lee lo de A:', r.status, superReadsA.appId === 'a-app-id');

  // 6. super_admin sin userId -> lee lo SUYO propio (vacio, no lo de A)
  r = await fetch(base+'/api/felmat-social-config?section=propiedades&platform=facebook', {headers:authSuper});
  const superOwn = await r.json();
  console.log('super_admin sin userId ve lo suyo (vacio):', superOwn.appId === null);

  // limpieza
  await fetch(base+'/api/felmat-social-config', {method:'PUT', headers:authA, body: JSON.stringify({section:'propiedades', platform:'facebook', enabled:false, appId:null, accountId:null, appSecret:'', accessToken:''})});
});
"
```
Expected: `B aislado de A: true`, `403: true`, `A sigue intacto: true`, `super_admin lee lo de A: true`, `super_admin ve lo suyo (vacio): true`.

- [ ] **Step 3: Commit**

```bash
git add api/felmat-social-config.js
git commit -m "feat(api): scoping de redes sociales por usuario -- super_admin puede ver/editar las de otros

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Cliente frontend -- soporte de `userId` opcional

**Files:**
- Modify: `src/lib/socialConfigApi.ts`

**Interfaces:**
- Produces: `getSocialConfig(section, platform, userId?: string): Promise<SocialConfig>`, `listSocialConfigs(userId?: string): Promise<SocialConfig[]>`, `saveSocialConfig(input: SaveSocialConfigInput & { userId?: string }): Promise<SocialConfig>`. Task 4 consume estas firmas.

- [ ] **Step 1: Modificar las 3 funciones para aceptar `userId` opcional**

En `SaveSocialConfigInput`, agrega el campo opcional:
```typescript
export interface SaveSocialConfigInput {
  section: SocialSection;
  platform: SocialPlatform;
  enabled: boolean;
  appId: string;
  accountId: string;
  appSecret?: string;
  accessToken?: string;
  userId?: string;
}
```

Reemplaza las 3 funciones exportadas por:
```typescript
export async function getSocialConfig(section: SocialSection, platform: SocialPlatform, userId?: string): Promise<SocialConfig> {
  const qs = new URLSearchParams({ section, platform });
  if (userId) qs.set('userId', userId);
  const res = await apiFetch(`/api/felmat-social-config?${qs.toString()}`);
  return parseOrThrow<SocialConfig>(res);
}

export async function listSocialConfigs(userId?: string): Promise<SocialConfig[]> {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await apiFetch(`/api/felmat-social-config${qs}`);
  return parseOrThrow<SocialConfig[]>(res);
}

export async function saveSocialConfig(input: SaveSocialConfigInput): Promise<SocialConfig> {
  const res = await apiFetch('/api/felmat-social-config', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return parseOrThrow<SocialConfig>(res);
}
```
(`saveSocialConfig` ya recibe `userId` dentro de `input` gracias al campo agregado a la interfaz -- no necesita un parámetro nuevo.)

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add src/lib/socialConfigApi.ts
git commit -m "feat(frontend): cliente de redes sociales acepta userId opcional para soporte de super_admin

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Selector "Viendo como" (solo `super_admin`)

**Files:**
- Modify: `src/pages/RedesSociales.tsx`
- Modify: `src/components/social/SocialConfigForm.tsx`

**Interfaces:**
- Consumes: `useAuth()` de `@/hooks/useAuth` (ya existe en el proyecto; expone `{ user }` donde `user.role` es `'super_admin' | 'admin' | 'agent' | 'assistant'` y `user.id`). `useUsers()` de `@/hooks/useDatabase` (ya existe; expone `{ users }` donde cada `User` tiene `id`, `name`, `lastName`, `role`, `isActive`). `getSocialConfig`/`listSocialConfigs`/`saveSocialConfig` con el parámetro `userId` de Task 3.

- [ ] **Step 1: Agregar el selector a `RedesSociales.tsx`**

Reemplaza el contenido completo de `src/pages/RedesSociales.tsx` por:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Facebook, Instagram } from 'lucide-react';
import { listSocialConfigs, type SocialConfig, type SocialSection } from '@/lib/socialConfigApi';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useDatabase';

const PLATFORMS: { key: 'facebook' | 'instagram'; label: string; icon: typeof Facebook }[] = [
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
];

export function RedesSociales({ section }: { section: SocialSection }) {
  const { user } = useAuth();
  const { users } = useUsers();
  const isSuperAdmin = user?.role === 'super_admin';

  const [viewAsUserId, setViewAsUserId] = useState<string>(user?.id ?? '');
  const [configs, setConfigs] = useState<SocialConfig[]>([]);

  const agentOptions = useMemo(
    () => users.filter((u) => u.isActive),
    [users],
  );

  useEffect(() => {
    if (user?.id && !viewAsUserId) setViewAsUserId(user.id);
  }, [user?.id, viewAsUserId]);

  useEffect(() => {
    const targetUserId = isSuperAdmin && viewAsUserId && viewAsUserId !== user?.id ? viewAsUserId : undefined;
    listSocialConfigs(targetUserId)
      .then((all) => setConfigs(all.filter((c) => c.section === section)))
      .catch(() => toast.error('No se pudo cargar el estado de las conexiones. Los datos mostrados pueden estar desactualizados.'));
  }, [section, isSuperAdmin, viewAsUserId, user?.id]);

  const isEnabled = (platform: 'facebook' | 'instagram') =>
    configs.find((c) => c.platform === platform)?.enabled ?? false;

  const linkTarget = (key: 'facebook' | 'instagram') => {
    const base = `/${section}/redes-sociales/${key}`;
    return isSuperAdmin && viewAsUserId && viewAsUserId !== user?.id ? `${base}?userId=${viewAsUserId}` : base;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Redes Sociales</h1>
          <p className="text-sm text-muted-foreground">Conecta las cuentas de Meta para esta sección</p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Viendo como:</span>
            <Select value={viewAsUserId} onValueChange={setViewAsUserId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Yo" />
              </SelectTrigger>
              <SelectContent>
                {user?.id && <SelectItem value={user.id}>Yo</SelectItem>}
                {agentOptions.filter((a) => a.id !== user?.id).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} {a.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {PLATFORMS.map(({ key, label, icon: Icon }) => (
          <Link key={key} to={linkTarget(key)}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {label}
                  </span>
                  <Badge variant={isEnabled(key) ? 'default' : 'secondary'}>
                    {isEnabled(key) ? 'Activo' : 'Inactivo'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Configurar credenciales y conexión</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RedesSociales;
```

- [ ] **Step 2: Agregar el mismo selector a `SocialConfigForm.tsx`**

En `src/components/social/SocialConfigForm.tsx`:

Agrega los imports nuevos junto a los existentes:
```tsx
import { useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useDatabase';
```
(`useNavigate, useParams` ya están importados de `react-router-dom` -- agrega `useSearchParams` a esa misma línea de import en vez de una línea aparte.)

Dentro del componente, después de resolver `platform` (después de la línea `const platform = platformParam === 'facebook' || platformParam === 'instagram' ? platformParam : null;`), agrega:
```tsx
  const { user } = useAuth();
  const { users } = useUsers();
  const isSuperAdmin = user?.role === 'super_admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const viewAsUserId = searchParams.get('userId') || user?.id || '';
  const effectiveUserId = isSuperAdmin && viewAsUserId !== user?.id ? viewAsUserId : undefined;
```

Modifica `loadConfig` para pasar `effectiveUserId` a `getSocialConfig`:
```tsx
  const loadConfig = () => {
    if (!platform) return;
    setLoading(true);
    setLoadError(false);
    getSocialConfig(section, platform, effectiveUserId).then((cfg) => {
```
(el resto del cuerpo de `.then(...)` no cambia)

Modifica el `useEffect` que llama `loadConfig` para que también re-cargue si `viewAsUserId` cambia:
```tsx
  useEffect(() => {
    if (!platform) { navigate(sectionHome, { replace: true }); return; }
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, platform, navigate, viewAsUserId]);
```

Modifica `handleSave` para incluir `userId` en el payload cuando aplica:
```tsx
  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveSocialConfig({
        section,
        platform,
        enabled,
        appId,
        accountId,
        ...(appSecret ? { appSecret } : {}),
        ...(accessToken ? { accessToken } : {}),
        ...(effectiveUserId ? { userId: effectiveUserId } : {}),
      });
```
(el resto de `handleSave` no cambia)

Agrega el selector al JSX, justo antes del `<div className="flex items-center gap-4">` del header (antes del botón de volver):
```tsx
      {isSuperAdmin && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Viendo como:</span>
          <Select
            value={viewAsUserId}
            onValueChange={(v) => setSearchParams(v === user?.id ? {} : { userId: v })}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Yo" />
            </SelectTrigger>
            <SelectContent>
              {user?.id && <SelectItem value={user.id}>Yo</SelectItem>}
              {users.filter((a) => a.isActive && a.id !== user?.id).map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name} {a.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
```

- [ ] **Step 3: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 4: Commit**

```bash
git add src/pages/RedesSociales.tsx src/components/social/SocialConfigForm.tsx
git commit -m "feat(frontend): selector 'Viendo como' para que super_admin de soporte a otros asesores

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Verificación final y push

**Files:** ninguno nuevo -- solo verificación.

- [ ] **Step 1: Build completo**

Run: `npx tsc --noEmit && npm run build`
Expected: ambos comandos terminan sin errores.

- [ ] **Step 2: Verificación en vivo del flujo completo con `super_admin` real, contra un servidor local**

Con el mismo `vercel dev` local de la Task 2, corre (ajusta el puerto si aplica):

```bash
node --env-file=.env -e "
import('./api/_lib/session.js').then(async ({signSession}) => {
  const base = 'http://localhost:4181';
  const tokenAgent = signSession({sub:'test-agent-final', role:'agent', propertyAccess:[]});
  const authAgent = {Authorization:'Bearer '+tokenAgent, 'Content-Type':'application/json'};

  // Un agente normal guarda y relee sus propias credenciales de airbnb/instagram
  let r = await fetch(base+'/api/felmat-social-config', {method:'PUT', headers:authAgent, body: JSON.stringify({
    section:'airbnb', platform:'instagram', enabled:true, appId:'final-app', accountId:'final-account', accessToken:'final-token-abcd',
  })});
  const saved = await r.json();
  console.log('guarda:', r.status, saved.accessTokenPreview === '••••abcd');

  r = await fetch(base+'/api/felmat-social-config?section=airbnb&platform=instagram', {headers:authAgent});
  const read = await r.json();
  console.log('relee lo mismo:', r.status, read.appId === 'final-app', read.enabled === true);

  // limpieza
  await fetch(base+'/api/felmat-social-config', {method:'PUT', headers:authAgent, body: JSON.stringify({section:'airbnb', platform:'instagram', enabled:false, appId:null, accountId:null, appSecret:'', accessToken:''})});
});
"
```
Expected: `guarda: 200 true`, `relee lo mismo: 200 true true`.

- [ ] **Step 3: Push a producción**

```bash
git push origin main
```
