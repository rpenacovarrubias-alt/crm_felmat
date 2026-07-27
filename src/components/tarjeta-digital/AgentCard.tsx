// ============================================
// TARJETA DIGITAL PÚBLICA DEL AGENTE
// ============================================

import { useParams } from 'react-router-dom';
import { useUsers, useProperties } from '@/hooks/useDatabase';
import type { Property } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, MapPin, Bed, Bath, Car, Maximize, Phone, MessageCircle, Mail } from 'lucide-react';

export function AgentCard() {
  const { slug } = useParams<{ slug: string }>();
  const { users, loading: loadingUsers } = useUsers();
  const { properties, loading: loadingProperties } = useProperties();

  if (loadingUsers || loadingProperties) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const agent = users.find(u => u.config?.digitalCard?.slug === slug);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <Home className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">Tarjeta no encontrada</h1>
        <p className="text-muted-foreground">Este enlace no existe o fue eliminado.</p>
      </div>
    );
  }

  const hiddenIds = agent.config?.digitalCard?.hiddenPropertyIds || [];
  const agentProperties = properties.filter(p => p.agentId === agent.id && !hiddenIds.includes(p.id));
  const initials = `${agent.name.charAt(0)}${agent.lastName.charAt(0)}`.toUpperCase();
  const whatsapp = agent.config?.whatsappNumber?.replace(/\D/g, '');
  const phoneDigits = agent.phone?.replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-gradient-to-br from-blue-700 to-blue-500 text-white">
        <div className="max-w-3xl mx-auto px-4 pt-12 pb-20 flex flex-col items-center text-center">
          {agent.avatar ? (
            <img src={agent.avatar} alt={agent.name} className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-white/15 border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold">
              {initials}
            </div>
          )}
          <h1 className="text-2xl font-bold mt-4">{agent.name} {agent.lastName}</h1>
          <p className="text-white/80 text-sm mt-1">Agente inmobiliario en Grupo Felmat</p>
          {agent.config?.certificateNumber && (
            <p className="text-white/70 text-xs mt-1">Certificado: {agent.config.certificateNumber}</p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-12 pb-16">
        <Card className="shadow-lg">
          <CardContent className="p-4 flex flex-wrap gap-2 justify-center">
            {phoneDigits && (
              <Button variant="outline" className="transition-transform active:scale-[0.97]" asChild>
                <a href={`tel:${phoneDigits}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Llamar
                </a>
              </Button>
            )}
            {whatsapp && (
              <Button className="bg-green-600 hover:bg-green-700 transition-transform active:scale-[0.97]" asChild>
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola ${agent.name}, vi tu tarjeta digital y me gustaría contactarte.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
            )}
            <Button variant="outline" className="transition-transform active:scale-[0.97]" asChild>
              <a href={`mailto:${agent.email}`}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </a>
            </Button>
          </CardContent>
        </Card>

        {agent.config?.bio && (
          <p className="text-center text-muted-foreground text-sm mt-6 max-w-lg mx-auto">
            {agent.config.bio}
          </p>
        )}

        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">
            Propiedades ({agentProperties.length})
          </h2>
          {agentProperties.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Este agente no tiene propiedades publicadas por el momento.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {agentProperties.map((property: Property) => {
                const mainImage = property.images.find(img => img.isMain)?.url || property.images[0]?.url;
                return (
                  <Card key={property.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted">
                      {mainImage ? (
                        <img src={mainImage} alt={property.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-1">{property.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {property.location.city}, {property.location.neighborhood}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-3">
                        <span className="flex items-center gap-1"><Bed className="w-4 h-4" />{property.features.bedrooms}</span>
                        <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{property.features.bathrooms}</span>
                        <span className="flex items-center gap-1"><Car className="w-4 h-4" />{property.features.parkingSpaces}</span>
                        <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{property.features.constructionArea}m²</span>
                      </div>
                      <p className="text-lg font-bold text-primary mt-3">
                        ${property.price.toLocaleString('es-MX')} {property.priceCurrency}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-16">
          Tarjeta digital generada por GRUPO FELMAT CRM
        </p>
      </main>
    </div>
  );
}

export default AgentCard;
