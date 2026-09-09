import { PrismaClient } from '@prisma/client';
import { getSession, isFullAdmin } from './_lib/session.js';

const prisma = new PrismaClient();

const NOTIFY_WEBHOOK = 'https://chatbotventas-n8n.h0w0dc.easypanel.host/webhook/felmat-enviar-credenciales';
const LOGIN_URL = 'https://crm-felmat.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const session = getSession(req);
  if (!session || !isFullAdmin(session.role)) return res.status(403).json({ error: 'forbidden' });

  const { userId, tempPassword } = req.body ?? {};
  if (!userId || !tempPassword) return res.status(400).json({ error: 'missing_fields' });

  const user = await prisma.felmatUser.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'not_found' });

  // Hay que esperar este fetch -- mismo motivo que en felmat-password-reset.js.
  try {
    const webhookRes = await fetch(NOTIFY_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: user.name, email: user.email, password: tempPassword, loginUrl: LOGIN_URL }),
    });
    if (!webhookRes.ok) return res.status(502).json({ error: 'webhook_failed' });
  } catch {
    // ponytail: network-level fetch failure (DNS, connection refused, TLS error, timeout, etc.)
    return res.status(502).json({ error: 'webhook_failed' });
  }

  return res.status(200).json({ ok: true });
}
