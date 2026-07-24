// ============================================
// CENTRO DE NOTIFICACIONES
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useDatabase';
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

// Categoría derivada de relatedTo, para las pestañas de filtro
type NotifCategory = 'lead' | 'property' | 'visit' | 'system';

function getCategory(relatedTo?: { type: 'lead' | 'property' | 'activity'; id: string }): NotifCategory {
  if (!relatedTo) return 'system';
  if (relatedTo.type === 'activity') return 'visit';
  return relatedTo.type;
}

function getLink(relatedTo?: { type: 'lead' | 'property' | 'activity'; id: string }): string | undefined {
  if (!relatedTo) return undefined;
  if (relatedTo.type === 'lead') return `/leads/${relatedTo.id}`;
  if (relatedTo.type === 'property') return `/propiedades/${relatedTo.id}`;
  return '/actividades';
}

export function NotificationCenter() {
  const { user, isAdmin } = useAuth();
  const { notifications, markAsRead, markAllAsRead, remove } = useNotifications(user?.id);
  const [activeTab, setActiveTab] = useState('all');

  // Filtrar notificaciones según permisos
  const filteredNotifications = isAdmin
    ? notifications
    : notifications.filter(n => getCategory(n.relatedTo) !== 'system');

  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

  const clearAll = async () => {
    if (!confirm('¿Eliminar todas las notificaciones?')) return;
    await Promise.all(filteredNotifications.map(n => remove(n.id)));
  };

  const getNotificationIcon = (category: NotifCategory) => {
    switch (category) {
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
      ? filteredNotifications.filter(n => !n.isRead)
      : filteredNotifications.filter(n => getCategory(n.relatedTo) === activeTab);

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
                  {filteredNotifications.filter(n => getCategory(n.relatedTo) === 'lead' && !n.isRead).length}
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
                  {filteredNotifications.filter(n => getCategory(n.relatedTo) === 'visit' && !n.isRead).length}
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
                  {filteredNotifications.filter(n => getCategory(n.relatedTo) === 'property' && !n.isRead).length}
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
              {displayedNotifications.map((notification) => {
                const category = getCategory(notification.relatedTo);
                const link = getLink(notification.relatedTo);
                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      "transition-colors",
                      !notification.isRead && "bg-primary/5 border-primary/20"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-2 rounded-lg flex-shrink-0",
                          notification.isRead ? "bg-muted" : "bg-primary/10"
                        )}>
                          {getNotificationIcon(category)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className={cn(
                                "font-medium",
                                !notification.isRead && "text-primary"
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
                              {!notification.isRead && (
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
                                onClick={() => remove(notification.id)}
                                title="Eliminar"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>

                          {link && (
                            <div className="mt-3">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={link}>
                                  Ver detalles
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default NotificationCenter;
