// ============================================
// DATOS DE CONTACTO A MOSTRAR EN LA FICHA (ASESOR)
// ============================================
//
// Unifica la logica que antes estaba duplicada -- y con un fallback
// inventado ("Mayra Fajer" con telefono/correo falsos) -- en
// PublicPropertyPage.tsx, pdfExport.ts y el ShareDialog de
// PropertyDetail.tsx. Cuando no hay un asesor real vinculado, ya no se
// finge ser una persona especifica: se usa un contacto generico de la
// agencia. Un "override" (de una ficha personalizada) puede sustituir
// campos individuales encima de eso.

export const AGENCY_FALLBACK_EMAIL = 'contacto@felmat.com.mx';

export interface AgentSource {
  name: string;
  lastName: string;
  phone?: string;
  email?: string;
  avatar?: string;
  config?: {
    bio?: string;
    certificateNumber?: string;
    whatsappNumber?: string;
  };
}

export interface AgentOverride {
  overrideName?: string;
  overridePhone?: string;
  overrideWhatsapp?: string;
  overrideEmail?: string;
  overrideAvatar?: string;
  overrideCertificate?: string;
  overrideBio?: string;
}

export interface AgentDisplayInfo {
  isRealAgent: boolean;
  name: string;
  role: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  avatar?: string;
  certificateNumber?: string;
}

export function resolveAgentDisplay(
  agent: AgentSource | null,
  override?: AgentOverride
): AgentDisplayInfo {
  const base: AgentDisplayInfo = agent
    ? {
        isRealAgent: true,
        name: `${agent.name} ${agent.lastName}`,
        role: agent.config?.bio || 'Asesor inmobiliario de Grupo FELMAT',
        phone: agent.phone || undefined,
        whatsapp: agent.config?.whatsappNumber,
        email: agent.email || undefined,
        avatar: agent.avatar,
        certificateNumber: agent.config?.certificateNumber,
      }
    : {
        isRealAgent: false,
        name: 'Grupo FELMAT',
        role: 'Servicios Inmobiliarios',
        phone: undefined,
        whatsapp: undefined,
        email: AGENCY_FALLBACK_EMAIL,
        avatar: undefined,
        certificateNumber: undefined,
      };

  if (!override) return base;

  const hasOverrideIdentity = Boolean(
    override.overrideName || override.overridePhone || override.overrideEmail
  );

  return {
    ...base,
    isRealAgent: base.isRealAgent || hasOverrideIdentity,
    name: override.overrideName || base.name,
    role: override.overrideBio || base.role,
    phone: override.overridePhone || base.phone,
    whatsapp: override.overrideWhatsapp || base.whatsapp,
    email: override.overrideEmail || base.email,
    avatar: override.overrideAvatar || base.avatar,
    certificateNumber: override.overrideCertificate || base.certificateNumber,
  };
}
