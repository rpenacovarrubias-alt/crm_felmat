// ==========================================
// FORMULARIO DE ESTIMACIÓN
// ==========================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { EstimacionFormData, TipoPropiedad, EstadoConservacion, TipoAcabados } from '@/types/estimacion';
import { OPCIONES_TIPO_PROPIEDAD, OPCIONES_ESTADO_CONSERVACION, OPCIONES_TIPO_ACABADOS } from '@/lib/valuacion/factores';
import { MapPin, Ruler, Home, DollarSign, Camera, FileText } from 'lucide-react';

interface EstimacionFormProps {
  initialData?: Partial<EstimacionFormData>;
  onSubmit: (data: EstimacionFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function EstimacionForm({ initialData, onSubmit, onCancel, isSubmitting }: EstimacionFormProps) {
  const [formData, setFormData] = useState<EstimacionFormData>({
    titulo: initialData?.titulo || '',
    tipoPropiedad: initialData?.tipoPropiedad || 'casa',
    ubicacion: {
      direccion: initialData?.ubicacion?.direccion || '',
      codigoPostal: initialData?.ubicacion?.codigoPostal || '',
      colonia: initialData?.ubicacion?.colonia || '',
      ciudad: initialData?.ubicacion?.ciudad || '',
      estado: initialData?.ubicacion?.estado || '',
    },
    dimensiones: {
      superficieTerreno: initialData?.dimensiones?.superficieTerreno || 0,
      superficieConstruccion: initialData?.dimensiones?.superficieConstruccion || 0,
      frente: initialData?.dimensiones?.frente,
      fondo: initialData?.dimensiones?.fondo,
    },
    caracteristicas: {
      antiguedad: initialData?.caracteristicas?.antiguedad || 0,
      recamaras: initialData?.caracteristicas?.recamaras,
      banos: initialData?.caracteristicas?.banos,
      mediosBanos: initialData?.caracteristicas?.mediosBanos,
      estacionamientos: initialData?.caracteristicas?.estacionamientos,
      niveles: initialData?.caracteristicas?.niveles,
    },
    estadoConservacion: initialData?.estadoConservacion || 'bueno',
    tipoAcabados: initialData?.tipoAcabados || 'interes_medio',
    amenidades: {
      alberca: initialData?.amenidades?.alberca || false,
      jardin: initialData?.amenidades?.jardin || false,
      roofGarden: initialData?.amenidades?.roofGarden || false,
      gimnasio: initialData?.amenidades?.gimnasio || false,
      seguridadPrivada: initialData?.amenidades?.seguridadPrivada || false,
      cisterna: initialData?.amenidades?.cisterna || false,
      gasEstacionario: initialData?.amenidades?.gasEstacionario || false,
      lineaTelefonica: initialData?.amenidades?.lineaTelefonica || false,
      internet: initialData?.amenidades?.internet || false,
      aireAcondicionado: initialData?.amenidades?.aireAcondicionado || false,
      calefaccion: initialData?.amenidades?.calefaccion || false,
      terraza: initialData?.amenidades?.terraza || false,
      balcon: initialData?.amenidades?.balcon || false,
      cuartoServicio: initialData?.amenidades?.cuartoServicio || false,
      cuartoLavado: initialData?.amenidades?.cuartoLavado || false,
      bodega: initialData?.amenidades?.bodega || false,
      estudio: initialData?.amenidades?.estudio || false,
      familyRoom: initialData?.amenidades?.familyRoom || false,
      comedor: initialData?.amenidades?.comedor || false,
      sala: initialData?.amenidades?.sala || false,
      cocinaIntegral: initialData?.amenidades?.cocinaIntegral || false,
      vestidor: initialData?.amenidades?.vestidor || false,
      walkInCloset: initialData?.amenidades?.walkInCloset || false,
      chimenea: initialData?.amenidades?.chimenea || false,
      jacuzzi: initialData?.amenidades?.jacuzzi || false,
      sauna: initialData?.amenidades?.sauna || false,
      asador: initialData?.amenidades?.asador || false,
    },
    valorCatastral: initialData?.valorCatastral,
    observaciones: initialData?.observaciones || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = <K extends keyof EstimacionFormData>(
    section: K,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const toggleAmenidad = (key: keyof typeof formData.amenidades) => {
    setFormData(prev => ({
      ...prev,
      amenidades: {
        ...prev.amenidades,
        [key]: !prev.amenidades[key],
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <FileText className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="ubicacion">
            <MapPin className="h-4 w-4 mr-2" />
            Ubicación
          </TabsTrigger>
          <TabsTrigger value="caracteristicas">
            <Home className="h-4 w-4 mr-2" />
            Características
          </TabsTrigger>
          <TabsTrigger value="amenidades">
            <Camera className="h-4 w-4 mr-2" />
            Amenidades
          </TabsTrigger>
        </TabsList>

        {/* TAB GENERAL */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título de la Estimación</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Casa en Colonia Centro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Propiedad</Label>
                <Select
                  value={formData.tipoPropiedad}
                  onValueChange={(value: TipoPropiedad) => 
                    setFormData({ ...formData, tipoPropiedad: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCIONES_TIPO_PROPIEDAD.map((opcion) => (
                      <SelectItem key={opcion.value} value={opcion.value}>
                        {opcion.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado de Conservación</Label>
                  <Select
                    value={formData.estadoConservacion}
                    onValueChange={(value: EstadoConservacion) => 
                      setFormData({ ...formData, estadoConservacion: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPCIONES_ESTADO_CONSERVACION.map((opcion) => (
                        <SelectItem key={opcion.value} value={opcion.value}>
                          {opcion.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Acabados</Label>
                  <Select
                    value={formData.tipoAcabados}
                    onValueChange={(value: TipoAcabados) => 
                      setFormData({ ...formData, tipoAcabados: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPCIONES_TIPO_ACABADOS.map((opcion) => (
                        <SelectItem key={opcion.value} value={opcion.value}>
                          {opcion.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Notas adicionales sobre la propiedad..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB UBICACIÓN */}
        <TabsContent value="ubicacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Dirección Completa</Label>
                <Textarea
                  value={formData.ubicacion.direccion}
                  onChange={(e) => updateField('ubicacion', 'direccion', e.target.value)}
                  placeholder="Calle, número, colonia"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código Postal</Label>
                  <Input
                    value={formData.ubicacion.codigoPostal}
                    onChange={(e) => updateField('ubicacion', 'codigoPostal', e.target.value)}
                    placeholder="00000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Colonia</Label>
                  <Input
                    value={formData.ubicacion.colonia}
                    onChange={(e) => updateField('ubicacion', 'colonia', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input
                    value={formData.ubicacion.ciudad}
                    onChange={(e) => updateField('ubicacion', 'ciudad', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={formData.ubicacion.estado}
                    onChange={(e) => updateField('ubicacion', 'estado', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB CARACTERÍSTICAS */}
        <TabsContent value="caracteristicas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dimensiones y Características</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Superficie de Terreno (m²)</Label>
                  <Input
                    type="number"
                    value={formData.dimensiones.superficieTerreno || ''}
                    onChange={(e) => updateField('dimensiones', 'superficieTerreno', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Superficie de Construcción (m²)</Label>
                  <Input
                    type="number"
                    value={formData.dimensiones.superficieConstruccion || ''}
                    onChange={(e) => updateField('dimensiones', 'superficieConstruccion', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frente (metros)</Label>
                  <Input
                    type="number"
                    value={formData.dimensiones.frente || ''}
                    onChange={(e) => updateField('dimensiones', 'frente', parseFloat(e.target.value) || undefined)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fondo (metros)</Label>
                  <Input
                    type="number"
                    value={formData.dimensiones.fondo || ''}
                    onChange={(e) => updateField('dimensiones', 'fondo', parseFloat(e.target.value) || undefined)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Antigüedad (años)</Label>
                <Input
                  type="number"
                  value={formData.caracteristicas.antiguedad || ''}
                  onChange={(e) => updateField('caracteristicas', 'antiguedad', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Recámaras</Label>
                  <Input
                    type="number"
                    value={formData.caracteristicas.recamaras || ''}
                    onChange={(e) => updateField('caracteristicas', 'recamaras', parseInt(e.target.value) || undefined)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Baños</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.caracteristicas.banos || ''}
                    onChange={(e) => updateField('caracteristicas', 'banos', parseFloat(e.target.value) || undefined)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Medios Baños</Label>
                  <Input
                    type="number"
                    value={formData.caracteristicas.mediosBanos || ''}
                    onChange={(e) => updateField('caracteristicas', 'mediosBanos', parseInt(e.target.value) || undefined)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estacionamientos</Label>
                  <Input
                    type="number"
                    value={formData.caracteristicas.estacionamientos || ''}
                    onChange={(e) => updateField('caracteristicas', 'estacionamientos', parseInt(e.target.value) || undefined)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Niveles</Label>
                <Input
                  type="number"
                  value={formData.caracteristicas.niveles || ''}
                  onChange={(e) => updateField('caracteristicas', 'niveles', parseInt(e.target.value) || undefined)}
                  placeholder="1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB AMENIDADES */}
        <TabsContent value="amenidades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Amenidades y Extras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(formData.amenidades).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={() => toggleAmenidad(key as keyof typeof formData.amenidades)}
                    />
                    <Label htmlFor={key} className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Estimación'}
        </Button>
      </div>
    </form>
  );
}
