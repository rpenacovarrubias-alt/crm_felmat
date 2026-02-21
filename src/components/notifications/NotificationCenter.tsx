// ============================================
// CENTRO DE NOTIFICACIONES
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Bell,
  CheckCircle2,
  Trash2,
  User,
  Calendar,
  Building2,
  Clock,
  Check,
  X,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'lead' | 'property' | 'visit' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: {
    leadId?: string;
    propertyId?: string;
    visitId?: string;
  };
}

// Notificaciones de ejemplo
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'lead',
    title: 'Nuevo lead recibido',
    message: 'Juan Pérez se ha registrado como interesado en Casa en Polanco',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
    link: '/leads',
    metadata: { leadId: 'lead-1' },
  },
  {
    id: '2',
    type: 'visit',
    title: 'Visita programada para mañana',
    message: 'Tienes una visita programada a las 10:00 AM con María García',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
    link: '/calendar',
    metadata: { visitId: 'visit-1' },
  },
  {
    id: '3',
    type: 'property',
    title: 'Propiedad destacada',
    message: 'Tu propiedad "Departamento Santa Fe" ha alcanzado 100 vistas',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 día atrás
    link: '/properties',
    metadata: { propertyId: 'prop-1' },
  },
  {
    id: '4',
    type: 'system',
    title: 'Bienvenido al CRM',
    message: 'Gracias por usar Grupo FELMAT CRM. Explora todas las funcionalidades.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 días atrás
  },
];

export function NotificationCenter() {
  const { isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [activeTab, setActiveTab] = useState('all');

  // Filtrar notificaciones según permisos (en una app real, esto vendría del backend)
  const filteredNotifications = isAdmin 
    ? notifications 
    : notifications.filter(n => n.type !== 'system');

  const unreadCount = filteredNotifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'property':
        return <Building2 className="w-5 h-5 text-green-500" />;
      case 'visit':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'system':
        return <Bell className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `Hace ${diffInDays} d`;
    
    return notificationDate.toLocaleDateString('es-MX');
  };

  const displayedNotifications = activeTab === 'all' 
    ? filteredNotifications 
    : activeTab === 'unread' 
      ? filteredNotifications.filter(n => !n.read)
      : filteredNotifications.filter(n => n.type === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Notificaciones
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-sm">
                {unreadCount} nuevas
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Mantente al día con tus leads, visitas y propiedades
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
          {filteredNotifications.length > 0 && (
            <Button variant="outline" onClick={clearAll}>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar todo
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredNotifications.filter(n => n.type === 'lead' && !n.read).length}
                </p>
                <p className="text-xs text-muted-foreground">Leads nuevos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredNotifications.filter(n => n.type === 'visit' && !n.read).length}
                </p>
                <p className="text-xs text-muted-foreground">Visitas próximas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredNotifications.filter(n => n.type === 'property' && !n.read).length}
                </p>
                <p className="text-xs text-muted-foreground">Propiedades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bell className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Sin leer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="all">
            Todas
            {filteredNotifications.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {filteredNotifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Sin leer
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="lead">Leads</TabsTrigger>
          <TabsTrigger value="visit">Visitas</TabsTrigger>
          <TabsTrigger value="property">Propiedades</TabsTrigger>
          {isAdmin && <TabsTrigger value="system">Sistema</TabsTrigger>}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {displayedNotifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No hay notificaciones</h3>
              <p className="text-muted-foreground">
                {activeTab === 'unread' 
                  ? 'No tienes notificaciones sin leer' 
                  : 'No hay notificaciones en esta categoría'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={cn(
                    "transition-colors",
                    !notification.read && "bg-primary/5 border-primary/20"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-lg flex-shrink-0",
                        notification.read ? "bg-muted" : "bg-primary/10"
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className={cn(
                              "font-medium",
                              !notification.read && "text-primary"
                            )}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markAsRead(notification.id)}
                                title="Marcar como leída"
                              >
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNotification(notification.id)}
                              title="Eliminar"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        
                        {notification.link && (
                          <div className="mt-3">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={notification.link}>
                                Ver detalles
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default NotificationCenter;
