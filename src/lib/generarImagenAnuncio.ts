import html2canvas from 'html2canvas';

// Convierte un nodo del DOM (montado, aunque sea fuera de pantalla) a un
// data URL JPEG de 1080x1080. useCORS: true es necesario porque la foto de
// fondo vive en Vercel Blob, un origen distinto al de la app.
export async function generarImagenAnuncio(nodo: HTMLElement): Promise<string> {
  const canvas = await html2canvas(nodo, {
    width: 1080,
    height: 1080,
    scale: 1,
    useCORS: true,
    backgroundColor: '#0a0a15',
  });
  return canvas.toDataURL('image/jpeg', 0.85);
}
