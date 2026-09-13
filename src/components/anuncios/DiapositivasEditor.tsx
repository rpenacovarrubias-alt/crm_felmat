import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Trash2, Upload, Loader2, Plus } from 'lucide-react';
import { compressImageToDataUrl } from '@/lib/imageCompression';
import { subirImagenAnuncio, type ImagenAnuncio } from '@/lib/anunciosApi';
import { generarImagenAnuncio } from '@/lib/generarImagenAnuncio';
import { PlantillaCondominios, type ContactoPlantilla } from './templates/PlantillaCondominios';
import { toast } from 'sonner';

const MAX_DIAPOSITIVAS = 10;

interface DiapositivasEditorProps {
  slides: ImagenAnuncio[];
  onChange: (update: ImagenAnuncio[] | ((prev: ImagenAnuncio[]) => ImagenAnuncio[])) => void;
  contacto: ContactoPlantilla;
}

export function DiapositivasEditor({ slides, onChange, contacto }: DiapositivasEditorProps) {
  const [generandoIdx, setGenerandoIdx] = useState<number | null>(null);
  const renderRef = useRef<HTMLDivElement>(null);
  // Serializa las composiciones: si se dispara una segunda composición
  // mientras la primera sigue esperando su timer/html2canvas, el portal
  // offscreen ya habría cambiado de diapositiva y html2canvas capturaría
  // la diapositiva equivocada. Encolar garantiza una composición a la vez.
  const colaRef = useRef<Promise<void>>(Promise.resolve());

  // Usa el updater funcional de onChange (siempre setImagenes de useState en
  // AnuncioForm) en vez de un snapshot `baseSlides` -- así el merge final
  // siempre parte del estado más reciente sin importar cuánto tarde
  // componer() (300ms + html2canvas + upload), evitando que se pise texto
  // que el usuario siguió editando mientras tanto.
  //
  // `fotoUrl` SÍ se recibe explícito (no `slides[idx]?.url`): handleFoto
  // llama a componer() en el mismo tick que su propio onChange(nuevas),
  // antes de que React vuelva a renderizar -- leer `slides` aquí adentro
  // seguiría cerrando sobre el array viejo (sin la foto recién subida) y
  // la composición se saltaría siempre en la primera foto de una
  // diapositiva nueva.
  const componer = async (idx: number, fotoUrl: string) => {
    if (!fotoUrl) return;
    const ejecutar = async () => {
      setGenerandoIdx(idx);
      try {
        // Se monta la plantilla real fuera de pantalla (vía portal a renderRef)
        // y se espera un frame para que la imagen de fondo cargue antes de
        // capturar -- si no, html2canvas puede capturar el fondo vacío.
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (!renderRef.current) return;
        const dataUrl = await generarImagenAnuncio(renderRef.current);
        const { url } = await subirImagenAnuncio(dataUrl);
        onChange((prev) => prev.map((s, i) => (i === idx ? { ...s, imagenCompuestaUrl: url } : s)));
      } catch (error) {
        toast.error('No se pudo componer la diapositiva. Intenta de nuevo.');
      } finally {
        setGenerandoIdx(null);
      }
    };
    colaRef.current = colaRef.current.then(ejecutar);
    await colaRef.current;
  };

  const handleFoto = async (idx: number, file: File) => {
    try {
      const dataUrl = await compressImageToDataUrl(file);
      const { url } = await subirImagenAnuncio(dataUrl);
      const nuevas = slides.map((s, i) => (i === idx ? { ...s, url, imagenCompuestaUrl: '' } : s));
      onChange(nuevas);
      await componer(idx, url);
    } catch (error) {
      toast.error('No se pudo subir la foto. Intenta de nuevo.');
    }
  };

  const handleTextoBlur = (idx: number) => {
    componer(idx, slides[idx]?.url || '');
  };

  const actualizarCampo = (idx: number, campo: 'headline' | 'subtitulo', valor: string) => {
    onChange(slides.map((s, i) => (i === idx ? { ...s, [campo]: valor } : s)));
  };

  const agregar = () => {
    if (slides.length >= MAX_DIAPOSITIVAS) return;
    onChange([...slides, { url: '', esPrincipal: slides.length === 0, headline: '', subtitulo: '', imagenCompuestaUrl: '' }]);
  };

  const eliminar = (idx: number) => {
    const nuevas = slides.filter((_, i) => i !== idx);
    if (nuevas.length > 0 && !nuevas.some((s) => s.esPrincipal)) nuevas[0].esPrincipal = true;
    onChange(nuevas);
  };

  const mover = (idx: number, dir: -1 | 1) => {
    const destino = idx + dir;
    if (destino < 0 || destino >= slides.length) return;
    const nuevas = [...slides];
    [nuevas[idx], nuevas[destino]] = [nuevas[destino], nuevas[idx]];
    onChange(nuevas);
  };

  const slideGenerando = generandoIdx !== null ? slides[generandoIdx] : null;

  return (
    <div className="space-y-4">
      {slides.map((slide, idx) => (
        <Card key={idx}>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
            <div className="space-y-2">
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted">
                {generandoIdx === idx ? (
                  <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : slide.imagenCompuestaUrl ? (
                  <img src={slide.imagenCompuestaUrl} alt="" className="w-full h-full object-cover" />
                ) : slide.url ? (
                  <img src={slide.url} alt="" className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Upload className="w-6 h-6" /></div>
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFoto(idx, e.target.files[0])}
              />
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label>Encabezado</Label>
                <Input
                  value={slide.headline || ''}
                  onChange={(e) => actualizarCampo(idx, 'headline', e.target.value)}
                  onBlur={() => handleTextoBlur(idx)}
                  placeholder="Ej: Acceso digital, control total"
                />
              </div>
              <div className="space-y-1">
                <Label>Subtítulo</Label>
                <Input
                  value={slide.subtitulo || ''}
                  onChange={(e) => actualizarCampo(idx, 'subtitulo', e.target.value)}
                  onBlur={() => handleTextoBlur(idx)}
                  placeholder="Ej: Llave digital y videoportero desde tu celular"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" size="icon" disabled={idx === 0} onClick={() => mover(idx, -1)}><ArrowUp className="w-4 h-4" /></Button>
                <Button type="button" variant="outline" size="icon" disabled={idx === slides.length - 1} onClick={() => mover(idx, 1)}><ArrowDown className="w-4 h-4" /></Button>
                <Button type="button" variant="destructive" size="icon" onClick={() => eliminar(idx)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={agregar} disabled={slides.length >= MAX_DIAPOSITIVAS}>
        <Plus className="w-4 h-4 mr-2" />Agregar diapositiva ({slides.length}/{MAX_DIAPOSITIVAS})
      </Button>

      {/* Montaje fuera de pantalla para capturar con html2canvas -- ver componer() */}
      {slideGenerando &&
        createPortal(
          <div style={{ position: 'fixed', top: -9999, left: -9999 }}>
            <div ref={renderRef}>
              <PlantillaCondominios
                fotoUrl={slideGenerando.url}
                headline={slideGenerando.headline || ''}
                subtitulo={slideGenerando.subtitulo || ''}
                contacto={contacto}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default DiapositivasEditor;
