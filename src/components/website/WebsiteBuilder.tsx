// ============================================
// CONSTRUCTOR DE SITIO WEB PARA AGENTES
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAgentWebsite, useProperties } from '@/hooks/useDatabase';
import type { AgentWebsite } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Globe,
  Save,
  Eye,
  ExternalLink,
  Palette,
  Layout,
  Type,
  Home,
  User,
  MessageSquare,
  Star,
  FileText,
  Check,
  Settings,
} from 'lucide-react';

const themes = [
  { value: 'modern', label: 'Moderno', description: 'Diseño limpio y contemporáneo' },
  { value: 'classic', label: 'Clásico', description: 'Estilo tradicional y elegante' },
  { value: 'minimal', label: 'Minimalista', description: 'Simple y sin distracciones' },
  { value: 'luxury', label: 'Lujo', description: 'Sofisticado y premium' },
];

const fontFamilies = [
  { value: 'inter', label: 'Inter (Moderna)' },
  { value: 'georgia', label: 'Georgia (Clásica)' },
  { value: 'system', label: 'Sistema (Rápida)' },
];

// Vista previa del sitio
function WebsitePreview({ config }: { config: Partial<AgentWebsite> }) {
  const { properties } = useProperties(config.agentId);
  const featuredProperties = properties.filter(p => config.featuredPropertyIds?.includes(p.id)).slice(0, 3);
  
  const primaryColor = config.primaryColor || '#3b82f6';
  const secondaryColor = config.secondaryColor || '#10b981';
  
  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      {/* Preview Header */}
      <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 text-center">
          <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded text-xs text-muted-foreground">
            <Globe className="w-3 h-3" />
            {config.subdomain}.proptech.com
          </div>
        </div>
      </div>
      
      {/* Preview Content */}
      <div className="h-96 overflow-y-auto">
        {config.sections?.hero !== false && (
          <div 
            className="relative py-12 px-6 text-center"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}22, ${secondaryColor}22)` 
            }}
          >
            <h1 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>
              {config.heroTitle || 'Encuentra tu hogar ideal'}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {config.heroSubtitle || 'Las mejores propiedades a tu alcance'}
            </p>
            <Button size="sm" style={{ backgroundColor: primaryColor }}>
              Ver propiedades
            </Button>
          </div>
        )}
        
        {config.sections?.properties !== false && featuredProperties.length > 0 && (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3">Propiedades destacadas</h2>
            <div className="grid grid-cols-3 gap-2">
              {featuredProperties.map(prop => (
                <div key={prop.id} className="bg-muted rounded-lg p-2">
                  <div className="aspect-video bg-gray-200 rounded mb-2" />
                  <p className="text-xs font-medium truncate">{prop.title}</p>
                  <p className="text-xs text-muted-foreground">
                    ${prop.price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {config.sections?.about !== false && (
          <div className="p-4 bg-muted">
            <h2 className="text-lg font-semibold mb-2">Sobre mí</h2>
            <p className="text-xs text-muted-foreground">
              {config.aboutText || 'Agente inmobiliario profesional con años de experiencia...'}
            </p>
          </div>
        )}
        
        {config.sections?.contact !== false && (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Contacto</h2>
            <div className="space-y-1 text-xs">
              {config.contactPhone && <p>📞 {config.contactPhone}</p>}
              {config.contactEmail && <p>✉️ {config.contactEmail}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function WebsiteBuilder() {
  const { user } = useAuth();
  const { website, create, update } = useAgentWebsite(user?.id);
  const { properties } = useProperties(user?.id);
  
  const [formData, setFormData] = useState<Partial<AgentWebsite>>({
    isActive: false,
    subdomain: '',
    heroTitle: 'Encuentra tu hogar ideal',
    heroSubtitle: 'Las mejores propiedades a tu alcance',
    aboutText: user?.config?.bio || '',
    contactPhone: user?.config?.whatsappNumber || '',
    contactEmail: user?.email || '',
    theme: 'modern',
    primaryColor: user?.config?.branding?.primaryColor || '#3b82f6',
    secondaryColor: user?.config?.branding?.secondaryColor || '#10b981',
    fontFamily: 'inter',
    sections: {
      hero: true,
      properties: true,
      about: true,
      testimonials: false,
      contact: true,
      blog: false,
    },
    featuredPropertyIds: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (website) {
      setFormData(website);
    }
  }, [website]);

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSectionToggle = (section: keyof AgentWebsite['sections'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      sections: { ...prev.sections!, [section]: value },
    }));
    setSaved(false);
  };

  const toggleFeaturedProperty = (propertyId: string) => {
    const current = formData.featuredPropertyIds || [];
    const updated = current.includes(propertyId)
      ? current.filter(id => id !== propertyId)
      : [...current, propertyId];
    handleChange('featuredPropertyIds', updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        agentId: user.id,
      } as Omit<AgentWebsite, 'id' | 'createdAt' | 'updatedAt'>;

      if (website) {
        await update(website.id, data);
      } else {
        await create(data);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving website:', error);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const websiteUrl = formData.subdomain 
    ? `https://${formData.subdomain}.proptech.com`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Sitio Web</h1>
          <p className="text-muted-foreground mt-1">
            Crea y personaliza tu página profesional
          </p>
        </div>
        <div className="flex gap-2">
          {websiteUrl && formData.isActive && (
            <Button variant="outline" asChild>
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver sitio
              </a>
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {saved ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isSubmitting ? 'Guardando...' : (saved ? 'Guardado' : 'Guardar cambios')}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="general">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="design">Diseño</TabsTrigger>
                <TabsTrigger value="sections">Secciones</TabsTrigger>
              </TabsList>

              {/* General */}
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Configuración General
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base">Sitio web activo</Label>
                        <p className="text-sm text-muted-foreground">
                          Hacer visible tu sitio web públicamente
                        </p>
                      </div>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(v) => handleChange('isActive', v)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subdomain">Subdominio *</Label>
                      <div className="flex">
                        <Input
                          id="subdomain"
                          value={formData.subdomain}
                          onChange={(e) => handleChange('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="tu-nombre"
                          className="rounded-r-none"
                        />
                        <div className="px-3 bg-muted border border-l-0 rounded-r-md flex items-center text-sm text-muted-foreground">
                          .proptech.com
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Esta será la URL de tu sitio web
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">Título SEO</Label>
                      <Input
                        id="metaTitle"
                        value={formData.metaTitle || ''}
                        onChange={(e) => handleChange('metaTitle', e.target.value)}
                        placeholder="Título para motores de búsqueda"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">Descripción SEO</Label>
                      <Textarea
                        id="metaDescription"
                        value={formData.metaDescription || ''}
                        onChange={(e) => handleChange('metaDescription', e.target.value)}
                        placeholder="Descripción para motores de búsqueda"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content */}
              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="w-5 h-5" />
                      Contenido Principal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="heroTitle">Título del hero</Label>
                      <Input
                        id="heroTitle"
                        value={formData.heroTitle}
                        onChange={(e) => handleChange('heroTitle', e.target.value)}
                        placeholder="Encuentra tu hogar ideal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="heroSubtitle">Subtítulo del hero</Label>
                      <Input
                        id="heroSubtitle"
                        value={formData.heroSubtitle}
                        onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                        placeholder="Las mejores propiedades a tu alcance"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aboutText">Texto "Sobre mí"</Label>
                      <Textarea
                        id="aboutText"
                        value={formData.aboutText || ''}
                        onChange={(e) => handleChange('aboutText', e.target.value)}
                        placeholder="Describe tu experiencia como agente inmobiliario..."
                        rows={5}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Teléfono de contacto</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone || ''}
                        onChange={(e) => handleChange('contactPhone', e.target.value)}
                        placeholder="+52 55 1234 5678"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email de contacto</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail || ''}
                        onChange={(e) => handleChange('contactEmail', e.target.value)}
                        placeholder="contacto@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactAddress">Dirección de oficina</Label>
                      <Input
                        id="contactAddress"
                        value={formData.contactAddress || ''}
                        onChange={(e) => handleChange('contactAddress', e.target.value)}
                        placeholder="Calle, número, ciudad"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Featured Properties */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Propiedades Destacadas
                    </CardTitle>
                    <CardDescription>
                      Selecciona las propiedades que aparecerán en tu página principal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {properties.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No tienes propiedades para destacar
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {properties.filter(p => p.isPublished).map(property => {
                          const isSelected = formData.featuredPropertyIds?.includes(property.id);
                          const mainImage = property.images.find(img => img.isMain)?.url || property.images[0]?.url;
                          
                          return (
                            <button
                              key={property.id}
                              type="button"
                              onClick={() => toggleFeaturedProperty(property.id)}
                              className={cn(
                                "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                                isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
                              )}
                            >
                              {mainImage ? (
                                <img src={mainImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Home className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              {isSelected && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                                    <Check className="w-4 h-4" />
                                  </div>
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                <p className="text-white text-xs truncate">{property.title}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Design */}
              <TabsContent value="design" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Diseño y Apariencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Tema</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {themes.map(theme => (
                          <button
                            key={theme.value}
                            type="button"
                            onClick={() => handleChange('theme', theme.value)}
                            className={cn(
                              "p-4 border rounded-lg text-left transition-all",
                              formData.theme === theme.value 
                                ? "border-primary bg-primary/5" 
                                : "border-border hover:bg-accent/50"
                            )}
                          >
                            <p className="font-medium">{theme.label}</p>
                            <p className="text-xs text-muted-foreground">{theme.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Color primario</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={formData.primaryColor}
                            onChange={(e) => handleChange('primaryColor', e.target.value)}
                            className="w-14 h-10 p-1"
                          />
                          <Input
                            value={formData.primaryColor}
                            onChange={(e) => handleChange('primaryColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Color secundario</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={formData.secondaryColor}
                            onChange={(e) => handleChange('secondaryColor', e.target.value)}
                            className="w-14 h-10 p-1"
                          />
                          <Input
                            value={formData.secondaryColor}
                            onChange={(e) => handleChange('secondaryColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fontFamily">Tipografía</Label>
                      <Select 
                        value={formData.fontFamily} 
                        onValueChange={(v) => handleChange('fontFamily', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fontFamilies.map(font => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sections */}
              <TabsContent value="sections" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layout className="w-5 h-5" />
                      Secciones Visibles
                    </CardTitle>
                    <CardDescription>
                      Activa o desactiva las secciones de tu sitio web
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: 'hero', label: 'Hero (Portada)', icon: Home, description: 'Título principal y llamada a la acción' },
                      { key: 'properties', label: 'Propiedades', icon: Star, description: 'Tus propiedades destacadas' },
                      { key: 'about', label: 'Sobre mí', icon: User, description: 'Información sobre ti como agente' },
                      { key: 'testimonials', label: 'Testimonios', icon: MessageSquare, description: 'Opiniones de clientes' },
                      { key: 'contact', label: 'Contacto', icon: MessageSquare, description: 'Formulario de contacto' },
                      { key: 'blog', label: 'Blog', icon: FileText, description: 'Artículos y noticias' },
                    ].map(section => (
                      <div 
                        key={section.key}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <section.icon className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <Label className="text-base">{section.label}</Label>
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={formData.sections?.[section.key as keyof AgentWebsite['sections']] !== false}
                          onCheckedChange={(v) => handleSectionToggle(section.key as keyof AgentWebsite['sections'], v)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Vista Previa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WebsitePreview config={formData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estado del sitio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    formData.isActive ? "bg-green-500" : "bg-gray-400"
                  )} />
                  <span className={formData.isActive ? "text-green-600 font-medium" : "text-muted-foreground"}>
                    {formData.isActive ? 'Sitio activo' : 'Sitio inactivo'}
                  </span>
                </div>
                {websiteUrl && formData.isActive && (
                  <p className="text-sm text-muted-foreground mt-2">
                    URL: <a href={websiteUrl} target="_blank" className="text-primary hover:underline">{websiteUrl}</a>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

export default WebsiteBuilder;
