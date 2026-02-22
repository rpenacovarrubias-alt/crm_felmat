// ==========================================
// FACTORES DE HOMOLOGACIÓN Y AJUSTE
// Basado en metodología INDAABIN y SHF
// ==========================================

import { EstadoConservacion, TipoAcabados, TipoPropiedad } from '@/types/estimacion';

// Depreciación por antigüedad (anual)
export const DEPRECIACION_ANUAL = 0.015; // 1.5% anual

// Factor máximo de depreciación (30 años)
export const DEPRECIACION_MAXIMA = 0.45; // 45%

// Factores por estado de conservación
export const FACTOR_CONSERVACION: Record<EstadoConservacion, number> = {
  excelente: 1.0,
  bueno: 0.92,
  regular: 0.80,
  malo: 0.65,
};

// Factores por tipo de acabados
export const FACTOR_ACABADOS: Record<TipoAcabados, number> = {
  economico: 0.85,
  interes_medio: 1.0,
  residencial: 1.15,
  lujo: 1.35,
};

// Valor por amenidad (porcentaje sobre valor base)
export const VALOR_AMENIDADES = {
  alberca: 0.05,           // +5%
  jardin: 0.03,            // +3%
  roofGarden: 0.04,        // +4%
  gimnasio: 0.03,          // +3%
  seguridadPrivada: 0.04,  // +4%
  cisterna: 0.02,          // +2%
  gasEstacionario: 0.015,  // +1.5%
  lineaTelefonica: 0.01,   // +1%
  internet: 0.01,          // +1%
  aireAcondicionado: 0.025,// +2.5%
  calefaccion: 0.02,       // +2%
  terraza: 0.02,           // +2%
  balcon: 0.015,           // +1.5%
  cuartoServicio: 0.02,    // +2%
  cuartoLavado: 0.015,     // +1.5%
  bodega: 0.01,            // +1%
  estudio: 0.02,           // +2%
  familyRoom: 0.025,       // +2.5%
  comedor: 0.015,          // +1.5%
  sala: 0.015,             // +1.5%
  cocinaIntegral: 0.02,    // +2%
  vestidor: 0.015,         // +1.5%
  walkInCloset: 0.01,      // +1%
  chimenea: 0.02,          // +2%
  jacuzzi: 0.03,           // +3%
  sauna: 0.025,            // +2.5%
  asador: 0.02,            // +2%
};

// Factores de ajuste por tipo de propiedad (para comparables)
export const FACTOR_TIPO_PROPIEDAD: Record<TipoPropiedad, number> = {
  casa: 1.0,
  departamento: 0.95,
  terreno: 0.70,
  plaza_comercial: 1.3,
  hotel: 1.5,
  villa: 1.4,
  fraccionamiento: 1.1,
  local: 1.2,
  bodega: 0.80,
  oficina: 1.1,
};

// Rangos de confianza
export const RANGO_CONFIANZA = {
  alta: { min: 0.95, max: 1.05 },    // ±5%
  media: { min: 0.90, max: 1.10 },   // ±10%
  baja: { min: 0.85, max: 1.15 },    // ±15%
};

// Ponderación de factores en el análisis
export const PONDERACION_FACTORES = {
  ubicacion: 0.30,      // 30%
  superficie: 0.25,     // 25%
  antiguedad: 0.15,     // 15%
  conservacion: 0.15,   // 15%
  amenidades: 0.10,     // 10%
  acabados: 0.05,       // 5%
};

// Valores máximos de ajuste por factor
export const MAXIMO_AJUSTE_FACTOR = 0.25; // ±25%

// Distancia máxima para comparables (km)
export const DISTANCIA_MAXIMA_COMPARABLE = 2.0;

// Antigüedad máxima de comparables (meses)
export const ANTIGUEDAD_MAXIMA_COMPARABLE = 12;

// Descripción de metodologías
export const DESCRIPCION_METODOLOGIA = {
  comparativo_mercado: 'Método Comparativo de Mercado: Se analizan propiedades similares recientemente vendidas en la zona, aplicando factores de homologación para ajustar diferencias en características, ubicación y estado.',
  costos: 'Método de Costos: Valor del terreno más costo de reposición de la construcción menos depreciación por antigüedad y estado.',
  rentas: 'Método de Capitalización de Rentas: Valor presente de los beneficios futuros generados por la propiedad mediante arrendamiento.',
};

// Tipos de propiedad para select
export const OPCIONES_TIPO_PROPIEDAD = [
  { value: 'casa', label: 'Casa', icon: 'Home' },
  { value: 'departamento', label: 'Departamento', icon: 'Building' },
  { value: 'terreno', label: 'Terreno', icon: 'Map' },
  { value: 'local', label: 'Local Comercial', icon: 'Store' },
  { value: 'plaza_comercial', label: 'Plaza Comercial', icon: 'ShoppingBag' },
  { value: 'oficina', label: 'Oficina', icon: 'Briefcase' },
  { value: 'bodega', label: 'Bodega/Industrial', icon: 'Warehouse' },
  { value: 'hotel', label: 'Hotel', icon: 'Hotel' },
  { value: 'villa', label: 'Villa/Lujo', icon: 'Castle' },
  { value: 'fraccionamiento', label: 'Fraccionamiento', icon: 'LayoutGrid' },
] as const;

// Estados de conservación para select
export const OPCIONES_ESTADO_CONSERVACION = [
  { value: 'excelente', label: 'Excelente', description: 'Recién remodelado, acabados premium', factor: 1.0, color: 'green' },
  { value: 'bueno', label: 'Bueno', description: 'Bien mantenido, sin reparaciones mayores', factor: 0.92, color: 'blue' },
  { value: 'regular', label: 'Regular', description: 'Desgaste normal, requiere mantenimiento', factor: 0.80, color: 'yellow' },
  { value: 'malo', label: 'Malo', description: 'Reparaciones mayores necesarias', factor: 0.65, color: 'red' },
] as const;

// Tipos de acabados para select
export const OPCIONES_TIPO_ACABADOS = [
  { value: 'economico', label: 'Económico', description: 'Acabados básicos', factor: 0.85 },
  { value: 'interes_medio', label: 'Interés Medio', description: 'Acabados estándar de calidad', factor: 1.0 },
  { value: 'residencial', label: 'Residencial', description: 'Acabados de alta calidad', factor: 1.15 },
  { value: 'lujo', label: 'Lujo', description: 'Acabados premium y materiales importados', factor: 1.35 },
] as const;
