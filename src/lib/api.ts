// ============================================
// API PARA INTEGRACIÓN CON N8N
// ============================================

import type { Property, Lead, User } from '@/types';

// Base URL para la API (en producción sería el dominio real)
const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

// Webhook events que puede escuchar n8n
export type WebhookEvent = 
  | 'property.created'
  | 'property.updated'
  | 'property.deleted'
  | 'property.published'
  | 'property.shared'
  | 'lead.created'
  | 'lead.updated'
  | 'lead.status_changed'
  | 'lead.assigned';

// Configuración de webhooks
export interface WebhookConfig {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  isActive: boolean;
  createdAt: string;
}

// Payload para webhooks
export interface WebhookPayload<T = unknown> {
  event: WebhookEvent;
  timestamp: string;
  data: T;
  agentId?: string;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// ============================================
// FUNCIONES DE API PARA N8N
// ============================================

/**
 * Obtener todas las propiedades (para n8n)
 */
export async function getAllPropertiesForN8n(
  filters?: {
    agentId?: string;
    status?: string;
    isPublished?: boolean;
    fromDate?: string;
    toDate?: string;
  }
): Promise<ApiResponse<Property[]>> {
  try {
    // En una implementación real, esto haría una llamada fetch a tu backend
    // Por ahora, retornamos los datos del localStorage/IndexedDB
    const properties = await getPropertiesFromStorage(filters);
    
    return {
      success: true,
      data: properties,
      meta: {
        total: properties.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtener una propiedad específica por ID
 */
export async function getPropertyByIdForN8n(
  propertyId: string
): Promise<ApiResponse<Property>> {
  try {
    const properties = await getPropertiesFromStorage();
    const property = properties.find(p => p.id === propertyId);
    
    if (!property) {
      return {
        success: false,
        error: 'Propiedad no encontrada',
      };
    }
    
    return {
      success: true,
      data: property,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtener una propiedad específica por slug
 */
export async function getPropertyBySlugForN8n(
  slug: string
): Promise<ApiResponse<Property>> {
  try {
    const properties = await getPropertiesFromStorage();
    const property = properties.find(p => p.slug === slug);
    
    if (!property) {
      return {
        success: false,
        error: 'Propiedad no encontrada',
      };
    }
    
    return {
      success: true,
      data: property,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtener todas las leads (para n8n)
 */
export async function getAllLeadsForN8n(
  filters?: {
    agentId?: string;
    status?: string;
    source?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<ApiResponse<Lead[]>> {
  try {
    const leads = await getLeadsFromStorage(filters);
    
    return {
      success: true,
      data: leads,
      meta: {
        total: leads.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtener información del agente
 */
export async function getAgentInfoForN8n(
  agentId: string
): Promise<ApiResponse<User>> {
  try {
    const agents = await getAgentsFromStorage();
    const agent = agents.find(a => a.id === agentId);
    
    if (!agent) {
      return {
        success: false,
        error: 'Agente no encontrado',
      };
    }
    
    return {
      success: true,
      data: agent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Generar contenido para posteo en redes sociales
 */
export function generateSocialMediaContent(
  property: Property,
  agent?: User,
  options?: {
    platform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'whatsapp';
    includePrice?: boolean;
    includeContact?: boolean;
    customMessage?: string;
  }
): string {
  const { 
    platform = 'facebook', 
    includePrice = true, 
    includeContact = true,
    customMessage 
  } = options || {};
  
  const shareUrl = `${API_BASE_URL}/p/${property.slug}`;
  
  let content = '';
  
  // Título y descripción
  content += `🏠 ${property.title}\n\n`;
  
  if (customMessage) {
    content += `${customMessage}\n\n`;
  }
  
  // Características
  content += `📍 ${property.location.city}, ${property.location.neighborhood}\n`;
  content += `🛏️ ${property.features.bedrooms} Recámaras\n`;
  content += `🚿 ${property.features.bathrooms} Baños\n`;
  content += `🚗 ${property.features.parkingSpaces} Estacionamientos\n`;
  content += `📐 ${property.features.constructionArea} m²\n`;
  
  // Precio
  if (includePrice) {
    content += `\n💰 $${property.price.toLocaleString('es-MX')} ${property.priceCurrency}\n`;
  }
  
  // Amenidades destacadas
  if (property.features.amenities.length > 0) {
    content += `\n✨ Amenidades:\n`;
    content += property.features.amenities.slice(0, 5).map(a => `• ${a}`).join('\n');
    if (property.features.amenities.length > 5) {
      content += `\n• ¡Y más!`;
    }
    content += '\n';
  }
  
  // Contacto
  if (includeContact && agent) {
    content += `\n📞 Contacto:\n`;
    content += `${agent.name} ${agent.lastName}\n`;
    if (agent.config?.certificateNumber) {
      content += `✓ Certificado: ${agent.config.certificateNumber}\n`;
    }
    if (agent.config?.whatsappNumber) {
      content += `WhatsApp: ${agent.config.whatsappNumber}\n`;
    }
  }
  
  // Enlace
  content += `\n🔗 Ver más: ${shareUrl}\n`;
  
  // Hashtags según plataforma
  const hashtags = [
    '#FELMAT',
    '#Inmobiliaria',
    '#Propiedades',
    `#${property.propertyType}`,
    `#${property.location.city.replace(/\s/g, '')}`,
    '#BienesRaices',
    '#Casa',
    '#Departamento',
  ];
  
  if (platform === 'instagram' || platform === 'twitter') {
    content += `\n${hashtags.slice(0, 8).join(' ')}`;
  } else if (platform === 'facebook' || platform === 'linkedin') {
    content += `\n${hashtags.join(' ')}`;
  }
  
  return content;
}

/**
 * Enviar webhook a n8n
 */
export async function sendWebhook(
  webhookUrl: string,
  payload: WebhookPayload,
  secret?: string
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (secret) {
      headers['X-Webhook-Secret'] = secret;
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error enviando webhook:', error);
    return false;
  }
}

// ============================================
// FUNCIONES AUXILIARES (LocalStorage/IndexedDB)
// ============================================

async function getPropertiesFromStorage(
  filters?: Record<string, unknown>
): Promise<Property[]> {
  return new Promise((resolve) => {
    // Intentar obtener del localStorage primero
    const stored = localStorage.getItem('proptech_properties');
    let properties: Property[] = [];
    
    if (stored) {
      try {
        properties = JSON.parse(stored);
      } catch {
        properties = [];
      }
    }
    
    // Aplicar filtros
    if (filters) {
      if (filters.agentId) {
        properties = properties.filter(p => p.agentId === filters.agentId);
      }
      if (filters.status) {
        properties = properties.filter(p => p.status === filters.status);
      }
      if (filters.isPublished !== undefined) {
        properties = properties.filter(p => p.isPublished === filters.isPublished);
      }
    }
    
    resolve(properties);
  });
}

async function getLeadsFromStorage(
  filters?: Record<string, unknown>
): Promise<Lead[]> {
  return new Promise((resolve) => {
    const stored = localStorage.getItem('proptech_leads');
    let leads: Lead[] = [];
    
    if (stored) {
      try {
        leads = JSON.parse(stored);
      } catch {
        leads = [];
      }
    }
    
    // Aplicar filtros
    if (filters) {
      if (filters.agentId) {
        leads = leads.filter(l => l.assignedTo === filters.agentId);
      }
      if (filters.status) {
        leads = leads.filter(l => l.status === filters.status);
      }
    }
    
    resolve(leads);
  });
}

async function getAgentsFromStorage(): Promise<User[]> {
  return new Promise((resolve) => {
    const stored = localStorage.getItem('proptech_auth_user');
    let agents: User[] = [];
    
    if (stored) {
      try {
        const user = JSON.parse(stored);
        agents = [user];
      } catch {
        agents = [];
      }
    }
    
    resolve(agents);
  });
}

// ============================================
// HOOK PARA WEBHOOKS
// ============================================

import { useState, useEffect, useCallback } from 'react';

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  
  // Cargar webhooks guardados
  useEffect(() => {
    const stored = localStorage.getItem('proptech_webhooks');
    if (stored) {
      try {
        setWebhooks(JSON.parse(stored));
      } catch {
        setWebhooks([]);
      }
    }
  }, []);
  
  // Guardar webhooks
  const saveWebhooks = useCallback((newWebhooks: WebhookConfig[]) => {
    setWebhooks(newWebhooks);
    localStorage.setItem('proptech_webhooks', JSON.stringify(newWebhooks));
  }, []);
  
  // Agregar webhook
  const addWebhook = useCallback((webhook: Omit<WebhookConfig, 'id' | 'createdAt'>) => {
    const newWebhook: WebhookConfig = {
      ...webhook,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    saveWebhooks([...webhooks, newWebhook]);
    return newWebhook;
  }, [webhooks, saveWebhooks]);
  
  // Eliminar webhook
  const removeWebhook = useCallback((id: string) => {
    saveWebhooks(webhooks.filter(w => w.id !== id));
  }, [webhooks, saveWebhooks]);
  
  // Enviar evento a todos los webhooks suscritos
  const triggerEvent = useCallback(async <T>(
    event: WebhookEvent,
    data: T,
    agentId?: string
  ) => {
    const payload: WebhookPayload<T> = {
      event,
      timestamp: new Date().toISOString(),
      data,
      agentId,
    };
    
    const activeWebhooks = webhooks.filter(w => 
      w.isActive && w.events.includes(event)
    );
    
    const results = await Promise.all(
      activeWebhooks.map(async (webhook) => {
        const success = await sendWebhook(webhook.url, payload, webhook.secret);
        return { webhookId: webhook.id, success };
      })
    );
    
    return results;
  }, [webhooks]);
  
  return {
    webhooks,
    addWebhook,
    removeWebhook,
    triggerEvent,
  };
}

export default {
  getAllPropertiesForN8n,
  getPropertyByIdForN8n,
  getPropertyBySlugForN8n,
  getAllLeadsForN8n,
  getAgentInfoForN8n,
  generateSocialMediaContent,
  sendWebhook,
};
