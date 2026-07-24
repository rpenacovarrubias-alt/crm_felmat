// ============================================
// ACTIVIDADES Y TAREAS
// ============================================

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivities, useLeads, useProperties } from '@/hooks/useDatabase';
import type { Activity, ActivityType, ActivityStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  CheckSquare,
  Plus,
  Phone,
  Mail,
  Home,
  Calendar,
  MessageCircle,
  FileText,
  ClipboardList,
  Users2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

const TIPO_ICONOS: Record<ActivityType, React.ElementType> = {
  llamada: Phone,
  email: Mail,
  visita: Home,
  seguimiento: Clock,
  reunion: Users2,
  whatsapp: MessageCircle,
  propuesta: FileText,
  tarea: ClipboardList,
};

const TIPO_LABELS: Record<ActivityType, string> = {
  llamada: 'Llamada',
  email: 'Email',
  visita: 'Visita',
  seguimiento: 'Seguimiento',
  reunion: 'Reunión',
  whatsapp: 'WhatsApp',
  propuesta: 'Propuesta',
  tarea: 'Tarea',
};

const ESTADO_LABELS: Record<ActivityStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

const ESTADO_COLOR: Record<ActivityStatus, string> = {
  pendiente: 'bg-blue-500',
  en_progreso: 'bg-orange-500',
  completada: 'bg-green-500',
  cancelada: 'bg-gray-500',
};

function isVencida(activity: Activity): boolean {
  return activity.status === 'pendiente' && !!activity.dueDate && new Date(activity.dueDate) < new Date();
}

function NuevaActividadDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { type: ActivityType; title: string; description?: string; leadId?: string; propertyId?: string; dueDate?: string }) => void;
}) {
  const { user } = useAuth();
  const { leads } = useLeads(user?.id);
  const { properties } = useProperties(user?.id);

  const [type, setType] = useState<ActivityType>('tarea');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState<string>('');
  const [propertyId, setPropertyId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');

  const reset = () => {
    setType('tarea');
    setTitle('');
    setDescription('');
    setLeadId('');
    setPropertyId('');
    setDueDate('');
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate({
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      leadId: leadId || undefined,
      propertyId: propertyId || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva actividad</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v: ActivityType) => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TIPO_LABELS) as ActivityType[]).map(t => (
                  <SelectItem key={t} value={t}>{TIPO_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Llamar para dar seguimiento" />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente relacionado</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
                <SelectContent>
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Propiedad relacionada</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fecha límite</Label>
            <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!title.trim()}>Crear actividad</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ActivitiesList() {
  const { user, isAdmin } = useAuth();
  const { activities, loading, create, update, remove } = useActivities(isAdmin ? undefined : user?.id);
  const { leads } = useLeads();
  const { properties } = useProperties();

  const [statusFilter, setStatusFilter] = useState<string>('pendientes');
  const [dialogOpen, setDialogOpen] = useState(false);

  const pendientes = activities.filter(a => a.status === 'pendiente' || a.status === 'en_progreso');
  const vencidas = activities.filter(isVencida);
  const completadasHoy = activities.filter(a =>
    a.status === 'completada' && a.completedAt &&
    new Date(a.completedAt).toDateString() === new Date().toDateString()
  );

  const filtered = activities.filter(a => {
    if (statusFilter === 'pendientes') return a.status === 'pendiente' || a.status === 'en_progreso';
    if (statusFilter === 'completadas') return a.status === 'completada';
    if (statusFilter === 'canceladas') return a.status === 'cancelada';
    return true;
  }).sort((a, b) => {
    const da = a.dueDate ? new Date(a.dueDate).getTime() : new Date(a.createdAt).getTime();
    const db = b.dueDate ? new Date(b.dueDate).getTime() : new Date(b.createdAt).getTime();
    return da - db;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Actividades</h1>
          <p className="text-muted-foreground mt-1">Tareas, llamadas, visitas y seguimientos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva actividad
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{pendientes.length}</p>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-red-600">{vencidas.length}</p>
            <p className="text-sm text-muted-foreground">Vencidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{completadasHoy.length}</p>
            <p className="text-sm text-muted-foreground">Completadas hoy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{activities.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pendientes">Pendientes</SelectItem>
          <SelectItem value="completadas">Completadas</SelectItem>
          <SelectItem value="canceladas">Canceladas</SelectItem>
          <SelectItem value="todas">Todas</SelectItem>
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No hay actividades</h3>
          <p className="text-muted-foreground mb-4">Crea tu primera actividad para empezar a organizarte</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva actividad
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(activity => {
            const Icon = TIPO_ICONOS[activity.type];
            const lead = activity.leadId ? leads.find(l => l.id === activity.leadId) : undefined;
            const property = activity.propertyId ? properties.find(p => p.id === activity.propertyId) : undefined;
            const vencida = isVencida(activity);

            return (
              <Card key={activity.id} className={cn(vencida && "border-red-300")}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{TIPO_LABELS[activity.type]}</Badge>
                          <Badge className={cn("text-white text-xs", ESTADO_COLOR[activity.status])}>
                            {ESTADO_LABELS[activity.status]}
                          </Badge>
                          {vencida && (
                            <Badge variant="destructive" className="text-xs flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Vencida
                            </Badge>
                          )}
                          {lead && <Badge variant="secondary" className="text-xs">{lead.name}</Badge>}
                          {property && <Badge variant="secondary" className="text-xs">{property.title}</Badge>}
                        </div>
                        {activity.dueDate && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(activity.dueDate).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {(activity.status === 'pendiente' || activity.status === 'en_progreso') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Completar"
                              onClick={() => update(activity.id, { status: 'completada', completedAt: new Date().toISOString() })}
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Cancelar"
                              onClick={() => update(activity.id, { status: 'cancelada' })}
                            >
                              <XCircle className="w-4 h-4 text-orange-500" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Eliminar"
                          onClick={() => confirm('¿Eliminar esta actividad?') && remove(activity.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NuevaActividadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={async (data) => {
          if (!user) return;
          await create({
            ...data,
            status: 'pendiente',
            assignedTo: user.id,
            createdBy: user.id,
          });
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

export default ActivitiesList;
