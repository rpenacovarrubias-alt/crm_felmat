// Guard mínimo de autenticación para las rutas de Anuncios.
// No es autenticación real de usuario (el CRM no tiene sesiones server-side
// todavía) - es un secreto compartido para evitar que la API quede totalmente
// pública/abierta a cualquiera en internet. El cliente lo envía vía
// Authorization: Bearer <ANUNCIOS_API_KEY> (ver src/lib/anunciosApi.ts).
export function requireApiKey(req, res) {
  const expected = process.env.ANUNCIOS_API_KEY;
  if (!expected) {
    res.status(500).json({ error: 'ANUNCIOS_API_KEY no está configurada en el servidor' });
    return false;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (token !== expected) {
    res.status(401).json({ error: 'No autorizado' });
    return false;
  }

  return true;
}
