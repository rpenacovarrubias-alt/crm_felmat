// prisma/seed-super-admin.js
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../api/_lib/session.js';

const prisma = new PrismaClient();

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME || 'Admin';
const lastName = process.env.SEED_ADMIN_LASTNAME || '';

if (!email || !password) {
  console.error('Faltan SEED_ADMIN_EMAIL y/o SEED_ADMIN_PASSWORD en el entorno.');
  process.exit(1);
}

const { salt, hash } = hashPassword(password);
const normalizedEmail = email.toLowerCase().trim();

const user = await prisma.felmatUser.upsert({
  where: { email: normalizedEmail },
  update: { passwordHash: hash, salt, role: 'super_admin', isActive: true },
  create: {
    email: normalizedEmail,
    name,
    lastName,
    role: 'super_admin',
    isActive: true,
    passwordHash: hash,
    salt,
  },
});

console.log(`super_admin listo: ${user.email} (id: ${user.id})`);
await prisma.$disconnect();
