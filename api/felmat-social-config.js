import { PrismaClient } from '@prisma/client';
import { getSession } from './_lib/session.js';
import { maskToken } from './_lib/socialConfigMask.js';

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

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  if (req.method === 'GET') {
    const { section, platform } = req.query;
    if (section || platform) {
      if (!SECTIONS.includes(section)) return res.status(400).json({ error: 'invalid_section' });
      if (!PLATFORMS.includes(platform)) return res.status(400).json({ error: 'invalid_platform' });
      const row = await prisma.felmatSocialConfig.findUnique({ where: { section_platform: { section, platform } } });
      return res.status(200).json(toPublic(row, section, platform));
    }
    const rows = await prisma.felmatSocialConfig.findMany();
    return res.status(200).json(rows.map((r) => toPublic(r, r.section, r.platform)));
  }

  if (req.method === 'PUT') {
    const b = req.body ?? {};
    if (!SECTIONS.includes(b.section)) return res.status(400).json({ error: 'invalid_section' });
    if (!PLATFORMS.includes(b.platform)) return res.status(400).json({ error: 'invalid_platform' });

    // ponytail: appSecret/accessToken solo se tocan si vienen en el body --
    // omitirlos conserva el valor guardado, mandar '' los borra. Esto evita
    // que el formulario tenga que re-mandar el secret completo cada vez que
    // el usuario solo cambia el switch de "enabled".
    const data = {
      enabled: !!b.enabled,
      appId: b.appId ?? null,
      accountId: b.accountId ?? null,
      updatedBy: session.sub,
    };
    if ('appSecret' in b) data.appSecret = b.appSecret || null;
    if ('accessToken' in b) data.accessToken = b.accessToken || null;

    const row = await prisma.felmatSocialConfig.upsert({
      where: { section_platform: { section: b.section, platform: b.platform } },
      update: data,
      create: { section: b.section, platform: b.platform, ...data },
    });
    return res.status(200).json(toPublic(row, row.section, row.platform));
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
