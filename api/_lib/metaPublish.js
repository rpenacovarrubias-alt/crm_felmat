const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function graphPost(pathSegment, params, accessToken) {
  const body = new URLSearchParams({ ...params, access_token: accessToken });
  const res = await fetch(`${GRAPH_BASE}/${pathSegment}`, { method: 'POST', body });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Error de Meta (${res.status})`);
  }
  return json;
}

async function graphGet(pathSegment, params, accessToken) {
  const qs = new URLSearchParams({ ...params, access_token: accessToken });
  const res = await fetch(`${GRAPH_BASE}/${pathSegment}?${qs}`);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Error de Meta (${res.status})`);
  }
  return json;
}

async function obtenerPermalinkInstagram(mediaId, accessToken) {
  try {
    const info = await graphGet(mediaId, { fields: 'permalink' }, accessToken);
    return info.permalink || null;
  } catch {
    return null;
  }
}

export async function publicarFacebookImagenUnica({ accountId, accessToken, imageUrl, caption }) {
  try {
    const result = await graphPost(`${accountId}/photos`, { url: imageUrl, caption }, accessToken);
    const externalId = result.post_id || result.id;
    return { success: true, externalId, externalUrl: `https://www.facebook.com/${externalId}` };
  } catch (error) {
    return { success: false, errorMsg: error.message };
  }
}

export async function publicarFacebookCarrusel({ accountId, accessToken, imageUrls, caption }) {
  try {
    const photoIds = [];
    for (const imageUrl of imageUrls) {
      const foto = await graphPost(`${accountId}/photos`, { url: imageUrl, published: 'false' }, accessToken);
      photoIds.push(foto.id);
    }
    const attachedMedia = JSON.stringify(photoIds.map((id) => ({ media_fbid: id })));
    const post = await graphPost(`${accountId}/feed`, { message: caption, attached_media: attachedMedia }, accessToken);
    return { success: true, externalId: post.id, externalUrl: `https://www.facebook.com/${post.id}` };
  } catch (error) {
    return { success: false, errorMsg: error.message };
  }
}

export async function publicarInstagramImagenUnica({ accountId, accessToken, imageUrl, caption }) {
  try {
    const creado = await graphPost(`${accountId}/media`, { image_url: imageUrl, caption }, accessToken);
    const publicado = await graphPost(`${accountId}/media_publish`, { creation_id: creado.id }, accessToken);
    const permalink = await obtenerPermalinkInstagram(publicado.id, accessToken);
    return { success: true, externalId: publicado.id, externalUrl: permalink || 'https://www.instagram.com/' };
  } catch (error) {
    return { success: false, errorMsg: error.message };
  }
}

export async function publicarInstagramCarrusel({ accountId, accessToken, imageUrls, caption }) {
  if (imageUrls.length < 2 || imageUrls.length > 10) {
    return { success: false, errorMsg: 'Instagram requiere entre 2 y 10 imágenes para un carrusel' };
  }
  try {
    const itemIds = [];
    for (const imageUrl of imageUrls) {
      const item = await graphPost(`${accountId}/media`, { image_url: imageUrl, is_carousel_item: 'true' }, accessToken);
      itemIds.push(item.id);
    }
    const carrusel = await graphPost(`${accountId}/media`, { media_type: 'CAROUSEL', children: itemIds.join(','), caption }, accessToken);
    const publicado = await graphPost(`${accountId}/media_publish`, { creation_id: carrusel.id }, accessToken);
    const permalink = await obtenerPermalinkInstagram(publicado.id, accessToken);
    return { success: true, externalId: publicado.id, externalUrl: permalink || 'https://www.instagram.com/' };
  } catch (error) {
    return { success: false, errorMsg: error.message };
  }
}
