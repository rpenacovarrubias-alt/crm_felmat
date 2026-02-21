// ============================================
// FORMULARIO DE CLIENTE/LEAD
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLeads, useProperties } from '@/hooks/useDatabase';
import type { Lead, LeadStatus, LeadSource } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  Users,
  TrendingUp,
  Building2,
} from 'lucide-react';

const leadStatuses: { value: LeadStatus; label: string }[] = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'calificado', label: 'Calificado' },
  { value: 'en_seguimiento', label: 'En Seguimiento' },
  { value: 'visita_programada', label: 'Visita Programada' },
  { value: 'visita_realizada', label: 'Visita Realizada' },
  { value: 'oferta_hecha', label: 'Oferta Hecha' },
  { value: 'negociacion', label: 'Negociación' },
  { value: 'cerrado_ganado', label: 'Cerrado Ganado' },
  { value: 'cerrado_perdido', label: 'Cerrado Perdido' },
  { value: 'descartado', label: 'Descartado' },
];

const leadSources: { value: LeadSource; label: string }[] = [
  { value: 'sitio_web', label: 'Sitio Web' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'inmuebles24', label: 'Inmuebles24' },
  { value: 'lamudi', label: 'Lamudi' },
  { value: 'propiedades_com', label: 'Propiedades.com' },
  { value: 'referido', label: 'Referido' },
  { value: 'llamada', label: 'Llamada' },
  { value: 'visita_oficina', label: 'Visita a Oficina' },
  { value: 'otro', label: 'Otro' },
];

const propertyTypes = [
  { value: 'casa', label: 'Casa' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'local', label: 'Local Comercial' },
  { value: 'otro', label: 'Otro' },
];

export function LeadForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { leads, create, update } = useLeads(user?.id);
  const { properties } = useProperties(user?.id);
  
  const isEditing = !!id;
  const existingLead = isEditing ? leads.find(l => l.id === id) : null;

  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    source: 'sitio_web',
    status: 'nuevo',
    interestedPropertyId: '',
    interestedPropertyType: 'casa',
    transactionType: 'venta',
    budgetMin: 0,
    budgetMax: 0,
    preferredLocation: '',
    assignedTo: user?.id || '',
    pipelineStage: 'nuevo',
    score: 50,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingLead) {
      setFormData(existingLead);
    }
  }, [existingLead]);

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      if (isEditing && id) {
        await update(id, formData);
      } else {
        await create({
          ...formData,
          assignedTo: user.id,
        } as Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>);
      }

      navigate('/leads');
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Error al guardar el cliente. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/leads')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? 'Actualiza los datos del cliente' : 'Registra un nuevo lead'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Nombre del cliente"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="cliente@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+52 55 1234 5678"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => handleChange('whatsapp', e.target.value)}
                      placeholder="+52 55 1234 5678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegram">Telegram</Label>
                    <Input
                      id="telegram"
                      value={formData.telegram}
                      onChange={(e) => handleChange('telegram', e.target.value)}
                      placeholder="@username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">Fuente *</Label>
                    <Select 
                      value={formData.source} 
                      onValueChange={(v) => handleChange('source', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {leadSources.map(source => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Interés Inmobiliario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="interestedProperty">Propiedad de interés</Label>
                    <Select 
                      value={formData.interestedPropertyId || 'none'} 
                      onValueChange={(v) => handleChange('interestedPropertyId', v === 'none' ? '' : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar propiedad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguna específica</SelectItem>
                        {properties.map(prop => (
                          <SelectItem key={prop.id} value={prop.id}>
                            {prop.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Tipo de propiedad buscada</Label>
                    <Select 
                      value={formData.interestedPropertyType} 
                      onValueChange={(v) => handleChange('interestedPropertyType', v)}
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
                    <Label htmlFor="transactionType">Tipo de transacción</Label>
                    <Select 
                      value={formData.transactionType} 
                      onValueChange={(v) => handleChange('transactionType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venta">Compra</SelectItem>
                        <SelectItem value="renta">Renta</SelectItem>
                        <SelectItem value="venta_renta">Compra o Renta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredLocation">Ubicación preferida</Label>
                    <Input
                      id="preferredLocation"
                      value={formData.preferredLocation}
                      onChange={(e) => handleChange('preferredLocation', e.target.value)}
                      placeholder="Zona, colonia, ciudad..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Presupuesto mínimo</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      value={formData.budgetMin}
                      onChange={(e) => handleChange('budgetMin', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Presupuesto máximo</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) => handleChange('budgetMax', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado *</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v) => {
                      handleChange('status', v);
                      handleChange('pipelineStage', v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {leadStatuses.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="score">Puntuación (0-100)</Label>
                  <Input
                    id="score"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.score}
                    onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                  />
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        (formData.score || 0) >= 70 ? "bg-green-500" :
                        (formData.score || 0) >= 40 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${formData.score}%` }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="nextFollowUp">Próximo seguimiento</Label>
                  <Input
                    id="nextFollowUp"
                    type="datetime-local"
                    value={formData.nextFollowUpAt ? new Date(formData.nextFollowUpAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleChange('nextFollowUpAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/leads')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Crear cliente')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default LeadForm;
