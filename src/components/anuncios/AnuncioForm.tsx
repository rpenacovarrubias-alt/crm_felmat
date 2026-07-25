// ============================================
// FORMULARIO DE ANUNCIO (crear/editar) - admin y airbnb comparten esta página
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  obtenerAnuncio, crearAnuncio, actualizarAnuncio,
  type Anuncio, type ImagenAnuncio,
} from '@/lib/anunciosApi';
import { TIPOS_PROPIEDAD, MODALIDADES } from './ListaAnuncios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Upload, Star, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function generateSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36);
}

function ImagenesUploader({ imagenes, onChange }: { imagenes: ImagenAnuncio[]; onChange: (imgs: ImagenAnuncio[]) => void }) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const nueva: ImagenAnuncio = {
          url: e.target?.result as string,
          esPrincipal: imagenes.length === 0 && index === 0,
        };
        onChange([...imagenes, nueva]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImagen = (idx: number) => {
    const filtradas = imagenes.filter((_, i) => i !== idx);
    if (filtradas.length > 0 && !filtradas.some(i => i.esPrincipal)) filtradas[0].esPrincipal = true;
    onChange(filtradas);
  };

  const setPrincipal = (idx: number) => {
    onChange(imagenes.map((img, i) => ({ ...img, esPrincipal: i === idx })));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <input type="file" multiple accept="image/*" onChange={(e) => handleFiles(e.target.files)} className="hidden" id="anuncio-image-upload" />
        <label htmlFor="anuncio-image-upload" className="cursor-pointer">
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">Arrastra imágenes aquí o haz clic para seleccionar</p>
        </label>
      </div>

      {imagenes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {imagenes.map((img, idx) => (
            <div key={idx} className={cn("relative aspect-square rounded-lg overflow-hidden border-2", img.esPrincipal ? "border-primary" : "border-border")}>
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.esPrincipal && (
                  <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setPrincipal(idx)} title="Establecer como principal">
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeImagen(idx)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {img.esPrincipal && <Badge className="absolute top-2 left-2 bg-primary">Principal</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnuncioForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const modo = location.pathname.startsWith('/airbnb') ? 'airbnb' : 'admin';
  const basePath = modo === 'admin' ? '' : '/airbnb';
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoPropiedad, setTipoPropiedad] = useState('CASA');
  const [modalidadRenta, setModalidadRenta] = useState(modo === 'airbnb' ? 'AIRBNB' : 'SIN_MUEBLES_LP');
  const [colonia, setColonia] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [precio, setPrecio] = useState('');
  const [periodo, setPeriodo] = useState('/mes');
  const [moneda, setMoneda] = useState('MXN');
  const [recamaras, setRecamaras] = useState('1');
  const [banos, setBanos] = useState('1');
  const [destacado, setDestacado] = useState(false);
  const [imagenes, setImagenes] = useState<ImagenAnuncio[]>([]);

  useEffect(() => {
    if (!id) return;
    obtenerAnuncio(id).then((a: Anuncio) => {
      setTitulo(a.titulo);
      setSubtitulo(a.subtitulo || '');
      setDescripcion(a.descripcion || '');
      setTipoPropiedad(a.tipoPropiedad);
      setModalidadRenta(a.modalidadRenta);
      setColonia(a.colonia);
      setCiudad(a.ciudad);
      setPrecio(a.precio.toString());
      setPeriodo(a.periodo);
      setMoneda(a.moneda);
      setRecamaras(a.recamaras.toString());
      setBanos(a.banos.toString());
      setDestacado(a.destacado);
      setImagenes(a.imagenes || []);
      setLoading(false);
    }).catch(() => {
      toast.error('No se pudo cargar el anuncio');
      navigate(`${basePath}/anuncios`);
    });
  }, [id, basePath, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !titulo.trim() || !colonia.trim() || !ciudad.trim()) return;
    setSaving(true);
    try {
      const data: Partial<Anuncio> = {
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
        tipoPropiedad,
        modalidadRenta,
        colonia: colonia.trim(),
        ciudad: ciudad.trim(),
        precio: Number(precio) || 0,
        periodo,
        moneda,
        recamaras: Number(recamaras) || 0,
        banos: Number(banos) || 0,
        destacado,
        imagenes,
      };

      if (isEditing && id) {
        await actualizarAnuncio(id, data);
        toast.success('Anuncio actualizado');
      } else {
        await crearAnuncio({ ...data, agentId: user.id, modo, slug: generateSlug(titulo) });
        toast.success('Anuncio creado como borrador');
      }
      navigate(`${basePath}/anuncios`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar el anuncio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/anuncios`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Editar anuncio' : 'Nuevo anuncio'}</h1>
          <p className="text-muted-foreground text-sm">{modo === 'airbnb' ? 'Anuncio de Airbnb' : 'Anuncio de propiedad'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Información general</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Título *</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Departamento amueblado zona centro" required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Subtítulo</Label>
              <Input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Frase corta destacada (opcional)" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de propiedad</Label>
              <Select value={tipoPropiedad} onValueChange={setTipoPropiedad}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_PROPIEDAD).map(([key, { label }]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Modalidad</Label>
              <Select value={modalidadRenta} onValueChange={setModalidadRenta}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MODALIDADES).map(([key, { label }]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Colonia *</Label>
              <Input value={colonia} onChange={(e) => setColonia(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Ciudad *</Label>
              <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Recámaras</Label>
              <Input type="number" min={0} value={recamaras} onChange={(e) => setRecamaras(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Baños</Label>
              <Input type="number" min={0} value={banos} onChange={(e) => setBanos(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Descripción</Label>
              <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4} />
            </div>
            <div className="flex items-center justify-between sm:col-span-2">
              <Label htmlFor="destacado">Destacado</Label>
              <Switch id="destacado" checked={destacado} onCheckedChange={setDestacado} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Precio</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select value={moneda} onValueChange={setMoneda}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Precio *</Label>
              <Input type="number" min={0} value={precio} onChange={(e) => setPrecio(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Periodo</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="/mes">/mes</SelectItem>
                  <SelectItem value="/noche">/noche</SelectItem>
                  <SelectItem value="total">Precio total</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Imágenes</CardTitle></CardHeader>
          <CardContent>
            <ImagenesUploader imagenes={imagenes} onChange={setImagenes} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(`${basePath}/anuncios`)}>Cancelar</Button>
          <Button type="submit" disabled={saving || !titulo.trim() || !colonia.trim() || !ciudad.trim()}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isEditing ? 'Guardar cambios' : 'Crear anuncio'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AnuncioForm;
