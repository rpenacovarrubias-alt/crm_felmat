import { useLocation } from 'react-router-dom';
import ListaAnuncios from './ListaAnuncios';

export default function Anuncios() {
  const location = useLocation();
  const modo = location.pathname.startsWith('/airbnb') ? 'airbnb' : 'admin';
  return <ListaAnuncios modo={modo} />;
}
