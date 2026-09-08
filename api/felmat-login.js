import { PrismaClient } from '@prisma/client';
import { verifyPassword, signSession } from './_lib/session.js';

const prisma = new PrismaClient();

const SAFE_USER_SELECT = {
  id: true, email: true, name: true, lastName: true, phone: true, avatar: true,
  role: true, agencyId: true, isActive: true, propertyAccess: true, config: true,
  lastLogin: true, createdAt: true, updatedAt: true,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ result: 'method_not_allowed' });

  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ result: 'missing_fields' });

  const found = await prisma.felmatUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!found) return res.status(200).json({ result: 'not_found' });
  if (!found.isActive) return res.status(200).json({ result: 'inactive' });
  // Nunca hay cuentas "abiertas": si aun no le llega su password temporal,
  // el login falla en vez de dejarla entrar sin contrasena (a diferencia de cohost).
  if (!found.passwordHash || !found.salt) return res.status(200).json({ result: 'no_password_set' });

  if (!verifyPassword(password, found.salt, found.passwordHash)) {
    return res.status(200).json({ result: 'wrong_password' });
  }

  const updated = await prisma.felmatUser.update({
    where: { id: found.id },
    data: { lastLogin: new Date() },
    select: SAFE_USER_SELECT,
  });

  const token = signSession({ sub: updated.id, role: updated.role, propertyAccess: updated.propertyAccess });
  return res.status(200).json({ result: 'ok', user: updated, token });
}
