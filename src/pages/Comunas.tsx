import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  X,
  MapPin,
  Building2,
  Save,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  zona: z.string().min(3, 'La zona es requerida'),
});

type FormData = z.infer<typeof schema>;

export const Comunas: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirigir si no es admin
  React.useEffect(() => {
    if (user?.rol && user.rol !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [comunas, setComunas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const fetchComunas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/comunas');
      setComunas(response.data);
    } catch (error) {
      console.error('Error fetching comunas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComunas();

    const handleSync = () => {
      console.log('[OfflineSync] Sync event received in Comunas, refreshing...');
      fetchComunas();
    };
    window.addEventListener('offline-record-synced', handleSync);
    return () => {
      window.removeEventListener('offline-record-synced', handleSync);
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      if (editingId) {
        await api.put(`/comunas/${editingId}`, data);
        setSuccessModal({
          isOpen: true,
          title: 'Actualización Exitosa',
          message: `La comuna "${data.nombre}" ha sido modificada correctamente.`,
          type: 'success'
        });
      } else {
        await api.post('/comunas', data);
        setSuccessModal({
          isOpen: true,
          title: 'Registro Completo',
          message: `La comuna "${data.nombre}" ha sido creada exitosamente.`,
          type: 'success'
        });
      }
      setIsFormOpen(false);
      reset();
      setEditingId(null);
      fetchComunas();
    } catch (error) {
      console.error('Error saving comuna:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Error de Guardado',
        message: 'No se pudo guardar la comuna en el servidor. Por favor, intente nuevamente.',
        type: 'error'
      });
    }
  };

  const handleEdit = (comuna: any) => {
    setEditingId(comuna._id);
    reset({
      nombre: comuna.nombre,
      zona: comuna.zona
    });
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const comuna = comunas.find(c => c._id === deleteId);
      const nombreEliminado = comuna ? comuna.nombre : 'La comuna';
      await api.delete(`/comunas/${deleteId}`);
      setDeleteId(null);
      fetchComunas();
      setSuccessModal({
        isOpen: true,
        title: 'Eliminación Exitosa',
        message: `La comuna "${nombreEliminado}" ha sido eliminada del sistema.`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting:', error);
      setDeleteId(null);
      setSuccessModal({
        isOpen: true,
        title: 'Error al Eliminar',
        message: 'Ocurrió un error en el servidor al intentar eliminar la comuna.',
        type: 'error'
      });
    }
  };

  const filteredComunas = comunas.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.zona.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredComunas.length / itemsPerPage);
  const currentComunas = filteredComunas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Visual */}
      <div className="bg-gradient-to-r from-brand-green to-brand-blue rounded-3xl p-10 text-white shadow-xl shadow-brand-green/10 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
            <MapPin size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-display font-black tracking-tight">Gestión de Comunas</h2>
            <p className="text-white/80 font-medium mt-1 flex items-center gap-2">
              <Building2 size={16} />
              Sistema de Gestión Territorial
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-10 -mb-10 blur-2xl" />
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Filtrar por nombre o zona..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-green outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          <button 
            onClick={() => {
              setEditingId(null);
              reset({ nombre: '', zona: '' });
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-8 py-3.5 bg-brand-green text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-brand-green/20 shrink-0"
          >
            <Plus size={18} strokeWidth={3} />
            Crear Nueva Comuna
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 h-64 animate-pulse shadow-sm" />
              ))
            ) : currentComunas.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin size={32} />
                </div>
                <p className="text-slate-400 font-medium">No se encontraron comunas.</p>
              </div>
            ) : (
              currentComunas.map((comuna) => (
                <div key={comuna._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-green/10 group-hover:text-brand-green transition-colors">
                        <MapPin size={24} />
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(comuna)}
                          className="p-2 text-brand-green hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(comuna._id)}
                          className="p-2 text-brand-red hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <span>{comuna.nombre}</span>
                      {comuna._isOffline && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-black uppercase rounded-md tracking-wider border border-amber-200 animate-pulse">
                          Local
                        </span>
                      )}
                    </h3>
                    <div className="flex items-start gap-2">
                       <Building2 size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-500 font-medium leading-tight">{comuna.zona}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sector Territorial</span>
                    <button 
                      onClick={() => handleEdit(comuna)}
                      className="text-[10px] font-bold text-brand-green uppercase hover:underline"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/30">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Total sectores: <span className="text-slate-900">{filteredComunas.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Mostrar:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-brand-green cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1 mx-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Página</span>
              <span className="w-8 h-8 bg-brand-green text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-brand-green/20">
                {currentPage}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">de {totalPages || 1}</span>
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[40px] shadow-2xl z-[101] overflow-hidden outline-none">
            <div className="bg-brand-green p-10 flex items-center justify-between">
              <Dialog.Title className="text-2xl font-display font-black text-white">
                {editingId ? 'Editar Comuna' : 'Crear Nueva Comuna'}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Formulario para {editingId ? 'editar una comuna existente' : 'registrar una nueva comuna'}.
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="p-2 text-white/50 hover:text-white transition-colors bg-white/10 rounded-2xl">
                  <X size={24} />
                </button>
              </Dialog.Close>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-12 space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre de la Comuna</label>
                <input 
                  {...register('nombre')}
                  className={cn(
                    "w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-green focus:bg-white transition-all text-slate-900",
                    errors.nombre && "border-red-200 focus:border-brand-red"
                  )}
                  placeholder="Ej: Comuna 1"
                />
                {errors.nombre && <p className="text-brand-red text-[11px] font-bold uppercase mt-1 ml-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.nombre.message}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Zona / Barrios Referencia</label>
                <input 
                  {...register('zona')}
                  className={cn(
                    "w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-brand-green focus:bg-white transition-all text-slate-900",
                    errors.zona && "border-red-200 focus:border-brand-red"
                  )}
                  placeholder="Ej: Zona Norte - Barrios..."
                />
                {errors.zona && <p className="text-brand-red text-[11px] font-bold uppercase mt-1 ml-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.zona.message}</p>}
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 bg-brand-green text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-brand-green/20 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {editingId ? 'Actualizar' : 'Guardar Comuna'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[32px] shadow-2xl z-[101] overflow-hidden outline-none">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 text-brand-red rounded-full flex items-center justify-center mx-auto mb-8">
                <Trash2 size={40} />
              </div>
              <Dialog.Title className="text-2xl font-display font-black text-slate-800 mb-3">¿Eliminar Comuna?</Dialog.Title>
              <Dialog.Description className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">Esta acción es irreversible y podría afectar los registros de beneficiarios asociados a este sector.</Dialog.Description>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Volver
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-brand-red text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-colors shadow-xl shadow-red-500/20"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Success/Notification Modal */}
      <Dialog.Root open={!!successModal?.isOpen} onOpenChange={(open) => {
        if (!open) setSuccessModal(null);
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-[32px] shadow-2xl z-[101] overflow-hidden outline-none p-8 text-center space-y-6">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-inner",
              successModal?.type === 'success' ? "bg-emerald-50 text-brand-green" : "bg-red-50 text-brand-red"
            )}>
              {successModal?.type === 'success' ? (
                <CheckCircle2 size={36} className="animate-pulse" />
              ) : (
                <AlertCircle size={36} className="animate-bounce" />
              )}
            </div>
            
            <div className="space-y-2">
              <Dialog.Title className="text-xl font-display font-black text-slate-800 uppercase tracking-tight">
                {successModal?.title}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-slate-500 font-semibold leading-relaxed">
                {successModal?.message}
              </Dialog.Description>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSuccessModal(null)}
                className={cn(
                  "w-full py-3 text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-all cursor-pointer",
                  successModal?.type === 'success' 
                    ? "bg-brand-green hover:bg-emerald-700 shadow-md shadow-brand-green/20" 
                    : "bg-brand-red hover:bg-red-700 shadow-md shadow-brand-red/20"
                )}
              >
                Aceptar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
