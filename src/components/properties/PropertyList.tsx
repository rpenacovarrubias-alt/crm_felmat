// ============================================
// LISTADO DE PROPIEDADES
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProperties } from '@/hooks/useDatabase';
import type { Property, PropertyStatus, TransactionType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Share2,
  Trash2,
  Home,
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize,
  Filter,
  Grid3X3,
  List,
  ExternalLink,
  Copy,
} from 'lucide-react';

// Componente de tarjeta de propiedad
interface PropertyCardProps {
  property: Property;
  viewMode: 'grid' | 'list';
  onShare: (property: Property) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

function PropertyCard({ property, viewMode, onShare, onDelete, canEdit, canDelete }: PropertyCardProps) {
  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case 'disponible': return 'bg-green-500 hover:bg-green-600';
      case 'reservado': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'vendido': return 'bg-blue-500 hover:bg-blue-600';
      case 'rentado': return 'bg-purple-500 hover:bg-purple-600';
      case 'en_negociacion': return 'bg-orange-500 hover:bg-orange-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusLabel = (status: PropertyStatus) => {
    const labels: Record<string, string> = {
      'disponible': 'Disponible',
      'reservado': 'Reservado',
      'vendido': 'Vendido',
      'rentado': 'Rentado',
      'en_negociacion': 'En Negociación',
      'inactivo': 'Inactivo',
    };
    return labels[status] || status;
  };

  const getTransactionLabel = (type: TransactionType) => {
    const labels: Record<string, string> = {
      'venta': 'Venta',
      'renta': 'Renta',
      'venta_renta': 'Venta/Renta',
    };
    return labels[type] || type;
  };

  const mainImage = property.images.find(img => img.isMain)?.url || property.images[0]?.url;

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {mainImage ? (
                <img src={mainImage} alt={property.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold truncate">{property.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {property.location.city}, {property.location.neighborhood}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-white", getStatusColor(property.status))}>
                    {getStatusLabel(property.status)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/properties/${property.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalle
                        </Link>
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem asChild>
                          <Link to={`/properties/${property.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onShare(property)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartir ficha
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(property.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  {property.features.bedrooms}
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="w-4 h-4" />
                  {property.features.bathrooms}
                </span>
                <span className="flex items-center gap-1">
                  <Car className="w-4 h-4" />
                  {property.features.parkingSpaces}
                </span>
                <span className="flex items-center gap-1">
                  <Maximize className="w-4 h-4" />
                  {property.features.constructionArea} m²
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-lg font-bold text-primary">
                  ${property.price.toLocaleString('es-MX')} {property.priceCurrency}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Vistas: {property.views}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden group">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={property.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={cn("text-white", getStatusColor(property.status))}>
            {getStatusLabel(property.status)}
          </Badge>
          <Badge variant="secondary">
            {getTransactionLabel(property.transactionType)}
          </Badge>
        </div>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/properties/${property.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver detalle
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link to={`/properties/${property.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onShare(property)}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartir ficha
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(property.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-1 mb-1">{property.title}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
          <MapPin className="w-3 h-3" />
          {property.location.city}, {property.location.neighborhood}
        </p>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              {property.features.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              {property.features.bathrooms}
            </span>
            <span className="flex items-center gap-1">
              <Car className="w-4 h-4" />
              {property.features.parkingSpaces}
            </span>
          </div>
          <span>{property.features.constructionArea} m²</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <p className="text-lg font-bold text-primary">
            ${property.price.toLocaleString('es-MX')}
          </p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Vistas: {property.views}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Diálogo para compartir ficha
function ShareDialog({ property, open, onClose }: { property: Property | null; open: boolean; onClose: () => void }) {
  if (!property) return null;

  const shareUrl = `${window.location.origin}/p/${property.slug}`;
  const whatsappMessage = `¡Hola! Te comparto esta propiedad: ${property.title}\n\nPrecio: $${property.price.toLocaleString('es-MX')} ${property.priceCurrency}\n\n${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartir Ficha Técnica</DialogTitle>
          <DialogDescription>
            Comparte esta propiedad con tus clientes
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium">{property.title}</h4>
            <p className="text-sm text-muted-foreground">
              {property.location.city}, {property.location.neighborhood}
            </p>
            <p className="text-lg font-bold text-primary mt-2">
              ${property.price.toLocaleString('es-MX')} {property.priceCurrency}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Enlace de la ficha</label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(shareUrl)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Share2 className="w-4 h-4 mr-2" />
                WhatsApp
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/p/${property.slug}`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver ficha
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente principal
export function PropertyList() {
  const { user, isAdmin, canViewAllProperties, canEditProperty, canDeleteProperty } = useAuth();
  const { properties, loading, remove } = useProperties(canViewAllProperties ? undefined : user?.id);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [shareProperty, setShareProperty] = useState<Property | null>(null);

  // Filtrar propiedades
  const filteredProperties = properties.filter(property => {
    const matchesSearch = 
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.neighborhood?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesType = typeFilter === 'all' || property.propertyType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta propiedad?')) {
      await remove(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdmin ? 'Inventario de Propiedades' : 'Mis Propiedades'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin 
              ? 'Gestiona todas las propiedades del sistema' 
              : 'Gestiona tu inventario de propiedades'}
          </p>
        </div>
        <Button asChild>
          <Link to="/properties/new">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Propiedad
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar propiedades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="reservado">Reservado</SelectItem>
              <SelectItem value="vendido">Vendido</SelectItem>
              <SelectItem value="rentado">Rentado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <Home className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="casa">Casa</SelectItem>
              <SelectItem value="departamento">Departamento</SelectItem>
              <SelectItem value="terreno">Terreno</SelectItem>
              <SelectItem value="oficina">Oficina</SelectItem>
              <SelectItem value="local">Local</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Mostrando {filteredProperties.length} de {properties.length} propiedades
      </p>

      {/* Properties Grid/List */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-16">
          <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No hay propiedades</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No se encontraron propiedades con los filtros aplicados'
              : 'Comienza agregando tu primera propiedad'}
          </p>
          <Button asChild>
            <Link to="/properties/new">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Propiedad
            </Link>
          </Button>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-4"
        )}>
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              viewMode={viewMode}
              onShare={setShareProperty}
              onDelete={handleDelete}
              canEdit={canEditProperty(property.agentId)}
              canDelete={canDeleteProperty(property.agentId)}
            />
          ))}
        </div>
      )}

      {/* Share Dialog */}
      <ShareDialog
        property={shareProperty}
        open={!!shareProperty}
        onClose={() => setShareProperty(null)}
      />
    </div>
  );
}

export default PropertyList;
