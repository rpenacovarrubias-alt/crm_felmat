import { describe, it, expect } from 'vitest';
import { canCreate, canEdit, canDeleteResource, canView, canManageUsers, hasPropertyAccess } from './permissions';

describe('permissions', () => {
  it('super_admin y admin pueden todo, incluida gestion de usuarios', () => {
    expect(canCreate('super_admin', 'users')).toBe(true);
    expect(canDeleteResource('admin', 'properties')).toBe(true);
    expect(canManageUsers('admin')).toBe(true);
    expect(canManageUsers('super_admin')).toBe(true);
  });

  it('agent no puede gestionar usuarios', () => {
    expect(canManageUsers('agent')).toBe(false);
    expect(canView('agent', 'users')).toBe(false);
  });

  it('assistant no puede eliminar nada (restriccion noDelete) aunque el recurso este en canDelete', () => {
    expect(canEdit('assistant', 'leads')).toBe(true);
    expect(canDeleteResource('assistant', 'leads')).toBe(false);
  });

  it('hasPropertyAccess: agent ve su propia propiedad, no la ajena sin acceso asignado', () => {
    const propia = { agentId: 'u1', id: 'p1' };
    const ajena = { agentId: 'u2', id: 'p2' };
    expect(hasPropertyAccess('agent', 'u1', [], propia)).toBe(true);
    expect(hasPropertyAccess('agent', 'u1', [], ajena)).toBe(false);
    expect(hasPropertyAccess('agent', 'u1', ['p2'], ajena)).toBe(true);
  });

  it('admin no tiene restriccion ownPropertiesOnly', () => {
    expect(hasPropertyAccess('admin', 'u1', [], { agentId: 'otro', id: 'p9' })).toBe(true);
  });
});
