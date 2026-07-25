// ============================================
// FIANZAS
// ============================================

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFianzas, useContratos } from '@/hooks/useDatabase';
import type { Fianza, EstatusFianza } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ShieldCheck, Plus, Trash2 } from 'lucide-react';

const ESTATUS: Record<EstatusFianza, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  vigente: { label: 'Vigente', variant: 'default' },
  por_vencer: { label: 'Por vencer', variant: 'secondary' },
  vencida: { label: 'Vencida', variant: 'destructive' },
  cancelada: { label: 'Cancelada', variant: 'outline' },
};

function estatusAutomatico(fechaVencimiento: string): EstatusFianza {
  const dias = (new Date(fechaVencimiento).getTime() - Date.now()) / 86400000;
  if (dias < 0) return 'vencida';
  if (dias <= 30) return 'por_vencer';
  return 'vigente';
}

function NuevaFianzaDialog({
  open,
  onClose,
  onCreate,
  contratos,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: Omit<Fianza, 'id' | 'agentId' | 'createdAt' | 'updatedAt'>) => void;
  contratos: { id: string; titulo: string }[];
}) {
  const [titular, setTitular] = useState('');
  const [monto, setMonto] = useState('');
  const [aseguradora, setAseguradora] = useState('');
  const [numeroPoliza, setNumeroPoliza] = useState('');
  const [contratoId, setContratoId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  const handleCreate = () => {
    if (!titular.trim() || !fechaInicio || !fechaVencimiento) return;
    onCreate({
      titular: titular.trim(),
      monto: Number(monto) || 0,
      aseguradora: aseguradora.trim() || undefined,
      numeroPoliza: numeroPoliza.trim() || undefined,
      contratoId: contratoId || undefined,
      fechaInicio: new Date(fechaInicio).toISOString(),
      fechaVencimiento: new Date(fechaVencimiento).toISOString(),
      estatus: estatusAutomatico(fechaVencimiento),
    });
    setTitular(''); setMonto(''); setAseguradora(''); setNumeroPoliza(''); setContratoId(''); setFechaInicio(''); setFechaVencimiento('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva fianza</DialogTitle>
          <DialogDescription>Registra una póliza de fianza asociada a un contrato</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={titular} onChange={(e) => setTitular(e.target.value)} placeholder="Titular de la fianza" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto asegurado" />
            <Input value={aseguradora} onChange={(e) => setAseguradora(e.target.value)} placeholder="Aseguradora (opcional)" />
          </div>
          <Input value={numeroPoliza} onChange={(e) => setNumeroPoliza(e.target.value)} placeholder="No. de póliza (opcional)" />
          <Select value={contratoId || 'none'} onValueChange={(v) => setContratoId(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Contrato relacionado (opcional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ninguno</SelectItem>
              {contratos.map(c => <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha inicio</Label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha vencimiento</Label>
              <Input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!titular.trim() || !fechaInicio || !fechaVencimiento}>Registrar fianza</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FianzasPage() {
  const { user } = useAuth();
  const { fianzas, loading, create, remove } = useFianzas(user?.id);
  const { contratos } = useContratos(user?.id);
  const [open, setOpen] = useState(false);

  const handleCreate = (data: Omit<Fianza, 'id' | 'agentId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    create({ ...data, agentId: user.id });
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Fianzas</h1>
          <p className="text-muted-foreground mt-1">Da seguimiento a las pólizas de fianza de tus contratos</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva fianza
        </Button>
      </div>

      {fianzas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Aún no has registrado fianzas</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva fianza
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titular</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Aseguradora</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fianzas.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.titular}</TableCell>
                    <TableCell>${f.monto.toLocaleString('es-MX')}</TableCell>
                    <TableCell>{f.aseguradora || '—'}</TableCell>
                    <TableCell>{new Date(f.fechaVencimiento).toLocaleDateString('es-MX')}</TableCell>
                    <TableCell><Badge variant={ESTATUS[estatusAutomatico(f.fechaVencimiento)].variant}>{ESTATUS[estatusAutomatico(f.fechaVencimiento)].label}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => remove(f.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <NuevaFianzaDialog open={open} onClose={() => setOpen(false)} onCreate={handleCreate} contratos={contratos} />
    </div>
  );
}

export default FianzasPage;
