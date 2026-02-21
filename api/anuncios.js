import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { estado, tipo, modalidad, q: busqueda, ordenar = 'recientes' } = req.query;
      
      const where = {};
      if (estado && estado !== ' ') where.estado = estado;
      if (tipo && tipo !== ' ') where.tipoPropiedad = tipo;
      if (modalidad && modalidad !== ' ') where.modalidadRenta = modalidad;
      
      if (busqueda) {
        where.OR = [
          { titulo: { contains: busqueda, mode: 'insensitive' } },
          { colonia: { contains: busqueda, mode: 'insensitive' } },
          { ciudad: { contains: busqueda, mode: 'insensitive' } },
        ];
      }

      let orderBy = { createdAt: 'desc' };
      if (ordenar === 'antiguos') orderBy = { createdAt: 'asc' };
      if (ordenar === 'precio_alto') orderBy = { precio: 'desc' };
      if (ordenar === 'precio_bajo') orderBy = { precio: 'asc' };
      if (ordenar === 'vistas') orderBy = { vistas: 'desc' };

      const anuncios = await prisma.anuncio.findMany({
        where,
        orderBy,
        include: {
          imagenes: { orderBy: { orden: 'asc' }, take: 1 },
          publicaciones: true,
        },
      });

      return res.status(200).json(anuncios);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Error al cargar anuncios' });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      const slugBase = data.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slug = `${slugBase}-${Date.now()}`;

      const anuncio = await prisma.anuncio.create({
        data: { ...data, slug, estado: 'BORRADOR' },
        include: { imagenes: true, publicaciones: true },
      });

      return res.status(201).json(anuncio);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Error al crear anuncio' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
