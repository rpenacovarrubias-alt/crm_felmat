import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Webhook, Save, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { testWebhook } from '@/lib/social-apis/webhook';

const N8N_URL_KEY = 'n8n_webhook_url';

// ponytail: las credenciales reales de Facebook/Instagram viven en
// SocialConfigForm.tsx (Postgres, via api/felmat-social-config.js). Este
// componente solo maneja la URL del webhook de n8n en localStorage -- las
// otras 3 plataformas se quitaron de aqui porque nunca se guardaban.
export function SocialConfig() {
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    const savedUrl = localStorage.getItem(N8N_URL_KEY);
    if (savedUrl) setWebhookUrl(savedUrl);
  }, []);

  const saveConfig = () => {
    const url = webhookUrl.trim();
    if (url) {
      localStorage.setItem(N8N_URL_KEY, url);
    } else {
      localStorage.removeItem(N8N_URL_KEY);
    }
    toast.success('Configuración guardada', {
      description: 'La URL del webhook ha sido actualizada.',
    });
  };

  const testConnection = async () => {
    const url = webhookUrl.trim();
    if (!url) {
      toast.error('URL requerida', { description: 'Ingresa la URL del webhook antes de probar.' });
      return;
    }
    const ok = await testWebhook(url);
    if (ok) {
      toast.success('Conexión exitosa', { description: 'El webhook de n8n respondió correctamente.' });
    } else {
      toast.error('Sin respuesta', { description: 'El webhook no respondió. Verifica la URL y que n8n esté activo.' });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhook de n8n
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>URL del Webhook (n8n)</Label>
          <Input
            placeholder="https://n8n.tudominio.com/webhook/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            URL de tu webhook de n8n para automatizaciones
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={testConnection}>
            <TestTube className="h-4 w-4 mr-2" />
            Probar Conexión
          </Button>
          <Button onClick={saveConfig}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
