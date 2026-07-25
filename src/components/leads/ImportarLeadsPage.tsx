// ============================================
// IMPORTAR LEADS (pegar CSV: nombre, email, telefono)
// ============================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLeads, notify } from '@/hooks/useDatabase';
import type { LeadSource } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const FUENTES: { value: LeadSource; label: string }[] = [
  { value: 'referido', label: 'Referido' },
  { value: 'sitio_web', label: 'Sitio Web' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'inmuebles24', label: 'Inmuebles24' },
  { value: 'lamudi', label: 'Lamudi' },
  { value: 'otro', label: 'Otro' },
];

interface FilaImportada {
  nombre: string;
  email: string;
  telefono: string;
  valido: boolean;
}

function parseCSV(texto: string): FilaImportada[] {
  return texto
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(linea => {
      const [nombre = '', email = '', telefono = ''] = linea.split(',').map(c => c.trim());
      return { nombre, email, telefono, valido: !!nombre && !!email };
    });
}

export function ImportarLeadsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { create } = useLeads(user?.id);
  const [texto, setTexto] = useState('');
  const [fuente, setFuente] = useState<LeadSource>('referido');
  const [importando, setImportando] = useState(false);

  const filas = useMemo(() => parseCSV(texto), [texto]);
  const validas = filas.filter(f => f.valido);

  const handleImportar = async () => {
    if (!user || validas.length === 0) return;
    setImportando(true);
    let creados = 0;
    for (const fila of validas) {
      await create({
        name: fila.nombre,
        email: fila.email,
        phone: fila.telefono,
        source: fuente,
        status: 'nuevo',
        assignedTo: user.id,
        pipelineStage: 'nuevo',
        score: 0,
      });
      creados++;
    }
    setImportando(false);
    if (creados > 0) {
      await notify(user.id, {
        title: 'Leads importados',
        message: `${creados} lead${creados !== 1 ? 's' : ''} importado${creados !== 1 ? 's' : ''} desde CSV`,
        type: 'info',
      });
    }
    toast.success(`${creados} lead${creados !== 1 ? 's' : ''} importado${creados !== 1 ? 's' : ''}`);
    navigate('/leads');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importar Leads</h1>
          <p className="text-muted-foreground text-sm">Pega una lista con formato: nombre, email, teléfono (uno por línea)</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos a importar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={'Juan Pérez, juan@example.com, 4421234567\nMaría López, maria@example.com, 4429876543'}
            rows={10}
            className="font-mono text-sm"
          />
          <div className="space-y-1.5 max-w-xs">
            <Label>Origen para todos los leads importados</Label>
            <Select value={fuente} onValueChange={(v) => setFuente(v as LeadSource)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FUENTES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Vista previa
              <Badge variant="secondary">{validas.length} de {filas.length} válidos</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((f, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {f.valido
                        ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                        : <AlertCircle className="w-4 h-4 text-destructive" />}
                    </TableCell>
                    <TableCell>{f.nombre || '—'}</TableCell>
                    <TableCell>{f.email || '—'}</TableCell>
                    <TableCell>{f.telefono || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/leads')}>Cancelar</Button>
        <Button onClick={handleImportar} disabled={validas.length === 0 || importando}>
          <Upload className="w-4 h-4 mr-2" />
          {importando ? 'Importando...' : `Importar ${validas.length || ''} lead${validas.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}

export default ImportarLeadsPage;
