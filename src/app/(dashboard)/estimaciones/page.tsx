// ==========================================
// PÁGINA PRINCIPAL DE ESTIMACIONES
// ==========================================

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEstimaciones } from '@/hooks/estimaciones/useEstimaciones';
import { EstimacionForm } from '@/components/estimaciones/EstimacionForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calculator, FileText, Trash2, Copy, Eye, MapPin, Ruler } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { formatearPrecio, formatearNumero } from '@/lib/valuacion/calculadora';

export default function EstimacionesPage() {
  const { user } = useAuth();
  const { 
    estimaciones, 
    crearEstimacion, 
    eliminarEstimacion, 
    duplicarEstimacion,
    ejecutarValuacion,
    isLoading 
  } = useEstimaciones();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleCrearEstimacion = (formData: any) => {
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
        title: '❌ Error',
        description: error instanceof Error ? error.message : 'Error al ejecutar valuación',
        variant: 'destructive',
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const styles = {
      borrador: 'bg-gray-100 text-gray-800',
      completada: 'bg-green-100 text-green-800',
      compartida: 'bg-blue-100 text-blue-800',
    };
    return <Badge className={styles[estado as keyof typeof styles]}>{estado}</Badge>;
  };

  if (isLoading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Estimaciones de Valor</h1>
          <p className="text-muted-foreground">
            Calcula el valor estimado de propiedades usando análisis comparativo de mercado
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Estimación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Estimación</DialogTitle>
            </DialogHeader>
            <EstimacionForm 
              onSubmit={handleCrearEstimacion} 
              onCancel={() => setIsOpen(false)}
            />
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
                          <Link href={`/estimaciones/${estimacion.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </Link>
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
    </div>
  );
}
