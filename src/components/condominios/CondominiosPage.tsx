// ============================================
// ADMINISTRACIÓN DE CONDOMINIOS
// ============================================

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCondominios, useUnidadesCondominio } from '@/hooks/useDatabase';
import type { Condominio, UnidadCondominio, TipoUnidad, EstatusPagoUnidad } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Building2, Plus, Search, Trash2, Users, MapPin } from 'lucide-react';

const TIPOS_UNIDAD: { value: TipoUnidad; label: string }[] = [
  { value: 'departamento', label: 'Departamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'local', label: 'Local' },
  { value: 'oficina', label: 'Oficina' },
];

const ESTATUS_PAGO: { value: EstatusPagoUnidad; label: string; variant: 'default' | 'secondary' | 'destructive' }[] = [
  { value: 'al_corriente', label: 'Al corriente', variant: 'default' },
  { value: 'atrasado', label: 'Atrasado', variant: 'secondary' },
  { value: 'moroso', label: 'Moroso', variant: 'destructive' },
];

function NuevoCondominioDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (nombre: string, direccion: string) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');

  const handleCreate = () => {
    if (!nombre.trim() || !direccion.trim()) return;
    onCreate(nombre.trim(), direccion.trim());
    setNombre('');
    setDireccion('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo condominio</DialogTitle>
          <DialogDescription>Registra un nuevo condominio para administrar sus unidades</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del condominio" autoFocus />
          <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!nombre.trim() || !direccion.trim()}>Crear condominio</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NuevaUnidadDialog({
  open,
  onClose,
  onCreate,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: Omit<UnidadCondominio, 'id' | 'condominioId' | 'createdAt' | 'updatedAt'>) => void;
  editing?: UnidadCondominio | null;
}) {
  const [numero, setNumero] = useState(editing?.numero || '');
  const [tipo, setTipo] = useState<TipoUnidad>(editing?.tipo || 'departamento');
  const [propietarioNombre, setPropietarioNombre] = useState(editing?.propietarioNombre || '');
  const [propietarioTelefono, setPropietarioTelefono] = useState(editing?.propietarioTelefono || '');
  const [cuotaMensual, setCuotaMensual] = useState(editing?.cuotaMensual?.toString() || '');
  const [estatusPago, setEstatusPago] = useState<EstatusPagoUnidad>(editing?.estatusPago || 'al_corriente');

  const handleCreate = () => {
    if (!numero.trim() || !propietarioNombre.trim()) return;
    onCreate({
      numero: numero.trim(),
      tipo,
      propietarioNombre: propietarioNombre.trim(),
      propietarioTelefono: propietarioTelefono.trim() || undefined,
      cuotaMensual: Number(cuotaMensual) || 0,
      estatusPago,
    });
    setNumero('');
    setPropietarioNombre('');
    setPropietarioTelefono('');
    setCuotaMensual('');
    setEstatusPago('al_corriente');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar unidad' : 'Nueva unidad'}</DialogTitle>
          <DialogDescription>Datos de la unidad y su propietario</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="No. de unidad" autoFocus />
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoUnidad)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_UNIDAD.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input value={propietarioNombre} onChange={(e) => setPropietarioNombre(e.target.value)} placeholder="Nombre del propietario" />
          <Input value={propietarioTelefono} onChange={(e) => setPropietarioTelefono(e.target.value)} placeholder="Teléfono (opcional)" />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" value={cuotaMensual} onChange={(e) => setCuotaMensual(e.target.value)} placeholder="Cuota mensual" />
            <Select value={estatusPago} onValueChange={(v) => setEstatusPago(v as EstatusPagoUnidad)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESTATUS_PAGO.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!numero.trim() || !propietarioNombre.trim()}>
              {editing ? 'Guardar cambios' : 'Agregar unidad'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function estatusBadge(estatus: EstatusPagoUnidad) {
  const cfg = ESTATUS_PAGO.find(e => e.value === estatus)!;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function CondominiosPage() {
  const { user } = useAuth();
  const { condominios, loading: loadingCondos, create: createCondo, remove: removeCondo } = useCondominios(user?.id);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nuevoCondoOpen, setNuevoCondoOpen] = useState(false);
  const [nuevaUnidadOpen, setNuevaUnidadOpen] = useState(false);
  const [editingUnidad, setEditingUnidad] = useState<UnidadCondominio | null>(null);

  const filtered = condominios.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()));
  const selected: Condominio | undefined = condominios.find(c => c.id === selectedId) || filtered[0];

  const { unidades, create: createUnidad, update: updateUnidad, remove: removeUnidad } = useUnidadesCondominio(selected?.id);

  const handleCreateCondo = async (nombre: string, direccion: string) => {
    const nuevo = await createCondo({ nombre, direccion, agentId: user!.id, amenidades: [] });
    setSelectedId(nuevo.id);
    setNuevoCondoOpen(false);
  };

  const handleDeleteCondo = async (id: string) => {
    if (!confirm('¿Eliminar este condominio? Se perderán sus unidades registradas.')) return;
    await removeCondo(id);
    if (selectedId === id) setSelectedId(null);
  };

  const handleSaveUnidad = async (data: Omit<UnidadCondominio, 'id' | 'condominioId' | 'createdAt' | 'updatedAt'>) => {
    if (editingUnidad) {
      await updateUnidad(editingUnidad.id, data);
    } else if (selected) {
      await createUnidad({ ...data, condominioId: selected.id });
    }
    setNuevaUnidadOpen(false);
    setEditingUnidad(null);
  };

  const cuotaTotal = unidades.reduce((sum, u) => sum + u.cuotaMensual, 0);
  const morosos = unidades.filter(u => u.estatusPago !== 'al_corriente').length;

  if (loadingCondos) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administración de Condominios</h1>
          <p className="text-muted-foreground mt-1">Gestiona unidades, propietarios y cuotas de mantenimiento</p>
        </div>
        <Button onClick={() => setNuevoCondoOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo condominio
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar condominio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Building2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {search ? 'No se encontraron condominios' : 'Aún no tienes condominios registrados'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selected?.id === c.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                  )}
                >
                  <span className="font-medium truncate block">{c.nombre}</span>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {c.direccion}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Crea un condominio para empezar a administrar sus unidades</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{selected.nombre}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selected.direccion}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingUnidad(null); setNuevaUnidadOpen(true); }}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar unidad
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCondo(selected.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />Unidades</p>
                    <p className="text-2xl font-bold mt-1">{unidades.length}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Cuotas mensuales</p>
                    <p className="text-2xl font-bold mt-1">${cuotaTotal.toLocaleString('es-MX')}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Con adeudo</p>
                    <p className="text-2xl font-bold mt-1">{morosos}</p>
                  </div>
                </div>

                {unidades.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Este condominio no tiene unidades registradas</p>
                    <Button onClick={() => { setEditingUnidad(null); setNuevaUnidadOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar unidad
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Propietario</TableHead>
                        <TableHead>Cuota</TableHead>
                        <TableHead>Estatus</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unidades.map(u => (
                        <TableRow
                          key={u.id}
                          className="cursor-pointer"
                          onClick={() => { setEditingUnidad(u); setNuevaUnidadOpen(true); }}
                        >
                          <TableCell className="font-medium">{u.numero}</TableCell>
                          <TableCell className="capitalize">{u.tipo}</TableCell>
                          <TableCell>{u.propietarioNombre}</TableCell>
                          <TableCell>${u.cuotaMensual.toLocaleString('es-MX')}</TableCell>
                          <TableCell>{estatusBadge(u.estatusPago)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); removeUnidad(u.id); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <NuevoCondominioDialog open={nuevoCondoOpen} onClose={() => setNuevoCondoOpen(false)} onCreate={handleCreateCondo} />
      <NuevaUnidadDialog
        open={nuevaUnidadOpen}
        onClose={() => { setNuevaUnidadOpen(false); setEditingUnidad(null); }}
        onCreate={handleSaveUnidad}
        editing={editingUnidad}
      />
    </div>
  );
}

export default CondominiosPage;
