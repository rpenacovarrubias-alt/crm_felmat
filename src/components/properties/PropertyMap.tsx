// ============================================
// MAPA DE PROPIEDAD - Google Maps Embed
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { MapPin, Navigation, ExternalLink, Copy, Check } from 'lucide-react';

interface PropertyMapProps {
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  country?: string;
  className?: string;
}

export function PropertyMap({ 
  address, 
  city, 
  state, 
  zipCode = '', 
  country = 'México',
  className 
}: PropertyMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Construir dirección completa
  const fullAddress = `${address}, ${city}, ${state}${zipCode ? ` ${zipCode}` : ''}, ${country}`;

  // URL de Google Maps Embed dinámico (sin API key): busca la dirección real
  // en vez de un lugar fijo. Antes esto apuntaba siempre al Zócalo de CDMX
  // sin importar la propiedad -- pb= era un embed generado una sola vez a mano.
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;
  
  // URL de Google Maps para abrir en nueva pestaña
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  
  // URL de Waze
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(fullAddress)}`;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const openInGoogleMaps = () => {
    window.open(googleMapsUrl, '_blank');
  };

  const openInWaze = () => {
    window.open(wazeUrl, '_blank');
  };

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-primary" />
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mapa */}
          <div className="relative aspect-video bg-muted">
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
              title="Ubicación de la propiedad"
            />
            
            {/* Overlay con botones */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsFullscreen(true)}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Ver más grande
              </Button>
            </div>
          </div>

          {/* Información de dirección */}
          <div className="p-4 space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Dirección</Label>
              <p className="font-medium">{address}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Ciudad</Label>
                <p className="font-medium">{city}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Estado</Label>
                <p className="font-medium">{state}</p>
              </div>
            </div>

            {zipCode && (
              <div>
                <Label className="text-sm text-muted-foreground">Código Postal</Label>
                <p className="font-medium">{zipCode}</p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyAddress}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-green-500" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar dirección
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={openInGoogleMaps}
              >
                <Navigation className="w-4 h-4 mr-1" />
                Google Maps
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={openInWaze}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Navigation className="w-4 h-4 mr-1" />
                Waze
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de pantalla completa */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ubicación de la Propiedad
            </DialogTitle>
            <DialogDescription>
              {fullAddress}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 p-4 h-full">
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '500px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-lg"
              title="Ubicación de la propiedad"
            />
          </div>
          
          <div className="p-4 pt-0 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsFullscreen(false)}>
              Cerrar
            </Button>
            <Button onClick={openInGoogleMaps}>
              <Navigation className="w-4 h-4 mr-1" />
              Abrir en Google Maps
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PropertyMap;
