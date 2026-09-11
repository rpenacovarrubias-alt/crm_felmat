# Redes Sociales — Configuración Fase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guardar de verdad (Postgres, no localStorage) las credenciales de Meta (Facebook/Instagram) por sección — Propiedades, Condominios, Airbnb — con una pantalla en cada sección del sidebar para configurarlas. Nada publica ni responde mensajes todavía (eso es Fase 2).

**Architecture:** Un modelo Prisma nuevo (`FelmatSocialConfig`, 1 fila por combinación sección×plataforma) detrás de un endpoint `api/felmat-social-config.js` (mismo patrón de auth/whitelist que `api/felmat-properties.js`). El frontend agrega un link "Redes Sociales" a los 3 grupos existentes del sidebar, una página de selección (tarjetas Facebook/Instagram) y un formulario reutilizable para las 6 combinaciones.

**Tech Stack:** React 18 + TypeScript + Vite, React Router v6, Prisma + Postgres, Vercel serverless functions (JS plano), Vitest, shadcn/ui, sonner (toasts).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-11-redes-sociales-config-fase1-design.md`
- 3 configuraciones independientes: `propiedades`, `condominios`, `airbnb` — no comparten credenciales.
- Cualquier usuario autenticado puede ver/editar (sin restricción de rol adicional).
- `GET` nunca regresa `appSecret`/`accessToken` completos — solo `hasAppSecret: boolean` y `accessTokenPreview` (últimos 4 caracteres con prefijo `••••`).
- `PUT`: si `appSecret`/`accessToken` se omiten del body, se conserva el valor existente; string vacío explícito los borra.
- Nunca usar la password real del usuario para probar nada — sesiones de prueba con `signSession()` de `api/_lib/session.js`.
- Fuera de alcance (no construir en este plan): funciones reales de Meta Graph API, workflows de n8n, webhooks de mensajes, botón "Probar conexión" real.

---

### Task 1: Modelo Prisma `FelmatSocialConfig`

**Files:**
- Modify: `prisma/schema.prisma` (agregar modelo al final, después de `FelmatPropertyShare`)

**Interfaces:**
- Produces: tabla Postgres `felmat_social_config` con columnas `id, section, platform, enabled, appId, appSecret, accountId, accessToken, updatedBy, updatedAt, createdAt`, único por `[section, platform]`. Las tareas 2+ dependen de este modelo vía `prisma.felmatSocialConfig`.

- [ ] **Step 1: Agregar el modelo al final de `prisma/schema.prisma`**

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

- [ ] **Step 2: Aplicar el cambio a la base de datos real**

Run: `npx prisma db push`
Expected: output termina con `Your database is now in sync with your Prisma schema.` y regenera el cliente (`Generated Prisma Client`). Es un cambio aditivo (tabla nueva) — no toca ninguna tabla existente.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): agrega modelo FelmatSocialConfig para credenciales de Meta por seccion

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Endpoint `api/felmat-social-config.js`

**Files:**
- Create: `api/_lib/socialConfigMask.js`
- Create: `api/_lib/socialConfigMask.test.js`
- Create: `api/felmat-social-config.js`

**Interfaces:**
- Consumes: `getSession(req)` de `api/_lib/session.js` (retorna `{ sub, role, propertyAccess } | null`); `prisma.felmatSocialConfig` de Task 1.
- Produces:
  - `maskToken(token: string | null | undefined): string | null` — usado por el handler.
  - `GET /api/felmat-social-config` → `[{section,platform,enabled,appId,accountId,hasAppSecret,accessTokenPreview}, ...]` (hasta 6, solo las que ya se guardaron).
  - `GET /api/felmat-social-config?section=X&platform=Y` → un objeto de esa misma forma; si no existe fila aún, regresa un objeto "vacío" (`enabled:false, appId:null, accountId:null, hasAppSecret:false, accessTokenPreview:null`) con status 200, nunca 404 — evita que el frontend tenga que distinguir "no configurado" de "error".
  - `PUT /api/felmat-social-config` body `{section,platform,enabled,appId,accountId,appSecret?,accessToken?}` → upsert, regresa el objeto actualizado con la misma forma que GET. Tareas 3+ consumen este contrato.

- [ ] **Step 1: Escribir el helper de enmascarado y su test**

`api/_lib/socialConfigMask.js`:
```javascript
// Nunca se regresa un secret/token completo al frontend -- solo un preview
// de los ultimos 4 caracteres, mismo principio que el resto del backend
// nunca expone passwordHash/salt (ver api/_lib/session.js).
export function maskToken(token) {
  if (!token) return null;
  return `••••${token.slice(-4)}`;
}
```

`api/_lib/socialConfigMask.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import { maskToken } from './socialConfigMask.js';

describe('maskToken', () => {
  it('regresa null si no hay token', () => {
    expect(maskToken(null)).toBe(null);
    expect(maskToken(undefined)).toBe(null);
    expect(maskToken('')).toBe(null);
  });

  it('regresa los ultimos 4 caracteres con prefijo de puntos', () => {
    expect(maskToken('EAABsbCS1234567890')).toBe('••••7890');
  });

  it('funciona con tokens mas cortos que 4 caracteres', () => {
    expect(maskToken('ab')).toBe('••••ab');
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que pasan**

Run: `npx vitest run api/_lib/socialConfigMask.test.js`
Expected: `3 passed`

- [ ] **Step 3: Escribir el handler**

`api/felmat-social-config.js`:
```javascript
import { PrismaClient } from '@prisma/client';
import { getSession } from './_lib/session.js';
import { maskToken } from './_lib/socialConfigMask.js';

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

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'GET') {
    const { section, platform } = req.query;
    if (section || platform) {
      if (!SECTIONS.includes(section)) return res.status(400).json({ error: 'invalid_section' });
      if (!PLATFORMS.includes(platform)) return res.status(400).json({ error: 'invalid_platform' });
      const row = await prisma.felmatSocialConfig.findUnique({ where: { section_platform: { section, platform } } });
      return res.status(200).json(toPublic(row, section, platform));
    }
    const rows = await prisma.felmatSocialConfig.findMany();
    return res.status(200).json(rows.map((r) => toPublic(r, r.section, r.platform)));
  }

  if (req.method === 'PUT') {
    const b = req.body ?? {};
    if (!SECTIONS.includes(b.section)) return res.status(400).json({ error: 'invalid_section' });
    if (!PLATFORMS.includes(b.platform)) return res.status(400).json({ error: 'invalid_platform' });

    // ponytail: appSecret/accessToken solo se tocan si vienen en el body --
    // omitirlos conserva el valor guardado, mandar '' los borra. Esto evita
    // que el formulario tenga que re-mandar el secret completo cada vez que
    // el usuario solo cambia el switch de "enabled".
    const data = {
      enabled: !!b.enabled,
      appId: b.appId ?? null,
      accountId: b.accountId ?? null,
      updatedBy: session.sub,
    };
    if ('appSecret' in b) data.appSecret = b.appSecret || null;
    if ('accessToken' in b) data.accessToken = b.accessToken || null;

    const row = await prisma.felmatSocialConfig.upsert({
      where: { section_platform: { section: b.section, platform: b.platform } },
      update: data,
      create: { section: b.section, platform: b.platform, ...data },
    });
    return res.status(200).json(toPublic(row, row.section, row.platform));
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
```

- [ ] **Step 4: Verificar en vivo contra producción (nunca con password real)**

```bash
node --env-file=.env -e "
import('./api/_lib/session.js').then(async ({signSession}) => {
  const token = signSession({sub:'test-user', role:'agent', propertyAccess:[]});
  const base = 'https://crm-felmat.vercel.app/api/felmat-social-config';
  const auth = {Authorization: 'Bearer '+token, 'Content-Type':'application/json'};

  // 1. GET de una combinacion nunca configurada -> objeto vacio, 200
  let r = await fetch(base+'?section=propiedades&platform=facebook', {headers: auth});
  console.log('GET vacio:', r.status, await r.text());

  // 2. PUT crea la fila
  r = await fetch(base, {method:'PUT', headers: auth, body: JSON.stringify({
    section:'propiedades', platform:'facebook', enabled:true,
    appId:'123456', accountId:'987654', appSecret:'shhh-secret', accessToken:'EAAB1234567890abcd',
  })});
  const created = await r.json();
  console.log('PUT crea:', r.status, JSON.stringify(created));

  // 3. accessTokenPreview nunca expone el token completo
  console.log('preview correcto:', created.accessTokenPreview === '••••abcd');
  console.log('nunca expone appSecret:', !('appSecret' in created) && created.hasAppSecret === true);

  // 4. PUT sin mandar accessToken -> se conserva
  r = await fetch(base, {method:'PUT', headers: auth, body: JSON.stringify({
    section:'propiedades', platform:'facebook', enabled:false, appId:'123456', accountId:'987654',
  })});
  const kept = await r.json();
  console.log('token se conserva tras omitirlo:', kept.accessTokenPreview === '••••abcd', 'enabled ahora false:', kept.enabled === false);

  // 5. seccion/plataforma invalida -> 400
  r = await fetch(base+'?section=nope&platform=facebook', {headers: auth});
  console.log('seccion invalida -> 400:', r.status === 400);

  // limpieza: deja la fila en estado neutro
  await fetch(base, {method:'PUT', headers: auth, body: JSON.stringify({
    section:'propiedades', platform:'facebook', enabled:false, appId:null, accountId:null, appSecret:'', accessToken:'',
  })});
});
"
```
Expected: `preview correcto: true`, `nunca expone appSecret: true`, `token se conserva tras omitirlo: true enabled ahora false: true`, `seccion invalida -> 400: true`.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/socialConfigMask.js api/_lib/socialConfigMask.test.js api/felmat-social-config.js
git commit -m "feat(api): endpoint felmat-social-config con enmascarado de secrets

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Cliente frontend `src/lib/socialConfigApi.ts`

**Files:**
- Create: `src/lib/socialConfigApi.ts`

**Interfaces:**
- Consumes: `apiFetch` de `src/utils/apiFetch.ts` (firma: `apiFetch(input: string, init?: RequestInit): Promise<Response>`, ya agrega `Authorization` y `Content-Type`).
- Produces:
  - `type SocialSection = 'propiedades' | 'condominios' | 'airbnb'`
  - `type SocialPlatform = 'facebook' | 'instagram'`
  - `interface SocialConfig { section: SocialSection; platform: SocialPlatform; enabled: boolean; appId: string | null; accountId: string | null; hasAppSecret: boolean; accessTokenPreview: string | null }`
  - `getSocialConfig(section: SocialSection, platform: SocialPlatform): Promise<SocialConfig>`
  - `listSocialConfigs(): Promise<SocialConfig[]>`
  - `saveSocialConfig(input: { section: SocialSection; platform: SocialPlatform; enabled: boolean; appId: string; accountId: string; appSecret?: string; accessToken?: string }): Promise<SocialConfig>`
  Tasks 4 y 5 consumen estas 3 funciones y los 2 tipos.

- [ ] **Step 1: Escribir el cliente**

```typescript
export type SocialSection = 'propiedades' | 'condominios' | 'airbnb';
export type SocialPlatform = 'facebook' | 'instagram';

export interface SocialConfig {
  section: SocialSection;
  platform: SocialPlatform;
  enabled: boolean;
  appId: string | null;
  accountId: string | null;
  hasAppSecret: boolean;
  accessTokenPreview: string | null;
}

export interface SaveSocialConfigInput {
  section: SocialSection;
  platform: SocialPlatform;
  enabled: boolean;
  appId: string;
  accountId: string;
  appSecret?: string;
  accessToken?: string;
}

import { apiFetch } from '@/utils/apiFetch';

async function parseOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export async function getSocialConfig(section: SocialSection, platform: SocialPlatform): Promise<SocialConfig> {
  const res = await apiFetch(`/api/felmat-social-config?section=${section}&platform=${platform}`);
  return parseOrThrow<SocialConfig>(res);
}

export async function listSocialConfigs(): Promise<SocialConfig[]> {
  const res = await apiFetch('/api/felmat-social-config');
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

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos relacionados a `socialConfigApi.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/socialConfigApi.ts
git commit -m "feat(frontend): cliente API para configuracion de redes sociales

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `SocialConfigForm.tsx`

**Files:**
- Create: `src/components/social/SocialConfigForm.tsx`

**Interfaces:**
- Consumes: `getSocialConfig`, `saveSocialConfig`, `SocialSection`, `SocialPlatform` de Task 3. `useParams` de `react-router-dom` para leer `:platform` de la URL. `toast` de `sonner`. Componentes `Card/CardHeader/CardTitle/CardContent`, `Input`, `Label`, `Switch`, `Button` de `@/components/ui/*` (mismos imports que `PropertyForm.tsx`).
- Produces: `export function SocialConfigForm({ section }: { section: SocialSection })`, montado por las rutas de Task 6 con `section` fija por ruta y `platform` tomado de la URL.

- [ ] **Step 1: Escribir el componente**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Facebook, Instagram, Save } from 'lucide-react';
import { getSocialConfig, saveSocialConfig, type SocialPlatform, type SocialSection } from '@/lib/socialConfigApi';

const PLATFORM_LABELS: Record<SocialPlatform, { title: string; icon: typeof Facebook; accountLabel: string; accountPlaceholder: string }> = {
  facebook: { title: 'Facebook', icon: Facebook, accountLabel: 'Page ID', accountPlaceholder: 'ID de tu Página de Facebook' },
  instagram: { title: 'Instagram', icon: Instagram, accountLabel: 'Instagram Business Account ID', accountPlaceholder: 'ID de tu cuenta de Instagram' },
};

export function SocialConfigForm({ section }: { section: SocialSection }) {
  const navigate = useNavigate();
  const { platform: platformParam } = useParams<{ platform: string }>();
  const platform = platformParam === 'facebook' || platformParam === 'instagram' ? platformParam : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [appId, setAppId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [hasAppSecret, setHasAppSecret] = useState(false);
  const [accessTokenPreview, setAccessTokenPreview] = useState<string | null>(null);

  const sectionHome = `/${section}/redes-sociales`;

  useEffect(() => {
    if (!platform) { navigate(sectionHome, { replace: true }); return; }
    getSocialConfig(section, platform).then((cfg) => {
      setEnabled(cfg.enabled);
      setAppId(cfg.appId ?? '');
      setAccountId(cfg.accountId ?? '');
      setHasAppSecret(cfg.hasAppSecret);
      setAccessTokenPreview(cfg.accessTokenPreview);
      setLoading(false);
    }).catch(() => {
      toast.error('No se pudo cargar la configuración');
      setLoading(false);
    });
  }, [section, platform, navigate]);

  if (!platform) return null;

  const info = PLATFORM_LABELS[platform];

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
      });
      setHasAppSecret(saved.hasAppSecret);
      setAccessTokenPreview(saved.accessTokenPreview);
      setAppSecret('');
      setAccessToken('');
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(sectionHome)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <info.icon className="w-6 h-6" />
            {info.title}
          </h1>
          <p className="text-sm text-muted-foreground">Credenciales de Meta para esta sección</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base">Activar {info.title}</Label>
                <p className="text-sm text-muted-foreground">{enabled ? 'Activo' : 'Inactivo'}</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appId">App ID</Label>
              <Input id="appId" value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="ID de tu App de Meta" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appSecret">App Secret</Label>
              <Input
                id="appSecret"
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder={hasAppSecret ? 'Ya configurado — escribe para reemplazar' : 'App Secret de tu App de Meta'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId">{info.accountLabel}</Label>
              <Input id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder={info.accountPlaceholder} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={accessTokenPreview ? `${accessTokenPreview} — escribe para reemplazar` : 'Access Token de larga duración'}
              />
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SocialConfigForm;
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos relacionados a `SocialConfigForm.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/social/SocialConfigForm.tsx
git commit -m "feat(frontend): formulario de configuracion de Facebook/Instagram por seccion

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: `RedesSociales.tsx` (página de selección)

**Files:**
- Create: `src/pages/RedesSociales.tsx`

**Interfaces:**
- Consumes: `listSocialConfigs`, `SocialSection` de Task 3. `Link` de `react-router-dom`.
- Produces: `export function RedesSociales({ section }: { section: SocialSection })`, montado por las rutas de Task 6.

- [ ] **Step 1: Escribir el componente**

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Facebook, Instagram } from 'lucide-react';
import { listSocialConfigs, type SocialConfig, type SocialSection } from '@/lib/socialConfigApi';

const PLATFORMS: { key: 'facebook' | 'instagram'; label: string; icon: typeof Facebook }[] = [
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
];

export function RedesSociales({ section }: { section: SocialSection }) {
  const [configs, setConfigs] = useState<SocialConfig[]>([]);

  useEffect(() => {
    listSocialConfigs().then((all) => setConfigs(all.filter((c) => c.section === section)));
  }, [section]);

  const isEnabled = (platform: 'facebook' | 'instagram') =>
    configs.find((c) => c.platform === platform)?.enabled ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Redes Sociales</h1>
        <p className="text-sm text-muted-foreground">Conecta las cuentas de Meta para esta sección</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {PLATFORMS.map(({ key, label, icon: Icon }) => (
          <Link key={key} to={`/${section}/redes-sociales/${key}`}>
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

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos relacionados a `RedesSociales.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/RedesSociales.tsx
git commit -m "feat(frontend): pagina de seleccion Facebook/Instagram por seccion

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Rutas + Sidebar

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: `RedesSociales` (Task 5), `SocialConfigForm` (Task 4) — ambos con named export y default export, importables con `lazy(() => import(...))` como el resto de `App.tsx`.

- [ ] **Step 1: Agregar los imports lazy en `App.tsx`**

Junto a los demás `const X = lazy(() => import(...))` (cerca de la línea 53, después de `AmenidadesPage`):

```typescript
const RedesSociales = lazy(() => import('@/pages/RedesSociales'));
const SocialConfigForm = lazy(() => import('@/components/social/SocialConfigForm'));
```

- [ ] **Step 2: Agregar las 6 rutas dentro del grupo protegido**

Después de la línea `<Route path="/propiedades/desempeno" element={<PropertyPerformance />} />` (línea 104):

```tsx
            <Route path="/propiedades/redes-sociales" element={<RedesSociales section="propiedades" />} />
            <Route path="/propiedades/redes-sociales/:platform" element={<SocialConfigForm section="propiedades" />} />
```

Después de la línea `<Route path="/legal/fianzas/nueva" element={<Navigate to="/legal/fianzas" replace />} />` (línea 164):

```tsx
            <Route path="/condominios/redes-sociales" element={<RedesSociales section="condominios" />} />
            <Route path="/condominios/redes-sociales/:platform" element={<SocialConfigForm section="condominios" />} />
```

Después de la línea `<Route path="/airbnb/reservas" element={<AirbnbReservasPage />} />` (línea 174):

```tsx
            <Route path="/airbnb/redes-sociales" element={<RedesSociales section="airbnb" />} />
            <Route path="/airbnb/redes-sociales/:platform" element={<SocialConfigForm section="airbnb" />} />
```

- [ ] **Step 3: Agregar el link "Redes Sociales" a los 3 grupos en `Sidebar.tsx`**

En `propertiesGroup.items` (después de `Desempeño`):
```typescript
    { label: 'Desempeño', href: '/propiedades/desempeno', icon: TrendingUp },
    { label: 'Redes Sociales', href: '/propiedades/redes-sociales', icon: Share2 },
```

En `adminCondominiosGroup.items` (después de `Legal`):
```typescript
    { label: 'Legal', href: '/legal/contratos', icon: Scale },
    { label: 'Redes Sociales', href: '/condominios/redes-sociales', icon: Share2 },
```

En `airbnbGroup.items` (después de `Reservas`):
```typescript
    { label: 'Reservas', href: '/airbnb/reservas', icon: Briefcase },
    { label: 'Redes Sociales', href: '/airbnb/redes-sociales', icon: Share2 },
```

`Share2` ya está importado en este archivo (se usa en "Listas compartidas") — no hace falta agregar el import.

- [ ] **Step 4: Extender `isAdminCondominiosActive` para que resalte el grupo en la nueva ruta**

```typescript
  const isAdminCondominiosActive = location.pathname.startsWith('/carta-presentacion') ||
    location.pathname.startsWith('/cotizaciones') ||
    location.pathname.startsWith('/admin/condominios') ||
    location.pathname.startsWith('/condominios') ||
    location.pathname.startsWith('/legal');
```

(`isPropertiesActive` ya usa `startsWith('/propiedades')` e `isAirbnbActive` ya usa `startsWith('/airbnb')` — ambas cubren las rutas nuevas sin cambios.)

- [ ] **Step 5: Verificar que todo compila y buildea**

Run: `npx tsc --noEmit && npm run build`
Expected: ambos comandos terminan sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/layout/Sidebar.tsx
git commit -m "feat(frontend): conecta Redes Sociales al sidebar y las rutas de las 3 secciones

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Push a producción**

```bash
git push origin main
```
