interface WebhookPayload {
  type: 'schedule_post' | 'publish_now' | 'update_post' | 'delete_post';
  data: any;
  timestamp?: string;
}

export async function sendWebhook(payload: WebhookPayload): Promise<{ success: boolean }> {
  const webhookUrl = localStorage.getItem('n8n_webhook_url') || 
    import.meta.env.VITE_N8N_WEBHOOK_URL;
  
  if (!webhookUrl) {
    throw new Error('URL de webhook no configurada');
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en webhook: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error enviando webhook:', error);
    throw error;
  }
}

export async function testWebhook(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test', message: 'Test connection' }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
