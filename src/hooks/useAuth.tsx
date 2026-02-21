// ============================================
// SISTEMA DE AUTENTICACIÓN MULTIUSUARIO - CON ROLES
// ============================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@/types';

// Datos de demo para iniciar rápidamente
const DEMO_USERS: User[] = [
  {
    id: 'admin-1',
    email: 'admin@felmat.com',
    name: 'Administrador',
    lastName: 'Sistema',
    phone: '+52 55 1234 5678',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    config: {
      whatsappNumber: '+52 55 1234 5678',
      bio: 'Administrador del sistema Grupo FELMAT CRM',
      certificateNumber: 'ADMIN-2024-001',
      branding: {
        primaryColor: '#1e40af',
        secondaryColor: '#f59e0b',
      },
    },
  },
  {
    id: 'agent-1',
    email: 'agente@felmat.com',
    name: 'Ricardo',
    lastName: 'FELMAT',
    phone: '+52 55 9876 5432',
    role: 'agent',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    config: {
      whatsappNumber: '+52 55 9876 5432',
      telegramUsername: 'ricardo_felmat',
      bio: 'Agente inmobiliario certificado especializado en propiedades de lujo',
      certificateNumber: 'FELMAT-2024-001',
      socialLinks: {
        facebook: 'https://facebook.com/felmat.inmobiliaria',
        instagram: 'https://instagram.com/felmat.inmobiliaria',
        linkedin: 'https://linkedin.com/company/felmat',
      },
      branding: {
        primaryColor: '#1e40af',
        secondaryColor: '#f59e0b',
        logo: '/logo-felmat.png',
      },
      shareSettings: {
        showName: true,
        showPhone: true,
        showWhatsApp: true,
        showCertificate: true,
        showEmail: true,
      },
    },
  },
];

// Storage keys
const AUTH_STORAGE_KEY = 'proptech_auth_user';
const USERS_STORAGE_KEY = 'proptech_users';

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
  // Gestión de usuarios (solo admin)
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<User>;
  updateUserById: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  // Permisos
  canManageUsers: boolean;
  canDeleteProperty: (propertyAgentId: string) => boolean;
  canEditProperty: (propertyAgentId: string) => boolean;
  canViewAllProperties: boolean;
  canViewAllLeads: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEMO_USERS));
      }
    } else {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEMO_USERS));
    }
    
    setIsLoading(false);
  }, []);

  // Guardar usuarios cuando cambien
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users, isLoading]);

  // Login
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.isActive);
    
    if (found && password === '123456') {
      setUser(found);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
      return true;
    }
    
    // Demo login
    if (password === 'demo') {
      const demoUser: User = {
        id: crypto.randomUUID(),
        email,
        name: 'Usuario',
        lastName: 'Demo',
        phone: '',
        role: 'agent',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(demoUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser));
      return true;
    }
    
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    
    // Actualizar también en la lista de usuarios
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  }, [user]);

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  // ============================================
  // GESTIÓN DE USUARIOS (SOLO ADMIN)
  // ============================================
  
  const createUser = useCallback(async (
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<User> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Solo el administrador puede crear usuarios');
    }
    
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setUsers(prev => [...prev, newUser]);
    return newUser;
  }, [user]);

  const updateUserById = useCallback(async (id: string, updates: Partial<User>): Promise<void> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Solo el administrador puede actualizar usuarios');
    }
    
    setUsers(prev => prev.map(u => 
      u.id === id 
        ? { ...u, ...updates, updatedAt: new Date().toISOString() }
        : u
    ));
  }, [user]);

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Solo el administrador puede eliminar usuarios');
    }
    
    // No permitir eliminar el propio usuario admin
    if (id === user.id) {
      throw new Error('No puedes eliminar tu propia cuenta');
    }
    
    setUsers(prev => prev.filter(u => u.id !== id));
  }, [user]);

  const toggleUserStatus = useCallback(async (id: string): Promise<void> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Solo el administrador puede cambiar el estado de usuarios');
    }
    
    setUsers(prev => prev.map(u => 
      u.id === id 
        ? { ...u, isActive: !u.isActive, updatedAt: new Date().toISOString() }
        : u
    ));
  }, [user]);

  // ============================================
  // PERMISOS
  // ============================================
  
  const isAdmin = user?.role === 'admin';
  const isAgent = user?.role === 'agent';
  
  const canManageUsers = isAdmin;
  
  const canDeleteProperty = useCallback((propertyAgentId: string): boolean => {
    if (!user) return false;
    // Admin puede eliminar cualquier propiedad
    if (user.role === 'admin') return true;
    // Agente solo puede eliminar sus propias propiedades
    return propertyAgentId === user.id;
  }, [user]);

  const canEditProperty = useCallback((propertyAgentId: string): boolean => {
    if (!user) return false;
    // Admin puede editar cualquier propiedad
    if (user.role === 'admin') return true;
    // Agente solo puede editar sus propias propiedades
    return propertyAgentId === user.id;
  }, [user]);

  const canViewAllProperties = isAdmin;
  const canViewAllLeads = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        isAgent,
        login,
        logout,
        updateUser,
        hasRole,
        createUser,
        updateUserById,
        deleteUser,
        toggleUserStatus,
        canManageUsers,
        canDeleteProperty,
        canEditProperty,
        canViewAllProperties,
        canViewAllLeads,
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

// Hook para proteger rutas
export function useRequireAuth(roles?: UserRole[]) {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
    if (!isLoading && isAuthenticated && roles && !hasRole(roles)) {
      // Redirigir a página no autorizada
      window.location.href = '/unauthorized';
    }
  }, [isLoading, isAuthenticated, roles, hasRole]);

  return { user, isLoading };
}
