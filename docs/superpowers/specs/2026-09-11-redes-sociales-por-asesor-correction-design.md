# Corrección: Redes Sociales son por asesor, no compartidas por sección

**Fecha:** 2026-09-11
**Estado:** Aprobado por el usuario, listo para plan de implementación.
**Reemplaza en este punto:** la decisión #2 de
`2026-09-11-redes-sociales-config-fase1-design.md` ("cualquier usuario
autenticado puede ver/editar la configuración de una sección"). El resto de
ese diseño (3 secciones, navegación, campos del formulario, texto plano
aceptado para secrets, fuera de alcance Fase 2) sigue vigente sin cambios.

## Por qué

`crm_felmat` es multi-usuario: cada asesor inmobiliario tiene su propia
cuenta, sube sus propias propiedades. Fase 1 se construyó asumiendo que las
credenciales de Meta eran compartidas por toda la empresa dentro de cada
sección (una sola Página de Facebook para "Propiedades", usada por todos los
asesores). Eso está mal: cada asesor tiene (o puede tener) su propia Página
de Facebook / cuenta de Instagram, y no debe poder ver ni tocar la de otro
asesor. La única excepción es `super_admin`, que puede editar la de
cualquier asesor con fines de soporte -- y también tiene la suya propia,
igual que cualquier otro usuario.

## Decisión confirmada con el usuario

- Un asesor puede tener credenciales **distintas por sección** (Propiedades/
  Condominios/Airbnb) -- eso no cambia de Fase 1.
- Lo que cambia: esas credenciales ahora son **por asesor además de por
  sección**. La combinación única pasa de `[section, platform]` a
  `[userId, section, platform]`.
- Un usuario normal (`agent`/`assistant`/`admin`) solo ve/edita sus propias
  filas (`userId === session.sub`).
- **Solo `super_admin`** (no `admin` genérico) puede ver/editar las de
  cualquier asesor, vía un parámetro explícito que un usuario normal no
  puede usar para leer/escribir la de otro.
- `super_admin` conecta las suyas propias exactamente igual que cualquier
  otro usuario (es simplemente su propia fila) -- el acceso a "las de los
  demás" es adicional, nunca reemplaza su acceso a las suyas.

## Modelo de datos (reemplaza el de Fase 1)

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

`FelmatUser` necesita el lado inverso de la relación:
`socialConfigs FelmatSocialConfig[]` agregado a su modelo.

La tabla real hoy está vacía (la única fila de prueba que existió se borró
manualmente durante la Fase 1) -- este es un cambio de esquema limpio, sin
migración de datos que preservar.

## Backend (reemplaza el de Fase 1)

`api/felmat-social-config.js`:

- **GET** `?section=X&platform=Y[&userId=Z]`:
  - Sin `userId` en el query -> usa `session.sub` (siempre las propias).
  - Con `userId=Z` -> si `isSuperAdmin(session.role)` es true, consulta las
    de `Z`; si no, **403 forbidden** (un usuario normal no puede ni siquiera
    intentar leer las de otro pasando el query param).
  - Sin `section`/`platform` (listado completo) -> mismo criterio de
    `userId` que arriba, aplicado a las 6 filas de ese usuario.
- **PUT** body `{ section, platform, enabled, appId, accountId, appSecret?,
  accessToken?, userId? }`:
  - `userId` en el body solo se respeta si `isSuperAdmin(session.role)` es
    true; para cualquier otro rol se ignora silenciosamente y se usa
    `session.sub` -- mismo patrón anti-spoof ya usado para `updatedBy`
    (nunca confiar en el body para quién es el dueño de la fila que se está
    tocando).
  - `updatedBy` sigue siendo siempre `session.sub` (quién hizo el cambio),
    incluso cuando `super_admin` edita la fila de otro asesor -- así queda
    registro de que fue soporte, no el propio asesor.
- El resto (masking de secrets, preserve-on-omit/clear-on-empty-string,
  whitelist de section/platform) no cambia respecto a Fase 1.

## Frontend (reemplaza el de Fase 1)

- `src/lib/socialConfigApi.ts`: `getSocialConfig`, `listSocialConfigs` y
  `saveSocialConfig` aceptan un `userId?: string` opcional adicional (se
  manda como query param en GET, como campo del body en PUT). Cuando se
  omite, el backend ya resuelve "el propio" -- el cliente no necesita saber
  su propio id para el caso normal.
- `RedesSociales.tsx` y `SocialConfigForm.tsx`: si `session.role ===
  'super_admin'` (usar el mismo hook `useAuth()` ya existente en el resto
  del CRM), se muestra un selector "Viendo como: [Yo ▾]" en la parte
  superior de la pantalla -- un `Select` con la lista de asesores (misma
  fuente que ya usa `UserManagement.tsx`/`useUsers()`). Cambiar la selección
  vuelve a pedir la config con ese `userId` y todas las llamadas de guardado
  posteriores lo incluyen. Para cualquier otro rol, el selector no se
  renderiza en absoluto -- no hay forma de ver la UI de "elegir otro
  asesor" si no eres `super_admin` (defensa en profundidad: aunque el
  backend ya rechaza el intento, la UI ni lo ofrece).

## Fuera de alcance

Todo lo que ya estaba fuera de alcance en Fase 1 (funciones reales de Meta,
n8n, webhooks de mensajes, "Probar conexión" real) sigue fuera de alcance
aquí también -- esta es una corrección del modelo de propiedad de los
datos, no una ampliación de funcionalidad.

## Prueba

1. `npx tsc --noEmit` y `npm run build` limpios.
2. Con `signSession()` (nunca password real): usuario A guarda credenciales
   para `propiedades/facebook`; usuario B (mismo rol `agent`) hace GET de
   esa combinación -> debe regresar sus propias filas vacías, nunca las de
   A. Usuario B intenta GET con `?userId=<id-de-A>` -> 403. Usuario B
   intenta PUT con `userId: <id-de-A>` en el body -> se ignora, la fila que
   se escribe sigue siendo la de B (verificar leyendo de vuelta con A).
   `super_admin` con `?userId=<id-de-A>` -> sí regresa las filas de A;
   `super_admin` sin `userId` -> regresa las suyas propias.
3. En el navegador: como `super_admin`, confirmar que el selector "Viendo
   como" aparece y permite cambiar de asesor; como `agent`, confirmar que
   no aparece.
