// ============================================
// REPORTES DE VENTAS
// ============================================

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProperties } from '@/hooks/useDatabase';
import type { PropertyType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, TrendingUp, DollarSign, KeyRound } from 'lucide-react';

function SummaryCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map(i => i.value));
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="capitalize">{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function ReportesVentasPage() {
  const { user, canViewAllProperties } = useAuth();
  const { properties, loading } = useProperties(canViewAllProperties ? undefined : user?.id);

  const cerradas = useMemo(() => properties.filter(p => p.status === 'vendido' || p.status === 'rentado'), [properties]);
  const vendidas = cerradas.filter(p => p.status === 'vendido');
  const rentadas = cerradas.filter(p => p.status === 'rentado');
  const ingresoTotal = cerradas.reduce((sum, p) => sum + p.price, 0);
  const promedio = cerradas.length ? ingresoTotal / cerradas.length : 0;

  const porMes = useMemo(() => {
    const now = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    return meses.map(({ year, month }) => ({
      label: `${MESES_CORTOS[month]} ${year}`,
      value: cerradas.filter(p => {
        const d = new Date(p.updatedAt);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length,
    }));
  }, [cerradas]);

  const porTipo = useMemo(() => {
    const counts = new Map<PropertyType, number>();
    cerradas.forEach(p => counts.set(p.propertyType, (counts.get(p.propertyType) || 0) + 1));
    return Array.from(counts.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [cerradas]);

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
        <h1 className="text-3xl font-bold tracking-tight">Reportes de Ventas</h1>
        <p className="text-muted-foreground mt-1">Cierres de venta y renta de tus propiedades</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Home} label="Cierres totales" value={cerradas.length.toString()} />
        <SummaryCard icon={TrendingUp} label="Vendidas" value={vendidas.length.toString()} />
        <SummaryCard icon={KeyRound} label="Rentadas" value={rentadas.length.toString()} />
        <SummaryCard icon={DollarSign} label="Ingreso total cerrado" value={`$${ingresoTotal.toLocaleString('es-MX')}`} />
      </div>

      {cerradas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Aún no tienes propiedades marcadas como vendidas o rentadas
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Cierres por mes (últimos 6 meses)</CardTitle></CardHeader>
            <CardContent><BarList items={porMes} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Cierres por tipo de propiedad</CardTitle></CardHeader>
            <CardContent><BarList items={porTipo} /></CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Valor promedio por cierre</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${promedio.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ReportesVentasPage;
