import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnuncioGeneratorProps {
  onGenerate?: (content: string) => void;
  propertyData?: {
    title?: string;
    description?: string;
    price?: number;
    location?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
}

export function AnuncioGenerator({ onGenerate, propertyData }: AnuncioGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generatePrompt = () => {
    if (propertyData) {
      const autoPrompt = `Crea un anuncio atractivo para una propiedad con las siguientes características:
- Título: ${propertyData.title || 'Propiedad en venta'}
- Ubicación: ${propertyData.location || 'Excelente zona'}
- Precio: $${propertyData.price?.toLocaleString() || 'Consultar'}
- ${propertyData.bedrooms || 2} dormitorios, ${propertyData.bathrooms || 1} baños
- ${propertyData.area || 80} m² construidos

Incluye emojis, hashtags relevantes y un call-to-action.`;
      setPrompt(autoPrompt);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Simulación de generación con IA (reemplazar con API real)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockGenerated = `🏠 ${propertyData?.title || 'Increíble Propiedad'} en ${propertyData?.location || 'Ubicación Privilegiada'}

✨ Características destacadas:
• ${propertyData?.bedrooms || 3} amplios dormitorios
• ${propertyData?.bathrooms || 2} baños modernos
• ${propertyData?.area || 120} m² de construcción
• Excelente iluminación natural
• Acabados de primera calidad

💰 Inversión: $${propertyData?.price?.toLocaleString() || '2,500,000'} MXN

📍 Ubicación estratégica con acceso a todos los servicios

🔑 Agenda tu visita hoy mismo y conoce tu nuevo hogar

📞 Contacto: [Tu teléfono]
📧 Email: [Tu email]

#BienesRaíces #Propiedades #Inversión #Hogar #Felmat`;

      setGeneratedContent(mockGenerated);
      onGenerate?.(mockGenerated);
      
      toast({
        title: "✅ Anuncio generado",
        description: "El contenido ha sido creado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo generar el anuncio. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "📋 Copiado",
      description: "Contenido copiado al portapapeles.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Generador de Anuncios con IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Prompt / Instrucciones</Label>
          <div className="flex gap-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe la propiedad o pega la información aquí..."
              className="min-h-[100px]"
            />
          </div>
          {propertyData && (
            <Button variant="outline" size="sm" onClick={generatePrompt}>
              📝 Generar prompt automático
            </Button>
          )}
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !prompt}
          className="w-full"
        >
          {isGenerating ? '✨ Generando...' : '✨ Generar Anuncio con IA'}
        </Button>

        {generatedContent && (
          <div className="space-y-2">
            <Label>Resultado generado:</Label>
            <div className="relative">
              <Textarea
                value={generatedContent}
                readOnly
                className="min-h-[200px] bg-muted"
              />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
