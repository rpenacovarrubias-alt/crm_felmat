// ============================================
// SITIO WEB PÚBLICO DEL AGENTE
// ============================================

import { useParams } from 'react-router-dom';
import { useAgentWebsiteBySubdomain, useProperties, useUsers } from '@/hooks/useDatabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, MapPin, Bed, Bath, Car, Maximize, Phone, Mail, MessageCircle } from 'lucide-react';

export function PublicWebsite() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { website, loading } = useAgentWebsiteBySubdomain(subdomain);
  const { users, loading: loadingUsers } = useUsers();
  const { properties, loading: loadingProperties } = useProperties();

  if (loading || loadingUsers || loadingProperties) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!website || !website.isActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <Home className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">Sitio no disponible</h1>
        <p className="text-muted-foreground">Este sitio no existe o aún no ha sido publicado.</p>
      </div>
    );
  }

  const agent = users.find(u => u.id === website.agentId);
  const featuredProperties = properties.filter(p => website.featuredPropertyIds?.includes(p.id));
  const primaryColor = website.primaryColor || '#3b82f6';
  const secondaryColor = website.secondaryColor || '#10b981';
  const whatsapp = website.contactPhone?.replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-white">
      {website.sections?.hero !== false && (
        <section
          className="py-20 px-6 text-center"
          style={{ background: `linear-gradient(135deg, ${primaryColor}1a, ${secondaryColor}1a)` }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: primaryColor }}>
            {website.heroTitle}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-6">
            {website.heroSubtitle}
          </p>
          {featuredProperties.length > 0 && (
            <Button size="lg" style={{ backgroundColor: primaryColor }} asChild>
              <a href="#propiedades">Ver propiedades</a>
            </Button>
          )}
        </section>
      )}

      {website.sections?.properties !== false && (
        <section id="propiedades" className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Propiedades destacadas</h2>
          {featuredProperties.length === 0 ? (
            <p className="text-center text-muted-foreground">Aún no hay propiedades destacadas.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map(property => {
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
                      <p className="text-lg font-bold mt-3" style={{ color: primaryColor }}>
                        ${property.price.toLocaleString('es-MX')} {property.priceCurrency}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {website.sections?.about !== false && website.aboutText && (
        <section className="py-16 px-6" style={{ backgroundColor: `${primaryColor}0d` }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Sobre mí</h2>
            <p className="text-muted-foreground whitespace-pre-line">{website.aboutText}</p>
            {agent && <p className="font-medium mt-4">{agent.name} {agent.lastName}</p>}
          </div>
        </section>
      )}

      {website.sections?.contact !== false && (
        <section className="py-16 px-6 text-center">
          <h2 className="text-2xl font-bold mb-6">Contacto</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {website.contactPhone && (
              <Button variant="outline" className="transition-transform active:scale-[0.97]" asChild>
                <a href={`tel:${website.contactPhone.replace(/\D/g, '')}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  {website.contactPhone}
                </a>
              </Button>
            )}
            {whatsapp && (
              <Button className="bg-green-600 hover:bg-green-700 transition-transform active:scale-[0.97]" asChild>
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, vi tu sitio web y me gustaría contactarte.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
            )}
            {website.contactEmail && (
              <Button variant="outline" className="transition-transform active:scale-[0.97]" asChild>
                <a href={`mailto:${website.contactEmail}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  {website.contactEmail}
                </a>
              </Button>
            )}
          </div>
          {website.contactAddress && (
            <p className="text-sm text-muted-foreground mt-4">{website.contactAddress}</p>
          )}
        </section>
      )}

      <footer className="py-6 text-center text-xs text-muted-foreground border-t">
        Sitio generado por GRUPO FELMAT CRM
      </footer>
    </div>
  );
}

export default PublicWebsite;
