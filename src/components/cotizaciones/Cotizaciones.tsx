// ============================================
// COTIZACIONES - Grupo FELMAT
// ============================================

import { useState, useRef, useEffect } from 'react';
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
  CheckCircle2,
  Building2,
  Calendar,
  DollarSign,
  Home,
  Hash
} from 'lucide-react';

// Lista de servicios incluidos
const ALL_SERVICES = [
  'Software administrativo',
  'Control de servicios a través de bitácoras',
  'Asesoría legal',
  'Recuperación de cartera vencida',
  'Administración de ingresos y egresos',
  'Trámites ante dependencias gubernamentales, institucionales y privadas',
  'Elaboración de presupuestos',
  'Coordinación de servicios dispensados por los diferentes proveedores',
  '4 Visitas a la semana para gestión del condominio',
  'Preparación y presentación de informes',
  'Preparación de reglamentos, cambios y actualizaciones'
];

interface FormData {
  // Datos del cliente
  nombre: string;
  apellidos: string;
  whatsapp: string;
  email: string;
  cargo: string;
  
  // Datos del condominio
  condoNombre: string;
  condoDomicilio: string;
  fechaInicio: string;
  
  // Cuota mensual
  cantidadCasas: number;
  precioPorCasa: number;
  notaIVA: string;
  
  // Servicios
  selectedServices: string[];
  
  // Gestión adicional
  horario: string;
  gestionMunicipal: string;
  
  // Nota y cierre
  notaCotizacion: string;
  parrafoCierre: string;
  
  // Firmante y folio
  firmanteNombre: string;
  firmanteCargo: string;
  folio: string;
  fechaCotizacion: string;
}

const defaultFormData: FormData = {
  nombre: '',
  apellidos: '',
  whatsapp: '',
  email: '',
  cargo: 'Presidente(a) de la mesa directiva',
  
  condoNombre: '',
  condoDomicilio: '',
  fechaInicio: '',
  
  cantidadCasas: 0,
  precioPorCasa: 0,
  notaIVA: 'más IVA en caso de requerir factura',
  
  selectedServices: [...ALL_SERVICES],
  
  horario: '3 días de 9 a 5; 2 días de 4 a 8 y sábados de 9 a 12. Domingos descanso.',
  gestionMunicipal: '',
  
  notaCotizacion: 'El valor de la presente cotización fue cuidadosamente analizado con respecto a los gastos que conlleva nuestra nómina y gestión interna para llevar a cabo una óptima administración. Buscaremos en el corto plazo a través de una cobranza efectiva aumentar los ingresos del condominio.',
  parrafoCierre: 'Agradezco la atención a la presente cotización, quedo a sus órdenes para hacer cualquier aclaración de alguna duda que pueda surgir, o para ampliar la información de la presente cotización.',
  
  firmanteNombre: 'Mayra Fajer del Castillo',
  firmanteCargo: 'Asesora Patrimonial',
  folio: '',
  fechaCotizacion: new Date().toISOString().split('T')[0]
};

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function Cotizaciones() {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [showPreview, setShowPreview] = useState(true);
  const docRef = useRef<HTMLDivElement>(null);

  // Set default dates on mount
  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    setFormData(prev => ({
      ...prev,
      fechaCotizacion: formatDate(today),
      fechaInicio: formatDate(nextMonth),
      folio: `COT-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-001`
    }));
  }, []);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
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

  const calcularTotal = () => {
    return formData.cantidadCasas * formData.precioPorCasa;
  };

  const formatCurrency = (amount: number) => {
    return '$' + amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDateSpanish = (dateStr: string, city: string = 'Corregidora, Querétaro') => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${city} a ${parseInt(d)} de ${MESES[parseInt(m) - 1]} de ${y}`;
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(d)} de ${MESES[parseInt(m) - 1]} de ${y}`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !docRef.current) return;

    const docContent = docRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Cotización - Grupo FELMAT</title>
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
          .doc {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            box-shadow: none;
            font-size: 13px;
            line-height: 1.55;
            color: #222;
          }
          .doc-head {
            padding: 22px 48px 14px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #b8922a;
          }
          .doc-logo { height: 80px; }
          .doc-head-right { text-align: right; }
          .doc-head-addr {
            font-size: 9.5px;
            color: #6b6255;
            line-height: 1.55;
          }
          .doc-head-phone {
            font-size: 10.5px;
            color: #8b6e1f;
            font-weight: 700;
            margin-top: 4px;
          }
          .doc-title-strip {
            background: #f5edd8;
            border-bottom: 1px solid #b8922a;
            padding: 10px 48px;
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 6px;
          }
          .cot-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.05rem;
            font-weight: 700;
            color: #3a3228;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .cot-folio {
            font-size: 10px;
            color: #6b6255;
          }
          .cot-date {
            font-size: 10px;
            color: #6b6255;
            text-align: right;
          }
          .doc-body { padding: 28px 48px 32px; }
          .dest-block { margin-bottom: 22px; }
          .dest-name { font-size: 13px; font-weight: 700; color: #3a3228; }
          .dest-role { font-size: 12px; color: #6b6255; }
          .dest-condo { font-size: 12px; color: #6b6255; }
          .dest-present {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 3px;
            color: #3a3228;
            margin-top: 4px;
          }
          .price-line {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            border-bottom: 1px dotted #b0a89a;
            padding-bottom: 2px;
            margin: 18px 0 6px;
          }
          .pl-desc { font-size: 13px; color: #3a3228; }
          .pl-amount { font-size: 14px; font-weight: 700; color: #3a3228; white-space: nowrap; }
          .price-note {
            font-size: 11.5px;
            color: #6b6255;
            margin-bottom: 16px;
            font-style: italic;
          }
          .doc-nota {
            background: #f8f6f1;
            border-left: 3px solid #b8922a;
            padding: 10px 14px;
            margin: 14px 0 20px;
            font-size: 11.5px;
            color: #3a3228;
            line-height: 1.6;
          }
          .doc-nota strong { color: #3a3228; }
          .sec-title {
            font-size: 12.5px;
            font-weight: 700;
            color: #3a3228;
            margin: 18px 0 8px;
            border-bottom: 1px solid #ede9e0;
            padding-bottom: 4px;
          }
          .doc-bullets {
            list-style: none;
            padding: 0 0 0 14px;
            margin-bottom: 12px;
          }
          .doc-bullets li {
            position: relative;
            font-size: 12px;
            color: #333;
            padding: 3px 0 3px 18px;
            line-height: 1.5;
          }
          .doc-bullets li::before {
            content: '•';
            position: absolute;
            left: 0;
            color: #b8922a;
            font-size: 14px;
            top: 1px;
          }
          .doc-closing {
            font-size: 12px;
            color: #3a3228;
            margin: 20px 0 22px;
            line-height: 1.65;
          }
          .doc-sign-block { margin-top: 24px; }
          .doc-sign-name {
            font-weight: 700;
            font-size: 13px;
            color: #3a3228;
            margin-top: 4px;
          }
          .doc-sign-role { font-size: 11.5px; color: #6b6255; }
          .accept-box {
            margin-top: 26px;
            border: 1.5px dashed #b0a89a;
            border-radius: 7px;
            padding: 14px 18px;
          }
          .accept-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6b6255;
            margin-bottom: 10px;
          }
          .accept-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
          }
          .accept-field {
            border-bottom: 1px solid #b0a89a;
            min-height: 30px;
          }
          .accept-label {
            font-size: 9.5px;
            color: #b0a89a;
            margin-top: 3px;
          }
          .doc-foot {
            background: #f8f6f1;
            border-top: 2px solid #b8922a;
            padding: 10px 48px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9.5px;
            color: #6b6255;
            letter-spacing: 0.6px;
          }
          .df-gold { color: #8b6e1f; font-weight: 700; }
          .summary-box {
            background: #f8f6f1;
            border: 1px solid #ede9e0;
            border-radius: 7px;
            padding: 12px 16px;
            margin-bottom: 18px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
          }
          .summary-item { text-align: center; }
          .summary-label {
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #6b6255;
          }
          .summary-value {
            font-family: 'Playfair Display', serif;
            font-size: 1.3rem;
            font-weight: 700;
            color: #3a3228;
          }
          .summary-value-gold {
            font-family: 'Playfair Display', serif;
            font-size: 1.45rem;
            font-weight: 700;
            color: #8b6e1f;
          }
          .summary-sub { font-size: 9px; color: #b0a89a; }
        </style>
      </head>
      <body>
        ${docContent}
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

  const fullName = [formData.nombre, formData.apellidos].filter(Boolean).join(' ') || '—';
  const total = calcularTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Cotizaciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Genera cotizaciones profesionales para administración de condominios
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Form Panel */}
        <Card className="h-fit">
          <CardContent className="p-6 space-y-6">
            {/* Datos del Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <User className="w-5 h-5" />
                Datos del Cliente
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre(s)</Label>
                  <Input
                    placeholder="Ej. Miriam"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apellidos</Label>
                  <Input
                    placeholder="Ej. Bretón García"
                    value={formData.apellidos}
                    onChange={(e) => handleInputChange('apellidos', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    WhatsApp
                  </Label>
                  <Input
                    placeholder="442 000 0000"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Correo electrónico
                  </Label>
                  <Input
                    type="email"
                    placeholder="correo@mail.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Cargo / Puesto</Label>
                <Input
                  placeholder="Ej. Presidenta de la mesa directiva"
                  value={formData.cargo}
                  onChange={(e) => handleInputChange('cargo', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Datos del Condominio */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <Building2 className="w-5 h-5" />
                Datos del Condominio
              </h3>
              
              <div className="space-y-2">
                <Label>Nombre del condominio</Label>
                <Input
                  placeholder="Ej. Residencial San Mateo"
                  value={formData.condoNombre}
                  onChange={(e) => handleInputChange('condoNombre', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Domicilio del condominio</Label>
                <Input
                  placeholder="Ej. Av. Principal #100, Corregidora, Qro."
                  value={formData.condoDomicilio}
                  onChange={(e) => handleInputChange('condoDomicilio', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Fecha de inicio del servicio
                </Label>
                <Input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Cuota Mensual */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <DollarSign className="w-5 h-5" />
                Cuota Mensual
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    Cantidad de casas / dpto.
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ej. 120"
                    value={formData.cantidadCasas || ''}
                    onChange={(e) => handleInputChange('cantidadCasas', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio por casa / mes ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Ej. 500"
                    value={formData.precioPorCasa || ''}
                    onChange={(e) => handleInputChange('precioPorCasa', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              {/* Total calculado */}
              <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-primary/80">
                    Total mensual estimado
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Casas × Precio por casa
                  </div>
                </div>
                <div className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#8b6e1f' }}>
                  {formatCurrency(total)}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Nota sobre IVA / facturación</Label>
                <Input
                  value={formData.notaIVA}
                  onChange={(e) => handleInputChange('notaIVA', e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Servicios Incluidos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-5 h-5" />
                Servicios Incluidos
              </h3>
              
              <div className="grid grid-cols-1 gap-2">
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

            {/* Gestión Adicional */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <FileText className="w-5 h-5" />
                Gestión Adicional (personalizable)
              </h3>
              
              <div className="space-y-2">
                <Label>Horario de atención / visitas</Label>
                <Input
                  value={formData.horario}
                  onChange={(e) => handleInputChange('horario', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Actividades de gestión municipal (opcional)</Label>
                <Textarea
                  placeholder="Ej. Trámites de plumas de acceso, donación de áreas verdes, etc. Deja en blanco para omitir esta sección."
                  value={formData.gestionMunicipal}
                  onChange={(e) => handleInputChange('gestionMunicipal', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Nota y Cierre */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <FileText className="w-5 h-5" />
                Nota y Cierre
              </h3>
              
              <div className="space-y-2">
                <Label>Nota sobre la cotización</Label>
                <Textarea
                  value={formData.notaCotizacion}
                  onChange={(e) => handleInputChange('notaCotizacion', e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Párrafo de cierre</Label>
                <Textarea
                  value={formData.parrafoCierre}
                  onChange={(e) => handleInputChange('parrafoCierre', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Firmante y Folio */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <Hash className="w-5 h-5" />
                Firmante y Folio
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del firmante</Label>
                  <Input
                    value={formData.firmanteNombre}
                    onChange={(e) => handleInputChange('firmanteNombre', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo del firmante</Label>
                  <Input
                    value={formData.firmanteCargo}
                    onChange={(e) => handleInputChange('firmanteCargo', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Folio</Label>
                  <Input
                    placeholder="COT-2026-001"
                    value={formData.folio}
                    onChange={(e) => handleInputChange('folio', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de la cotización</Label>
                  <Input
                    type="date"
                    value={formData.fechaCotizacion}
                    onChange={(e) => handleInputChange('fechaCotizacion', e.target.value)}
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
                Vista Previa — Documento Cotización
              </h3>
            </div>
            
            <div 
              ref={docRef}
              className="bg-white shadow-lg rounded-lg overflow-hidden"
              style={{ fontFamily: "'Lato', sans-serif", fontSize: '13px', lineHeight: '1.55', color: '#222' }}
            >
              {/* Header */}
              <div 
                className="px-12 py-5 flex justify-between items-start"
                style={{ borderBottom: '3px solid #b8922a' }}
              >
                <img 
                  src="/logo-felmat-gold.png" 
                  alt="Grupo FELMAT" 
                  className="h-20 w-auto"
                />
                <div className="text-right">
                  <div style={{ fontSize: '9.5px', color: '#6b6255', lineHeight: '1.55' }}>
                    Av. Circuito Puerta del Sol No. 5, Fracc. Puerta Real<br />
                    CP 76910 · Corregidora, Querétaro
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#8b6e1f', fontWeight: 700, marginTop: '4px' }}>
                    442 124 9613 · hola@felmat.com.mx
                  </div>
                </div>
              </div>

              {/* Title Strip */}
              <div 
                className="px-12 py-2.5 flex justify-between items-baseline flex-wrap gap-1.5"
                style={{ background: '#f5edd8', borderBottom: '1px solid #b8922a' }}
              >
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', fontWeight: 700, color: '#3a3228', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cotización — {formData.condoNombre || 'Condominio'}
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b6255' }}>
                    Folio: <strong>{formData.folio || '—'}</strong>
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b6255', textAlign: 'right' }}>
                    {formatDateSpanish(formData.fechaCotizacion)}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-12 py-7">
                {/* Destinatario */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#3a3228' }}>
                    {fullName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b6255' }}>
                    {formData.cargo || '—'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b6255' }}>
                    {formData.condoDomicilio ? `${formData.condoNombre} · ${formData.condoDomicilio}` : formData.condoNombre || '—'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '3px', color: '#3a3228', marginTop: '4px' }}>
                    P R E S E N T E
                  </div>
                </div>

                {/* Price Line */}
                <div 
                  className="flex justify-between items-baseline"
                  style={{ borderBottom: '1px dotted #b0a89a', paddingBottom: '2px', margin: '18px 0 6px' }}
                >
                  <span style={{ fontSize: '13px', color: '#3a3228' }}>
                    Servicios de administración mensual a partir del {formData.fechaInicio ? formatDateShort(formData.fechaInicio) : '—'}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#3a3228', whiteSpace: 'nowrap' }}>
                    {formatCurrency(total)}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#6b6255', marginBottom: '16px', fontStyle: 'italic' }}>
                  {formData.notaIVA ? formData.notaIVA.charAt(0).toUpperCase() + formData.notaIVA.slice(1) + '.' : ''}
                </div>

                <p style={{ fontSize: '12px', marginBottom: '6px' }}>
                  En caso de prolongar nuestros servicios por más de un año, se dará un incremento a la cuota del <strong>10%</strong> a partir de la renovación de nuestro contrato.
                </p>

                {/* Nota */}
                <div 
                  className="my-4 py-2.5 px-3.5"
                  style={{ background: '#f8f6f1', borderLeft: '3px solid #b8922a', fontSize: '11.5px', color: '#3a3228', lineHeight: '1.6' }}
                >
                  <strong>Nota:</strong> {formData.notaCotizacion || '—'}
                </div>

                {/* Summary Box */}
                <div 
                  className="grid grid-cols-3 gap-2 mb-5 p-3 rounded-lg"
                  style={{ background: '#f8f6f1', border: '1px solid #ede9e0' }}
                >
                  <div className="text-center">
                    <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#6b6255' }}>Unidades</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: '#3a3228' }}>
                      {formData.cantidadCasas > 0 ? formData.cantidadCasas : '—'}
                    </div>
                    <div style={{ fontSize: '9px', color: '#b0a89a' }}>casas / dpto.</div>
                  </div>
                  <div className="text-center" style={{ borderLeft: '1px solid #ede9e0', borderRight: '1px solid #ede9e0' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#6b6255' }}>Total mensual</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.45rem', fontWeight: 700, color: '#8b6e1f' }}>
                      {formatCurrency(total)}
                    </div>
                    <div style={{ fontSize: '9px', color: '#b0a89a' }}>MXN / mes</div>
                  </div>
                  <div className="text-center">
                    <div style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#6b6255' }}>Cuota por casa</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: '#3a3228' }}>
                      {formData.precioPorCasa > 0 ? formatCurrency(formData.precioPorCasa) : '—'}
                    </div>
                    <div style={{ fontSize: '9px', color: '#b0a89a' }}>MXN / mes</div>
                  </div>
                </div>

                {/* Gestión Administrativa */}
                <div 
                  className="mt-4 mb-2 pb-1"
                  style={{ fontSize: '12.5px', fontWeight: 700, color: '#3a3228', borderBottom: '1px solid #ede9e0' }}
                >
                  Gestión Administrativa
                </div>
                <ul style={{ listStyle: 'none', padding: '0 0 0 14px', marginBottom: '12px' }}>
                  {formData.selectedServices.map((service, idx) => (
                    <li 
                      key={idx}
                      style={{ position: 'relative', fontSize: '12px', color: '#333', padding: '3px 0 3px 18px', lineHeight: '1.5' }}
                    >
                      <span style={{ position: 'absolute', left: 0, color: '#b8922a', fontSize: '14px', top: '1px' }}>•</span>
                      {service}
                    </li>
                  ))}
                </ul>

                {/* Horario */}
                <p style={{ fontSize: '12px', marginBottom: '4px' }}>
                  <strong>Horario:</strong> {formData.horario || '—'}
                </p>

                {/* Gestión Municipal */}
                {formData.gestionMunicipal.trim() && (
                  <>
                    <div 
                      className="mt-4 mb-2 pb-1"
                      style={{ fontSize: '12.5px', fontWeight: 700, color: '#3a3228', borderBottom: '1px solid #ede9e0' }}
                    >
                      Gestión Municipal
                    </div>
                    <ul style={{ listStyle: 'none', padding: '0 0 0 14px', marginBottom: '12px' }}>
                      {formData.gestionMunicipal.split('\n').filter(l => l.trim()).map((line, idx) => (
                        <li 
                          key={idx}
                          style={{ position: 'relative', fontSize: '12px', color: '#333', padding: '3px 0 3px 18px', lineHeight: '1.5' }}
                        >
                          <span style={{ position: 'absolute', left: 0, color: '#b8922a', fontSize: '14px', top: '1px' }}>•</span>
                          {line.trim()}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* Cierre */}
                <p style={{ fontSize: '12px', color: '#3a3228', margin: '20px 0 22px', lineHeight: '1.65' }}>
                  {formData.parrafoCierre || '—'}
                </p>

                {/* Firma */}
                <div style={{ marginTop: '24px' }}>
                  <div style={{ fontSize: '12px', color: '#6b6255' }}>Atentamente</div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#3a3228', marginTop: '4px' }}>
                    {formData.firmanteNombre || '—'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#6b6255' }}>
                    {formData.firmanteCargo || '—'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b6255', marginTop: '4px' }}>
                    442 124 9613 · hola@felmat.com.mx
                  </div>
                </div>

                {/* Aceptación */}
                <div 
                  className="mt-6 p-3.5 rounded-lg"
                  style={{ border: '1.5px dashed #b0a89a' }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b6255', marginBottom: '10px' }}>
                    ✦ Aceptación y firma del cliente
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div style={{ borderBottom: '1px solid #b0a89a', minHeight: '30px' }}></div>
                      <div style={{ fontSize: '9.5px', color: '#b0a89a', marginTop: '3px' }}>Firma</div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1px solid #b0a89a', minHeight: '30px' }}></div>
                      <div style={{ fontSize: '9.5px', color: '#b0a89a', marginTop: '3px' }}>Nombre completo</div>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1px solid #b0a89a', minHeight: '30px' }}></div>
                      <div style={{ fontSize: '9.5px', color: '#b0a89a', marginTop: '3px' }}>Fecha de aceptación</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div 
                className="px-12 py-2.5 flex justify-between items-center"
                style={{ background: '#f8f6f1', borderTop: '2px solid #b8922a', fontSize: '9.5px', color: '#6b6255', letterSpacing: '0.6px' }}
              >
                <span>Av. Circuito Puerta del Sol No. 5, Fracc. Puerta Real · CP 76910 · Corregidora, Qro.</span>
                <span style={{ color: '#8b6e1f', fontWeight: 700 }}>442 124 9613</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cotizaciones;
