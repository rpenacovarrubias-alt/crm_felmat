# Diseño: correos transaccionales de Felmat vía n8n (Tarea 10 retomada)

**Fecha:** 2026-09-09
**Estado:** Aprobado por el usuario, listo para plan de implementación.

## Contexto

El backend de autenticación real de `crm_felmat` (Tasks 1-15, completado y en
producción) ya tiene dos endpoints que dependen de un webhook de n8n para
enviar correo, pero ese webhook nunca se construyó -- estaba bloqueado en
que `felmat.com.mx` aún no propagaba en Neubox. El DNS ya propagó (verificado
con `nslookup -type=NS felmat.com.mx` -> nameservers de Neubox autoritativos)
y el usuario ya creó el dominio en el panel de Neubox. Esta pieza cierra ese
pendiente.

Los dos endpoints, **ya desplegados en producción, sin cambios necesarios**,
fijan el contrato exacto que n8n debe cumplir:

- `api/felmat-password-reset.js` -> POST a
  `https://chatbotventas-n8n.h0w0dc.easypanel.host/webhook/felmat-restablecer-contrasena`
  con body `{ name, email, resetUrl }`. El resultado del webhook se ignora a
  propósito (try/catch que traga cualquier fallo) -- es intencional, para que
  la respuesta al usuario final sea siempre genérica y no filtre si el correo
  existe en el sistema.
- `api/felmat-send-credentials.js` -> POST a
  `https://chatbotventas-n8n.h0w0dc.easypanel.host/webhook/felmat-enviar-credenciales`
  con body `{ name, email, password, loginUrl }`. Aquí el endpoint **sí**
  revisa `webhookRes.ok`: si n8n responde con error o no responde, el admin
  ve un 502 explícito en el CRM.

## Remitente

Buzón `admin@felmat.com.mx`, creado en Neubox (mismo panel donde ya vive el
dominio). Es el mismo correo que ya es el login de super_admin del CRM.
Credencial SMTP única en n8n, compartida por ambos workflows.

## Workflow 1: `felmat-restablecer-contrasena`

```
Webhook (POST, path: felmat-restablecer-contrasena)
    -> Send Email (SMTP, from admin@felmat.com.mx, to {{ $json.email }})
         Asunto: "Restablece tu contraseña -- Felmat CRM"
         Cuerpo: saluda a {{ $json.name }}, boton/link a {{ $json.resetUrl }},
         aviso de que el link vence en 30 minutos (igual que
         RESET_MAX_AGE_MS en api/_lib/session.js).
    -> Respond to Webhook (200, cualquier body -- el caller lo ignora)
```

## Workflow 2: `felmat-enviar-credenciales`

```
Webhook (POST, path: felmat-enviar-credenciales)
    -> Send Email (SMTP, from admin@felmat.com.mx, to {{ $json.email }})
         Asunto: "Tu cuenta en Felmat CRM"
         Cuerpo: saluda a {{ $json.name }}, muestra usuario ({{ $json.email }})
         y contraseña temporal ({{ $json.password }}), boton/link a
         {{ $json.loginUrl }}, sugiere cambiar la contraseña tras entrar.
    -> Respond to Webhook (200 -- debe ejecutarse solo si el Send Email
       tuvo éxito; si el nodo de correo falla, el workflow debe terminar en
       error para que n8n responda con status != 2xx y el CRM lo detecte)
```

## Fuera de alcance

- No se crean los otros 4 buzones (`hola@`, `ventas@`, `mayrafajer@`,
  `adrianamartinez@`) como parte de esta tarea -- el usuario los crea por su
  cuenta en Neubox cuando quiera, no son remitentes de ningún workflow.
- No se agrega plantilla HTML con branding/diseño -- correo de texto plano o
  HTML mínimo, suficiente para que el mensaje sea claro. Si más adelante se
  quiere una plantilla con marca, es una mejora aparte.
- No se toca el backend de Vercel -- los dos endpoints ya están en
  producción y su contrato es fijo.

## Prueba

1. URL de test de cada webhook en n8n, POST manual con un payload de
   ejemplo, confirmar que el correo llega a una bandeja real.
2. Activar (publicar) ambos workflows.
3. Extremo a extremo real: pedir "olvidé mi contraseña" desde el login de
   producción con un correo real, confirmar que llega y que el link
   funciona; un admin reenvía credenciales a un usuario de prueba desde
   Gestión de Usuarios, confirmar que llega.
