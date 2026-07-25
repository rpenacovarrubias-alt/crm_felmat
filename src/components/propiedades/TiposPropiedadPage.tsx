import { useAuth } from '@/hooks/useAuth';
import { useTiposPropiedadCustom } from '@/hooks/useDatabase';
import { CatalogoSimplePage } from './CatalogoSimplePage';
import { Tag } from 'lucide-react';

export function TiposPropiedadPage() {
  const { user } = useAuth();
  const { tipos, loading, create, remove } = useTiposPropiedadCustom(user?.id);

  return (
    <CatalogoSimplePage
      title="Tipos de Propiedades"
      description="Agrega tipos de propiedad personalizados además de los predefinidos"
      placeholder="Ej: Rancho ecuestre"
      icon={Tag}
      items={tipos}
      loading={loading}
      onCreate={(label) => user && create(user.id, label)}
      onRemove={remove}
    />
  );
}

export default TiposPropiedadPage;
