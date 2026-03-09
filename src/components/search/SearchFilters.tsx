'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  MapPin,
  DollarSign,
  Home,
  Building,
  Building2,
  LandPlot,
  Store,
  Warehouse,
  Filter,
  X,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';

interface SearchFiltersProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showMapToggle?: boolean;
  onToggleMap?: () => void;
  showMap?: boolean;
}

const operationTypes = [
  { value: 'venta', label: 'Venta', icon: DollarSign },
  { value: 'renta', label: 'Renta', icon: DollarSign },
  { value: 'preventa', label: 'Preventa', icon: DollarSign },
];

const propertyTypes = [
  { value: 'casa', label: 'Casa', icon: Home },
  { value: 'departamento', label: 'Departamento', icon: Building },
  { value: 'terreno', label: 'Terreno/Lote', icon: LandPlot },
  { value: 'oficina', label: 'Oficina', icon: Building2 },
  { value: 'local', label: 'Local Comercial', icon: Store },
  { value: 'bodega', label: 'Bodega', icon: Warehouse },
];

const priceRanges = [
  { value: '0-1000000', label: 'Hasta $1M', min: 0, max: 1000000 },
  { value: '1000000-3000000', label: '$1M - $3M', min: 1000000, max: 3000000 },
  { value: '3000000-5000000', label: '$3M - $5M', min: 3000000, max: 5000000 },
  { value: '5000000-10000000', label: '$5M - $10M', min: 5000000, max: 10000000 },
  { value: '10000000+', label: 'Más de $10M', min: 10000000, max: null },
];

export function SearchFilters({
  className,
  variant = 'horizontal',
  showMapToggle = false,
  onToggleMap,
  showMap = false,
}: SearchFiltersProps) {
  const router = useRouter();
  const [operation, setOperation] = useState<string>('venta');
  const [location, setLocation] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [propertyType, setPropertyType] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (operation) params.set('operacion', operation);
    if (location) params.set('ubicacion', location);
    if (priceRange) params.set('precio', priceRange);
    if (propertyType) params.set('tipo', propertyType);
    
    router.push(`/properties?${params.toString()}`);
  };

  const clearFilters = () => {
    setOperation('venta');
    setLocation('');
    setPriceRange('');
    setPropertyType('');
    setActiveFilters([]);
  };

  const hasActiveFilters = operation || location || priceRange || propertyType;

  const isHorizontal = variant === 'horizontal';

  return (
    <div className={cn('w-full', className)}>
      {/* Barra principal de búsqueda */}
      <div
        className={cn(
          'bg-white rounded-xl shadow-lg border border-border/50 p-2',
          isHorizontal
            ? 'flex flex-col lg:flex-row items-stretch lg:items-center gap-2'
            : 'flex flex-col gap-3'
        )}
      >
        {/* Tipo de operación */}
        <div className={cn('flex-shrink-0', isHorizontal && 'lg:w-40')}>
          <Select value={operation} onValueChange={setOperation}>
            <SelectTrigger className="w-full border-0 bg-transparent hover:bg-accent/50 transition-colors h-12 px-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Operación" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {operationTypes.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  <div className="flex items-center gap-2">
                    <op.icon className="w-4 h-4" />
                    {op.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isHorizontal && <Separator orientation="vertical" className="hidden lg:block h-8" />}

        {/* Ubicación */}
        <div className={cn('flex-1 min-w-0', isHorizontal && 'lg:flex-1')}>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="¿Dónde quieres buscar?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border-0 bg-transparent hover:bg-accent/50 transition-colors h-12 pl-10 pr-4 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {isHorizontal && <Separator orientation="vertical" className="hidden lg:block h-8" />}

        {/* Rango de precio */}
        <div className={cn('flex-shrink-0', isHorizontal && 'lg:w-48')}>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-full border-0 bg-transparent hover:bg-accent/50 transition-colors h-12 px-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="¿Cuál es el presupuesto?" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {priceRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isHorizontal && <Separator orientation="vertical" className="hidden lg:block h-8" />}

        {/* Tipo de propiedad */}
        <div className={cn('flex-shrink-0', isHorizontal && 'lg:w-56')}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-12 px-4 hover:bg-accent/50"
              >
                <Home className="w-4 h-4 text-muted-foreground" />
                <span className={propertyType ? 'text-foreground' : 'text-muted-foreground'}>
                  {propertyType
                    ? propertyTypes.find((t) => t.value === propertyType)?.label
                    : 'Agrega un tipo de propiedad'}
                </span>
                <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="space-y-1">
                {propertyTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={propertyType === type.value ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-3 h-11"
                    onClick={() => setPropertyType(type.value === propertyType ? '' : type.value)}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Botón de búsqueda */}
        <Button
          size="lg"
          className="h-12 px-6 bg-primary hover:bg-primary/90"
          onClick={handleSearch}
        >
          <Search className="w-5 h-5" />
          <span className="hidden sm:inline ml-2">Buscar</span>
        </Button>
      </div>

      {/* Filtros adicionales y acciones */}
      <div className="flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-2">
          {/* Botón de filtros avanzados */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilters.length}
              </Badge>
            )}
          </Button>

          {/* Botón de limpiar filtros */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="w-4 h-4" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Toggle de mapa (opcional) */}
        {showMapToggle && (
          <Button
            variant={showMap ? 'secondary' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={onToggleMap}
          >
            <MapPin className="w-4 h-4" />
            {showMap ? 'Ocultar mapa' : 'Ver mapa'}
          </Button>
        )}
      </div>

      {/* Panel de filtros avanzados expandible */}
      {showAdvancedFilters && (
        <div className="mt-3 p-4 bg-white rounded-xl shadow-md border border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Características */}
            <div>
              <label className="text-sm font-medium mb-2 block">Habitaciones</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Baños</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estacionamientos</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Superficie (m²)</label>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="Mín" className="w-full" />
                <span className="text-muted-foreground">-</span>
                <Input type="number" placeholder="Máx" className="w-full" />
              </div>
            </div>
          </div>

          {/* Amenidades */}
          <div className="mt-4">
            <label className="text-sm font-medium mb-2 block">Amenidades</label>
            <div className="flex flex-wrap gap-2">
              {['Área de lavado', 'Terraza', 'Gimnasio', 'Elevador', 'Seguridad', 'Mascotas'].map(
                (amenity) => (
                  <Button key={amenity} variant="outline" size="sm" className="rounded-full">
                    {amenity}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filtros activos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {operation && (
            <Badge variant="secondary" className="gap-1">
              {operationTypes.find((o) => o.value === operation)?.label}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setOperation('')}
              />
            </Badge>
          )}
          {location && (
            <Badge variant="secondary" className="gap-1">
              {location}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setLocation('')} />
            </Badge>
          )}
          {priceRange && (
            <Badge variant="secondary" className="gap-1">
              {priceRanges.find((p) => p.value === priceRange)?.label}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setPriceRange('')} />
            </Badge>
          )}
          {propertyType && (
            <Badge variant="secondary" className="gap-1">
              {propertyTypes.find((t) => t.value === propertyType)?.label}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setPropertyType('')} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
