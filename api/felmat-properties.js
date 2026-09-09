import { PrismaClient } from '@prisma/client';
import { getSession, isFullAdmin, canAccessProperty, canEditProperty, canDeleteProperty } from './_lib/session.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const lookup = req.query.id || req.query.slug;
    const session = getSession(req);

    if (lookup) {
      const property = await prisma.felmatProperty.findFirst({ where: { OR: [{ id: lookup }, { slug: lookup }] } });
      if (!property) return res.status(404).json({ error: 'not_found' });
      if (!session) {
        if (!property.isPublished) return res.status(404).json({ error: 'not_found' });
        return res.status(200).json(property);
      }
      if (!canAccessProperty(session, property)) return res.status(403).json({ error: 'forbidden' });
      return res.status(200).json(property);
    }

    if (!session) return res.status(401).json({ error: 'unauthorized' });
    let where;
    if (isFullAdmin(session.role)) {
      where = req.query.agentId ? { agentId: req.query.agentId } : {};
    } else {
      where = { OR: [{ agentId: session.sub }, { id: { in: session.propertyAccess ?? [] } }] };
    }
    const properties = await prisma.felmatProperty.findMany({ where, orderBy: { createdAt: 'desc' } });
    return res.status(200).json(properties);
  }

  if (req.method === 'PUT' && req.body && req.body.incrementViews) {
    const id = req.body.id;
    if (!id) return res.status(400).json({ error: 'missing_id' });
    // ponytail: same not_found for missing vs unpublished, same as GET's public path -- avoids leaking draft existence
    const updated = await prisma.felmatProperty
      .update({
        where: { id, isPublished: true },
        data: { views: { increment: 1 } },
        select: { id: true, views: true },
      })
      .catch(() => null);
    if (!updated) return res.status(404).json({ error: 'not_found' });
    return res.status(200).json({ ok: true, views: updated.views });
  }

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'POST') {
    const b = req.body ?? {};
    if (!b.title || !b.slug || !b.propertyType || !b.transactionType || b.price == null) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    const agentId = isFullAdmin(session.role) && b.agentId ? b.agentId : session.sub;
    const created = await prisma.felmatProperty.create({
      data: {
        title: b.title,
        description: b.description || '',
        propertyType: b.propertyType,
        transactionType: b.transactionType,
        price: b.price,
        priceCurrency: b.priceCurrency || 'MXN',
        maintenanceFee: b.maintenanceFee ?? null,
        status: b.status || 'disponible',
        location: b.location ?? {},
        features: b.features ?? {},
        images: b.images ?? [],
        agentId,
        agencyId: b.agencyId ?? null,
        slug: b.slug,
        metaTitle: b.metaTitle ?? null,
        metaDescription: b.metaDescription ?? null,
        tags: b.tags ?? [],
        isPublished: b.isPublished ?? false,
        isFeatured: b.isFeatured ?? false,
        commission: b.commission ?? null,
        commissionType: b.commissionType ?? null,
        publishedAt: b.isPublished ? new Date() : null,
      },
    });
    return res.status(201).json(created);
  }

  if (req.method === 'PUT') {
    const b = req.body ?? {};
    if (!b.id) return res.status(400).json({ error: 'missing_id' });
    const existing = await prisma.felmatProperty.findUnique({ where: { id: b.id } });
    if (!existing) return res.status(404).json({ error: 'not_found' });
    if (!canEditProperty(session, existing)) return res.status(403).json({ error: 'forbidden' });

    // ponytail: whitelist -- mirrors POST's field list, keeps agentId/views/leadsCount/
    // favoritesCount/createdAt/updatedAt/id out of reach of mass assignment
    const data = {};
    const EDITABLE_FIELDS = [
      'title', 'description', 'propertyType', 'transactionType', 'price', 'priceCurrency',
      'maintenanceFee', 'status', 'location', 'features', 'images', 'agencyId', 'slug',
      'metaTitle', 'metaDescription', 'tags', 'isPublished', 'isFeatured', 'commission', 'commissionType',
    ];
    for (const field of EDITABLE_FIELDS) {
      if (field in b) data[field] = b[field];
      else data[field] = existing[field];
    }
    if (data.isPublished && !existing.isPublished) data.publishedAt = new Date();
    const updated = await prisma.felmatProperty.update({ where: { id: b.id }, data });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'missing_id' });
    const existing = await prisma.felmatProperty.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'not_found' });
    if (!canDeleteProperty(session, existing)) return res.status(403).json({ error: 'forbidden' });
    await prisma.felmatProperty.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
