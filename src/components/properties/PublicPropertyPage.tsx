// ============================================
// FICHA PÚBLICA DE PROPIEDAD (PARA CLIENTES)
// ============================================

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProperties, useLeads } from '@/hooks/useDatabase';
import type { LeadSource } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';

// Galería de imágenes
function ImageGallery({ images }: { images: { id: string; url: string; isMain: boolean }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sortedImages = [...images].sort((a, b) => (a.isMain ? -1 : b.isMain ? 1 : 0));
  
  if (sortedImages.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
        <Home className="w-20 h-20 text-muted-foreground" />
      </div>
    );
  }

  const mainImage = sortedImages[currentIndex];

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-muted rounded-xl overflow-hidden">
        <img
          src={mainImage.url}
          alt="Property"
          className="w-full h-full object-cover"
        />
        
        {sortedImages.length > 1 && (
          <>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              onClick={() => setCurrentIndex(prev => prev === 0 ? sortedImages.length - 1 : prev - 1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              onClick={() => setCurrentIndex(prev => prev === sortedImages.length - 1 ? 0 : prev + 1)}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {sortedImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors",
                    idx === currentIndex ? "bg-white" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
        
        <Badge className="absolute top-4 right-4 bg-black/70 text-sm">
          {currentIndex + 1} / {sortedImages.length}
        </Badge>
      </div>

      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-colors",
                idx === currentIndex ? "border-primary" : "border-transparent"
              )}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Formulario de contacto
function ContactForm({ 
  propertyId, 
  agentId, 
  onSubmit 
}: { 
  propertyId: string; 
  agentId: string;
  onSubmit: () => void;
}) {
  const { create } = useLeads(agentId);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        source: 'sitio_web' as LeadSource,
        status: 'nuevo',
        interestedPropertyId: propertyId,
        assignedTo: agentId,
        pipelineStage: 'nuevo',
        score: 70,
      });
      setSubmitted(true);
      onSubmit();
    } catch (error) {
      console.error('Error creating lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">¡Mensaje enviado!</h3>
        <p className="text-muted-foreground">
          El agente se pondrá en contacto contigo pronto.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre completo *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Tu nombre"
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Correo electrónico *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="tu@email.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="+52 55 1234 5678"
        />
      </div>
      <div>
        <Label htmlFor="message">Mensaje</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Estoy interesado en esta propiedad..."
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
      </Button>
    </form>
  );
}

// Componente principal de ficha pública
export function PublicPropertyPage() {
  const { slug } = useParams<{ slug: string }>();
  const { properties, incrementViews, getBySlug } = useProperties();
  const [property, setProperty] = useState<typeof properties[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const loadProperty = async () => {
      if (slug) {
        const found = await getBySlug(slug);
        setProperty(found);
        if (found) {
          incrementViews(found.id);
        }
      }
      setLoading(false);
    };
    loadProperty();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!property || !property.isPublished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Home className="w-20 h-20 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Propiedad no encontrada</h1>
        <p className="text-muted-foreground text-center max-w-md">
          La propiedad que buscas no está disponible o ha sido eliminada.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return 'bg-green-500';
      case 'reservado': return 'bg-yellow-500';
      case 'vendido': return 'bg-blue-500';
      case 'rentado': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'disponible': 'Disponible',
      'reservado': 'Reservado',
      'vendido': 'Vendido',
      'rentado': 'Rentado',
    };
    return labels[status] || status;
  };

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'venta': 'En Venta',
      'renta': 'En Renta',
      'venta_renta': 'Venta o Renta',
    };
    return labels[type] || type;
  };

  const whatsappMessage = `Hola, estoy interesado en la propiedad: ${property.title}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <span className="font-bold text-blue-700 text-lg">GRUPO FELMAT</span>
              <p className="text-xs text-muted-foreground">Bienes Raíces</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/login">Acceso Agentes</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Inicio</span>
          <ChevronRight className="w-4 h-4" />
          <span>Propiedades</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground truncate max-w-xs">{property.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <ImageGallery images={property.images} />

            {/* Title & Price */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn("text-white", getStatusColor(property.status))}>
                  {getStatusLabel(property.status)}
                </Badge>
                <Badge variant="outline">
                  {getTransactionLabel(property.transactionType)}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {property.location.address}, {property.location.neighborhood}, {property.location.city}
              </p>
            </div>

            {/* Price */}
            <div className="bg-primary/5 rounded-xl p-6">
              <p className="text-4xl font-bold text-primary">
                ${property.price.toLocaleString('es-MX')}
              </p>
              <p className="text-muted-foreground">{property.priceCurrency}</p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Bed className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{property.features.bedrooms}</p>
                  <p className="text-sm text-muted-foreground">Recámaras</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Bath className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{property.features.bathrooms}</p>
                  <p className="text-sm text-muted-foreground">Baños</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Car className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{property.features.parkingSpaces}</p>
                  <p className="text-sm text-muted-foreground">Estacionamientos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Maximize className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{property.features.constructionArea}</p>
                  <p className="text-sm text-muted-foreground">m²</p>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Descripción</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {property.features.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Amenidades</h2>
                <div className="flex flex-wrap gap-2">
                  {property.features.amenities.map(amenity => (
                    <Badge key={amenity} variant="secondary" className="text-sm py-1 px-3">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Location details */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Ubicación</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Ciudad:</span>
                  <span className="ml-2 font-medium">{property.location.city}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <span className="ml-2 font-medium">{property.location.state}</span>
                </div>
                {property.location.zipCode && (
                  <div>
                    <span className="text-muted-foreground">C.P.:</span>
                    <span className="ml-2 font-medium">{property.location.zipCode}</span>
                  </div>
                )}
              </div>
              {property.location.references && (
                <p className="mt-4 text-muted-foreground">
                  <span className="font-medium text-foreground">Referencias:</span>{' '}
                  {property.location.references}
                </p>
              )}
            </div>
          </div>

          {/* Right column - Contact */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">¿Te interesa esta propiedad?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Contacta al agente para más información o agenda una visita.
                  </p>
                  <div className="space-y-3">
                    <Button className="w-full" onClick={() => setContactOpen(true)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Enviar mensaje
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {property.tags.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-2">Etiquetas</h4>
                    <div className="flex flex-wrap gap-2">
                      {property.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <div>
                <p className="font-bold text-blue-700">GRUPO FELMAT</p>
                <p className="text-xs text-muted-foreground">Bienes Raíces</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Grupo FELMAT. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contactar agente</DialogTitle>
            <DialogDescription>
              Completa tus datos y el agente se pondrá en contacto contigo.
            </DialogDescription>
          </DialogHeader>
          <ContactForm 
            propertyId={property.id} 
            agentId={property.agentId}
            onSubmit={() => setContactOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PublicPropertyPage;
