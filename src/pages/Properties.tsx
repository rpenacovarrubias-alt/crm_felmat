import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Properties() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [propiedades, setPropiedades] = useState([]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Propiedades</h1>
        <Button onClick={() => navigate('/propiedades/nueva')}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Propiedad
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar propiedades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Propiedades</CardTitle>
        </CardHeader>
        <CardContent>
          {propiedades.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No hay propiedades registradas</p>
              <Button variant="outline" onClick={() => navigate('/propiedades/nueva')}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar primera propiedad
              </Button>
            </div>
          ) : (
            <div>Lista de propiedades aquí</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
