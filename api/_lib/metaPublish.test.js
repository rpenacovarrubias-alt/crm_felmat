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

  it('publicarFacebookImagenUnica: 200 OK con json.error en el body igual cuenta como fallo', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockFetchOnce({ error: { message: 'Session has expired' } }, true, 200));
    const resultado = await publicarFacebookImagenUnica({ accountId: '123', accessToken: 'expirado', imageUrl: 'https://x/img.jpg', caption: '' });
    expect(resultado).toEqual({ success: false, errorMsg: 'Session has expired' });
  });

  it('publicarFacebookCarrusel: sube cada foto sin publicar y las adjunta en un solo post', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockFetchOnce({ id: 'p1' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'p2' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: '123_789' }));
    const resultado = await publicarFacebookCarrusel({ accountId: '123', accessToken: 'tok', imageUrls: ['https://x/1.jpg', 'https://x/2.jpg'], caption: 'carrusel' });
    expect(resultado).toEqual({ success: true, externalId: '123_789', externalUrl: 'https://www.facebook.com/123_789' });
    expect(global.fetch).toHaveBeenCalledTimes(3);

    const [url0, options0] = global.fetch.mock.calls[0];
    expect(url0).toBe('https://graph.facebook.com/v21.0/123/photos');
    expect(options0.method).toBe('POST');
    const body0 = new URLSearchParams(options0.body);
    expect(body0.get('url')).toBe('https://x/1.jpg');
    expect(body0.get('published')).toBe('false');
    expect(body0.has('caption')).toBe(false);

    const [url1, options1] = global.fetch.mock.calls[1];
    expect(url1).toBe('https://graph.facebook.com/v21.0/123/photos');
    expect(options1.method).toBe('POST');
    const body1 = new URLSearchParams(options1.body);
    expect(body1.get('url')).toBe('https://x/2.jpg');
    expect(body1.get('published')).toBe('false');
    expect(body1.has('caption')).toBe(false);

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
    expect(global.fetch).toHaveBeenCalledTimes(3);

    const [createUrl, createOptions] = global.fetch.mock.calls[0];
    expect(createUrl).toBe('https://graph.facebook.com/v21.0/999/media');
    expect(createOptions.method).toBe('POST');
    const createBody = new URLSearchParams(createOptions.body);
    expect(createBody.get('image_url')).toBe('https://x/img.jpg');
    expect(createBody.get('caption')).toBe('hola ig');
    expect(createBody.get('access_token')).toBe('tok');

    const [publishUrl, publishOptions] = global.fetch.mock.calls[1];
    expect(publishUrl).toBe('https://graph.facebook.com/v21.0/999/media_publish');
    expect(publishOptions.method).toBe('POST');
    const publishBody = new URLSearchParams(publishOptions.body);
    expect(publishBody.get('creation_id')).toBe('creation1');
    expect(publishBody.get('access_token')).toBe('tok');

    const [permalinkUrl, permalinkOptions] = global.fetch.mock.calls[2];
    expect(permalinkUrl).toBe('https://graph.facebook.com/v21.0/media1?fields=permalink&access_token=tok');
    expect(permalinkOptions).toBeUndefined();
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
      .mockResolvedValueOnce(mockFetchOnce({ status_code: 'FINISHED' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'media2' }))
      .mockResolvedValueOnce(mockFetchOnce({ permalink: 'https://www.instagram.com/p/XYZ/' }));
    const resultado = await publicarInstagramCarrusel({ accountId: '999', accessToken: 'tok', imageUrls: ['https://x/1.jpg', 'https://x/2.jpg'], caption: 'carrusel ig' });
    expect(resultado).toEqual({ success: true, externalId: 'media2', externalUrl: 'https://www.instagram.com/p/XYZ/' });
    const carouselCall = global.fetch.mock.calls[2];
    const carouselBody = new URLSearchParams(carouselCall[1].body);
    expect(carouselBody.get('children')).toBe('item1,item2');
    expect(carouselBody.get('media_type')).toBe('CAROUSEL');
  });

  it('publicarInstagramCarrusel: si el contenedor termina en ERROR, no llama a media_publish', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockFetchOnce({ id: 'item1' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'item2' }))
      .mockResolvedValueOnce(mockFetchOnce({ id: 'carousel1' }))
      .mockResolvedValueOnce(mockFetchOnce({ status_code: 'ERROR' }));
    const resultado = await publicarInstagramCarrusel({ accountId: '999', accessToken: 'tok', imageUrls: ['https://x/1.jpg', 'https://x/2.jpg'], caption: 'carrusel ig' });
    expect(resultado.success).toBe(false);
    expect(resultado.errorMsg).toMatch(/no terminó de procesarse/);
    expect(global.fetch).toHaveBeenCalledTimes(4);
    const calledUrls = global.fetch.mock.calls.map((c) => c[0]);
    expect(calledUrls.some((u) => u.includes('media_publish'))).toBe(false);
  });
});
