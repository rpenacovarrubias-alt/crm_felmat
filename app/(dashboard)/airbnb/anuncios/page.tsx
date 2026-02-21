import ListaAnuncios from '@/components/anuncios/ListaAnuncios';

export const metadata = {
  title: 'Anuncios - Airbnb',
  description: 'Gestión de anuncios Airbnb',
};

export default function AnunciosAirbnbPage() {
  return <ListaAnuncios modo="airbnb" />;
}
