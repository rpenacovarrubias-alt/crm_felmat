import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
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

    const resultados = await Promise.all(
      canales.map(async (canal) => {
        const existente = await prisma.publicacionCanal.findUnique({
          where: { anuncioId_canal: { anuncioId, canal } },
        });

        if (existente?.estado === 'PUBLICADO') {
          return { canal, estado: 'ya_publicado', mensaje: 'Ya estaba publicado' };
        }

        const publicacion = await prisma.publicacionCanal.upsert({
          where: { anuncioId_canal: { anuncioId, canal } },
          update: { estado: 'PENDIENTE', updatedAt: new Date() },
          create: { anuncioId, canal, estado: 'PENDIENTE' },
        });

        return { canal, estado: 'pendiente', publicacionId: publicacion.id };
      })
    );

    if (anuncio.estado === 'BORRADOR') {
      await prisma.anuncio.update({
        where: { id: anuncioId },
        data: { estado: 'REVISION' },
      });
    }

    return res.status(200).json({
      success: true,
      resultados,
      mensaje: 'Publicaciones en proceso',
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error al iniciar publicaciones' });
  }
}
