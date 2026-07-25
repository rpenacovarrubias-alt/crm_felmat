// ============================================
// LISTA DE COTIZACIONES
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCotizaciones } from '@/hooks/useDatabase';
import type { EstatusCotizacion } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Plus, Search, Trash2 } from 'lucide-react';

const ESTATUS: Record<EstatusCotizacion, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  borrador: { label: 'Borrador', variant: 'outline' },
  enviada: { label: 'Enviada', variant: 'secondary' },
  aceptada: { label: 'Aceptada', variant: 'default' },
  rechazada: { label: 'Rechazada', variant: 'destructive' },
  vencida: { label: 'Vencida', variant: 'destructive' },
};

function total(items: { cantidad: number; precioUnitario: number }[]) {
  return items.reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);
}

export function CotizacionesList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cotizaciones, loading, remove } = useCotizaciones(user?.id);
  const [search, setSearch] = useState('');

  const filtered = cotizaciones.filter(c =>
    c.folio.toLowerCase().includes(search.toLowerCase()) ||
    c.clienteNombre.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta cotización?')) return;
    await remove(id);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cotizaciones</h1>
          <p className="text-muted-foreground mt-1">Genera y da seguimiento a cotizaciones para tus clientes</p>
        </div>
        <Button onClick={() => navigate('/cotizaciones/nueva')}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva cotización
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por folio o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {search ? 'No se encontraron cotizaciones' : 'Aún no has generado cotizaciones'}
            </p>
            <Button onClick={() => navigate('/cotizaciones/nueva')}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva cotización
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/cotizaciones/${c.id}`)}>
                    <TableCell className="font-medium">{c.folio}</TableCell>
                    <TableCell>{c.clienteNombre}</TableCell>
                    <TableCell>${total(c.items).toLocaleString('es-MX')}</TableCell>
                    <TableCell><Badge variant={ESTATUS[c.estatus].variant}>{ESTATUS[c.estatus].label}</Badge></TableCell>
                    <TableCell>{new Date(c.createdAt).toLocaleDateString('es-MX')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, c.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CotizacionesList;
