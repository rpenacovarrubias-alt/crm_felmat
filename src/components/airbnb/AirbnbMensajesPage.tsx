// ============================================
// MENSAJES AIRBNB
// ============================================

import { useState } from 'react';
import { useAirbnbMensajes } from '@/hooks/useDatabase';
import { AirbnbListingPicker, useAirbnbListingSelection } from './AirbnbListingPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MessageCircle, Send } from 'lucide-react';

export function AirbnbMensajesPage() {
  const { listings, loading: loadingListings, selected, selectedId, setSelectedId, create: createListing } = useAirbnbListingSelection();
  const { mensajes, send } = useAirbnbMensajes(selected?.id);
  const [huespedNombre, setHuespedNombre] = useState('');
  const [texto, setTexto] = useState('');

  const handleSend = async () => {
    if (!texto.trim() || !selected) return;
    await send({ listingId: selected.id, huespedNombre: huespedNombre.trim() || 'Agente', contenido: texto.trim(), esDeAgente: true });
    setTexto('');
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
        <h1 className="text-3xl font-bold tracking-tight">Mensajes Airbnb</h1>
        <p className="text-muted-foreground mt-1">Comunicación con huéspedes por anuncio</p>
      </div>

      <AirbnbListingPicker listings={listings} selectedId={selectedId} onSelect={setSelectedId} onCreate={createListing} />

      {selected && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="h-96 overflow-y-auto space-y-3 p-2">
              {mensajes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <MessageCircle className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Aún no hay mensajes con huéspedes de este anuncio</p>
                </div>
              ) : (
                mensajes.map(m => (
                  <div key={m.id} className={cn("flex", m.esDeAgente ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                      m.esDeAgente ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {!m.esDeAgente && <p className="text-xs font-medium opacity-70 mb-0.5">{m.huespedNombre}</p>}
                      <p>{m.contenido}</p>
                      <p className="text-[10px] opacity-60 mt-1">{new Date(m.createdAt).toLocaleString('es-MX')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe una respuesta..."
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button onClick={handleSend} disabled={!texto.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AirbnbMensajesPage;
