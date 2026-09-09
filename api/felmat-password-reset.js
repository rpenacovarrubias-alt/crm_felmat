import { PrismaClient } from '@prisma/client';
import { hashPassword, signResetToken, verifyResetToken } from './_lib/session.js';

const prisma = new PrismaClient();

const NOTIFY_WEBHOOK = 'https://chatbotventas-n8n.h0w0dc.easypanel.host/webhook/felmat-restablecer-contrasena';
const APP_URL = 'https://crm-felmat.vercel.app';

function isNumericOnly(s) {
  return /^\d+$/.test(s);
}
function validatePasswordStrength(pw) {
  if (!pw) return 'missing_password';
  if (isNumericOnly(pw)) {
    if (pw.length < 4) return 'weak_password';
  } else if (pw.length < 8) {
    return 'weak_password';
  }
  return null;
}

async function handleForgot(email, res) {
  const user = await prisma.felmatUser.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Respuesta generica siempre -- no revelar si el correo existe o no.
  if (user && user.isActive) {
    const token = signResetToken(user.id);
    const resetUrl = `${APP_URL}/restablecer?token=${encodeURIComponent(token)}`;
    // Hay que esperar este fetch: sin await, Vercel puede congelar la funcion
    // antes de que el correo salga aunque la respuesta ya sea 200.
    // Atrapamos cualquier fallo (incluyendo rechazos a nivel de red) para
    // nunca romper la respuesta generica 200 {ok:true}.
    try {
      await fetch(NOTIFY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, email: user.email, resetUrl }),
      });
    } catch {
      // ponytail: fallo de red al webhook no debe filtrar si el correo existe
    }
  }

  return res.status(200).json({ ok: true });
}

async function handleReset(token, newPassword, res) {
  const userId = verifyResetToken(token);
  if (!userId) return res.status(401).json({ error: 'invalid_or_expired_token' });

  const pwError = validatePasswordStrength(newPassword);
  if (pwError) return res.status(400).json({ error: pwError });

  const { salt, hash } = hashPassword(newPassword);
  try {
    await prisma.felmatUser.update({ where: { id: userId }, data: { passwordHash: hash, salt } });
  } catch {
    return res.status(404).json({ error: 'not_found' });
  }
  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const body = req.body ?? {};
  if (body.token || body.newPassword) {
    if (!body.token || !body.newPassword) return res.status(400).json({ error: 'missing_fields' });
    return handleReset(body.token, body.newPassword, res);
  }

  if (!body.email) return res.status(400).json({ error: 'missing_email' });
  return handleForgot(body.email, res);
}
