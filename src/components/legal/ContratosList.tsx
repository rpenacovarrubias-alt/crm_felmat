// ============================================
// LISTA DE CONTRATOS
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useContratos } from '@/hooks/useDatabase';
import type { EstatusContrato } from '@/types';
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
import { FileSignature, Plus, Search, Trash2 } from 'lucide-react';

const ESTATUS: Record<EstatusContrato, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  borrador: { label: 'Borrador', variant: 'outline' },
  revision: { label: 'En revisión', variant: 'secondary' },
  firmado: { label: 'Firmado', variant: 'default' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
};

const TIPO_LABELS: Record<string, string> = {
  compraventa: 'Compraventa',
  arrendamiento: 'Arrendamiento',
  comision: 'Comisión',
  exclusividad: 'Exclusividad',
  otro: 'Otro',
};

export function ContratosList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contratos, loading, remove } = useContratos(user?.id);
  const [search, setSearch] = useState('');

  const filtered = contratos.filter(c => c.titulo.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este contrato?')) return;
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
          <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground mt-1">Administra contratos de compraventa, arrendamiento y comisión</p>
        </div>
        <Button onClick={() => navigate('/legal/contratos/nuevo')}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo contrato
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar contrato..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileSignature className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {search ? 'No se encontraron contratos' : 'Aún no has generado contratos'}
            </p>
            <Button onClick={() => navigate('/legal/contratos/nuevo')}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo contrato
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Fecha de firma</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/legal/contratos/${c.id}`)}>
                    <TableCell className="font-medium">{c.titulo}</TableCell>
                    <TableCell>{TIPO_LABELS[c.tipo]}</TableCell>
                    <TableCell><Badge variant={ESTATUS[c.estatus].variant}>{ESTATUS[c.estatus].label}</Badge></TableCell>
                    <TableCell>{c.fechaFirma ? new Date(c.fechaFirma).toLocaleDateString('es-MX') : '—'}</TableCell>
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

export default ContratosList;
