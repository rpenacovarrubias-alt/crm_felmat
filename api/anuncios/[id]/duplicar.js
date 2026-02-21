import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const original = await prisma.anuncio.findUnique({
      where: { id },
      include: { imagenes: true },
    });

    if (!original) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }

    const slugBase = original.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const nuevoSlug = `${slugBase}-copia-${Date.now()}`;

    const duplicado = await prisma.anuncio.create({
      data: {
        titulo: `${original.titulo} (Copia)`,
        subtitulo: original.subtitulo,
        slug: nuevoSlug,
        descripcion: original.descripcion,
        colonia: original.colonia,
        ciudad: original.ciudad,
        estado: 'BORRADOR',
        precio: original.precio,
        moneda: original.moneda,
        periodo: original.periodo,
        tipoPropiedad: original.tipoPropiedad,
        modalidadRenta: original.modalidadRenta,
        recamaras: original.recamaras,
        banos: original.banos,
        destacado: false,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        imagenes: {
          create: original.imagenes.map(img => ({
            url: img.url,
            esPrincipal: img.esPrincipal,
            orden: img.orden,
          })),
        },
      },
      include: { imagenes: true, publicaciones: true },
    });

    return res.status(201).json(duplicado);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error al duplicar anuncio' });
  }
}
