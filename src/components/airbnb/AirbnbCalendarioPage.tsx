// ============================================
// CALENDARIO DE DISPONIBILIDAD AIRBNB
// ============================================

import { useState } from 'react';
import { useAirbnbReservas } from '@/hooks/useDatabase';
import { AirbnbListingPicker, useAirbnbListingSelection } from './AirbnbListingPicker';
import { MonthGrid } from './MonthGrid';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ESTATUS_COLOR: Record<string, string> = {
  confirmada: 'bg-primary/15 border-primary/40 text-primary',
  pendiente: 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400',
  completada: 'bg-muted border-border text-muted-foreground',
  cancelada: '',
};

export function AirbnbCalendarioPage() {
  const { listings, loading: loadingListings, selected, selectedId, setSelectedId, create: createListing } = useAirbnbListingSelection();
  const { reservas } = useAirbnbReservas(selected?.id);
  const [current, setCurrent] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });

  const activeReservas = reservas.filter(r => r.estatus !== 'cancelada');

  const reservaEnFecha = (dateStr: string) => {
    const t = new Date(dateStr).getTime();
    return activeReservas.find(r => t >= new Date(r.checkIn.slice(0, 10)).getTime() && t < new Date(r.checkOut.slice(0, 10)).getTime());
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
        <h1 className="text-3xl font-bold tracking-tight">Calendario Airbnb</h1>
        <p className="text-muted-foreground mt-1">Disponibilidad y ocupación de tus anuncios</p>
      </div>

      <AirbnbListingPicker listings={listings} selectedId={selectedId} onSelect={setSelectedId} onCreate={createListing} />

      {selected && (
        <Card>
          <CardContent className="p-6">
            <MonthGrid
              year={current.year}
              month={current.month}
              onPrevMonth={() => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 })}
              onNextMonth={() => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 })}
              renderDay={(dateStr, day) => {
                const reserva = reservaEnFecha(dateStr);
                return (
                  <div
                    title={reserva ? `${reserva.huespedNombre} (${reserva.estatus})` : 'Disponible'}
                    className={cn(
                      "w-full h-full rounded-md border p-1 flex flex-col justify-between",
                      reserva ? ESTATUS_COLOR[reserva.estatus] : "border-border"
                    )}
                  >
                    <span className="text-xs text-muted-foreground">{day}</span>
                    {reserva && <span className="text-[10px] font-medium truncate">{reserva.huespedNombre}</span>}
                  </div>
                );
              }}
            />
            <div className="flex flex-wrap gap-4 mt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary/15 border border-primary/40 inline-block" />Confirmada</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500/15 border border-amber-500/40 inline-block" />Pendiente</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-muted border border-border inline-block" />Completada</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border border-border inline-block" />Disponible</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AirbnbCalendarioPage;
