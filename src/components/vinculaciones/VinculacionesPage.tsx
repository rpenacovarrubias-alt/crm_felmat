// ============================================
// VINCULACIONES — conexión a portales de clasificados
// ============================================

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Globe, Link2, Unlink } from 'lucide-react';

interface Portal {
  id: string;
  name: string;
  type: 'gratuito' | 'de_paga';
}

const PORTALES: Portal[] = [
  { id: 'propiedades-com', name: 'Propiedades.com', type: 'gratuito' },
  { id: 'excelsior', name: 'Excelsior', type: 'gratuito' },
  { id: 'el-informador', name: 'El Informador', type: 'gratuito' },
  { id: 'casas-y-terrenos', name: 'Casas y Terrenos', type: 'gratuito' },
  { id: 'mercado-libre', name: 'Mercado Libre', type: 'de_paga' },
];

export function VinculacionesPage() {
  const { user, updateUser } = useAuth();
  const linked = user?.config?.linkedPortals || [];

  const togglePortal = async (portal: Portal) => {
    const isLinked = linked.includes(portal.id);
    const next = isLinked
      ? linked.filter(id => id !== portal.id)
      : [...linked, portal.id];
    await updateUser({ config: { ...user!.config, linkedPortals: next } });
    toast.success(isLinked ? `Desvinculado de ${portal.name}` : `Vinculado con ${portal.name}`);
  };

  const renderGroup = (type: Portal['type'], title: string, subtitle: string) => (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PORTALES.filter(p => p.type === type).map(portal => {
          const isLinked = linked.includes(portal.id);
          return (
            <Card key={portal.id}>
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm flex-1">{portal.name}</p>
                  {isLinked && <Badge className="bg-green-600 hover:bg-green-600">Vinculado</Badge>}
                </div>
                <Button
                  variant={isLinked ? 'outline' : 'default'}
                  size="sm"
                  className="transition-transform active:scale-[0.97]"
                  onClick={() => togglePortal(portal)}
                >
                  {isLinked ? (
                    <><Unlink className="w-4 h-4 mr-2" />Desvincular</>
                  ) : (
                    <><Link2 className="w-4 h-4 mr-2" />Vincular cuenta</>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vinculaciones</h1>
        <p className="text-muted-foreground mt-1">
          Marca qué portales de anuncios usas para publicar tus propiedades manualmente.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Nota: Felmat aún no tiene acuerdos de publicación automática con estos portales — vincular aquí solo
          guarda un registro de dónde publicas, no envía la propiedad al portal.
        </p>
      </div>

      {renderGroup('gratuito', 'Portales gratuitos', 'Conexión de referencia, sin costo')}
      {renderGroup('de_paga', 'Portales de paga', 'Requieren una suscripción con el portal')}
    </div>
  );
}

export default VinculacionesPage;
