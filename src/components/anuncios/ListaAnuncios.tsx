'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Share2,
  MapPin, BedDouble, Bath, CheckCircle2, XCircle, Clock,
  AlertCircle, Image as ImageIcon, Facebook, Instagram,
  Globe, MapPinned, Grid, List, RefreshCw, Copy, Loader2, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Imagen { url: string; esPrincipal: boolean; orden?: number; }
interface Publicacion { canal: string; estado: string; externalUrl?: string; publicadoAt?: string; }
interface Anuncio {
  id: string; titulo: string; subtitulo?: string; slug: string;
  tipoPropiedad: string; modalidadRenta: string; colonia: string; ciudad: string;
  precio: number; periodo: string; moneda: string;
  estado: 'BORRADOR' | 'REVISION' | 'PUBLICADO' | 'PAUSADO' | 'EXPIRADO' | 'ARCHIVADO';
  destacado: boolean; recamaras: number; banos: number;
  createdAt: string; updatedAt: string; fechaPublicacion?: string;
  imagenes: Imagen[]; publicaciones: Publicacion[];
  vistas: number; contactos: number;
  _count?: { publicaciones: number; };
}

const TIPOS_PROPIEDAD: Record<string, { label: string; color: string }> = {
  CASA: { label: 'Casa', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  DEPARTAMENTO: { label: 'Departamento', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  LOFT: { label: 'Loft', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  ESTUDIO: { label: 'Estudio', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  VILLA: { label: 'Villa', color: 'bg-green-100 text-green-800 border-green-200' },
  LOCAL: { label: 'Local', color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

const MODALIDADES: Record<string, { label: string; color: string }> = {
  AIRBNB: { label: 'Airbnb', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  AMUEBLADA_LP: { label: 'Amueblada LP', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  SIN_MUEBLES_LP: { label: 'Sin Muebles LP', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  TEMPORAL: { label: 'Temporal', color: 'bg-amber-100 text-amber-800 border-amber-200' },
};

const ESTADOS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock },
  REVISION: { label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle },
  PUBLICADO: { label: 'Publicado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  PAUSADO: { label: 'Pausado', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock },
  EXPIRADO: { label: 'Expirado', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  ARCHIVADO: { label: 'Archivado', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Trash2 },
};

const CANALES: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  WEB: { label: 'Web', icon: Globe, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  FACEBOOK: { label: 'Facebook', icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  INSTAGRAM: { label: 'Instagram', icon: Instagram, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  GOOGLE_BUSINESS: { label: 'Google Business', icon: MapPinned, color: 'text-red-600', bgColor: 'bg-red-50' },
};

export default function ListaAnuncios({ modo = 'admin' }: { modo?: 'admin' | 'airbnb' }) {
  const router = useNavigate();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filters, setFilters] = useState({
    busqueda: '', estado: '', tipo: '', modalidad: '', ordenar: 'recientes',
  });
  const [anuncioEliminar, setAnuncioEliminar] = useState<Anuncio | null>(null);
  const [anuncioPublicar, setAnuncioPublicar] = useState<Anuncio | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const basePath = modo === 'admin' ? '/admin/condominios' : '/airbnb';

  const cargarAnuncios = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.modalidad) params.append('modalidad', filters.modalidad);
      if (filters.busqueda) params.append('q', filters.busqueda);
      if (filters.ordenar) params.append('ordenar', filters.ordenar);

      const response = await fetch(`/api/anuncios?${params.toString()}`);
      if (!response.ok) throw new Error('Error en la respuesta');
      const data = await response.json();
      setAnuncios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando anuncios:', error);
      toast.error('Error al cargar anuncios');
      setAnuncios([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { cargarAnuncios(); }, [cargarAnuncios]);

  useEffect(() => {
    const timer = setTimeout(() => { if (filters.busqueda !== undefined) cargarAnuncios(); }, 500);
    return () => clearTimeout(timer);
  }, [filters.busqueda, cargarAnuncios]);

  const handleEliminar = async () => {
    if (!anuncioEliminar) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/anuncios/${anuncioEliminar.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Anuncio eliminado correctamente');
        setAnuncios(prev => prev.filter(a => a.id !== anuncioEliminar.id));
        setAnuncioEliminar(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar');
      }
    } catch (error) { toast.error('Error al eliminar');
    } finally { setIsDeleting(false); }
  };

  const handleDuplicar = async (anuncio: Anuncio) => {
    try {
      const response = await fetch(`/api/anuncios/${anuncio.id}/duplicar`, { method: 'POST' });
      if (response.ok) {
        const nuevo = await response.json();
        toast.success('Anuncio duplicado');
        navigate(`${basePath}/anuncios/${nuevo.id}/editar`);
      } else { toast.error('Error al duplicar'); }
    } catch (error) { toast.error('Error al duplicar'); }
  };

  const handlePublicar = async (canales: string[]) => {
    if (!anuncioPublicar) return;
    setIsPublishing(true);
    try {
      const response = await fetch('/api/publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anuncioId: anuncioPublicar.id, canales }),
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.mensaje || 'Publicación iniciada');
        setAnuncioPublicar(null);
        cargarAnuncios();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al publicar');
      }
    } catch (error) { toast.error('Error al publicar');
    } finally { setIsPublishing(false); }
  };

  const getEstadoPublicacion = (anuncio: Anuncio, canal: string) => {
    const pub = anuncio.publicaciones?.find(p => p.canal === canal);
    if (!pub) return { estado: 'no_publicado', label: 'No publicado', color: 'bg-gray-200', textColor: 'text-gray-400' };
    const estados: Record<string, { color: string; textColor: string; label: string }> = {
      PUBLICADO: { color: 'bg-green-500', textColor: 'text-green-600', label: 'Publicado' },
      PENDIENTE: { color: 'bg-yellow-400', textColor: 'text-yellow-600', label: 'Pendiente' },
      ERROR: { color: 'bg-red-500', textColor: 'text-red-600', label: 'Error' },
    };
    return { estado: pub.estado.toLowerCase(), ...estados[pub.estado] || { color: 'bg-gray-400', textColor: 'text-gray-500', label: pub.estado } };
  };

  const formatPrice = (precio: number, moneda: string = 'MXN', periodo: string = '/mes') => {
    try { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(precio) + ' ' + periodo;
    } catch { return `$${precio} ${periodo}`; }
  };

  const getEstadoConfig = (estado: string) => ESTADOS[estado] || ESTADOS['BORRADOR'];
  const getTipoConfig = (tipo: string) => TIPOS_PROPIEDAD[tipo] || { label: tipo, color: 'bg-gray-100 text-gray-800' };
  const getModalidadConfig = (modalidad: string) => MODALIDADES[modalidad] || { label: modalidad, color: 'bg-gray-100 text-gray-800' };

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {anuncios.map((anuncio) => {
        const estadoConfig = getEstadoConfig(anuncio.estado);
        const EstadoIcon = estadoConfig.icon;
        return (
          <Card key={anuncio.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white">
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
              {anuncio.imagenes?.length > 0 ? (
                <img src={anuncio.imagenes[0].url} alt={anuncio.titulo} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50"><ImageIcon className="w-12 h-12" /></div>
              )}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <Badge className={cn("border shadow-sm", estadoConfig.color)}><EstadoIcon className="w-3 h-3 mr-1" />{estadoConfig.label}</Badge>
                {anuncio.destacado && <Badge className="bg-amber-500 text-white border-amber-500 shadow-sm">⭐ Destacado</Badge>}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white font-bold text-lg">{formatPrice(anuncio.precio, anuncio.moneda, anuncio.periodo)}</p>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(`${basePath}/anuncios/${anuncio.id}`)}><Eye className="mr-2 h-4 w-4" />Ver detalle</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`${basePath}/anuncios/${anuncio.id}/editar`)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicar(anuncio)}><Copy className="mr-2 h-4 w-4" />Duplicar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setAnuncioPublicar(anuncio)}><Share2 className="mr-2 h-4 w-4" />Publicar en...</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => setAnuncioEliminar(anuncio)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex gap-2 mb-3 flex-wrap">
                <Badge variant="outline" className={cn("text-xs", getTipoConfig(anuncio.tipoPropiedad).color)}>{getTipoConfig(anuncio.tipoPropiedad).label}</Badge>
                <Badge variant="outline" className={cn("text-xs", getModalidadConfig(anuncio.modalidadRenta).color)}>{getModalidadConfig(anuncio.modalidadRenta).label}</Badge>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm leading-tight">{anuncio.titulo}</h3>
              <p className="text-sm text-gray-500 mb-3 flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{anuncio.colonia}, {anuncio.ciudad}</span></p>
              <div className="flex gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1"><BedDouble className="w-4 h-4 text-gray-400" />{anuncio.tipoPropiedad === 'ESTUDIO' ? 'Estudio' : `${anuncio.recamaras || 0} rec.`}</span>
                <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-gray-400" />{anuncio.banos || 0} baños</span>
              </div>
              <div className="flex gap-2 mb-3">
                {Object.keys(CANALES).map((canal) => {
                  const pub = getEstadoPublicacion(anuncio, canal);
                  const CanalIcon = CANALES[canal].icon;
                  return (
                    <div key={canal} className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors", pub.estado === 'publicado' ? "bg-green-100 border-green-500" : "bg-gray-50 border-gray-200")} title={`${CANALES[canal].label}: ${pub.label}`}>
                      <CanalIcon className={cn("w-4 h-4", pub.estado === 'publicado' ? pub.textColor : "text-gray-400")} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                <div className="flex gap-3">
                  <span className="flex items-center gap-1" title="Vistas"><Eye className="w-3 h-3" /> {anuncio.vistas || 0}</span>
                  <span className="flex items-center gap-1" title="Contactos"><span className="text-xs">📞</span> {anuncio.contactos || 0}</span>
                </div>
                <span className="text-gray-400">{anuncio.createdAt ? format(new Date(anuncio.createdAt), 'dd MMM yyyy', { locale: es }) : '-'}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const ListView = () => (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="w-[80px] font-semibold">Imagen</TableHead>
            <TableHead className="font-semibold">Anuncio</TableHead>
            <TableHead className="font-semibold">Precio</TableHead>
            <TableHead className="font-semibold">Estado</TableHead>
            <TableHead className="font-semibold">Canales</TableHead>
            <TableHead className="font-semibold">Stats</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {anuncios.map((anuncio) => {
            const estadoConfig = getEstadoConfig(anuncio.estado);
            const EstadoIcon = estadoConfig.icon;
            return (
              <TableRow key={anuncio.id} className="group hover:bg-gray-50/80 transition-colors">
                <TableCell>
                  <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {anuncio.imagenes?.length > 0 ? <img src={anuncio.imagenes[0].url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-6 h-6" /></div>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[300px]">
                    <p className="font-medium text-gray-900 line-clamp-1 text-sm">{anuncio.titulo}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium border", getTipoConfig(anuncio.tipoPropiedad).color)}>{getTipoConfig(anuncio.tipoPropiedad).label}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{anuncio.colonia}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell><p className="font-semibold text-gray-900 text-sm">{formatPrice(anuncio.precio, anuncio.moneda, anuncio.periodo)}</p></TableCell>
                <TableCell><Badge className={cn("border", estadoConfig.color)}><EstadoIcon className="w-3 h-3 mr-1" />{estadoConfig.label}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1.5">
                    {Object.keys(CANALES).map((canal) => {
                      const pub = getEstadoPublicacion(anuncio, canal);
                      const CanalIcon = CANALES[canal].icon;
                      return (
                        <div key={canal} className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors", pub.estado === 'publicado' ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50")} title={`${CANALES[canal].label}: ${pub.label}`}>
                          <CanalIcon className={cn("w-3.5 h-3.5", pub.estado === 'publicado' ? pub.textColor : "text-gray-400")} />
                        </div>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="flex items-center gap-1"><Eye className="w-3 h-3 text-gray-400" /><span className="font-medium">{anuncio.vistas || 0}</span><span className="text-gray-400 text-xs">vistas</span></p>
                    <p className="flex items-center gap-1"><span className="text-xs">📞</span><span className="font-medium">{anuncio.contactos || 0}</span><span className="text-gray-400 text-xs">contactos</span></p>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-gray-900" onClick={() => navigate(`${basePath}/anuncios/${anuncio.id}`)} title="Ver detalle"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-blue-600" onClick={() => navigate(`${basePath}/anuncios/${anuncio.id}/editar`)} title="Editar"><Edit className="h-4 w-4" /></Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDuplicar(anuncio)}><Copy className="mr-2 h-4 w-4" />Duplicar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAnuncioPublicar(anuncio)}><Share2 className="mr-2 h-4 w-4" />Publicar en...</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => setAnuncioEliminar(anuncio)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const activeFiltersCount = [filters.estado, filters.tipo, filters.modalidad].filter(Boolean).length;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anuncios de Propiedades</h1>
          <p className="text-gray-500 mt-1">Gestiona y publica tus anuncios en múltiples canales</p>
        </div>
        <Button onClick={() => navigate(`${basePath}/anuncios/nuevo`)} className="bg-[#B8922A] hover:bg-[#8B6E1F] text-white shadow-md hover:shadow-lg transition-all"><Plus className="mr-2 h-4 w-4" />Crear Anuncio</Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar por título, colonia, ciudad..." value={filters.busqueda} onChange={(e) => setFilters({ ...filters, busqueda: e.target.value })} className="pl-10 h-10" />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant={showFilters ? "secondary" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2"><Filter className="h-4 w-4" />Filtros{activeFiltersCount > 0 && <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFiltersCount}</Badge>}</Button>
            <div className="flex border rounded-lg overflow-hidden">
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="rounded-none h-10 w-10"><List className="h-4 w-4" /></Button>
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="rounded-none h-10 w-10"><Grid className="h-4 w-4" /></Button>
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={cargarAnuncios}><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></Button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
            <Select value={filters.estado} onValueChange={(v) => setFilters({ ...filters, estado: v })}><SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value=" ">Todos los estados</SelectItem>{Object.entries(ESTADOS).map(([key, { label }]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
            <Select value={filters.tipo} onValueChange={(v) => setFilters({ ...filters, tipo: v })}><SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Tipo de propiedad" /></SelectTrigger><SelectContent><SelectItem value=" ">Todos los tipos</SelectItem>{Object.entries(TIPOS_PROPIEDAD).map(([key, { label }]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
            <Select value={filters.modalidad} onValueChange={(v) => setFilters({ ...filters, modalidad: v })}><SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Modalidad" /></SelectTrigger><SelectContent><SelectItem value=" ">Todas las modalidades</SelectItem>{Object.entries(MODALIDADES).map(([key, { label }]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
            <Select value={filters.ordenar} onValueChange={(v) => setFilters({ ...filters, ordenar: v })}><SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Ordenar por" /></SelectTrigger><SelectContent><SelectItem value="recientes">Más recientes</SelectItem><SelectItem value="antiguos">Más antiguos</SelectItem><SelectItem value="precio_alto">Precio: Mayor a menor</SelectItem><SelectItem value="precio_bajo">Precio: Menor a mayor</SelectItem><SelectItem value="vistas">Más vistos</SelectItem></SelectContent></Select>
            {activeFiltersCount > 0 && <Button variant="ghost" size="sm" onClick={() => setFilters({ busqueda: '', estado: '', tipo: '', modalidad: '', ordenar: 'recientes' })} className="text-gray-500 hover:text-gray-700">Limpiar filtros</Button>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16"><Loader2 className="h-10 w-10 animate-spin text-[#B8922A] mb-4" /><p className="text-gray-500">Cargando anuncios...</p></div>
      ) : anuncios.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 rounded-xl border border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><ImageIcon className="h-10 w-10 text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay anuncios</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">{filters.busqueda || filters.estado || filters.tipo || filters.modalidad ? 'No se encontraron anuncios con los filtros seleccionados. Intenta con otros criterios.' : 'Comienza creando tu primer anuncio para publicar en múltiples canales.'}</p>
          <Button onClick={() => navigate(`${basePath}/anuncios/nuevo`)} className="bg-[#B8922A] hover:bg-[#8B6E1F] text-white"><Plus className="mr-2 h-4 w-4" />Crear Anuncio</Button>
        </div>
      ) : (
        <><div className="flex items-center justify-between text-sm text-gray-500"><p>Mostrando {anuncios.length} anuncio{anuncios.length !== 1 ? 's' : ''}</p></div>{viewMode === 'grid' ? <GridView /> : <ListView />}</>
      )}

      <Dialog open={!!anuncioEliminar} onOpenChange={() => !isDeleting && setAnuncioEliminar(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-red-500" />¿Eliminar anuncio?</DialogTitle><DialogDescription>Esta acción no se puede deshacer. El anuncio <strong>"{anuncioEliminar?.titulo}"</strong> se eliminará permanentemente.</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setAnuncioEliminar(null)} disabled={isDeleting}>Cancelar</Button><Button variant="destructive" onClick={handleEliminar} disabled={isDeleting}>{isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}{isDeleting ? 'Eliminando...' : 'Eliminar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!anuncioPublicar} onOpenChange={() => !isPublishing && setAnuncioPublicar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-[#B8922A]" />Publicar en canales</DialogTitle><DialogDescription>Selecciona los canales donde deseas publicar <strong>"{anuncioPublicar?.titulo}"</strong></DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {Object.entries(CANALES).map(([key, { label, icon: Icon, color, bgColor }]) => {
              const pub = anuncioPublicar ? getEstadoPublicacion(anuncioPublicar, key) : null;
              const isPublished = pub?.estado === 'publicado';
              return (
                <button key={key} onClick={() => !isPublished && !isPublishing && handlePublicar([key])} disabled={isPublished || isPublishing} className={cn("flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden", isPublished ? "border-green-500 bg-green-50/50 cursor-default" : "border-gray-200 hover:border-[#B8922A] hover:bg-[#F5EDD8]/30")}>
                  <div className={cn("p-2 rounded-lg", isPublished ? "bg-green-100" : bgColor)}><Icon className={cn("h-5 w-5", isPublished ? "text-green-600" : color)} /></div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-gray-900">{label}</p><p className={cn("text-xs", isPublished ? "text-green-600 font-medium" : "text-gray-500")}>{isPublished ? '✓ Publicado' : 'Click para publicar'}</p></div>
                  {isPublished && <CheckCircle2 className="h-5 w-5 text-green-500 absolute top-2 right-2" />}
                </button>
              );
            })}
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row"><Button variant="outline" onClick={() => setAnuncioPublicar(null)} disabled={isPublishing} className="w-full sm:w-auto">Cancelar</Button><Button onClick={() => handlePublicar(Object.keys(CANALES))} disabled={isPublishing} className="bg-[#B8922A] hover:bg-[#8B6E1F] text-white w-full sm:w-auto">{isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}{isPublishing ? 'Publicando...' : 'Publicar en Todos'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
