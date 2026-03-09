import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Facebook, Instagram, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Anuncio {
  id: string;
  titulo: string;
  plataforma: 'facebook' | 'instagram' | 'airbnb' | 'web';
  estado: 'activo' | 'pausado' | 'borrador';
  fechaCreacion: Date;
}

export default function Anuncios() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [open, setOpen] = useState(false);

  const crearAnuncio = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevoAnuncio: Anuncio = {
      id: Date.now().toString(),
      titulo: 'Nuevo Anuncio',
      plataforma: 'facebook',
      estado: 'borrador',
      fechaCreacion: new Date()
    };
    setAnuncios([...anuncios, nuevoAnuncio]);
    setOpen(false);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Anuncios y Publicación Social</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus anuncios en redes sociales y plataformas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Anuncio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Anuncio</DialogTitle>
            </DialogHeader>
            <form onSubmit={crearAnuncio} className="space-y-4 mt-4">
              <div>
                <Label>Título del anuncio</Label>
                <Input placeholder="Ej: Casa en venta - Colonia Centro" />
              </div>
              <div>
                <Label>Plataforma</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                    <SelectItem value="web">Sitio Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Crear Anuncio</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Facebook</CardTitle>
            <Facebook className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anuncios.filter(a => a.plataforma === 'facebook').length}</div>
            <p className="text-xs text-muted-foreground">Anuncios activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Instagram</CardTitle>
            <Instagram className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anuncios.filter(a => a.plataforma === 'instagram').length}</div>
            <p className="text-xs text-muted-foreground">Anuncios activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Airbnb</CardTitle>
            <Globe className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anuncios.filter(a => a.plataforma === 'airbnb').length}</div>
            <p className="text-xs text-muted-foreground">Anuncios activos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Anuncios</CardTitle>
        </CardHeader>
        <CardContent>
          {anuncios.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No hay anuncios creados</p>
              <Button variant="outline" onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear primer anuncio
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {anuncios.map((anuncio) => (
                <div key={anuncio.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{anuncio.titulo}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{anuncio.plataforma} • {anuncio.estado}</p>
                  </div>
                  <Button variant="ghost" size="sm">Editar</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
