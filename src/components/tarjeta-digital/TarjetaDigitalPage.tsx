// ============================================
// TARJETA DIGITAL - Editor y enlace público del agente
// ============================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProperties } from '@/hooks/useDatabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { IdCard, Copy, Check, ExternalLink, MessageCircle, Upload, Home } from 'lucide-react';

function generateSlug(name: string, lastName: string): string {
  return `${name}-${lastName}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36);
}

export function TarjetaDigitalPage() {
  const { user, updateUser } = useAuth();
  const { properties } = useProperties(user?.id);
  const [hiddenIds, setHiddenIds] = useState<string[]>(user?.config?.digitalCard?.hiddenPropertyIds || []);
  const [copied, setCopied] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Genera el slug una sola vez si el agente aun no tiene tarjeta digital
  useEffect(() => {
    if (user && !user.config?.digitalCard?.slug) {
      updateUser({
        config: {
          ...user.config,
          digitalCard: { slug: generateSlug(user.name, user.lastName), hiddenPropertyIds: [] },
        },
      });
    }
  }, [user, updateUser]);

  if (!user) return null;

  const slug = user.config?.digitalCard?.slug;
  const shareUrl = slug ? `${window.location.origin}/agente/${slug}` : '';
  const visibleCount = properties.length - hiddenIds.length;
  const initials = `${user.name.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  const togglePropertyVisibility = async (propertyId: string) => {
    const next = hiddenIds.includes(propertyId)
      ? hiddenIds.filter(id => id !== propertyId)
      : [...hiddenIds, propertyId];
    setHiddenIds(next);
    await updateUser({
      config: { ...user.config, digitalCard: { slug: slug!, hiddenPropertyIds: next } },
    });
  };

  const handleAvatarUpload = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      await updateUser({ avatar: e.target?.result as string });
      setUploadingAvatar(false);
      toast.success('Foto actualizada');
    };
    reader.readAsDataURL(file);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Enlace copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tarjeta Digital</h1>
        <p className="text-muted-foreground mt-1">Tu presentación pública — compártela por WhatsApp o redes sociales</p>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                {initials}
              </div>
            )}
            <label
              htmlFor="avatar-upload"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer transition-transform active:scale-90 hover:bg-primary/90"
              title="Cambiar foto"
            >
              <Upload className="w-3.5 h-3.5" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingAvatar}
              onChange={(e) => handleAvatarUpload(e.target.files)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg">{user.name} {user.lastName}</p>
            <p className="text-sm text-muted-foreground">Agente inmobiliario en Grupo Felmat</p>
            <p className="text-xs text-muted-foreground mt-1">
              El teléfono, WhatsApp y biografía se editan en{' '}
              <Link to="/perfil" className="underline underline-offset-2">Mi Perfil</Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard className="w-5 h-5" />
            Enlace público
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 px-3 py-2 rounded-md border bg-muted/50 text-sm truncate">
              {shareUrl || 'Generando enlace...'}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" onClick={copyLink} disabled={!shareUrl} className="transition-transform active:scale-[0.97]">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
              <Button variant="outline" asChild disabled={!shareUrl}>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
          <Button asChild className="w-full sm:w-auto transition-transform active:scale-[0.97]" disabled={!shareUrl}>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Aquí está mi tarjeta digital, contáctame cuando quieras: ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Compartir por WhatsApp
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Propiedades que se mostrarán
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground mb-3">
            {visibleCount} de {properties.length} propiedades visibles en tu tarjeta digital
          </p>
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aún no tienes propiedades registradas.</p>
          ) : (
            <div className="divide-y">
              {properties.map(property => (
                <div key={property.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm truncate">{property.title}</span>
                  <Switch
                    checked={!hiddenIds.includes(property.id)}
                    onCheckedChange={() => togglePropertyVisibility(property.id)}
                  />
                </div>
              ))}
            </div>
          )}
          <Separator className="my-2" />
        </CardContent>
      </Card>
    </div>
  );
}

export default TarjetaDigitalPage;
