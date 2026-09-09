import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getSession, canAccessProperty } from './_lib/session.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const slug = req.query.slug;
    if (!slug) return res.status(400).json({ error: 'missing_slug' });
    // Lectura publica -- sin sesion. Resuelve el pendiente de origen: alguien
    // sin cuenta en el CRM abre el link y si ve la ficha.
    const share = await prisma.felmatPropertyShare.findUnique({ where: { slug } });
    if (!share) return res.status(404).json({ error: 'not_found' });
    return res.status(200).json(share);
  }

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'POST') {
    const b = req.body ?? {};
    if (!b.propertyId) return res.status(400).json({ error: 'missing_property_id' });

    // No basta con estar autenticado: solo quien tiene acceso a la propiedad
    // (dueno, admin, o acceso asignado) puede generar una ficha para ella --
    // si no, cualquier agente podria crear una ficha con SUS datos de contacto
    // sobre una propiedad ajena.
    const property = await prisma.felmatProperty.findUnique({ where: { id: b.propertyId } });
    if (!property) return res.status(404).json({ error: 'property_not_found' });
    if (!canAccessProperty(session, property)) return res.status(403).json({ error: 'forbidden' });

    const created = await prisma.felmatPropertyShare.create({
      data: {
        slug: `c-${crypto.randomBytes(6).toString('base64url')}`,
        propertyId: b.propertyId,
        createdBy: session.sub,
        overrideName: b.overrideName ?? null,
        overridePhone: b.overridePhone ?? null,
        overrideWhatsapp: b.overrideWhatsapp ?? null,
        overrideEmail: b.overrideEmail ?? null,
        overrideAvatar: b.overrideAvatar ?? null,
        overrideCertificate: b.overrideCertificate ?? null,
        overrideBio: b.overrideBio ?? null,
      },
    });
    return res.status(201).json(created);
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
