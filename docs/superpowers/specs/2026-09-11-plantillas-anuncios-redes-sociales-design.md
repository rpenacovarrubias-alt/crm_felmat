# Diseño: Plantillas de imagen para anuncios en redes sociales

**Fecha:** 2026-09-11
**Estado:** Aprobado por el usuario, listo para plan de implementación.

## Contexto

Felmat ya tiene un sistema de Anuncios real en Postgres (`Anuncio` +
`ImagenAnuncio` + `PublicacionCanal`) y un generador de texto/caption
(`AnuncioGenerator.tsx`, hoy simulado) para publicar en Facebook/Instagram.
Falta la pieza visual: una imagen de marca real, compuesta con la foto real
de la propiedad/Airbnb (o sin foto, para Condominios) más los datos clave
(precio, ubicación, características), lista para publicarse junto al
caption.

Esta es la Fase de **diseño de imagen** dentro del trabajo mayor de Redes
Sociales -- conectar esto a la publicación real en Meta sigue siendo Fase 2
(fuera de alcance aquí, ver `2026-09-11-redes-sociales-config-fase1-design.md`).

## Decisiones confirmadas con el usuario

1. **Post = Imagen + texto**, en ambas plataformas -- no un formato de solo
   imagen ni un link. El texto/caption lo redacta el asesor manualmente por
   ahora (mejorarlo con IA y publicar automático es Fase 2).
2. **La imagen usa la foto REAL** de la propiedad/Airbnb, compuesta dentro
   de una plantilla de marca -- nunca una imagen generada por IA que no
   muestre la propiedad real.
3. **Generación en el navegador** (React + CSS, sin backend nuevo para
   componer píxeles) -- funciona desde cualquier dispositivo del asesor.
4. **Almacenamiento en Vercel Blob**: una vez compuesta en el navegador, la
   imagen final se sube a Blob para obtener una URL pública real -- necesaria
   para que, más adelante, n8n/Meta puedan leerla (Meta no puede publicar
   "lo que hay en el navegador de alguien"). Distinto del caso de fotos de
   propiedad (que se quedó en base64) porque aquí el requisito de URL
   pública fetchable por una API externa es obligatorio, no opcional.
5. **Formato único 1080×1080** (cuadrado) -- funciona bien en Facebook e
   Instagram sin duplicar diseño por plataforma.
6. **3 tipos de contenido, 2 marcas distintas**:
   - **Ficha de Propiedad** -- marca **Felmat**.
   - **Anuncio de Airbnb** -- marca **Hospitalidad Digital** (marca hermana,
     assets reales ya existentes en
     `C:\Proyectos\HospitalidadDigital\Productos en Venta en la plataforama\Hospitalidad Digital\Logotipo\`:
     logo lockup azul `#2563eb`-ish sobre fondo navy `#1a1a2e`).
   - **Anuncio de servicio de Condominios** -- marca **Felmat**, sin foto de
     propiedad (promociona el servicio de administración, no una unidad).
7. **La marca es un parámetro de la plantilla, no algo fijo en el código.**
   Motivo explícito: existe un sistema de planes de pago (Gratis/Dorado/
   Platino) todavía sin definir por completo (ver memoria
   `felmat-planes-suscripcion-redes-sociales-pendiente`) donde el plan
   Platino permitirá a un asesor personalizar con su propia marca. No se
   construye ese sistema de planes aquí -- solo se deja la plantilla lista
   para aceptar una marca distinta sin reescribirla.

## Modelo de "marca" (brand config)

```typescript
interface AdBrand {
  key: 'felmat' | 'hospitalidad_digital';
  name: string;
  logoUrl: string;           // asset estático servido por la app
  primaryColor: string;      // hex
  backgroundColor: string;   // hex, usado por la plantilla de Condominios
}
```

Dos presets fijos por ahora (`src/lib/adBrands.ts`), resueltos por
`section` al momento de generar (no por plan de usuario -- eso es el
sistema de planes pendiente, fuera de alcance):

```
propiedades  -> FELMAT_BRAND
condominios  -> FELMAT_BRAND
airbnb       -> HOSPITALIDAD_DIGITAL_BRAND
```

Los assets reales de Hospitalidad Digital (`logo_hospitalidad_digital_lockup.png`,
`fondo_navy_1a1a2e.png`) se copian a `public/brand/hospitalidad-digital/` del
repo `crm_felmat` (no se referencian desde la ruta externa del otro
proyecto). Felmat **ya tiene su logo oficial real** en
`public/logo-felmat-gold.png` (dorado/ámbar sobre fondo blanco, "GRUPO
FELMAT") -- se reutiliza tal cual, sin inventar un color nuevo. Esto
corrige la primera suposición de este documento (que asumía azul, tomado
del color de la interfaz del sidebar, no de la marca real).

## Composición visual

**Propiedad / Airbnb (con foto, 1080×1080):**
- Foto real a pantalla completa, `object-fit: cover` centrado.
- Degradado oscuro solo en el tercio inferior (contraste ≥4.5:1 para el
  texto encima, nunca texto directo sobre foto sin refuerzo).
- Precio: tipografía grande y bold, esquina inferior -- máxima jerarquía.
- Badge arriba-izquierda con ícono + texto (nunca solo color):
  "VENTA" / "RENTA" / "AIRBNB", cada uno con su propio ícono.
- Fila de íconos pequeños (recámaras/baños/m²) con su número, dentro del
  degradado.
- Ubicación (colonia, ciudad) como texto secundario, más chico que el
  precio.
- Logo de la marca (Felmat o Hospitalidad Digital según `section`) pequeño,
  esquina inferior derecha.

**Condominios (sin foto, fondo sólido de marca Felmat):**
- Headline editable, grande.
- Logo Felmat prominente.
- Datos de contacto.
- Sin intentar simular una ficha de propiedad que no es.

**Anti-slop (huashu-design):** sin degradados morados genéricos, sin
íconos de emoji, sin relleno decorativo -- cada elemento gana su lugar.

## Arquitectura técnica

- `src/components/anuncios/templates/PlantillaFicha.tsx` -- componente React
  de 1080×1080px reales (no responsive, tamaño fijo), recibe `{ anuncio:
  Anuncio, brand: AdBrand, fotoUrl: string }`. Sirve tanto para Propiedad
  como Airbnb (mismo layout, cambia `brand` y las etiquetas del badge según
  `modo`).
- `src/components/anuncios/templates/PlantillaCondominios.tsx` -- 1080×1080,
  recibe `{ headline: string, brand: AdBrand }`.
- `src/lib/adBrands.ts` -- los 2 presets de marca.
- `src/lib/generarImagenAnuncio.ts` -- usa `html-to-image` (nueva
  dependencia, ligera, estándar para DOM→PNG en React, sin backend) para
  renderizar el componente montado (fuera de pantalla) a un `Blob` PNG.
- `api/felmat-upload-anuncio-image.js` -- nuevo endpoint: recibe el PNG
  (`multipart/form-data` o el blob crudo), lo sube a Vercel Blob (paquete
  `@vercel/blob`, nueva dependencia), regresa la URL pública. Requiere
  sesión válida (mismo patrón `getSession` que el resto de `api/*.js`).
- En `AnuncioForm.tsx`: botón "Generar imagen" que monta la plantilla
  correspondiente (oculta), la convierte a PNG, la sube, y agrega la URL
  resultante a `imagenes` del anuncio (reutiliza `ImagenAnuncio` ya
  existente en el schema).

## Fuera de alcance

- El sistema de planes Gratis/Dorado/Platino (memoria
  `felmat-planes-suscripcion-redes-sociales-pendiente`) -- la marca hoy se
  resuelve solo por `section`, no por el plan del asesor.
- Marca personalizada por asesor individual (Platino) -- la estructura
  `AdBrand` lo permite a futuro, pero no se construye el flujo para que un
  asesor suba su propio logo todavía.
- Mejora con IA del texto/caption y reglas de publicación por red social
  (Fase 2, ya identificada).
- Publicación real a Meta (Fase 2).
- Plantilla horizontal específica para Facebook (si se pide después).

## Prueba

1. `npx tsc --noEmit` y `npm run build` limpios.
2. Generar una imagen real (con una propiedad de prueba, sesión via
   `signSession()`, nunca password real): confirmar que el PNG resultante
   mide 1080×1080, que la URL de Blob responde 200 con `image/png`, y que
   queda guardada en `imagenes` del `Anuncio`.
3. Repetir para Airbnb (confirmar que usa el logo/colores de Hospitalidad
   Digital, no Felmat) y para Condominios (sin foto, fondo de marca).
4. Verificación visual manual en el navegador de las 3 plantillas antes de
   dar por buena la composición.
