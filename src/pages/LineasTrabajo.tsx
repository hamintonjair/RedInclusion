import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn, formatDate } from '../lib/utils';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
});

type FormData = z.infer<typeof schema>;

export const LineasTrabajo: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirigir si no es admin
  React.useEffect(() => {
    if (user?.rol && user.rol !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [lineas, setLineas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const fetchLineas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/lineas');
      setLineas(response.data);
    } catch (error) {
      console.error('Error fetching lineas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineas();

    const handleSync = () => {
      console.log('[OfflineSync] Sync event received in LineasTrabajo, refreshing...');
      fetchLineas();
    };
    window.addEventListener('offline-record-synced', handleSync);
    return () => {
      window.removeEventListener('offline-record-synced', handleSync);
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      if (editingId) {
        await api.put(`/lineas/${editingId}`, data);
        setSuccessModal({
          isOpen: true,
          title: 'Actualización Exitosa',
          message: `La línea de trabajo "${data.nombre}" ha sido actualizada correctamente.`,
          type: 'success'
        });
      } else {
        await api.post('/lineas', data);
        setSuccessModal({
          isOpen: true,
          title: 'Registro Completo',
          message: `La línea de trabajo "${data.nombre}" ha sido creada exitosamente.`,
          type: 'success'
        });
      }
      setIsFormOpen(false);
      reset();
      setEditingId(null);
      fetchLineas();
    } catch (error) {
      console.error('Error saving linea:', error);
      setSuccessModal({
        isOpen: true,
        title: 'Error al Guardar',
        message: 'No fue posible guardar la línea de trabajo debido a un error con el servidor.',
        type: 'error'
      });
    }
  };

  const handleEdit = (linea: any) => {
    setEditingId(linea._id);
    setValue('nombre', linea.nombre);
    setValue('descripcion', linea.descripcion);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const linea = lineas.find(l => l._id === deleteId);
      const nombreEliminado = linea ? linea.nombre : 'La línea de trabajo';
      await api.delete(`/lineas/${deleteId}`);
      setDeleteId(null);
      fetchLineas();
      setSuccessModal({
        isOpen: true,
        title: 'Eliminación Exitosa',
        message: `La línea de trabajo "${nombreEliminado}" ha sido eliminada del sistema.`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting:', error);
      setDeleteId(null);
      setSuccessModal({
        isOpen: true,
        title: 'Error al Eliminar',
        message: 'Ocurrió un error en el servidor al intentar eliminar la línea de trabajo.',
        type: 'error'
      });
    }
  };

  const filteredLineas = lineas.filter(l => 
    l.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLineas.length / itemsPerPage);
  const currentLineas = filteredLineas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Visual */}
      <div className="bg-gradient-to-r from-brand-green to-brand-blue rounded-3xl p-6 md:p-10 text-white shadow-xl shadow-brand-green/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          <div className="w-16 h-16 shrink-0 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
            <Briefcase size={32} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight leading-tight">Líneas de Trabajo</h2>
            <p className="text-white/80 font-medium mt-1 flex flex-col sm:flex-row items-center gap-2 justify-center sm:justify-start text-sm">
              <CheckCircle2 size={16} className="hidden sm:block" />
              Gestión de Programas Sociales
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl hidden md:block" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-10 -mb-10 blur-2xl hidden md:block" />
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="flex w-full items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-green outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          <button 
            onClick={() => {
              setEditingId(null);
              reset();
              setIsFormOpen(true);
            }}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-8 py-3.5 bg-brand-green text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-brand-green/20 shrink-0"
          >
            <Plus size={18} strokeWidth={3} />
            Nueva Línea
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
          ))
        ) : filteredLineas.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} />
            </div>
            <p className="text-slate-400 font-medium">No se encontraron líneas de trabajo.</p>
          </div>
        ) : (
          currentLineas.map((linea) => (
            <div key={linea._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-brand-green/10 text-brand-green rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(linea)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => setDeleteId(linea._id)}
                      className="p-2 text-slate-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <span>{linea.nombre}</span>
                  {linea._isOffline && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-black uppercase rounded-md tracking-wider border border-amber-200 animate-pulse">
                      Local
                    </span>
                  )}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                  {linea.descripcion}
                </p>
                
                <div className="space-y-2 mt-auto text-xs font-bold uppercase tracking-wider">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-400">Creado</span>
                    <span className="text-slate-700">{formatDate(linea.fecha_creacion)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Total líneas: <span className="text-slate-900">{filteredLineas.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Mostrar:</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-brand-green cursor-pointer"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
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
  </div>

  {/* Form Modal */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden outline-none">
            <div className="bg-brand-green p-6 flex items-center justify-between">
              <Dialog.Title className="text-xl font-display font-bold text-white">
                {editingId ? 'Editar Línea' : 'Nueva Línea de Trabajo'}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Formulario para {editingId ? 'editar una línea existente' : 'crear una nueva línea'} de trabajo en el sistema.
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="p-1 text-white/50 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </Dialog.Close>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre de la Línea</label>
                <input 
                  {...register('nombre')}
                  className={cn(
                    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-green transition-all text-slate-900",
                    errors.nombre && "border-brand-red focus:ring-brand-red"
                  )}
                  placeholder="Ej: Personas con Discapacidad"
                />
                {errors.nombre && <p className="text-brand-red text-[10px] font-bold uppercase mt-1 pl-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.nombre.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Descripción</label>
                <textarea 
                  {...register('descripcion')}
                  rows={3}
                  className={cn(
                    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-green transition-all resize-none text-slate-900",
                    errors.descripcion && "border-brand-red focus:ring-brand-red"
                  )}
                  placeholder="Detalla de qué trata esta línea..."
                />
                {errors.descripcion && <p className="text-brand-red text-[10px] font-bold uppercase mt-1 pl-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.descripcion.message}</p>}
              </div>

              <div className="pt-4 flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-brand-green text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-brand-green/20 hover:bg-green-700 transition-all"
                >
                  {editingId ? 'ACTUALIZAR' : 'CREAR LÍNEA'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden outline-none">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 text-brand-red rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar línea?</h3>
              <Dialog.Description className="text-slate-500 text-sm mb-8">
                Esta acción eliminará permanentemente la línea de trabajo del sistema. No se eliminarán los beneficiarios asociados.
              </Dialog.Description>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-brand-red text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20"
                >
                  Eliminar
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
