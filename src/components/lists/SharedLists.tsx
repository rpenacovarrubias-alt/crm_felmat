// ============================================
// LISTAS PÚBLICAS DE PROPIEDADES
// ============================================

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePropertyLists, useProperties } from '@/hooks/useDatabase';
import type { PropertyList } from '@/types';
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
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  ListChecks,
  Eye,
  Trash2,
  Share2,
  Copy,
  Check,
  X,
  Home,
} from 'lucide-react';

// Diálogo para crear una lista nueva
function NuevaListaDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva lista</DialogTitle>
          <DialogDescription>Dale un nombre a tu colección de propiedades</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Casas en Corregidora"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>Crear lista</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Diálogo para agregar propiedades existentes a la lista seleccionada
function AgregarPropiedadesDialog({
  open,
  onClose,
  yaEnLista,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  yaEnLista: string[];
  onToggle: (propertyId: string) => void;
}) {
  const { user } = useAuth();
  const { properties } = useProperties(user?.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar propiedades</DialogTitle>
          <DialogDescription>Selecciona las propiedades que quieres incluir en esta lista</DialogDescription>
        </DialogHeader>
        {properties.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No tienes propiedades registradas</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {properties.map(property => {
              const isSelected = yaEnLista.includes(property.id);
              const mainImage = property.images.find(img => img.isMain)?.url || property.images[0]?.url;
              return (
                <button
                  key={property.id}
                  type="button"
                  onClick={() => onToggle(property.id)}
                  className={cn(
                    "relative aspect-video rounded-lg overflow-hidden border-2 transition-all text-left",
                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
                  )}
                >
                  {mainImage ? (
                    <img src={mainImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Home className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs truncate">{property.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={onClose}>Listo</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SharedLists() {
  const { user } = useAuth();
  const { lists, loading, create, remove, addProperty, removeProperty } = usePropertyLists(user?.id);
  const { properties } = useProperties(user?.id);

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nuevaListaOpen, setNuevaListaOpen] = useState(false);
  const [agregarOpen, setAgregarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredLists = lists.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
  const selected: PropertyList | undefined = lists.find(l => l.id === selectedId) || filteredLists[0];

  const handleCreate = async (name: string) => {
    const nueva = await create(name, user!.id);
    setSelectedId(nueva.id);
    setNuevaListaOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta lista? Las propiedades no se verán afectadas.')) return;
    await remove(id);
    if (selectedId === id) setSelectedId(null);
  };

  const shareUrl = selected ? `${window.location.origin}/lista/${selected.slug}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const listProperties = selected
    ? selected.propertyIds.map(id => properties.find(p => p.id === id)).filter(Boolean)
    : [];

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
          <h1 className="text-3xl font-bold tracking-tight">Listas Públicas</h1>
          <p className="text-muted-foreground mt-1">
            Agrupa propiedades y comparte un enlace con tus clientes
          </p>
        </div>
        <Button onClick={() => setNuevaListaOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva lista
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: listado de listas */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredLists.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <ListChecks className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {search ? 'No se encontraron listas' : 'Aún no tienes listas'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredLists.map(list => (
                <button
                  key={list.id}
                  onClick={() => setSelectedId(list.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selected?.id === list.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{list.name}</span>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      {list.propertyIds.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Actualizada el {new Date(list.updatedAt).toLocaleDateString('es-MX')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Columna derecha: detalle de la lista seleccionada */}
        <div className="lg:col-span-2">
          {!selected ? (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ListChecks className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Crea una lista para empezar a agrupar propiedades</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{selected.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Eye className="w-3 h-3" />
                      {selected.views} visualizaciones
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setAgregarOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar propiedades
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(selected.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Share2 className="w-4 h-4" />
                    Enlace público
                  </div>
                  <div className="flex gap-2">
                    <Input value={shareUrl} readOnly className="flex-1 text-sm" />
                    <Button variant="outline" size="icon" onClick={copyLink}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button asChild variant="outline">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Te comparto esta selección de propiedades: ${shareUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>

                {listProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Esta lista no tiene propiedades todavía</p>
                    <Button onClick={() => setAgregarOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar propiedades
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {listProperties.map(property => {
                      if (!property) return null;
                      const mainImage = property.images.find(img => img.isMain)?.url || property.images[0]?.url;
                      return (
                        <div key={property.id} className="relative group">
                          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                            {mainImage ? (
                              <img src={mainImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Home className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeProperty(selected.id, property.id)}
                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <p className="text-sm font-medium mt-2 truncate">{property.title}</p>
                          <p className="text-xs text-muted-foreground">
                            ${property.price.toLocaleString('es-MX')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <NuevaListaDialog
        open={nuevaListaOpen}
        onClose={() => setNuevaListaOpen(false)}
        onCreate={handleCreate}
      />

      {selected && (
        <AgregarPropiedadesDialog
          open={agregarOpen}
          onClose={() => setAgregarOpen(false)}
          yaEnLista={selected.propertyIds}
          onToggle={(propertyId) => {
            if (selected.propertyIds.includes(propertyId)) {
              removeProperty(selected.id, propertyId);
            } else {
              addProperty(selected.id, propertyId);
            }
          }}
        />
      )}
    </div>
  );
}

export default SharedLists;
