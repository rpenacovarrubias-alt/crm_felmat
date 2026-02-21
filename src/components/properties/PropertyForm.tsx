// ============================================
// FORMULARIO DE PROPIEDAD (CREAR/EDITAR)
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProperties } from '@/hooks/useDatabase';
import type { Property, PropertyType, PropertyStatus, TransactionType, PropertyImage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Plus,
  Home,
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize,
  Image as ImageIcon,
  Check,
  Star,
} from 'lucide-react';

// Opciones para selects
const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'casa', label: 'Casa' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'local', label: 'Local Comercial' },
  { value: 'bodega', label: 'Bodega' },
  { value: 'rancho', label: 'Rancho' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'loft', label: 'Loft' },
  { value: 'otro', label: 'Otro' },
];

const transactionTypes: { value: TransactionType; label: string }[] = [
  { value: 'venta', label: 'Venta' },
  { value: 'renta', label: 'Renta' },
  { value: 'venta_renta', label: 'Venta o Renta' },
];

const propertyStatuses: { value: PropertyStatus; label: string }[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'rentado', label: 'Rentado' },
  { value: 'en_negociacion', label: 'En Negociación' },
  { value: 'inactivo', label: 'Inactivo' },
];

const amenitiesList = [
  'Alberca', 'Gimnasio', 'Seguridad 24h', 'Estacionamiento',
  'Jardín', 'Terraza', 'Elevador', 'Cocina equipada',
  'Aire acondicionado', 'Calefacción', 'Internet', 'Cable',
  'Lavadora', 'Secadora', 'Amueblado', 'Patio',
  'Balcón', 'Roof garden', 'Sala de TV', 'Estudio',
];

// Componente para subir imágenes
function ImageUploader({ 
  images, 
  onImagesChange 
}: { 
  images: PropertyImage[]; 
  onImagesChange: (images: PropertyImage[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: PropertyImage = {
          id: crypto.randomUUID(),
          url: e.target?.result as string,
          isMain: images.length === 0 && index === 0,
          order: images.length + index,
          caption: '',
        };
        onImagesChange([...images, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    const filtered = images.filter(img => img.id !== id);
    if (filtered.length > 0 && !filtered.some(img => img.isMain)) {
      filtered[0].isMain = true;
    }
    onImagesChange(filtered);
  };

  const setMainImage = (id: string) => {
    onImagesChange(images.map(img => ({
      ...img,
      isMain: img.id === id,
    })));
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFileSelect(e.dataTransfer.files);
        }}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          dragOver 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">Arrastra imágenes aquí o haz clic para seleccionar</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG hasta 10MB cada una</p>
        </label>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div 
              key={image.id} 
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2",
                image.isMain ? "border-primary" : "border-border"
              )}
            >
              <img 
                src={image.url} 
                alt={`Property ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isMain && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setMainImage(image.id)}
                    title="Establecer como principal"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeImage(image.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Main badge */}
              {image.isMain && (
                <Badge className="absolute top-2 left-2 bg-primary">
                  <Check className="w-3 h-3 mr-1" />
                  Principal
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente principal del formulario
export function PropertyForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { properties, create, update } = useProperties(user?.id);
  
  const isEditing = !!id;
  const existingProperty = isEditing ? properties.find(p => p.id === id) : null;

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<Property>>({
    title: '',
    description: '',
    propertyType: 'casa',
    transactionType: 'venta',
    price: 0,
    priceCurrency: 'MXN',
    status: 'disponible',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      neighborhood: '',
      references: '',
    },
    features: {
      bedrooms: 0,
      bathrooms: 0,
      parkingSpaces: 0,
      constructionArea: 0,
      terrainArea: 0,
      amenities: [],
    },
    images: [],
    tags: [],
    isPublished: true,
    isFeatured: false,
    commission: 0,
    commissionType: 'porcentaje',
  });

  const [activeTab, setActiveTab] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Cargar datos existentes si estamos editando
  useEffect(() => {
    if (existingProperty) {
      setFormData(existingProperty);
    }
  }, [existingProperty]);

  // Handlers
  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location!, [field]: value },
    }));
  };

  const handleFeaturesChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      features: { ...prev.features!, [field]: value },
    }));
  };

  const toggleAmenity = (amenity: string) => {
    const current = formData.features?.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    handleFeaturesChange('amenities', updated);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      handleChange('tags', [...(formData.tags || []), newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    handleChange('tags', formData.tags?.filter(t => t !== tag) || []);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const propertyData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title || ''),
        agentId: user.id,
      } as Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'leadsCount' | 'favoritesCount'>;

      if (isEditing && id) {
        await update(id, propertyData);
      } else {
        await create(propertyData);
      }

      navigate('/properties');
    } catch (error) {
      console.error('Error saving property:', error);
      alert('Error al guardar la propiedad. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/properties')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Propiedad' : 'Nueva Propiedad'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? 'Actualiza los datos de la propiedad' : 'Completa la información de la nueva propiedad'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="location">Ubicación</TabsTrigger>
            <TabsTrigger value="features">Características</TabsTrigger>
            <TabsTrigger value="images">Imágenes</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Título de la propiedad *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Ej: Casa moderna en zona residencial"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Tipo de propiedad *</Label>
                    <Select 
                      value={formData.propertyType} 
                      onValueChange={(v) => handleChange('propertyType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transactionType">Tipo de transacción *</Label>
                    <Select 
                      value={formData.transactionType} 
                      onValueChange={(v) => handleChange('transactionType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Precio *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        required
                      />
                      <div className="w-28">
                        <Select 
                          value={formData.priceCurrency} 
                          onValueChange={(v) => handleChange('priceCurrency', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MXN">MXN</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Estado *</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => handleChange('status', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyStatuses.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Describe la propiedad, sus características principales, ubicación privilegiada..."
                      rows={5}
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Etiquetas</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Agregar etiqueta..."
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                          {tag} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location */}
          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Dirección completa *</Label>
                    <Input
                      id="address"
                      value={formData.location?.address}
                      onChange={(e) => handleLocationChange('address', e.target.value)}
                      placeholder="Calle, número, colonia"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Colonia/Fraccionamiento</Label>
                    <Input
                      id="neighborhood"
                      value={formData.location?.neighborhood}
                      onChange={(e) => handleLocationChange('neighborhood', e.target.value)}
                      placeholder="Nombre de la colonia"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      value={formData.location?.city}
                      onChange={(e) => handleLocationChange('city', e.target.value)}
                      placeholder="Ciudad"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={formData.location?.state}
                      onChange={(e) => handleLocationChange('state', e.target.value)}
                      placeholder="Estado"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Código Postal</Label>
                    <Input
                      id="zipCode"
                      value={formData.location?.zipCode}
                      onChange={(e) => handleLocationChange('zipCode', e.target.value)}
                      placeholder="00000"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="references">Referencias de ubicación</Label>
                    <Textarea
                      id="references"
                      value={formData.location?.references}
                      onChange={(e) => handleLocationChange('references', e.target.value)}
                      placeholder="Cerca de..., a 5 minutos de..., frente a..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Características</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">
                      <Bed className="w-4 h-4 inline mr-1" />
                      Recámaras
                    </Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min={0}
                      value={formData.features?.bedrooms}
                      onChange={(e) => handleFeaturesChange('bedrooms', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">
                      <Bath className="w-4 h-4 inline mr-1" />
                      Baños
                    </Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min={0}
                      step={0.5}
                      value={formData.features?.bathrooms}
                      onChange={(e) => handleFeaturesChange('bathrooms', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parking">
                      <Car className="w-4 h-4 inline mr-1" />
                      Estacionamientos
                    </Label>
                    <Input
                      id="parking"
                      type="number"
                      min={0}
                      value={formData.features?.parkingSpaces}
                      onChange={(e) => handleFeaturesChange('parkingSpaces', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="construction">
                      <Maximize className="w-4 h-4 inline mr-1" />
                      Construcción (m²)
                    </Label>
                    <Input
                      id="construction"
                      type="number"
                      min={0}
                      value={formData.features?.constructionArea}
                      onChange={(e) => handleFeaturesChange('constructionArea', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Amenidades y características</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {amenitiesList.map(amenity => (
                      <label
                        key={amenity}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                          formData.features?.amenities?.includes(amenity)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-accent/50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={formData.features?.amenities?.includes(amenity) || false}
                          onChange={() => toggleAmenity(amenity)}
                          className="hidden"
                        />
                        <Check className={cn(
                          "w-4 h-4",
                          formData.features?.amenities?.includes(amenity) ? "text-primary" : "text-transparent"
                        )} />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Galería de Imágenes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  images={formData.images || []}
                  onImagesChange={(images) => handleChange('images', images)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración Avanzada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Publicar propiedad</Label>
                    <p className="text-sm text-muted-foreground">
                      Hacer visible en tu sitio web y fichas
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(v) => handleChange('isPublished', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Propiedad destacada</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar en sección de destacados
                    </p>
                  </div>
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(v) => handleChange('isFeatured', v)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Comisión</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={formData.commission}
                        onChange={(e) => handleChange('commission', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                      <div className="w-36">
                        <Select 
                          value={formData.commissionType} 
                          onValueChange={(v) => handleChange('commissionType', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="porcentaje">%</SelectItem>
                            <SelectItem value="monto_fijo">Monto fijo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/properties')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Crear propiedad')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PropertyForm;
