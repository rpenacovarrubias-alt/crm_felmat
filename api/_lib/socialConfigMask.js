// Nunca se regresa un secret/token completo al frontend -- solo un preview
// de los ultimos 4 caracteres, mismo principio que el resto del backend
// nunca expone passwordHash/salt (ver api/_lib/session.js).
export function maskToken(token) {
  if (!token) return null;
  if (token.length <= 4) return '••••';
  return `••••${token.slice(-4)}`;
}

// Decide que escribir para un campo secreto (appSecret/accessToken) en un
// PUT: si la llave no vino en el body, se preserva lo existente (el caller
// ni siquiera toca el campo); si vino como string vacio, se limpia a null;
// si vino con contenido, se usa ese valor. Extraido a funcion pura para
// poder probar la logica sin pegarle a Prisma.
export function secretFieldUpdate(body, key) {
  if (!(key in body)) return { touched: false };
  return { touched: true, value: body[key] || null };
}
