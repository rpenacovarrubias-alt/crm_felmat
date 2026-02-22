import { UserManagement } from '@/components/settings/UserManagement';

export default function UsersSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Configuración de Usuarios</h1>
      <UserManagement />
    </div>
  );
}
