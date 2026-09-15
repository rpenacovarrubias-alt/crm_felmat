import { PrismaClient } from '@prisma/client';
import { requireApiKey } from './_lib/auth.js';
import {
  publicarFacebookImagenUnica, publicarFacebookCarrusel,
  publicarInstagramImagenUnica, publicarInstagramCarrusel,
} from './_lib/metaPublish.js';

const prisma = new PrismaClient();

// modo='admin' en el modelo Anuncio significa "Condominios" (nombre
// heredado del sidebar) -- FelmatSocialConfig usa 'condominios' como
// section real. Ver resolverContextoAnuncio en src/lib/anunciosApi.ts.
const SECCION_POR_MODO = { admin: 'condominios', airbnb: 'airbnb', propiedades: 'propiedades' };

function resolverImagenes(anuncio) {
  if (anuncio.categoria === 'SERVICIO') {
    return anuncio.imagenes
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((img) => img.imagenCompuestaUrl)
      .filter(Boolean);
  }
  const principal = anuncio.imagenes.find((img) => img.esPrincipal);
  return principal?.imagenCompuestaUrl ? [principal.imagenCompuestaUrl] : [];
}

async function publicarEnMeta(canal, config, imageUrls, caption) {
  const credenciales = { accountId: config.accountId, accessToken: config.accessToken };
  if (canal === 'FACEBOOK') {
    return imageUrls.length > 1
      ? publicarFacebookCarrusel({ ...credenciales, imageUrls, caption })
      : publicarFacebookImagenUnica({ ...credenciales, imageUrl: imageUrls[0], caption });
  }
  return imageUrls.length > 1
    ? publicarInstagramCarrusel({ ...credenciales, imageUrls, caption })
    : publicarInstagramImagenUnica({ ...credenciales, imageUrl: imageUrls[0], caption });
}

export default async function handler(req, res) {
  if (!requireApiKey(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { anuncioId, canales } = req.body;

    if (!anuncioId || !canales || !Array.isArray(canales)) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const anuncio = await prisma.anuncio.findUnique({
      where: { id: anuncioId },
      include: { imagenes: true },
    });

    if (!anuncio) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    const seccion = SECCION_POR_MODO[anuncio.modo] || anuncio.modo;

    const resultados = await Promise.all(
      canales.map(async (canal) => {
        const existente = await prisma.publicacionCanal.findUnique({
          where: { anuncioId_canal: { anuncioId, canal } },
        });

        if (existente?.estado === 'PUBLICADO') {
          return { canal, estado: 'ya_publicado', mensaje: 'Ya estaba publicado' };
        }

        if (canal !== 'FACEBOOK' && canal !== 'INSTAGRAM') {
          const publicacion = await prisma.publicacionCanal.upsert({
            where: { anuncioId_canal: { anuncioId, canal } },
            update: { estado: 'PENDIENTE', updatedAt: new Date() },
            create: { anuncioId, canal, estado: 'PENDIENTE' },
          });
          return { canal, estado: 'pendiente', publicacionId: publicacion.id };
        }

        const config = await prisma.felmatSocialConfig.findUnique({
          where: { userId_section_platform: { userId: anuncio.agentId, section: seccion, platform: canal.toLowerCase() } },
        });

        if (!config || !config.enabled || !config.accountId || !config.accessToken) {
          const mensaje = `Este asesor no tiene configurada su conexión de ${canal} para ${seccion}`;
          const publicacion = await prisma.publicacionCanal.upsert({
            where: { anuncioId_canal: { anuncioId, canal } },
            update: { estado: 'ERROR', errorMsg: mensaje, updatedAt: new Date() },
            create: { anuncioId, canal, estado: 'ERROR', errorMsg: mensaje },
          });
          return { canal, estado: 'error', publicacionId: publicacion.id };
        }

        const imageUrls = resolverImagenes(anuncio);
        if (imageUrls.length === 0) {
          const mensaje = 'Genera la imagen del anuncio antes de publicar';
          const publicacion = await prisma.publicacionCanal.upsert({
            where: { anuncioId_canal: { anuncioId, canal } },
            update: { estado: 'ERROR', errorMsg: mensaje, updatedAt: new Date() },
            create: { anuncioId, canal, estado: 'ERROR', errorMsg: mensaje },
          });
          return { canal, estado: 'error', publicacionId: publicacion.id };
        }

        const caption = anuncio.descripcion || '';
        const resultado = await publicarEnMeta(canal, config, imageUrls, caption);

        const publicacion = await prisma.publicacionCanal.upsert({
          where: { anuncioId_canal: { anuncioId, canal } },
          update: resultado.success
            ? { estado: 'PUBLICADO', externalId: resultado.externalId, externalUrl: resultado.externalUrl, errorMsg: null, publicadoAt: new Date(), updatedAt: new Date() }
            : { estado: 'ERROR', errorMsg: resultado.errorMsg, updatedAt: new Date() },
          create: resultado.success
            ? { anuncioId, canal, estado: 'PUBLICADO', externalId: resultado.externalId, externalUrl: resultado.externalUrl, publicadoAt: new Date() }
            : { anuncioId, canal, estado: 'ERROR', errorMsg: resultado.errorMsg },
        });

        return { canal, estado: resultado.success ? 'publicado' : 'error', publicacionId: publicacion.id };
      })
    );

    if (anuncio.estado === 'BORRADOR' && resultados.some((r) => r.estado === 'publicado')) {
      await prisma.anuncio.update({
        where: { id: anuncioId },
        data: { estado: 'REVISION' },
      });
    }

    return res.status(200).json({
      success: true,
      resultados,
      mensaje: 'Publicaciones procesadas',
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error al publicar' });
  }
}
