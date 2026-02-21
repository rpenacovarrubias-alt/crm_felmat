import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const original = await prisma.anuncio.findUnique({
      where: { id: params.id },
      include: { imagenes: true },
    });

    if (!original) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
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

    return NextResponse.json(duplicado, { status: 201 });
  } catch (error) {
    console.error('Error al duplicar:', error);
    return NextResponse.json({ error: 'Error al duplicar anuncio' }, { status: 500 });
  }
}
