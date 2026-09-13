import { useLocation } from 'react-router-dom';
import ListaAnuncios from './ListaAnuncios';
import { resolverContextoAnuncio } from '@/lib/anunciosApi';

export default function Anuncios() {
  const location = useLocation();
  const { modo, categoria, rutaBase } = resolverContextoAnuncio(location.pathname);
  return <ListaAnuncios modo={modo} categoriaFiltro={categoria} rutaBase={rutaBase} />;
}
