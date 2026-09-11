import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Facebook, Instagram, Save } from 'lucide-react';
import { getSocialConfig, saveSocialConfig, type SocialPlatform, type SocialSection } from '@/lib/socialConfigApi';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useDatabase';

const PLATFORM_LABELS: Record<SocialPlatform, { title: string; icon: typeof Facebook; accountLabel: string; accountPlaceholder: string }> = {
  facebook: { title: 'Facebook', icon: Facebook, accountLabel: 'Page ID', accountPlaceholder: 'ID de tu Página de Facebook' },
  instagram: { title: 'Instagram', icon: Instagram, accountLabel: 'Instagram Business Account ID', accountPlaceholder: 'ID de tu cuenta de Instagram' },
};

export function SocialConfigForm({ section }: { section: SocialSection }) {
  const navigate = useNavigate();
  const { platform: platformParam } = useParams<{ platform: string }>();
  const platform = platformParam === 'facebook' || platformParam === 'instagram' ? platformParam : null;

  const { user } = useAuth();
  const { users } = useUsers();
  const isSuperAdmin = user?.role === 'super_admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const viewAsUserId = searchParams.get('userId') || user?.id || '';
  const effectiveUserId = isSuperAdmin && viewAsUserId !== user?.id ? viewAsUserId : undefined;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [appId, setAppId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [hasAppSecret, setHasAppSecret] = useState(false);
  const [accessTokenPreview, setAccessTokenPreview] = useState<string | null>(null);

  const sectionHome = `/${section}/redes-sociales`;

  const loadConfig = () => {
    if (!platform) return;
    setLoading(true);
    setLoadError(false);
    getSocialConfig(section, platform, effectiveUserId).then((cfg) => {
      setEnabled(cfg.enabled);
      setAppId(cfg.appId ?? '');
      setAccountId(cfg.accountId ?? '');
      setAppSecret('');
      setAccessToken('');
      setHasAppSecret(cfg.hasAppSecret);
      setAccessTokenPreview(cfg.accessTokenPreview);
      setLoading(false);
    }).catch(() => {
      toast.error('No se pudo cargar la configuración');
      setLoadError(true);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!platform) { navigate(sectionHome, { replace: true }); return; }
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, platform, navigate, viewAsUserId]);

  if (!platform) return null;

  const info = PLATFORM_LABELS[platform];

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveSocialConfig({
        section,
        platform,
        enabled,
        appId,
        accountId,
        ...(appSecret ? { appSecret } : {}),
        ...(accessToken ? { accessToken } : {}),
        ...(effectiveUserId ? { userId: effectiveUserId } : {}),
      });
      setHasAppSecret(saved.hasAppSecret);
      setAccessTokenPreview(saved.accessTokenPreview);
      setAppSecret('');
      setAccessToken('');
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {isSuperAdmin && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Viendo como:</span>
          <Select
            value={viewAsUserId}
            onValueChange={(v) => setSearchParams(v === user?.id ? {} : { userId: v })}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Yo" />
            </SelectTrigger>
            <SelectContent>
              {user?.id && <SelectItem value={user.id}>Yo</SelectItem>}
              {users.filter((a) => a.isActive && a.id !== user?.id).map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name} {a.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(sectionHome)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <info.icon className="w-6 h-6" />
            {info.title}
          </h1>
          <p className="text-sm text-muted-foreground">Credenciales de Meta para esta sección</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : loadError ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-muted-foreground">No se pudo cargar la configuración. Intenta de nuevo.</p>
            <Button variant="outline" onClick={loadConfig}>Reintentar</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base">Activar {info.title}</Label>
                <p className="text-sm text-muted-foreground">{enabled ? 'Activo' : 'Inactivo'}</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appId">App ID</Label>
              <Input id="appId" value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="ID de tu App de Meta" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appSecret">App Secret</Label>
              <Input
                id="appSecret"
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder={hasAppSecret ? 'Ya configurado — escribe para reemplazar' : 'App Secret de tu App de Meta'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId">{info.accountLabel}</Label>
              <Input id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder={info.accountPlaceholder} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder={accessTokenPreview ? `${accessTokenPreview} — escribe para reemplazar` : 'Access Token de larga duración'}
              />
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SocialConfigForm;
