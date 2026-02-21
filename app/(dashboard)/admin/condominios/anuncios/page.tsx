import ListaAnuncios from '@/components/anuncios/ListaAnuncios';

export const metadata = {
  title: 'Anuncios - Admin Condominios',
  description: 'Gestión de anuncios publicitarios',
};

export default function AnunciosAdminPage() {
  return <ListaAnuncios modo="admin" />;
}
