// ============================================
// SISTEMA DE AUTENTICACIÓN MULTIUSUARIO - BACKEND REAL (Postgres)
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import { apiFetch, setAuthToken, getAuthToken } from '@/utils/apiFetch';

const AUTH_STORAGE_KEY = 'felmat_auth_user';

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ user: User; tempPassword: string }>;
  updateUserById: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  sendCredentials: (userId: string, tempPassword: string) => Promise<void>;
  canManageUsers: boolean;
  canDeleteProperty: (propertyAgentId: string) => boolean;
  canEditProperty: (propertyAgentId: string) => boolean;
  canViewAllProperties: boolean;
  canViewAllLeads: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsers = useCallback(async () => {
    const res = await apiFetch('/api/felmat-users');
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => {
    (async () => {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      const token = getAuthToken();
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser) as User);
        } catch {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
      await refreshUsers();
      setIsLoading(false);
    })();
  }, [refreshUsers]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const res = await apiFetch('/api/felmat-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (json.result === 'ok' && json.user) {
      setAuthToken(json.token);
      setUser(json.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(json.user));
      await refreshUsers();
      return true;
    }
    return false;
  }, [refreshUsers]);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    const res = await apiFetch('/api/felmat-users', {
      method: 'PUT',
      body: JSON.stringify({ id: user.id, ...updates }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo actualizar el perfil');
    setUser(json.user);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(json.user));
    setUsers(prev => prev.map(u => (u.id === json.user.id ? json.user : u)));
  }, [user]);

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const createUser = useCallback(async (
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ user: User; tempPassword: string }> => {
    const res = await apiFetch('/api/felmat-users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo crear el usuario');
    await refreshUsers();
    return { user: json.user, tempPassword: json.tempPassword };
  }, [refreshUsers]);

  const updateUserById = useCallback(async (id: string, updates: Partial<User>): Promise<void> => {
    const res = await apiFetch('/api/felmat-users', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo actualizar el usuario');
    await refreshUsers();
  }, [refreshUsers]);

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    const res = await apiFetch(`/api/felmat-users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo eliminar el usuario');
    await refreshUsers();
  }, [refreshUsers]);

  const toggleUserStatus = useCallback(async (id: string): Promise<void> => {
    const res = await apiFetch('/api/felmat-users', {
      method: 'PUT',
      body: JSON.stringify({ id, toggleActive: true }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo cambiar el estado');
    await refreshUsers();
  }, [refreshUsers]);

  const sendCredentials = useCallback(async (userId: string, tempPassword: string): Promise<void> => {
    const res = await apiFetch('/api/felmat-send-credentials', {
      method: 'POST',
      body: JSON.stringify({ userId, tempPassword }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'No se pudo enviar el correo de credenciales');
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isAgent = user?.role === 'agent';
  const canManageUsers = isAdmin;

  const canDeleteProperty = useCallback((propertyAgentId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return propertyAgentId === user.id;
  }, [user, isAdmin]);

  const canEditProperty = useCallback((propertyAgentId: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return propertyAgentId === user.id;
  }, [user, isAdmin]);

  const canViewAllProperties = isAdmin;
  const canViewAllLeads = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user, users, isAuthenticated: !!user, isLoading, isAdmin, isAgent,
        login, logout, updateUser, hasRole, createUser, updateUserById, deleteUser,
        toggleUserStatus, refreshUsers, sendCredentials, canManageUsers,
        canDeleteProperty, canEditProperty, canViewAllProperties, canViewAllLeads,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(roles?: UserRole[]) {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
    if (!isLoading && isAuthenticated && roles && !hasRole(roles)) {
      window.location.href = '/unauthorized';
    }
  }, [isLoading, isAuthenticated, roles, hasRole]);

  return { user, isLoading };
}
