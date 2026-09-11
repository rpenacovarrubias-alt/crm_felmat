import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Facebook, Instagram } from 'lucide-react';
import { listSocialConfigs, type SocialConfig, type SocialSection } from '@/lib/socialConfigApi';

const PLATFORMS: { key: 'facebook' | 'instagram'; label: string; icon: typeof Facebook }[] = [
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
];

export function RedesSociales({ section }: { section: SocialSection }) {
  const [configs, setConfigs] = useState<SocialConfig[]>([]);

  useEffect(() => {
    listSocialConfigs()
      .then((all) => setConfigs(all.filter((c) => c.section === section)))
      .catch(() => toast.error('No se pudo cargar el estado de las conexiones. Los datos mostrados pueden estar desactualizados.'));
  }, [section]);

  const isEnabled = (platform: 'facebook' | 'instagram') =>
    configs.find((c) => c.platform === platform)?.enabled ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Redes Sociales</h1>
        <p className="text-sm text-muted-foreground">Conecta las cuentas de Meta para esta sección</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {PLATFORMS.map(({ key, label, icon: Icon }) => (
          <Link key={key} to={`/${section}/redes-sociales/${key}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {label}
                  </span>
                  <Badge variant={isEnabled(key) ? 'default' : 'secondary'}>
                    {isEnabled(key) ? 'Activo' : 'Inactivo'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Configurar credenciales y conexión</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RedesSociales;
