import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { requireApiKey } from './_lib/auth.js';

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  const [, contentType, base64] = match;
  return { contentType, buffer: Buffer.from(base64, 'base64') };
}

export default async function handler(req, res) {
  if (!requireApiKey(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsed = parseDataUrl(req.body?.dataUrl);
    if (!parsed) {
      return res.status(400).json({ error: 'dataUrl inválido -- se espera un data URL de imagen en base64' });
    }

    // Corta en '+' (ej. "image/svg+xml" -> "svg") para nunca escribir una
    // extensión inválida como ".svg+xml" en el nombre del blob.
    const ext = parsed.contentType.split('/')[1]?.split('+')[0] || 'jpg';
    const blob = await put(`anuncios/${randomUUID()}.${ext}`, parsed.buffer, {
      access: 'public',
      contentType: parsed.contentType,
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error al subir la imagen' });
  }
}
