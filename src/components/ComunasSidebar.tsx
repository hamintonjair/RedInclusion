import React from 'react';
import { COMUNA_COLORS } from './MapaRegistros';
import { cn } from '../lib/utils';
import { MapPin } from 'lucide-react';

interface ComunasSidebarProps {
  agrupadoPorComuna: Record<string, Record<string, number>>;
}

export const ComunasSidebar: React.FC<ComunasSidebarProps> = ({ agrupadoPorComuna }) => {
  const comunas = Object.keys(agrupadoPorComuna).sort((a, b) => {
    if (a === 'Zonas Rurales') return 1;
    if (b === 'Zonas Rurales') return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-50">
        <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">
          Mapa de registros de beneficiarios
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="py-2 pb-10">
          {comunas.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={24} className="text-slate-200" />
              </div>
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Sin datos</p>
            </div>
          ) : (
            comunas.map(comuna => {
              const barrios = agrupadoPorComuna[comuna];
              const barriosFiltrados = Object.entries(barrios).filter(([_, cantidad]) => cantidad > 0);
              const totalComuna = barriosFiltrados.reduce((sum, [_, cantidad]) => sum + cantidad, 0);
              
              if (barriosFiltrados.length === 0) return null;
              
              return (
                <div key={comuna} className="mb-4">
                  <div className="px-6 py-2 flex items-center justify-between">
                    <h4 
                      className="text-[11px] font-black uppercase tracking-tight"
                      style={{ color: COMUNA_COLORS[comuna] || '#e74c3c' }}
                    >
                      {comuna}
                    </h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                      {totalComuna}
                    </span>
                  </div>
                  
                  <div className="">
                    {barriosFiltrados.sort((a,b) => a[0].localeCompare(b[0])).map(([barrio, cantidad]) => (
                      <div 
                        key={barrio} 
                        className="group flex items-center justify-between py-1.5 px-6 hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        <span className="text-[12px] font-medium text-slate-500 group-hover:text-slate-800 transition-colors">
                          {barrio}
                        </span>
                        <span 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm"
                          style={{ backgroundColor: COMUNA_COLORS[comuna] || '#e74c3c' }}
                        >
                          {cantidad}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
