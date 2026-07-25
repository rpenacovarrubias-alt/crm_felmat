// ============================================
// VINCULACIONES — espacio reservado para APIs de patrocinio
// ============================================

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Handshake, Megaphone, Building2, Plug } from 'lucide-react';

const SLOTS = [
  {
    icon: Megaphone,
    title: 'Patrocinador destacado en búsquedas',
    description: 'Espacio para que un aliado comercial (banco, aseguradora, mudanzas) aparezca en los resultados de propiedades.',
  },
  {
    icon: Building2,
    title: 'Banner de aliado comercial',
    description: 'Espacio publicitario dentro del sitio web del agente para promocionar servicios de terceros.',
  },
  {
    icon: Plug,
    title: 'API de terceros',
    description: 'Conexión con proveedores de servicios (crédito hipotecario, mudanzas, seguros) vía API propia de Felmat.',
  },
];

export function VinculacionesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vinculaciones</h1>
        <p className="text-muted-foreground mt-1">
          En Wiggot, este espacio sirve para vincular anuncios entre asesores. Felmat no comercializa de esa forma:
          este espacio queda reservado para APIs de patrocinio y aliados comerciales propios.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-8 flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-primary/10 mb-4">
            <Handshake className="w-8 h-8 text-primary" />
          </div>
          <Badge variant="secondary" className="mb-3">Próximamente</Badge>
          <p className="text-muted-foreground max-w-md">
            Estamos definiendo cómo monetizar este espacio con patrocinios propios en lugar de vinculación entre
            asesores. Los siguientes son los espacios candidatos que se habilitarán aquí.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SLOTS.map(slot => (
          <Card key={slot.title} className="border-dashed">
            <CardContent className="p-5 space-y-3">
              <div className="p-2 rounded-lg bg-muted w-fit">
                <slot.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">{slot.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{slot.description}</p>
              </div>
              <Badge variant="outline" className="text-xs">Próximamente</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default VinculacionesPage;
