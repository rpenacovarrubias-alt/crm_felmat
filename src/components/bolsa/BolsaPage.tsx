// ============================================
// BOLSA — buscador asistido en portales externos
// ============================================
// No es scraping ni integracion real: arma el link de busqueda ya
// filtrado de cada portal usando sus propios patrones de URL (confirmados
// navegando en vivo) y los abre en pestanas nuevas.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ExternalLink, Building2 } from 'lucide-react';

type Operacion = 'venta' | 'renta';
type TipoPropiedad = 'Casa' | 'Departamento' | 'Terreno' | 'Lote' | 'Oficina' | 'Quinta';

const TIPOS: TipoPropiedad[] = ['Casa', 'Departamento', 'Terreno', 'Lote', 'Oficina', 'Quinta'];

// Slug por tipo, especifico de cada portal (categorias no son 1 a 1 entre portales)
const INMUEBLES24_TIPO: Record<TipoPropiedad, string> = {
  Casa: 'casas', Departamento: 'departamentos', Terreno: 'terrenos',
  Lote: 'terrenos', Oficina: 'oficinas', Quinta: 'casas',
};
const PROPIEDADES_COM_TIPO: Record<TipoPropiedad, string> = {
  Casa: 'casas', Departamento: 'departamentos', Terreno: 'terrenos-habitacionales',
  Lote: 'terrenos-habitacionales', Oficina: 'oficinas', Quinta: 'casas',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface ResultadoPortal {
  nombre: string;
  url: string;
  filtrado: boolean;
}

function construirBusquedas(operacion: Operacion, tipo: TipoPropiedad, ciudad: string): ResultadoPortal[] {
  const ciudadSlug = slugify(ciudad);

  return [
    {
      nombre: 'Inmuebles24',
      url: ciudadSlug
        ? `https://www.inmuebles24.com/${INMUEBLES24_TIPO[tipo]}-en-${operacion}-en-${ciudadSlug}.html`
        : `https://www.inmuebles24.com/${INMUEBLES24_TIPO[tipo]}-en-${operacion}.html`,
      filtrado: true,
    },
    {
      nombre: 'Propiedades.com',
      url: ciudadSlug
        ? `https://propiedades.com/${ciudadSlug}/${PROPIEDADES_COM_TIPO[tipo]}-${operacion}`
        : `https://propiedades.com/`,
      filtrado: !!ciudadSlug,
    },
    {
      nombre: 'Lamudi',
      url: 'https://www.lamudi.com.mx/',
      filtrado: false,
    },
  ];
}

export function BolsaPage() {
  const [operacion, setOperacion] = useState<Operacion>('venta');
  const [tipo, setTipo] = useState<TipoPropiedad>('Casa');
  const [ciudad, setCiudad] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [resultados, setResultados] = useState<ResultadoPortal[] | null>(null);

  const buscar = () => {
    const busquedas = construirBusquedas(operacion, tipo, ciudad);
    setResultados(busquedas);
    busquedas.forEach(b => window.open(b.url, '_blank', 'noopener,noreferrer'));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bolsa</h1>
        <p className="text-muted-foreground mt-1">
          Cuando un cliente pide algo que no tienes en inventario, busca en portales externos con un clic.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Nota: abre la búsqueda ya filtrada en cada portal (Felmat no tiene integración ni acuerdos con ellos,
          esto no trae los resultados de vuelta ni publica nada).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Criterios de búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Operación</Label>
              <Select value={operacion} onValueChange={(v) => setOperacion(v as Operacion)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="venta">Venta</SelectItem>
                  <SelectItem value="renta">Renta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de propiedad</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoPropiedad)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ciudad">Ciudad / zona</Label>
            <Input
              id="ciudad"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej. Querétaro, Corregidora, Monterrey..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precioMin">Precio mínimo (opcional)</Label>
              <Input
                id="precioMin"
                type="number"
                value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precioMax">Precio máximo (opcional)</Label>
              <Input
                id="precioMax"
                type="number"
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          {(precioMin || precioMax) && (
            <p className="text-xs text-muted-foreground">
              El rango de precio aún no se pasa automáticamente al portal — aplícalo tú directamente en cada
              página de resultados.
            </p>
          )}

          <Button onClick={buscar} disabled={!ciudad} className="w-full transition-transform active:scale-[0.97]">
            <Search className="w-4 h-4 mr-2" />
            Buscar en portales
          </Button>
        </CardContent>
      </Card>

      {resultados && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-5 h-5" />
              Resultados abiertos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resultados.map(r => (
              <a
                key={r.nombre}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{r.nombre}</p>
                  {!r.filtrado && (
                    <p className="text-xs text-muted-foreground">Búsqueda general — filtra manualmente</p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BolsaPage;
