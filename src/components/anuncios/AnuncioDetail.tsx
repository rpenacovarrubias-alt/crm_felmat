// ============================================
// DETALLE DE ANUNCIO
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  obtenerAnuncio, publicarAnuncio, eliminarAnuncio, duplicarAnuncio,
  type Anuncio,
} from '@/lib/anunciosApi';
import { TIPOS_PROPIEDAD, MODALIDADES } from './ListaAnuncios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft, Edit, Trash2, Share2, Copy, MapPin, BedDouble, Bath,
  Eye, Image as ImageIcon, Loader2, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador', REVISION: 'En Revisión', PUBLICADO: 'Publicado',
  PAUSADO: 'Pausado', EXPIRADO: 'Expirado', ARCHIVADO: 'Archivado',
};

const CANALES = ['WEB', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE_BUSINESS'];
const CANAL_LABELS: Record<string, string> = {
  WEB: 'Web', FACEBOOK: 'Facebook', INSTAGRAM: 'Instagram', GOOGLE_BUSINESS: 'Google Business',
};

export function AnuncioDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const modo = location.pathname.startsWith('/airbnb') ? 'airbnb' : 'admin';
  const basePath = modo === 'admin' ? '' : '/airbnb';

  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicando, setPublicando] = useState(false);

  const cargar = () => {
    if (!id) return;
    obtenerAnuncio(id)
      .then(setAnuncio)
      .catch(() => toast.error('No se pudo cargar el anuncio'))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, [id]);

  const handleEliminar = async () => {
    if (!anuncio || !confirm('¿Eliminar este anuncio?')) return;
    try {
      await eliminarAnuncio(anuncio.id);
      toast.success('Anuncio eliminado');
      navigate(`${basePath}/anuncios`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar');
    }
  };

  const handleDuplicar = async () => {
    if (!anuncio) return;
    try {
      const nuevo = await duplicarAnuncio(anuncio.id);
      toast.success('Anuncio duplicado');
      navigate(`${basePath}/anuncios/${nuevo.id}/editar`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al duplicar');
    }
  };

  const handlePublicarCanal = async (canal: string) => {
    if (!anuncio) return;
    setPublicando(true);
    try {
      await publicarAnuncio(anuncio.id, [canal]);
      toast.success(`Publicación en ${CANAL_LABELS[canal]} iniciada`);
      cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al publicar');
    } finally {
      setPublicando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!anuncio) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Anuncio no encontrado.
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate(`${basePath}/anuncios`)}>Volver</Button>
        </div>
      </div>
    );
  }

  const principal = anuncio.imagenes.find(i => i.esPrincipal) || anuncio.imagenes[0];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(`${basePath}/anuncios`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{anuncio.titulo}</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />{anuncio.colonia}, {anuncio.ciudad}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`${basePath}/anuncios/${anuncio.id}/editar`)}>
            <Edit className="w-4 h-4 mr-2" />Editar
          </Button>
          <Button variant="outline" onClick={handleDuplicar}>
            <Copy className="w-4 h-4 mr-2" />Duplicar
          </Button>
          <Button variant="destructive" onClick={handleEliminar}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-muted">
              {principal ? (
                <img src={principal.url} alt={anuncio.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
            </div>
          </Card>

          {anuncio.imagenes.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {anuncio.imagenes.map((img, i) => (
                <div key={i} className="aspect-square rounded overflow-hidden bg-muted">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {anuncio.descripcion && (
            <Card><CardContent className="p-4 text-sm whitespace-pre-wrap">{anuncio.descripcion}</CardContent></Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <Badge>{ESTADO_LABELS[anuncio.estado]}</Badge>
              <p className="text-2xl font-bold text-primary">
                ${anuncio.precio.toLocaleString('es-MX')} {anuncio.moneda} {anuncio.periodo}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{anuncio.recamaras}</span>
                <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{anuncio.banos}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{anuncio.vistas} vistas</span>
                <span>{anuncio.contactos} contactos</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-medium mb-2 flex items-center gap-2"><Share2 className="w-4 h-4" />Canales de publicación</p>
              {CANALES.map(canal => {
                const pub = anuncio.publicaciones.find(p => p.canal === canal);
                const publicado = pub?.estado === 'PUBLICADO';
                const pendiente = pub?.estado === 'PENDIENTE';
                return (
                  <div key={canal} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {publicado && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                      {CANAL_LABELS[canal]}
                    </span>
                    {publicado ? (
                      <span className="text-xs text-green-600">Publicado</span>
                    ) : pendiente ? (
                      <span className="text-xs text-amber-600">Pendiente</span>
                    ) : (
                      <Button size="sm" variant="ghost" disabled={publicando} onClick={() => handlePublicarCanal(canal)}>
                        Publicar
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AnuncioDetail;
