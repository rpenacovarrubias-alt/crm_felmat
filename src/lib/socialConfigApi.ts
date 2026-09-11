export type SocialSection = 'propiedades' | 'condominios' | 'airbnb';
export type SocialPlatform = 'facebook' | 'instagram';

export interface SocialConfig {
  section: SocialSection;
  platform: SocialPlatform;
  enabled: boolean;
  appId: string | null;
  accountId: string | null;
  hasAppSecret: boolean;
  accessTokenPreview: string | null;
}

export interface SaveSocialConfigInput {
  section: SocialSection;
  platform: SocialPlatform;
  enabled: boolean;
  appId: string;
  accountId: string;
  appSecret?: string;
  accessToken?: string;
  userId?: string;
}

import { apiFetch } from '@/utils/apiFetch';

async function parseOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export async function getSocialConfig(section: SocialSection, platform: SocialPlatform, userId?: string): Promise<SocialConfig> {
  const qs = new URLSearchParams({ section, platform });
  if (userId) qs.set('userId', userId);
  const res = await apiFetch(`/api/felmat-social-config?${qs.toString()}`);
  return parseOrThrow<SocialConfig>(res);
}

export async function listSocialConfigs(userId?: string): Promise<SocialConfig[]> {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await apiFetch(`/api/felmat-social-config${qs}`);
  return parseOrThrow<SocialConfig[]>(res);
}

export async function saveSocialConfig(input: SaveSocialConfigInput): Promise<SocialConfig> {
  const res = await apiFetch('/api/felmat-social-config', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return parseOrThrow<SocialConfig>(res);
}
