// Nunca se regresa un secret/token completo al frontend -- solo un preview
// de los ultimos 4 caracteres, mismo principio que el resto del backend
// nunca expone passwordHash/salt (ver api/_lib/session.js).
export function maskToken(token) {
  if (!token) return null;
  return `••••${token.slice(-4)}`;
}
