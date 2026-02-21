// ============================================
// TIPOS DEL CRM INMOBILIARIO - PROPTech
// ============================================

// Tipos de usuario y roles
export type UserRole = 'admin' | 'agent' | 'assistant';

export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  agencyId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Configuración del agente
  config?: AgentConfig;
}

export interface AgentConfig {
  whatsappNumber?: string;
  telegramUsername?: string;
  websiteUrl?: string;
  bio?: string;
  certificateNumber?: string; // Número de certificado del agente
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
  // Configuración de compartir fichas
  shareSettings?: {
    showName: boolean;
    showPhone: boolean;
    showWhatsApp: boolean;
    showCertificate: boolean;
    showEmail: boolean;
  };
}

// Agencia/Inmobiliaria
export interface Agency {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  adminId: string;
  agents: string[];
  createdAt: string;
  updatedAt: string;
}

// Tipos de propiedad
export type PropertyType = 
  | 'casa' 
  | 'departamento' 
  | 'terreno' 
  | 'oficina' 
  | 'local' 
  | 'bodega' 
  | 'rancho' 
  | 'penthouse'
  | 'loft'
  | 'otro';

export type PropertyStatus = 
  | 'disponible' 
  | 'reservado' 
  | 'vendido' 
  | 'rentado'
  | 'en_negociacion'
  | 'inactivo';

export type TransactionType = 'venta' | 'renta' | 'venta_renta';

// Ubicación
export interface Location {
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  references?: string;
}

// Características de la propiedad
export interface PropertyFeatures {
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  constructionArea: number; // m²
  terrainArea: number; // m²
  floors?: number;
  yearBuilt?: number;
  amenities: string[];
  additionalFeatures?: string[];
}

// Fotos de propiedad
export interface PropertyImage {
  id: string;
  url: string;
  thumbnail?: string;
  isMain: boolean;
  order: number;
  caption?: string;
}

// Propiedad
export interface Property {
  id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  transactionType: TransactionType;
  price: number;
  priceCurrency: string;
  maintenanceFee?: number;
  status: PropertyStatus;
  location: Location;
  features: PropertyFeatures;
  images: PropertyImage[];
  // Metadatos
  agentId: string;
  agencyId?: string;
  // SEO y marketing
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  // Estadísticas
  views: number;
  leadsCount: number;
  favoritesCount: number;
  // Fechas
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  // Visibilidad
  isPublished: boolean;
  isFeatured: boolean;
  // Comisión
  commission?: number;
  commissionType?: 'porcentaje' | 'monto_fijo';
}

// Cliente/Lead
export type LeadStatus = 
  | 'nuevo' 
  | 'contactado' 
  | 'calificado' 
  | 'en_seguimiento'
  | 'visita_programada'
  | 'visita_realizada'
  | 'oferta_hecha'
  | 'negociacion'
  | 'cerrado_ganado'
  | 'cerrado_perdido'
  | 'descartado';

export type LeadSource = 
  | 'sitio_web' 
  | 'whatsapp' 
  | 'telegram'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'inmuebles24'
  | 'lamudi'
  | 'propiedades_com'
  | 'referido'
  | 'llamada'
  | 'visita_oficina'
  | 'otro';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  telegram?: string;
  source: LeadSource;
  status: LeadStatus;
  // Interés
  interestedPropertyId?: string;
  interestedPropertyType?: PropertyType;
  transactionType?: TransactionType;
  budgetMin?: number;
  budgetMax?: number;
  preferredLocation?: string;
  notes: Note[];
  // Asignación
  assignedTo: string;
  // Actividad
  lastContactAt?: string;
  nextFollowUpAt?: string;
  // Pipeline
  pipelineStage: string;
  score: number; // 0-100
  // Fechas
  createdAt: string;
  updatedAt: string;
}

// Nota/Comentario
export interface Note {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

// Actividad/Tarea
export type ActivityType = 
  | 'llamada' 
  | 'email' 
  | 'visita' 
  | 'seguimiento' 
  | 'reunion'
  | 'whatsapp'
  | 'propuesta'
  | 'tarea';

export type ActivityStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  status: ActivityStatus;
  // Relaciones
  leadId?: string;
  propertyId?: string;
  // Asignación
  assignedTo: string;
  createdBy: string;
  // Fechas
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Recordatorio
  reminderAt?: string;
  reminderSent?: boolean;
}

// Pipeline/Embudo de ventas
export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
  probability: number; // % de probabilidad de cierre
  leads: string[]; // IDs de leads
}

export interface Pipeline {
  id: string;
  name: string;
  agencyId?: string;
  stages: PipelineStage[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Ficha técnica compartida
export interface SharedProperty {
  id: string;
  propertyId: string;
  // Personalización
  customTitle?: string;
  customDescription?: string;
  customImages?: string[];
  // Compartido con
  sharedWith: {
    name: string;
    email?: string;
    phone?: string;
  };
  // Canal
  channel: 'whatsapp' | 'email' | 'telegram' | 'web' | 'social';
  // Retroalimentación
  feedback?: {
    liked: boolean;
    comment?: string;
    respondedAt: string;
  };
  // Tracking
  views: number;
  uniqueViews: number;
  lastViewedAt?: string;
  // Fechas
  createdAt: string;
  expiresAt?: string;
}

// Estadísticas
export interface DashboardStats {
  // Propiedades
  totalProperties: number;
  publishedProperties: number;
  featuredProperties: number;
  propertiesByStatus: Record<PropertyStatus, number>;
  propertiesByType: Record<PropertyType, number>;
  // Leads
  totalLeads: number;
  newLeadsThisMonth: number;
  leadsByStatus: Record<LeadStatus, number>;
  leadsBySource: Record<LeadSource, number>;
  // Conversiones
  conversionRate: number;
  averageDealValue: number;
  totalSalesValue: number;
  // Actividad
  activitiesThisWeek: number;
  pendingActivities: number;
  overdueActivities: number;
  // Vistas
  totalPropertyViews: number;
  viewsThisMonth: number;
}

// Configuración del sitio web del agente
export interface AgentWebsite {
  id: string;
  agentId: string;
  isActive: boolean;
  // Dominio
  subdomain: string;
  customDomain?: string;
  // Contenido
  heroTitle: string;
  heroSubtitle: string;
  heroImage?: string;
  aboutText?: string;
  // Contacto
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  // Diseño
  theme: 'modern' | 'classic' | 'minimal' | 'luxury';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  // Secciones visibles
  sections: {
    hero: boolean;
    properties: boolean;
    about: boolean;
    testimonials: boolean;
    contact: boolean;
    blog: boolean;
  };
  // Propiedades mostradas
  featuredPropertyIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Notificación
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  // Relación
  relatedTo?: {
    type: 'lead' | 'property' | 'activity';
    id: string;
  };
  // Estado
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// Configuración de integraciones
export interface IntegrationConfig {
  whatsappBusiness?: {
    enabled: boolean;
    phoneNumberId?: string;
    accessToken?: string;
    webhookUrl?: string;
  };
  telegram?: {
    enabled: boolean;
    botToken?: string;
    botUsername?: string;
  };
  facebook?: {
    enabled: boolean;
    pageId?: string;
    accessToken?: string;
  };
  googleCalendar?: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
  };
  sendgrid?: {
    enabled: boolean;
    apiKey?: string;
    fromEmail?: string;
    fromName?: string;
  };
}

// Filtros de búsqueda
export interface PropertyFilters {
  propertyType?: PropertyType;
  transactionType?: TransactionType;
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minParking?: number;
  minArea?: number;
  maxArea?: number;
  amenities?: string[];
  status?: PropertyStatus;
  agentId?: string;
  agencyId?: string;
  query?: string;
}

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  propertyId?: string;
  dateFrom?: string;
  dateTo?: string;
  query?: string;
}

// Respuestas API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
