// ==========================================
// PÁGINA PRINCIPAL DE ESTIMACIONES
// ==========================================

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEstimaciones } from '@/hooks/estimaciones/useEstimaciones';
import { EstimacionForm } from '@/components/estimaciones/EstimacionForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Calculator, FileText, Trash2, Copy, Eye, MapPin, Ruler } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatearPrecio, formatearNumero } from '@/lib/valuacion/calculadora';
import type { EstimacionValuacion } from '@/types/estimacion';

const CONFIANZA_LABEL: Record<string, string> = {
  alta: 'Confianza alta',
  media: 'Confianza media',
  baja: 'Confianza baja',
};

const CONFIANZA_CLASS: Record<string, string> = {
  alta: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  baja: 'bg-red-100 text-red-800',
};

// Diálogo con el resultado calculado (evita una ruta de detalle aparte)
function ResultadoDialog({
  estimacion,
  open,
  onClose,
}: {
  estimacion: EstimacionValuacion | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!estimacion?.resultado) return null;
  const r = estimacion.resultado;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{estimacion.titulo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Valor estimado</p>
            <p className="text-3xl font-bold text-primary">{formatearPrecio(r.valorEstimado)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Rango: {formatearPrecio(r.rangoMinimo)} — {formatearPrecio(r.rangoMaximo)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatearPrecio(r.precioPorMetroCuadrado)}/m² de construcción
            </p>
            <Badge className={CONFIANZA_CLASS[r.confianza]} variant="secondary">
              {CONFIANZA_LABEL[r.confianza]}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">{r.metodologia}</p>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Factores de ajuste</h4>
            <div className="space-y-2">
              {r.factoresAjuste.map((f) => (
                <div key={f.factor} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{f.factor}</p>
                    <p className="text-muted-foreground text-xs">{f.descripcion}</p>
                  </div>
                  <span className={f.impactoPorcentaje >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {f.impactoPorcentaje >= 0 ? '+' : ''}
                    {f.impactoPorcentaje.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3">Comparables utilizados ({r.comparables.length})</h4>
            <div className="space-y-2">
              {r.comparables.map((c) => (
                <div key={c.id} className="p-3 border rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{c.direccion}</p>
                    <Badge variant="outline">{c.similitud}% similar</Badge>
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">
                    {formatearNumero(c.superficieConstruccion)} m² · {formatearPrecio(c.precioVenta)} ·{' '}
                    {c.distanciaKm} km
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EstimacionesPage() {
  const { user } = useAuth();
  const {
    estimaciones,
    crearEstimacion,
    eliminarEstimacion,
    duplicarEstimacion,
    ejecutarValuacion,
    isLoading,
  } = useEstimaciones();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [verEstimacion, setVerEstimacion] = useState<EstimacionValuacion | null>(null);

  const handleCrearEstimacion = (formData: Parameters<typeof crearEstimacion>[0]) => {
    if (!user) return;
    crearEstimacion(formData, user.id);
    setIsOpen(false);
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta estimación?')) {
      eliminarEstimacion(id);
    }
  };

  const handleDuplicar = (id: string) => {
    if (!user) return;
    duplicarEstimacion(id, user.id);
  };

  const handleEjecutarValuacion = (id: string) => {
    try {
      ejecutarValuacion(id);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al ejecutar valuación',
        variant: 'destructive',
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      borrador: 'bg-gray-100 text-gray-800',
      completada: 'bg-green-100 text-green-800',
      compartida: 'bg-blue-100 text-blue-800',
    };
    return <Badge className={styles[estado]}>{estado}</Badge>;
  };

  if (isLoading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estimaciones de Valor</h1>
          <p className="text-muted-foreground mt-1">
            Calcula el valor estimado de propiedades usando análisis comparativo de mercado
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Estimación
          </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Estimación</DialogTitle>
            </DialogHeader>
            <EstimacionForm onSubmit={handleCrearEstimacion} onCancel={() => setIsOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {estimaciones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay estimaciones</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Crea tu primera estimación para calcular el valor de una propiedad usando
              nuestro análisis comparativo de mercado basado en metodología INDAABIN.
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Estimación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Mis Estimaciones ({estimaciones.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Superficie</TableHead>
                  <TableHead>Valor Estimado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimaciones.map((estimacion) => (
                  <TableRow key={estimacion.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {estimacion.titulo}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {estimacion.tipoPropiedad.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {estimacion.ubicacion.colonia}, {estimacion.ubicacion.ciudad}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Ruler className="h-3 w-3" />
                        {formatearNumero(estimacion.dimensiones.superficieConstruccion)} m²
                      </div>
                    </TableCell>
                    <TableCell>
                      {estimacion.resultado ? (
                        <div className="space-y-1">
                          <div className="font-semibold">
                            {formatearPrecio(estimacion.resultado.valorEstimado)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatearPrecio(estimacion.resultado.precioPorMetroCuadrado)}/m²
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin calcular</span>
                      )}
                    </TableCell>
                    <TableCell>{getEstadoBadge(estimacion.estado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!estimacion.resultado && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEjecutarValuacion(estimacion.id)}
                          >
                            <Calculator className="h-4 w-4 mr-1" />
                            Calcular
                          </Button>
                        )}
                        {estimacion.resultado && (
                          <Button variant="outline" size="sm" onClick={() => setVerEstimacion(estimacion)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicar(estimacion.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminar(estimacion.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ResultadoDialog
        estimacion={verEstimacion}
        open={!!verEstimacion}
        onClose={() => setVerEstimacion(null)}
      />
    </div>
  );
}

export default EstimacionesPage;
