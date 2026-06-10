import React, { useMemo } from 'react';

// Colores por comuna
export const COMUNA_COLORS: Record<string, string> = {
  'Comuna 1': '#e74c3c', // Rojo
  'Comuna 2': '#e67e22', // Naranja
  'Comuna 3': '#f1c40f', // Amarillo
  'Comuna 4': '#27ae60', // Verde
  'Comuna 5': '#2980b9', // Azul
  'Comuna 6': '#8e44ad', // Morado
  'Zonas Rurales': '#7f8c8d', // Gris
};

// Función para normalizar nombres de barrios
export const normalizarNombreBarrio = (nombre: string) => {
  if (!nombre) return '';
  return nombre
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]/g, ''); // Eliminar caracteres especiales
};

// Agrupa los registros por comuna y barrio, asegurando que se incluyan todos los barrios definidos en los datos estáticos
export function agruparPorComunaYBarrio(registros: any[], barriosPorComunaEstatico: any[]) {
  const resultado: Record<string, Record<string, number>> = {};
  
  // 1. Inicializar con todos los barrios conocidos en 0
  if (Array.isArray(barriosPorComunaEstatico)) {
    barriosPorComunaEstatico.forEach(c => {
      if (c.comuna === 'Zonas Rurales') return;
      resultado[c.comuna] = {};
      
      if (Array.isArray(c.barrios)) {
        c.barrios.forEach((b: any) => {
          resultado[c.comuna][b.nombre] = 0;
        });
      }
    });
  }

  // 2. Contabilizar los registros reales
  if (Array.isArray(registros)) {
    registros.forEach(r => {
      if (!r.comuna) return;
      const comunaOriginal = r.comuna.trim();
      const barrioNombreReal = r.barrio ? r.barrio.trim() : 'Sin barrio';
      const barrioNormalizado = normalizarNombreBarrio(barrioNombreReal);
      
      // Encontrar la comuna correcta (insensible a mayúsculas/minúsculas)
      const comunaKey = Object.keys(resultado).find(k => k.toLowerCase() === comunaOriginal.toLowerCase());
      const comuna = comunaKey || comunaOriginal;
      
      if (!resultado[comuna]) {
        resultado[comuna] = {};
      }
      
      // Intentar encontrar el barrio en el mapa inicializado usando normalización
      const barriosEnComuna = Object.keys(resultado[comuna]);
      let encontrado = false;
      
      for (const nombreB of barriosEnComuna) {
        if (normalizarNombreBarrio(nombreB) === barrioNormalizado) {
          resultado[comuna][nombreB] += 1;
          encontrado = true;
          break;
        }
      }
      
      // Si no se encontró en la lista estática, se agrega como barrio nuevo
      if (!encontrado) {
        resultado[comuna][barrioNombreReal] = (resultado[comuna][barrioNombreReal] || 0) + 1;
      }
    });
  }
  
  return resultado;
}

interface MapaRegistrosProps {
  registros: any[];
  totalRegistros?: number;
}

const MapaRegistros: React.FC<MapaRegistrosProps> = ({ registros, totalRegistros = 0 }) => {
  const barriosMarcados = useMemo(() => {
    if (!Array.isArray(registros)) return [];
    const registrosFiltrados = registros.filter(r => r.barrio_lat && r.barrio_lng);
    return registrosFiltrados.map(r => ({
      comuna: r.comuna,
      barrio: r.barrio,
      lat: typeof r.barrio_lat === 'string' ? parseFloat(r.barrio_lat) : r.barrio_lat,
      lng: typeof r.barrio_lng === 'string' ? parseFloat(r.barrio_lng) : r.barrio_lng,
    }));
  }, [registros]);

  // Conversión de lat/lng a coordenadas X/Y sobre la imagen SVG Oficial de Quibdó (Wikimedia)
  const latLngToXY = (lat: number, lng: number) => {
    // Coordenadas calibradas según las instrucciones oficiales del sistema Red Inclusión
    const minLat = 5.6800;
    const maxLat = 5.7000;
    const minLng = -76.6820;
    const maxLng = -76.6400;
    const width = 1200;
    const height = 900;
    
    // Proyección lineal estándar para el SVG de Quibdó
    const x = ((lng - minLng) / (maxLng - minLng)) * width;
    const y = height - ((lat - minLat) / (maxLat - minLat)) * height;
    
    return { x, y };
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#f8fafc] p-0 overflow-hidden">
      {/* 
        Viewport del mapa: Aplicamos un ligero zoom (scale) para que el mapa 
        ocupe más espacio y eliminemos los bordes blancos del SVG original.
      */}
      <div 
        className="relative bg-white shadow-inner flex items-center justify-center"
        style={{ 
          aspectRatio: '1200 / 900',
          width: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Contenedor de Capas con Zoom (Al 130%) */}
        <div className="relative w-full h-full transform scale-[1.2] transition-transform duration-500">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/7/78/Comunas_de_Quibd%C3%B3.svg" 
            alt="Mapa oficial comunas Quibdó" 
            className="w-full h-full object-contain select-none opacity-90"
            referrerPolicy="no-referrer"
          />
          
          {barriosMarcados.map((barrio, idx) => {
            const { x, y } = latLngToXY(barrio.lat, barrio.lng);
            const color = COMUNA_COLORS[barrio.comuna] || '#e74c3c';
            return (
              <div
                key={idx}
                className="absolute z-10 transition-all hover:scale-150 cursor-pointer"
                style={{
                  left: `${(x / 1200) * 100}%`,
                  top: `${(y / 900) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={`${barrio.barrio} (${barrio.comuna})`}
              >
                {/* Marker Ultra-fino: Borde blanco, centro color comuna */}
                <div 
                  className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white border-[0.5px] shadow-sm flex items-center justify-center"
                  style={{ borderColor: 'rgba(255,255,255,0.8)' }}
                >
                  <div 
                    className="w-full h-full rounded-full border border-black/5"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Pill - Posicionada arriba con estilo minimalista */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center bg-[#333333]/90 backdrop-blur-md text-white px-5 py-1.5 rounded-full shadow-2xl z-40 font-medium whitespace-nowrap border border-white/10 transform scale-90 md:scale-100">
          <span className="text-[12px] opacity-70 uppercase tracking-widest font-black">Mostrando</span>
          <div className="mx-3 bg-white/20 px-2.5 py-0.5 rounded-lg font-black text-[12px] tabular-nums">
            {registros.length}
          </div>
          <span className="text-[12px] opacity-70 uppercase tracking-widest font-black">de</span>
          <div className="mx-3 font-black text-[12px] tabular-nums text-white/50">
            {totalRegistros}
          </div>
          <span className="text-[11px] opacity-50 uppercase tracking-widest font-black">Reg.</span>
        </div>
      </div>
    </div>
  );
};

export default MapaRegistros;
