import { useState } from 'react';
import { publishToFacebook } from '@/lib/social-apis/facebook';
import { publishToInstagram } from '@/lib/social-apis/instagram';
import { publishToGoogleBusiness } from '@/lib/social-apis/google-business';
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
    
    const results: PublishResult['results'] = {};
    
    try {
      // Si hay programación, enviar a webhook de n8n
      if (params.scheduledFor) {
        await sendWebhook({
          type: 'schedule_post',
          data: params,
        });
        
        return {
          success: true,
          results: { webhook: { success: true } },
        };
      }

      // Publicación inmediata
      for (const platform of params.platforms) {
        try {
          switch (platform) {
            case 'facebook':
              const fbResult = await publishToFacebook(params);
              results.facebook = { success: true, postId: fbResult.postId };
              break;
              
            case 'instagram':
              const igResult = await publishToInstagram(params);
              results.instagram = { success: true, postId: igResult.postId };
              break;
              
            case 'googleBusiness':
              const gbResult = await publishToGoogleBusiness(params);
              results.googleBusiness = { success: true, postId: gbResult.postId };
              break;
              
            default:
              results[platform] = { success: false, error: 'Plataforma no soportada' };
          }
        } catch (error) {
          results[platform] = { 
            success: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
          };
        }
      }

      return {
        success: Object.values(results).some(r => r.success),
        results,
      };
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    publish,
    isPublishing,
  };
}
