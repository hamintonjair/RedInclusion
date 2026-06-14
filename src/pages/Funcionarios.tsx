import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  X,
  User,
  Shield,
  Building,
  Mail,
  Phone,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff
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
  email: z.string().email('Email inválido'),
  password: z.string().optional(),
  telefono: z.string().optional().or(z.literal('')),
  secretaría: z.string().min(1, 'Seleccione una secretaría'),
  linea_trabajo: z.string().min(1, 'Seleccione una línea de trabajo'),
  rol: z.enum(['admin', 'funcionario']),
  estado: z.string().min(1, 'El estado es requerido'),
});

type FormData = z.infer<typeof schema>;

export const Funcionarios: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirigir si no es admin
  React.useEffect(() => {
    if (user?.rol && user.rol !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [lineas, setLineas] = useState<any[]>([]);
  const [secretarias, setSecretarias] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(9); // Since it's a 3x3 grid usually

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      rol: 'funcionario',
      estado: 'Activo',
      secretaría: '',
      linea_trabajo: '',
      password: ''
    }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [funcRes, lineasRes, secRes] = await Promise.all([
        api.get('/funcionarios'),
        api.get('/lineas'),
        api.get('/secretarias')
      ]);
      setFuncionarios(funcRes.data);
      setLineas(lineasRes.data);
      setSecretarias(secRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      // If editing and password is empty, remove it from data to not overwrite
      const payload = { ...data };
      if (editingId && !payload.password) {
        delete payload.password;
      }

      if (editingId) {
        await api.put(`/funcionarios/${editingId}`, payload);
      } else {
        await api.post('/funcionarios', payload);
      }
      setIsFormOpen(false);
      reset();
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar el funcionario.');
    }
  };

  const handleEdit = (funcionario: any) => {
    setEditingId(funcionario._id);
    reset({
      nombre: funcionario.nombre,
      email: funcionario.email,
      telefono: funcionario.telefono || '',
      secretaría: funcionario.secretaría || funcionario.secretaria,
      linea_trabajo: funcionario.linea_trabajo,
      rol: funcionario.rol,
      estado: funcionario.estado || 'Activo',
      password: '' // empty for security, only update if typed
    });
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/funcionarios/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar funcionario.');
    }
  };

  const filteredFuncionarios = funcionarios.filter(f => 
    f.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFuncionarios.length / itemsPerPage);
  const currentFuncionarios = filteredFuncionarios.slice(
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
            <Shield size={32} />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight leading-tight">Funcionarios</h2>
            <p className="text-white/80 font-medium mt-1 flex flex-col sm:flex-row items-center gap-2 justify-center sm:justify-start text-sm">
              <User size={16} className="hidden sm:block" />
              Gestión de Talento Humano y Accesos
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
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-green outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          <button 
            onClick={() => {
              setEditingId(null);
              reset({
                rol: 'funcionario',
                estado: 'Activo',
                nombre: '',
                email: '',
                telefono: '',
                secretaría: '',
                linea_trabajo: '',
                password: ''
              });
              setIsFormOpen(true);
            }}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-8 py-3.5 bg-brand-green text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-brand-green/20 shrink-0"
          >
            <Plus size={18} strokeWidth={3} />
            Registrar Personal
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 h-80 animate-pulse" />
          ))
        ) : filteredFuncionarios.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} />
            </div>
            <p className="text-slate-400 font-medium">No se encontraron funcionarios registrados.</p>
          </div>
        ) : (
          currentFuncionarios.map((f) => (
            <div key={f._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl uppercase">
                    {f.nombre.charAt(0)}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(f)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => setDeleteId(f._id)}
                      className="p-2 text-slate-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{f.nombre}</h3>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-4">
                  <Shield size={12} className={f.rol === 'admin' ? 'text-amber-500' : 'text-blue-500'} />
                  {f.rol === 'admin' ? 'Administrador' : 'Funcionario'}
                  <span className="mx-1">•</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] uppercase font-bold",
                    f.estado === 'Activo' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {f.estado}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Building size={16} className="text-slate-300 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secretaría</p>
                      <p className="text-xs text-slate-700 font-medium">{f.secretaría || f.secretaria}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Shield size={16} className="text-slate-300 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Línea de Trabajo</p>
                      <p className="text-xs text-slate-700 font-medium">
                        {lineas.find(l => l._id === f.linea_trabajo || l.nombre === f.linea_trabajo)?.nombre || f.linea_trabajo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail size={16} className="text-slate-300 mt-1 flex-shrink-0" />
                    <p className="text-xs text-slate-600 truncate">{f.email}</p>
                  </div>
                  
                  {f.telefono && (
                    <div className="flex items-start gap-3">
                      <Phone size={16} className="text-slate-300 mt-1 flex-shrink-0" />
                      <p className="text-xs text-slate-600">{f.telefono}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="p-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/10">
        <div className="flex items-center gap-6">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Total funcionarios: <span className="text-slate-900">{filteredFuncionarios.length}</span>
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
              <option value={18}>18</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden outline-none max-h-[90vh] flex flex-col">
            <div className="bg-brand-green p-6 flex items-center justify-between flex-shrink-0">
              <Dialog.Title className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Shield size={24} />
                {editingId ? 'Editar Funcionario' : 'Nuevo Funcionario'}
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Formulario para {editingId ? 'editar la información de un funcionario' : 'registrar un nuevo funcionario'} en la plataforma.
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="p-1 text-white/50 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </Dialog.Close>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 col-span-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                  <input 
                    {...register('nombre')}
                    className={cn(
                      "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-green",
                      errors.nombre && "border-brand-red"
                    )}
                    placeholder="Ej: Yordan Solis"
                  />
                  {errors.nombre && <p className="text-brand-red text-[10px] font-bold uppercase pl-1">{errors.nombre.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
                  <input 
                    {...register('email')}
                    className={cn(
                      "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-green",
                      errors.email && "border-brand-red"
                    )}
                    placeholder="correo@ejemplo.com"
                  />
                  {errors.email && <p className="text-brand-red text-[10px] font-bold uppercase pl-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Contraseña {editingId && '(Opcional)'}</label>
                  <div className="relative">
                    <input 
                      {...register('password')}
                      type={showPassword ? "text" : "password"}
                      className={cn(
                        "w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-green",
                        errors.password && "border-brand-red"
                      )}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-brand-red text-[10px] font-bold uppercase pl-1">{errors.password.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Teléfono</label>
                  <input 
                    {...register('telefono')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-green"
                    placeholder="311..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Rol</label>
                  <select 
                    {...register('rol')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    <option value="funcionario">Funcionario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Secretaría</label>
                  <select 
                    {...register('secretaría')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    <option value="">Seleccione secretaría...</option>
                    {secretarias.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.secretaría && <p className="text-brand-red text-[10px] font-bold uppercase pl-1">{errors.secretaría.message}</p>}
                </div>

                <div className="space-y-1 col-span-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Línea de Trabajo</label>
                  <select 
                    {...register('linea_trabajo')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    <option value="">Seleccione línea...</option>
                    {lineas.map(l => <option key={l._id} value={l._id}>{l.nombre}</option>)}
                  </select>
                  {errors.linea_trabajo && <p className="text-brand-red text-[10px] font-bold uppercase pl-1">{errors.linea_trabajo.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Estado</label>
                  <select 
                    {...register('estado')}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-brand-green text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-brand-green/20 hover:bg-green-700 transition-all"
                >
                  {editingId ? 'ACTUALIZAR' : 'REGISTRAR'}
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
              <Dialog.Title className="text-xl font-bold text-slate-800 mb-2">¿Eliminar funcionario?</Dialog.Title>
              <Dialog.Description className="text-slate-500 text-sm mb-8">Esta acción eliminará permanentemente al funcionario y su acceso al sistema.</Dialog.Description>
              
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
    </div>
  );
};
