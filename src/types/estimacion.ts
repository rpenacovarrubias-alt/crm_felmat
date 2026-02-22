// ==========================================
// TIPOS PARA MÓDULO DE ESTIMACIONES
// ==========================================

export type TipoPropiedad = 
  | 'casa' 
  | 'departamento' 
  | 'terreno' 
  | 'plaza_comercial' 
  | 'hotel' 
  | 'villa' 
  | 'fraccionamiento'
  | 'local'
  | 'bodega'
  | 'oficina';

export type EstadoConservacion = 'excelente' | 'bueno' | 'regular' | 'malo';
export type TipoAcabados = 'economico' | 'interes_medio' | 'residencial' | 'lujo';

export interface UbicacionEstimacion {
  direccion: string;
  codigoPostal: string;
  colonia: string;
  ciudad: string;
  estado: string;
  latitud?: number;
  longitud?: number;
  referencias?: string;
}

export interface Dimensiones {
  superficieTerreno: number; // m²
  superficieConstruccion: number; // m²
  frente?: number; // metros
  fondo?: number; // metros
}

export interface CaracteristicasFisicas {
  antiguedad: number; // años
  recamaras?: number;
  banos?: number;
  mediosBanos?: number;
  estacionamientos?: number;
  niveles?: number;
}

export interface Amenidades {
  alberca: boolean;
  jardin: boolean;
  roofGarden: boolean;
  gimnasio: boolean;
  seguridadPrivada: boolean;
  cisterna: boolean;
  gasEstacionario: boolean;
  lineaTelefonica: boolean;
  internet: boolean;
  aireAcondicionado: boolean;
  calefaccion: boolean;
  terraza: boolean;
  balcon: boolean;
  cuartoServicio: boolean;
  cuartoLavado: boolean;
  bodega: boolean;
  estudio: boolean;
  familyRoom: boolean;
  comedor: boolean;
  sala: boolean;
  cocinaIntegral: boolean;
  vestidor: boolean;
  walkInCloset: boolean;
  chimenea: boolean;
  jacuzzi: boolean;
  sauna: boolean;
  asador: boolean;
}

export interface ValorCatastral {
  valorTerreno: number;
  valorConstruccion: number;
  valorTotal: number;
  claveCatastral?: string;
  ultimaActualizacion?: Date;
}

export interface FotoEstimacion {
  id: string;
  url: string;
  descripcion?: string;
  esPrincipal: boolean;
  orden: number;
}

export interface Comparable {
  id: string;
  direccion: string;
  colonia: string;
  precioVenta: number;
  superficieConstruccion: number;
  superficieTerreno?: number;
  precioPorMetroCuadrado: number;
  antiguedad: number;
  estadoConservacion: EstadoConservacion;
  recamaras?: number;
  banos?: number;
  estacionamientos?: number;
  distanciaKm: number;
  fechaVenta: Date;
  fuente: 'interna' | 'portal' | 'manual';
  similitud: number; // 0-100%
  ajustes: AjusteComparable[];
  precioAjustado: number;
}

export interface AjusteComparable {
  factor: string;
  descripcion: string;
  porcentaje: number; // -20 a +20
  montoAjuste: number;
}

export interface FactorAjuste {
  factor: string;
  descripcion: string;
  impactoPorcentaje: number;
  montoAjuste: number;
}

export interface ResultadoEstimacion {
  valorEstimado: number;
  rangoMinimo: number;
  rangoMaximo: number;
  precioPorMetroCuadrado: number;
  precioPorMetroCuadradoTerreno?: number;
  comparables: Comparable[];
  factoresAjuste: FactorAjuste[];
  confianza: 'alta' | 'media' | 'baja';
  metodologia: string;
  fechaCalculo: Date;
}

export interface EstimacionValuacion {
  id: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  usuarioId: string;
  propiedadId?: string; // Si viene de ficha existente
  
  // Identificación
  titulo: string;
  tipoPropiedad: TipoPropiedad;
  
  // Ubicación
  ubicacion: UbicacionEstimacion;
  
  // Dimensiones
  dimensiones: Dimensiones;
  
  // Características
  caracteristicas: CaracteristicasFisicas;
  
  // Estado y calidad
  estadoConservacion: EstadoConservacion;
  tipoAcabados: TipoAcabados;
  
  // Amenidades
  amenidades: Amenidades;
  
  // Valor catastral
  valorCatastral?: ValorCatastral;
  
  // Fotos
  fotos: FotoEstimacion[];
  
  // Observaciones
  observaciones?: string;
  
  // Resultado (se calcula)
  resultado?: ResultadoEstimacion;
  
  // Estado
  estado: 'borrador' | 'completada' | 'compartida';
}

// Datos para el formulario de creación/edición
export interface EstimacionFormData {
  titulo: string;
  tipoPropiedad: TipoPropiedad;
  ubicacion: Partial<UbicacionEstimacion>;
  dimensiones: Partial<Dimensiones>;
  caracteristicas: Partial<CaracteristicasFisicas>;
  estadoConservacion: EstadoConservacion;
  tipoAcabados: TipoAcabados;
  amenidades: Partial<Amenidades>;
  valorCatastral?: Partial<ValorCatastral>;
  observaciones?: string;
}
