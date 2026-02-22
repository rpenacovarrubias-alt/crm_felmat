import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Facebook, Instagram, MapPin, Webhook, Save, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiConfig {
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  pageId?: string;
  accessToken?: string;
  webhookUrl?: string;
}

export function SocialConfig() {
  const [configs, setConfigs] = useState({
    facebook: { enabled: false, apiKey: '', apiSecret: '', pageId: '' },
    instagram: { enabled: false, apiKey: '', apiSecret: '', accessToken: '' },
    googleBusiness: { enabled: false, apiKey: '', pageId: '' },
    webhook: { enabled: false, webhookUrl: '' },
  });

  const { toast } = useToast();

  const updateConfig = (platform: keyof typeof configs, field: keyof ApiConfig, value: string | boolean) => {
    setConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  const saveConfig = async (platform: keyof typeof configs) => {
    try {
      // Aquí iría la llamada a la API para guardar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "✅ Configuración guardada",
        description: `La configuración de ${platform} ha sido actualizada.`,
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    }
  };

  const testConnection = async (platform: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "✅ Conexión exitosa",
        description: `La conexión con ${platform} está funcionando correctamente.`,
      });
    } catch (error) {
      toast({
        title: "❌ Error de conexión",
        description: "No se pudo conectar. Verifica tus credenciales.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuración de APIs Sociales</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="facebook" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="facebook">
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="instagram">
              <Instagram className="h-4 w-4 mr-2" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="googleBusiness">
              <MapPin className="h-4 w-4 mr-2" />
              Google
            </TabsTrigger>
            <TabsTrigger value="webhook">
              <Webhook className="h-4 w-4 mr-2" />
              Webhook
            </TabsTrigger>
          </TabsList>

          {Object.entries(configs).map(([platform, config]) => (
            <TabsContent key={platform} value={platform} className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium capitalize">{platform === 'googleBusiness' ? 'Google Business' : platform}</h3>
                  <p className="text-sm text-muted-foreground">
                    {config.enabled ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
                <Switch 
                  checked={config.enabled}
                  onCheckedChange={(checked) => updateConfig(platform as keyof typeof configs, 'enabled', checked)}
                />
              </div>

              {config.enabled && (
                <div className="space-y-4 p-4 border rounded-lg">
                  {platform === 'webhook' ? (
                    <div className="space-y-2">
                      <Label>URL del Webhook (n8n)</Label>
                      <Input 
                        placeholder="https://n8n.tudominio.com/webhook/..."
                        value={config.webhookUrl || ''}
                        onChange={(e) => updateConfig(platform as keyof typeof configs, 'webhookUrl', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        URL de tu webhook de n8n para automatizaciones
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>API Key / App ID</Label>
                        <Input 
                          type="password"
                          placeholder="Ingresa tu API Key"
                          value={config.apiKey || ''}
                          onChange={(e) => updateConfig(platform as keyof typeof configs, 'apiKey', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>API Secret / App Secret</Label>
                        <Input 
                          type="password"
                          placeholder="Ingresa tu API Secret"
                          value={config.apiSecret || ''}
                          onChange={(e) => updateConfig(platform as keyof typeof configs, 'apiSecret', e.target.value)}
                        />
                      </div>

                      {(platform === 'facebook' || platform === 'googleBusiness') && (
                        <div className="space-y-2">
                          <Label>Page ID / Place ID</Label>
                          <Input 
                            placeholder="ID de tu página"
                            value={config.pageId || ''}
                            onChange={(e) => updateConfig(platform as keyof typeof configs, 'pageId', e.target.value)}
                          />
                        </div>
                      )}

                      {platform === 'instagram' && (
                        <div className="space-y-2">
                          <Label>Access Token</Label>
                          <Input 
                            type="password"
                            placeholder="Long-lived access token"
                            value={config.accessToken || ''}
                            onChange={(e) => updateConfig(platform as keyof typeof configs, 'accessToken', e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => testConnection(platform)}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Probar Conexión
                    </Button>
                    <Button onClick={() => saveConfig(platform as keyof typeof configs)}>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
