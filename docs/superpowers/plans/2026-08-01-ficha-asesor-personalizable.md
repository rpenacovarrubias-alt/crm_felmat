# Mapa en PDF, Datos Reales de Asesor y Fichas Personalizables — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar mapa+link junto al QR en el PDF, eliminar el fallback de asesor inventado ("Mayra Fajer") en favor de datos reales o un contacto genérico honesto, y permitir generar enlaces de ficha con datos de contacto personalizados sin afectar la ficha original.

**Architecture:** Toda la lógica de "qué datos de asesor mostrar" se centraliza en una función pura nueva, `resolveAgentDisplay()`, consumida por los tres puntos que hoy duplican esa lógica (`PublicPropertyPage.tsx`, `pdfExport.ts`, `ShareDialog` en `PropertyDetail.tsx`). La personalización se implementa como un nuevo store de IndexedDB (`propertyShares`) con su propio `slug` público, resuelto por `/p/:slug` antes que la propiedad misma — así la ficha original nunca se toca.

**Tech Stack:** React 18 + TypeScript + Vite, IndexedDB (vía el `DatabaseManager` ya existente en `useDatabase.ts`), jsPDF + html2canvas + qrcode (ya instalados), vitest (nuevo, solo para pruebas unitarias de la lógica pura).

## Global Constraints

- Español mexicano en toda la UI y comentarios de código (regla del proyecto).
- No introducir dependencias nuevas salvo `vitest` (dev-only, para las pruebas unitarias de `resolveAgentDisplay`) — todo lo demás usa paquetes ya instalados.
- No modificar el modelo de permisos existente (`canViewAllProperties`, filtro por `agentId` en `useProperties()`).
- `npx tsc --noEmit` y `npm run build` deben quedar limpios antes de cada commit.
- Sin placeholders ni datos de muestra inventados como si fueran reales — cuando no hay datos reales, se debe ser explícito (contacto genérico de agencia, no una persona inventada).

---

## Task 1: Mapa ilustrativo + link de Google Maps junto al QR en el PDF

**Files:**
- Modify: `src/lib/pdfExport.ts`

**Interfaces:**
- Consumes: nada nuevo (usa `mapsSearchUrl` y `locationQrDataUrl`, ya definidos en el archivo).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Reemplazar el recuadro de ubicación por la versión con ilustración + QR + link en texto**

En `src/lib/pdfExport.ts`, busca este bloque (dentro de la página 2, sección "Ubicación y Mapa"):

```html
      <div style="display: flex; gap: 16px; background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div style="flex: 1; font-size: 11px; color: #334155; line-height: 1.6;">
          <div><strong style="color: #64748b;">Calle:</strong> ${property.location.address}</div>
          <div><strong style="color: #64748b;">Colonia:</strong> ${property.location.neighborhood || 'Fraccionamiento Las Trojes'}</div>
          <div><strong style="color: #64748b;">Delegación/Municipio:</strong> ${property.location.city}</div>
          <div><strong style="color: #64748b;">Código postal:</strong> ${property.location.zipCode || '76900'}</div>
          ${property.location.references ? `<div style="margin-top: 6px;"><strong style="color: #64748b;">Referencias:</strong> ${property.location.references}</div>` : ''}
        </div>
        <div style="width: 320px; height: 180px; border-radius: 8px; overflow: hidden; background-color: #ffffff; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 12px; padding: 12px; box-sizing: border-box;">
          <img src="${locationQrDataUrl}" style="width: 130px; height: 130px; flex-shrink: 0; border-radius: 4px;" />
          <div style="font-size: 10px; color: #334155; line-height: 1.5;">
            <div style="font-weight: bold; color: #0f172a; margin-bottom: 4px; font-size: 11px;">📍 Escanea para ver la ubicación real</div>
            <div>${property.location.address}</div>
            <div>${property.location.neighborhood || ''}</div>
            <div>${property.location.city}, ${property.location.state}</div>
          </div>
        </div>
      </div>
```

Reemplázalo por (agrega una tarjeta ilustrativa de pin arriba del QR, y el link de Google Maps como texto plano visible, además del QR):

```html
      <div style="display: flex; gap: 16px; background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; align-items: flex-start;">
        <div style="flex: 1; font-size: 11px; color: #334155; line-height: 1.6;">
          <div><strong style="color: #64748b;">Calle:</strong> ${property.location.address}</div>
          <div><strong style="color: #64748b;">Colonia:</strong> ${property.location.neighborhood || 'Fraccionamiento Las Trojes'}</div>
          <div><strong style="color: #64748b;">Delegación/Municipio:</strong> ${property.location.city}</div>
          <div><strong style="color: #64748b;">Código postal:</strong> ${property.location.zipCode || '76900'}</div>
          ${property.location.references ? `<div style="margin-top: 6px;"><strong style="color: #64748b;">Referencias:</strong> ${property.location.references}</div>` : ''}
        </div>
        <div style="width: 320px; display: flex; flex-direction: column; gap: 10px;">
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #2563eb; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">📍</div>
            <div style="font-size: 10px; color: #1e3a8a; line-height: 1.4;">
              <div style="font-weight: bold;">${property.location.neighborhood || property.location.city}</div>
              <div>${property.location.city}, ${property.location.state}</div>
            </div>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; display: flex; gap: 10px; align-items: center;">
            <img src="${locationQrDataUrl}" style="width: 90px; height: 90px; flex-shrink: 0; border-radius: 4px;" />
            <div style="font-size: 9px; color: #334155; line-height: 1.4;">
              <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">Escanea o copia el link para ver el mapa</div>
              <div style="word-break: break-all; color: #2563eb;">${mapsSearchUrl}</div>
            </div>
          </div>
        </div>
      </div>
```

- [ ] **Step 2: Verificar tipos y build**

Run: `npx tsc --noEmit`
Expected: sin salida (sin errores).

Run: `npm run build`
Expected: `✓ built in ...s` sin errores.

- [ ] **Step 3: Verificación manual en navegador**

Levanta el preview (`npm run preview` en el puerto que uses) o el dev server, abre una ficha pública (`/p/<slug>`), descarga el PDF y confirma en la página 2 que junto al QR aparece la tarjeta con el pin + colonia/ciudad, y el link de Google Maps como texto legible.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdfExport.ts
git commit -m "feat: agregar ilustracion de mapa + link de Google Maps junto al QR en el PDF"
```

---

## Task 2: `resolveAgentDisplay()` — lógica centralizada de datos de asesor + vitest

**Files:**
- Create: `src/lib/agentDisplay.ts`
- Create: `src/lib/agentDisplay.test.ts`
- Modify: `package.json` (agregar `vitest` como devDependency + script `test`)

**Interfaces:**
- Produces: `resolveAgentDisplay(agent: AgentSource | null, override?: AgentOverride): AgentDisplayInfo`, tipos `AgentSource`, `AgentOverride`, `AgentDisplayInfo`, constante `AGENCY_FALLBACK_EMAIL` — todos exportados desde `src/lib/agentDisplay.ts`. Usados por las Tareas 4, 5 y 8.

- [ ] **Step 1: Instalar vitest**

Run: `npm install -D vitest`
Expected: se agrega `vitest` a `devDependencies` en `package.json` y se actualiza `package-lock.json`.

- [ ] **Step 2: Agregar el script de pruebas**

En `package.json`, dentro de `"scripts"`, agrega (después de `"lint"`):

```json
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest run"
```

- [ ] **Step 3: Escribir la prueba (falla primero)**

Crea `src/lib/agentDisplay.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveAgentDisplay, AGENCY_FALLBACK_EMAIL } from './agentDisplay';

describe('resolveAgentDisplay', () => {
  it('usa un contacto generico de la agencia cuando no hay asesor real (sin inventar una persona)', () => {
    const result = resolveAgentDisplay(null);
    expect(result.isRealAgent).toBe(false);
    expect(result.name).toBe('Grupo FELMAT');
    expect(result.email).toBe(AGENCY_FALLBACK_EMAIL);
    expect(result.phone).toBeUndefined();
    expect(result.whatsapp).toBeUndefined();
    expect(result.certificateNumber).toBeUndefined();
  });

  it('usa los datos reales del asesor cuando existe', () => {
    const result = resolveAgentDisplay({
      name: 'Mayra',
      lastName: 'Fajer',
      phone: '4421234567',
      email: 'mayra@felmat.com',
      avatar: 'data:image/png;base64,abc',
      config: {
        bio: 'Asesora certificada en Querétaro',
        certificateNumber: 'FELMAT-002',
        whatsappNumber: '4421234567',
      },
    });
    expect(result.isRealAgent).toBe(true);
    expect(result.name).toBe('Mayra Fajer');
    expect(result.phone).toBe('4421234567');
    expect(result.email).toBe('mayra@felmat.com');
    expect(result.role).toBe('Asesora certificada en Querétaro');
    expect(result.certificateNumber).toBe('FELMAT-002');
  });

  it('el override sustituye solo los campos que trae, sobre los datos reales del asesor', () => {
    const result = resolveAgentDisplay(
      { name: 'Mayra', lastName: 'Fajer', phone: '4421234567', email: 'mayra@felmat.com' },
      { overridePhone: '5559999999' }
    );
    expect(result.isRealAgent).toBe(true);
    expect(result.name).toBe('Mayra Fajer');
    expect(result.phone).toBe('5559999999');
    expect(result.email).toBe('mayra@felmat.com');
  });

  it('el override puede dar identidad a una ficha aunque no haya asesor real vinculado', () => {
    const result = resolveAgentDisplay(null, {
      overrideName: 'Juan Pérez (referido)',
      overridePhone: '4429998877',
    });
    expect(result.isRealAgent).toBe(true);
    expect(result.name).toBe('Juan Pérez (referido)');
    expect(result.phone).toBe('4429998877');
    expect(result.email).toBe(AGENCY_FALLBACK_EMAIL);
  });
});
```

- [ ] **Step 4: Correr la prueba y confirmar que falla**

Run: `npx vitest run src/lib/agentDisplay.test.ts`
Expected: FAIL — `Cannot find module './agentDisplay'` (el archivo aún no existe).

- [ ] **Step 5: Implementar `resolveAgentDisplay`**

Crea `src/lib/agentDisplay.ts`:

```ts
// ============================================
// DATOS DE CONTACTO A MOSTRAR EN LA FICHA (ASESOR)
// ============================================
//
// Unifica la logica que antes estaba duplicada -- y con un fallback
// inventado ("Mayra Fajer" con telefono/correo falsos) -- en
// PublicPropertyPage.tsx, pdfExport.ts y el ShareDialog de
// PropertyDetail.tsx. Cuando no hay un asesor real vinculado, ya no se
// finge ser una persona especifica: se usa un contacto generico de la
// agencia. Un "override" (de una ficha personalizada) puede sustituir
// campos individuales encima de eso.

export const AGENCY_FALLBACK_EMAIL = 'contacto@felmat.com.mx';

export interface AgentSource {
  name: string;
  lastName: string;
  phone?: string;
  email?: string;
  avatar?: string;
  config?: {
    bio?: string;
    certificateNumber?: string;
    whatsappNumber?: string;
  };
}

export interface AgentOverride {
  overrideName?: string;
  overridePhone?: string;
  overrideWhatsapp?: string;
  overrideEmail?: string;
  overrideAvatar?: string;
  overrideCertificate?: string;
  overrideBio?: string;
}

export interface AgentDisplayInfo {
  isRealAgent: boolean;
  name: string;
  role: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  avatar?: string;
  certificateNumber?: string;
}

export function resolveAgentDisplay(
  agent: AgentSource | null,
  override?: AgentOverride
): AgentDisplayInfo {
  const base: AgentDisplayInfo = agent
    ? {
        isRealAgent: true,
        name: `${agent.name} ${agent.lastName}`,
        role: agent.config?.bio || 'Asesor inmobiliario de Grupo FELMAT',
        phone: agent.phone || undefined,
        whatsapp: agent.config?.whatsappNumber,
        email: agent.email || undefined,
        avatar: agent.avatar,
        certificateNumber: agent.config?.certificateNumber,
      }
    : {
        isRealAgent: false,
        name: 'Grupo FELMAT',
        role: 'Servicios Inmobiliarios',
        phone: undefined,
        whatsapp: undefined,
        email: AGENCY_FALLBACK_EMAIL,
        avatar: undefined,
        certificateNumber: undefined,
      };

  if (!override) return base;

  const hasOverrideIdentity = Boolean(
    override.overrideName || override.overridePhone || override.overrideEmail
  );

  return {
    ...base,
    isRealAgent: base.isRealAgent || hasOverrideIdentity,
    name: override.overrideName || base.name,
    role: override.overrideBio || base.role,
    phone: override.overridePhone || base.phone,
    whatsapp: override.overrideWhatsapp || base.whatsapp,
    email: override.overrideEmail || base.email,
    avatar: override.overrideAvatar || base.avatar,
    certificateNumber: override.overrideCertificate || base.certificateNumber,
  };
}
```

- [ ] **Step 6: Correr la prueba y confirmar que pasa**

Run: `npx vitest run src/lib/agentDisplay.test.ts`
Expected: `4 passed` (las 4 pruebas del Step 3).

- [ ] **Step 7: Verificar tipos, build y lint**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `npm run build`
Expected: `✓ built in ...s`.

Run: `npm run lint`
Expected: sin errores nuevos relacionados a `src/lib/agentDisplay.ts` o `src/lib/agentDisplay.test.ts`.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/lib/agentDisplay.ts src/lib/agentDisplay.test.ts
git commit -m "feat: agregar resolveAgentDisplay para unificar datos de asesor sin fallback inventado"
```

---

## Task 3: Store `propertyShares` + hook `usePropertyShares`

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/hooks/useDatabase.ts`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: tipo `PropertyShare` (exportado de `@/types`), hook `usePropertyShares(): { create(input): Promise<PropertyShare>; getBySlug(slug): Promise<PropertyShare | null> }` (exportado de `@/hooks/useDatabase`). Usados por las Tareas 4 y 8.

- [ ] **Step 1: Agregar el tipo `PropertyShare`**

En `src/types/index.ts`, busca la interfaz `PropertyList`:

```ts
export interface PropertyList {
  id: string;
  name: string;
  agentId: string;
  propertyIds: string[];
  slug: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}
```

Agrega inmediatamente después:

```ts

// Ficha compartida con datos de contacto personalizados. No requiere
// que el contacto sea un usuario del CRM -- los campos overrideX son
// texto libre. La propiedad original (propertyId) nunca se modifica.
export interface PropertyShare {
  id: string;
  slug: string;
  propertyId: string;
  createdBy: string;
  overrideName?: string;
  overridePhone?: string;
  overrideWhatsapp?: string;
  overrideEmail?: string;
  overrideAvatar?: string;
  overrideCertificate?: string;
  overrideBio?: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Registrar el store nuevo y subir `DB_VERSION`**

En `src/hooks/useDatabase.ts`, en el import de tipos al inicio del archivo, agrega `PropertyShare`:

```ts
import type {
  User, Property, Lead, LeadStatus, Activity, AgentWebsite, Notification, DashboardStats, PropertyList,
  Condominio, UnidadCondominio, Cotizacion, CartaPresentacion, Contrato, Fianza,
  AirbnbListing, AirbnbMensaje, AirbnbReserva, AirbnbPrecio, TipoPropiedadCustom, AmenidadCatalogo,
  PropertyShare,
} from '@/types';
```

Busca:

```ts
const DB_NAME = 'PropTechCRM';
const DB_VERSION = 3;
```

Cámbialo a:

```ts
const DB_NAME = 'PropTechCRM';
const DB_VERSION = 4;
```

Busca en el objeto `STORES`:

```ts
  propertyLists: 'propertyLists',
```

Agrega justo debajo:

```ts
  propertyLists: 'propertyLists',
  propertyShares: 'propertyShares',
```

Busca en `onupgradeneeded` el bloque de creación de `propertyLists`:

```ts
        if (!db.objectStoreNames.contains(STORES.propertyLists)) {
          const listStore = db.createObjectStore(STORES.propertyLists, { keyPath: 'id' });
          listStore.createIndex('agentId', 'agentId', { unique: false });
          listStore.createIndex('slug', 'slug', { unique: true });
        }
```

Agrega justo debajo:

```ts
        if (!db.objectStoreNames.contains(STORES.propertyShares)) {
          const shareStore = db.createObjectStore(STORES.propertyShares, { keyPath: 'id' });
          shareStore.createIndex('slug', 'slug', { unique: true });
          shareStore.createIndex('propertyId', 'propertyId', { unique: false });
        }
```

- [ ] **Step 3: Agregar el hook `usePropertyShares`**

En `src/hooks/useDatabase.ts`, busca el final del hook `usePropertyLists` (termina con esta línea, justo antes del comentario "Hook para Administración de Condominios"):

```ts
  return { lists, loading, create, update, remove, addProperty, removeProperty, getBySlug, incrementViews, refresh };
}

// Hook para Administración de Condominios
```

Insértalo así (agregando el hook nuevo entre ambos):

```ts
  return { lists, loading, create, update, remove, addProperty, removeProperty, getBySlug, incrementViews, refresh };
}

// Hook para Fichas Compartidas Personalizadas (ver docs/superpowers/specs/2026-08-01-ficha-asesor-personalizable-design.md)
export function usePropertyShares() {
  const create = async (
    input: Omit<PropertyShare, 'id' | 'slug' | 'createdAt' | 'updatedAt'>
  ): Promise<PropertyShare> => {
    const newShare: PropertyShare = {
      ...input,
      id: crypto.randomUUID(),
      slug: `c-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbManager.put(STORES.propertyShares, newShare);
    return newShare;
  };

  const getBySlug = async (slug: string): Promise<PropertyShare | null> => {
    const all = await dbManager.getAll<PropertyShare>(STORES.propertyShares);
    return all.find(s => s.slug === slug) || null;
  };

  return { create, getBySlug };
}

// Hook para Administración de Condominios
```

- [ ] **Step 4: Verificar tipos y build**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `npm run build`
Expected: `✓ built in ...s`.

- [ ] **Step 5: Verificación manual — el store nuevo se crea**

Con el preview corriendo, abre las DevTools del navegador → Application → IndexedDB → `PropTechCRM` → confirma que existe el object store `propertyShares` con índice `slug` (unique) y `propertyId`. Si el navegador ya tenía la base de datos en una versión anterior, solo necesita recargar la página una vez para que `onupgradeneeded` corra (no requiere borrar datos existentes).

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/hooks/useDatabase.ts
git commit -m "feat: agregar store propertyShares y hook usePropertyShares (fichas personalizadas)"
```

---

## Task 4: Ficha pública — usar `resolveAgentDisplay` y resolver `propertyShares`

**Files:**
- Modify: `src/components/properties/PublicPropertyPage.tsx`

**Interfaces:**
- Consumes: `resolveAgentDisplay` y `AgentDisplayInfo` de `@/lib/agentDisplay` (Tarea 2); `usePropertyShares` y tipo `PropertyShare` de `@/hooks/useDatabase` / `@/types` (Tarea 3); `exportPropertyToPDF` con el nuevo parámetro `agentOverride` (se agrega en la Tarea 5 — este archivo ya queda preparado para pasarlo).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Imports**

En `src/components/properties/PublicPropertyPage.tsx`, busca:

```ts
import { useProperties, useLeads, useUsers } from '@/hooks/useDatabase';
import type { LeadSource, Property, User } from '@/types';
```

Cámbialo por:

```ts
import { useProperties, useLeads, useUsers, usePropertyShares } from '@/hooks/useDatabase';
import type { LeadSource, Property, User, PropertyShare } from '@/types';
import { resolveAgentDisplay } from '@/lib/agentDisplay';
```

- [ ] **Step 2: Cargar el share personalizado (si el slug corresponde a uno) antes de resolver la propiedad**

Busca:

```ts
  const { getBySlug, incrementViews } = useProperties();
  const { users } = useUsers();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (identifier) {
        const found = await getBySlug(identifier);
        if (found) {
          setProperty(found);
          incrementViews(found.id);
          const foundAgent = users.find(u => u.id === found.agentId);
          setAgent(foundAgent || null);
        } else {
          setProperty({
            ...DEFAULT_DEMO_PROPERTY,
            id: identifier,
            slug: identifier,
          });
        }
      } else {
        setProperty(DEFAULT_DEMO_PROPERTY);
      }
      setLoading(false);
    }
    loadData();
  }, [identifier, users]);
```

Cámbialo por:

```ts
  const { getBySlug, incrementViews } = useProperties();
  const { users } = useUsers();
  const { getBySlug: getShareBySlug } = usePropertyShares();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<User | null>(null);
  const [activeShare, setActiveShare] = useState<PropertyShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (identifier) {
        // Primero intenta resolver como un link de ficha personalizada
        // (ver docs/superpowers/specs/2026-08-01-ficha-asesor-personalizable-design.md).
        // Si no existe, sigue el comportamiento normal contra `properties`.
        const share = await getShareBySlug(identifier);
        const found = await getBySlug(share ? share.propertyId : identifier);
        if (found) {
          setProperty(found);
          incrementViews(found.id);
          const foundAgent = users.find(u => u.id === found.agentId);
          setAgent(foundAgent || null);
          setActiveShare(share);
        } else {
          setProperty({
            ...DEFAULT_DEMO_PROPERTY,
            id: identifier,
            slug: identifier,
          });
        }
      } else {
        setProperty(DEFAULT_DEMO_PROPERTY);
      }
      setLoading(false);
    }
    loadData();
  }, [identifier, users]);
```

- [ ] **Step 3: Reemplazar el fallback inventado por `resolveAgentDisplay`**

Busca:

```ts
  // Asesor por defecto (Mayra Fajer) si no se especifica agente en DB
  const agentName = agent ? `${agent.name} ${agent.lastName}` : 'Mayra Fajer';
  const agentRole = agent?.config?.bio || 'Asesor Inmobiliario de Grupo FELMAT';
  const agentPhone = agent?.phone || '442 124 9613';
  const agentEmail = agent?.email || 'diversainmobiliariosqueretaro@gmail.com';
  const agentAvatar = agent?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80';
```

Cámbialo por:

```ts
  const agentDisplay = resolveAgentDisplay(agent, activeShare ?? undefined);
  const { name: agentName, role: agentRole, phone: agentPhone, email: agentEmail, avatar: agentAvatar, isRealAgent } = agentDisplay;
```

- [ ] **Step 4: Pasar el override al descargar el PDF**

Busca:

```ts
  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      await exportPropertyToPDF({
        property,
        agent,
        showAgentData: true,
      });
    } catch (err) {
      console.error('Error al descargar PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };
```

Cámbialo por:

```ts
  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      await exportPropertyToPDF({
        property,
        agent,
        showAgentData: true,
        agentOverride: activeShare ?? undefined,
      });
    } catch (err) {
      console.error('Error al descargar PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };
```

(`exportPropertyToPDF` acepta `agentOverride` a partir de la Tarea 5; hasta que esa tarea se complete, `npx tsc --noEmit` marcará este archivo con un error de propiedad extra — es esperado y se resuelve en la Tarea 5. Si ejecutas las tareas en orden, la Tarea 5 va después de esta.)

- [ ] **Step 5: Avatar con iniciales cuando no hay foto real, y badge condicionado**

Busca:

```tsx
                  <div className="-mt-12 mb-4 flex items-end justify-between">
                    <img
                      src={agentAvatar}
                      alt={agentName}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                    />
                    <Badge className="bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1">
                      Asesor Certificado
                    </Badge>
                  </div>
```

Cámbialo por:

```tsx
                  <div className="-mt-12 mb-4 flex items-end justify-between">
                    {agentAvatar ? (
                      <img
                        src={agentAvatar}
                        alt={agentName}
                        className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-blue-800 border-4 border-white shadow-md flex items-center justify-center text-2xl font-bold text-white">
                        {agentName.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase()}
                      </div>
                    )}
                    {isRealAgent && (
                      <Badge className="bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1">
                        Asesor Certificado
                      </Badge>
                    )}
                  </div>
```

- [ ] **Step 6: Ocultar el teléfono cuando no hay uno real (email genérico siempre se muestra)**

Busca:

```tsx
                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{agentPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{agentEmail}</span>
                    </div>
                  </div>
```

Cámbialo por:

```tsx
                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                    {agentPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{agentPhone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{agentEmail}</span>
                    </div>
                  </div>
```

- [ ] **Step 7: Verificar tipos y build**

(Completa esto después de la Tarea 5, ya que este archivo depende del nuevo parámetro `agentOverride` de `exportPropertyToPDF`.)

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `npm run build`
Expected: `✓ built in ...s`.

- [ ] **Step 8: Verificación manual**

Con el preview corriendo:
1. Abre una ficha pública de una propiedad cuyo `agentId` NO exista en `users` (o crea una propiedad de prueba con un `agentId` inventado directamente en las DevTools → IndexedDB). Confirma: el nombre mostrado es "Grupo FELMAT" (no "Mayra Fajer"), no aparece teléfono, el correo es `contacto@felmat.com.mx`, no aparece el badge "Asesor Certificado", y el avatar muestra iniciales "GF" en vez de una foto de stock.
2. Abre una ficha de una propiedad con `agentId` real y perfil completo (`/perfil` con teléfono, WhatsApp, certificado, bio llenos). Confirma que la ficha muestra esos datos reales.

- [ ] **Step 9: Commit**

```bash
git add src/components/properties/PublicPropertyPage.tsx
git commit -m "feat: ficha publica usa resolveAgentDisplay y resuelve propertyShares antes que la propiedad"
```

---

## Task 5: `pdfExport.ts` — generalizar el origen de datos del asesor

**Files:**
- Modify: `src/lib/pdfExport.ts`

**Interfaces:**
- Consumes: `resolveAgentDisplay`, `AgentSource`, `AgentOverride` de `@/lib/agentDisplay` (Tarea 2).
- Produces: `exportPropertyToPDF(options: { property: Property; agent: AgentSource | null; showAgentData: boolean; agentOverride?: AgentOverride }): Promise<void>` — firma consumida por `PublicPropertyPage.tsx` (Tarea 4, ya actualizado) y `PropertyDetail.tsx` (Tarea 8).

- [ ] **Step 1: Actualizar imports y la firma de `PDFExportOptions`**

En `src/lib/pdfExport.ts`, busca:

```ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import type { Property, User } from '@/types';

interface PDFExportOptions {
  property: Property;
  agent: User | null;
  showAgentData: boolean;
}

export async function exportPropertyToPDF({ property, agent, showAgentData }: PDFExportOptions): Promise<void> {
  const agentName = (showAgentData && agent) ? `${agent.name} ${agent.lastName}` : 'Mayra Fajer';
  const agentRole = (showAgentData && agent?.config?.bio) 
    ? agent.config.bio 
    : 'Asesor inmobiliario de Grupo Felmat Servicios Inmobiliarios';
  const agentEmail = (showAgentData && agent?.email) ? agent.email : 'diversainmobiliariosqueretaro@gmail.com';
  const agentPhone = (showAgentData && agent?.phone) ? agent.phone : '442 124 9613';
  const agentAvatar = (showAgentData && agent?.avatar) ? agent.avatar : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80';
```

Cámbialo por:

```ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import type { Property } from '@/types';
import { resolveAgentDisplay, type AgentSource, type AgentOverride } from '@/lib/agentDisplay';

interface PDFExportOptions {
  property: Property;
  agent: AgentSource | null;
  showAgentData: boolean;
  agentOverride?: AgentOverride;
}

export async function exportPropertyToPDF({ property, agent, showAgentData, agentOverride }: PDFExportOptions): Promise<void> {
  const contact = resolveAgentDisplay(showAgentData ? agent : null, agentOverride);
  const agentName = contact.name;
  const agentRole = contact.role;
  const agentEmail = contact.email || '';
  const agentPhone = contact.phone || '';
  const agentAvatarHtml = contact.avatar
    ? `<img src="${contact.avatar}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #2563eb;" />`
    : `<div style="width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #1e40af, #3b82f6); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 14px; font-weight: bold; border: 2px solid #2563eb;">${agentName.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase()}</div>`;
```

- [ ] **Step 2: Usar `agentAvatarHtml` en el encabezado en vez de la foto de stock**

Busca (dentro de `renderHeader`):

```ts
          <img src="${agentAvatar}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #2563eb;" />
```

Cámbialo por:

```ts
          ${agentAvatarHtml}
```

- [ ] **Step 3: Verificar tipos y build**

Run: `npx tsc --noEmit`
Expected: sin errores (esto también resuelve el error pendiente de la Tarea 4, Step 7, sobre `agentOverride`).

Run: `npm run build`
Expected: `✓ built in ...s`.

- [ ] **Step 4: Verificación manual**

Descarga el PDF de una propiedad sin asesor real vinculado: confirma que el encabezado de cada página muestra un círculo con iniciales "GF" en vez de la foto de stock de Unsplash, y el nombre/correo son los genéricos de agencia (no "Mayra Fajer").

- [ ] **Step 5: Commit**

```bash
git add src/lib/pdfExport.ts
git commit -m "feat: pdfExport usa resolveAgentDisplay, sin foto de stock ni datos de asesor inventados"
```

---

## Task 6: `PropertyForm.tsx` — asignar/corregir asesor + arreglar bug de reasignación silenciosa

**Files:**
- Modify: `src/components/properties/PropertyForm.tsx`

**Interfaces:**
- Consumes: `useUsers` de `@/hooks/useDatabase` (ya existente).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Import y datos de asesores asignables**

Busca:

```ts
import { useProperties, notify } from '@/hooks/useDatabase';
```

Cámbialo por:

```ts
import { useProperties, useUsers, notify } from '@/hooks/useDatabase';
```

Busca:

```ts
  const { user, canViewAllProperties } = useAuth();
  const { properties, create, update } = useProperties(canViewAllProperties ? undefined : user?.id);
```

Cámbialo por:

```ts
  const { user, canViewAllProperties } = useAuth();
  const { properties, create, update } = useProperties(canViewAllProperties ? undefined : user?.id);
  const { users } = useUsers();
  const assignableAgents = users.filter(u => u.isActive && (u.role === 'agent' || u.role === 'admin'));
```

- [ ] **Step 2: Arreglar el bug — hoy `handleSubmit` reasigna la propiedad al usuario que la edita, siempre**

Busca en `handleSubmit`:

```ts
      const propertyData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title || ''),
        agentId: user.id,
      } as Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'leadsCount' | 'favoritesCount'>;
```

Cámbialo por:

```ts
      // Antes esto forzaba agentId: user.id siempre -- tanto al crear como
      // al EDITAR -- asi que un admin que corregia cualquier campo de una
      // propiedad de otro asesor terminaba reasignandola a si mismo sin
      // darse cuenta, y el selector "Asesor asignado" nuevo no serviria de
      // nada porque su valor se descartaria al guardar. Ahora se respeta
      // formData.agentId (precargado del asesor real al editar, o elegido
      // explicitamente con el selector nuevo al crear/editar); solo cae a
      // user.id cuando no hay ningun agentId todavia (una propiedad nueva
      // donde nadie toco el selector).
      const propertyData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title || ''),
        agentId: formData.agentId || user.id,
      } as Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'leadsCount' | 'favoritesCount'>;
```

- [ ] **Step 3: Agregar el selector "Asesor asignado" en la pestaña General**

Busca (justo después del bloque de "Estado \*"):

```tsx
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado *</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => handleChange('status', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyStatuses.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Descripción</Label>
```

Cámbialo por:

```tsx
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado *</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => handleChange('status', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyStatuses.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agentId">Asesor asignado *</Label>
                    {canViewAllProperties ? (
                      <Select
                        value={formData.agentId || user?.id}
                        onValueChange={(v) => handleChange('agentId', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableAgents.map(agent => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name} {agent.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="px-3 py-2 rounded-md border bg-muted/50 text-sm">
                        {user?.name} {user?.lastName}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Descripción</Label>
```

- [ ] **Step 4: Verificar tipos y build**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `npm run build`
Expected: `✓ built in ...s`.

- [ ] **Step 5: Verificación manual**

1. Inicia sesión como admin (`admin@felmat.com` / `123456`), abre "Editar" en una propiedad que hoy no tiene un asesor real vinculado, selecciona el asesor correcto en el nuevo campo "Asesor asignado", guarda. Confirma en la ficha pública de esa propiedad que ya no aparece el contacto genérico, sino el asesor real.
2. Inicia sesión como agente normal (`agente@felmat.com` / `123456`), abre "Editar" en una propiedad propia, confirma que el campo "Asesor asignado" se muestra de solo lectura con su propio nombre.
3. Como admin, edita cualquier OTRO campo (ej. el precio) de una propiedad de otro asesor sin tocar "Asesor asignado", guarda, y confirma que el asesor asignado NO cambió (antes del fix, se reasignaba al admin).

- [ ] **Step 6: Commit**

```bash
git add src/components/properties/PropertyForm.tsx
git commit -m "fix: permitir asignar/corregir el asesor de una propiedad y evitar reasignacion silenciosa al editar"
```

---

## Task 7: Aviso de "asesor no vinculado" dentro del CRM

**Files:**
- Modify: `src/components/properties/PropertyDetail.tsx`

**Interfaces:**
- Consumes: `useUsers` de `@/hooks/useDatabase` (ya existente).
- Produces: nada consumido por otras tareas.

- [ ] **Step 1: Imports**

Busca:

```ts
import { useProperties, useLeads } from '@/hooks/useDatabase';
```

Cámbialo por:

```ts
import { useProperties, useLeads, useUsers } from '@/hooks/useDatabase';
```

Busca, dentro del import de iconos de `lucide-react` (es una lista larga), la línea:

```ts
  RefreshCw,
} from 'lucide-react';
```

Cámbialo por:

```ts
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
```

- [ ] **Step 2: Cargar usuarios y calcular si el asesor está vinculado**

Busca, dentro de `export function PropertyDetail()`:

```ts
  const { user, canViewAllProperties } = useAuth();
  const { properties, remove } = useProperties(canViewAllProperties ? undefined : user?.id);
```

Cámbialo por:

```ts
  const { user, canViewAllProperties } = useAuth();
  const { properties, remove } = useProperties(canViewAllProperties ? undefined : user?.id);
  const { users } = useUsers();
```

- [ ] **Step 3: Agregar el banner, después del `if (!property)` de "no encontrada" y antes del header**

Busca:

```tsx
  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'venta': 'Venta',
      'renta': 'Renta',
      'venta_renta': 'Venta/Renta',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
```

Cámbialo por:

```tsx
  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'venta': 'Venta',
      'renta': 'Renta',
      'venta_renta': 'Venta/Renta',
    };
    return labels[type] || type;
  };

  const agentLinked = users.some(u => u.id === property.agentId);

  return (
    <div className="space-y-6">
      {!agentLinked && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Esta propiedad no tiene un asesor válido asignado. La ficha pública mostrará un contacto genérico de la agencia hasta que la corrijas en "Editar".
        </div>
      )}

      {/* Header */}
```

- [ ] **Step 4: Verificar tipos y build**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `npm run build`
Expected: `✓ built in ...s`.

- [ ] **Step 5: Verificación manual**

Abre en el CRM una propiedad con `agentId` que no resuelva a ningún usuario real y confirma que aparece el banner ámbar arriba del header. Abre una propiedad con asesor real vinculado y confirma que el banner NO aparece.

- [ ] **Step 6: Commit**

```bash
git add src/components/properties/PropertyDetail.tsx
git commit -m "feat: mostrar aviso en el CRM cuando una propiedad no tiene asesor valido vinculado"
```

---

## Task 8: "Personalizar contacto para este envío" en el diálogo de Compartir

**Files:**
- Modify: `src/components/properties/PropertyDetail.tsx`

**Interfaces:**
- Consumes: `resolveAgentDisplay` (Tarea 2); `usePropertyShares`, tipo `PropertyShare` (Tarea 3); `exportPropertyToPDF` con `agentOverride` (Tarea 5).
- Produces: nada consumido por otras tareas — es la última.

**Nota de alcance:** el botón "Imprimir" del `ShareDialog` (`handlePrint`, que abre una ventana nueva con `window.print()`) es un camino legado, separado del PDF con jsPDF que ya usa el override. No se toca en este plan -- el spec solo pide que "el PDF y el mensaje de WhatsApp" reflejen los datos personalizados. Si a futuro se necesita que "Imprimir" también los use, es un cambio aparte y pequeño (mismo patrón de `resolveAgentDisplay`, aplicado al HTML de esa función).

- [ ] **Step 1: Imports**

Busca (ya modificado en la Tarea 7):

```ts
import { useProperties, useLeads, useUsers } from '@/hooks/useDatabase';
```

Cámbialo por:

```ts
import { useProperties, useLeads, useUsers, usePropertyShares } from '@/hooks/useDatabase';
```

Busca:

```ts
import type { Property, LeadSource } from '@/types';
```

Cámbialo por:

```ts
import type { Property, LeadSource, PropertyShare } from '@/types';
```

Busca la línea de import de `resolveAgentDisplay`... si no existe aún en este archivo, agrégala junto al import de `exportPropertyToPDF`:

```ts
import { exportPropertyToPDF } from '@/lib/pdfExport';
```

Cámbialo por:

```ts
import { exportPropertyToPDF } from '@/lib/pdfExport';
import { resolveAgentDisplay } from '@/lib/agentDisplay';
```

En el import de iconos de `lucide-react`, busca:

```ts
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
```

Cámbialo por:

```ts
  RefreshCw,
  AlertTriangle,
  UserCog,
} from 'lucide-react';
```

- [ ] **Step 2: Estado nuevo en `ShareDialog` y hook de shares**

Dentro de la función `ShareDialog`, busca:

```ts
  const { user } = useAuth();
  const { create: createLead } = useLeads(user?.id);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'pdf' | 'link'>('whatsapp');
```

Cámbialo por:

```ts
  const { user } = useAuth();
  const { create: createLead } = useLeads(user?.id);
  const { create: createShare } = usePropertyShares();
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'pdf' | 'link' | 'personalizar'>('whatsapp');

  // Ficha personalizada para este envio (ver Tarea 8 del plan / spec de fichas
  // personalizables). Si esta activa, el link/WhatsApp/PDF de este dialogo
  // usan estos datos en vez de los del asesor que esta compartiendo.
  const [activeShare, setActiveShare] = useState<PropertyShare | null>(null);
  const [creatingShare, setCreatingShare] = useState(false);
  const [overrideName, setOverrideName] = useState('');
  const [overridePhone, setOverridePhone] = useState('');
  const [overrideWhatsapp, setOverrideWhatsapp] = useState('');
  const [overrideEmail, setOverrideEmail] = useState('');
  const [overrideCertificate, setOverrideCertificate] = useState('');
  const [overrideBio, setOverrideBio] = useState('');
  const [overrideAvatar, setOverrideAvatar] = useState('');
```

- [ ] **Step 3: `effectiveShareUrl` y el handler para crear el share**

Busca:

```ts
  if (!property) return null;

  const shareUrl = `${window.location.origin}/p/${property.slug || property.id}`;
```

Cámbialo por:

```ts
  if (!property) return null;

  const shareUrl = `${window.location.origin}/p/${property.slug || property.id}`;
  const effectiveShareUrl = activeShare ? `${window.location.origin}/p/${activeShare.slug}` : shareUrl;

  const handleCreatePersonalizedShare = async () => {
    if (!user) return;
    setCreatingShare(true);
    try {
      const share = await createShare({
        propertyId: property.id,
        createdBy: user.id,
        overrideName: overrideName || undefined,
        overridePhone: overridePhone || undefined,
        overrideWhatsapp: overrideWhatsapp || undefined,
        overrideEmail: overrideEmail || undefined,
        overrideCertificate: overrideCertificate || undefined,
        overrideBio: overrideBio || undefined,
        overrideAvatar: overrideAvatar || undefined,
      });
      setActiveShare(share);
    } finally {
      setCreatingShare(false);
    }
  };

  const handleOverrideAvatarUpload = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setOverrideAvatar(e.target?.result as string);
    reader.readAsDataURL(file);
  };
```

- [ ] **Step 4: `generateWhatsAppMessage` usa `resolveAgentDisplay` y `effectiveShareUrl`**

Busca:

```ts
  // Mensaje profesional para WhatsApp
  // Nota: sin emoji de plano suplementario (🏠📍💰...) -- wa.me/api.whatsapp.com
  // los corrompe en su redirección (confirmado: llegan bien codificados hasta
  // encodeURIComponent, se rompen del lado de WhatsApp). Solo texto + *negritas*.
  const generateWhatsAppMessage = () => {
    let message = `*${property.title}*\n\n`;
    message += `*Precio:* $${property.price.toLocaleString('es-MX')} ${property.priceCurrency}\n`;
    message += `*Ubicación:* ${property.location.city}, ${property.location.neighborhood}\n`;
    message += `*Recámaras:* ${property.features.bedrooms} | *Baños:* ${property.features.bathrooms}\n`;
    message += `*Estacionamientos:* ${property.features.parkingSpaces}\n\n`;
    message += `Ver ficha completa aquí:\n${shareUrl}\n\n`;

    if (showAgentData && user) {
      message += `---\n*Contacto:*\n`;
      if (showName) message += `${user.name} ${user.lastName}\n`;
      if (showCertificate && user.config?.certificateNumber) {
        message += `Certificado: ${user.config.certificateNumber}\n`;
      }
      if (showWhatsApp && user.config?.whatsappNumber) {
        message += `WhatsApp: ${user.config.whatsappNumber}\n`;
      }
      if (showPhone) message += `Tel: ${user.phone}\n`;
      if (showEmail) message += `${user.email}\n`;
    }

    message += `\n¿Te interesa? ¡Contáctame!`;
    return message;
  };
```

Cámbialo por:

```ts
  // Mensaje profesional para WhatsApp
  // Nota: sin emoji de plano suplementario (🏠📍💰...) -- wa.me/api.whatsapp.com
  // los corrompe en su redirección (confirmado: llegan bien codificados hasta
  // encodeURIComponent, se rompen del lado de WhatsApp). Solo texto + *negritas*.
  const generateWhatsAppMessage = () => {
    const contact = resolveAgentDisplay(user ?? null, activeShare ?? undefined);
    let message = `*${property.title}*\n\n`;
    message += `*Precio:* $${property.price.toLocaleString('es-MX')} ${property.priceCurrency}\n`;
    message += `*Ubicación:* ${property.location.city}, ${property.location.neighborhood}\n`;
    message += `*Recámaras:* ${property.features.bedrooms} | *Baños:* ${property.features.bathrooms}\n`;
    message += `*Estacionamientos:* ${property.features.parkingSpaces}\n\n`;
    message += `Ver ficha completa aquí:\n${effectiveShareUrl}\n\n`;

    if (showAgentData) {
      message += `---\n*Contacto:*\n`;
      if (showName) message += `${contact.name}\n`;
      if (showCertificate && contact.certificateNumber) {
        message += `Certificado: ${contact.certificateNumber}\n`;
      }
      if (showWhatsApp && contact.whatsapp) {
        message += `WhatsApp: ${contact.whatsapp}\n`;
      }
      if (showPhone && contact.phone) message += `Tel: ${contact.phone}\n`;
      if (showEmail && contact.email) message += `${contact.email}\n`;
    }

    message += `\n¿Te interesa? ¡Contáctame!`;
    return message;
  };
```

- [ ] **Step 5: `copyLink` y el tab "Enlace" usan `effectiveShareUrl`**

Busca:

```ts
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
```

Cámbialo por:

```ts
  const copyLink = () => {
    navigator.clipboard.writeText(effectiveShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
```

Busca, en la pestaña `link` del JSX:

```tsx
            <div className="flex gap-2">
              <Input 
                value={shareUrl} 
                readOnly 
                className="flex-1"
              />
              <Button variant="outline" onClick={copyLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            <Button variant="outline" className="w-full" asChild>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver ficha pública
              </a>
            </Button>
```

Cámbialo por:

```tsx
            <div className="flex gap-2">
              <Input 
                value={effectiveShareUrl} 
                readOnly 
                className="flex-1"
              />
              <Button variant="outline" onClick={copyLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            
            <Button variant="outline" className="w-full" asChild>
              <a href={effectiveShareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver ficha pública
              </a>
            </Button>
```

- [ ] **Step 6: `handleExportPDF` pasa el override**

Busca:

```ts
  const handleExportPDF = async () => {
    if (!property || !user) return;
    setExportingPDF(true);
    try {
      await exportPropertyToPDF({ 
        property, 
        agent: showAgentData ? user : null,
        showAgentData 
      });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setExportingPDF(false);
    }
  };
```

Cámbialo por:

```ts
  const handleExportPDF = async () => {
    if (!property || !user) return;
    setExportingPDF(true);
    try {
      await exportPropertyToPDF({ 
        property, 
        agent: showAgentData ? user : null,
        showAgentData,
        agentOverride: activeShare ?? undefined,
      });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setExportingPDF(false);
    }
  };
```

- [ ] **Step 7: Agregar la 4ta pestaña "Personalizar" en la barra de tabs**

Busca:

```tsx
          <button
            onClick={() => setActiveTab('link')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === 'link' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Copy className="w-4 h-4" />
            Enlace
          </button>
        </div>
```

Cámbialo por:

```tsx
          <button
            onClick={() => setActiveTab('link')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === 'link' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Copy className="w-4 h-4" />
            Enlace
          </button>
          <button
            onClick={() => setActiveTab('personalizar')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === 'personalizar' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserCog className="w-4 h-4" />
            Personalizar
          </button>
        </div>
```

- [ ] **Step 8: Contenido de la pestaña "Personalizar"**

Busca el final del bloque `{activeTab === 'link' && ( ... )}` (justo antes del cierre `</DialogContent>`):

```tsx
            <Button variant="outline" className="w-full" asChild>
              <a href={effectiveShareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver ficha pública
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

Cámbialo por:

```tsx
            <Button variant="outline" className="w-full" asChild>
              <a href={effectiveShareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver ficha pública
              </a>
            </Button>
          </div>
        )}

        {activeTab === 'personalizar' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Personalizar contacto para este envío</strong><br />
                Genera un link aparte de esta ficha mostrando otros datos de contacto
                -- por ejemplo, de un colega o un referido externo que ni siquiera
                necesita tener cuenta en el CRM. Lo que dejes en blanco usa tus
                propios datos reales. La ficha original no se modifica.
              </p>
            </div>

            {!activeShare ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                    {overrideAvatar ? (
                      <img src={overrideAvatar} alt="Foto personalizada" className="w-full h-full object-cover" />
                    ) : (
                      <UserCog className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="override-avatar-upload" className="text-xs text-muted-foreground cursor-pointer underline underline-offset-2">
                      {overrideAvatar ? 'Cambiar foto (opcional)' : 'Subir foto (opcional)'}
                    </Label>
                    <input
                      id="override-avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleOverrideAvatarUpload(e.target.files)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Nombre (opcional)" value={overrideName} onChange={(e) => setOverrideName(e.target.value)} />
                  <Input placeholder="Teléfono (opcional)" value={overridePhone} onChange={(e) => setOverridePhone(e.target.value)} />
                  <Input placeholder="WhatsApp (opcional)" value={overrideWhatsapp} onChange={(e) => setOverrideWhatsapp(e.target.value)} />
                  <Input placeholder="Correo (opcional)" value={overrideEmail} onChange={(e) => setOverrideEmail(e.target.value)} />
                  <Input placeholder="Certificado (opcional)" value={overrideCertificate} onChange={(e) => setOverrideCertificate(e.target.value)} />
                  <Input placeholder="Rol / descripción corta (opcional)" value={overrideBio} onChange={(e) => setOverrideBio(e.target.value)} />
                </div>
                <Button onClick={handleCreatePersonalizedShare} className="w-full" disabled={creatingShare}>
                  <UserCog className="w-4 h-4 mr-2" />
                  {creatingShare ? 'Generando...' : 'Generar link personalizado'}
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                  Link personalizado generado. Las pestañas de WhatsApp, PDF y Enlace de arriba ya están usando estos datos.
                </div>
                <div className="flex gap-2">
                  <Input value={effectiveShareUrl} readOnly className="flex-1" />
                  <Button variant="outline" onClick={copyLink}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setActiveShare(null)}>
                  Quitar personalización y volver a mis datos reales
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 9: Verificar tipos y build**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `npm run build`
Expected: `✓ built in ...s`.

- [ ] **Step 10: Verificación manual**

1. Abre "Compartir" en una propiedad propia, ve a la pestaña "Personalizar", llena solo "Nombre" y "Teléfono" (deja el resto en blanco), genera el link.
2. Cambia a la pestaña "Enlace": confirma que el link ya es el personalizado (`/p/c-xxxxxxxx`).
3. Cambia a la pestaña "WhatsApp": confirma que la vista previa del mensaje usa el nombre/teléfono que llenaste, y el link es el personalizado.
4. Abre ese link personalizado en una pestaña nueva (`/p/c-xxxxxxxx`): confirma que la ficha muestra el nombre/teléfono personalizados, pero el correo (que dejaste en blanco) es el tuyo real -- no el genérico de agencia (porque tu perfil sí tiene un asesor real detrás).
5. Descarga el PDF desde ese link personalizado: confirma que el encabezado usa los datos personalizados.
6. Abre la ficha ORIGINAL (`/p/<slug-de-la-propiedad>`, no la personalizada): confirma que sigue mostrando tus datos reales, sin ningún rastro de la personalización.

- [ ] **Step 11: Commit**

```bash
git add src/components/properties/PropertyDetail.tsx
git commit -m "feat: agregar personalizacion de contacto para envios de ficha (fichas personalizables)"
```

---

## Verificación final del plan completo

- [ ] Repasar cada sección del spec (`docs/superpowers/specs/2026-08-01-ficha-asesor-personalizable-design.md`) y confirmar que hay una tarea que la cubre:
  - A (mapa en PDF) → Tarea 1.
  - B.1 (fallback honesto) → Tareas 2, 4, 5.
  - B.2 (asignar/corregir asesor) → Tarea 6.
  - B.3 (aviso de vínculo roto) → Tarea 7.
  - C.1–C.6 (fichas personalizables) → Tareas 3, 4, 5, 8.
- [ ] `npm run build` y `npx tsc --noEmit` limpios con todos los cambios juntos.
- [ ] `npx vitest run` pasa (4 pruebas de `agentDisplay.test.ts`).
- [ ] Deploy a producción vía `git push origin main` (dispara el deploy automático de Vercel, igual que en los fixes anteriores de esta sesión) solo cuando el usuario lo confirme.
