import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RefreshCw, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Publication {
  id: string;
  content: string;
  platforms: string[];
  status: 'published' | 'scheduled' | 'failed' | 'draft';
  publishedAt?: string;
  scheduledFor?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export function PublicationHistory() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      // Simulación - reemplazar con API real
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockHistory: Publication[] = [
        {
          id: '1',
          content: '🏠 Increíble departamento en venta...',
          platforms: ['facebook', 'instagram'],
          status: 'published',
          publishedAt: '2024-02-20T14:30:00',
          engagement: { likes: 45, comments: 8, shares: 3 }
        },
        {
          id: '2',
          content: '✨ Nueva propiedad disponible...',
          platforms: ['googleBusiness'],
          status: 'scheduled',
          scheduledFor: '2024-02-25T10:00:00'
        },
      ];
      
      setPublications(mockHistory);
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo cargar el historial.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const getStatusBadge = (status: Publication['status']) => {
    const styles = {
      published: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    
    const labels = {
      published: 'Publicado',
      scheduled: 'Programado',
      failed: 'Fallido',
      draft: 'Borrador',
    };
    
    return (
      <Badge className={styles[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      facebook: '🔵',
      instagram: '📷',
      googleBusiness: '🗺️',
    };
    return icons[platform] || '📱';
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Publicaciones
        </CardTitle>
        <Button variant="outline" size="sm" onClick={loadHistory} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {publications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay publicaciones aún.
            </div>
          ) : (
            <div className="space-y-4">
              {publications.map((pub) => (
                <div key={pub.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm line-clamp-2">{pub.content}</p>
                      <div className="flex gap-2 mt-2">
                        {pub.platforms.map(p => (
                          <span key={p} className="text-lg" title={p}>
                            {getPlatformIcon(p)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(pub.status)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                      {pub.publishedAt && (
                        <span>Publicado: {new Date(pub.publishedAt).toLocaleString()}</span>
                      )}
                      {pub.scheduledFor && (
                        <span>Programado: {new Date(pub.scheduledFor).toLocaleString()}</span>
                      )}
                    </div>
                    
                    {pub.engagement && (
                      <div className="flex gap-3">
                        <span>❤️ {pub.engagement.likes}</span>
                        <span>💬 {pub.engagement.comments}</span>
                        <span>🔄 {pub.engagement.shares}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
