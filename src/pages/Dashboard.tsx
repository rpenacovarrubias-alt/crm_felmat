import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Eye, Clock, Plus, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    propiedades: 0,
    leads: 0,
    visitas: 0,
    actividades: 0
  });

  useEffect(() => {
    // Simular carga de datos
    setStats({
      propiedades: 12,
      leads: 8,
      visitas: 145,
      actividades: 3
    });
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">¡Hola, Administrador!</h1>
          <p className="text-muted-foreground mt-1">Este es el resumen de tu inmobiliaria</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/propiedades/nueva')}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Propiedad
          </Button>
          <Button variant="outline" onClick={() => navigate('/leads/nuevo')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.propiedades}</div>
            <p className="text-xs text-muted-foreground">0 publicadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads}</div>
            <p className="text-xs text-muted-foreground">0 nuevos este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vistas Totales</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.visitas}</div>
            <p className="text-xs text-muted-foreground">De todas tus propiedades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actividades Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.actividades}</div>
            <p className="text-xs text-muted-foreground">Tareas por completar</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Propiedades Destacadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No hay propiedades destacadas</p>
              <Button variant="outline" onClick={() => navigate('/propiedades')}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar propiedad
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Nuevos', count: 0, color: 'bg-gray-500' },
                { label: 'Contactados', count: 0, color: 'bg-blue-500' },
                { label: 'En seguimiento', count: 0, color: 'bg-yellow-500' },
                { label: 'Visita programada', count: 0, color: 'bg-purple-500' },
                { label: 'Negociación', count: 0, color: 'bg-orange-500' }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
