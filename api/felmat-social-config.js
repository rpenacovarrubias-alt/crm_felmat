import { PrismaClient } from '@prisma/client';
import { getSession, isSuperAdmin } from './_lib/session.js';
import { maskToken, secretFieldUpdate } from './_lib/socialConfigMask.js';

const prisma = new PrismaClient();

const SECTIONS = ['propiedades', 'condominios', 'airbnb'];
const PLATFORMS = ['facebook', 'instagram'];

function toPublic(row, section, platform) {
  if (!row) {
    return { section, platform, enabled: false, appId: null, accountId: null, hasAppSecret: false, accessTokenPreview: null };
  }
  return {
    section: row.section,
    platform: row.platform,
    enabled: row.enabled,
    appId: row.appId,
    accountId: row.accountId,
    hasAppSecret: !!row.appSecret,
    accessTokenPreview: maskToken(row.accessToken),
  };
}

// ponytail: resuelve de quien son las credenciales que se van a leer/escribir.
// Por defecto siempre el propio usuario -- un userId de otra persona solo se
// respeta si quien pide es super_admin (soporte). Nunca se confia en el body
// ni en el query de un usuario normal para esto.
function resolveTargetUserId(session, requestedUserId) {
  if (!requestedUserId || requestedUserId === session.sub) return { userId: session.sub, forbidden: false };
  if (isSuperAdmin(session.role)) return { userId: requestedUserId, forbidden: false };
  return { userId: session.sub, forbidden: true };
}

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'GET') {
    const { section, platform, userId: requestedUserId } = req.query;
    const target = resolveTargetUserId(session, requestedUserId);
    if (target.forbidden) return res.status(403).json({ error: 'forbidden' });

    if (section || platform) {
      if (!SECTIONS.includes(section)) return res.status(400).json({ error: 'invalid_section' });
      if (!PLATFORMS.includes(platform)) return res.status(400).json({ error: 'invalid_platform' });
      const row = await prisma.felmatSocialConfig.findUnique({
        where: { userId_section_platform: { userId: target.userId, section, platform } },
      });
      return res.status(200).json(toPublic(row, section, platform));
    }
    const rows = await prisma.felmatSocialConfig.findMany({ where: { userId: target.userId } });
    return res.status(200).json(rows.map((r) => toPublic(r, r.section, r.platform)));
  }

  if (req.method === 'PUT') {
    const b = req.body ?? {};
    if (!SECTIONS.includes(b.section)) return res.status(400).json({ error: 'invalid_section' });
    if (!PLATFORMS.includes(b.platform)) return res.status(400).json({ error: 'invalid_platform' });

    // Un userId de otro usuario en el body solo se respeta si eres
    // super_admin; para cualquier otro rol se ignora en silencio (se sigue
    // guardando en la fila propia) -- no se rechaza la request por esto.
    const targetUserId = b.userId && isSuperAdmin(session.role) ? b.userId : session.sub;

    // appSecret/accessToken solo se tocan si vienen en el body -- omitirlos
    // conserva el valor guardado, mandar '' los borra. Logica en
    // secretFieldUpdate (api/_lib/socialConfigMask.js) para poder probarla
    // sin Prisma.
    const data = {
      enabled: !!b.enabled,
      appId: b.appId || null,
      accountId: b.accountId || null,
      updatedBy: session.sub,
    };
    const appSecretUpdate = secretFieldUpdate(b, 'appSecret');
    if (appSecretUpdate.touched) data.appSecret = appSecretUpdate.value;
    const accessTokenUpdate = secretFieldUpdate(b, 'accessToken');
    if (accessTokenUpdate.touched) data.accessToken = accessTokenUpdate.value;

    const row = await prisma.felmatSocialConfig.upsert({
      where: { userId_section_platform: { userId: targetUserId, section: b.section, platform: b.platform } },
      update: data,
      create: { userId: targetUserId, section: b.section, platform: b.platform, ...data },
    });
    return res.status(200).json(toPublic(row, row.section, row.platform));
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
