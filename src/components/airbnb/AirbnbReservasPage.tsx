// ============================================
// RESERVAS AIRBNB
// ============================================

import { useState } from 'react';
import { useAirbnbReservas } from '@/hooks/useDatabase';
import type { AirbnbReserva, EstatusReservaAirbnb } from '@/types';
import { AirbnbListingPicker, useAirbnbListingSelection } from './AirbnbListingPicker';
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
import { CalendarRange, Plus, Trash2 } from 'lucide-react';

const ESTATUS: Record<EstatusReservaAirbnb, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmada: { label: 'Confirmada', variant: 'default' },
  pendiente: { label: 'Pendiente', variant: 'secondary' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
  completada: { label: 'Completada', variant: 'outline' },
};

function NuevaReservaDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: Omit<AirbnbReserva, 'id' | 'listingId' | 'createdAt'>) => void;
}) {
  const [huespedNombre, setHuespedNombre] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [totalHuespedes, setTotalHuespedes] = useState('1');
  const [montoTotal, setMontoTotal] = useState('');
  const [estatus, setEstatus] = useState<EstatusReservaAirbnb>('confirmada');

  const handleCreate = () => {
    if (!huespedNombre.trim() || !checkIn || !checkOut) return;
    onCreate({
      huespedNombre: huespedNombre.trim(),
      checkIn: new Date(checkIn).toISOString(),
      checkOut: new Date(checkOut).toISOString(),
      totalHuespedes: Number(totalHuespedes) || 1,
      montoTotal: Number(montoTotal) || 0,
      estatus,
    });
    setHuespedNombre(''); setCheckIn(''); setCheckOut(''); setTotalHuespedes('1'); setMontoTotal(''); setEstatus('confirmada');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
          <DialogDescription>Registra manualmente una reserva del anuncio seleccionado</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={huespedNombre} onChange={(e) => setHuespedNombre(e.target.value)} placeholder="Nombre del huésped" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Check-in</Label>
              <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Check-out</Label>
              <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" min={1} value={totalHuespedes} onChange={(e) => setTotalHuespedes(e.target.value)} placeholder="Huéspedes" />
            <Input type="number" min={0} value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} placeholder="Monto total" />
          </div>
          <Select value={estatus} onValueChange={(v) => setEstatus(v as EstatusReservaAirbnb)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ESTATUS).map(([value, cfg]) => <SelectItem key={value} value={value}>{cfg.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!huespedNombre.trim() || !checkIn || !checkOut}>Registrar reserva</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AirbnbReservasPage() {
  const { listings, loading: loadingListings, selected, selectedId, setSelectedId, create: createListing } = useAirbnbListingSelection();
  const { reservas, create, remove } = useAirbnbReservas(selected?.id);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = (data: Omit<AirbnbReserva, 'id' | 'listingId' | 'createdAt'>) => {
    if (!selected) return;
    create({ ...data, listingId: selected.id });
  };

  if (loadingListings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reservas Airbnb</h1>
        <p className="text-muted-foreground mt-1">Consulta y registra las reservas de tus anuncios</p>
      </div>

      <AirbnbListingPicker listings={listings} selectedId={selectedId} onSelect={setSelectedId} onCreate={createListing} />

      {!selected ? null : (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva reserva
            </Button>
          </div>

          {reservas.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <CalendarRange className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Este anuncio no tiene reservas registradas</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Huésped</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Huéspedes</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estatus</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservas.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.huespedNombre}</TableCell>
                        <TableCell>{new Date(r.checkIn).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>{new Date(r.checkOut).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>{r.totalHuespedes}</TableCell>
                        <TableCell>${r.montoTotal.toLocaleString('es-MX')}</TableCell>
                        <TableCell><Badge variant={ESTATUS[r.estatus].variant}>{ESTATUS[r.estatus].label}</Badge></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
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
        </>
      )}

      <NuevaReservaDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={handleCreate} />
    </div>
  );
}

export default AirbnbReservasPage;
