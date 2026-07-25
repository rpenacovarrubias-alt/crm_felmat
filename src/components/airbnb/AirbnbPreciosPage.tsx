// ============================================
// PRECIOS DINÁMICOS AIRBNB
// ============================================

import { useState } from 'react';
import { useAirbnbPrecios } from '@/hooks/useDatabase';
import { AirbnbListingPicker, useAirbnbListingSelection } from './AirbnbListingPicker';
import { MonthGrid } from './MonthGrid';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AirbnbPreciosPage() {
  const { listings, loading: loadingListings, selected, selectedId, setSelectedId, create: createListing } = useAirbnbListingSelection();
  const { precios, setPrecio } = useAirbnbPrecios(selected?.id);
  const [current, setCurrent] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const precioBase = selected?.precioNoche;

  const handleBlur = async (fecha: string) => {
    const value = Number(draft);
    if (!isNaN(value) && value >= 0) await setPrecio(fecha, value);
    setEditing(null);
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
        <h1 className="text-3xl font-bold tracking-tight">Precios Dinámicos</h1>
        <p className="text-muted-foreground mt-1">Define el precio por noche de cada fecha para tus anuncios de Airbnb</p>
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
                const registrado = precios.find(p => p.fecha === dateStr);
                const isEditing = editing === dateStr;
                return (
                  <button
                    type="button"
                    onClick={() => { setEditing(dateStr); setDraft((registrado?.precio ?? precioBase ?? '').toString()); }}
                    className={cn(
                      "w-full h-full rounded-md border p-1 text-left flex flex-col justify-between hover:border-primary transition-colors",
                      registrado ? "bg-primary/5 border-primary/30" : "border-border"
                    )}
                  >
                    <span className="text-xs text-muted-foreground">{day}</span>
                    {isEditing ? (
                      <Input
                        autoFocus
                        type="number"
                        className="h-6 text-xs px-1"
                        value={draft}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => handleBlur(dateStr)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      />
                    ) : (
                      <span className="text-[11px] font-medium">
                        {registrado ? `$${registrado.precio.toLocaleString('es-MX')}` : precioBase ? `$${precioBase.toLocaleString('es-MX')}` : '—'}
                      </span>
                    )}
                  </button>
                );
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AirbnbPreciosPage;
