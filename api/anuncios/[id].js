import { PrismaClient } from '@prisma/client';
import { requireApiKey } from '../_lib/auth.js';

const prisma = new PrismaClient();

const CAMPOS_PROPIEDAD_REQUERIDOS = ['colonia', 'ciudad', 'precio', 'tipoPropiedad', 'modalidadRenta'];

function validarCamposPropiedad(data) {
  if (data.categoria === 'SERVICIO') return null;
  const faltantes = CAMPOS_PROPIEDAD_REQUERIDOS.filter(
    (campo) => data[campo] === undefined || data[campo] === null || data[campo] === ''
  );
  if (faltantes.length > 0) {
    return `Faltan campos obligatorios para un anuncio de propiedad: ${faltantes.join(', ')}`;
  }
  return null;
}

export default async function handler(req, res) {
  if (!requireApiKey(req, res)) return;

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const anuncio = await prisma.anuncio.findUnique({
        where: { id },
        include: {
          imagenes: { orderBy: { orden: 'asc' } },
          publicaciones: true,
        },
      });

      if (!anuncio) {
        return res.status(404).json({ error: 'Anuncio no encontrado' });
      }

      return res.status(200).json(anuncio);
    } catch (error) {
      return res.status(500).json({ error: 'Error al cargar anuncio' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const data = req.body;
      delete data.id;
      delete data.createdAt;
      delete data.updatedAt;
      delete data.slug;
      delete data.categoria; // inmutable después de crear -- ver spec

      const errorValidacion = await (async () => {
        const actual = await prisma.anuncio.findUnique({ where: { id }, select: { categoria: true } });
        if (!actual) return null; // el 404 lo maneja Prisma más abajo
        return validarCamposPropiedad({ ...data, categoria: actual.categoria });
      })();
      if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
      }

      const imagenes = data.imagenes;
      delete data.imagenes;
      delete data.publicaciones;

      const anuncio = await prisma.anuncio.update({
        where: { id },
        data: {
          ...data,
          ...(imagenes ? {
            imagenes: {
              deleteMany: {},
              create: imagenes.map((img, i) => ({
                url: img.url,
                esPrincipal: img.esPrincipal,
                orden: i,
                headline: img.headline || null,
                subtitulo: img.subtitulo || null,
                imagenCompuestaUrl: img.imagenCompuestaUrl || null,
              })),
            },
          } : {}),
        },
        include: { imagenes: { orderBy: { orden: 'asc' } }, publicaciones: true },
      });

      return res.status(200).json(anuncio);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Error al actualizar anuncio' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.anuncio.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Error al eliminar anuncio' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
