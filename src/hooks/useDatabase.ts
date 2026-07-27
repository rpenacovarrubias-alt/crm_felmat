// ============================================
// HOOK DE BASE DE DATOS LOCAL - IndexedDB
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type {
  User, Property, Lead, LeadStatus, Activity, AgentWebsite, Notification, DashboardStats, PropertyList,
  Condominio, UnidadCondominio, Cotizacion, CartaPresentacion, Contrato, Fianza,
  AirbnbListing, AirbnbMensaje, AirbnbReserva, AirbnbPrecio, TipoPropiedadCustom, AmenidadCatalogo,
} from '@/types';

// Nombre de la base de datos y versión
const DB_NAME = 'PropTechCRM';
const DB_VERSION = 3;

// Stores (tablas)
const STORES = {
  users: 'users',
  agencies: 'agencies',
  properties: 'properties',
  leads: 'leads',
  activities: 'activities',
  pipelines: 'pipelines',
  sharedProperties: 'sharedProperties',
  agentWebsites: 'agentWebsites',
  notifications: 'notifications',
  propertyLists: 'propertyLists',
  condominios: 'condominios',
  unidadesCondominio: 'unidadesCondominio',
  cotizaciones: 'cotizaciones',
  cartaPresentacion: 'cartaPresentacion',
  contratos: 'contratos',
  fianzas: 'fianzas',
  airbnbListings: 'airbnbListings',
  airbnbMensajes: 'airbnbMensajes',
  airbnbReservas: 'airbnbReservas',
  airbnbPrecios: 'airbnbPrecios',
  tiposPropiedadCustom: 'tiposPropiedadCustom',
  amenidadesCatalogo: 'amenidadesCatalogo',
} as const;

// Clase para manejar IndexedDB
class DatabaseManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Crear stores
        if (!db.objectStoreNames.contains(STORES.users)) {
          db.createObjectStore(STORES.users, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.agencies)) {
          db.createObjectStore(STORES.agencies, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.properties)) {
          const propertyStore = db.createObjectStore(STORES.properties, { keyPath: 'id' });
          propertyStore.createIndex('agentId', 'agentId', { unique: false });
          propertyStore.createIndex('status', 'status', { unique: false });
          propertyStore.createIndex('slug', 'slug', { unique: true });
        }
        if (!db.objectStoreNames.contains(STORES.leads)) {
          const leadStore = db.createObjectStore(STORES.leads, { keyPath: 'id' });
          leadStore.createIndex('assignedTo', 'assignedTo', { unique: false });
          leadStore.createIndex('status', 'status', { unique: false });
          leadStore.createIndex('interestedPropertyId', 'interestedPropertyId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.activities)) {
          const activityStore = db.createObjectStore(STORES.activities, { keyPath: 'id' });
          activityStore.createIndex('assignedTo', 'assignedTo', { unique: false });
          activityStore.createIndex('leadId', 'leadId', { unique: false });
          activityStore.createIndex('propertyId', 'propertyId', { unique: false });
        } else {
          // Migración: agrega el índice propertyId a bases ya creadas en v1
          const activityStore = (event.target as IDBOpenDBRequest).transaction!.objectStore(STORES.activities);
          if (!activityStore.indexNames.contains('propertyId')) {
            activityStore.createIndex('propertyId', 'propertyId', { unique: false });
          }
        }
        if (!db.objectStoreNames.contains(STORES.pipelines)) {
          db.createObjectStore(STORES.pipelines, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.sharedProperties)) {
          db.createObjectStore(STORES.sharedProperties, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.agentWebsites)) {
          db.createObjectStore(STORES.agentWebsites, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.notifications)) {
          const notifStore = db.createObjectStore(STORES.notifications, { keyPath: 'id' });
          notifStore.createIndex('userId', 'userId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.propertyLists)) {
          const listStore = db.createObjectStore(STORES.propertyLists, { keyPath: 'id' });
          listStore.createIndex('agentId', 'agentId', { unique: false });
          listStore.createIndex('slug', 'slug', { unique: true });
        }
        if (!db.objectStoreNames.contains(STORES.condominios)) {
          const store = db.createObjectStore(STORES.condominios, { keyPath: 'id' });
          store.createIndex('agentId', 'agentId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.unidadesCondominio)) {
          const store = db.createObjectStore(STORES.unidadesCondominio, { keyPath: 'id' });
          store.createIndex('condominioId', 'condominioId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.cotizaciones)) {
          const store = db.createObjectStore(STORES.cotizaciones, { keyPath: 'id' });
          store.createIndex('agentId', 'agentId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.cartaPresentacion)) {
          const store = db.createObjectStore(STORES.cartaPresentacion, { keyPath: 'id' });
          store.createIndex('agentId', 'agentId', { unique: true });
        }
        if (!db.objectStoreNames.contains(STORES.contratos)) {
          const store = db.createObjectStore(STORES.contratos, { keyPath: 'id' });
          store.createIndex('agentId', 'agentId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.fianzas)) {
          const store = db.createObjectStore(STORES.fianzas, { keyPath: 'id' });
          store.createIndex('agentId', 'agentId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.airbnbListings)) {
          const store = db.createObjectStore(STORES.airbnbListings, { keyPath: 'id' });
          store.createIndex('agentId', 'agentId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.airbnbMensajes)) {
          const store = db.createObjectStore(STORES.airbnbMensajes, { keyPath: 'id' });
          store.createIndex('listingId', 'listingId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.airbnbReservas)) {
          const store = db.createObjectStore(STORES.airbnbReservas, { keyPath: 'id' });
          store.createIndex('listingId', 'listingId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.airbnbPrecios)) {
          const store = db.createObjectStore(STORES.airbnbPrecios, { keyPath: 'id' });
          store.createIndex('listingId', 'listingId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.tiposPropiedadCustom)) {
          const store = db.createObjectStore(STORES.tiposPropiedadCustom, { keyPath: 'id' });
          store.createIndex('agentId', 'agentId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.amenidadesCatalogo)) {
          const store = db.createObjectStore(STORES.amenidadesCatalogo, { keyPath: 'id' });
          store.createIndex('agentId', 'agentId', { unique: false });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // CRUD genérico
  async get<T>(storeName: string, id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Métodos específicos
  async getAllByAgent<T extends { agentId: string }>(storeName: string, agentId: string): Promise<T[]> {
    const all = await this.getAll<T>(storeName);
    return all.filter(item => item.agentId === agentId);
  }
}

// Singleton
const dbManager = new DatabaseManager();

// ============================================
// HOOKS ESPECÍFICOS POR ENTIDAD
// ============================================

// Hook para inicializar la base de datos
export function useDatabaseInit() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    dbManager.init()
      .then(() => setIsReady(true))
      .catch(setError);
  }, []);

  return { isReady, error };
}

// Hook para Usuarios
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await dbManager.getAll<User>(STORES.users);
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbManager.put(STORES.users, newUser);
    await refresh();
    return newUser;
  };

  const update = async (id: string, updates: Partial<User>): Promise<void> => {
    const existing = await dbManager.get<User>(STORES.users, id);
    if (!existing) throw new Error('User not found');
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.users, updated);
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.users, id);
    await refresh();
  };

  return { users, loading, create, update, remove, refresh };
}

// Hook para Propiedades
export function useProperties(agentId?: string) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: Property[];
    if (agentId) {
      data = await dbManager.getByIndex<Property>(STORES.properties, 'agentId', agentId);
    } else {
      data = await dbManager.getAll<Property>(STORES.properties);
    }
    // Ordenar por fecha de creación descendente
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setProperties(data);
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'leadsCount' | 'favoritesCount'>): Promise<Property> => {
    const newProperty: Property = {
      ...property,
      id: crypto.randomUUID(),
      views: 0,
      leadsCount: 0,
      favoritesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbManager.put(STORES.properties, newProperty);
    await refresh();
    return newProperty;
  };

  const update = async (id: string, updates: Partial<Property>): Promise<void> => {
    const existing = await dbManager.get<Property>(STORES.properties, id);
    if (!existing) throw new Error('Property not found');
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.properties, updated);
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.properties, id);
    await refresh();
  };

  const incrementViews = async (id: string): Promise<void> => {
    const existing = await dbManager.get<Property>(STORES.properties, id);
    if (existing) {
      existing.views += 1;
      await dbManager.put(STORES.properties, existing);
    }
  };

  const getBySlug = async (slug: string): Promise<Property | null> => {
    const all = await dbManager.getAll<Property>(STORES.properties);
    return all.find(p => p.slug === slug) || null;
  };

  return { properties, loading, create, update, remove, refresh, incrementViews, getBySlug };
}

// Hook para Leads
export function useLeads(agentId?: string) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: Lead[];
    if (agentId) {
      data = await dbManager.getByIndex<Lead>(STORES.leads, 'assignedTo', agentId);
    } else {
      data = await dbManager.getAll<Lead>(STORES.leads);
    }
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setLeads(data);
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'notes'>): Promise<Lead> => {
    const newLead: Lead = {
      ...lead,
      id: crypto.randomUUID(),
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbManager.put(STORES.leads, newLead);
    await refresh();
    return newLead;
  };

  const update = async (id: string, updates: Partial<Lead>): Promise<void> => {
    const existing = await dbManager.get<Lead>(STORES.leads, id);
    if (!existing) throw new Error('Lead not found');
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.leads, updated);
    await refresh();
  };

  const addNote = async (leadId: string, note: { content: string; authorId: string; authorName: string }): Promise<void> => {
    const existing = await dbManager.get<Lead>(STORES.leads, leadId);
    if (!existing) throw new Error('Lead not found');
    existing.notes.push({
      id: crypto.randomUUID(),
      ...note,
      createdAt: new Date().toISOString(),
    });
    existing.updatedAt = new Date().toISOString();
    await dbManager.put(STORES.leads, existing);
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.leads, id);
    await refresh();
  };

  const moveToStage = async (id: string, stage: LeadStatus): Promise<void> => {
    await update(id, { status: stage });
  };

  return { leads, loading, create, update, remove, addNote, moveToStage, refresh };
}

// Hook para Actividades
export function useActivities(agentId?: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: Activity[];
    if (agentId) {
      data = await dbManager.getByIndex<Activity>(STORES.activities, 'assignedTo', agentId);
    } else {
      data = await dbManager.getAll<Activity>(STORES.activities);
    }
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setActivities(data);
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Activity> => {
    const newActivity: Activity = {
      ...activity,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbManager.put(STORES.activities, newActivity);
    await refresh();
    return newActivity;
  };

  const update = async (id: string, updates: Partial<Activity>): Promise<void> => {
    const existing = await dbManager.get<Activity>(STORES.activities, id);
    if (!existing) throw new Error('Activity not found');
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.activities, updated);
    await refresh();
  };

  const complete = async (id: string): Promise<void> => {
    await update(id, { 
      status: 'completada', 
      completedAt: new Date().toISOString() 
    });
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.activities, id);
    await refresh();
  };

  return { activities, loading, create, update, complete, remove, refresh };
}

// Hook para Notificaciones
export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    let data: Notification[];
    if (userId) {
      data = await dbManager.getByIndex<Notification>(STORES.notifications, 'userId', userId);
    } else {
      data = await dbManager.getAll<Notification>(STORES.notifications);
    }
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.isRead).length);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
    // Poll periódicamente: Header/NotificationCenter quedan montados toda la sesión
    // y no hay pub/sub entre pestañas/componentes al escribir vía notify() directamente.
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const create = async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    await dbManager.put(STORES.notifications, newNotification);
    await refresh();
    return newNotification;
  };

  const markAsRead = async (id: string): Promise<void> => {
    const existing = await dbManager.get<Notification>(STORES.notifications, id);
    if (!existing) throw new Error('Notification not found');
    existing.isRead = true;
    existing.readAt = new Date().toISOString();
    await dbManager.put(STORES.notifications, existing);
    await refresh();
  };

  const markAllAsRead = async (): Promise<void> => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.notifications, id);
    await refresh();
  };

  return { notifications, unreadCount, loading, create, markAsRead, markAllAsRead, remove, refresh };
}

// Hook para estadísticas del dashboard
export function useDashboardStats(agentId?: string) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const calculate = useCallback(async () => {
    const properties = await dbManager.getAll<Property>(STORES.properties);
    const leads = await dbManager.getAll<Lead>(STORES.leads);
    const activities = await dbManager.getAll<Activity>(STORES.activities);

    // Filtrar por agente si se especifica
    const agentProperties = agentId ? properties.filter(p => p.agentId === agentId) : properties;
    const agentLeads = agentId ? leads.filter(l => l.assignedTo === agentId) : leads;
    const agentActivities = agentId ? activities.filter(a => a.assignedTo === agentId) : activities;

    // Calcular estadísticas
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newLeadsThisMonth = agentLeads.filter(l => new Date(l.createdAt) >= thisMonth).length;
    const activitiesThisWeek = agentActivities.filter(a => new Date(a.createdAt) >= thisWeek).length;
    const pendingActivities = agentActivities.filter(a => a.status === 'pendiente').length;
    const overdueActivities = agentActivities.filter(a => 
      a.status === 'pendiente' && a.dueDate && new Date(a.dueDate) < now
    ).length;

    // Propiedades por estado
    const propertiesByStatus = agentProperties.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Propiedades por tipo
    const propertiesByType = agentProperties.reduce((acc, p) => {
      acc[p.propertyType] = (acc[p.propertyType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Leads por estado
    const leadsByStatus = agentLeads.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Leads por fuente
    const leadsBySource = agentLeads.reduce((acc, l) => {
      acc[l.source] = (acc[l.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Conversiones (cerrados ganados)
    const closedWon = agentLeads.filter(l => l.status === 'cerrado_ganado');
    const conversionRate = agentLeads.length > 0 ? (closedWon.length / agentLeads.length) * 100 : 0;
    const totalSalesValue = closedWon.reduce((sum, l) => sum + (l.budgetMax || 0), 0);
    const averageDealValue = closedWon.length > 0 ? totalSalesValue / closedWon.length : 0;

    // Vistas
    const totalPropertyViews = agentProperties.reduce((sum, p) => sum + p.views, 0);
    const viewsThisMonth = agentProperties.reduce((sum, p) => sum + p.views, 0); // Simplificado

    setStats({
      totalProperties: agentProperties.length,
      publishedProperties: agentProperties.filter(p => p.isPublished).length,
      featuredProperties: agentProperties.filter(p => p.isFeatured).length,
      propertiesByStatus,
      propertiesByType,
      totalLeads: agentLeads.length,
      newLeadsThisMonth,
      leadsByStatus,
      leadsBySource,
      conversionRate,
      averageDealValue,
      totalSalesValue,
      activitiesThisWeek,
      pendingActivities,
      overdueActivities,
      totalPropertyViews,
      viewsThisMonth,
    });
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return { stats, loading, refresh: calculate };
}

// Hook para el sitio web del agente
export function useAgentWebsite(agentId?: string) {
  const [website, setWebsite] = useState<AgentWebsite | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }
    const all = await dbManager.getAll<AgentWebsite>(STORES.agentWebsites);
    const found = all.find(w => w.agentId === agentId);
    setWebsite(found || null);
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (data: Omit<AgentWebsite, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentWebsite> => {
    const newWebsite: AgentWebsite = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbManager.put(STORES.agentWebsites, newWebsite);
    await refresh();
    return newWebsite;
  };

  const update = async (id: string, updates: Partial<AgentWebsite>): Promise<void> => {
    const existing = await dbManager.get<AgentWebsite>(STORES.agentWebsites, id);
    if (!existing) throw new Error('Website not found');
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.agentWebsites, updated);
    await refresh();
  };

  return { website, loading, create, update, refresh };
}

// Hook para buscar el sitio web público de un agente por subdominio (sin sesión iniciada)
export function useAgentWebsiteBySubdomain(subdomain?: string) {
  const [website, setWebsite] = useState<AgentWebsite | null | undefined>(undefined);

  useEffect(() => {
    if (!subdomain) return;
    dbManager.getAll<AgentWebsite>(STORES.agentWebsites).then(all => {
      setWebsite(all.find(w => w.subdomain === subdomain) || null);
    });
  }, [subdomain]);

  return { website, loading: website === undefined };
}

// Genera un slug único para una lista pública
function generateListSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36);
}

// Hook para Listas Públicas de propiedades
export function usePropertyLists(agentId?: string) {
  const [lists, setLists] = useState<PropertyList[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: PropertyList[];
    if (agentId) {
      data = await dbManager.getByIndex<PropertyList>(STORES.propertyLists, 'agentId', agentId);
    } else {
      data = await dbManager.getAll<PropertyList>(STORES.propertyLists);
    }
    data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setLists(data);
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (name: string, ownerId: string): Promise<PropertyList> => {
    const newList: PropertyList = {
      id: crypto.randomUUID(),
      name,
      agentId: ownerId,
      propertyIds: [],
      slug: generateListSlug(name),
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbManager.put(STORES.propertyLists, newList);
    await refresh();
    return newList;
  };

  const update = async (id: string, updates: Partial<PropertyList>): Promise<void> => {
    const existing = await dbManager.get<PropertyList>(STORES.propertyLists, id);
    if (!existing) throw new Error('List not found');
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.propertyLists, updated);
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.propertyLists, id);
    await refresh();
  };

  const addProperty = async (id: string, propertyId: string): Promise<void> => {
    const existing = await dbManager.get<PropertyList>(STORES.propertyLists, id);
    if (!existing) throw new Error('List not found');
    if (existing.propertyIds.includes(propertyId)) return;
    await update(id, { propertyIds: [...existing.propertyIds, propertyId] });
  };

  const removeProperty = async (id: string, propertyId: string): Promise<void> => {
    const existing = await dbManager.get<PropertyList>(STORES.propertyLists, id);
    if (!existing) throw new Error('List not found');
    await update(id, { propertyIds: existing.propertyIds.filter(pid => pid !== propertyId) });
  };

  const getBySlug = async (slug: string): Promise<PropertyList | null> => {
    const all = await dbManager.getAll<PropertyList>(STORES.propertyLists);
    return all.find(l => l.slug === slug) || null;
  };

  const incrementViews = async (id: string): Promise<void> => {
    const existing = await dbManager.get<PropertyList>(STORES.propertyLists, id);
    if (existing) {
      existing.views += 1;
      await dbManager.put(STORES.propertyLists, existing);
    }
  };

  return { lists, loading, create, update, remove, addProperty, removeProperty, getBySlug, incrementViews, refresh };
}

// Hook para Administración de Condominios
export function useCondominios(agentId?: string) {
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: Condominio[];
    if (agentId) {
      data = await dbManager.getByIndex<Condominio>(STORES.condominios, 'agentId', agentId);
    } else {
      data = await dbManager.getAll<Condominio>(STORES.condominios);
    }
    data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setCondominios(data);
    setLoading(false);
  }, [agentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (input: Omit<Condominio, 'id' | 'createdAt' | 'updatedAt'>): Promise<Condominio> => {
    const nuevo: Condominio = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.condominios, nuevo);
    await refresh();
    return nuevo;
  };

  const update = async (id: string, updates: Partial<Condominio>): Promise<void> => {
    const existing = await dbManager.get<Condominio>(STORES.condominios, id);
    if (!existing) throw new Error('Condominio no encontrado');
    await dbManager.put(STORES.condominios, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.condominios, id);
    await refresh();
  };

  return { condominios, loading, create, update, remove, refresh };
}

// Hook para Unidades de un Condominio
export function useUnidadesCondominio(condominioId?: string) {
  const [unidades, setUnidades] = useState<UnidadCondominio[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: UnidadCondominio[];
    if (condominioId) {
      data = await dbManager.getByIndex<UnidadCondominio>(STORES.unidadesCondominio, 'condominioId', condominioId);
    } else {
      data = await dbManager.getAll<UnidadCondominio>(STORES.unidadesCondominio);
    }
    data.sort((a, b) => a.numero.localeCompare(b.numero));
    setUnidades(data);
    setLoading(false);
  }, [condominioId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (input: Omit<UnidadCondominio, 'id' | 'createdAt' | 'updatedAt'>): Promise<UnidadCondominio> => {
    const nueva: UnidadCondominio = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.unidadesCondominio, nueva);
    await refresh();
    return nueva;
  };

  const update = async (id: string, updates: Partial<UnidadCondominio>): Promise<void> => {
    const existing = await dbManager.get<UnidadCondominio>(STORES.unidadesCondominio, id);
    if (!existing) throw new Error('Unidad no encontrada');
    await dbManager.put(STORES.unidadesCondominio, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.unidadesCondominio, id);
    await refresh();
  };

  return { unidades, loading, create, update, remove, refresh };
}

// Hook para Cotizaciones
export function useCotizaciones(agentId?: string) {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: Cotizacion[];
    if (agentId) {
      data = await dbManager.getByIndex<Cotizacion>(STORES.cotizaciones, 'agentId', agentId);
    } else {
      data = await dbManager.getAll<Cotizacion>(STORES.cotizaciones);
    }
    data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setCotizaciones(data);
    setLoading(false);
  }, [agentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (input: Omit<Cotizacion, 'id' | 'folio' | 'createdAt' | 'updatedAt'>): Promise<Cotizacion> => {
    const folio = 'COT-' + Date.now().toString(36).toUpperCase();
    const nueva: Cotizacion = { ...input, id: crypto.randomUUID(), folio, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.cotizaciones, nueva);
    await refresh();
    return nueva;
  };

  const update = async (id: string, updates: Partial<Cotizacion>): Promise<void> => {
    const existing = await dbManager.get<Cotizacion>(STORES.cotizaciones, id);
    if (!existing) throw new Error('Cotización no encontrada');
    await dbManager.put(STORES.cotizaciones, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.cotizaciones, id);
    await refresh();
  };

  return { cotizaciones, loading, create, update, remove, refresh };
}

// Hook para Carta de Presentación (documento único por agente)
export function useCartaPresentacion(agentId?: string) {
  const [carta, setCarta] = useState<CartaPresentacion | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (agentId) {
      const data = await dbManager.getByIndex<CartaPresentacion>(STORES.cartaPresentacion, 'agentId', agentId);
      setCarta(data[0] || null);
    } else {
      setCarta(null);
    }
    setLoading(false);
  }, [agentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const save = async (updates: Partial<Omit<CartaPresentacion, 'id' | 'agentId'>>): Promise<CartaPresentacion> => {
    if (!agentId) throw new Error('agentId requerido');
    const existing = carta || (await dbManager.getByIndex<CartaPresentacion>(STORES.cartaPresentacion, 'agentId', agentId))[0];
    const saved: CartaPresentacion = existing
      ? { ...existing, ...updates, updatedAt: new Date().toISOString() }
      : { id: crypto.randomUUID(), agentId, titulo: '', cuerpo: '', incluirLogo: true, ...updates, updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.cartaPresentacion, saved);
    await refresh();
    return saved;
  };

  return { carta, loading, save, refresh };
}

// Hook para Contratos
export function useContratos(agentId?: string) {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: Contrato[];
    if (agentId) {
      data = await dbManager.getByIndex<Contrato>(STORES.contratos, 'agentId', agentId);
    } else {
      data = await dbManager.getAll<Contrato>(STORES.contratos);
    }
    data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setContratos(data);
    setLoading(false);
  }, [agentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (input: Omit<Contrato, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contrato> => {
    const nuevo: Contrato = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.contratos, nuevo);
    await refresh();
    return nuevo;
  };

  const update = async (id: string, updates: Partial<Contrato>): Promise<void> => {
    const existing = await dbManager.get<Contrato>(STORES.contratos, id);
    if (!existing) throw new Error('Contrato no encontrado');
    await dbManager.put(STORES.contratos, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.contratos, id);
    await refresh();
  };

  return { contratos, loading, create, update, remove, refresh };
}

// Hook para Fianzas
export function useFianzas(agentId?: string) {
  const [fianzas, setFianzas] = useState<Fianza[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: Fianza[];
    if (agentId) {
      data = await dbManager.getByIndex<Fianza>(STORES.fianzas, 'agentId', agentId);
    } else {
      data = await dbManager.getAll<Fianza>(STORES.fianzas);
    }
    data.sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
    setFianzas(data);
    setLoading(false);
  }, [agentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (input: Omit<Fianza, 'id' | 'createdAt' | 'updatedAt'>): Promise<Fianza> => {
    const nueva: Fianza = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.fianzas, nueva);
    await refresh();
    return nueva;
  };

  const update = async (id: string, updates: Partial<Fianza>): Promise<void> => {
    const existing = await dbManager.get<Fianza>(STORES.fianzas, id);
    if (!existing) throw new Error('Fianza no encontrada');
    await dbManager.put(STORES.fianzas, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.fianzas, id);
    await refresh();
  };

  return { fianzas, loading, create, update, remove, refresh };
}

// Hook para Anuncios Airbnb (listings enlazados/scrapeados)
export function useAirbnbListings(agentId?: string) {
  const [listings, setListings] = useState<AirbnbListing[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: AirbnbListing[];
    if (agentId) {
      data = await dbManager.getByIndex<AirbnbListing>(STORES.airbnbListings, 'agentId', agentId);
    } else {
      data = await dbManager.getAll<AirbnbListing>(STORES.airbnbListings);
    }
    data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setListings(data);
    setLoading(false);
  }, [agentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (input: Omit<AirbnbListing, 'id' | 'createdAt' | 'updatedAt'>): Promise<AirbnbListing> => {
    const nuevo: AirbnbListing = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await dbManager.put(STORES.airbnbListings, nuevo);
    await refresh();
    return nuevo;
  };

  const update = async (id: string, updates: Partial<AirbnbListing>): Promise<void> => {
    const existing = await dbManager.get<AirbnbListing>(STORES.airbnbListings, id);
    if (!existing) throw new Error('Listing no encontrado');
    await dbManager.put(STORES.airbnbListings, { ...existing, ...updates, updatedAt: new Date().toISOString() });
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.airbnbListings, id);
    await refresh();
  };

  return { listings, loading, create, update, remove, refresh };
}

// Hook para Mensajes Airbnb (por listing)
export function useAirbnbMensajes(listingId?: string) {
  const [mensajes, setMensajes] = useState<AirbnbMensaje[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!listingId) { setMensajes([]); setLoading(false); return; }
    const data = await dbManager.getByIndex<AirbnbMensaje>(STORES.airbnbMensajes, 'listingId', listingId);
    data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    setMensajes(data);
    setLoading(false);
  }, [listingId]);

  useEffect(() => { refresh(); }, [refresh]);

  const send = async (input: Omit<AirbnbMensaje, 'id' | 'createdAt'>): Promise<AirbnbMensaje> => {
    const nuevo: AirbnbMensaje = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    await dbManager.put(STORES.airbnbMensajes, nuevo);
    await refresh();
    return nuevo;
  };

  return { mensajes, loading, send, refresh };
}

// Hook para Reservas Airbnb (por listing)
export function useAirbnbReservas(listingId?: string) {
  const [reservas, setReservas] = useState<AirbnbReserva[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: AirbnbReserva[];
    if (listingId) {
      data = await dbManager.getByIndex<AirbnbReserva>(STORES.airbnbReservas, 'listingId', listingId);
    } else {
      data = await dbManager.getAll<AirbnbReserva>(STORES.airbnbReservas);
    }
    data.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
    setReservas(data);
    setLoading(false);
  }, [listingId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (input: Omit<AirbnbReserva, 'id' | 'createdAt'>): Promise<AirbnbReserva> => {
    const nueva: AirbnbReserva = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    await dbManager.put(STORES.airbnbReservas, nueva);
    await refresh();
    return nueva;
  };

  const update = async (id: string, updates: Partial<AirbnbReserva>): Promise<void> => {
    const existing = await dbManager.get<AirbnbReserva>(STORES.airbnbReservas, id);
    if (!existing) throw new Error('Reserva no encontrada');
    await dbManager.put(STORES.airbnbReservas, { ...existing, ...updates });
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.airbnbReservas, id);
    await refresh();
  };

  return { reservas, loading, create, update, remove, refresh };
}

// Hook para Precios Dinámicos Airbnb (calendario de precios por fecha, por listing)
export function useAirbnbPrecios(listingId?: string) {
  const [precios, setPrecios] = useState<AirbnbPrecio[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!listingId) { setPrecios([]); setLoading(false); return; }
    const data = await dbManager.getByIndex<AirbnbPrecio>(STORES.airbnbPrecios, 'listingId', listingId);
    data.sort((a, b) => a.fecha.localeCompare(b.fecha));
    setPrecios(data);
    setLoading(false);
  }, [listingId]);

  useEffect(() => { refresh(); }, [refresh]);

  const setPrecio = async (fecha: string, precio: number): Promise<void> => {
    if (!listingId) throw new Error('listingId requerido');
    const existing = precios.find(p => p.fecha === fecha)
      || (await dbManager.getByIndex<AirbnbPrecio>(STORES.airbnbPrecios, 'listingId', listingId)).find(p => p.fecha === fecha);
    const saved: AirbnbPrecio = existing ? { ...existing, precio } : { id: crypto.randomUUID(), listingId, fecha, precio };
    await dbManager.put(STORES.airbnbPrecios, saved);
    await refresh();
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.airbnbPrecios, id);
    await refresh();
  };

  return { precios, loading, setPrecio, remove, refresh };
}

// Hook para catálogo personalizable de Tipos de Propiedad
export function useTiposPropiedadCustom(agentId?: string) {
  const [tipos, setTipos] = useState<TipoPropiedadCustom[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: TipoPropiedadCustom[];
    if (agentId) {
      data = await dbManager.getByIndex<TipoPropiedadCustom>(STORES.tiposPropiedadCustom, 'agentId', agentId);
    } else {
      data = await dbManager.getAll<TipoPropiedadCustom>(STORES.tiposPropiedadCustom);
    }
    data.sort((a, b) => a.label.localeCompare(b.label));
    setTipos(data);
    setLoading(false);
  }, [agentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (agentId: string, label: string): Promise<TipoPropiedadCustom> => {
    const nuevo: TipoPropiedadCustom = { id: crypto.randomUUID(), agentId, label, createdAt: new Date().toISOString() };
    await dbManager.put(STORES.tiposPropiedadCustom, nuevo);
    await refresh();
    return nuevo;
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.tiposPropiedadCustom, id);
    await refresh();
  };

  return { tipos, loading, create, remove, refresh };
}

// Hook para catálogo personalizable de Amenidades
export function useAmenidadesCatalogo(agentId?: string) {
  const [amenidades, setAmenidades] = useState<AmenidadCatalogo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let data: AmenidadCatalogo[];
    if (agentId) {
      data = await dbManager.getByIndex<AmenidadCatalogo>(STORES.amenidadesCatalogo, 'agentId', agentId);
    } else {
      data = await dbManager.getAll<AmenidadCatalogo>(STORES.amenidadesCatalogo);
    }
    data.sort((a, b) => a.label.localeCompare(b.label));
    setAmenidades(data);
    setLoading(false);
  }, [agentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (agentId: string, label: string): Promise<AmenidadCatalogo> => {
    const nuevo: AmenidadCatalogo = { id: crypto.randomUUID(), agentId, label, createdAt: new Date().toISOString() };
    await dbManager.put(STORES.amenidadesCatalogo, nuevo);
    await refresh();
    return nuevo;
  };

  const remove = async (id: string): Promise<void> => {
    await dbManager.delete(STORES.amenidadesCatalogo, id);
    await refresh();
  };

  return { amenidades, loading, create, remove, refresh };
}

// Disparador de notificaciones invocable desde cualquier lugar (no es un hook de React,
// para poder llamarse dentro de handlers de submit sin violar las reglas de hooks).
export async function notify(
  userId: string,
  data: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'isRead'>
): Promise<void> {
  const notification: Notification = {
    ...data,
    id: crypto.randomUUID(),
    userId,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  await dbManager.put(STORES.notifications, notification);
}

export default dbManager;
