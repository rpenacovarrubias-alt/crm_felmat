// ============================================
// HOOK DE EVENTOS CRM → N8N
// Dispara webhooks a n8n cuando ocurren eventos
// en el CRM (leads, propiedades, anuncios).
//
// Uso:
//   const n8n = useN8nEvents();
//   await n8n.onLeadCreated(lead, user.id);
// ============================================

import { useWebhooks, type WebhookEvent } from '@/lib/api';

export function useN8nEvents() {
  const { triggerEvent } = useWebhooks();

  // Disparo silencioso — un fallo en el webhook nunca bloquea la operación del CRM
  const notify = async (event: WebhookEvent, data: unknown, agentId?: string) => {
    try {
      await triggerEvent(event, data, agentId);
    } catch {
      // intencional: webhooks son best-effort
    }
  };

  return {
    // Leads
    onLeadCreated: (lead: unknown, agentId?: string) =>
      notify('lead.created', lead, agentId),

    onLeadUpdated: (lead: unknown, agentId?: string) =>
      notify('lead.updated', lead, agentId),

    onLeadStatusChanged: (lead: unknown, agentId?: string) =>
      notify('lead.status_changed', lead, agentId),

    onLeadAssigned: (lead: unknown, agentId?: string) =>
      notify('lead.assigned', lead, agentId),

    // Propiedades
    onPropertyCreated: (property: unknown, agentId?: string) =>
      notify('property.created', property, agentId),

    onPropertyUpdated: (property: unknown, agentId?: string) =>
      notify('property.updated', property, agentId),

    onPropertyPublished: (property: unknown, agentId?: string) =>
      notify('property.published', property, agentId),

    onPropertyShared: (property: unknown, agentId?: string) =>
      notify('property.shared', property, agentId),
  };
}
