import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Facebook, Instagram, MapPin, Calendar, Clock, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSocialPublish } from '@/hooks/useSocialPublish';

interface SocialPublisherProps {
  content?: string;
  images?: string[];
  propertyId?: string;
}

export function SocialPublisher({ content, images, propertyId }: SocialPublisherProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    facebook: false,
    instagram: false,
    googleBusiness: false,
  });
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const { publish, isPublishing } = useSocialPublish();
  const { toast } = useToast();

  const togglePlatform = (platform: keyof typeof selectedPlatforms) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const handlePublish = async (publishNow: boolean = true) => {
    const platforms = Object.entries(selectedPlatforms)
      .filter(([, selected]) => selected)
      .map(([platform]) => platform);

    if (platforms.length === 0) {
      toast({
        title: "⚠️ Selecciona plataformas",
        description: "Elige al menos una red social para publicar.",
        variant: "destructive",
      });
      return;
    }

    if (!content) {
      toast({
        title: "⚠️ Sin contenido",
        description: "Genera o escribe el contenido del anuncio primero.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await publish({
        platforms,
        content,
        images,
        propertyId,
        scheduledFor: publishNow ? undefined : `${scheduleDate}T${scheduleTime}`,
      });

      if (result.success) {
        toast({
          title: "✅ Publicado exitosamente",
          description: publishNow 
            ? "Tu anuncio ya está en redes sociales." 
            : `Programado para ${scheduleDate} a las ${scheduleTime}`,
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error al publicar",
        description: "Hubo un problema. Revisa la configuración de APIs.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Publicar en Redes Sociales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="platforms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="platforms">Plataformas</TabsTrigger>
            <TabsTrigger value="schedule">Programar</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Facebook className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium">Facebook</p>
                    <p className="text-sm text-muted-foreground">Publicar en página de negocio</p>
                  </div>
                </div>
                <Switch 
                  checked={selectedPlatforms.facebook}
                  onCheckedChange={() => togglePlatform('facebook')}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Instagram className="h-6 w-6 text-pink-600" />
                  <div>
                    <p className="font-medium">Instagram</p>
                    <p className="text-sm text-muted-foreground">Publicar en feed o stories</p>
                  </div>
                </div>
                <Switch 
                  checked={selectedPlatforms.instagram}
                  onCheckedChange={() => togglePlatform('instagram')}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium">Google Business</p>
                    <p className="text-sm text-muted-foreground">Publicar en perfil de empresa</p>
                  </div>
                </div>
                <Switch 
                  checked={selectedPlatforms.googleBusiness}
                  onCheckedChange={() => togglePlatform('googleBusiness')}
                />
              </div>
            </div>

            <Button 
              className="w-full mt-4" 
              onClick={() => handlePublish(true)}
              disabled={isPublishing}
            >
              {isPublishing ? '📤 Publicando...' : '🚀 Publicar Ahora'}
            </Button>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha
                </Label>
                <input
                  type="date"
                  className="w-full p-2 border rounded-md"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hora
                </Label>
                <input
                  type="time"
                  className="w-full p-2 border rounded-md"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>

            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => handlePublish(false)}
              disabled={isPublishing || !scheduleDate || !scheduleTime}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Programar Publicación
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
