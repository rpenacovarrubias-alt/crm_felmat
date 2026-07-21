// ============================================
// DESEMPEÑO DE PROPIEDADES
// ============================================

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProperties, useLeads, useActivities } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Home, Search, Eye, Users, CalendarCheck, ArrowUpDown } from 'lucide-react';

const PERIODOS = [
  { value: 'todo', label: 'Todo el tiempo', dias: null },
  { value: '7', label: 'Últimos 7 días', dias: 7 },
  { value: '30', label: 'Últimos 30 días', dias: 30 },
  { value: '90', label: 'Últimos 90 días', dias: 90 },
] as const;

type SortKey = 'views' | 'prospectos' | 'agendados';

function SummaryCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString('es-MX')}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PropertyPerformance() {
  const { user, canViewAllProperties } = useAuth();
  const { properties, loading } = useProperties(canViewAllProperties ? undefined : user?.id);
  const { leads } = useLeads();
  const { activities } = useActivities();

  const [periodo, setPeriodo] = useState<string>('30');
  const [soloPublicadas, setSoloPublicadas] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('views');
  const [sortDesc, setSortDesc] = useState(true);

  const desde = useMemo(() => {
    const dias = PERIODOS.find(p => p.value === periodo)?.dias;
    if (!dias) return null;
    return new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  }, [periodo]);

  const filteredProperties = useMemo(() => {
    return properties
      .filter(p => !soloPublicadas || p.isPublished)
      .filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
  }, [properties, soloPublicadas, search]);

  const metricsById = useMemo(() => {
    const map = new Map<string, { prospectos: number; agendados: number }>();
    for (const p of filteredProperties) {
      const prospectos = leads.filter(l =>
        l.interestedPropertyId === p.id &&
        (!desde || new Date(l.createdAt) >= desde)
      ).length;
      const agendados = activities.filter(a =>
        a.propertyId === p.id &&
        a.type === 'visita' &&
        (!desde || new Date(a.createdAt) >= desde)
      ).length;
      map.set(p.id, { prospectos, agendados });
    }
    return map;
  }, [filteredProperties, leads, activities, desde]);

  const totals = useMemo(() => {
    let vistas = 0, prospectos = 0, agendados = 0;
    for (const p of filteredProperties) {
      vistas += p.views;
      const m = metricsById.get(p.id);
      prospectos += m?.prospectos ?? 0;
      agendados += m?.agendados ?? 0;
    }
    return { vistas, prospectos, agendados };
  }, [filteredProperties, metricsById]);

  const sortedProperties = useMemo(() => {
    const withMetrics = filteredProperties.map(p => ({
      property: p,
      prospectos: metricsById.get(p.id)?.prospectos ?? 0,
      agendados: metricsById.get(p.id)?.agendados ?? 0,
    }));
    withMetrics.sort((a, b) => {
      const va = sortKey === 'views' ? a.property.views : sortKey === 'prospectos' ? a.prospectos : a.agendados;
      const vb = sortKey === 'views' ? b.property.views : sortKey === 'prospectos' ? b.prospectos : b.agendados;
      return sortDesc ? vb - va : va - vb;
    });
    return withMetrics;
  }, [filteredProperties, metricsById, sortKey, sortDesc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(prev => !prev);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Desempeño de Propiedades</h1>
        <p className="text-muted-foreground mt-1">
          Vistas, prospectos y visitas agendadas por propiedad
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODOS.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={soloPublicadas ? 'publicadas' : 'todas'} onValueChange={(v) => setSoloPublicadas(v === 'publicadas')}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="publicadas">Publicadas</SelectItem>
            <SelectItem value="todas">Todas</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard icon={Eye} label="Vistas totales (histórico)" value={totals.vistas} />
        <SummaryCard icon={Users} label={`Prospectos${desde ? ' en el periodo' : ''}`} value={totals.prospectos} />
        <SummaryCard icon={CalendarCheck} label={`Visitas agendadas${desde ? ' en el periodo' : ''}`} value={totals.agendados} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Propiedades ({sortedProperties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedProperties.length === 0 ? (
            <div className="text-center py-16">
              <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No hay propiedades</h3>
              <p className="text-muted-foreground">
                {search ? 'No se encontraron propiedades con ese nombre' : 'Aún no tienes propiedades registradas'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('views')}>
                        Vistas <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('prospectos')}>
                        Prospectos <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort('agendados')}>
                        Agendados <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProperties.map(({ property, prospectos, agendados }) => {
                    const mainImage = property.images.find(img => img.isMain)?.url || property.images[0]?.url;
                    return (
                      <TableRow key={property.id}>
                        <TableCell>
                          <Link to={`/propiedades/${property.id}`} className="flex items-center gap-3 hover:underline">
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              {mainImage ? (
                                <img src={mainImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Home className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{property.title}</span>
                          </Link>
                        </TableCell>
                        <TableCell>{property.views}</TableCell>
                        <TableCell>{prospectos}</TableCell>
                        <TableCell>{agendados}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PropertyPerformance;
