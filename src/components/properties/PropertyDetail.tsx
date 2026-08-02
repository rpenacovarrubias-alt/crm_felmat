// ============================================
// DETALLE DE PROPIEDAD + FICHA TÉCNICA
// ============================================

import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProperties, useLeads, useUsers, usePropertyShares } from '@/hooks/useDatabase';
import type { Property, LeadSource, PropertyShare } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Share2,
  Trash2,
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize,
  Home,
  Check,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Printer,
  User,
  Phone,
  Mail,
  Award,
  Eye,
  EyeOff,
  MessageCircle,
  BarChart3,
  QrCode,
  MessageSquare,
  Plus,
  Trash,
  TrendingUp,
  Clock,
  Send,
  RefreshCw,
  AlertTriangle,
  UserCog,
} from 'lucide-react';
import { exportPropertyToPDF } from '@/lib/pdfExport';
import { resolveAgentDisplay } from '@/lib/agentDisplay';
import { Switch } from '@/components/ui/switch';
import { PropertyMap } from './PropertyMap';
import { Textarea } from '@/components/ui/textarea';
import QRCode from 'qrcode';

// Galería de imágenes
function ImageGallery({ images }: { images: Property['images'] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sortedImages = [...images].sort((a, b) => (a.isMain ? -1 : b.isMain ? 1 : 0));
  
  if (sortedImages.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <Home className="w-16 h-16 text-muted-foreground" />
      </div>
    );
  }

  const mainImage = sortedImages[currentIndex];

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-video overflow-hidden bg-muted rounded-lg">
        <img
          src={mainImage.url}
          alt={mainImage.caption || 'Property'}
          className="w-full h-full object-cover"
        />
        
        {sortedImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setCurrentIndex(prev => prev === 0 ? sortedImages.length - 1 : prev - 1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setCurrentIndex(prev => prev === sortedImages.length - 1 ? 0 : prev + 1)}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {sortedImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    idx === currentIndex ? "bg-white" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
        
        <Badge className="absolute top-4 right-4 bg-black/70">
          {currentIndex + 1} / {sortedImages.length}
        </Badge>
      </div>

      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors",
                idx === currentIndex ? "border-primary" : "border-transparent"
              )}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// PLANTILLAS DE MENSAJES
// ============================================

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'info' | 'followup' | 'visit' | 'custom';
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'info-1',
    name: 'Información general',
    category: 'info',
    content: `¡Hola {nombre}! 👋

Gracias por tu interés en nuestra propiedad. Te comparto la ficha técnica con todos los detalles:

📋 Ficha: {link}

¿Te gustaría agendar una visita presencial? Estoy a tu disposición para cualquier duda.

Saludos cordiales.`
  },
  {
    id: 'info-2',
    name: 'Más información solicitada',
    category: 'info',
    content: `¡Hola {nombre}! 🏠

Con gusto te envío más información sobre la propiedad que te interesa:

📋 Ficha completa: {link}

Características destacadas:
✓ Excelente ubicación
✓ Precio competitivo
✓ Documentación en orden

¿Tienes alguna pregunta específica? Con gusto te apoyo.

Quedo atento.`
  },
  {
    id: 'followup-1',
    name: 'Seguimiento - Interés inicial',
    category: 'followup',
    content: `¡Hola {nombre}! 👋

Espero que hayas tenido oportunidad de revisar la ficha de la propiedad:

📋 {link}

¿Qué te pareció? Me encantaría saber tus comentarios y resolver cualquier duda que tengas.

Estoy disponible para una llamada o visita cuando lo necesites.

Saludos.`
  },
  {
    id: 'followup-2',
    name: 'Seguimiento - Recordatorio',
    category: 'followup',
    content: `¡Hola {nombre}! 😊

Te escribo para recordarte la propiedad que te mostré:

📋 {link}

Esta propiedad tiene mucho interés. Si te gusta, te sugiero agendar una visita pronto.

¿Te gustaría que coordinemos una cita?

Quedo atento.`
  },
  {
    id: 'visit-1',
    name: 'Confirmar visita',
    category: 'visit',
    content: `¡Hola {nombre}! 📅

Confirmo nuestra cita para visitar la propiedad:

📋 Ficha: {link}

📍 Dirección: [DIRECCIÓN]
🕐 Hora: [HORA]
📱 Mi teléfono: [TELÉFONO]

Por favor confírmame tu asistencia. ¡Nos vemos pronto!

Saludos.`
  },
  {
    id: 'visit-2',
    name: 'Después de la visita',
    category: 'visit',
    content: `¡Hola {nombre}! 🏠

Fue un gusto acompañarte en la visita a la propiedad.

📋 Ficha: {link}

¿Qué te pareció? ¿Tienes alguna duda adicional?

Recuerda que estoy aquí para apoyarte en todo el proceso.

Quedo atento a tus comentarios.

Saludos cordiales.`
  }
];

// Hook para manejar plantillas
function useMessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => {
    const saved = localStorage.getItem('felmat-message-templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });

  const saveTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('felmat-message-templates', JSON.stringify(newTemplates));
  };

  const addTemplate = (template: Omit<MessageTemplate, 'id'>) => {
    const newTemplate = { ...template, id: `custom-${Date.now()}` };
    saveTemplates([...templates, newTemplate]);
  };

  const deleteTemplate = (id: string) => {
    saveTemplates(templates.filter(t => t.id !== id));
  };

  const processTemplate = (content: string, variables: Record<string, string>) => {
    let processed = content;
    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return processed;
  };

  return { templates, addTemplate, deleteTemplate, processTemplate };
}

// ============================================
// DIÁLOGO DE PLANTILLAS
// ============================================

function TemplatesDialog({
  open,
  onClose,
  onSelectTemplate,
  property,
}: {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (content: string) => void;
  property: Property | null;
}) {
  const { templates, addTemplate, deleteTemplate, processTemplate } = useMessageTemplates();
  const [activeTab, setActiveTab] = useState<'select' | 'manage'>('select');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', category: 'custom' as const });
  const [leadName, setLeadName] = useState('');
  const [previewContent, setPreviewContent] = useState('');

  const shareUrl = property ? `${window.location.origin}/p/${property.slug || property.id}` : '';

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'info', label: 'Información' },
    { value: 'followup', label: 'Seguimiento' },
    { value: 'visit', label: 'Visitas' },
    { value: 'custom', label: 'Personalizadas' },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handlePreview = (template: MessageTemplate) => {
    const processed = processTemplate(template.content, {
      nombre: leadName || '[Nombre del lead]',
      link: shareUrl,
    });
    setPreviewContent(processed);
    setEditingTemplate(template);
  };

  const handleUseTemplate = () => {
    if (previewContent) {
      onSelectTemplate(previewContent);
      onClose();
    }
  };

  const handleSaveNewTemplate = () => {
    if (newTemplate.name && newTemplate.content) {
      addTemplate(newTemplate);
      setNewTemplate({ name: '', content: '', category: 'custom' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Plantillas de Mensajes
          </DialogTitle>
          <DialogDescription>
            Selecciona o gestiona plantillas para respuestas rápidas
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 p-1 bg-muted rounded-lg mb-4">
          <button
            onClick={() => setActiveTab('select')}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === 'select' ? "bg-white shadow-sm" : "text-muted-foreground"
            )}
          >
            Usar Plantilla
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={cn(
              "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === 'manage' ? "bg-white shadow-sm" : "text-muted-foreground"
            )}
          >
            Gestionar Plantillas
          </button>
        </div>

        {activeTab === 'select' ? (
          <div className="space-y-4">
            {/* Lead name input */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Label className="text-blue-800">Nombre del lead</Label>
              <Input
                placeholder="Ej: Juan Pérez"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-blue-600 mt-1">
                Se reemplazará {'{nombre}'} en el mensaje
              </p>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm transition-all",
                    selectedCategory === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Templates list */}
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handlePreview(template)}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all hover:border-primary",
                    editingTemplate?.id === template.id && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{template.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {categories.find(c => c.value === template.category)?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {template.content.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>

            {/* Preview */}
            {previewContent && (
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground">Vista previa:</Label>
                <pre className="mt-2 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {previewContent}
                </pre>
                <Button onClick={handleUseTemplate} className="w-full mt-3">
                  <Send className="w-4 h-4 mr-2" />
                  Usar este mensaje
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add new template */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Crear nueva plantilla</h4>
              <Input
                placeholder="Nombre de la plantilla"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
              <Textarea
                placeholder={`Contenido del mensaje...

Variables disponibles:
{nombre} - Nombre del lead
{link} - Link de la ficha`}
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                rows={4}
              />
              <Button onClick={handleSaveNewTemplate} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Guardar Plantilla
              </Button>
            </div>

            {/* Existing templates */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h4 className="font-medium text-sm text-muted-foreground">Tus plantillas:</h4>
              {templates.filter(t => t.category === 'custom').map(template => (
                <div key={template.id} className="p-3 border rounded-lg flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTemplate(template.id)}
                    className="text-destructive"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {templates.filter(t => t.category === 'custom').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No has creado plantillas personalizadas aún
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DIÁLOGO DE ESTADÍSTICAS
// ============================================

function StatsDialog({
  open,
  onClose,
  property,
}: {
  open: boolean;
  onClose: () => void;
  property: Property | null;
}) {
  if (!property) return null;

  // Mock data - en producción vendría de la base de datos
  const stats = {
    totalViews: property.views || 0,
    uniqueViews: Math.floor((property.views || 0) * 0.7),
    whatsappClicks: Math.floor((property.views || 0) * 0.15),
    pdfDownloads: Math.floor((property.views || 0) * 0.08),
    lastViewed: property.updatedAt ? new Date(property.updatedAt).toLocaleString('es-MX') : 'Nunca',
    topSources: [
      { source: 'WhatsApp', count: Math.floor((property.views || 0) * 0.4) },
      { source: 'Facebook', count: Math.floor((property.views || 0) * 0.25) },
      { source: 'Directo', count: Math.floor((property.views || 0) * 0.2) },
      { source: 'Otros', count: Math.floor((property.views || 0) * 0.15) },
    ],
    dailyViews: [
      { day: 'Lun', views: Math.floor(Math.random() * 10) },
      { day: 'Mar', views: Math.floor(Math.random() * 15) },
      { day: 'Mié', views: Math.floor(Math.random() * 12) },
      { day: 'Jue', views: Math.floor(Math.random() * 8) },
      { day: 'Vie', views: Math.floor(Math.random() * 20) },
      { day: 'Sáb', views: Math.floor(Math.random() * 25) },
      { day: 'Dom', views: Math.floor(Math.random() * 18) },
    ],
  };

  const maxDailyViews = Math.max(...stats.dailyViews.map(d => d.views));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Estadísticas de la Ficha
          </DialogTitle>
          <DialogDescription>
            {property.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Eye className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{stats.totalViews}</p>
                <p className="text-xs text-muted-foreground">Vistas totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <User className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{stats.uniqueViews}</p>
                <p className="text-xs text-muted-foreground">Vistas únicas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MessageCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{stats.whatsappClicks}</p>
                <p className="text-xs text-muted-foreground">Clicks WhatsApp</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <FileDown className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{stats.pdfDownloads}</p>
                <p className="text-xs text-muted-foreground">PDFs descargados</p>
              </CardContent>
            </Card>
          </div>

          {/* Last viewed */}
          <div className="p-4 bg-muted rounded-lg flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Última vista</p>
              <p className="font-medium">{stats.lastViewed}</p>
            </div>
          </div>

          {/* Daily views chart */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Vistas esta semana
            </h4>
            <div className="flex items-end gap-2 h-32">
              {stats.dailyViews.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/20 rounded-t-md transition-all hover:bg-primary/40"
                    style={{
                      height: maxDailyViews > 0 ? `${(day.views / maxDailyViews) * 100}%` : '0%',
                      minHeight: day.views > 0 ? '4px' : '0',
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                  <span className="text-xs font-medium">{day.views}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div>
            <h4 className="font-medium mb-3">Fuentes de tráfico</h4>
            <div className="space-y-2">
              {stats.topSources.map((source) => (
                <div key={source.source} className="flex items-center gap-3">
                  <span className="text-sm w-24">{source.source}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${stats.totalViews > 0 ? (source.count / stats.totalViews) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{source.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion rate */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tasa de conversión
            </h4>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {stats.totalViews > 0 
                ? `${(((stats.whatsappClicks + stats.pdfDownloads) / stats.totalViews) * 100).toFixed(1)}%`
                : '0%'}
            </p>
            <p className="text-sm text-green-600">
              De las vistas, {stats.whatsappClicks + stats.pdfDownloads} usuarios interactuaron
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DIÁLOGO DE CÓDIGO QR
// ============================================

function QRDialog({
  open,
  onClose,
  property,
}: {
  open: boolean;
  onClose: () => void;
  property: Property | null;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSize, setQrSize] = useState<number>(300);

  useState(() => {
    if (property && open) {
      const shareUrl = `${window.location.origin}/p/${property.slug || property.id}`;
      QRCode.toDataURL(shareUrl, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff',
        },
      }).then(setQrDataUrl);
    }
  });

  useState(() => {
    if (property && open) {
      const shareUrl = `${window.location.origin}/p/${property.slug || property.id}`;
      QRCode.toDataURL(shareUrl, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff',
        },
      }).then(setQrDataUrl);
    }
  });

  if (!property) return null;

  const shareUrl = `${window.location.origin}/p/${property.slug || property.id}`;

  const handleDownloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `QR-${property.slug}.png`;
      link.click();
    }
  };

  const regenerateQR = (size: number) => {
    setQrSize(size);
    QRCode.toDataURL(shareUrl, {
      width: size,
      margin: 2,
      color: {
        dark: '#1e40af',
        light: '#ffffff',
      },
    }).then(setQrDataUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Código QR de la Ficha
          </DialogTitle>
          <DialogDescription>
            Escanea para ver la ficha en el móvil
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Image */}
          <div className="flex justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="rounded-lg shadow-lg"
                style={{ width: qrSize > 250 ? 250 : qrSize, height: qrSize > 250 ? 250 : qrSize }}
              />
            ) : (
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Generando...</span>
              </div>
            )}
          </div>

          {/* Property info */}
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="font-medium">{property.title}</p>
            <p className="text-sm text-muted-foreground">{shareUrl}</p>
          </div>

          {/* Size options */}
          <div>
            <Label className="text-sm text-muted-foreground">Tamaño</Label>
            <div className="flex gap-2 mt-2">
              {[200, 300, 500, 1000].map(size => (
                <button
                  key={size}
                  onClick={() => regenerateQR(size)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-all",
                    qrSize === size
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => regenerateQR(qrSize)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerar
            </Button>
            <Button onClick={handleDownloadQR}>
              <FileDown className="w-4 h-4 mr-2" />
              Descargar PNG
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Imprime este código y colócalo en letreros, folletos o ventanas
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DIÁLOGO PARA COMPARTIR (ACTUALIZADO)
// ============================================

function ShareDialog({ 
  property, 
  open, 
  onClose,
}: { 
  property: Property | null; 
  open: boolean; 
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { create: createLead } = useLeads(user?.id);
  const { create: createShare } = usePropertyShares();
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'pdf' | 'link' | 'personalizar'>('whatsapp');

  // Ficha personalizada para este envio (ver Tarea 8 del plan / spec de fichas
  // personalizables). Si esta activa, el link/WhatsApp/PDF de este dialogo
  // usan estos datos en vez de los del asesor que esta compartiendo.
  const [activeShare, setActiveShare] = useState<PropertyShare | null>(null);
  const [creatingShare, setCreatingShare] = useState(false);
  const [overrideName, setOverrideName] = useState('');
  const [overridePhone, setOverridePhone] = useState('');
  const [overrideWhatsapp, setOverrideWhatsapp] = useState('');
  const [overrideEmail, setOverrideEmail] = useState('');
  const [overrideCertificate, setOverrideCertificate] = useState('');
  const [overrideBio, setOverrideBio] = useState('');
  const [overrideAvatar, setOverrideAvatar] = useState('');

  // Opciones de visibilidad de datos del agente
  const [showAgentData, setShowAgentData] = useState(true);
  const [showName, setShowName] = useState(user?.config?.shareSettings?.showName ?? true);
  const [showPhone, setShowPhone] = useState(user?.config?.shareSettings?.showPhone ?? true);
  const [showWhatsApp, setShowWhatsApp] = useState(user?.config?.shareSettings?.showWhatsApp ?? true);
  const [showCertificate, setShowCertificate] = useState(user?.config?.shareSettings?.showCertificate ?? true);
  const [showEmail, setShowEmail] = useState(user?.config?.shareSettings?.showEmail ?? false);

  if (!property) return null;

  const shareUrl = `${window.location.origin}/p/${property.slug || property.id}`;
  const effectiveShareUrl = activeShare ? `${window.location.origin}/p/${activeShare.slug}` : shareUrl;

  const handleCreatePersonalizedShare = async () => {
    if (!user) return;
    setCreatingShare(true);
    try {
      const share = await createShare({
        propertyId: property.id,
        createdBy: user.id,
        overrideName: overrideName || undefined,
        overridePhone: overridePhone || undefined,
        overrideWhatsapp: overrideWhatsapp || undefined,
        overrideEmail: overrideEmail || undefined,
        overrideCertificate: overrideCertificate || undefined,
        overrideBio: overrideBio || undefined,
        overrideAvatar: overrideAvatar || undefined,
      });
      setActiveShare(share);
    } finally {
      setCreatingShare(false);
    }
  };

  const handleOverrideAvatarUpload = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setOverrideAvatar(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Mensaje profesional para WhatsApp
  // Nota: sin emoji de plano suplementario (🏠📍💰...) -- wa.me/api.whatsapp.com
  // los corrompe en su redirección (confirmado: llegan bien codificados hasta
  // encodeURIComponent, se rompen del lado de WhatsApp). Solo texto + *negritas*.
  const generateWhatsAppMessage = () => {
    const contact = resolveAgentDisplay(user ?? null, activeShare ?? undefined);
    let message = `*${property.title}*\n\n`;
    message += `*Precio:* $${property.price.toLocaleString('es-MX')} ${property.priceCurrency}\n`;
    message += `*Ubicación:* ${property.location.city}, ${property.location.neighborhood}\n`;
    message += `*Recámaras:* ${property.features.bedrooms} | *Baños:* ${property.features.bathrooms}\n`;
    message += `*Estacionamientos:* ${property.features.parkingSpaces}\n\n`;
    message += `Ver ficha completa aquí:\n${effectiveShareUrl}\n\n`;

    if (showAgentData) {
      message += `---\n*Contacto:*\n`;
      if (showName) message += `${contact.name}\n`;
      if (showCertificate && contact.certificateNumber) {
        message += `Certificado: ${contact.certificateNumber}\n`;
      }
      if (showWhatsApp && contact.whatsapp) {
        message += `WhatsApp: ${contact.whatsapp}\n`;
      }
      if (showPhone && contact.phone) message += `Tel: ${contact.phone}\n`;
      if (showEmail && contact.email) message += `${contact.email}\n`;
    }

    message += `\n¿Te interesa? ¡Contáctame!`;
    return message;
  };

  const whatsappMessage = generateWhatsAppMessage();
  const whatsappUrl = clientPhone 
    ? `https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const handleShareWhatsApp = async () => {
    if (clientName && clientPhone) {
      await createLead({
        name: clientName,
        email: '',
        phone: clientPhone,
        whatsapp: clientPhone,
        source: 'whatsapp' as LeadSource,
        status: 'nuevo',
        interestedPropertyId: property.id,
        assignedTo: user?.id || '',
        pipelineStage: 'nuevo',
        score: 50,
      });
    }
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(effectiveShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!property || !user) return;
    setExportingPDF(true);
    try {
      await exportPropertyToPDF({
        property,
        agent: showAgentData ? user : null,
        showAgentData,
        agentOverride: activeShare ?? undefined,
      });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const mainImage = property.images.find(img => img.isMain)?.url || property.images[0]?.url;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ficha Técnica - ${property.title}</title>
        <style>
          @page { margin: 15mm; size: auto; }
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #1e40af; margin: 0; font-size: 28px; }
          .header p { color: #666; margin: 5px 0 0 0; }
          .main-image { width: 100%; height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 25px; }
          .title-section { margin-bottom: 25px; }
          .title-section h2 { margin: 0 0 10px 0; font-size: 24px; color: #1e293b; }
          .title-section .location { color: #666; margin: 0; }
          .price { font-size: 32px; color: #1e40af; font-weight: bold; margin: 15px 0; }
          .features { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 25px 0; }
          .feature-box { text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; }
          .feature-box .number { font-size: 28px; font-weight: bold; color: #1e40af; }
          .feature-box .label { font-size: 12px; color: #666; margin-top: 5px; }
          .section { margin: 25px 0; }
          .section h3 { color: #1e293b; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          .section p { line-height: 1.6; text-align: justify; }
          .amenities { display: flex; flex-wrap: wrap; gap: 8px; }
          .amenity { background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
          .agent-section { margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #1e40af; }
          .agent-section h3 { color: #1e40af; margin: 0 0 15px 0; }
          .agent-info { display: flex; align-items: center; gap: 15px; }
          .agent-avatar { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #1e40af, #3b82f6); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
          .agent-details p { margin: 5px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>GRUPO FELMAT</h1>
          <p>Ficha Técnica de Propiedad</p>
        </div>
        
        ${mainImage ? `<img src="${mainImage}" class="main-image" />` : ''}
        
        <div class="title-section">
          <h2>${property.title}</h2>
          <p class="location">📍 ${property.location.address}, ${property.location.neighborhood}, ${property.location.city}, ${property.location.state}</p>
          <div class="price">$${property.price.toLocaleString('es-MX')} ${property.priceCurrency}</div>
        </div>
        
        <div class="features">
          <div class="feature-box">
            <div class="number">${property.features.bedrooms}</div>
            <div class="label">Recámaras</div>
          </div>
          <div class="feature-box">
            <div class="number">${property.features.bathrooms}</div>
            <div class="label">Baños</div>
          </div>
          <div class="feature-box">
            <div class="number">${property.features.parkingSpaces}</div>
            <div class="label">Estacionamientos</div>
          </div>
          <div class="feature-box">
            <div class="number">${property.features.constructionArea}</div>
            <div class="label">m² Construcción</div>
          </div>
        </div>
        
        <div class="section">
          <h3>Descripción</h3>
          <p>${property.description || 'Sin descripción disponible.'}</p>
        </div>
        
        ${property.features.amenities.length > 0 ? `
        <div class="section">
          <h3>Amenidades</h3>
          <div class="amenities">
            ${property.features.amenities.map(a => `<span class="amenity">${a}</span>`).join('')}
          </div>
        </div>
        ` : ''}
        
        ${showAgentData && user ? `
        <div class="agent-section">
          <h3>Contacta al Agente</h3>
          <div class="agent-info">
            <div class="agent-avatar">${user.name.charAt(0)}${user.lastName.charAt(0)}</div>
            <div class="agent-details">
              ${showName ? `<p><strong>${user.name} ${user.lastName}</strong></p>` : ''}
              ${showCertificate && user.config?.certificateNumber ? `<p style="color: #059669;">✓ Certificado: ${user.config.certificateNumber}</p>` : ''}
              ${showWhatsApp && user.config?.whatsappNumber ? `<p>📱 WhatsApp: ${user.config.whatsappNumber}</p>` : ''}
              ${showPhone ? `<p>📞 Teléfono: ${user.phone}</p>` : ''}
              ${showEmail ? `<p>✉️ Email: ${user.email}</p>` : ''}
            </div>
          </div>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>Ficha generada por Grupo FELMAT - CRM Inmobiliario</p>
          <p>${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <script>window.onload = () => { setTimeout(() => window.print(), 500); };</script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartir Ficha Técnica</DialogTitle>
          <DialogDescription>
            Elige cómo deseas compartir esta propiedad
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === 'whatsapp' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === 'pdf' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileDown className="w-4 h-4" />
            PDF / Imprimir
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === 'link' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Copy className="w-4 h-4" />
            Enlace
          </button>
          <button
            onClick={() => setActiveTab('personalizar')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === 'personalizar' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserCog className="w-4 h-4" />
            Personalizar
          </button>
        </div>

        {/* Property preview */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium">{property.title}</h4>
          <p className="text-sm text-muted-foreground">
            {property.location.city}, {property.location.neighborhood}
          </p>
          <p className="text-lg font-bold text-primary mt-2">
            ${property.price.toLocaleString('es-MX')} {property.priceCurrency}
          </p>
        </div>

        {/* Configuración de datos del agente - Visible en todas las tabs */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showAgentData ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              <span className="font-medium">
                {showAgentData ? 'Datos del agente visibles' : 'Datos del agente ocultos'}
              </span>
            </div>
            <Switch checked={showAgentData} onCheckedChange={setShowAgentData} />
          </div>
          
          {showAgentData && (
            <div className="pl-6 space-y-2 border-l-2 border-muted ml-2">
              <p className="text-xs text-muted-foreground mb-2">Selecciona qué datos mostrar:</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <User className="w-3 h-3" /> Nombre
                </span>
                <Switch checked={showName} onCheckedChange={setShowName} />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Teléfono
                </span>
                <Switch checked={showPhone} onCheckedChange={setShowPhone} />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </span>
                <Switch checked={showWhatsApp} onCheckedChange={setShowWhatsApp} />
              </div>
              
              {user?.config?.certificateNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Award className="w-3 h-3" /> Certificado
                  </span>
                  <Switch checked={showCertificate} onCheckedChange={setShowCertificate} />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email
                </span>
                <Switch checked={showEmail} onCheckedChange={setShowEmail} />
              </div>
            </div>
          )}
        </div>

        {/* Vista previa de datos del agente */}
        {showAgentData && user && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground mb-2">Vista previa de datos que se mostrarán:</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div className="text-sm">
                {showName && <p className="font-medium">{user.name} {user.lastName}</p>}
                {showCertificate && user.config?.certificateNumber && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Award className="w-3 h-3" /> Certificado: {user.config.certificateNumber}
                  </p>
                )}
                {showWhatsApp && user.config?.whatsappNumber && (
                  <p className="text-xs text-muted-foreground">📱 {user.config.whatsappNumber}</p>
                )}
                {showPhone && <p className="text-xs text-muted-foreground">📞 {user.phone}</p>}
                {showEmail && <p className="text-xs text-muted-foreground">✉️ {user.email}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>📱 Compartir por WhatsApp</strong><br />
                Se enviará un mensaje con el link a la ficha web y los detalles de la propiedad.
              </p>
            </div>
            
            <div className="space-y-3">
              <Label>Datos del cliente (opcional)</Label>
              <Input
                placeholder="Nombre del cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <Input
                placeholder="Número de WhatsApp (ej: 5214421234567)"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-xs text-muted-foreground">Vista previa del mensaje:</Label>
              <pre className="mt-2 text-xs whitespace-pre-wrap text-muted-foreground max-h-32 overflow-y-auto">
                {whatsappMessage}
              </pre>
            </div>

            <Button onClick={handleShareWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
              <MessageCircle className="w-4 h-4 mr-2" />
              Enviar por WhatsApp
            </Button>
          </div>
        )}

        {activeTab === 'pdf' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>📄 Exportar o Imprimir</strong><br />
                Genera un PDF profesional o imprime la ficha directamente.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={handlePrint} 
                className="w-full"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button 
                onClick={handleExportPDF} 
                className="w-full"
                disabled={exportingPDF}
              >
                <FileDown className="w-4 h-4 mr-2" />
                {exportingPDF ? 'Generando...' : 'Descargar PDF'}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              El PDF incluirá {showAgentData ? 'los datos del agente según la configuración' : 'solo la información de la propiedad (sin datos del agente)'}.
            </p>
          </div>
        )}

        {activeTab === 'link' && (
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>🔗 Compartir enlace</strong><br />
                Copia el link de la ficha pública para compartirlo donde prefieras.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={effectiveShareUrl}
                readOnly
                className="flex-1"
              />
              <Button variant="outline" onClick={copyLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <a href={effectiveShareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver ficha pública
              </a>
            </Button>
          </div>
        )}

        {activeTab === 'personalizar' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Personalizar contacto para este envío</strong><br />
                Genera un link aparte de esta ficha mostrando otros datos de contacto
                -- por ejemplo, de un colega o un referido externo que ni siquiera
                necesita tener cuenta en el CRM. Lo que dejes en blanco usa tus
                propios datos reales. La ficha original no se modifica.
              </p>
            </div>

            {!activeShare ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                    {overrideAvatar ? (
                      <img src={overrideAvatar} alt="Foto personalizada" className="w-full h-full object-cover" />
                    ) : (
                      <UserCog className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="override-avatar-upload" className="text-xs text-muted-foreground cursor-pointer underline underline-offset-2">
                      {overrideAvatar ? 'Cambiar foto (opcional)' : 'Subir foto (opcional)'}
                    </Label>
                    <input
                      id="override-avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleOverrideAvatarUpload(e.target.files)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Nombre (opcional)" value={overrideName} onChange={(e) => setOverrideName(e.target.value)} />
                  <Input placeholder="Teléfono (opcional)" value={overridePhone} onChange={(e) => setOverridePhone(e.target.value)} />
                  <Input placeholder="WhatsApp (opcional)" value={overrideWhatsapp} onChange={(e) => setOverrideWhatsapp(e.target.value)} />
                  <Input placeholder="Correo (opcional)" value={overrideEmail} onChange={(e) => setOverrideEmail(e.target.value)} />
                  <Input placeholder="Certificado (opcional)" value={overrideCertificate} onChange={(e) => setOverrideCertificate(e.target.value)} />
                  <Input placeholder="Rol / descripción corta (opcional)" value={overrideBio} onChange={(e) => setOverrideBio(e.target.value)} />
                </div>
                <Button onClick={handleCreatePersonalizedShare} className="w-full" disabled={creatingShare}>
                  <UserCog className="w-4 h-4 mr-2" />
                  {creatingShare ? 'Generando...' : 'Generar link personalizado'}
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                  Link personalizado generado. Las pestañas de WhatsApp, PDF y Enlace de arriba ya están usando estos datos.
                </div>
                <div className="flex gap-2">
                  <Input value={effectiveShareUrl} readOnly className="flex-1" />
                  <Button variant="outline" onClick={copyLink}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setActiveShare(null)}>
                  Quitar personalización y volver a mis datos reales
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Componente principal
export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, canViewAllProperties } = useAuth();
  const { properties, remove } = useProperties(canViewAllProperties ? undefined : user?.id);
  const { users } = useUsers();
  const [shareOpen, setShareOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const property = properties.find(p => p.id === id);

  if (!property) {
    return (
      <div className="text-center py-16">
        <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Propiedad no encontrada</h2>
        <p className="text-muted-foreground mb-4">La propiedad que buscas no existe o fue eliminada</p>
        <Button asChild>
          <Link to="/propiedades">Ver todas las propiedades</Link>
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta propiedad?')) {
      await remove(property.id);
      navigate('/propiedades');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return 'bg-green-500';
      case 'reservado': return 'bg-yellow-500';
      case 'vendido': return 'bg-blue-500';
      case 'rentado': return 'bg-purple-500';
      case 'en_negociacion': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
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

  const getTransactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'venta': 'Venta',
      'renta': 'Renta',
      'venta_renta': 'Venta/Renta',
    };
    return labels[type] || type;
  };

  const agentLinked = users.some(u => u.id === property.agentId);

  return (
    <div className="space-y-6">
      {!agentLinked && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Esta propiedad no tiene un asesor válido asignado. La ficha pública mostrará un contacto genérico de la agencia hasta que la corrijas en "Editar".
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/propiedades')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{property.title}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {property.location.address}, {property.location.city}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartir
          </Button>
          <Button variant="outline" onClick={() => setTemplatesOpen(true)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Plantillas
          </Button>
          <Button variant="outline" onClick={() => setStatsOpen(true)}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Estadísticas
          </Button>
          <Button variant="outline" onClick={() => setQrOpen(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            QR
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/propiedades/${property.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <ImageGallery images={property.images} />

          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="description">Descripción</TabsTrigger>
              <TabsTrigger value="location">Ubicación</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Características</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Bed className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{property.features.bedrooms}</p>
                      <p className="text-sm text-muted-foreground">Recámaras</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Bath className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{property.features.bathrooms}</p>
                      <p className="text-sm text-muted-foreground">Baños</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Car className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{property.features.parkingSpaces}</p>
                      <p className="text-sm text-muted-foreground">Estacionamientos</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Maximize className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{property.features.constructionArea}</p>
                      <p className="text-sm text-muted-foreground">m² construcción</p>
                    </div>
                  </div>

                  {property.features.amenities.length > 0 && (
                    <>
                      <div className="border-t my-6" />
                      <div>
                        <h4 className="font-medium mb-3">Amenidades</h4>
                        <div className="flex flex-wrap gap-2">
                          {property.features.amenities.map(amenity => (
                            <Badge key={amenity} variant="secondary">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="description">
              <Card>
                <CardContent className="p-6">
                  <p className="whitespace-pre-wrap">{property.description || 'Sin descripción'}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              {/* Mapa */}
              <PropertyMap
                address={property.location.address}
                city={property.location.city}
                state={property.location.state}
                zipCode={property.location.zipCode}
              />
              
              {/* Detalles de ubicación */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalles de Ubicación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Dirección</Label>
                      <p className="font-medium">{property.location.address}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Colonia</Label>
                      <p className="font-medium">{property.location.neighborhood || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Ciudad</Label>
                      <p className="font-medium">{property.location.city}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Estado</Label>
                      <p className="font-medium">{property.location.state}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Código Postal</Label>
                      <p className="font-medium">{property.location.zipCode || 'N/A'}</p>
                    </div>
                  </div>
                  {property.location.references && (
                    <>
                      <div className="border-t" />
                      <div>
                        <Label className="text-muted-foreground">Referencias</Label>
                        <p>{property.location.references}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Price card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={cn("text-white", getStatusColor(property.status))}>
                  {getStatusLabel(property.status)}
                </Badge>
                <Badge variant="outline">
                  {getTransactionLabel(property.transactionType)}
                </Badge>
              </div>
              <p className="text-3xl font-bold text-primary">
                ${property.price.toLocaleString('es-MX')}
              </p>
              <p className="text-sm text-muted-foreground">{property.priceCurrency}</p>
              
              <div className="border-t my-4" />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vistas</span>
                  <span className="font-medium">{property.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Leads generados</span>
                  <span className="font-medium">{property.leadsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Publicada</span>
                  <span className="font-medium">
                    {property.publishedAt 
                      ? new Date(property.publishedAt).toLocaleDateString('es-MX')
                      : 'No publicada'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {property.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Etiquetas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {property.tags.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={() => setShareOpen(true)}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartir ficha
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/p/${property.slug}`} target="_blank">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver ficha pública
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareDialog
        property={property}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      {/* Templates Dialog */}
      <TemplatesDialog
        property={property}
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelectTemplate={() => {
          setTemplatesOpen(false);
          setShareOpen(true);
        }}
      />

      {/* Stats Dialog */}
      <StatsDialog
        property={property}
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
      />

      {/* QR Dialog */}
      <QRDialog
        property={property}
        open={qrOpen}
        onClose={() => setQrOpen(false)}
      />
    </div>
  );
}

export default PropertyDetail;
