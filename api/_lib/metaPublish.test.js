import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  publicarFacebookImagenUnica, publicarFacebookCarrusel,
  publicarInstagramImagenUnica, publicarInstagramCarrusel,
} from './metaPublish.js';

function mockFetchOnce(body, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

describe('metaPublish', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('publicarFacebookImagenUnica: éxito construye externalUrl con post_id', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockFetchOnce({ id: 'photo1', post_id: '123_456' }));
    const resultado = await publicarFacebookImagenUnica({ accountId: '123', accessToken: 'tok', imageUrl: 'https://x/img.jpg', caption: 'hola' });
    expect(resultado).toEqual({ success: true, externalId: '123_456', externalUrl: 'https://www.facebook.com/123_456' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v21.0/123/photos');
    expect(options.method).toBe('POST');
    const body = new URLSearchParams(options.body);
    expect(body.get('url')).toBe('https://x/img.jpg');
    expect(body.get('caption')).toBe('hola');
    expect(body.get('access_token')).toBe('tok');
  });

  it('publicarFacebookImagenUnica: error de Meta regresa success false con el mensaje real', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockFetchOnce({ error: { message: 'Invalid OAuth access token' } }, false, 400));
    const resultado = await publicarFacebookImagenUnica({ accountId: '123', accessToken: 'malo', imageUrl: 'https://x/img.jpg', caption: '' });
    expect(resultado).toEqual({ success: false, errorMsg: 'Invalid OAuth access token' });
  });

  it('publicarFacebookCarrusel: sube cada foto sin publicar y las adjunta en un solo post', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockFetchOnce({ id: 'p1' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'p2' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: '123_789' }));
    const resultado = await publicarFacebookCarrusel({ accountId: '123', accessToken: 'tok', imageUrls: ['https://x/1.jpg', 'https://x/2.jpg'], caption: 'carrusel' });
    expect(resultado).toEqual({ success: true, externalId: '123_789', externalUrl: 'https://www.facebook.com/123_789' });
    expect(global.fetch).toHaveBeenCalledTimes(3);
    const feedCall = global.fetch.mock.calls[2];
    expect(feedCall[0]).toBe('https://graph.facebook.com/v21.0/123/feed');
    const feedBody = new URLSearchParams(feedCall[1].body);
    expect(JSON.parse(feedBody.get('attached_media'))).toEqual([{ media_fbid: 'p1' }, { media_fbid: 'p2' }]);
  });

  it('publicarInstagramImagenUnica: crea, publica y obtiene el permalink real', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockFetchOnce({ id: 'creation1' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'media1' }))
      .mockResolvedValueOnce(mockFetchOnce({ permalink: 'https://www.instagram.com/p/ABC123/' }));
    const resultado = await publicarInstagramImagenUnica({ accountId: '999', accessToken: 'tok', imageUrl: 'https://x/img.jpg', caption: 'hola ig' });
    expect(resultado).toEqual({ success: true, externalId: 'media1', externalUrl: 'https://www.instagram.com/p/ABC123/' });
  });

  it('publicarInstagramCarrusel: rechaza con menos de 2 imágenes sin llamar a fetch', async () => {
    global.fetch = vi.fn();
    const resultado = await publicarInstagramCarrusel({ accountId: '999', accessToken: 'tok', imageUrls: ['https://x/1.jpg'], caption: '' });
    expect(resultado.success).toBe(false);
    expect(resultado.errorMsg).toMatch(/entre 2 y 10/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('publicarInstagramCarrusel: crea un item por imagen, agrupa en un contenedor, publica', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockFetchOnce({ id: 'item1' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'item2' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'carousel1' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'media2' }))
      .mockResolvedValueOnce(mockFetchOnce({ permalink: 'https://www.instagram.com/p/XYZ/' }));
    const resultado = await publicarInstagramCarrusel({ accountId: '999', accessToken: 'tok', imageUrls: ['https://x/1.jpg', 'https://x/2.jpg'], caption: 'carrusel ig' });
    expect(resultado).toEqual({ success: true, externalId: 'media2', externalUrl: 'https://www.instagram.com/p/XYZ/' });
    const carouselCall = global.fetch.mock.calls[2];
    const carouselBody = new URLSearchParams(carouselCall[1].body);
    expect(carouselBody.get('children')).toBe('item1,item2');
    expect(carouselBody.get('media_type')).toBe('CAROUSEL');
  });
});
