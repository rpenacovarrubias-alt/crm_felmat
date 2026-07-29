# CLAUDE.md — Felmat CRM Inmobiliario
> Este archivo es específico del proyecto Felmat.
> Para contexto global del ecosistema: lee C:\Proyectos\CLAUDE.md

---

## Proyecto
CRM completo para gestión de propiedades, condominios y Airbnb.
**Repo:** `C:\Proyectos\Felmat\crm_felmat\`
**GitHub:** `rpenacovarrubias-alt/crm_felmat`
**Deploy:** Vercel

## Stack
- React 18 + TypeScript + Vite + Tailwind CSS
- shadcn/ui (Radix UI) + React Router v6
- Prisma ORM + React Hook Form + Zod
- Recharts + React Big Calendar + jsPDF + Sonner

## Módulos activos
- Propiedades (renta y venta) + fichas técnicas
- Dashboard Condominios — unidades y residentes
- Dashboard Airbnb — gestión de propiedades
- Agentes inmobiliarios con roles diferenciados
- Anuncios automáticos + campañas Meta Ads vía n8n
- Integración Airbnb ↔ Ama de Llaves (nativa)

## Correcciones aplicadas (23 Mar 2026)
- ListaAnuncios.tsx — eliminado `use client` inválido en Vite
- SocialPublisher, AnuncioGenerator, SocialConfig, PublicationHistory — migrado useToast → Sonner
- App.tsx — 6 rutas nuevas para módulo anuncios

## Pendientes
- [ ] Errores 404 en Vercel en ciertas rutas
- [ ] Commit + push cambios 23 Mar
- [ ] Integración CRM con n8n

---

## SKILLS ACTIVAS EN ESTA SESIÓN
Al iniciar, activa automáticamente como sombra permanente:

**ARQUITECTURA Y CÓDIGO**
senior-frontend | senior-fullstack | senior-architect | code-reviewer | focused-fix | tech-debt-tracker | performance-profiler | dependency-auditor | changelog-generator

**BASE DE DATOS**
database-designer | database-schema-designer | sql-database-assistant

**CALIDAD Y PRUEBAS**
tdd-guide | senior-qa | spec-driven-workflow | spec-to-repo | a11y-audit

**UX Y DISEÑO**
ui-design-system | ux-researcher-designer | landing-page-generator

**PRODUCTO**
senior-pm | agile-product-owner | product-manager-toolkit | decision-logger

**MARKETING Y CONTENIDO**
social-content | content-creator | ad-creative | analytics-tracking

**GESTIÓN**
cto-advisor | release-manager

---

## Reglas de sesión
1. Lee siempre C:\Proyectos\CLAUDE.md para contexto global
2. Código en bloques completos, nunca fragmentos
3. Muestra qué cambias y por qué antes de modificar
4. Español mexicano por defecto

