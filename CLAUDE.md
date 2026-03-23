# CLAUDE.md — CRM Felmat

CRM inmobiliario para la empresa **Felmat**. Gestión de propiedades, leads, anuncios, publicación en redes sociales y módulos de operación (Airbnb, legal, cotizaciones).

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework UI | React 18 + TypeScript |
| Build tool | Vite 5 |
| Estilos | Tailwind CSS v3 + shadcn/ui (Radix UI) |
| Routing | React Router DOM v6 |
| Formularios | React Hook Form + Zod |
| Gráficas | Recharts |
| Calendario | React Big Calendar |
| PDF | jsPDF |
| QR | qrcode |
| Notificaciones | Sonner (toasts) — usar `toast` de `sonner`, NO `useToast` |
| Base de datos | PostgreSQL vía Prisma ORM |
| Base de datos local | IndexedDB vía `useDatabase.ts` (para propiedades, leads, actividades) |
| Deploy | Vercel (SPA con rewrites + Serverless Functions en `/api/`) |
| Automatización | n8n (integrado — ver sección n8n) |
| Node | 20 |

---

## Estructura del proyecto

```
crm_felmat/
├── src/
│   ├── App.tsx               # Raíz: BrowserRouter + AuthProvider + rutas (todas lazy)
│   ├── main.tsx              # Entry point
│   ├── pages/                # Páginas principales (lazy loaded)
│   │   ├── Dashboard.tsx
│   │   ├── Properties.tsx
│   │   ├── Leads.tsx / LeadDetails.tsx
│   │   ├── Calendar.tsx
│   │   ├── Website.tsx
│   │   ├── Activities.tsx
│   │   ├── Notifications.tsx
│   │   ├── Settings.tsx      # Tabs: Webhooks n8n + Redes Sociales
│   │   ├── Profile.tsx
│   │   ├── Users.tsx
│   │   └── Login.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx   # Navegación lateral — hrefs sincronizados con App.tsx
│   │   │   └── Header.tsx
│   │   ├── anuncios/         # Módulo completo de anuncios y publicación social
│   │   │   ├── Anuncios.tsx          # Página: detecta modo (admin/airbnb) y renderiza ListaAnuncios
│   │   │   ├── ListaAnuncios.tsx     # Componente real con CRUD, filtros, grid/list view
│   │   │   ├── AnuncioGenerator.tsx  # Generador de copy con IA (mock)
│   │   │   ├── SocialPublisher.tsx   # UI para seleccionar plataformas y publicar
│   │   │   ├── SocialConfig.tsx      # Configuración de APIs sociales + URL de n8n
│   │   │   ├── PublicationHistory.tsx
│   │   │   └── index.ts
│   │   ├── settings/
│   │   │   ├── WebhookConfig.tsx     # UI completa para gestionar webhooks n8n por evento
│   │   │   └── UserManagement.tsx
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   └── ui/               # shadcn/ui components (40+)
│   ├── contexts/
│   │   └── AuthContext.tsx   # Auth con localStorage (mock — sin backend real aún)
│   ├── hooks/
│   │   ├── useAuth.tsx
│   │   ├── useDatabase.ts    # IndexedDB: useLeads, useProperties, useActivities, etc.
│   │   ├── useSocialPublish.ts  # Toda publicación social va por n8n
│   │   ├── useN8nEvents.ts   # Dispara eventos CRM hacia n8n (leads, propiedades)
│   │   └── use-mobile.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── api.ts            # useWebhooks hook + tipos WebhookEvent + sendWebhook multi-URL
│   │   ├── pdfExport.ts
│   │   ├── social-apis/
│   │   │   ├── webhook.ts    # sendWebhook(payload) + testWebhook(url) — URL desde localStorage o env
│   │   │   ├── facebook.ts   # Stub — publicación real delegada a n8n
│   │   │   ├── instagram.ts  # Stub — publicación real delegada a n8n
│   │   │   └── google-business.ts  # Stub — publicación real delegada a n8n
│   │   └── valuacion/
│   └── types/
├── api/                      # Vercel Serverless Functions (Node.js + Prisma)
│   ├── anuncios.js           # GET lista / POST crear
│   ├── publicar.js           # POST publicar anuncio en canales
│   └── anuncios/
│       ├── [id].js           # GET / PUT / DELETE por id
│       └── [id]/duplicar.js  # POST duplicar anuncio
├── prisma/
│   └── schema.prisma         # Modelos: User, Anuncio, ImagenAnuncio, PublicacionCanal
├── public/
├── dist/                     # Build output (Vite)
├── vercel.json               # Build config + rewrites SPA + headers CORS/caché/seguridad
├── next.config.js            # NEUTRALIZADO — solo comentario, no exporta nada
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json / tsconfig.app.json / tsconfig.node.json
```

---

## Rutas registradas (App.tsx)

| Ruta | Componente | Estado |
|------|-----------|--------|
| `/dashboard` | Dashboard | Activo |
| `/propiedades` | Properties | Activo |
| `/propiedades/desempeno` | ModulePlaceholder | Placeholder |
| `/estimaciones` | ModulePlaceholder | Placeholder |
| `/vinculaciones` | ModulePlaceholder | Placeholder |
| `/listas-compartidas` | ModulePlaceholder | Placeholder |
| `/leads` | Leads | Activo |
| `/leads/:id` | LeadDetails | Activo |
| `/calendario` | Calendar | Activo |
| `/sitio-web` | Website | Activo |
| `/actividades` | Activities | Activo |
| `/notificaciones` | Notifications | Activo |
| `/configuracion` | Settings (Webhooks + Social) | Activo |
| `/perfil` | Profile | Activo |
| `/admin/usuarios` | Users | Activo |
| `/admin/condominios` | ModulePlaceholder | Placeholder |
| `/anuncios` | Anuncios (modo admin) | Activo |
| `/anuncios/nuevo` | ModulePlaceholder | Placeholder |
| `/anuncios/:id` | ModulePlaceholder | Placeholder |
| `/anuncios/:id/editar` | ModulePlaceholder | Placeholder |
| `/airbnb/anuncios` | Anuncios (modo airbnb) | Activo |
| `/airbnb/anuncios/nuevo` | ModulePlaceholder | Placeholder |
| `/airbnb/anuncios/:id` | ModulePlaceholder | Placeholder |
| `/airbnb/anuncios/:id/editar` | ModulePlaceholder | Placeholder |
| `/airbnb/calendario` | ModulePlaceholder | Placeholder |
| `/airbnb/precios` | ModulePlaceholder | Placeholder |
| `/airbnb/mensajes` | ModulePlaceholder | Placeholder |
| `/airbnb/reservas` | ModulePlaceholder | Placeholder |
| `/carta-presentacion` | ModulePlaceholder | Placeholder |
| `/cotizaciones` | ModulePlaceholder | Placeholder |
| `/legal/contratos` | ModulePlaceholder | Placeholder |
| `/legal/fianzas` | ModulePlaceholder | Placeholder |
| `/reportes/ventas` | ModulePlaceholder | Placeholder |
| `/reportes/leads` | ModulePlaceholder | Placeholder |

---

## Sidebar — grupos de navegación

Todos los `href` del Sidebar están sincronizados con las rutas de App.tsx.

| Grupo | Ítems |
|-------|-------|
| Dashboard | `/dashboard` |
| Propiedades | `/propiedades`, `/estimaciones`, `/vinculaciones`, `/listas-compartidas`, `/propiedades/desempeno` |
| Admin. Condominios | `/carta-presentacion`, `/cotizaciones`, `/anuncios`, `/legal/contratos` |
| AIRBNB | `/airbnb/anuncios`, `/airbnb/calendario`, `/airbnb/precios`, `/airbnb/mensajes`, `/airbnb/reservas` |
| Reportes | `/reportes/ventas`, `/reportes/leads` |
| Main nav | `/leads`, `/calendario`, `/sitio-web` |
| Admin | `/admin/usuarios`, `/admin/condominios` |
| Secondary | `/notificaciones`, `/configuracion` |

---

## Modelos de base de datos (Prisma / PostgreSQL)

Usados por las Serverless Functions en `/api/`.

- **User** — id, email, name, role (USER/admin), timestamps
- **Anuncio** — propiedad inmobiliaria: título, slug, descripción, colonia, ciudad, estado (`BORRADOR`/`REVISION`/`PUBLICADO`/`PAUSADO`/`EXPIRADO`/`ARCHIVADO`), precio, moneda, recámaras, baños, destacado, fechas, SEO meta, métricas (vistas, contactos)
- **ImagenAnuncio** — imágenes de un anuncio con orden y flag de principal
- **PublicacionCanal** — historial de publicación por canal (`WEB`/`FACEBOOK`/`INSTAGRAM`/`GOOGLE_BUSINESS`); estado (`PENDIENTE`/`PUBLICADO`/`ERROR`), externalId, externalUrl, errorMsg

Variable de entorno requerida en Vercel: `POSTGRES_URL`

---

## Base de datos local (IndexedDB)

`useDatabase.ts` gestiona datos locales con IndexedDB (DB: `PropTechCRM`):

- `useLeads` — CRUD de leads + notas + cambio de etapa
- `useProperties` — CRUD de propiedades + vistas + búsqueda por slug
- `useActivities` — CRUD de actividades + completar
- `useNotifications` — notificaciones + marcar leídas
- `useDashboardStats` — estadísticas calculadas
- `useAgentWebsite` — configuración del sitio web del agente

---

## Autenticación

- `AuthContext` + `localStorage` (mock — cualquier email/password entra como admin)
- Roles: `admin` / `USER`
- `ProtectedRoute` envuelve todas las rutas privadas
- **Pendiente:** conectar login real contra PostgreSQL o proveedor de auth (Stytch, Clerk, etc.)

---

## Integración n8n

### Arquitectura

Hay **dos canales** distintos de comunicación con n8n:

**Canal 1 — Publicación social** (`src/lib/social-apis/webhook.ts`)
- URL única guardada en `localStorage('n8n_webhook_url')` o `VITE_N8N_WEBHOOK_URL`
- `useSocialPublish` envía TODA la publicación por aquí — inmediata y programada
- Payload: `{ type: 'publish_now' | 'schedule_post', data: { platforms, content, images, propertyId, scheduledFor } }`
- n8n recibe y enruta por plataforma

**Canal 2 — Eventos del CRM** (`src/lib/api.ts` → `useWebhooks`)
- Múltiples URLs registradas desde `/configuracion` → tab Webhooks
- Cada URL se suscribe a eventos específicos
- `useN8nEvents` es el hook para disparar eventos desde páginas

### Configuración en el CRM

**`/configuracion` → "Redes Sociales" → tab Webhook:**
- Guarda la URL de publicación social en `localStorage('n8n_webhook_url')`
- Botón "Probar Conexión" hace POST real al webhook

**`/configuracion` → "Webhooks n8n":**
- Registra webhooks por evento (URL + lista de eventos suscritos + secret opcional)
- Eventos disponibles: `property.created`, `property.updated`, `property.published`, `property.shared`, `lead.created`, `lead.updated`, `lead.status_changed`, `lead.assigned`
- Incluye botón para copiar JSON de flujo de ejemplo para importar en n8n

### Hook `useN8nEvents`

```ts
import { useN8nEvents } from '@/hooks/useN8nEvents';

const n8n = useN8nEvents();

// Después de crear un lead:
await n8n.onLeadCreated(lead, user.id);

// Después de publicar una propiedad:
await n8n.onPropertyPublished(property, user.id);
```

Disponibles: `onLeadCreated`, `onLeadUpdated`, `onLeadStatusChanged`, `onLeadAssigned`, `onPropertyCreated`, `onPropertyUpdated`, `onPropertyPublished`, `onPropertyShared`.

Los fallos de webhook son silenciosos (no bloquean la operación del CRM).

### Flujo esperado en n8n

```
Webhook (POST /webhook/felmat)
  → Switch por body.type o body.event
    → publish_now    → nodos Facebook / Instagram / Google Business
    → schedule_post  → nodo Schedule → nodos de publicación
    → lead.created   → nodo Email / WhatsApp / CRM externo
    → property.published → nodos de redes sociales
```

### Variables de entorno n8n

| Variable | Descripción |
|----------|-------------|
| `VITE_N8N_WEBHOOK_URL` | URL del webhook de publicación social (alternativa a localStorage) |

---

## Deploy en Vercel

`vercel.json` configurado con:
- `buildCommand`: `npx prisma generate && npm run build`
- `outputDirectory`: `dist`
- Rewrite SPA: `/((?!api/).*)` → `/index.html` (excluye rutas `/api/`)
- Headers CORS en `/api/*`, caché inmutable en `/assets/*`, seguridad global (`X-Frame-Options`, `X-Content-Type-Options`)
- `next.config.js` está **neutralizado** (solo comentario) para evitar que Vercel detecte el proyecto como Next.js

`package.json` tiene `"postinstall": "prisma generate"` para que el cliente Prisma se genere en cada `npm install`.

**Acción requerida:** configurar `POSTGRES_URL` en las variables de entorno del proyecto en Vercel Dashboard.

---

## Módulo de Anuncios

- **`Anuncios.tsx`** — wrapper que detecta `location.pathname` y pasa `modo='admin'` o `modo='airbnb'` a `ListaAnuncios`
- **`ListaAnuncios.tsx`** — componente real con: filtros, búsqueda, grid/list view, CRUD completo, modal de publicación por canal
- `basePath` en `ListaAnuncios`: admin → `''` (navega a `/anuncios/:id`), airbnb → `'/airbnb'` (navega a `/airbnb/anuncios/:id`)
- La publicación desde el modal llama a `POST /api/publicar` con `{ anuncioId, canales }`

---

## Convenciones importantes

- **Toasts:** usar siempre `import { toast } from 'sonner'`. No existe `@/hooks/use-toast`.
- **Rutas:** todas las rutas están en español (`/propiedades`, `/calendario`, `/configuracion`, etc.)
- **Alias:** `@/` apunta a `src/`
- **Lazy loading:** todas las páginas en `App.tsx` se importan con `lazy(() => import(...))`
- **Módulos en desarrollo:** usar `<ModulePlaceholder title="Nombre" />` — no crear páginas vacías

---

## Comandos

```bash
npm run dev       # Servidor de desarrollo (Vite, puerto 5173)
npm run build     # Build de producción → dist/
npm run preview   # Preview del build local
npm run lint      # ESLint
```

### Importación de componentes

```ts
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
```

---

## Pendientes

| Ítem | Prioridad |
|------|-----------|
| Autenticación real (conectar login a PostgreSQL o auth provider) | Alta |
| Páginas de detalle y edición de anuncios (`/anuncios/:id/editar`) | Alta |
| Flujo n8n: crear workflow que procese `publish_now` y publique en redes | Alta |
| Configurar `POSTGRES_URL` en Vercel Dashboard | Alta |
| Llamar `useN8nEvents` desde LeadDetails y Properties al crear/actualizar | Media |
| Páginas de Cotizaciones, Carta Presentación, Legal (reemplazar placeholders) | Media |
| Módulo Airbnb: Calendario, Precios, Mensajes, Reservas | Media |
| Reportes de Ventas y Leads con datos reales | Media |
| Autenticación real con roles granulares | Alta |
