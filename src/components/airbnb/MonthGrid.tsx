// ============================================
// GRID DE MES REUTILIZABLE (Calendario / Precios Airbnb)
// ============================================

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function MonthGrid({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  renderDay,
}: {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  renderDay: (dateStr: string, day: number) => React.ReactNode;
}) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // lunes=0 ... domingo=6
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={onPrevMonth}><ChevronLeft className="w-4 h-4" /></Button>
        <h3 className="font-semibold">{MESES[month]} {year}</h3>
        <Button variant="outline" size="icon" onClick={onNextMonth}><ChevronRight className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
        {DIAS_SEMANA.map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => (
          <div key={i} className="min-h-[64px]">
            {day !== null && renderDay(toDateStr(year, month, day), day)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MonthGrid;
