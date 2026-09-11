import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Facebook, Instagram } from 'lucide-react';
import { listSocialConfigs, type SocialConfig, type SocialSection } from '@/lib/socialConfigApi';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useDatabase';

const PLATFORMS: { key: 'facebook' | 'instagram'; label: string; icon: typeof Facebook }[] = [
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
];

export function RedesSociales({ section }: { section: SocialSection }) {
  const { user } = useAuth();
  const { users } = useUsers();
  const isSuperAdmin = user?.role === 'super_admin';

  const [viewAsUserId, setViewAsUserId] = useState<string>(user?.id ?? '');
  const [configs, setConfigs] = useState<SocialConfig[]>([]);

  const agentOptions = useMemo(
    () => users.filter((u) => u.isActive),
    [users],
  );

  useEffect(() => {
    if (user?.id && !viewAsUserId) setViewAsUserId(user.id);
  }, [user?.id, viewAsUserId]);

  useEffect(() => {
    const targetUserId = isSuperAdmin && viewAsUserId && viewAsUserId !== user?.id ? viewAsUserId : undefined;
    listSocialConfigs(targetUserId)
      .then((all) => setConfigs(all.filter((c) => c.section === section)))
      .catch(() => toast.error('No se pudo cargar el estado de las conexiones. Los datos mostrados pueden estar desactualizados.'));
  }, [section, isSuperAdmin, viewAsUserId, user?.id]);

  const isEnabled = (platform: 'facebook' | 'instagram') =>
    configs.find((c) => c.platform === platform)?.enabled ?? false;

  const linkTarget = (key: 'facebook' | 'instagram') => {
    const base = `/${section}/redes-sociales/${key}`;
    return isSuperAdmin && viewAsUserId && viewAsUserId !== user?.id ? `${base}?userId=${viewAsUserId}` : base;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Redes Sociales</h1>
          <p className="text-sm text-muted-foreground">Conecta las cuentas de Meta para esta sección</p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Viendo como:</span>
            <Select value={viewAsUserId} onValueChange={setViewAsUserId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Yo" />
              </SelectTrigger>
              <SelectContent>
                {user?.id && <SelectItem value={user.id}>Yo</SelectItem>}
                {agentOptions.filter((a) => a.id !== user?.id).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} {a.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {PLATFORMS.map(({ key, label, icon: Icon }) => (
          <Link key={key} to={linkTarget(key)}>
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
