// ============================================
// FORMULARIO DE CONTRATO
// ============================================

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useContratos, useProperties, useLeads } from '@/hooks/useDatabase';
import type { EstatusContrato, TipoContrato } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';

const TIPOS: { value: TipoContrato; label: string }[] = [
  { value: 'compraventa', label: 'Compraventa' },
  { value: 'arrendamiento', label: 'Arrendamiento' },
  { value: 'comision', label: 'Comisión' },
  { value: 'exclusividad', label: 'Exclusividad' },
  { value: 'otro', label: 'Otro' },
];

const ESTATUS_OPTIONS: { value: EstatusContrato; label: string }[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'revision', label: 'En revisión' },
  { value: 'firmado', label: 'Firmado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export function ContratoForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { contratos, create, update } = useContratos(user?.id);
  const { properties } = useProperties(user?.id);
  const { leads } = useLeads(user?.id);

  const isEditing = !!id;
  const existing = isEditing ? contratos.find(c => c.id === id) : null;

  const [titulo, setTitulo] = useState(existing?.titulo || '');
  const [tipo, setTipo] = useState<TipoContrato>(existing?.tipo || 'compraventa');
  const [propertyId, setPropertyId] = useState(existing?.propertyId || '');
  const [leadId, setLeadId] = useState(existing?.leadId || '');
  const [contenido, setContenido] = useState(existing?.contenido || '');
  const [estatus, setEstatus] = useState<EstatusContrato>(existing?.estatus || 'borrador');
  const [fechaFirma, setFechaFirma] = useState(existing?.fechaFirma?.slice(0, 10) || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!titulo.trim() || !user) return;
    setSaving(true);
    const data = {
      agentId: user.id,
      tipo,
      titulo: titulo.trim(),
      propertyId: propertyId || undefined,
      leadId: leadId || undefined,
      contenido,
      estatus,
      fechaFirma: fechaFirma ? new Date(fechaFirma).toISOString() : undefined,
    };
    if (isEditing && existing) {
      await update(existing.id, data);
    } else {
      await create(data);
    }
    setSaving(false);
    navigate('/legal/contratos');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/legal/contratos')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? 'Editar contrato' : 'Nuevo contrato'}</h1>
          <p className="text-muted-foreground text-sm">Define los términos del contrato</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos generales</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Contrato de compraventa - Casa Corregidora" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoContrato)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Estatus</Label>
            <Select value={estatus} onValueChange={(v) => setEstatus(v as EstatusContrato)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESTATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Propiedad relacionada (opcional)</Label>
            <Select value={propertyId || 'none'} onValueChange={(v) => setPropertyId(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cliente relacionado (opcional)</Label>
            <Select value={leadId || 'none'} onValueChange={(v) => setLeadId(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fecha de firma (opcional)</Label>
            <Input type="date" value={fechaFirma} onChange={(e) => setFechaFirma(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Contenido del contrato</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Redacta o pega aquí el texto completo del contrato..."
            rows={16}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/legal/contratos')}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!titulo.trim() || saving}>
          <Save className="w-4 h-4 mr-2" />
          {isEditing ? 'Guardar cambios' : 'Crear contrato'}
        </Button>
      </div>
    </div>
  );
}

export default ContratoForm;
