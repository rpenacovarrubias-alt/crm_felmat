// ============================================
// VISTA PÚBLICA DE UNA LISTA DE PROPIEDADES
// ============================================

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePropertyLists, useProperties, useUsers } from '@/hooks/useDatabase';
import type { PropertyList, Property } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Home, MapPin, Bed, Bath, Car, Maximize, MessageCircle } from 'lucide-react';

export function PublicList() {
  const { slug } = useParams<{ slug: string }>();
  const { getBySlug, incrementViews } = usePropertyLists();
  const { properties, loading: loadingProperties } = useProperties();
  const { users } = useUsers();

  const [list, setList] = useState<PropertyList | null | undefined>(undefined);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!slug) return;
    getBySlug(slug).then((found) => {
      setList(found);
      if (found && !viewedRef.current) {
        viewedRef.current = true;
        incrementViews(found.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (list === undefined || loadingProperties) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <Home className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">Lista no encontrada</h1>
        <p className="text-muted-foreground">Este enlace no existe o fue eliminado.</p>
      </div>
    );
  }

  const agent = users.find(u => u.id === list.agentId);
  const listProperties: Property[] = list.propertyIds
    .map(id => properties.find(p => p.id === id))
    .filter((p): p is Property => !!p);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">{list.name}</h1>
          {agent && (
            <p className="text-sm text-muted-foreground mt-1">
              Compartido por {agent.name} {agent.lastName}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {listProperties.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Esta lista no tiene propiedades.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listProperties.map(property => {
              const mainImage = property.images.find(img => img.isMain)?.url || property.images[0]?.url;
              const whatsapp = agent?.config?.whatsappNumber?.replace(/\D/g, '');
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
                    {whatsapp && (
                      <a
                        href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola, me interesa la propiedad "${property.title}"`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm text-green-600 hover:underline"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Preguntar por WhatsApp
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default PublicList;
