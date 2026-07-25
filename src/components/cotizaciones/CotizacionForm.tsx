// ============================================
// FORMULARIO DE COTIZACIÓN
// ============================================

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCotizaciones, useProperties } from '@/hooks/useDatabase';
import type { EstatusCotizacion, ItemCotizacion } from '@/types';
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
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';

const ESTATUS_OPTIONS: { value: EstatusCotizacion; label: string }[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'aceptada', label: 'Aceptada' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'vencida', label: 'Vencida' },
];

function emptyItem(): ItemCotizacion {
  return { id: crypto.randomUUID(), descripcion: '', cantidad: 1, precioUnitario: 0 };
}

export function CotizacionForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { cotizaciones, create, update } = useCotizaciones(user?.id);
  const { properties } = useProperties(user?.id);

  const isEditing = !!id;
  const existing = isEditing ? cotizaciones.find(c => c.id === id) : null;

  const [clienteNombre, setClienteNombre] = useState(existing?.clienteNombre || '');
  const [clienteEmail, setClienteEmail] = useState(existing?.clienteEmail || '');
  const [clienteTelefono, setClienteTelefono] = useState(existing?.clienteTelefono || '');
  const [propertyId, setPropertyId] = useState(existing?.propertyId || '');
  const [items, setItems] = useState<ItemCotizacion[]>(existing?.items?.length ? existing.items : [emptyItem()]);
  const [notas, setNotas] = useState(existing?.notas || '');
  const [vigenciaDias, setVigenciaDias] = useState(existing?.vigenciaDias?.toString() || '15');
  const [estatus, setEstatus] = useState<EstatusCotizacion>(existing?.estatus || 'borrador');
  const [saving, setSaving] = useState(false);

  const updateItem = (itemId: string, field: keyof ItemCotizacion, value: string | number) => {
    setItems(items.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  };

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (itemId: string) => {
    if (items.length === 1) return;
    setItems(items.filter(i => i.id !== itemId));
  };

  const total = items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);

  const handleSave = async () => {
    if (!clienteNombre.trim() || !user) return;
    setSaving(true);
    const data = {
      agentId: user.id,
      clienteNombre: clienteNombre.trim(),
      clienteEmail: clienteEmail.trim() || undefined,
      clienteTelefono: clienteTelefono.trim() || undefined,
      propertyId: propertyId || undefined,
      items: items.filter(i => i.descripcion.trim()),
      notas: notas.trim() || undefined,
      vigenciaDias: Number(vigenciaDias) || 15,
      estatus,
    };
    if (isEditing && existing) {
      await update(existing.id, data);
    } else {
      await create(data);
    }
    setSaving(false);
    navigate('/cotizaciones');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cotizaciones')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? `Editar cotización ${existing?.folio || ''}` : 'Nueva cotización'}
          </h1>
          <p className="text-muted-foreground text-sm">Genera una cotización profesional para tu cliente</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos del cliente</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Nombre del cliente" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} placeholder="correo@ejemplo.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} placeholder="442 123 4567" />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label>Propiedad relacionada (opcional)</Label>
            <Select value={propertyId || 'none'} onValueChange={(v) => setPropertyId(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Conceptos</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar concepto
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <Input
                className="col-span-6"
                placeholder="Descripción"
                value={item.descripcion}
                onChange={(e) => updateItem(item.id, 'descripcion', e.target.value)}
              />
              <Input
                className="col-span-2"
                type="number"
                min={1}
                placeholder="Cant."
                value={item.cantidad}
                onChange={(e) => updateItem(item.id, 'cantidad', Number(e.target.value))}
              />
              <Input
                className="col-span-3"
                type="number"
                min={0}
                placeholder="Precio unitario"
                value={item.precioUnitario}
                onChange={(e) => updateItem(item.id, 'precioUnitario', Number(e.target.value))}
              />
              <Button variant="ghost" size="icon" className="col-span-1" onClick={() => removeItem(item.id)} disabled={items.length === 1}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Separator />
          <div className="flex justify-end text-lg font-semibold">
            Total: ${total.toLocaleString('es-MX')}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Detalles</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Vigencia (días)</Label>
            <Input type="number" min={1} value={vigenciaDias} onChange={(e) => setVigenciaDias(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Estatus</Label>
            <Select value={estatus} onValueChange={(v) => setEstatus(v as EstatusCotizacion)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESTATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notas</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Condiciones, forma de pago, etc." rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/cotizaciones')}>Cancelar</Button>
        <Button onClick={handleSave} disabled={!clienteNombre.trim() || saving}>
          <Save className="w-4 h-4 mr-2" />
          {isEditing ? 'Guardar cambios' : 'Crear cotización'}
        </Button>
      </div>
    </div>
  );
}

export default CotizacionForm;
