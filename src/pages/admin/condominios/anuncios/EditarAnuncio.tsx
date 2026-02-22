import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function EditarAnuncio() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/condominios/anuncios')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">Editar Anuncio {id}</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulario de Edición</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Formulario en construcción...</p>
        </CardContent>
      </Card>
    </div>
  );
}
