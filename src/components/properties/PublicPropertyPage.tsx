// ============================================
// FICHA PÚBLICA DE PROPIEDAD (ESTILO WIGGOT & COMPARTIBLE)
// ============================================

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProperties, useLeads, useUsers } from '@/hooks/useDatabase';
import type { LeadSource, Property, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize,
  Home,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Check,
  Share2,
  FileDown,
  Copy,
  Phone,
  Mail,
  Calendar,
  Grid,
  ShieldCheck,
  Building,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { exportPropertyToPDF } from '@/lib/pdfExport';
import { PropertyMap } from './PropertyMap';

// Galería de imágenes estilo Hero / Grid Wiggot
function WiggotImageGallery({ images, title }: { images: Property['images']; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const sortedImages = [...images].sort((a, b) => (a.isMain ? -1 : b.isMain ? 1 : 0));
  
  if (sortedImages.length === 0) {
    return (
      <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
        <Home className="w-16 h-16 text-slate-400" />
      </div>
    );
  }

  const mainImage = sortedImages[0];
  const gridImages = sortedImages.slice(1, 5);

  return (
    <>
      {/* Hero Grid Wiggot */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 group">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 h-[340px] sm:h-[420px]">
          {/* Main Large Image */}
          <div 
            className="md:col-span-7 h-full relative cursor-pointer overflow-hidden"
            onClick={() => { setCurrentIndex(0); setLightboxOpen(true); }}
          >
            <img
              src={mainImage.url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 md:opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* 4 Secondary Grid Thumbnails */}
          <div className="hidden md:grid md:col-span-5 grid-cols-2 gap-1.5 h-full">
            {gridImages.map((img, idx) => (
              <div 
                key={img.id || idx}
                className="relative h-[206px] cursor-pointer overflow-hidden"
                onClick={() => { setCurrentIndex(idx + 1); setLightboxOpen(true); }}
              >
                <img
                  src={img.url}
                  alt={`${title} - ${idx + 2}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
              </div>
            ))}
            {/* If fewer than 4 secondary images, fill remaining slot */}
            {gridImages.length < 4 && Array.from({ length: 4 - gridImages.length }).map((_, i) => (
              <div key={i} className="bg-slate-800 flex items-center justify-center text-slate-500">
                <Home className="w-8 h-8 opacity-40" />
              </div>
            ))}
          </div>
        </div>

        {/* View All Photos Overlay Button */}
        <button
          onClick={() => { setCurrentIndex(0); setLightboxOpen(true); }}
          className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-slate-900 font-semibold text-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105"
        >
          <Grid className="w-4 h-4 text-blue-600" />
          Ver todas las fotos ({sortedImages.length})
        </button>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl bg-black/95 text-white border-none p-0 overflow-hidden">
          <div className="relative aspect-video flex items-center justify-center bg-black">
            <img
              src={sortedImages[currentIndex]?.url}
              alt={title}
              className="max-h-[80vh] w-auto object-contain mx-auto"
            />
            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex(prev => (prev === 0 ? sortedImages.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentIndex(prev => (prev === sortedImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs text-white">
              {currentIndex + 1} / {sortedImages.length}
            </div>
          </div>
          <div className="p-4 bg-slate-900 flex gap-2 overflow-x-auto">
            {sortedImages.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                  idx === currentIndex ? "border-blue-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Formulario de Contacto
function LeadContactForm({ propertyId, agentId, onSubmitted }: { propertyId: string; agentId: string; onSubmitted: () => void }) {
  const { create } = useLeads(agentId);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.phone,
        source: 'sitio_web' as LeadSource,
        status: 'nuevo',
        interestedPropertyId: propertyId,
        assignedTo: agentId,
        pipelineStage: 'nuevo',
        score: 75,
      });
      setDone(true);
      onSubmitted();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="p-6 text-center bg-green-50 rounded-xl border border-green-200">
        <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-green-900 text-lg">¡Mensaje Enviado!</h4>
        <p className="text-sm text-green-700 mt-1">El asesor se pondrá en contacto contigo a la brevedad.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700">Nombre completo *</Label>
        <Input
          required
          placeholder="Ej: Juan Pérez"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700">Teléfono / WhatsApp *</Label>
        <Input
          required
          type="tel"
          placeholder="+52 442 123 4567"
          value={formData.phone}
          onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700">Correo electrónico</Label>
        <Input
          type="email"
          placeholder="tu@email.com"
          value={formData.email}
          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700">Mensaje</Label>
        <Textarea
          rows={3}
          placeholder="Hola, me interesa conocer más información de esta propiedad..."
          value={formData.message}
          onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
          className="mt-1 text-sm"
        />
      </div>
      <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl shadow-md" disabled={submitting}>
        {submitting ? 'Enviando...' : 'Enviar mensaje al Asesor'}
      </Button>
    </form>
  );
}

const DEFAULT_DEMO_PROPERTY: Property = {
  id: '05f9f2cf-39d3-41c7-92d7-846e890a7d54',
  title: 'Tu hogar en Corregidora, con posibilidades de ampliar',
  description: `Espaciosa casa de 3 recámaras, 2.5 baños, en 160m² de terreno y 130m² de construcción. Y con grandes posibilidades de ampliación. Con recamaras en la Planta Baja y baño completo.

Tu nuevo hogar te espera en esta propiedad que combina funcionalidad y comodidad. Imagina la practicidad de tener un espacio dedicado para tus tareas diarias.

Espacio y Confort: 3 amplias recámaras para toda la familia y 2.5 baños bien distribuidos, evitando esperas.
Funcionalidad Diaria: Un práctico patio de lavado integrado, pensado para tu conveniencia.
Amplitud: 160m² de terreno te dan espacio para disfrutar al aire libre, mientras que los 130m² de construcción ofrecen un hogar bien aprovechado.

Esta casa es la opción inteligente para quienes buscan un hogar listo para habitar, con espacios pensados para tu día a día.`,
  propertyType: 'casa',
  transactionType: 'venta',
  price: 2700000,
  priceCurrency: 'MXN',
  status: 'disponible',
  location: {
    address: 'Troje de Valparaiso S/N',
    neighborhood: 'Fraccionamiento Las Trojes',
    city: 'Querétaro',
    state: 'Querétaro',
    zipCode: '76900',
    references: 'Cerca de escuelas y plazas comerciales en Corregidora',
  },
  features: {
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 2,
    constructionArea: 130,
    terrainArea: 160,
    floors: 2,
    yearBuilt: 2014,
    amenities: ['Patio de lavado', 'Estacionamiento', 'Cocina equipada', 'Jardín / Patio integral'],
  },
  images: [
    { id: '1', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80', isMain: true, order: 0 },
    { id: '2', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80', isMain: false, order: 1 },
    { id: '3', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80', isMain: false, order: 2 },
    { id: '4', url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&auto=format&fit=crop&q=80', isMain: false, order: 3 },
    { id: '5', url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&auto=format&fit=crop&q=80', isMain: false, order: 4 },
  ],
  agentId: 'mayra-fajer-id',
  slug: '05f9f2cf-39d3-41c7-92d7-846e890a7d54',
  tags: ['LasTrojes', 'Corregidora', 'Venta', 'Oportunidad'],
  views: 124,
  leadsCount: 5,
  favoritesCount: 12,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPublished: true,
  isFeatured: true,
};

// Componente Principal de Ficha Pública
export function PublicPropertyPage() {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const identifier = slug || id || '';
  
  const { getBySlug, incrementViews } = useProperties();
  const { users } = useUsers();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (identifier) {
        const found = await getBySlug(identifier);
        if (found) {
          setProperty(found);
          incrementViews(found.id);
          const foundAgent = users.find(u => u.id === found.agentId);
          setAgent(foundAgent || null);
        } else {
          setProperty({
            ...DEFAULT_DEMO_PROPERTY,
            id: identifier,
            slug: identifier,
          });
        }
      } else {
        setProperty(DEFAULT_DEMO_PROPERTY);
      }
      setLoading(false);
    }
    loadData();
  }, [identifier, users]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Home className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Propiedad no disponible</h1>
        <p className="text-slate-500 max-w-md mb-6">
          La propiedad que buscas no existe o ha sido dada de baja del catálogo.
        </p>
        <Button asChild className="bg-blue-700 hover:bg-blue-800">
          <Link to="/login">Ir a Inicio</Link>
        </Button>
      </div>
    );
  }

  // Asesor por defecto (Mayra Fajer) si no se especifica agente en DB
  const agentName = agent ? `${agent.name} ${agent.lastName}` : 'Mayra Fajer';
  const agentRole = agent?.config?.bio || 'Asesor Inmobiliario de Grupo FELMAT';
  const agentPhone = agent?.phone || '442 124 9613';
  const agentEmail = agent?.email || 'diversainmobiliariosqueretaro@gmail.com';
  const agentAvatar = agent?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80';

  const shareUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `🏠 *${property.title}*\n💰 Precio: $${property.price.toLocaleString('es-MX')} ${property.priceCurrency}\n📍 Ubicación: ${property.location.city}, ${property.location.neighborhood || ''}\n\n📋 Ver ficha completa:\n${shareUrl}\n\n👤 Asesor: ${agentName} (${agentPhone})`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleMessengerShare = () => {
    window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      await exportPropertyToPDF({
        property,
        agent,
        showAgentData: true,
      });
    } catch (err) {
      console.error('Error al descargar PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header Institucional */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xl">F</span>
            </div>
            <div>
              <span className="font-extrabold text-blue-900 text-lg tracking-tight">GRUPO FELMAT</span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Servicios Inmobiliarios</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-slate-50 border-slate-200">
              ID: {property.slug || property.id.slice(0, 8)}
            </Badge>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/login" className="text-slate-600 hover:text-blue-700 text-xs">Acceso Agentes</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Barra Multicanal de Compartido */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Share2 className="w-4 h-4 text-blue-600" />
            <span>Compartir Ficha Técnica:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleWhatsAppShare}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl h-9 shadow-sm"
            >
              🟢 WhatsApp
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs rounded-xl h-9"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? '¡Copiado!' : 'Copiar Link'}
            </Button>
            <Button
              onClick={handleMessengerShare}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 font-medium text-xs rounded-xl h-9"
            >
              🔵 Messenger
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="bg-slate-900 hover:bg-black text-white font-medium text-xs rounded-xl h-9 shadow-sm"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              {downloadingPdf ? 'Generando PDF...' : 'Descargar PDF (.pdf)'}
            </Button>
          </div>
        </div>

        {/* Galería Hero Rejilla Wiggot */}
        <WiggotImageGallery images={property.images} title={property.title} />

        {/* Layout Principal 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          
          {/* Columna Izquierda (Información Detallada) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Título, Badges y Ubicación */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs uppercase px-3 py-1">
                  {property.transactionType === 'venta' ? 'En Venta' : property.transactionType === 'renta' ? 'En Renta' : 'Venta / Renta'}
                </Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-semibold text-xs capitalize">
                  {property.propertyType}
                </Badge>
                <Badge variant="outline" className="border-slate-300 text-slate-600 text-xs">
                  Estado: Bueno
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                {property.title}
              </h1>

              <p className="text-slate-600 text-sm flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                {property.location.address}, {property.location.neighborhood || ''}, {property.location.city}, {property.location.state}
              </p>
            </div>

            {/* Precio */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Precio de publicación</p>
                <p className="text-3xl sm:text-4xl font-black text-white mt-1">
                  ${property.price.toLocaleString('es-MX')} <span className="text-lg font-normal text-blue-200">{property.priceCurrency}</span>
                </p>
              </div>
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 text-xs">
                Disponibilidad Inmediata
              </Badge>
            </div>

            {/* Detalles Rápidos (Iconos Wiggot) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-slate-200 shadow-sm rounded-xl">
                <CardContent className="p-4 text-center">
                  <Bed className="w-6 h-6 mx-auto mb-1.5 text-blue-600" />
                  <p className="text-2xl font-black text-slate-900">{property.features.bedrooms}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recámaras</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm rounded-xl">
                <CardContent className="p-4 text-center">
                  <Bath className="w-6 h-6 mx-auto mb-1.5 text-blue-600" />
                  <p className="text-2xl font-black text-slate-900">{property.features.bathrooms}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Baños completos</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm rounded-xl">
                <CardContent className="p-4 text-center">
                  <Car className="w-6 h-6 mx-auto mb-1.5 text-blue-600" />
                  <p className="text-2xl font-black text-slate-900">{property.features.parkingSpaces}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estacionamientos</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm rounded-xl">
                <CardContent className="p-4 text-center">
                  <Maximize className="w-6 h-6 mx-auto mb-1.5 text-blue-600" />
                  <p className="text-2xl font-black text-slate-900">{property.features.constructionArea}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">m² Construcción</p>
                </CardContent>
              </Card>
            </div>

            {/* Descripción */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Descripción del Inmueble
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {property.description || 'Sin descripción detallada.'}
              </p>
            </div>

            {/* Cuadro de Detalles Completos */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Detalles del inmueble</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block">Tipo</span>
                  <span className="font-bold text-slate-900 capitalize">{property.propertyType}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block">Superficie Terreno</span>
                  <span className="font-bold text-slate-900">{property.features.terrainArea || 160} m²</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block">Construcción</span>
                  <span className="font-bold text-slate-900">{property.features.constructionArea} m²</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block">Pisos</span>
                  <span className="font-bold text-slate-900">{property.features.floors || 2}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block">Recámaras</span>
                  <span className="font-bold text-slate-900">{property.features.bedrooms}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block">Baños</span>
                  <span className="font-bold text-slate-900">{property.features.bathrooms}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block">Estacionamiento</span>
                  <span className="font-bold text-slate-900">{property.features.parkingSpaces}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold block">Antigüedad</span>
                  <span className="font-bold text-slate-900">{property.features.yearBuilt ? (new Date().getFullYear() - property.features.yearBuilt) + ' años' : '12 años'}</span>
                </div>
              </div>
            </div>

            {/* Amenidades */}
            {property.features.amenities.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Amenidades e Instalaciones</h3>
                <div className="flex flex-wrap gap-2">
                  {property.features.amenities.map(amenity => (
                    <Badge key={amenity} variant="secondary" className="bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 text-xs rounded-lg font-medium">
                      ✓ {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ubicación y Mapa */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Ubicación
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                {property.location.address}, {property.location.neighborhood || ''}, {property.location.city}, {property.location.state}
              </p>
              {property.location.references && (
                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700 mb-4 border border-slate-200">
                  <strong>Referencias:</strong> {property.location.references}
                </div>
              )}
              <div className="h-64 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                <PropertyMap property={property} />
              </div>
            </div>

          </div>

          {/* Columna Derecha Sticky (Asesor Inmobiliario & Formulario) */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-6">
              
              {/* Card del Asesor */}
              <Card className="border-slate-200 shadow-md rounded-2xl overflow-hidden bg-white">
                <div className="bg-gradient-to-r from-blue-900 to-blue-700 h-16 p-4" />
                <CardContent className="pt-0 p-6 relative">
                  <div className="-mt-12 mb-4 flex items-end justify-between">
                    <img
                      src={agentAvatar}
                      alt={agentName}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                    />
                    <Badge className="bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1">
                      Asesor Certificado
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">{agentName}</h3>
                    <p className="text-xs text-blue-700 font-semibold">{agentRole}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Grupo FELMAT Servicios Inmobiliarios</p>
                  </div>

                  <div className="space-y-2 mt-5">
                    <Button
                      onClick={handleWhatsAppShare}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Contactar por WhatsApp
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setContactDialogOpen(true)}
                      className="w-full border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold py-2.5 rounded-xl"
                    >
                      <Mail className="w-4 h-4 mr-2 text-blue-700" />
                      Enviar Correo / Solicitud
                    </Button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{agentPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{agentEmail}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Banner de Descarga PDF */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <FileDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">¿Deseas la Ficha en PDF?</h4>
                    <p className="text-xs text-slate-400">Descarga la ficha de 4 páginas lista para imprimir.</p>
                  </div>
                </div>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-xl mt-3"
                >
                  {downloadingPdf ? 'Generando...' : 'Descargar Ficha en PDF'}
                </Button>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center text-white font-bold text-sm">
              F
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">GRUPO FELMAT</p>
              <p className="text-xs text-slate-500">© 2026 Grupo FELMAT. Todos los derechos reservados.</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Ficha de propiedad pública generada por CRM FELMAT
          </p>
        </div>
      </footer>

      {/* Dialog para Contacto */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Solicitar Información</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Envía tus datos y el asesor <strong className="text-slate-800">{agentName}</strong> se comunicará contigo.
            </DialogDescription>
          </DialogHeader>
          <LeadContactForm
            propertyId={property.id}
            agentId={property.agentId}
            onSubmitted={() => setTimeout(() => setContactDialogOpen(false), 2000)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PublicPropertyPage;
