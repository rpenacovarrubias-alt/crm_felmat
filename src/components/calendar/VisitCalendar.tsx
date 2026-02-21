// ============================================
// CALENDARIO DE VISITAS - Agenda de propiedades
// ============================================

import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, type View, type NavigateAction } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useProperties, useLeads } from '@/hooks/useDatabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Plus,
  ChevronLeft,
  ChevronRight,
  Home,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configurar localizador en español
const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Tipos
interface Visit {
  id: string;
  title: string;
  start: Date;
  end: Date;
  propertyId: string;
  leadId: string;
  agentId: string;
  status: 'programada' | 'completada' | 'cancelada' | 'no_show';
  notes?: string;
  propertyTitle: string;
  leadName: string;
  leadPhone: string;
}

// Eventos de ejemplo
const sampleVisits: Visit[] = [
  {
    id: '1',
    title: 'Visita - Casa en Polanco',
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    end: new Date(new Date().setHours(11, 0, 0, 0)),
    propertyId: 'prop-1',
    leadId: 'lead-1',
    agentId: 'agent-1',
    status: 'programada',
    propertyTitle: 'Casa en Polanco',
    leadName: 'Juan Pérez',
    leadPhone: '+52 55 1234 5678',
  },
  {
    id: '2',
    title: 'Visita - Departamento Santa Fe',
    start: new Date(new Date().setDate(new Date().getDate() + 1)),
    end: new Date(new Date().setDate(new Date().getDate() + 1)),
    propertyId: 'prop-2',
    leadId: 'lead-2',
    agentId: 'agent-1',
    status: 'programada',
    propertyTitle: 'Departamento Santa Fe',
    leadName: 'María García',
    leadPhone: '+52 55 8765 4321',
  },
];

const messages = {
  today: 'Hoy',
  previous: 'Anterior',
  next: 'Siguiente',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay visitas programadas en este período',
  showMore: (total: number) => `+${total} más`,
};

export function VisitCalendar() {
  const { user, isAdmin } = useAuth();
  const { properties } = useProperties();
  const { leads } = useLeads();
  const [visits, setVisits] = useState<Visit[]>(sampleVisits);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewVisitDialogOpen, setIsNewVisitDialogOpen] = useState(false);

  // Formulario de nueva visita
  const [newVisit, setNewVisit] = useState({
    propertyId: '',
    leadId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    duration: '60',
    notes: '',
  });

  // Filtrar propiedades y leads según permisos
  const filteredProperties = isAdmin 
    ? properties 
    : properties.filter(p => p.agentId === user?.id);

  const filteredLeads = isAdmin 
    ? leads 
    : leads.filter(l => l.assignedTo === user?.id);

  // Filtrar visitas según permisos
  const filteredVisits = isAdmin 
    ? visits 
    : visits.filter(v => v.agentId === user?.id);

  const events = useMemo(() => {
    return filteredVisits.map(visit => ({
      ...visit,
      start: new Date(visit.start),
      end: new Date(visit.end),
    }));
  }, [filteredVisits]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'programada': return 'bg-blue-500';
      case 'completada': return 'bg-green-500';
      case 'cancelada': return 'bg-red-500';
      case 'no_show': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'programada': return <Clock className="w-4 h-4" />;
      case 'completada': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelada': return <XCircle className="w-4 h-4" />;
      case 'no_show': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleSelectEvent = (event: Visit) => {
    setSelectedVisit(event);
    setIsDialogOpen(true);
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setNewVisit(prev => ({
      ...prev,
      date: format(start, 'yyyy-MM-dd'),
    }));
    setIsNewVisitDialogOpen(true);
  };

  const handleCreateVisit = () => {
    const property = filteredProperties.find(p => p.id === newVisit.propertyId);
    const lead = filteredLeads.find(l => l.id === newVisit.leadId);
    
    if (!property || !lead) return;

    const startDate = new Date(`${newVisit.date}T${newVisit.time}`);
    const endDate = new Date(startDate.getTime() + parseInt(newVisit.duration) * 60000);

    const visit: Visit = {
      id: crypto.randomUUID(),
      title: `Visita - ${property.title}`,
      start: startDate,
      end: endDate,
      propertyId: property.id,
      leadId: lead.id,
      agentId: user?.id || '',
      status: 'programada',
      notes: newVisit.notes,
      propertyTitle: property.title,
      leadName: lead.name,
      leadPhone: lead.phone,
    };

    setVisits(prev => [...prev, visit]);
    setIsNewVisitDialogOpen(false);
    setNewVisit({
      propertyId: '',
      leadId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '10:00',
      duration: '60',
      notes: '',
    });
  };

  const handleUpdateStatus = (visitId: string, status: Visit['status']) => {
    setVisits(prev => prev.map(v => 
      v.id === visitId ? { ...v, status } : v
    ));
    setIsDialogOpen(false);
  };

  const CustomToolbar = ({ label, onNavigate }: { label: string; onNavigate: (action: NavigateAction) => void }) => (
    <div className="flex items-center justify-between mb-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onNavigate('PREV')}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={() => onNavigate('TODAY')}>
          Hoy
        </Button>
        <Button variant="outline" size="icon" onClick={() => onNavigate('NEXT')}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <h2 className="text-xl font-semibold">{label}</h2>
      <div className="flex items-center gap-2">
        <Button 
          variant={view === 'month' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setView('month')}
        >
          Mes
        </Button>
        <Button 
          variant={view === 'week' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setView('week')}
        >
          Semana
        </Button>
        <Button 
          variant={view === 'day' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setView('day')}
        >
          Día
        </Button>
        <Button 
          variant={view === 'agenda' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setView('agenda')}
        >
          Agenda
        </Button>
      </div>
    </div>
  );

  const EventComponent = ({ event }: { event: Visit }) => (
    <div className={cn(
      "p-1 rounded text-xs text-white truncate",
      getStatusColor(event.status)
    )}>
      <div className="font-medium truncate">{event.title}</div>
      <div className="text-[10px] opacity-90">{event.leadName}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario de Visitas</h1>
          <p className="text-muted-foreground mt-1">
            Agenda y gestiona las visitas a propiedades
          </p>
        </div>
        <Button onClick={() => setIsNewVisitDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Visita
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredVisits.filter(v => v.status === 'programada').length}
                </p>
                <p className="text-xs text-muted-foreground">Programadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredVisits.filter(v => v.status === 'completada').length}
                </p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredVisits.filter(v => v.status === 'cancelada').length}
                </p>
                <p className="text-xs text-muted-foreground">Canceladas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredVisits.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            components={{
              toolbar: CustomToolbar,
              event: EventComponent,
            }}
            messages={messages}
            culture="es"
            className="min-h-[600px]"
          />
        </CardContent>
      </Card>

      {/* Visit Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de la Visita</DialogTitle>
            <DialogDescription>
              Información de la visita programada
            </DialogDescription>
          </DialogHeader>
          
          {selectedVisit && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedVisit.status)}>
                  {getStatusIcon(selectedVisit.status)}
                  <span className="ml-1 capitalize">{selectedVisit.status}</span>
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedVisit.propertyTitle}</p>
                    <p className="text-sm text-muted-foreground">Propiedad</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedVisit.leadName}</p>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{selectedVisit.leadPhone}</p>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(selectedVisit.start), 'EEEE, d MMMM yyyy', { locale: es })}
                    </p>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(selectedVisit.start), 'HH:mm')} - {format(new Date(selectedVisit.end), 'HH:mm')}
                    </p>
                    <p className="text-sm text-muted-foreground">Hora</p>
                  </div>
                </div>

                {selectedVisit.notes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Notas:</p>
                    <p className="text-sm text-muted-foreground">{selectedVisit.notes}</p>
                  </div>
                )}
              </div>

              {selectedVisit.status === 'programada' && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => handleUpdateStatus(selectedVisit.id, 'completada')}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Completada
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleUpdateStatus(selectedVisit.id, 'cancelada')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Visit Dialog */}
      <Dialog open={isNewVisitDialogOpen} onOpenChange={setIsNewVisitDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Programar Nueva Visita</DialogTitle>
            <DialogDescription>
              Completa los datos para agendar una visita
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Propiedad *</Label>
              <Select
                value={newVisit.propertyId}
                onValueChange={(value) => setNewVisit(prev => ({ ...prev, propertyId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una propiedad" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={newVisit.leadId}
                onValueChange={(value) => setNewVisit(prev => ({ ...prev, leadId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {filteredLeads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} - {lead.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={newVisit.date}
                  onChange={(e) => setNewVisit(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora *</Label>
                <Input
                  type="time"
                  value={newVisit.time}
                  onChange={(e) => setNewVisit(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duración</Label>
              <Select
                value={newVisit.duration}
                onValueChange={(value) => setNewVisit(prev => ({ ...prev, duration: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1 hora 30 min</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Instrucciones especiales, punto de encuentro, etc."
                value={newVisit.notes}
                onChange={(e) => setNewVisit(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsNewVisitDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1"
                onClick={handleCreateVisit}
                disabled={!newVisit.propertyId || !newVisit.leadId || !newVisit.date || !newVisit.time}
              >
                <Plus className="w-4 h-4 mr-2" />
                Programar Visita
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VisitCalendar;
