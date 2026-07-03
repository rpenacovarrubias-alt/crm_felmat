// Stub — legacy hook kept for compatibility; use Sonner's toast() instead
import { toast as sonnerToast } from 'sonner';

export const toast = (opts: { title?: string; description?: string; variant?: string }) => {
  sonnerToast(opts.title ?? opts.description ?? '');
};

export const useToast = () => ({ toast });
