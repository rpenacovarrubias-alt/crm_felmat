// ============================================
// HOOK DE BASE DE DATOS LOCAL - IndexedDB
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type { 
  User, Property, Lead, LeadStatus, Activity, AgentWebsite, Notification, DashboardStats 
} from '@/types';

// Nombre de la base de datos y versión
const DB_NAME = 'PropTechCRM';
const DB_VERSION = 1;

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

export default dbManager;
