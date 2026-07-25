import { useAuth } from '@/hooks/useAuth';
import { useAmenidadesCatalogo } from '@/hooks/useDatabase';
import { CatalogoSimplePage } from './CatalogoSimplePage';
import { Sparkles } from 'lucide-react';

export function AmenidadesPage() {
  const { user } = useAuth();
  const { amenidades, loading, create, remove } = useAmenidadesCatalogo(user?.id);

  return (
    <CatalogoSimplePage
      title="Amenidades"
      description="Administra el catálogo de amenidades disponibles para tus propiedades"
      placeholder="Ej: Alberca climatizada"
      icon={Sparkles}
      items={amenidades}
      loading={loading}
      onCreate={(label) => user && create(user.id, label)}
      onRemove={remove}
    />
  );
}

export default AmenidadesPage;
