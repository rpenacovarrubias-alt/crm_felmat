// Redimensiona a un máximo de 1600px por lado y reexporta como JPEG calidad
// 0.82 -- una foto de celular de varios MB queda en unos cientos de KB.
// Evita re-topar el límite de ~4.5MB por request de las funciones de Vercel
// (bug real ya corregido una vez en fotos de propiedad).
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.82;

export function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas_unsupported')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('image_load_failed'));
    img.src = URL.createObjectURL(file);
  });
}
