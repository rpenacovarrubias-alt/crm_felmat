// ==========================================
// MOTOR DE CÁLCULO DE VALUACIÓN
// ==========================================

import { 
  EstimacionValuacion, 
  Comparable, 
  ResultadoEstimacion, 
  FactorAjuste,
  AjusteComparable,
  TipoPropiedad 
} from '@/types/estimacion';
import { 
  DEPRECIACION_ANUAL, 
  DEPRECIACION_MAXIMA,
  FACTOR_CONSERVACION, 
  FACTOR_ACABADOS, 
  VALOR_AMENIDADES,
  RANGO_CONFIANZA,
  DISTANCIA_MAXIMA_COMPARABLE,
  DESCRIPCION_METODOLOGIA 
} from './factores';

/**
 * Calcula la depreciación por antigüedad
 */
export function calcularDepreciacion(antiguedad: number): number {
  const depreciacion = Math.min(antiguedad * DEPRECIACION_ANUAL, DEPRECIACION_MAXIMA);
  return depreciacion;
}

/**
 * Calcula el factor de ajuste por amenidades
 */
export function calcularFactorAmenidades(amenidades: Record<string, boolean>): number {
  let factorTotal = 0;
  
  Object.entries(amenidades).forEach(([key, value]) => {
    if (value && key in VALOR_AMENIDADES) {
      factorTotal += VALOR_AMENIDADES[key as keyof typeof VALOR_AMENIDADES];
    }
  });
  
  // Limitar el factor máximo de amenidades a 35%
  return Math.min(factorTotal, 0.35);
}

/**
 * Calcula el valor de una propiedad basado en sus características
 */
export function calcularValorBase(
  superficieConstruccion: number,
  precioMetroCuadrado: number,
  antiguedad: number,
  estadoConservacion: 'excelente' | 'bueno' | 'regular' | 'malo',
  tipoAcabados: 'economico' | 'interes_medio' | 'residencial' | 'lujo',
  amenidades: Record<string, boolean>
): number {
  // Valor base sin ajustes
  const valorBase = superficieConstruccion * precioMetroCuadrado;
  
  // Aplicar depreciación por antigüedad
  const depreciacion = calcularDepreciacion(antiguedad);
  const factorAntiguedad = 1 - depreciacion;
  
  // Factor por estado de conservación
  const factorConservacion = FACTOR_CONSERVACION[estadoConservacion];
  
  // Factor por tipo de acabados
  const factorAcabados = FACTOR_ACABADOS[tipoAcabados];
  
  // Factor por amenidades
  const factorAmenidades = 1 + calcularFactorAmenidades(amenidades);
  
  // Calcular valor ajustado
  const valorAjustado = valorBase * 
    factorAntiguedad * 
    factorConservacion * 
    factorAcabados * 
    factorAmenidades;
  
  return Math.round(valorAjustado);
}

/**
 * Genera ajustes para un comparable
 */
export function generarAjustesComparable(
  comparable: Comparable,
  propiedadObjetivo: {
    superficieConstruccion: number;
    antiguedad: number;
    estadoConservacion: string;
    recamaras?: number;
    banos?: number;
    estacionamientos?: number;
  }
): AjusteComparable[] {
  const ajustes: AjusteComparable[] = [];
  
  // Ajuste por superficie (diferencia mayor a 10%)
  const diffSuperficie = (comparable.superficieConstruccion - propiedadObjetivo.superficieConstruccion) / 
    propiedadObjetivo.superficieConstruccion;
  
  if (Math.abs(diffSuperficie) > 0.10) {
    const ajusteSuperficie = -diffSuperficie * 0.5; // 50% de la diferencia
    ajustes.push({
      factor: 'superficie',
      descripcion: `Diferencia de superficie: ${(diffSuperficie * 100).toFixed(1)}%`,
      porcentaje: ajusteSuperficie,
      montoAjuste: comparable.precioVenta * ajusteSuperficie
    });
  }
  
  // Ajuste por antigüedad
  const diffAntiguedad = comparable.antiguedad - propiedadObjetivo.antiguedad;
  if (Math.abs(diffAntiguedad) > 2) {
    const ajusteAntiguedad = diffAntiguedad * DEPRECIACION_ANUAL;
    ajustes.push({
      factor: 'antiguedad',
      descripcion: `Diferencia de antigüedad: ${diffAntiguedad} años`,
      porcentaje: ajusteAntiguedad,
      montoAjuste: comparable.precioVenta * ajusteAntiguedad
    });
  }
  
  // Ajuste por estado de conservación
  const estados = ['malo', 'regular', 'bueno', 'excelente'];
  const idxComparable = estados.indexOf(comparable.estadoConservacion);
  const idxObjetivo = estados.indexOf(propiedadObjetivo.estadoConservacion);
  const diffConservacion = idxComparable - idxObjetivo;
  
  if (diffConservacion !== 0) {
    const factorConservacion = diffConservacion * 0.08; // 8% por nivel
    ajustes.push({
      factor: 'conservacion',
      descripcion: `Diferencia en conservación: ${diffConservacion} niveles`,
      porcentaje: factorConservacion,
      montoAjuste: comparable.precioVenta * factorConservacion
    });
  }
  
  // Ajuste por recámaras
  if (comparable.recamaras && propiedadObjetivo.recamaras && 
      Math.abs(comparable.recamaras - propiedadObjetivo.recamaras) > 0) {
    const diffRecamaras = comparable.recamaras - propiedadObjetivo.recamaras;
    const ajusteRecamaras = -diffRecamaras * 0.05; // 5% por recámara
    ajustes.push({
      factor: 'recamaras',
      descripcion: `Diferencia de recámaras: ${diffRecamaras}`,
      porcentaje: ajusteRecamaras,
      montoAjuste: comparable.precioVenta * ajusteRecamaras
    });
  }
  
  // Ajuste por baños
  if (comparable.banos && propiedadObjetivo.banos && 
      Math.abs(comparable.banos - propiedadObjetivo.banos) > 0) {
    const diffBanos = comparable.banos - propiedadObjetivo.banos;
    const ajusteBanos = -diffBanos * 0.04; // 4% por baño
    ajustes.push({
      factor: 'banos',
      descripcion: `Diferencia de baños: ${diffBanos}`,
      porcentaje: ajusteBanos,
      montoAjuste: comparable.precioVenta * ajusteBanos
    });
  }
  
  // Ajuste por estacionamientos
  if (comparable.estacionamientos && propiedadObjetivo.estacionamientos && 
      Math.abs(comparable.estacionamientos - propiedadObjetivo.estacionamientos) > 0) {
    const diffEst = comparable.estacionamientos - propiedadObjetivo.estacionamientos;
    const ajusteEst = -diffEst * 0.03; // 3% por cajón
    ajustes.push({
      factor: 'estacionamiento',
      descripcion: `Diferencia de estacionamientos: ${diffEst}`,
      porcentaje: ajusteEst,
      montoAjuste: comparable.precioVenta * ajusteEst
    });
  }
  
  return ajustes;
}

/**
 * Calcula el precio ajustado de un comparable
 */
export function calcularPrecioAjustado(comparable: Comparable): number {
  const totalAjustes = comparable.ajustes.reduce((sum, ajuste) => sum + ajuste.montoAjuste, 0);
  return comparable.precioVenta + totalAjustes;
}

/**
 * Calcula el promedio ponderado de comparables
 */
export function calcularPromedioPonderado(comparables: Comparable[]): number {
  if (comparables.length === 0) return 0;
  
  let sumaPonderada = 0;
  let sumaPesos = 0;
  
  comparables.forEach(comp => {
    const peso = comp.similitud / 100; // Convertir a decimal
    const precioAjustado = calcularPrecioAjustado(comp);
    const precioPorM2 = precioAjustado / comp.superficieConstruccion;
    
    sumaPonderada += precioPorM2 * peso;
    sumaPesos += peso;
  });
  
  return sumaPesos > 0 ? sumaPonderada / sumaPesos : 0;
}

/**
 * Determina el nivel de confianza basado en la calidad de comparables
 */
export function determinarConfianza(comparables: Comparable[]): 'alta' | 'media' | 'baja' {
  if (comparables.length < 3) return 'baja';
  
  const promedioSimilitud = comparables.reduce((sum, c) => sum + c.similitud, 0) / comparables.length;
  const comparablesRecientes = comparables.filter(c => {
    const meses = (Date.now() - new Date(c.fechaVenta).getTime()) / (1000 * 60 * 60 * 24 * 30);
    return meses <= 6;
  }).length;
  
  if (promedioSimilitud >= 85 && comparablesRecientes >= 3) return 'alta';
  if (promedioSimilitud >= 70 && comparablesRecientes >= 2) return 'media';
  return 'baja';
}

/**
 * Genera factores de ajuste para el reporte
 */
export function generarFactoresAjuste(
  antiguedad: number,
  estadoConservacion: 'excelente' | 'bueno' | 'regular' | 'malo',
  tipoAcabados: 'economico' | 'interes_medio' | 'residencial' | 'lujo',
  amenidades: Record<string, boolean>
): FactorAjuste[] {
  const factores: FactorAjuste[] = [];
  
  // Depreciación por antigüedad
  const depreciacion = calcularDepreciacion(antiguedad);
  factores.push({
    factor: 'Antigüedad',
    descripcion: `${antiguedad} años de construcción`,
    impactoPorcentaje: -depreciacion * 100,
    montoAjuste: 0 // Se calcula después
  });
  
  // Estado de conservación
  const factorConservacion = FACTOR_CONSERVACION[estadoConservacion];
  const impactoConservacion = (factorConservacion - 1) * 100;
  factores.push({
    factor: 'Estado de Conservación',
    descripcion: `Propiedad en estado ${estadoConservacion}`,
    impactoPorcentaje: impactoConservacion,
    montoAjuste: 0
  });
  
  // Tipo de acabados
  const factorAcabados = FACTOR_ACABADOS[tipoAcabados];
  const impactoAcabados = (factorAcabados - 1) * 100;
  factores.push({
    factor: 'Acabados',
    descripcion: `Nivel ${tipoAcabados}`,
    impactoPorcentaje: impactoAcabados,
    montoAjuste: 0
  });
  
  // Amenidades
  const factorAmenidades = calcularFactorAmenidades(amenidades);
  const impactoAmenidades = factorAmenidades * 100;
  const amenidadesActivas = Object.entries(amenidades).filter(([_, v]) => v).map(([k]) => k).join(', ');
  factores.push({
    factor: 'Amenidades',
    descripcion: amenidadesActivas || 'Sin amenidades adicionales',
    impactoPorcentaje: impactoAmenidades,
    montoAjuste: 0
  });
  
  return factores;
}

/**
 * Función principal: Realiza el análisis completo de valuación
 */
export function realizarValuacion(
  estimacion: EstimacionValuacion,
  comparables: Comparable[]
): ResultadoEstimacion {
  // Filtrar comparables válidos
  const comparablesValidos = comparables.filter(c => 
    c.distanciaKm <= DISTANCIA_MAXIMA_COMPARABLE &&
    c.similitud >= 60
  );
  
  if (comparablesValidos.length === 0) {
    throw new Error('No se encontraron comparables válidos para el análisis');
  }
  
  // Generar ajustes para cada comparable
  const comparablesConAjustes = comparablesValidos.map(comp => {
    const ajustes = generarAjustesComparable(comp, {
      superficieConstruccion: estimacion.dimensiones.superficieConstruccion,
      antiguedad: estimacion.caracteristicas.antiguedad,
      estadoConservacion: estimacion.estadoConservacion,
      recamaras: estimacion.caracteristicas.recamaras,
      banos: estimacion.caracteristicas.banos,
      estacionamientos: estimacion.caracteristicas.estacionamientos,
    });
    
    return {
      ...comp,
      ajustes
    };
  });
  
  // Calcular precio promedio ponderado por m²
  const promedioPorM2 = calcularPromedioPonderado(comparablesConAjustes);
  
  // Calcular valor estimado
  const valorEstimado = Math.round(promedioPorM2 * estimacion.dimensiones.superficieConstruccion);
  
  // Determinar confianza
  const confianza = determinarConfianza(comparablesConAjustes);
  
  // Calcular rango
  const rango = RANGO_CONFIANZA[confianza];
  const rangoMinimo = Math.round(valorEstimado * rango.min);
  const rangoMaximo = Math.round(valorEstimado * rango.max);
  
  // Generar factores de ajuste
  const factoresAjuste = generarFactoresAjuste(
    estimacion.caracteristicas.antiguedad,
    estimacion.estadoConservacion,
    estimacion.tipoAcabados,
    estimacion.amenidades
  );
  
  // Calcular montos de ajuste basados en el valor estimado
  factoresAjuste.forEach(factor => {
    factor.montoAjuste = Math.round(valorEstimado * (factor.impactoPorcentaje / 100));
  });
  
  return {
    valorEstimado,
    rangoMinimo,
    rangoMaximo,
    precioPorMetroCuadrado: Math.round(promedioPorM2),
    precioPorMetroCuadradoTerreno: estimacion.dimensiones.superficieTerreno > 0 
      ? Math.round(valorEstimado / estimacion.dimensiones.superficieTerreno)
      : undefined,
    comparables: comparablesConAjustes,
    factoresAjuste,
    confianza,
    metodologia: DESCRIPCION_METODOLOGIA.comparativo_mercado,
    fechaCalculo: new Date(),
  };
}

/**
 * Formatea un valor monetario
 */
export function formatearPrecio(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

/**
 * Formatea un número con separadores de miles
 */
export function formatearNumero(valor: number): string {
  return new Intl.NumberFormat('es-MX').format(valor);
}
