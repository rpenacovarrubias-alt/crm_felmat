import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function AnunciosAdminPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Anuncios de Propiedades</h1>
        <Button 
          onClick={() => navigate('/admin/condominios/anuncios/nuevo')}
          className="bg-[#B8922A] hover:bg-[#8B6E1F]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Anuncio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Anuncios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay anuncios creados. Haz clic en "Crear Anuncio" para comenzar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
