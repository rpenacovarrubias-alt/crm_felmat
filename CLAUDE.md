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
| Notificaciones | Sonner (toasts) |
| Base de datos | PostgreSQL vía Prisma ORM |
| Deploy | Vercel (SPA con rewrites) |
| Automatización | n8n (webhooks — integración pendiente) |
| Node | 20 |

---

## Estructura del proyecto

```
crm_felmat/
├── src/
│   ├── App.tsx               # Raíz: BrowserRouter + AuthProvider + rutas
│   ├── main.tsx              # Entry point
│   ├── index.css             # Estilos globales
│   ├── pages/                # Páginas principales (lazy loaded)
│   │   ├── Dashboard.tsx
│   │   ├── Properties.tsx
│   │   ├── Leads.tsx / LeadDetails.tsx
│   │   ├── Calendar.tsx
│   │   ├── Website.tsx
│   │   ├── Activities.tsx
│   │   ├── Notifications.tsx
│   │   ├── Settings.tsx
│   │   ├── Profile.tsx
│   │   ├── Users.tsx
│   │   ├── Login.tsx
│   │   └── admin/
│   │       ├── condominios/
│   │       └── anuncios/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx   # Layout principal con sidebar
│   │   │   ├── Sidebar.tsx      # Navegación lateral (colapsable, grupos, submenús)
│   │   │   ├── Sidebar.tsx.backup
│   │   │   └── Header.tsx
│   │   ├── anuncios/            # Módulo de anuncios
│   │   │   ├── Anuncios.tsx
│   │   │   ├── AnuncioGenerator.tsx
│   │   │   ├── ListaAnuncios.tsx
│   │   │   ├── SocialPublisher.tsx
│   │   │   ├── PublicationHistory.tsx
│   │   │   ├── SocialConfig.tsx
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── dashboard/
│   │   ├── leads/
│   │   ├── properties/
│   │   ├── calendar/
│   │   ├── carta/
│   │   ├── cotizaciones/
│   │   ├── estimaciones/
│   │   ├── notifications/
│   │   ├── search/
│   │   ├── settings/
│   │   ├── users/
│   │   ├── website/
│   │   └── ui/                  # shadcn/ui components (40+)
│   ├── contexts/
│   │   └── AuthContext.tsx      # Auth con localStorage (mock — sin backend real aún)
│   ├── hooks/
│   │   ├── useAuth.tsx
│   │   ├── useDatabase.ts
│   │   ├── useSocialPublish.ts  # Publicación en redes sociales
│   │   ├── use-mobile.ts
│   │   └── estimaciones/
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── api.ts
│   │   ├── pdfExport.ts
│   │   ├── social-apis/
│   │   │   ├── facebook.ts
│   │   │   ├── instagram.ts
│   │   │   ├── google-business.ts
│   │   │   └── webhook.ts       # Webhooks hacia n8n
│   │   └── valuacion/
│   └── types/
├── api/                         # Vercel Serverless Functions
│   ├── anuncios.js
│   ├── publicar.js
│   └── anuncios/
│       ├── [id].js
│       └── [id]/
│           └── duplicar.js
├── prisma/
│   └── schema.prisma            # Modelos: User, Anuncio, ImagenAnuncio, PublicacionCanal
├── public/
├── dist/                        # Build output (Vite)
├── vercel.json                  # SPA rewrite: /* → /index.html
├── vite.config.ts
├── tailwind.config.js
├── next.config.js               # Presente pero no activo — proyecto es Vite, no Next
└── tsconfig.json / tsconfig.app.json / tsconfig.node.json
```

---

## Rutas registradas (App.tsx)

| Ruta | Componente | Estado |
|------|-----------|--------|
| `/dashboard` | Dashboard | Activo |
| `/propiedades` | Properties | Activo |
| `/leads` | Leads | Activo |
| `/leads/:id` | LeadDetails | Activo |
| `/calendario` | Calendar | Activo |
| `/sitio-web` | Website | Activo |
| `/actividades` | Activities | Activo |
| `/notificaciones` | Notifications | Activo |
| `/configuracion` | Settings | Activo |
| `/perfil` | Profile | Activo |
| `/admin/usuarios` | Users | Activo |
| `/anuncios` | Anuncios | Activo (con problemas de routing) |
| `/airbnb/anuncios` | Anuncios | Activo (reutiliza componente) |
| `/propiedades/nueva` | ModulePlaceholder | En desarrollo |
| `/propiedades/tipos` | ModulePlaceholder | En desarrollo |
| `/propiedades/amenidades` | ModulePlaceholder | En desarrollo |
| `/leads/importar` | ModulePlaceholder | En desarrollo |
| `/admin/condominios` | ModulePlaceholder | En desarrollo |
| `/carta-presentacion` | ModulePlaceholder | En desarrollo |
| `/cotizaciones` | ModulePlaceholder | En desarrollo |
| `/legal/contratos` | ModulePlaceholder | En desarrollo |
| `/legal/fianzas` | ModulePlaceholder | En desarrollo |
| `/airbnb/calendario` | ModulePlaceholder | En desarrollo |
| `/airbnb/precios` | ModulePlaceholder | En desarrollo |
| `/airbnb/mensajes` | ModulePlaceholder | En desarrollo |
| `/airbnb/reservas` | ModulePlaceholder | En desarrollo |
| `/reportes/ventas` | ModulePlaceholder | En desarrollo |
| `/reportes/leads` | ModulePlaceholder | En desarrollo |

---

## Modelos de base de datos (Prisma / PostgreSQL)

- **User** — id, email, name, role (USER/admin), timestamps
- **Anuncio** — propiedad inmobiliaria: título, slug, descripción, colonia, ciudad, estado (BORRADOR/…), precio, moneda, recámaras, baños, destacado, fechas, SEO meta, métricas (vistas, contactos)
- **ImagenAnuncio** — imágenes de un anuncio con orden y flag de principal
- **PublicacionCanal** — historial de publicación por canal (Facebook, Instagram, Google Business); estado, externalId, externalUrl, errorMsg

Variable de entorno requerida: `POSTGRES_URL`

---

## Autenticación

- Implementada con `AuthContext` + `localStorage` (mock actual — no valida contra backend)
- Roles: `admin` / `USER`
- `ProtectedRoute` envuelve todas las rutas privadas
- **Pendiente:** conectar login real contra base de datos o proveedor de auth

---

## Módulo de Publicación Social (`useSocialPublish`)

- Soporta: `facebook`, `instagram`, `googleBusiness`
- Publicación inmediata: llama directo a cada API en `src/lib/social-apis/`
- Publicación programada: envía webhook a n8n (`sendWebhook` con `type: 'schedule_post'`)
- **Pendiente:** credenciales de APIs de redes sociales y URL del webhook n8n no configuradas

---

## Deploy en Vercel

- SPA con rewrite global: `"source": "/(.*)" → "destination": "/index.html"`
- Serverless Functions en `/api/` (Node.js): `anuncios.js`, `publicar.js`, `anuncios/[id].js`, `anuncios/[id]/duplicar.js`
- **Nota:** `next.config.js` existe en el repo pero es un artefacto — el proyecto corre con Vite, no Next.js

---

## Pendientes principales

### 1. Menú de navegación desconectado
- `Sidebar.tsx` tiene todos los grupos y submenús definidos (Propiedades, Leads, Airbnb, Legal, Cotizaciones, Reportes, Admin)
- Existe `Sidebar.tsx.backup` — revisar si la versión activa es la correcta
- Verificar que los `href` del sidebar coincidan exactamente con las rutas en `App.tsx`
- Algunos ítems del menú podrían apuntar a rutas no registradas o con typos

### 2. Errores 404 en Vercel
- El `vercel.json` ya tiene el rewrite SPA correcto (`/* → /index.html`)
- Posibles causas: rutas en el sidebar que no están registradas en `App.tsx`, o serverless functions con errores que devuelven 404
- Revisar las Vercel Functions en `/api/` — pueden fallar si `POSTGRES_URL` no está configurada en el entorno de Vercel

### 3. Routing en módulo Anuncios y Publicación Social
- `/anuncios` y `/airbnb/anuncios` ambas cargan el mismo componente `<Anuncios />`
- El componente vive en `src/components/anuncios/` (no en `src/pages/`) — verificar imports y lazy loading
- `SocialPublisher.tsx` y `SocialConfig.tsx` dentro del módulo aún no tienen las credenciales de API configuradas

### 4. Integración pendiente con n8n
- El webhook ya está preparado en `src/lib/social-apis/webhook.ts`
- `useSocialPublish` lo llama cuando `scheduledFor` está definido
- **Falta:** definir y configurar la URL del webhook de n8n (variable de entorno recomendada: `VITE_N8N_WEBHOOK_URL`)
- **Falta:** crear el flujo en n8n que reciba `{ type: 'schedule_post', data: {...} }` y lo procese

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
```

El alias `@/` apunta a `src/`.
