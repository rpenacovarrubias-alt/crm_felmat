// ============================================
// CATÁLOGO SIMPLE REUTILIZABLE (Tipos de Propiedad / Amenidades)
// ============================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X } from 'lucide-react';

interface CatalogItem {
  id: string;
  label: string;
}

export function CatalogoSimplePage({
  title,
  description,
  placeholder,
  icon: Icon,
  items,
  loading,
  onCreate,
  onRemove,
}: {
  title: string;
  description: string;
  placeholder: string;
  icon: React.ElementType;
  items: CatalogItem[];
  loading: boolean;
  onCreate: (label: string) => void;
  onRemove: (id: string) => void;
}) {
  const [nuevo, setNuevo] = useState('');

  const handleAdd = () => {
    if (!nuevo.trim()) return;
    onCreate(nuevo.trim());
    setNuevo('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              placeholder={placeholder}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={!nuevo.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center">
              <Icon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aún no has agregado elementos a este catálogo</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map(item => (
                <Badge key={item.id} variant="secondary" className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1">
                  {item.label}
                  <button onClick={() => onRemove(item.id)} className="hover:bg-black/10 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CatalogoSimplePage;
