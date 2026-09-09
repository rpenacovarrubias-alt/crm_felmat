import type { UserRole } from '@/types';

export type PermResource =
  | 'properties' | 'leads' | 'condominios' | 'airbnb' | 'anuncios'
  | 'contratos' | 'cotizaciones' | 'fianzas' | 'users' | 'propertyShares';

export interface RolePermissions {
  canCreate: PermResource[];
  canEdit: PermResource[];
  canDelete: PermResource[];
  canView: PermResource[];
  canDownload: PermResource[];
  canConfigure: PermResource[];
  restrictions: {
    ownPropertiesOnly: boolean;
    noDelete: boolean;
  };
}

const ALL_RESOURCES: PermResource[] = [
  'properties', 'leads', 'condominios', 'airbnb', 'anuncios',
  'contratos', 'cotizaciones', 'fianzas', 'users', 'propertyShares',
];

const AGENT_RESOURCES: PermResource[] = [
  'properties', 'leads', 'condominios', 'airbnb', 'anuncios',
  'contratos', 'cotizaciones', 'fianzas', 'propertyShares',
];

const ASSISTANT_EDITABLE: PermResource[] = ['leads', 'propertyShares'];
const ASSISTANT_VIEWABLE: PermResource[] = ['properties', 'leads', 'condominios', 'airbnb', 'propertyShares'];

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  super_admin: {
    canCreate: ALL_RESOURCES, canEdit: ALL_RESOURCES, canDelete: ALL_RESOURCES,
    canView: ALL_RESOURCES, canDownload: ALL_RESOURCES, canConfigure: ALL_RESOURCES,
    restrictions: { ownPropertiesOnly: false, noDelete: false },
  },
  admin: {
    canCreate: ALL_RESOURCES, canEdit: ALL_RESOURCES, canDelete: ALL_RESOURCES,
    canView: ALL_RESOURCES, canDownload: ALL_RESOURCES, canConfigure: ALL_RESOURCES,
    restrictions: { ownPropertiesOnly: false, noDelete: false },
  },
  agent: {
    canCreate: AGENT_RESOURCES, canEdit: AGENT_RESOURCES, canDelete: AGENT_RESOURCES,
    canView: AGENT_RESOURCES, canDownload: ['cotizaciones', 'contratos'], canConfigure: [],
    restrictions: { ownPropertiesOnly: true, noDelete: false },
  },
  assistant: {
    canCreate: ASSISTANT_EDITABLE, canEdit: ASSISTANT_EDITABLE, canDelete: [],
    canView: ASSISTANT_VIEWABLE, canDownload: [], canConfigure: [],
    restrictions: { ownPropertiesOnly: true, noDelete: true },
  },
};

export function canCreate(role: UserRole, resource: PermResource): boolean {
  return ROLE_PERMISSIONS[role].canCreate.includes(resource);
}
export function canEdit(role: UserRole, resource: PermResource): boolean {
  return ROLE_PERMISSIONS[role].canEdit.includes(resource);
}
export function canDeleteResource(role: UserRole, resource: PermResource): boolean {
  if (ROLE_PERMISSIONS[role].restrictions.noDelete) return false;
  return ROLE_PERMISSIONS[role].canDelete.includes(resource);
}
export function canView(role: UserRole, resource: PermResource): boolean {
  return ROLE_PERMISSIONS[role].canView.includes(resource);
}
export function canManageUsers(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}
export function hasPropertyAccess(
  role: UserRole,
  userId: string,
  userPropertyAccess: string[],
  property: { agentId: string; id: string },
): boolean {
  if (!ROLE_PERMISSIONS[role].restrictions.ownPropertiesOnly) return true;
  if (property.agentId === userId) return true;
  return userPropertyAccess.includes(property.id);
}
