import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  Briefcase, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  X, 
  Eraser, 
  User, 
  Clipboard, 
  Phone, 
  Mail, 
  Sparkles,
  RefreshCw,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../lib/api';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'motion/react';

export default function Asistentes() {
  // Lists and Data
  const [asistentes, setAsistentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDependencia, setSelectedDependencia] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('cfg_records_limit');
    return saved ? parseInt(saved, 10) : 10;
  });

  // Keep pagination updated when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('cfg_records_limit');
      if (saved) {
        setItemsPerPage(parseInt(saved, 10));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Also poll/check periodically or use an interval to pick up changes in the same window context
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDependencia, selectedTipo]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Custom Delete Confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');
  
  // Form State
  const [formData, setFormData] = useState({
    nombre_completo: '',
    cedula: '',
    dependencia: '',
    cargo: '',
    tipo_participacion: 'SERVIDOR PÚBLICO',
    telefono: '',
    correo: '',
    firma: ''
  });

  // Signature States
  const [isEditingSignature, setIsEditingSignature] = useState(false);
  const sigPad = useRef<any>(null);

  // Load Assistants on mount
  useEffect(() => {
    fetchAsistentes();
  }, []);

  const fetchAsistentes = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await api.get('/asistente');
      const data = response.data || [];
      const normalized = data.map((item: any) => ({
        ...item,
        nombre_completo: item.nombre_completo || item.nombre || '',
        correo: item.correo || item.email || ''
      }));
      setAsistentes(normalized);
    } catch (err: any) {
      console.error('Error fetching asistentes:', err);
      setErrorMsg('Error al cargar la lista de asistentes.');
    } finally {
      setLoading(false);
    }
  };

  // Calculations for KPI Cards
  const totalAsistentes = asistentes.length;
  const conFirma = asistentes.filter(a => a.firma && a.firma.trim() !== '').length;
  const sinFirma = totalAsistentes - conFirma;
  const firmaPercent = totalAsistentes > 0 ? ((conFirma / totalAsistentes) * 100).toFixed(1) : '0';

  // Find most common participation type
  const getMostCommonParticipation = () => {
    if (asistentes.length === 0) return { type: 'N/A', count: 0 };
    const counts: Record<string, number> = {};
    asistentes.forEach(a => {
      const type = a.tipo_participacion || 'SERVIDOR PÚBLICO';
      counts[type] = (counts[type] || 0) + 1;
    });
    
    let maxType = 'SERVIDOR PÚBLICO';
    let maxCount = 0;
    Object.keys(counts).forEach(type => {
      if (counts[type] > maxCount) {
        maxCount = counts[type];
        maxType = type;
      }
    });
    return { type: maxType, count: maxCount };
  };

  const mostCommon = getMostCommonParticipation();

  // Get unique list of dependencies for dropdown filter
  const getUniqueDependencies = () => {
    const deps = asistentes
      .map(a => a.dependencia)
      .filter((dep): dep is string => typeof dep === 'string' && dep.trim() !== '');
    return Array.from(new Set(deps));
  };

  const uniqueDependencies = getUniqueDependencies();

  // Filter list
  const filteredAsistentes = asistentes.filter(a => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      (a.nombre_completo || '').toLowerCase().includes(term) ||
      (a.cedula || '').toLowerCase().includes(term) ||
      (a.dependencia || '').toLowerCase().includes(term) ||
      (a.cargo || '').toLowerCase().includes(term);

    const matchDep = selectedDependencia === '' || a.dependencia === selectedDependencia;
    const matchTipo = selectedTipo === '' || a.tipo_participacion === selectedTipo;

    return matchSearch && matchDep && matchTipo;
  });

  // Paginated list
  const paginatedAsistentes = filteredAsistentes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenNewModal = () => {
    setEditId(null);
    setFormData({
      nombre_completo: '',
      cedula: '',
      dependencia: '',
      cargo: '',
      tipo_participacion: 'SERVIDOR PÚBLICO',
      telefono: '',
      correo: '',
      firma: ''
    });
    setIsEditingSignature(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditId(item._id || item.id);
    setFormData({
      nombre_completo: item.nombre_completo || '',
      cedula: item.cedula || '',
      dependencia: item.dependencia || '',
      cargo: item.cargo || '',
      tipo_participacion: item.tipo_participacion || 'SERVIDOR PÚBLICO',
      telefono: item.telefono || '',
      correo: item.correo || '',
      firma: item.firma || ''
    });
    setIsEditingSignature(!item.firma); // If has signature, don't auto-edit sign
    setShowModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDependencia('');
    setSelectedTipo('');
  };

  const handleSaveSignature = () => {
    if (sigPad.current && !sigPad.current.isEmpty()) {
      const signatureData = sigPad.current.getCanvas().toDataURL('image/png');
      setFormData(prev => ({ ...prev, firma: signatureData }));
      setIsEditingSignature(false);
    }
  };

  const handleClearSignature = () => {
    if (sigPad.current) {
      sigPad.current.clear();
    }
    setFormData(prev => ({ ...prev, firma: '' }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!formData.nombre_completo.trim()) {
      setErrorMsg('El nombre completo es requerido.');
      return;
    }
    if (!formData.cedula.trim()) {
      setErrorMsg('La cédula es requerida.');
      return;
    }
    const cleanCedula = formData.cedula.replace(/\s+/g, '');
    if (!/^\d+$/.test(cleanCedula)) {
      setErrorMsg('La cédula debe contener únicamente números.');
      return;
    }
    if (cleanCedula.length < 7 || cleanCedula.length > 10) {
      setErrorMsg('La cédula debe tener entre 7 y 10 dígitos.');
      return;
    }
    if (!formData.dependencia.trim()) {
      setErrorMsg('La dependencia es requerida.');
      return;
    }
    if (!formData.cargo.trim()) {
      setErrorMsg('El cargo es requerido.');
      return;
    }

    // Try capturing current signature if pad is active and painted
    let finalFirma = formData.firma;
    if (isEditingSignature && sigPad.current && !sigPad.current.isEmpty()) {
      finalFirma = sigPad.current.getCanvas().toDataURL('image/png');
    }

    const payload = {
      ...formData,
      cedula: cleanCedula,
      firma: finalFirma
    };

    try {
      if (editId) {
        await api.put(`/asistente/${editId}`, payload);
        setSuccessMsg('¡Asistente actualizado con éxito!');
      } else {
        await api.post('/asistente', payload);
        setSuccessMsg('¡Asistente registrado con éxito!');
      }
      setShowModal(false);
      fetchAsistentes();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error submitting assistant:', err);
      setErrorMsg(err.response?.data?.error || 'Error al guardar los datos del asistente.');
    }
  };

  return (
    <div className="space-y-6" id="seccion-asistentes">
      {/* Banner de Bienvenida o Título de Módulo */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-blue-600 rounded-3xl p-6 shadow-md text-white animate-fadeIn relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 scale-150">
          <Users size={180} />
        </div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Registro de Asistentes</h1>
          <p className="text-sm font-medium text-emerald-50 max-w-lg">
            Gestión de participantes y control de asistencia para las mesas de trabajo, reuniones y programas de inclusión del municipio.
          </p>
        </div>
      </div>

      {/* Alertas Globales Flotantes */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed bottom-6 right-6 z-[120] max-w-sm w-full bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 shadow-2xl shadow-emerald-950/10"
          >
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5 animate-pulse" size={20} />
            <div className="space-y-1">
              <span className="block text-xs font-black text-emerald-800 uppercase tracking-widest">Operación Exitosa</span>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">{successMsg}</p>
            </div>
          </motion.div>
        )}

        {errorMsg && !showModal && (
          <motion.div 
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed bottom-6 right-6 z-[120] max-w-sm w-full bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 shadow-2xl shadow-red-950/10"
          >
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <span className="block text-xs font-black text-red-800 uppercase tracking-widest">Error de Entrada</span>
              <p className="text-xs text-slate-650 font-semibold leading-relaxed">{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bento Grid metrics card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total asistentes */}
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-transform">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-wider text-emerald-600 uppercase">Total Asistentes</span>
            <p className="text-3xl font-black text-emerald-900">{totalAsistentes}</p>
            <span className="text-[10px] font-semibold text-slate-500">Mapeados en el sistema</span>
          </div>
          <div className="p-4 bg-emerald-500 rounded-xl text-white">
            <Users size={24} />
          </div>
        </div>

        {/* Con Firma */}
        <div className="bg-emerald-50/50 border border-emerald-100/60 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-transform">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-wider text-emerald-600 uppercase">Con Firma</span>
            <p className="text-3xl font-black text-emerald-800">{conFirma}</p>
            <span className="text-[10px] font-semibold text-emerald-500">{firmaPercent}% del total</span>
          </div>
          <div className="p-4 bg-teal-500 rounded-xl text-white">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Sin Firma */}
        <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-transform">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-wider text-amber-600 uppercase">Sin Firma</span>
            <p className="text-3xl font-black text-amber-800">{sinFirma}</p>
            <span className="text-[10px] font-semibold text-amber-600">Requiere digitalización</span>
          </div>
          <div className="p-4 bg-amber-500 rounded-xl text-white">
            <AlertCircle size={24} />
          </div>
        </div>

        {/* Servidor Publico u otro mas comun */}
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:scale-[1.01] transition-transform">
          <div className="space-y-2 flex-1">
            <span className="text-[10px] font-black tracking-wider text-blue-600 uppercase">Tipo Participación</span>
            <div>
              <p className="text-base font-black text-blue-900 leading-tight uppercase truncate">{mostCommon.type}</p>
              <p className="text-[11px] font-bold text-blue-700/80 mt-0.5">Tipo más común ({mostCommon.count} asistentes)</p>
            </div>
          </div>
          <div className="p-4 bg-blue-500 rounded-xl text-white shrink-0">
            <Award size={24} />
          </div>
        </div>
      </div>

      {/* Contenedor Principal de Listado */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Header de la sección - Listado */}
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Listado de Asistentes</h2>
            <p className="text-xs text-slate-400">Busque, filtre y gestione las firmas y cargos de los inscritos.</p>
          </div>
          
          <button
            onClick={handleOpenNewModal}
            className="w-full sm:w-auto self-start sm:self-center bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/10 hover:shadow-lg text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl flex justify-center items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Nuevo Asistente
          </button>
        </div>

        {/* Filtros de Busqueda */}
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Input de Busqueda */}
          <div className="relative col-span-1 lg:col-span-2">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, dependencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-400/90"
            />
          </div>

          {/* Filtro Dependencia */}
          <div>
            <select
              value={selectedDependencia}
              onChange={(e) => setSelectedDependencia(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-emerald-500"
            >
              <option value="">Dependencia (Todas)</option>
              {uniqueDependencies.map((dep, idx) => (
                <option key={idx} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          {/* Filtro Tipo de Participacion / Boton Limpiar */}
          <div className="flex gap-2">
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-emerald-500"
            >
              <option value="">Participación (Todos)</option>
              <option value="SERVIDOR PÚBLICO">SERVILOR PÚBLICO</option>
              <option value="CONTRATISTA">CONTRATISTA</option>
              <option value="CIUDADANO">CIUDADANO</option>
              <option value="LÍDER COMUNITARIO">LÍDER COMUNITARIO</option>
              <option value="ESTUDIANTE">ESTUDIANTE</option>
              <option value="JOVEN LÍDER">JOVEN LÍDER</option>
            </select>

            {(searchTerm || selectedDependencia || selectedTipo) && (
              <button
                onClick={clearFilters}
                className="px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-red-500 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 shrink-0"
                title="Limpiar Filtros"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tabla o Cargando */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={32} className="text-emerald-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400">Cargando asistentes municipales...</p>
          </div>
        ) : filteredAsistentes.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Users size={48} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold">No se encontraron asistentes con los filtros configurados</p>
            <p className="text-[10px] text-slate-400 mt-1">Haga clic en 'Nuevo Asistente' para dar de alta un registro nuevo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-green text-white">
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider rounded-tl-2xl">Nombre</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Cédula</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Dependencia</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Cargo / Estado Firma</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider rounded-tr-2xl text-center w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {paginatedAsistentes.map((item) => {
                  const hasSign = item.firma && item.firma.length > 20;

                  return (
                    <tr key={item._id || item.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Name & Tag */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-800 text-sm">{item.nombre_completo}</p>
                          <span className={`inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            item.tipo_participacion === 'CONTRATISTA' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            item.tipo_participacion === 'SERVIDOR PÚBLICO' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            item.tipo_participacion === 'LÍDER COMUNITARIO' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                            item.tipo_participacion === 'ESTUDIANTE' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                            item.tipo_participacion === 'JOVEN LÍDER' ? 'bg-pink-50 text-pink-600 border border-pink-100' :
                            'bg-slate-50 text-slate-600 border border-slate-100'
                          }`}>
                            <Briefcase size={9} />
                            {item.tipo_participacion || 'SERVIDOR PÚBLICO'}
                          </span>
                        </div>
                      </td>

                      {/* Cedula */}
                      <td className="py-4 px-6 font-semibold text-slate-600 tracking-tight">
                        {item.cedula}
                      </td>

                      {/* Dependencia */}
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {item.dependencia}
                      </td>

                      {/* Cargo e indicativo de Firma */}
                      <td className="py-4 px-6">
                        <div className="space-y-1.5">
                          <p className="font-bold text-slate-800">{item.cargo || 'No especificado'}</p>
                          <div className="flex items-center gap-1.5">
                            {hasSign ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <CheckCircle2 size={10} /> Con firma
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                <X size={10} /> Sin firma
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-lg border border-slate-100 hover:border-emerald-100 hover:scale-105 transition-all"
                            title="Editar Asistente"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id || item.id, item.nombre_completo)}
                            className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg border border-slate-100 hover:border-red-100 hover:scale-105 transition-all"
                            title="Eliminar Asistente"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="p-6 border-t border-slate-150 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-6">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Asistentes totales: <span className="text-slate-900">{filteredAsistentes.length}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Mostrar:</span>
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setItemsPerPage(val);
                      localStorage.setItem('cfg_records_limit', val.toString());
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-brand-green cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className="flex items-center gap-1 mx-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Página</span>
                  <span className="w-8 h-8 bg-brand-green text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-brand-green/20">
                    {currentPage}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase font-bold text-slate-400">de {Math.ceil(filteredAsistentes.length / itemsPerPage) || 1}</span>
                </div>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredAsistentes.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(filteredAsistentes.length / itemsPerPage) || Math.ceil(filteredAsistentes.length / itemsPerPage) === 0}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR ASISTENTE */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    {editId ? 'Editar Asistente' : 'Nuevo Asistente'}
                  </h3>
                  <p className="text-[10px] text-emerald-50">Complete el formulario para guardar en la base municipal</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Alerta de Error dentro del modal */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-800 text-xs font-semibold animate-fadeIn">
                  <AlertCircle className="text-red-500 shrink-0" size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Campos obligatorios del formulario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nombre Completo */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -smart-translate -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Pérez"
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-700"
                    />
                  </div>
                </div>

                {/* Cedula */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                    Cédula * <span className="text-[9px] text-slate-400 font-normal normal-case">(7 a 10 dígitos)</span>
                  </label>
                  <div className="relative">
                    <Clipboard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. 80772379"
                      value={formData.cedula}
                      onChange={(e) => setFormData(prev => ({ ...prev, cedula: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-700"
                    />
                  </div>
                </div>

                {/* Dependencia */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                    Dependencia / Secretaría *
                  </label>
                  <div className="relative">
                    <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Secretaría de Inclusión y Cohesión Social"
                      value={formData.dependencia}
                      onChange={(e) => setFormData(prev => ({ ...prev, dependencia: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-700"
                    />
                  </div>
                </div>

                {/* Cargo */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                    Cargo *
                  </label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Ingeniero de sistemas"
                      value={formData.cargo}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-700"
                    />
                  </div>
                </div>

                {/* Tipo de Participación */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                    Tipo de Participación *
                  </label>
                  <select
                    value={formData.tipo_participacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo_participacion: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-700"
                  >
                    <option value="SERVIDOR PÚBLICO">SERVIDOR PÚBLICO</option>
                    <option value="CONTRATISTA">CONTRATISTA</option>
                    <option value="CIUDADANO">CIUDADANO</option>
                    <option value="LÍDER COMUNITARIO">LÍDER COMUNITARIO</option>
                    <option value="ESTUDIANTE">ESTUDIANTE</option>
                    <option value="JOVEN LÍDER">JOVEN LÍDER</option>
                  </select>
                </div>

                {/* Telefono */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                    Teléfono <span className="text-[9px] text-slate-400 font-normal normal-case">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ej. 3123456789"
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Correo Electronico */}
              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-widest uppercase text-slate-400">
                  Correo Electrónico <span className="text-[9px] text-slate-400 font-normal normal-case">(Opcional)</span>
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Ej. correo@quibdo.gov.co"
                    value={formData.correo}
                    onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-700"
                  />
                </div>
              </div>

              {/* FIRMA DIGITAL INTEGRADA */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-slate-400 block">
                  Firma Digital
                </label>

                {/* Si ya hay firma y no se esta editando */}
                {formData.firma && !isEditingSignature ? (
                  <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-xl flex flex-col items-center gap-3 relative group">
                    <div className="h-28 flex items-center justify-center p-2 bg-white rounded-lg border border-slate-100 max-w-full">
                      <img src={formData.firma} alt="Firma Guardada" className="max-h-full max-w-full object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingSignature(true)}
                      className="text-[10px] font-black text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors uppercase tracking-wider"
                    >
                      <Eraser size={12} /> Reabrir Pad de Firma / Cambiar
                    </button>
                  </div>
                ) : (
                  /* Pad de Firma */
                  <div className="flex flex-col gap-2">
                    <div className="w-full h-36 border-2 border-dashed border-emerald-200 bg-slate-50/60 rounded-xl relative overflow-hidden flex flex-col items-center justify-center group focus-within:border-emerald-500 transition-colors">
                      <SignatureCanvas
                        ref={sigPad}
                        penColor="black"
                        canvasProps={{
                          className: "signature-canvas w-full h-full cursor-crosshair absolute inset-0 z-10"
                        }}
                      />
                      {!formData.firma && (
                        <div className="pointer-events-none select-none flex flex-col items-center gap-1 font-bold text-slate-400/95 p-4 text-center z-0">
                          <span className="text-emerald-600 font-extrabold text-[10px] uppercase tracking-wider">+ Agregar Firma Municipal</span>
                          <span className="text-[9.5px]">Firme directamente con su mouse o dedo sobre esta sección</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 justify-end text-[10px] font-black uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="text-red-500 hover:text-red-650 flex items-center gap-1 transition-colors"
                      >
                        <Eraser size={11} /> Limpiar Pad
                      </button>
                      
                      {isEditingSignature && formData.firma && (
                        <button
                          type="button"
                          onClick={() => setIsEditingSignature(false)}
                          className="text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
                        >
                          Cancelar Edición
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>

            {/* Footer de Acciones */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-150 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleFormSubmit}
                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-600/15 transition-all"
              >
                {editId ? 'Guardar Cambios' : 'Registrar'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación con soporte sandboxing */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-650 rounded-full flex items-center justify-center mx-auto border border-rose-100 shadow-sm animate-bounce">
              <Trash2 size={22} className="stroke-[2.5px]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-800 tracking-tight">¿Confirmar Eliminación?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                ¿Está seguro de que desea eliminar al asistente <span className="font-extrabold text-slate-800">{deleteConfirmName}</span> de la base de datos municipal? Esta acción es definitiva.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmName('');
                }}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-150 active:bg-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-200/50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  setDeleteConfirmName('');
                  try {
                    await api.delete(`/asistente/${id}`);
                    setSuccessMsg('Asistente eliminado con éxito');
                    fetchAsistentes();
                    setTimeout(() => setSuccessMsg(''), 4000);
                  } catch (err: any) {
                    console.error('Error deleting asistente:', err);
                    setErrorMsg('Error al eliminar el asistente.');
                    setTimeout(() => setErrorMsg(''), 4005);
                  }
                }}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/15"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
