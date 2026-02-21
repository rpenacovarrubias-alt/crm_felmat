// ============================================
// LISTADO DE CLIENTES / LEADS
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLeads, useProperties } from '@/hooks/useDatabase';
import type { Lead, LeadStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Filter,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  Building2,
  Phone,
  MessageCircle,
} from 'lucide-react';

// Pipeline stages
const pipelineStages: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'nuevo', label: 'Nuevo', color: 'bg-blue-500' },
  { value: 'contactado', label: 'Contactado', color: 'bg-yellow-500' },
  { value: 'calificado', label: 'Calificado', color: 'bg-orange-500' },
  { value: 'en_seguimiento', label: 'En Seguimiento', color: 'bg-purple-500' },
  { value: 'visita_programada', label: 'Visita Programada', color: 'bg-pink-500' },
  { value: 'visita_realizada', label: 'Visita Realizada', color: 'bg-indigo-500' },
  { value: 'oferta_hecha', label: 'Oferta Hecha', color: 'bg-cyan-500' },
  { value: 'negociacion', label: 'Negociación', color: 'bg-amber-500' },
  { value: 'cerrado_ganado', label: 'Cerrado Ganado', color: 'bg-green-500' },
  { value: 'cerrado_perdido', label: 'Cerrado Perdido', color: 'bg-red-500' },
  { value: 'descartado', label: 'Descartado', color: 'bg-gray-500' },
];

const sourceLabels: Record<string, string> = {
  'sitio_web': 'Sitio Web',
  'whatsapp': 'WhatsApp',
  'telegram': 'Telegram',
  'facebook': 'Facebook',
  'instagram': 'Instagram',
  'tiktok': 'TikTok',
  'linkedin': 'LinkedIn',
  'inmuebles24': 'Inmuebles24',
  'lamudi': 'Lamudi',
  'propiedades_com': 'Propiedades.com',
  'referido': 'Referido',
  'llamada': 'Llamada',
  'visita_oficina': 'Visita a Oficina',
  'otro': 'Otro',
};

// Lead card component
function LeadCard({ lead }: { lead: Lead }) {
  const { properties } = useProperties();
  const interestedProperty = properties.find(p => p.id === lead.interestedPropertyId);
  
  const initials = `${lead.name.charAt(0)}${lead.name.split(' ')[1]?.charAt(0) || ''}`.toUpperCase();
  const stage = pipelineStages.find(s => s.value === lead.status);

  // Función para abrir WhatsApp
  const openWhatsApp = () => {
    const phone = lead.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola ${lead.name}, soy tu asesor inmobiliario. ¿En qué puedo ayudarte?`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  // Función para llamar
  const makeCall = () => {
    window.open(`tel:${lead.phone}`, '_self');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg flex-shrink-0">
            {initials}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{lead.name}</h3>
                <p className="text-sm text-muted-foreground">{lead.email}</p>
                <p className="text-sm text-muted-foreground">{lead.phone}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/leads/${lead.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver detalle
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/leads/${lead.id}/edit`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {sourceLabels[lead.source] || lead.source}
              </Badge>
              <Badge className={cn("text-white text-xs", stage?.color)}>
                {stage?.label}
              </Badge>
            </div>

            {interestedProperty && (
              <div className="mt-3 p-2 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Interesado en:</p>
                <p className="text-sm font-medium truncate">{interestedProperty.title}</p>
              </div>
            )}

            {/* Botones de acción rápida */}
            <div className="flex gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                onClick={openWhatsApp}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={makeCall}
              >
                <Phone className="w-4 h-4 mr-1" />
                Llamar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                asChild
              >
                <Link to={`/calendar?lead=${lead.id}`}>
                  <Calendar className="w-4 h-4 mr-1" />
                  Agendar
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(lead.createdAt).toLocaleDateString('es-MX')}
              </span>
              {lead.nextFollowUpAt && (
                <span className={cn(
                  "flex items-center gap-1",
                  new Date(lead.nextFollowUpAt) < new Date() && "text-red-500"
                )}>
                  <Clock className="w-3 h-3" />
                  Seguimiento: {new Date(lead.nextFollowUpAt).toLocaleDateString('es-MX')}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Pipeline view (Kanban)
function PipelineView({ leads }: { leads: Lead[] }) {
  const activeStages = pipelineStages.filter(s => !['cerrado_ganado', 'cerrado_perdido', 'descartado'].includes(s.value));
  const closedStages = pipelineStages.filter(s => ['cerrado_ganado', 'cerrado_perdido', 'descartado'].includes(s.value));

  const StageColumn = ({ stage }: { stage: typeof pipelineStages[0] }) => {
    const stageLeads = leads.filter(l => l.status === stage.value);
    
    return (
      <div className="flex-shrink-0 w-72">
        <div className={cn("p-3 rounded-t-lg text-white font-medium flex items-center justify-between", stage.color)}>
          <span>{stage.label}</span>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {stageLeads.length}
          </Badge>
        </div>
        <div className="bg-muted/50 rounded-b-lg p-3 space-y-3 min-h-[200px]">
          {stageLeads.map(lead => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {activeStages.map(stage => (
          <StageColumn key={stage.value} stage={stage} />
        ))}
      </div>
      
      {closedStages.some(s => leads.filter(l => l.status === s.value).length > 0) && (
        <>
          <div className="border-t" />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Cerrados</h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {closedStages.map(stage => (
                <StageColumn key={stage.value} stage={stage} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Main component
export function LeadList() {
  const { user } = useAuth();
  const { leads, loading } = useLeads(user?.id);
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus leads y pipeline de ventas
          </p>
        </div>
        <Button asChild>
          <Link to="/leads/new">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{leads.length}</p>
            <p className="text-sm text-muted-foreground">Total clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">
              {leads.filter(l => l.status === 'cerrado_ganado').length}
            </p>
            <p className="text-sm text-muted-foreground">Cerrados ganados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">
              {leads.filter(l => ['nuevo', 'contactado'].includes(l.status)).length}
            </p>
            <p className="text-sm text-muted-foreground">Nuevos este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-orange-600">
              {leads.filter(l => l.nextFollowUpAt && new Date(l.nextFollowUpAt) < new Date()).length}
            </p>
            <p className="text-sm text-muted-foreground">Seguimientos vencidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {pipelineStages.map(stage => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px]">
              <Building2 className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Fuente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(sourceLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'pipeline' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('pipeline')}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Pipeline
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <Users className="w-4 h-4 mr-1" />
              Lista
            </Button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Mostrando {filteredLeads.length} de {leads.length} clientes
      </p>

      {/* Content */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No hay clientes</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all' || sourceFilter !== 'all'
              ? 'No se encontraron clientes con los filtros aplicados'
              : 'Comienza agregando tu primer cliente'}
          </p>
          <Button asChild>
            <Link to="/leads/new">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Link>
          </Button>
        </div>
      ) : viewMode === 'pipeline' ? (
        <PipelineView leads={filteredLeads} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}

export default LeadList;
