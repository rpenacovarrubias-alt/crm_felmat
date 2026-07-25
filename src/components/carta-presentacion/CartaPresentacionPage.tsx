// ============================================
// CARTA DE PRESENTACIÓN DEL AGENTE
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCartaPresentacion } from '@/hooks/useDatabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Save, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function CartaPresentacionPage() {
  const { user } = useAuth();
  const { carta, loading, save } = useCartaPresentacion(user?.id);

  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [incluirLogo, setIncluirLogo] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (carta) {
      setTitulo(carta.titulo);
      setCuerpo(carta.cuerpo);
      setIncluirLogo(carta.incluirLogo);
    }
  }, [carta]);

  const handleSave = async () => {
    setSaving(true);
    await save({ titulo, cuerpo, incluirLogo });
    setSaving(false);
    toast.success('Carta de presentación guardada');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carta de Presentación</h1>
        <p className="text-muted-foreground mt-1">Documento que usarás para presentarte con nuevos clientes y prospectos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Editar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Sobre mí y mi servicio" />
            </div>
            <div className="space-y-1.5">
              <Label>Cuerpo</Label>
              <Textarea
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                placeholder="Escribe tu presentación profesional, experiencia y lo que ofreces a tus clientes..."
                rows={14}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="incluir-logo">Incluir logo de la agencia</Label>
              <Switch id="incluir-logo" checked={incluirLogo} onCheckedChange={setIncluirLogo} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Vista previa</CardTitle></CardHeader>
          <CardContent>
            <div className="border rounded-lg p-8 bg-white text-black min-h-[500px]">
              {incluirLogo && (
                <div className="flex items-center gap-2 mb-6 text-muted-foreground">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">Felmat Inmobiliaria</span>
                </div>
              )}
              <h2 className="text-xl font-bold mb-4">{titulo || 'Título de la carta'}</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {cuerpo || 'El contenido de tu carta de presentación aparecerá aquí...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CartaPresentacionPage;
