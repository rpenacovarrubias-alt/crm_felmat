import { useAuth } from '@/hooks/useAuth';
import {
  ROLE_PERMISSIONS, canCreate, canEdit, canDeleteResource, canView,
  canManageUsers, hasPropertyAccess, type PermResource,
} from '@/permissions';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role ?? 'assistant';

  return {
    role,
    canCreate: (resource: PermResource) => canCreate(role, resource),
    canEdit: (resource: PermResource) => canEdit(role, resource),
    canDelete: (resource: PermResource) => canDeleteResource(role, resource),
    canView: (resource: PermResource) => canView(role, resource),
    canManageUsers: canManageUsers(role),
    hasPropertyAccess: (property: { agentId: string; id: string }) =>
      user ? hasPropertyAccess(role, user.id, user.propertyAccess ?? [], property) : false,
    restrictions: ROLE_PERMISSIONS[role].restrictions,
  };
}
