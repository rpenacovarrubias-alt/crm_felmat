// ============================================
// MI PERFIL
// ============================================

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Save, Shield, Award, Palette } from 'lucide-react';

export function ProfilePage() {
  const { user, updateUser, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    whatsappNumber: user?.config?.whatsappNumber || '',
    bio: user?.config?.bio || '',
    certificateNumber: user?.config?.certificateNumber || '',
    primaryColor: user?.config?.branding?.primaryColor || '#1e40af',
    secondaryColor: user?.config?.branding?.secondaryColor || '#f59e0b',
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const initials = `${user.name.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUser({
        name: formData.name,
        lastName: formData.lastName,
        phone: formData.phone,
        config: {
          ...user.config,
          whatsappNumber: formData.whatsappNumber,
          bio: formData.bio,
          certificateNumber: formData.certificateNumber,
          branding: {
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor,
          },
        },
      });
      toast.success('Perfil actualizado');
    } catch {
      toast.error('Error al guardar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">Administra tu información personal y de contacto</p>
      </div>

      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-lg">{user.name} {user.lastName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge className="mt-1" variant={isAdmin ? 'default' : 'secondary'}>
              <Shield className="w-3 h-3 mr-1" />
              {isAdmin ? 'Administrador' : 'Agente'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Apellidos</Label>
              <Input value={formData.lastName} onChange={(e) => setFormData(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Correo electrónico</Label>
            <Input value={user.email} disabled />
            <p className="text-xs text-muted-foreground">El correo no se puede cambiar desde aquí</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={formData.phone} onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={formData.whatsappNumber} onChange={(e) => setFormData(f => ({ ...f, whatsappNumber: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Biografía</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData(f => ({ ...f, bio: e.target.value }))}
              placeholder="Cuéntale a tus clientes sobre tu experiencia como agente..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              Número de certificado
            </Label>
            <Input
              value={formData.certificateNumber}
              onChange={(e) => setFormData(f => ({ ...f, certificateNumber: e.target.value }))}
              placeholder="FELMAT-2024-001"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Marca personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Estos colores se usan en tu ficha de propiedades y en tu sitio web.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Color primario</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData(f => ({ ...f, primaryColor: e.target.value }))}
                  className="w-14 h-10 p-1"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData(f => ({ ...f, primaryColor: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color secundario</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData(f => ({ ...f, secondaryColor: e.target.value }))}
                  className="w-14 h-10 p-1"
                />
                <Input
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData(f => ({ ...f, secondaryColor: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}

export default ProfilePage;
