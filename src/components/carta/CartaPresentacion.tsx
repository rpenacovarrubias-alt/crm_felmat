// ============================================
// CARTA DE PRESENTACIÓN - Grupo FELMAT
// ============================================

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Printer, 
  Eye, 
  RefreshCw,
  User,
  Phone,
  Mail,
  CheckCircle2
} from 'lucide-react';

// Lista de servicios
const ALL_SERVICES = [
  'Software administrativo',
  'Control de servicios a través de bitácoras',
  'Asesoría legal',
  'Recuperación de cartera vencida',
  'Administración de ingresos y egresos',
  'Trámites ante dependencias gubernamentales',
  'Elaboración de presupuestos',
  'Coordinación de proveedores',
  '4 Visitas a la semana',
  'Preparación y presentación de informes',
  'Preparación de reglamentos y actualizaciones',
  'Mantenimiento preventivo y correctivo'
];

interface FormData {
  recipientName: string;
  recipientCompany: string;
  city: string;
  date: string;
  salutation: string;
  introParagraph: string;
  expParagraph: string;
  closingText: string;
  signerName: string;
  signerTitle: string;
  signerPhone: string;
  signerEmail: string;
  selectedServices: string[];
}

const defaultFormData: FormData = {
  recipientName: '',
  recipientCompany: '',
  city: 'Corregidora, Querétaro',
  date: new Date().toISOString().split('T')[0],
  salutation: 'Estimados señores:',
  introParagraph: 'Tenemos como objetivos principales responder con dedicación, lealtad, respeto y compromiso a nuestros clientes; quienes han depositado su confianza en nosotros. Como base de nuestra gestión observamos cuidadosamente EL SERVICIO, LA COMUNICACIÓN Y LA EFICIENCIA para los residentes, para la mesa directiva y para las instancias de gobierno, así como las no gubernamentales.',
  expParagraph: 'Somos una empresa que surge a partir de nuestra experiencia como administradores en 2006 en Pirámides privada Yaxchilán. Con más experiencia y dentro de la formalidad, hemos obtenido certificaciones como asesores patrimoniales. Hoy en día hemos administrado exitosamente condominios en el municipio de Corregidora en fraccionamientos como: Pirámides, Paseos del Bosque y Puerta Real.',
  closingText: 'Quedamos a sus órdenes para más información y presentación de servicios y cotización.',
  signerName: 'Mayra Fajer del Castillo',
  signerTitle: 'Asesora Patrimonial',
  signerPhone: '442 124 9613',
  signerEmail: 'hola@felmat.com.mx',
  selectedServices: ALL_SERVICES.slice(0, 11)
};

export function CartaPresentacion() {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [showPreview, setShowPreview] = useState(true);
  const letterRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(service)
        ? prev.selectedServices.filter(s => s !== service)
        : [...prev.selectedServices, service]
    }));
  };

  const formatDateSpanish = (dateStr: string) => {
    if (!dateStr) return '— de — de 2026';
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !letterRef.current) return;

    const letterContent = letterRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Carta de Presentación - Grupo FELMAT</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
        <style>
          @page { margin: 0; size: auto; }
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Lato', sans-serif;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .letter {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            box-shadow: none;
          }
          .letter-header {
            background: #1e3a5f;
            padding: 28px 40px 20px;
            display: flex;
            align-items: center;
            gap: 24px;
          }
          .letter-logo { height: 72px; }
          .letter-company-name {
            font-family: 'Playfair Display', serif;
            color: #d4a93a;
            font-size: 1.5rem;
            font-weight: 700;
            line-height: 1.1;
          }
          .letter-tagline {
            color: #b0a89a;
            font-size: 0.75rem;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            margin-top: 4px;
          }
          .letter-gold-bar {
            height: 4px;
            background: linear-gradient(90deg, #b8922a 0%, #d4a93a 100%);
          }
          .letter-body {
            padding: 36px 48px 40px;
          }
          .letter-date {
            text-align: right;
            font-size: 0.88rem;
            color: #6b6255;
            margin-bottom: 22px;
            font-style: italic;
          }
          .letter-recipient {
            font-weight: 700;
            font-size: 1rem;
            color: #8b6e1f;
            margin-bottom: 6px;
          }
          .letter-recipient-company {
            font-size: 0.92rem;
            color: #6b6255;
            margin-bottom: 22px;
          }
          .letter-salutation {
            font-size: 0.92rem;
            margin-bottom: 16px;
            color: #3a3228;
          }
          .letter-text {
            font-size: 0.88rem;
            line-height: 1.75;
            color: #3a3228;
            text-align: justify;
            margin-bottom: 14px;
          }
          .letter-services-title {
            font-family: 'Playfair Display', serif;
            font-size: 0.95rem;
            font-weight: 600;
            color: #8b6e1f;
            margin: 20px 0 12px;
            letter-spacing: 0.5px;
          }
          .letter-services-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 16px;
            margin-bottom: 20px;
          }
          .letter-service {
            font-size: 0.82rem;
            color: #3a3228;
            display: flex;
            align-items: flex-start;
            gap: 7px;
            line-height: 1.4;
          }
          .letter-service::before {
            content: '◆';
            color: #b8922a;
            font-size: 0.6rem;
            margin-top: 3px;
            flex-shrink: 0;
          }
          .letter-closing {
            font-size: 0.88rem;
            color: #3a3228;
            margin-top: 20px;
            margin-bottom: 28px;
            line-height: 1.6;
          }
          .letter-signature-block {
            border-top: 2px solid #f5edd8;
            padding-top: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .letter-signature-name {
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            font-size: 1rem;
            color: #8b6e1f;
          }
          .letter-signature-title {
            font-size: 0.8rem;
            color: #6b6255;
            margin-top: 3px;
          }
          .letter-contact {
            text-align: right;
            font-size: 0.78rem;
            color: #6b6255;
            line-height: 1.6;
          }
          .letter-footer {
            background: #1e3a5f;
            padding: 12px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .letter-footer-text {
            color: #b0a89a;
            font-size: 0.7rem;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .letter-footer-gold {
            width: 30px;
            height: 2px;
            background: #b8922a;
          }
        </style>
      </head>
      <body>
        ${letterContent}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Carta de Presentación
          </h1>
          <p className="text-muted-foreground mt-1">
            Genera cartas de presentación profesionales para tus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Ocultar vista' : 'Mostrar vista'}
          </Button>
          <Button variant="outline" onClick={resetForm}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Panel */}
        <Card className="h-fit">
          <CardContent className="p-6 space-y-6">
            {/* Destinatario */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <User className="w-5 h-5" />
                Destinatario
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del contacto</Label>
                  <Input
                    placeholder="Ej. Lic. Juan Pérez"
                    value={formData.recipientName}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Empresa / Condominio</Label>
                  <Input
                    placeholder="Ej. Residencial Los Pinos"
                    value={formData.recipientCompany}
                    onChange={(e) => handleInputChange('recipientCompany', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ciudad, Municipio</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cuerpo de la Carta */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <FileText className="w-5 h-5" />
                Cuerpo de la Carta
              </h3>
              
              <div className="space-y-2">
                <Label>Saludo / Apertura</Label>
                <Input
                  value={formData.salutation}
                  onChange={(e) => handleInputChange('salutation', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Párrafo de introducción</Label>
                <Textarea
                  value={formData.introParagraph}
                  onChange={(e) => handleInputChange('introParagraph', e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Párrafo de experiencia</Label>
                <Textarea
                  value={formData.expParagraph}
                  onChange={(e) => handleInputChange('expParagraph', e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Frase de cierre</Label>
                <Textarea
                  value={formData.closingText}
                  onChange={(e) => handleInputChange('closingText', e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Servicios */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-5 h-5" />
                Servicios a Incluir
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_SERVICES.map((service) => (
                  <label
                    key={service}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      formData.selectedServices.includes(service)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <Checkbox
                      checked={formData.selectedServices.includes(service)}
                      onCheckedChange={() => handleServiceToggle(service)}
                      className="mt-0.5"
                    />
                    <span className="text-sm">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Firmante */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <User className="w-5 h-5" />
                Firmante
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del firmante</Label>
                  <Input
                    value={formData.signerName}
                    onChange={(e) => handleInputChange('signerName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input
                    value={formData.signerTitle}
                    onChange={(e) => handleInputChange('signerTitle', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Teléfono
                  </Label>
                  <Input
                    value={formData.signerPhone}
                    onChange={(e) => handleInputChange('signerPhone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Correo electrónico
                  </Label>
                  <Input
                    type="email"
                    value={formData.signerEmail}
                    onChange={(e) => handleInputChange('signerEmail', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button 
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir / PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        {showPreview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Vista Previa
              </h3>
            </div>
            
            <div 
              ref={letterRef}
              className="bg-white shadow-lg rounded-lg overflow-hidden"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              {/* Header */}
              <div 
                className="p-6 flex items-center gap-6"
                style={{ background: '#1e3a5f' }}
              >
                <img 
                  src="/logo-felmat-gold.png" 
                  alt="Grupo FELMAT" 
                  className="h-16 w-auto"
                />
                <div>
                  <div 
                    className="text-2xl font-bold"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      color: '#d4a93a'
                    }}
                  >
                    GRUPO FELMAT
                  </div>
                  <div 
                    className="text-xs tracking-widest uppercase"
                    style={{ color: '#b0a89a' }}
                  >
                    Servicios Inmobiliarios
                  </div>
                </div>
              </div>
              
              {/* Gold Bar */}
              <div 
                className="h-1"
                style={{ 
                  background: 'linear-gradient(90deg, #b8922a 0%, #d4a93a 100%)' 
                }}
              />

              {/* Body */}
              <div className="p-8 space-y-4">
                {/* Date */}
                <div className="text-right text-sm italic" style={{ color: '#6b6255' }}>
                  {formData.city} a {formatDateSpanish(formData.date)}
                </div>

                {/* Recipient */}
                {formData.recipientName && (
                  <div className="font-bold" style={{ color: '#8b6e1f' }}>
                    {formData.recipientName}
                  </div>
                )}
                {formData.recipientCompany && (
                  <div className="text-sm" style={{ color: '#6b6255' }}>
                    {formData.recipientCompany}
                  </div>
                )}

                {/* Salutation */}
                <div className="pt-4 text-sm" style={{ color: '#3a3228' }}>
                  {formData.salutation}
                </div>

                {/* Paragraphs */}
                <p 
                  className="text-sm leading-relaxed text-justify"
                  style={{ color: '#3a3228', lineHeight: '1.75' }}
                >
                  {formData.introParagraph}
                </p>

                <p 
                  className="text-sm leading-relaxed text-justify"
                  style={{ color: '#3a3228', lineHeight: '1.75' }}
                >
                  {formData.expParagraph}
                </p>

                {/* Services */}
                {formData.selectedServices.length > 0 && (
                  <>
                    <div 
                      className="text-base font-semibold pt-4"
                      style={{ 
                        fontFamily: "'Playfair Display', serif",
                        color: '#8b6e1f' 
                      }}
                    >
                      Nuestros Servicios
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {formData.selectedServices.map((service) => (
                        <div 
                          key={service}
                          className="text-sm flex items-start gap-2"
                          style={{ color: '#3a3228' }}
                        >
                          <span style={{ color: '#b8922a' }}>◆</span>
                          {service}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Closing */}
                <p 
                  className="text-sm pt-4"
                  style={{ color: '#3a3228' }}
                >
                  {formData.closingText}
                  <br /><br />
                  Atentamente,
                </p>

                {/* Signature */}
                <div 
                  className="flex justify-between items-end pt-6 border-t-2"
                  style={{ borderColor: '#f5edd8' }}
                >
                  <div>
                    <div 
                      className="font-bold text-base"
                      style={{ 
                        fontFamily: "'Playfair Display', serif",
                        color: '#8b6e1f' 
                      }}
                    >
                      {formData.signerName}
                    </div>
                    <div className="text-sm" style={{ color: '#6b6255' }}>
                      {formData.signerTitle}
                    </div>
                  </div>
                  <div className="text-right text-xs" style={{ color: '#6b6255' }}>
                    {formData.signerPhone}<br />
                    {formData.signerEmail}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div 
                className="px-8 py-3 flex justify-between items-center"
                style={{ background: '#1e3a5f' }}
              >
                <div 
                  className="text-xs tracking-wider uppercase"
                  style={{ color: '#b0a89a' }}
                >
                  Grupo Felmat Servicios Inmobiliarios
                </div>
                <div 
                  className="w-8 h-0.5"
                  style={{ background: '#b8922a' }}
                />
                <div 
                  className="text-xs tracking-wider uppercase"
                  style={{ color: '#b0a89a' }}
                >
                  hola@felmat.com.mx
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartaPresentacion;
