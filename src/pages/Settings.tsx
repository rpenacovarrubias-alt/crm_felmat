import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebhookConfig } from '@/components/settings/WebhookConfig';
import { SocialConfig } from '@/components/anuncios/SocialConfig';
import { Webhook, Share2 } from 'lucide-react';

export default function Settings() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona integraciones y ajustes del sistema
        </p>
      </div>

      <Tabs defaultValue="webhooks">
        <TabsList className="mb-6">
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks n8n
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-2" />
            Redes Sociales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <WebhookConfig />
        </TabsContent>

        <TabsContent value="social">
          <SocialConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
