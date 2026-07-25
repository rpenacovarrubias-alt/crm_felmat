// ============================================
// REPORTES DE LEADS
// ============================================

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeads } from '@/hooks/useDatabase';
import type { LeadStatus, LeadSource } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Percent, Clock } from 'lucide-react';

const STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  calificado: 'Calificado',
  en_seguimiento: 'En seguimiento',
  visita_programada: 'Visita programada',
  visita_realizada: 'Visita realizada',
  oferta_hecha: 'Oferta hecha',
  negociacion: 'Negociación',
  cerrado_ganado: 'Cerrado ganado',
  cerrado_perdido: 'Cerrado perdido',
  descartado: 'Descartado',
};

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

export function ReportesLeadsPage() {
  const { user, canViewAllProperties } = useAuth();
  const { leads, loading } = useLeads(canViewAllProperties ? undefined : user?.id);

  const ganados = leads.filter(l => l.status === 'cerrado_ganado').length;
  const perdidos = leads.filter(l => l.status === 'cerrado_perdido').length;
  const cerrados = ganados + perdidos;
  const tasaConversion = cerrados > 0 ? (ganados / cerrados) * 100 : 0;

  const esteMes = useMemo(() => {
    const now = new Date();
    return leads.filter(l => {
      const d = new Date(l.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [leads]);

  const porEstatus = useMemo(() => {
    const counts = new Map<LeadStatus, number>();
    leads.forEach(l => counts.set(l.status, (counts.get(l.status) || 0) + 1));
    return Array.from(counts.entries())
      .map(([status, value]) => ({ label: STATUS_LABELS[status], value }))
      .sort((a, b) => b.value - a.value);
  }, [leads]);

  const porFuente = useMemo(() => {
    const counts = new Map<LeadSource, number>();
    leads.forEach(l => counts.set(l.source, (counts.get(l.source) || 0) + 1));
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label: label.replace(/_/g, ' '), value }))
      .sort((a, b) => b.value - a.value);
  }, [leads]);

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
        <h1 className="text-3xl font-bold tracking-tight">Reportes de Leads</h1>
        <p className="text-muted-foreground mt-1">Embudo de conversión y origen de tus prospectos</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Users} label="Total de leads" value={leads.length.toString()} />
        <SummaryCard icon={Clock} label="Nuevos este mes" value={esteMes.toString()} />
        <SummaryCard icon={TrendingUp} label="Cerrados ganados" value={ganados.toString()} />
        <SummaryCard icon={Percent} label="Tasa de conversión" value={`${tasaConversion.toFixed(1)}%`} />
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Aún no tienes leads registrados
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Leads por estatus</CardTitle></CardHeader>
            <CardContent><BarList items={porEstatus} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Leads por origen</CardTitle></CardHeader>
            <CardContent><BarList items={porFuente} /></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ReportesLeadsPage;
