// ============================================
// SELECTOR DE ANUNCIO AIRBNB (compartido por los sub-módulos)
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAirbnbListings } from '@/hooks/useDatabase';
import type { AirbnbListing } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { Home, Plus, ExternalLink, Star } from 'lucide-react';

function NuevoAnuncioDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { titulo: string; urlAnuncio: string; plataforma: AirbnbListing['plataforma'] }) => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [urlAnuncio, setUrlAnuncio] = useState('');
  const [plataforma, setPlataforma] = useState<AirbnbListing['plataforma']>('airbnb');

  const handleCreate = () => {
    if (!titulo.trim() || !urlAnuncio.trim()) return;
    onCreate({ titulo: titulo.trim(), urlAnuncio: urlAnuncio.trim(), plataforma });
    setTitulo(''); setUrlAnuncio(''); setPlataforma('airbnb');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular anuncio</DialogTitle>
          <DialogDescription>
            Pega el link del anuncio publicado. El scraper sincronizará precio y calificación automáticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nombre del anuncio" autoFocus />
          <Input value={urlAnuncio} onChange={(e) => setUrlAnuncio(e.target.value)} placeholder="https://airbnb.mx/rooms/..." />
          <Select value={plataforma} onValueChange={(v) => setPlataforma(v as AirbnbListing['plataforma'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="airbnb">Airbnb</SelectItem>
              <SelectItem value="booking">Booking</SelectItem>
              <SelectItem value="vrbo">Vrbo</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!titulo.trim() || !urlAnuncio.trim()}>Vincular</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useAirbnbListingSelection() {
  const { user } = useAuth();
  const { listings, loading, create } = useAirbnbListings(user?.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && listings.length > 0) setSelectedId(listings[0].id);
  }, [listings, selectedId]);

  const selected = listings.find(l => l.id === selectedId) || null;

  const createForUser = (data: { titulo: string; urlAnuncio: string; plataforma: AirbnbListing['plataforma'] }) => {
    if (!user) return;
    create({ ...data, agentId: user.id });
  };

  return { listings, loading, selected, selectedId, setSelectedId, create: createForUser };
}

export function AirbnbListingPicker({
  listings,
  selectedId,
  onSelect,
  onCreate,
}: {
  listings: AirbnbListing[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (data: { titulo: string; urlAnuncio: string; plataforma: AirbnbListing['plataforma'] }) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const selected = listings.find(l => l.id === selectedId) || null;

  return (
    <Card>
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Home className="w-4 h-4 text-muted-foreground shrink-0" />
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground flex-1">No tienes anuncios de Airbnb vinculados todavía</p>
        ) : (
          <Select value={selectedId || undefined} onValueChange={onSelect}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Selecciona un anuncio" /></SelectTrigger>
            <SelectContent>
              {listings.map(l => <SelectItem key={l.id} value={l.id}>{l.titulo}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {selected && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {selected.calificacion !== undefined && (
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />{selected.calificacion.toFixed(1)}</span>
            )}
            <a href={selected.urlAnuncio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
              Ver anuncio <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Vincular anuncio
        </Button>
      </CardContent>
      <NuevoAnuncioDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={(data) => { onCreate(data); setDialogOpen(false); }} />
    </Card>
  );
}

export default AirbnbListingPicker;
