// ==========================================
// HOOK DE GESTIÓN DE ESTIMACIONES
// ==========================================

import { useState, useCallback, useEffect } from 'react';
import { 
  EstimacionValuacion, 
  EstimacionFormData, 
  Comparable, 
  ResultadoEstimacion,
  FotoEstimacion,
  TipoPropiedad 
} from '@/types/estimacion';
import { realizarValuacion } from '@/lib/valuacion/calculadora';
import { useToast } from '@/hooks/use-toast';

const ESTIMACIONES_STORAGE_KEY = 'felmat_estimaciones';

// Datos demo de comparables (simulando base de datos)
const DEMO_COMPARABLES: Comparable[] = [
  {
    id: 'comp-1',
    direccion: 'Av. Revolución 123, Col. Centro',
    colonia: 'Centro',
    precioVenta: 3500000,
    superficieConstruccion: 120,
    superficieTerreno: 150,
    precioPorMetroCuadrado: 29167,
    antiguedad: 8,
    estadoConservacion: 'bueno',
    recamaras: 3,
    banos: 2,
    estacionamientos: 2,
    distanciaKm: 0.5,
    fechaVenta: new Date('2024-01-15'),
    fuente: 'interna',
    similitud: 85,
    ajustes: [],
    precioAjustado: 3500000,
  },
  {
    id: 'comp-2',
    direccion: 'Calle Hidalgo 456, Col. Centro',
    colonia: 'Centro',
    precioVenta: 3200000,
    superficieConstruccion: 110,
    superficieTerreno: 140,
    precioPorMetroCuadrado: 29091,
    antiguedad: 12,
    estadoConservacion: 'regular',
    recamaras: 3,
    banos: 1.5,
    estacionamientos: 1,
    distanciaKm: 0.8,
    fechaVenta: new Date('2024-02-01'),
    fuente: 'portal',
    similitud: 78,
    ajustes: [],
    precioAjustado: 3200000,
  },
  {
    id: 'comp-3',
    direccion: 'Av. Juárez 789, Col. Centro',
    colonia: 'Centro',
    precioVenta: 3800000,
    superficieConstruccion: 130,
    superficieTerreno: 160,
    precioPorMetroCuadrado: 29231,
    antiguedad: 5,
    estadoConservacion: 'excelente',
    recamaras: 3,
    banos: 2.5,
    estacionamientos: 2,
    distanciaKm: 1.2,
    fechaVenta: new Date('2024-01-20'),
    fuente: 'interna',
    similitud: 82,
    ajustes: [],
    precioAjustado: 3800000,
  },
  {
    id: 'comp-4',
    direccion: 'Calle Morelos 234, Col. Centro',
    colonia: 'Centro',
    precioVenta: 3100000,
    superficieConstruccion: 105,
    superficieTerreno: 130,
    precioPorMetroCuadrado: 29524,
    antiguedad: 15,
    estadoConservacion: 'regular',
    recamaras: 2,
    banos: 2,
    estacionamientos: 1,
    distanciaKm: 1.5,
    fechaVenta: new Date('2023-12-10'),
    fuente: 'portal',
    similitud: 70,
    ajustes: [],
    precioAjustado: 3100000,
  },
  {
    id: 'comp-5',
    direccion: 'Av. Madero 567, Col. Centro',
    colonia: 'Centro',
    precioVenta: 4200000,
    superficieConstruccion: 140,
    superficieTerreno: 180,
    precioPorMetroCuadrado: 30000,
    antiguedad: 3,
    estadoConservacion: 'excelente',
    recamaras: 4,
    banos: 3,
    estacionamientos: 2,
    distanciaKm: 0.3,
    fechaVenta: new Date('2024-02-15'),
    fuente: 'interna',
    similitud: 88,
    ajustes: [],
    precioAjustado: 4200000,
  },
];

export function useEstimaciones() {
  const [estimaciones, setEstimaciones] = useState<EstimacionValuacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Cargar estimaciones del localStorage
  useEffect(() => {
    const stored = localStorage.getItem(ESTIMACIONES_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convertir fechas de string a Date
        const estimacionesConFechas = parsed.map((e: any) => ({
          ...e,
          fechaCreacion: new Date(e.fechaCreacion),
          fechaActualizacion: new Date(e.fechaActualizacion),
          resultado: e.resultado ? {
            ...e.resultado,
            fechaCalculo: new Date(e.resultado.fechaCalculo),
            comparables: e.resultado.comparables.map((c: any) => ({
              ...c,
              fechaVenta: new Date(c.fechaVenta),
            })),
          } : undefined,
        }));
        setEstimaciones(estimacionesConFechas);
      } catch {
        localStorage.removeItem(ESTIMACIONES_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Guardar en localStorage cuando cambien
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(ESTIMACIONES_STORAGE_KEY, JSON.stringify(estimaciones));
    }
  }, [estimaciones, isLoading]);

  // Crear nueva estimación
  const crearEstimacion = useCallback((formData: EstimacionFormData, usuarioId: string): EstimacionValuacion => {
    const nuevaEstimacion: EstimacionValuacion = {
      id: crypto.randomUUID(),
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
      usuarioId,
      titulo: formData.titulo || 'Estimación sin título',
      tipoPropiedad: formData.tipoPropiedad,
      ubicacion: {
        direccion: formData.ubicacion.direccion || '',
        codigoPostal: formData.ubicacion.codigoPostal || '',
        colonia: formData.ubicacion.colonia || '',
        ciudad: formData.ubicacion.ciudad || '',
        estado: formData.ubicacion.estado || '',
        latitud: formData.ubicacion.latitud,
        longitud: formData.ubicacion.longitud,
      },
      dimensiones: {
        superficieTerreno: formData.dimensiones.superficieTerreno || 0,
        superficieConstruccion: formData.dimensiones.superficieConstruccion || 0,
        frente: formData.dimensiones.frente,
        fondo: formData.dimensiones.fondo,
      },
      caracteristicas: {
        antiguedad: formData.caracteristicas.antiguedad || 0,
        recamaras: formData.caracteristicas.recamaras,
        banos: formData.caracteristicas.banos,
        mediosBanos: formData.caracteristicas.mediosBanos,
        estacionamientos: formData.caracteristicas.estacionamientos,
        niveles: formData.caracteristicas.niveles,
      },
      estadoConservacion: formData.estadoConservacion,
      tipoAcabados: formData.tipoAcabados,
      amenidades: {
        alberca: formData.amenidades.alberca || false,
        jardin: formData.amenidades.jardin || false,
        roofGarden: formData.amenidades.roofGarden || false,
        gimnasio: formData.amenidades.gimnasio || false,
        seguridadPrivada: formData.amenidades.seguridadPrivada || false,
        cisterna: formData.amenidades.cisterna || false,
        gasEstacionario: formData.amenidades.gasEstacionario || false,
        lineaTelefonica: formData.amenidades.lineaTelefonica || false,
        internet: formData.amenidades.internet || false,
        aireAcondicionado: formData.amenidades.aireAcondicionado || false,
        calefaccion: formData.amenidades.calefaccion || false,
        terraza: formData.amenidades.terraza || false,
        balcon: formData.amenidades.balcon || false,
        cuartoServicio: formData.amenidades.cuartoServicio || false,
        cuartoLavado: formData.amenidades.cuartoLavado || false,
        bodega: formData.amenidades.bodega || false,
        estudio: formData.amenidades.estudio || false,
        familyRoom: formData.amenidades.familyRoom || false,
        comedor: formData.amenidades.comedor || false,
        sala: formData.amenidades.sala || false,
        cocinaIntegral: formData.amenidades.cocinaIntegral || false,
        vestidor: formData.amenidades.vestidor || false,
        walkInCloset: formData.amenidades.walkInCloset || false,
        chimenea: formData.amenidades.chimenea || false,
        jacuzzi: formData.amenidades.jacuzzi || false,
        sauna: formData.amenidades.sauna || false,
        asador: formData.amenidades.asador || false,
      },
      valorCatastral: formData.valorCatastral ? {
        valorTerreno: formData.valorCatastral.valorTerreno || 0,
        valorConstruccion: formData.valorCatastral.valorConstruccion || 0,
        valorTotal: formData.valorCatastral.valorTotal || 0,
        claveCatastral: formData.valorCatastral.claveCatastral,
      } : undefined,
      fotos: [],
      observaciones: formData.observaciones,
      estado: 'borrador',
    };

    setEstimaciones(prev => [nuevaEstimacion, ...prev]);
    
    toast({
      title: '✅ Estimación creada',
      description: 'La estimación ha sido guardada correctamente.',
    });

    return nuevaEstimacion;
  }, [toast]);

  // Actualizar estimación
  const actualizarEstimacion = useCallback((id: string, updates: Partial<EstimacionValuacion>) => {
    setEstimaciones(prev => prev.map(e => 
      e.id === id 
        ? { ...e, ...updates, fechaActualizacion: new Date() }
        : e
    ));
  }, []);

  // Eliminar estimación
  const eliminarEstimacion = useCallback((id: string) => {
    setEstimaciones(prev => prev.filter(e => e.id !== id));
    toast({
      title: '✅ Estimación eliminada',
      description: 'La estimación ha sido eliminada correctamente.',
    });
  }, [toast]);

  // Buscar comparables (simulado - en producción sería una API)
  const buscarComparables = useCallback((
    tipoPropiedad: TipoPropiedad,
    codigoPostal: string,
    superficieConstruccion: number
  ): Comparable[] => {
    // Filtrar comparables por tipo y zona (simulado)
    const comparablesFiltrados = DEMO_COMPARABLES.filter(c => {
      const diffSuperficie = Math.abs(c.superficieConstruccion - superficieConstruccion) / superficieConstruccion;
      return diffSuperficie <= 0.30; // Máximo 30% de diferencia en superficie
    });

    // Calcular similitud basada en superficie
    return comparablesFiltrados.map(c => {
      const diffSuperficie = Math.abs(c.superficieConstruccion - superficieConstruccion) / superficieConstruccion;
      const similitud = Math.round((1 - diffSuperficie) * 100);
      return { ...c, similitud };
    }).sort((a, b) => b.similitud - a.similitud);
  }, []);

  // Ejecutar análisis de valuación
  const ejecutarValuacion = useCallback((estimacionId: string): ResultadoEstimacion => {
    const estimacion = estimaciones.find(e => e.id === estimacionId);
    if (!estimacion) {
      throw new Error('Estimación no encontrada');
    }

    // Buscar comparables
    const comparables = buscarComparables(
      estimacion.tipoPropiedad,
      estimacion.ubicacion.codigoPostal,
      estimacion.dimensiones.superficieConstruccion
    );

    if (comparables.length === 0) {
      throw new Error('No se encontraron comparables para el análisis');
    }

    // Realizar cálculo
    const resultado = realizarValuacion(estimacion, comparables);

    // Actualizar estimación con resultado
    actualizarEstimacion(estimacionId, { 
      resultado,
      estado: 'completada',
    });

    toast({
      title: '✅ Valuación completada',
      description: `Valor estimado: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(resultado.valorEstimado)}`,
    });

    return resultado;
  }, [estimaciones, buscarComparables, actualizarEstimacion, toast]);

  // Agregar foto a estimación
  const agregarFoto = useCallback((estimacionId: string, url: string, descripcion?: string) => {
    const nuevaFoto: FotoEstimacion = {
      id: crypto.randomUUID(),
      url,
      descripcion,
      esPrincipal: false,
      orden: 0,
    };

    setEstimaciones(prev => prev.map(e => {
      if (e.id === estimacionId) {
        const fotos = [...e.fotos, nuevaFoto];
        // Actualizar orden
        fotos.forEach((f, idx) => { f.orden = idx; });
        return { ...e, fotos };
      }
      return e;
    }));
  }, []);

  // Eliminar foto
  const eliminarFoto = useCallback((estimacionId: string, fotoId: string) => {
    setEstimaciones(prev => prev.map(e => {
      if (e.id === estimacionId) {
        const fotos = e.fotos.filter(f => f.id !== fotoId);
        // Reordenar
        fotos.forEach((f, idx) => { f.orden = idx; });
        return { ...e, fotos };
      }
      return e;
    }));
  }, []);

  // Establecer foto principal
  const setFotoPrincipal = useCallback((estimacionId: string, fotoId: string) => {
    setEstimaciones(prev => prev.map(e => {
      if (e.id === estimacionId) {
        const fotos = e.fotos.map(f => ({
          ...f,
          esPrincipal: f.id === fotoId,
        }));
        return { ...e, fotos };
      }
      return e;
    }));
  }, []);

  // Obtener estimación por ID
  const getEstimacion = useCallback((id: string): EstimacionValuacion | undefined => {
    return estimaciones.find(e => e.id === id);
  }, [estimaciones]);

  // Obtener estimaciones por usuario
  const getEstimacionesByUsuario = useCallback((usuarioId: string): EstimacionValuacion[] => {
    return estimaciones.filter(e => e.usuarioId === usuarioId);
  }, [estimaciones]);

  // Duplicar estimación (para crear desde existente)
  const duplicarEstimacion = useCallback((id: string, usuarioId: string): EstimacionValuacion => {
    const original = estimaciones.find(e => e.id === id);
    if (!original) {
      throw new Error('Estimación no encontrada');
    }

    const duplicada: EstimacionValuacion = {
      ...original,
      id: crypto.randomUUID(),
      titulo: `${original.titulo} (Copia)`,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
      usuarioId,
      resultado: undefined,
      estado: 'borrador',
      fotos: [], // No copiamos las fotos
    };

    setEstimaciones(prev => [duplicada, ...prev]);
    
    toast({
      title: '✅ Estimación duplicada',
      description: 'Se ha creado una copia de la estimación.',
    });

    return duplicada;
  }, [estimaciones, toast]);

  return {
    estimaciones,
    isLoading,
    crearEstimacion,
    actualizarEstimacion,
    eliminarEstimacion,
    buscarComparables,
    ejecutarValuacion,
    agregarFoto,
    eliminarFoto,
    setFotoPrincipal,
    getEstimacion,
    getEstimacionesByUsuario,
    duplicarEstimacion,
  };
}
