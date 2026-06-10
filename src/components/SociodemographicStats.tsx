import React from 'react';
import { 
  HeartPulse, 
  BookOpen, 
  Home as HomeIcon, 
  Baby, 
  Star, 
  FileCheck, 
  UserPlus, 
  ShieldAlert, 
  Award, 
  Briefcase,
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { cn } from '../lib/utils';

const CHART_COLORS = [
  '#00A86B', // Esmeralda / Verde Marca
  '#3B82F6', // Azul
  '#E31E24', // Rojo Marca
  '#F59E0B', // Ámbar
  '#8B5CF6', // Violeta
  '#EC4899', // Rosa
  '#14B8A6', // Turquesa
  '#6366F1', // Índigo
  '#10B981', // Verde claro
  '#64748B'  // Gris Slate
];

interface SociodemographicStatsProps {
  stats: any;
  loading: boolean;
}

export const SociodemographicStats: React.FC<SociodemographicStatsProps> = ({ stats, loading }) => {
  const [activeTab, setActiveTab] = React.useState<string>('vulnerabilidad');

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-2xl flex flex-col justify-center items-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4">Calculando índices demográficos...</p>
      </div>
    );
  }

  const { totalBeneficiarios = 2752 } = stats;

  // Calculadoras Helpers de Porcentaje
  const getPct = (val: number) => {
    if (!totalBeneficiarios) return '0.0%';
    return `${((val / totalBeneficiarios) * 100).toFixed(1)}%`;
  };

  const tabs = [
    { id: 'vulnerabilidad', name: 'Enfoque Diferencial', icon: HeartPulse, desc: 'Discapacidades, registro de víctimas y grupos étnicos' },
    { id: 'educacion', name: 'Educación y Lectoescritura', icon: BookOpen, desc: 'Tasa de alfabetización, escolaridad e hijos en estudio' },
    { id: 'socioeconomico', name: 'Hogar y Nivel Socioeconómico', icon: HomeIcon, desc: 'Ocupación, habitabilidad, cuidadoras no remuneradas' },
    { id: 'demografia', name: 'Ciclo de Vida y Demografía', icon: Baby, desc: 'Distribución por rangos de edad e índices de vejez' }
  ];

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-2xl shadow-slate-100/70 flex flex-col gap-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="text-[10px] font-black text-brand-green uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">Análisis Avanzado</span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-2 flex items-center gap-2">
            Métricas Sociodemográficas Reales
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Resultados de agregaciones dinámicas calculadas sobre los <strong>{(totalBeneficiarios).toLocaleString()}</strong> registros actuales del Municipio de Quibdó.
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50 p-2 rounded-[28px] border border-slate-100">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "p-4 rounded-2xl flex flex-col items-center gap-1.5 justify-center transition-all cursor-pointer text-center group",
                isActive
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10"
                  : "bg-transparent text-slate-500 hover:bg-white hover:text-slate-800"
              )}
            >
              <Icon size={18} className={cn("transition-transform group-hover:scale-110", isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-700")} />
              <span className="text-xs font-black tracking-tight leading-tight">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Descriptions */}
      <div className="px-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Vista Operacional: {tabs.find(t => t.id === activeTab)?.desc}
        </p>
      </div>

      {/* TABS PANELS */}
      <div className="mt-2">
        {/* Panel 1: Vulnerabilidad */}
        {activeTab === 'vulnerabilidad' && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="p-2 bg-emerald-50 text-brand-green border border-emerald-100 rounded-xl w-fit mb-3">
                    <HeartPulse size={16} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Población con Discapacidad</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-2">
                    {(stats.vulnerabilidad?.discapacidad?.si ?? 0).toLocaleString()}
                  </h4>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center text-[11px] font-bold text-slate-500">
                  <span>PORCENTAJE:</span>
                  <span className="text-brand-green font-black">{getPct(stats.vulnerabilidad?.discapacidad?.si ?? 0)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="p-2 bg-blue-50 text-brand-blue border border-blue-100 rounded-xl w-fit mb-3">
                    <Award size={16} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Certificado Formal</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-2">
                    {(stats.vulnerabilidad?.discapacidad?.conCertificado ?? 0).toLocaleString()}
                  </h4>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center text-[11px] font-bold text-slate-500">
                  <span>COBERTURA CERTIFICADO:</span>
                  <span className="text-brand-blue font-black">
                    {stats.vulnerabilidad?.discapacidad?.si 
                      ? `${((stats.vulnerabilidad.discapacidad.conCertificado / stats.vulnerabilidad.discapacidad.si) * 100).toFixed(1)}%`
                      : '0.0%'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="p-2 bg-red-50 text-brand-red border border-red-100 rounded-xl w-fit mb-3">
                    <ShieldAlert size={16} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Víctimas del Conflicto</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-2">
                    {(stats.vulnerabilidad?.victimaConflicto?.si ?? 0).toLocaleString()}
                  </h4>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center text-[11px] font-bold text-slate-500">
                  <span>PROPORCIÓN MUNICIPAL:</span>
                  <span className="text-brand-red font-black">{getPct(stats.vulnerabilidad?.victimaConflicto?.si ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Tipos Discapacidad */}
              <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl">
                <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Tipos de Discapacidad Reportados</h3>
                <div className="h-[240px] w-full flex items-center justify-center">
                  {stats.vulnerabilidad?.tiposDiscapacidad?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.vulnerabilidad.tiposDiscapacidad}
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {stats.vulnerabilidad.tiposDiscapacidad.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: 11, fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs font-black text-slate-400 uppercase">Sin reportes registrados</div>
                  )}
                </div>
                {/* Labels */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {stats.vulnerabilidad?.tiposDiscapacidad?.slice(0, 6).map((item: any, index: number) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                      <span className="text-[9px] font-black text-slate-500 uppercase truncate" title={item.name}>{item.name}: <strong className="text-slate-850">{item.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Etnia */}
              <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl flex flex-col justify-between">
                <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Auto-Reconocimiento Étnico</h3>
                <div className="h-[240px] w-full">
                  {stats.vulnerabilidad?.etnias?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.vulnerabilidad.etnias} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'black', fill: '#94a3b8' }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'black', fill: '#475569' }} width={90} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: 11 }} cursor={{ fill: '#f1f5f9' }} />
                        <Bar dataKey="value" fill="#00A86B" radius={[0, 8, 8, 0]} barSize={20}>
                          {stats.vulnerabilidad.etnias.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs font-black text-slate-400 text-center uppercase py-10">Sin datos de etnias</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: Educacion */}
        {activeTab === 'educacion' && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="p-2 bg-green-50 text-brand-green border border-green-100 rounded-xl w-fit mb-3">
                    <BookOpen size={16} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Saben Leer (Alfabetismo)</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-2">
                    {(stats.educacion?.sabeLeer ?? 0).toLocaleString()}
                  </h4>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center text-[11px] font-bold text-slate-500">
                  <span>TASA ALFABETIZACIÓN:</span>
                  <span className="text-brand-green font-black">{getPct(stats.educacion?.sabeLeer ?? 0)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl w-fit mb-3">
                    <FileCheck size={16} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Saben Escribir</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-2">
                    {(stats.educacion?.sabeEscribir ?? 0).toLocaleString()}
                  </h4>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center text-[11px] font-bold text-slate-500">
                  <span>ESCRITURA BÁSICA:</span>
                  <span className="text-indigo-600 font-black">{getPct(stats.educacion?.sabeEscribir ?? 0)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="p-2 bg-blue-50 text-brand-blue border border-blue-100 rounded-xl w-fit mb-3">
                    <GraduationCap size={16} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Estudio Activo / Familiar</p>
                  <h4 className="text-3xl font-black text-slate-800 mt-2">
                    {(stats.educacion?.estudiaActualmente ?? 0).toLocaleString()}
                  </h4>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center text-[11px] font-bold text-slate-500">
                  <span>MATRÍCULA DE LOGRO:</span>
                  <span className="text-brand-blue font-black">{getPct(stats.educacion?.estudiaActualmente ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Educational attainment chart */}
            <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl flex flex-col justify-between">
              <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Logro Educativo Máximo Alcanzado</h3>
              <div className="h-[280px] w-full">
                {stats.educacion?.nivelEducativo?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.educacion.nivelEducativo}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'black', fill: '#475569' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'black', fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: 11 }} />
                      <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} barSize={45}>
                        {stats.educacion.nivelEducativo.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs font-black text-slate-400 text-center py-12">Sin datos de escolaridad</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panel 3: Socioeconomico */}
        {activeTab === 'socioeconomico' && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="p-1.5 bg-amber-50 text-amber-500 border border-amber-100 rounded-xl w-fit mb-2.5">
                    <HelpCircle size={14} />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Asistencia Social</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-1.5">
                    {(stats.socioeconomico?.ayudaHumanitaria?.si ?? 0).toLocaleString()}
                  </h4>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>COBERTURA AYUDA:</span>
                  <span className="text-amber-600 font-black">{getPct(stats.socioeconomico?.ayudaHumanitaria?.si ?? 0)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="p-1.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl w-fit mb-2.5">
                    <HeartPulse size={14} />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Cuidadoras no Remuneradas</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-1.5">
                    {(stats.socioeconomico?.cuidadora?.si ?? 0).toLocaleString()}
                  </h4>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>ECONOMÍA CUIDADO:</span>
                  <span className="text-rose-600 font-black">{getPct(stats.socioeconomico?.cuidadora?.si ?? 0)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="p-1.5 bg-sky-50 text-sky-500 border border-sky-100 rounded-xl w-fit mb-2.5">
                    <Baby size={14} />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Hijos a Cargo Promedio</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-1.5">
                    {stats.socioeconomico?.avgHijos ?? 0}
                  </h4>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>PROMEDIO FAMILIAR:</span>
                  <span className="text-sky-600 font-black">Hijos/Hogar</span>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="p-1.5 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-xl w-fit mb-2.5">
                    <Briefcase size={14} />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Dependencia Laboral</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-1.5">
                    {getPct(stats.socioeconomico?.situacionLaboral?.find((item: any) => item.name === 'Desempleado')?.value ?? 0)}
                  </h4>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>ESTADO RECONOCIDO:</span>
                  <span className="text-indigo-600 font-black">Desempleado</span>
                </div>
              </div>
            </div>

            {/* Ocupacion & Vivienda layouts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ocupacion */}
              <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl">
                <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Distribución de Situación Laboral</h3>
                <div className="h-[240px] w-full">
                  {stats.socioeconomico?.situacionLaboral?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.socioeconomico.situacionLaboral}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'black', fill: '#475569' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'black', fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: 11 }} />
                        <Bar dataKey="value" fill="#4F46E5" radius={[8, 8, 0, 0]} barSize={35}>
                          {stats.socioeconomico.situacionLaboral.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs font-black text-slate-400 text-center py-10 uppercase">Habilitando indicadores...</div>
                  )}
                </div>
              </div>

              {/* Vivienda list representation / Bar horizontal */}
              <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl">
                <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Condiciones y Tipos de Residencia</h3>
                <div className="h-[240px] w-full">
                  {stats.socioeconomico?.tipoVivienda?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.socioeconomico.tipoVivienda} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 'black', fill: '#94a3b8' }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'black', fill: '#475569' }} width={120} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: 11 }} />
                        <Bar dataKey="value" fill="#00A86B" radius={[0, 8, 8, 0]} barSize={16}>
                          {stats.socioeconomico.tipoVivienda.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs font-black text-slate-400 text-center py-10 uppercase">Formatos de residencia temporal...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel 4: Demografia */}
        {activeTab === 'demografia' && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            {/* KPI Description and Distribution based on ranges */}
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-50 text-brand-red border border-red-100 rounded-2xl w-fit">
                    <Baby size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-tight">Ciclos de Vida y Rangos Generacionales</h4>
                    <p className="text-xs text-slate-400 mt-1">Comparativa ordenada de rangos etarios en el Territorio Municipal.</p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-slate-100 rounded-xl text-center md:text-right shrink-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grupo Mayoritario:</p>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-wider mt-0.5">
                    {stats.demografia?.rangoEdad?.[0] ? `${stats.demografia.rangoEdad[0].name} (${getPct(stats.demografia.rangoEdad[0].value)})` : 'Por calcular'}
                  </p>
                </div>
              </div>
            </div>

            {/* Rango de Edad Bar chart */}
            <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl flex flex-col justify-between">
              <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-wider">Población por Rangos de Edad (Años)</h3>
              <div className="h-[280px] w-full">
                {stats.demografia?.rangoEdad?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.demografia.rangoEdad}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'black', fill: '#475569' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'black', fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: 11 }} />
                      <Bar dataKey="value" fill="#E31E24" radius={[8, 8, 0, 0]} barSize={45}>
                        {stats.demografia.rangoEdad.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs font-black text-slate-400 text-center py-12">No hay registros de edad segmentados</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
