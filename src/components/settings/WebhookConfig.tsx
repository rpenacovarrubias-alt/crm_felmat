// ============================================
// CONFIGURACIÓN DE WEBHOOKS PARA N8N
// ============================================

import { useState } from 'react';
import { useWebhooks, type WebhookEvent } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const availableEvents: { value: WebhookEvent; label: string; description: string }[] = [
  { value: 'property.created', label: 'Propiedad Creada', description: 'Se dispara cuando se crea una nueva propiedad' },
  { value: 'property.updated', label: 'Propiedad Actualizada', description: 'Se dispara cuando se actualiza una propiedad' },
  { value: 'property.published', label: 'Propiedad Publicada', description: 'Se dispara cuando una propiedad se publica' },
  { value: 'property.shared', label: 'Propiedad Compartida', description: 'Se dispara cuando se comparte una ficha' },
  { value: 'lead.created', label: 'Lead Creado', description: 'Se dispara cuando se registra un nuevo lead' },
  { value: 'lead.status_changed', label: 'Estado de Lead Cambiado', description: 'Se dispara cuando cambia el estado de un lead' },
];

export function WebhookConfig() {
  const { webhooks, addWebhook, removeWebhook } = useWebhooks();
  const [isAdding, setIsAdding] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as WebhookEvent[],
    secret: '',
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleAddWebhook = () => {
    if (!newWebhook.url || newWebhook.events.length === 0) return;
    
    addWebhook({
      url: newWebhook.url,
      events: newWebhook.events,
      secret: newWebhook.secret || undefined,
      isActive: true,
    });
    
    setNewWebhook({ url: '', events: [], secret: '' });
    setIsAdding(false);
  };

  const toggleEvent = (event: WebhookEvent) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const testWebhook = async (webhookId: string) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook) return;

    setTesting(webhookId);
    setTestResult(null);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhook.secret && { 'X-Webhook-Secret': webhook.secret }),
        },
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          data: { message: 'Test desde Grupo FELMAT CRM' },
        }),
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'Webhook respondió correctamente ✓' });
      } else {
        setTestResult({ success: false, message: `Error: ${response.status} ${response.statusText}` });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Error de conexión. Verifica la URL.' });
    } finally {
      setTesting(null);
    }
  };

  // Generar código de ejemplo para n8n
  const generateN8nExample = () => {
    return `{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "felmat-webhook",
        "responseMode": "responseNode"
      },
      "name": "Webhook FELMAT",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "felmat-webhook"
    },
    {
      "parameters": {
        "jsCode": "// Ejemplo: Procesar datos de propiedad\\nconst event = $input.first().json.event;\\nconst data = $input.first().json.data;\\n\\nif (event === 'property.created') {\\n  return {\\n    json: {\\n      action: 'post_social_media',\\n      property: data,\\n      message: 'Nueva propiedad disponible!'\\n    }\\n  };\\n}\\n\\nreturn $input.all();"
      },
      "name": "Procesar Datos",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ],
  "connections": {
    "Webhook FELMAT": {
      "main": [
        [
          {
            "node": "Procesar Datos",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Webhooks para n8n</h1>
        <p className="text-muted-foreground mt-1">
          Configura webhooks para integrar con n8n y automatizar tus flujos de trabajo
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">¿Qué son los webhooks?</p>
              <p className="text-sm text-blue-700 mt-1">
                Los webhooks permiten que n8n reciba notificaciones en tiempo real cuando ocurren eventos en tu CRM. 
                Por ejemplo, puedes configurar n8n para que publique automáticamente en redes sociales cuando creas una nueva propiedad.
              </p>
              <div className="mt-3 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white"
                  onClick={() => copyToClipboard(generateN8nExample(), 'n8n-example')}
                >
                  {copied === 'n8n-example' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  Copiar ejemplo para n8n
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Endpoints de API
          </CardTitle>
          <CardDescription>
            Usa estos endpoints en n8n para obtener datos del CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Obtener todas las propiedades</Label>
            <div className="flex gap-2">
              <code className="flex-1 bg-muted p-2 rounded text-sm font-mono">
                GET {typeof window !== 'undefined' ? window.location.origin : ''}/api/properties
              </code>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/properties`, 'api-properties')}
              >
                {copied === 'api-properties' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Obtener propiedad por ID</Label>
            <div className="flex gap-2">
              <code className="flex-1 bg-muted p-2 rounded text-sm font-mono">
                GET {typeof window !== 'undefined' ? window.location.origin : ''}/api/properties/&#123;id&#125;
              </code>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/properties/{id}`, 'api-property')}
              >
                {copied === 'api-property' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Obtener propiedad por slug</Label>
            <div className="flex gap-2">
              <code className="flex-1 bg-muted p-2 rounded text-sm font-mono">
                GET {typeof window !== 'undefined' ? window.location.origin : ''}/api/properties/slug/&#123;slug&#125;
              </code>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/properties/slug/{slug}`, 'api-slug')}
              >
                {copied === 'api-slug' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Webhooks Configurados
            </CardTitle>
            <CardDescription>
              {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configurado{webhooks.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Webhook
          </Button>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay webhooks configurados</p>
              <p className="text-sm">Agrega un webhook para empezar a integrar con n8n</p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div 
                  key={webhook.id} 
                  className={cn(
                    "p-4 border rounded-lg",
                    webhook.isActive ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-gray-50/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{webhook.url}</p>
                        <Badge 
                          variant={webhook.isActive ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            webhook.isActive && "bg-green-500"
                          )}
                        >
                          {webhook.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Creado: {new Date(webhook.createdAt).toLocaleDateString('es-MX')}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {webhook.events.map(event => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => testWebhook(webhook.id)}
                        disabled={testing === webhook.id}
                      >
                        {testing === webhook.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeWebhook(webhook.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  {testResult && testing === null && (
                    <div className={cn(
                      "mt-3 p-2 rounded text-sm flex items-center gap-2",
                      testResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    )}>
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {testResult.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Webhook Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Webhook</DialogTitle>
            <DialogDescription>
              Configura un nuevo webhook para recibir notificaciones en n8n
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL del Webhook *</Label>
              <Input
                id="webhook-url"
                placeholder="https://n8n.tudominio.com/webhook/felmat"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                La URL de tu webhook en n8n
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Secret (opcional)</Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder="tu-secreto-seguro"
                value={newWebhook.secret}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Se enviará en el header X-Webhook-Secret para verificar la autenticidad
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Eventos a escuchar *</Label>
              <div className="space-y-2">
                {availableEvents.map((event) => (
                  <label
                    key={event.value}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      newWebhook.events.includes(event.value)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(event.value)}
                      onChange={() => toggleEvent(event.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-sm">{event.label}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddWebhook}
                disabled={!newWebhook.url || newWebhook.events.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Webhook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WebhookConfig;
