import { SearchFilters } from '@/components/search/SearchFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Users,
  Eye,
  Clock,
  TrendingUp,
  Plus,
  UserPlus,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header con filtros */}
      <div className="bg-card border-b border-border/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            {/* Título y acciones rápidas */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">¡Hola, Administrador!</h1>
                <p className="text-muted-foreground">Este es el resumen de tu inmobiliaria</p>
              </div>
              <div className="flex items-center gap-2">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Propiedad
                </Button>
                <Button variant="outline" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Nuevo Lead
                </Button>
              </div>
            </div>

            {/* Barra de búsqueda y filtros */}
            <SearchFilters />
          </div>
        </div>
      </div>

      {/* Contenido del dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Propiedades</p>
                  <p className="text-3xl font-bold mt-2">0</p>
                  <p className="text-xs text-muted-foreground mt-1">0 publicadas</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Leads</p>
                  <p className="text-3xl font-bold mt-2">0</p>
                  <p className="text-xs text-muted-foreground mt-1">0 nuevos este mes</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vistas Totales</p>
                  <p className="text-3xl font-bold mt-2">0</p>
                  <p className="text-xs text-muted-foreground mt-1">De todas tus propiedades</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Actividades Pendientes
                  </p>
                  <p className="text-3xl font-bold mt-2">0</p>
                  <p className="text-xs text-muted-foreground mt-1">Tareas por completar</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Propiedades destacadas */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Propiedades Destacadas
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todas
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Building2 className="w-12 h-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No hay propiedades destacadas</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar propiedad
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline de ventas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pipeline de Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Nuevos', value: 0, color: 'bg-gray-500' },
                  { label: 'Contactados', value: 0, color: 'bg-blue-500' },
                  { label: 'En seguimiento', value: 0, color: 'bg-yellow-500' },
                  { label: 'Visita programada', value: 0, color: 'bg-purple-500' },
                  { label: 'Negociación', value: 0, color: 'bg-orange-500' },
                ].map((stage) => (
                  <div key={stage.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <span className="text-sm">{stage.label}</span>
                    </div>
                    <span className="text-sm font-medium">{stage.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
