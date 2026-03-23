import { useState } from 'react';
import { sendWebhook } from '@/lib/social-apis/webhook';

interface PublishParams {
  platforms: string[];
  content: string;
  images?: string[];
  propertyId?: string;
  scheduledFor?: string;
}

interface PublishResult {
  success: boolean;
  results: Record<string, { success: boolean; error?: string; postId?: string }>;
}

export function useSocialPublish() {
  const [isPublishing, setIsPublishing] = useState(false);

  const publish = async (params: PublishParams): Promise<PublishResult> => {
    setIsPublishing(true);

    try {
      // Toda la publicación — inmediata o programada — se delega a n8n.
      // n8n recibe el payload completo y decide cuándo y dónde publicar.
      const type = params.scheduledFor ? 'schedule_post' : 'publish_now';

      await sendWebhook({
        type,
        data: {
          platforms: params.platforms,
          content: params.content,
          images: params.images ?? [],
          propertyId: params.propertyId,
          scheduledFor: params.scheduledFor,
        },
      });

      return {
        success: true,
        results: { n8n: { success: true } },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return {
        success: false,
        results: { n8n: { success: false, error: message } },
      };
    } finally {
      setIsPublishing(false);
    }
  };

  return { publish, isPublishing };
}
