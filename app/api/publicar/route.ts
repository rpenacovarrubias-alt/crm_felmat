import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { anuncioId, canales } = await request.json();

    if (!anuncioId || !canales || !Array.isArray(canales)) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const anuncio = await prisma.anuncio.findUnique({
      where: { id: anuncioId },
      include: { imagenes: true },
    });

    if (!anuncio) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    const resultados = await Promise.all(
      canales.map(async (canal: string) => {
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

    return NextResponse.json({
      success: true,
      resultados,
      mensaje: 'Publicaciones en proceso',
    });
  } catch (error) {
    console.error('Error en POST /api/publicar:', error);
    return NextResponse.json({ error: 'Error al iniciar publicaciones' }, { status: 500 });
  }
}
