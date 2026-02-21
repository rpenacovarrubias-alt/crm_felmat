import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const anuncio = await prisma.anuncio.findUnique({
      where: { id: params.id },
      include: {
        imagenes: { orderBy: { orden: 'asc' } },
        publicaciones: true,
      },
    });

    if (!anuncio) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(anuncio);
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar anuncio' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    delete data.id; delete data.createdAt; delete data.updatedAt; delete data.slug;

    const anuncio = await prisma.anuncio.update({
      where: { id: params.id },
      data,
      include: { imagenes: true, publicaciones: true },
    });

    return NextResponse.json(anuncio);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar anuncio' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.anuncio.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar anuncio' }, { status: 500 });
  }
}
