import { AnuncioGenerator } from '@/components/anuncios/AnuncioGenerator';
import { SocialPublisher } from '@/components/anuncios/SocialPublisher';
import { PublicationHistory } from '@/components/anuncios/PublicationHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, History } from 'lucide-react';

export default function AirbnbAnunciosPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Anuncios - Airbnb</h1>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
          <TabsTrigger value="create">
            <Home className="h-4 w-4 mr-2" />
            Crear Anuncio
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnuncioGenerator 
              propertyData={{
                title: 'Departamento tipo Airbnb',
                description: 'Espacio acogedor para renta vacacional',
              }}
            />
            <SocialPublisher />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <PublicationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
