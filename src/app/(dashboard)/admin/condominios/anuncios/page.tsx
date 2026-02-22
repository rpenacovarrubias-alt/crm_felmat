import { AnuncioGenerator } from '@/components/anuncios/AnuncioGenerator';
import { SocialPublisher } from '@/components/anuncios/SocialPublisher';
import { PublicationHistory } from '@/components/anuncios/PublicationHistory';
import { SocialConfig } from '@/components/anuncios/SocialConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, Settings, History } from 'lucide-react';

export default function AdminAnunciosPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Anuncios - Condominios</h1>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="create">
            <Megaphone className="h-4 w-4 mr-2" />
            Crear
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnuncioGenerator />
            <SocialPublisher />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <PublicationHistory />
        </TabsContent>

        <TabsContent value="config">
          <SocialConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
