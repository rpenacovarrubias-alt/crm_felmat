import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { getSession, isFullAdmin, isSuperAdmin, hashPassword, verifyPassword } from './_lib/session.js';

const prisma = new PrismaClient();

const SAFE_USER_SELECT = {
  id: true, email: true, name: true, lastName: true, phone: true, avatar: true,
  role: true, agencyId: true, isActive: true, propertyAccess: true, config: true,
  lastLogin: true, createdAt: true, updatedAt: true,
};

// Directorio publico: solo lo necesario para mostrar contacto del agente en
// fichas/paginas publicas -- nunca lastLogin, propertyAccess ni estado interno.
const PUBLIC_DIRECTORY_SELECT = {
  id: true, name: true, lastName: true, phone: true, email: true, avatar: true,
  role: true, config: true,
};

function genTempPassword() {
  return crypto.randomBytes(9).toString('base64url');
}

// Solo super_admin puede tocar cuentas admin/super_admin.
function canManageTarget(session, targetRole) {
  if (isSuperAdmin(session.role)) return true;
  if (targetRole === 'admin' || targetRole === 'super_admin') return false;
  return isFullAdmin(session.role);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const session = getSession(req);
    if (session && isFullAdmin(session.role)) {
      const users = await prisma.felmatUser.findMany({ select: SAFE_USER_SELECT, orderBy: { createdAt: 'asc' } });
      return res.status(200).json(users);
    }
    const users = await prisma.felmatUser.findMany({
      where: { isActive: true },
      select: PUBLIC_DIRECTORY_SELECT,
      orderBy: { createdAt: 'asc' },
    });
    return res.status(200).json(users);
  }

  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'POST') {
    if (!isFullAdmin(session.role)) return res.status(403).json({ error: 'forbidden' });
    const b = req.body ?? {};
    if (!b.email || !b.name || !b.lastName || !b.role) return res.status(400).json({ error: 'missing_fields' });
    if (!canManageTarget(session, b.role)) return res.status(403).json({ error: 'forbidden' });

    const tempPassword = genTempPassword();
    const { salt, hash } = hashPassword(tempPassword);

    const created = await prisma.felmatUser.create({
      data: {
        email: b.email.toLowerCase().trim(),
        name: b.name,
        lastName: b.lastName,
        phone: b.phone || null,
        role: b.role,
        agencyId: b.agencyId || null,
        propertyAccess: b.propertyAccess ?? [],
        config: b.config ?? null,
        isActive: b.isActive ?? true,
        passwordHash: hash,
        salt,
      },
      select: SAFE_USER_SELECT,
    });
    return res.status(201).json({ ok: true, user: created, tempPassword });
  }

  if (req.method === 'PUT') {
    const b = req.body ?? {};
    if (!b.id) return res.status(400).json({ error: 'missing_id' });

    const target = await prisma.felmatUser.findUnique({ where: { id: b.id } });
    if (!target) return res.status(404).json({ error: 'not_found' });

    if (b.autoGeneratePassword) {
      if (!isFullAdmin(session.role) || !canManageTarget(session, target.role)) return res.status(403).json({ error: 'forbidden' });
      const tempPassword = genTempPassword();
      const { salt, hash } = hashPassword(tempPassword);
      await prisma.felmatUser.update({ where: { id: b.id }, data: { passwordHash: hash, salt } });
      return res.status(200).json({ ok: true, tempPassword });
    }

    if (b.newPassword) {
      if (b.currentPassword) {
        if (session.sub !== b.id) return res.status(403).json({ error: 'forbidden' });
        if (!verifyPassword(b.currentPassword, target.salt, target.passwordHash)) {
          return res.status(401).json({ error: 'wrong_current_password' });
        }
      } else {
        if (!isFullAdmin(session.role) || !canManageTarget(session, target.role)) return res.status(403).json({ error: 'forbidden' });
      }
      const { salt, hash } = hashPassword(b.newPassword);
      await prisma.felmatUser.update({ where: { id: b.id }, data: { passwordHash: hash, salt } });
      return res.status(200).json({ ok: true });
    }

    if (b.toggleActive) {
      if (!isFullAdmin(session.role) || !canManageTarget(session, target.role)) return res.status(403).json({ error: 'forbidden' });
      const updated = await prisma.felmatUser.update({
        where: { id: b.id },
        data: { isActive: !target.isActive },
        select: SAFE_USER_SELECT,
      });
      return res.status(200).json({ ok: true, user: updated });
    }

    // Autoedicion: el propio usuario puede tocar su perfil basico sin ser
    // admin, pero nunca via este branch su role/isActive/email/agencyId/
    // propertyAccess (escalada de privilegios) -- whitelist explicito.
    const isSelfEdit = b.id === session.sub;
    if (isSelfEdit) {
      const updated = await prisma.felmatUser.update({
        where: { id: b.id },
        data: {
          name: b.name ?? target.name,
          lastName: b.lastName ?? target.lastName,
          phone: b.phone ?? target.phone,
          avatar: b.avatar ?? target.avatar,
          config: b.config ?? target.config,
        },
        select: SAFE_USER_SELECT,
      });
      return res.status(200).json({ ok: true, user: updated });
    }

    if (!isFullAdmin(session.role) || !canManageTarget(session, target.role)) return res.status(403).json({ error: 'forbidden' });
    if (b.role && !canManageTarget(session, b.role)) return res.status(403).json({ error: 'forbidden' });
    const updated = await prisma.felmatUser.update({
      where: { id: b.id },
      data: {
        name: b.name ?? target.name,
        lastName: b.lastName ?? target.lastName,
        email: b.email ? b.email.toLowerCase().trim() : target.email,
        phone: b.phone ?? target.phone,
        role: b.role ?? target.role,
        agencyId: b.agencyId ?? target.agencyId,
        isActive: typeof b.isActive === 'boolean' ? b.isActive : target.isActive,
        propertyAccess: b.propertyAccess ?? target.propertyAccess,
        config: b.config ?? target.config,
        avatar: b.avatar ?? target.avatar,
      },
      select: SAFE_USER_SELECT,
    });
    return res.status(200).json({ ok: true, user: updated });
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'missing_id' });
    if (id === session.sub) return res.status(400).json({ error: 'cannot_delete_self' });
    const target = await prisma.felmatUser.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: 'not_found' });
    if (!isFullAdmin(session.role) || !canManageTarget(session, target.role)) return res.status(403).json({ error: 'forbidden' });
    await prisma.felmatUser.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
