import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
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

      const anuncio = await prisma.anuncio.update({
        where: { id },
        data,
        include: { imagenes: true, publicaciones: true },
      });

      return res.status(200).json(anuncio);
    } catch (error) {
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
