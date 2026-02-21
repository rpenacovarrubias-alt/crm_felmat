import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const modalidad = searchParams.get('modalidad');
    const busqueda = searchParams.get('q');
    const ordenar = searchParams.get('ordenar') || 'recientes';

    const where: any = {};
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

    let orderBy: any = { createdAt: 'desc' };
    switch (ordenar) {
      case 'antiguos': orderBy = { createdAt: 'asc' }; break;
      case 'precio_alto': orderBy = { precio: 'desc' }; break;
      case 'precio_bajo': orderBy = { precio: 'asc' }; break;
      case 'vistas': orderBy = { vistas: 'desc' }; break;
    }

    const anuncios = await prisma.anuncio.findMany({
      where,
      orderBy,
      include: {
        imagenes: { orderBy: { orden: 'asc' }, take: 1 },
        publicaciones: true,
      },
    });

    return NextResponse.json(anuncios);
  } catch (error) {
    console.error('Error en GET /api/anuncios:', error);
    return NextResponse.json({ error: 'Error al cargar anuncios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const slugBase = data.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Date.now()}`;

    const anuncio = await prisma.anuncio.create({
      data: { ...data, slug, estado: 'BORRADOR' },
      include: { imagenes: true, publicaciones: true },
    });

    return NextResponse.json(anuncio, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/anuncios:', error);
    return NextResponse.json({ error: 'Error al crear anuncio' }, { status: 500 });
  }
}
