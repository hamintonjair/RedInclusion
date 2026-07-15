import React, { useState, useEffect, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { 
  Calendar, 
  MapPin, 
  Plus, 
  User, 
  Trash2, 
  Tag, 
  Layers, 
  Search, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle,
  Clock, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Save,
  Building2,
  Target,
  FileText,
  Filter,
  X,
  Pencil
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';

type ViewMode = 'list' | 'activity' | 'meeting' | 'detail';

const EXPORT_COLUMNS = [
  { key: 'index', title: 'N°', defaultChecked: true },
  { key: 'fecha_registro', title: 'FECHA DE REGISTRO', defaultChecked: true },
  { key: 'nombre', title: 'NOMBRE COMPLETO', defaultChecked: true },
  { key: 'tipo_documento', title: 'TIPO DE DOCUMENTO', defaultChecked: true },
  { key: 'identificacion', title: 'NÚMERO DE DOCUMENTO', defaultChecked: true },
  { key: 'genero', title: 'GÉNERO', defaultChecked: true },
  { key: 'rango_edad', title: 'RANGO DE EDAD', defaultChecked: true },
  { key: 'comuna', title: 'COMUNA', defaultChecked: true },
  { key: 'barrio', title: 'BARRIO', defaultChecked: true },
  { key: 'telefono', title: 'TELÉFONO', defaultChecked: true },
  { key: 'email', title: 'CORREO ELECTRÓNICO', defaultChecked: true },
  { key: 'estudia', title: 'ESTUDIA ACTUALMENTE', defaultChecked: false },
  { key: 'nivel_educativo', title: 'NIVEL EDUCATIVO', defaultChecked: false },
  { key: 'sabe_leer', title: 'SABE LEER', defaultChecked: false },
  { key: 'sabe_escribir', title: 'SABE ESCRIBIR', defaultChecked: false },
  { key: 'tipo_vivienda', title: 'TIPO DE VIVIENDA', defaultChecked: false },
  { key: 'situacion_laboral', title: 'SITUACIÓN LABORAL', defaultChecked: false },
  { key: 'grupo_etnico', title: 'GRUPO ÉTNICO', defaultChecked: false },
  { key: 'ayuda_humanitaria', title: 'AYUDA HUMANITARIA', defaultChecked: false },
  { key: 'tipo_ayuda', title: 'TIPO DE AYUDA HUMANITARIA', defaultChecked: false },
  { key: 'discapacidad', title: '¿DISCAPACIDAD?', defaultChecked: true },
  { key: 'certificado_discapacidad', title: '¿TIENE CERTIFICADO?', defaultChecked: true },
  { key: 'tipo_discapacidad', title: 'TIPO DE DISCAPACIDAD', defaultChecked: true },
  { key: 'cuidadora', title: 'NOMBRE DE LA CUIDADORA', defaultChecked: false },
  { key: 'labora_actualmente', title: 'LABORA ACTUALMENTE', defaultChecked: false },
  { key: 'victima', title: '¿VÍCTIMA?', defaultChecked: true },
  { key: 'eres_desplazado', title: '¿ERES DESPLAZADO?', defaultChecked: false },
  { key: 'tipo_pobreza', title: 'TIPO DE POBREZA', defaultChecked: false },
  { key: 'mujeres_hogar', title: 'MUJERES EN HOGAR', defaultChecked: false },
  { key: 'ninos_hogar', title: 'NIÑOS EN HOGAR', defaultChecked: false },
  { key: 'adolescentes_hogar', title: 'ADOLESCENTES EN HOGAR', defaultChecked: false },
  { key: 'jovenes_hogar', title: 'JÓVENES EN HOGAR', defaultChecked: false },
  { key: 'madre_cabeza', title: '¿MADRE CABEZA?', defaultChecked: false },
  { key: 'nombre_madre_cabeza', title: 'NOMBRE MADRE CABEZA', defaultChecked: false },
  { key: 'firma', title: 'FIRMA', defaultChecked: true },
];

const trimImage = (base64Str: string, padding = 4): Promise<string> => {
  return new Promise<string>((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Read pixels to find bounding box of content (non-transparent, non-white)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;
        let found = false;
        
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const alphaIdx = (y * canvas.width + x) * 4 + 3;
            const rIdx = alphaIdx - 3;
            const gIdx = alphaIdx - 2;
            const bIdx = alphaIdx - 1;
            
            const alpha = data[alphaIdx];
            const r = data[rIdx];
            const g = data[gIdx];
            const b = data[bIdx];
            
            // Content pixel if it's not fully transparent, AND not practically white
            const isWhite = r > 240 && g > 240 && b > 240;
            if (alpha > 10 && !isWhite) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              found = true;
            }
          }
        }
        
        if (!found) {
          resolve(base64Str);
          return;
        }
        
        // Add slight padding to the trimmed box so content doesn't touch the borders
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(canvas.width - 1, maxX + padding);
        maxY = Math.min(canvas.height - 1, maxY + padding);
        
        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;
        
        if (cropW <= 2 || cropH <= 2) {
          resolve(base64Str);
          return;
        }
        
        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = cropW;
        trimmedCanvas.height = cropH;
        const trimmedCtx = trimmedCanvas.getContext('2d');
        if (!trimmedCtx) {
          resolve(base64Str);
          return;
        }
        
        // Fill background white
        trimmedCtx.fillStyle = '#FFFFFF';
        trimmedCtx.fillRect(0, 0, cropW, cropH);
        
        // Draw cropped image onto the new canvas
        trimmedCtx.drawImage(
          img,
          minX, minY, cropW, cropH,
          0, 0, cropW, cropH
        );
        
        resolve(trimmedCanvas.toDataURL('image/png'));
      } catch (e) {
        console.warn('Error trimming image:', e);
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

export default function Actividades() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [actividades, setActividades] = useState<any[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedActDetail, setSelectedActDetail] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Excel Export columns states
  const [isExportColumnsOpen, setIsExportColumnsOpen] = useState(false);
  const [exportColumnsSearch, setExportColumnsSearch] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    EXPORT_COLUMNS.forEach(col => {
      initial[col.key] = col.defaultChecked;
    });
    return initial;
  });
  const [activeTab, setActiveTab] = useState<'info' | 'assistants'>('info');
  const [currentPageAsistentes, setCurrentPageAsistentes] = useState(1);
  const [asistentesPerPage, setAsistentesPerPage] = useState(() => {
    const saved = localStorage.getItem('cfg_records_limit');
    return saved ? parseInt(saved, 10) : 10;
  });

  // Main Activities table pagination
  const [currentPageActividades, setCurrentPageActividades] = useState(1);
  const [actividadesPerPage, setActividadesPerPage] = useState(() => {
    const saved = localStorage.getItem('cfg_records_limit');
    return saved ? parseInt(saved, 10) : 10;
  });

  // Keep pagination updated when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('cfg_records_limit');
      if (saved) {
        setAsistentesPerPage(parseInt(saved, 10));
        setActividadesPerPage(parseInt(saved, 10));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPageActividades(1);
  }, [searchTerm, dateFilter]);
  
  // Beneficiarios for assistant selection
  const [allBeneficiarios, setAllBeneficiarios] = useState<any[]>([]);
  const [allAsistentes, setAllAsistentes] = useState<any[]>([]);
  const [lineas, setLineas] = useState<any[]>([]);
  const [assistantSearch, setAssistantSearch] = useState('');
  const [assistantDateFilter, setAssistantDateFilter] = useState('');
  const [selectedAssistants, setSelectedAssistants] = useState<any[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    tema: '',
    objetivo: '',
    lugar: '',
    dependencia: 'Secretaría de Inclusión y Cohesión Social',
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '08:00',
    horaFin: '10:00',
    lineaTrabajo: '',
    tipo: 'Actividad' // 'Actividad' or 'Reunión'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchActividades = async () => {
    setLoading(true);
    try {
      const res = await api.get('/actividades');
      const data = res.data || [];
      setActividades(data);
      
      // If we are in detail view, update the selected activity
      if (selectedActDetail) {
        const updated = data.find((a: any) => a._id === selectedActDetail._id);
        if (updated) {
          setSelectedActDetail((prev: any) => ({ ...updated, asistentes_detalles: prev?.asistentes_detalles }));
        }
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeneficiarios = async () => {
    try {
      const res = await api.get('/beneficiarios?limit=10000');
      let data = res.data.data || res.data || [];
      if (!Array.isArray(data)) data = [];
      setAllBeneficiarios(data);
    } catch (err) {
      console.error('Error fetching beneficiaries:', err);
    }
  };

  const fetchAsistentes = async () => {
    try {
      const res = await api.get('/asistente');
      let data = res.data || [];
      if (!Array.isArray(data)) data = [];
      const normalized = data.map((item: any) => ({
        ...item,
        nombre_completo: item.nombre_completo || item.nombre || '',
        tipo_documento: item.tipo_documento || 'Cédula',
        numero_documento: item.cedula || item.numero_documento || item.documento || '',
      }));
      setAllAsistentes(normalized);
    } catch (err) {
      console.error('Error fetching asistentes:', err);
    }
  };

  const fetchLineas = async () => {
    try {
      const res = await api.get('/lineas');
      const lineasData = res.data || [];
      setLineas(lineasData);
      
      // Set default line if it exists
      if (lineasData.length > 0 && !formData.lineaTrabajo) {
        // Try to find user's line of work
        const userLineId = user?.lineaTrabajo;
        const found = lineasData.find((l: any) => l._id === userLineId || l.nombre === userLineId);
        
        if (found) {
          setFormData(prev => ({ ...prev, lineaTrabajo: found.nombre }));
        } else {
          setFormData(prev => ({ ...prev, lineaTrabajo: lineasData[0].nombre }));
        }
      }
    } catch (err) {
      console.error('Error fetching lines:', err);
    }
  };

  useEffect(() => {
    fetchActividades();
    fetchBeneficiarios();
    fetchLineas();
    fetchAsistentes();

    const handleSync = () => {
      console.log('[OfflineSync] Sync event received in Actividades, refreshing data...');
      fetchActividades();
      fetchBeneficiarios();
      fetchAsistentes();
    };
    window.addEventListener('offline-record-synced', handleSync);
    return () => {
      window.removeEventListener('offline-record-synced', handleSync);
    };
  }, []);

  // Sync default line of work when user or lines are loaded
  useEffect(() => {
    if (user && lineas.length > 0 && !formData.lineaTrabajo) {
      const userLineId = user.lineaTrabajo;
      const found = lineas.find((l: any) => l._id === userLineId || l.nombre === userLineId);
      if (found) {
        setFormData(prev => ({ ...prev, lineaTrabajo: found.nombre }));
      }
    }
  }, [user, lineas, formData.lineaTrabajo]);

  const stats = useMemo(() => {
    const total = actividades.length;
    const meetings = actividades.filter(a => a.tipo?.toLowerCase().includes('reun')).length;
    const activitiesCount = total - meetings;
    const thisMonth = actividades.filter(a => {
      const d = new Date(a.fecha);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const totalAssistants = actividades.reduce((acc, curr) => acc + (curr.asistentes?.length || 0), 0);
    
    return { total, meetings, activitiesCount, thisMonth, totalAssistants };
  }, [actividades]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.tema.trim() || !formData.lugar.trim()) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    try {
      const activityPayload = {
        ...formData,
        nombre: formData.tema, // backward compatibility
        facilitador: user?.nombreCompleto || 'Funcionario de Inclusión',
        asistentes: selectedAssistants.map(a => a._id),
        linea: formData.lineaTrabajo || 'General'
      };

      if (editingId) {
        await api.put(`/actividades/${editingId}`, activityPayload);
        setSuccessModal({
          isOpen: true,
          title: 'Actualización Exitosa',
          message: '¡La actividad/reunión ha sido actualizada de manera formal y guardada en el servidor municipal!',
          type: 'success'
        });
      } else {
        await api.post('/actividades', activityPayload);
        setSuccessModal({
          isOpen: true,
          title: 'Registro Exitoso',
          message: '¡La actividad/reunión ha sido creada e incorporada de forma exitosa al cronograma oficial municipal!',
          type: 'success'
        });
      }

      setFormData({
        tema: '',
        objetivo: '',
        lugar: '',
        dependencia: 'Secretaría de Inclusión y Cohesión Social',
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: '08:00',
        horaFin: '10:00',
        lineaTrabajo: formData.lineaTrabajo,
        tipo: 'Actividad'
      });
      setSelectedAssistants([]);
      setEditingId(null);
      setViewMode('list');
      fetchActividades();

    } catch (err) {
      console.error('Error saving activity:', err);
      setSuccessModal({
        isOpen: true,
        title: 'Error de Guardado',
        message: 'Hubo un error al intentar guardar la información de la actividad. Verifique la conexión.',
        type: 'error'
      });
    }
  };

  const openEditForm = async (act: any) => {
    setEditingId(act._id);
    
    // Set form data
    setFormData({
      tema: act.tema || act.nombre || '',
      objetivo: act.objetivo || '',
      lugar: act.lugar || '',
      dependencia: act.dependencia || 'Secretaría de Inclusión y Cohesión Social',
      fecha: act.fecha ? new Date(act.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      horaInicio: act.horaInicio || '08:00',
      horaFin: act.horaFin || '10:00',
      lineaTrabajo: act.lineaTrabajo || act.linea || '',
      tipo: act.tipo || 'Actividad'
    });

    // We need to resolve 'asistentes' properly
    let resolvedAssistants = [];
    const isMeeting = (act.tipo || '').toLowerCase().includes('reun');
    if (act.asistentes_detalles && act.asistentes_detalles.length > 0) {
      resolvedAssistants = act.asistentes_detalles.map((a: any) => {
        const idToSearch = a.beneficiario_id || a._id;
        const full = isMeeting 
          ? (allAsistentes.find(b => b._id === idToSearch || b.id === idToSearch) || allBeneficiarios.find(b => b._id === idToSearch || b.id === idToSearch))
          : (allBeneficiarios.find(b => b._id === idToSearch || b.id === idToSearch) || allAsistentes.find(b => b._id === idToSearch || b.id === idToSearch));
        return full || a;
      });
    } else if (act.asistentes && act.asistentes.length > 0) {
      resolvedAssistants = act.asistentes.map((aId: string | any) => {
        const idToSearch = typeof aId === 'object' ? (aId.beneficiario_id || aId._id) : aId;
        const full = isMeeting 
          ? (allAsistentes.find(b => b._id === idToSearch || b.id === idToSearch) || allBeneficiarios.find(b => b._id === idToSearch || b.id === idToSearch))
          : (allBeneficiarios.find(b => b._id === idToSearch || b.id === idToSearch) || allAsistentes.find(b => b._id === idToSearch || b.id === idToSearch));
        return full || { _id: idToSearch };
      });
    }
    
    setSelectedAssistants(resolvedAssistants);
    setViewMode('activity');
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async (id: string) => {
    try {
      const act = actividades.find(a => a._id === id);
      const actName = act ? (act.tema || act.nombre) : 'La actividad';
      await api.delete(`/actividades/${id}`);
      if (selectedActDetail?._id === id) {
        setViewMode('list');
        setSelectedActDetail(null);
      }
      fetchActividades();
      setSuccessModal({
        isOpen: true,
        title: 'Eliminación Exitosa',
        message: `La actividad/reunión "${actName}" y sus registros de participación han sido eliminados del registro de forma definitiva.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting activity:', err);
      setSuccessModal({
        isOpen: true,
        title: 'Error de Eliminación',
        message: 'Hubo un error inesperado al intentar eliminar el registro de la actividad.',
        type: 'error'
      });
    }
  };

  const renderDeleteConfirmModal = () => {
    if (!deleteConfirmId) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-[4px] p-4 animate-fadeIn">
        <div className="bg-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl border border-slate-100 text-center space-y-6 animate-scaleIn">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
            <Trash2 size={28} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-display font-black text-slate-800 uppercase tracking-tight">¿Eliminar Actividad?</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-semibold">
              Esta acción eliminará de forma permanente los registros y asistencias de esta actividad. ¿Está completamente seguro?
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                const id = deleteConfirmId;
                setDeleteConfirmId(null);
                await executeDelete(id);
              }}
              className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 cursor-pointer"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const escapeXml = (unsafe: any) => {
    if (unsafe === undefined || unsafe === null) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const formatDateForExcel = (dateStr: any) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return dateStr;
      }
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
      return dateStr;
    }
  };

  const filteredColumns = useMemo(() => {
    if (!exportColumnsSearch) return EXPORT_COLUMNS;
    const q = exportColumnsSearch.toLowerCase();
    return EXPORT_COLUMNS.filter(c => c.title.toLowerCase().includes(q) || c.key.toLowerCase().includes(q));
  }, [exportColumnsSearch]);

  const allMarked = useMemo(() => {
    return EXPORT_COLUMNS.every(col => selectedColumns[col.key]);
  }, [selectedColumns]);

  const toggleAllColumns = () => {
    if (allMarked) {
      const updated = { ...selectedColumns };
      EXPORT_COLUMNS.forEach(col => {
        updated[col.key] = false;
      });
      setSelectedColumns(updated);
    } else {
      const updated = { ...selectedColumns };
      EXPORT_COLUMNS.forEach(col => {
        updated[col.key] = true;
      });
      setSelectedColumns(updated);
    }
  };

  const handleGenerateExcel = async () => {
    if (!selectedActDetail) return;
    const act = selectedActDetail;
    const realAsistentes = (act.asistentes_detalles && act.asistentes_detalles.length > 0) 
      ? act.asistentes_detalles 
      : (act.asistentes || []);

    const getCanvasLogoBase64 = async (): Promise<string> => {
      // Step 0: Try to fetch /logo.png directly as base64
      try {
        const res = await fetch('/logo.png');
        if (res.ok) {
          const blob = await res.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
          });
          if (base64 && base64.startsWith('data:image')) {
            return base64;
          }
        }
      } catch (e) {
        console.warn('Direct fetch logo failed, trying canvas route', e);
      }

      // Step 1: Let's try to load /logo.png
      const pngBase64 = await new Promise<string>((resolve) => {
        const img = new Image();
        img.src = '/logo.png';
        img.onload = () => {
          if (img.width > 20 && img.height > 20) {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
              return;
            }
          }
          resolve('');
        };
        img.onerror = () => resolve('');
      });

      if (pngBase64) return pngBase64;

      // Step 2: Fallback to /logo.svg rendered to PNG via Canvas
      const svgBase64 = await new Promise<string>((resolve) => {
        const img = new Image();
        img.src = '/logo.svg';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 500;
          canvas.height = 100;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, 500, 100);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
          resolve('');
        };
        img.onerror = () => resolve('');
      });

      if (svgBase64) return svgBase64;

      // Step 3: Draw native typography in canvas
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00A859';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('ALCALDÍA DE', 135, 52);
        
        ctx.fillStyle = '#CC0000';
        ctx.font = 'bold 52px Arial';
        ctx.fillText('QUIBDÓ', 135, 98);
        return canvas.toDataURL('image/png');
      }
      return '';
    };

    const generateCursiveSignature = (name: string): string => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Random ink color variation (either dark blue, navy, or slightly black-blue)
      const colors = ['#0F2942', '#1B365D', '#031B33', '#1C2E4A'];
      const inkColor = colors[Math.floor(Math.random() * colors.length)];

      ctx.font = 'italic 75px "Caveat", "Brush Script MT", "Lucida Handwriting", "Comic Sans MS", "Segoe Print", cursive';
      ctx.fillStyle = inkColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const parts = name.trim().split(/\s+/);
      let signatureText = parts[0];
      if (parts.length > 1 && parts[1].length > 1) {
        signatureText += ' ' + parts[1][0] + '.';
      }

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 - 5);
      const angle = (Math.random() * 8 - 4) * Math.PI / 180;
      ctx.rotate(angle);
      ctx.fillText(signatureText, 0, 0);
      ctx.restore();

      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 2.5 + Math.random() * 1.0;
      ctx.beginPath();
      ctx.moveTo(30 + Math.random() * 15, canvas.height * 0.72 + (Math.random() * 4 - 2));
      ctx.bezierCurveTo(
        120 + Math.random() * 20, canvas.height * (0.64 + Math.random() * 0.08),
        380 + Math.random() * 20, canvas.height * (0.74 + Math.random() * 0.08),
        canvas.width - 30 - Math.random() * 15, canvas.height * 0.72 + (Math.random() * 4 - 2)
      );
      ctx.stroke();

      return canvas.toDataURL('image/png');
    };

    let logoBase64 = '';
    try {
      const rawLogo = await getCanvasLogoBase64();
      if (rawLogo) {
        logoBase64 = await trimImage(rawLogo, 2);
      }
    } catch (e) {
      console.warn('Error rendering canvas logo for Excel:', e);
    }

    let activeKeys = EXPORT_COLUMNS
      .filter(col => selectedColumns[col.key])
      .map(col => col.key);

    // Guarantee that signature starts as the very last column
    if (activeKeys.includes('firma')) {
      activeKeys = activeKeys.filter(k => k !== 'firma');
      activeKeys.push('firma');
    }

    const headers = activeKeys.map(key => {
      const col = EXPORT_COLUMNS.find(c => c.key === key);
      return col ? col.title : '';
    });

    const maxColLengths = headers.map(h => h.length);

    const attendeeRows = realAsistentes.map((asistenteItem: any, index: number) => {
      const isObject = typeof asistenteItem === 'object' && asistenteItem !== null;
      const idValue = isObject ? (asistenteItem.beneficiario_id || asistenteItem._id) : asistenteItem;
      
      let b = allBeneficiarios.find(b => b._id === idValue || b.id === idValue) || allAsistentes.find(b => b._id === idValue || b.id === idValue);
      
      let nombre = b?.nombre_completo || b?.nombre;
      let doc = b?.numero_documento || b?.cedula;
      
      if ((!nombre || !doc) && isObject) {
        nombre = nombre || asistenteItem.nombre_beneficiario || asistenteItem.nombre_completo || asistenteItem.nombre;
        doc = doc || asistenteItem.documento_beneficiario || asistenteItem.numero_documento || asistenteItem.cedula || asistenteItem.documento;
      }
      
      nombre = nombre || 'Desconocido / Eliminado';
      doc = doc || '---';

      const values: Record<string, any> = {
        index: String(index + 1),
        fecha_registro: formatDateForExcel(b?.fecha_registro || asistenteItem?.fecha_registro || b?.created_at || asistenteItem?.created_at),
        nombre: nombre,
        tipo_documento: b?.tipo_documento || asistenteItem?.tipo_documento || '',
        identificacion: doc,
        genero: b?.genero || asistenteItem?.genero || '',
        rango_edad: b?.rango_edad || asistenteItem?.rango_edad || '',
        comuna: b?.comuna || asistenteItem?.comuna || '',
        barrio: b?.barrio || asistenteItem?.barrio || '',
        telefono: b?.numero_celular || b?.telefono || asistenteItem?.numero_celular || asistenteItem?.telefono || '',
        email: b?.correo_electronico || b?.email || asistenteItem?.correo_electronico || asistenteItem?.email || '',
        estudia: b?.estudia_actualmente !== undefined ? (b.estudia_actualmente ? 'Sí' : 'No') : 'No',
        nivel_educativo: b?.nivel_educativo || 'Ninguno',
        sabe_leer: b?.sabe_leer !== undefined ? (b.sabe_leer ? 'Sí' : 'No') : 'No',
        sabe_escribir: b?.sabe_escribir !== undefined ? (b.sabe_escribir ? 'Sí' : 'No') : 'No',
        tipo_vivienda: b?.tipo_vivienda || b?.tenencia_vivienda || '',
        situacion_laboral: b?.situacion_laboral || 'Desempleado',
        grupo_etnico: b?.etnia || b?.grupo_etnico || '',
        ayuda_humanitaria: b?.ayuda_humanitaria !== undefined ? (b.ayuda_humanitaria ? 'Sí' : 'No') : 'No',
        tipo_ayuda: b?.tipo_ayuda || b?.tipo_ayuda_humanitaria || '',
        discapacidad: b?.tiene_discapacidad ? 'Sí' : 'No',
        certificado_discapacidad: b?.tiene_certificado_discapacidad ? 'Sí' : 'No',
        tipo_discapacidad: b?.tiene_discapacidad ? (b.tipo_discapacidad || 'Sí') : 'No',
        cuidadora: b?.nombre_cuidadora || 'No',
        labora_actualmente: b?.labora_cuidadora ? 'Sí' : 'No',
        victima: b?.victima_conflicto ? 'Sí' : 'No',
        firma: (() => {
          const loadedFirma = b?.firma || asistenteItem?.firma || '';
          if (loadedFirma && loadedFirma.startsWith('data:image')) {
            return loadedFirma;
          }
          return generateCursiveSignature(nombre);
        })(),
        eres_desplazado: b?.eres_desplazado ? 'Sí' : 'No',
        tipo_pobreza: b?.tipo_pobreza || 'N/A',
        mujeres_hogar: String(b?.mujeres_hogar ?? 0),
        ninos_hogar: String(b?.ninos_hogar ?? 0),
        adolescentes_hogar: String(b?.adolescentes_hogar ?? 0),
        jovenes_hogar: String(b?.jovenes_hogar ?? 0),
        madre_cabeza: b?.madre_cabeza_familia ? 'Sí' : 'No',
        nombre_madre_cabeza: b?.nombre_madre_cabeza || 'N/A'
      };

      const rowValues = activeKeys.map(k => values[k] ?? '');
      
      rowValues.forEach((val, colIndex) => {
        const sVal = (activeKeys[colIndex] === 'firma' && String(val).startsWith('data:image')) ? 'FIRMA' : String(val ?? '');
        if (sVal.length > maxColLengths[colIndex]) {
          maxColLengths[colIndex] = sVal.length;
        }
      });

      return rowValues;
    });

    const columnsDef = activeKeys.map((key, colIndex) => {
      const header = headers[colIndex];
      const maxLen = maxColLengths[colIndex];
      
      let calculatedWidth = Math.ceil(maxLen * 6.8) + 5;
      if (calculatedWidth < 55) calculatedWidth = 55;
      if (calculatedWidth > 160) calculatedWidth = 160;

      const halfWidthKeys = [
        'rango_edad',
        'discapacidad',
        'certificado_discapacidad',
        'tipo_discapacidad',
        'victima',
        'eres_desplazado',
        'mujeres_hogar',
        'ninos_hogar',
        'adolescentes_hogar',
        'jovenes_hogar',
        'madre_cabeza'
      ];
      if (halfWidthKeys.includes(key)) {
        calculatedWidth = Math.round(calculatedWidth / 2);
        if (calculatedWidth < 30) calculatedWidth = 30;
      }

      if (key === 'identificacion') {
        calculatedWidth = 130;
      }

      if (key === 'firma') {
        calculatedWidth = 100;
      }

      return {
        key,
        header,
        width: calculatedWidth
      };
    });

    const C = activeKeys.length;
    const mergeLogoAcross = Math.max(0, Math.min(3, C - 1));
    const logoSpanCount = mergeLogoAcross + 1;
    const endCol = C;

    const leftCols = C >= 8 ? 6 : Math.max(4, Math.floor(C / 2));
    const themeValMerge = Math.max(0, leftCols - 3);
    const objLabelMerge = 1;

    // Build the workbook with ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistencia');

    // Enable gridlines
    worksheet.views = [{ showGridLines: true }];

    // Configure column widths
    const excelJSColumns = columnsDef.map((col, colIdx) => {
      let w = 15;
      if (col.key === 'index') w = 6;
      else if (col.key === 'fecha_registro') w = 18;
      else if (col.key === 'nombre') w = 28;
      else if (col.key === 'tipo_documento') w = 16;
      else if (col.key === 'identificacion') w = 16;
      else if (col.key === 'genero') w = 11;
      else if (col.key === 'rango_edad') w = 12;
      else if (col.key === 'comuna') w = 11;
      else if (col.key === 'barrio') w = 18;
      else if (col.key === 'telefono') w = 15;
      else if (col.key === 'email') w = 24;
      else if (col.key === 'firma') w = 32;
      else {
        const calculated = col.width ? (col.width / 5) : 15;
        w = Math.max(8, Math.min(30, calculated));
      }
      return { key: col.key, header: col.header, width: w };
    });
    
    excelJSColumns.forEach((col, colIdx) => {
      worksheet.getColumn(colIdx + 1).width = col.width;
    });

    const borderStyle: any = {
      top: { style: 'thin', color: { argb: 'A0B0C0' } },
      left: { style: 'thin', color: { argb: 'A0B0C0' } },
      bottom: { style: 'thin', color: { argb: 'A0B0C0' } },
      right: { style: 'thin', color: { argb: 'A0B0C0' } },
    };

    const cleanBase64 = (dataUrl: string) => {
      if (!dataUrl) return '';
      const commaIdx = dataUrl.indexOf(',');
      return commaIdx !== -1 ? dataUrl.substring(commaIdx + 1) : dataUrl;
    };

    // Rows 1-4 Height configuration (taller so that logo image can scale up)
    worksheet.getRow(1).height = 24;
    worksheet.getRow(2).height = 20;
    worksheet.getRow(3).height = 20;
    worksheet.getRow(4).height = 20;

    // Merge cells for the logo Box: A1 to C4
    worksheet.mergeCells(1, 1, 4, logoSpanCount);
    const logoCell = worksheet.getCell(1, 1);
    logoCell.value = logoBase64 ? '' : 'ALCALDÍA DE QUIBDÓ';
    logoCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    logoCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '0F172A' } };

    // Format all cells in the logo area first
    for (let r = 1; r <= 4; r++) {
      for (let c = 1; c <= logoSpanCount; c++) {
        worksheet.getCell(r, c).border = borderStyle;
        worksheet.getCell(r, c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF' }
        };
      }
    }

    // Embed logo image if base64 is loaded successfully
    if (logoBase64) {
      try {
        const cleanLogoStr = cleanBase64(logoBase64);
        const logoImgId = workbook.addImage({
          base64: cleanLogoStr,
          extension: 'png',
        });
        worksheet.addImage(logoImgId, {
          tl: { col: 0.01, row: 0.05 } as any,
          br: { col: logoSpanCount - 0.01, row: 3.95 } as any,
          editAs: 'oneCell'
        });
      } catch (err) {
        console.warn('Error inserting logo image in ExcelJS:', err);
      }
    }

    if (endCol > logoSpanCount) {
      // Title Header Merges & Styles
      worksheet.mergeCells(1, logoSpanCount + 1, 1, endCol);
      const titleCell = worksheet.getCell(1, logoSpanCount + 1);
      titleCell.value = 'FORMATO REGISTRO DE ASISTENCIA';
      titleCell.font = { name: 'Segoe UI', size: 14, bold: true };
      titleCell.alignment = { horizontal: 'left', vertical: 'middle' };

      worksheet.mergeCells(2, logoSpanCount + 1, 2, endCol);
      const subtitleCell = worksheet.getCell(2, logoSpanCount + 1);
      subtitleCell.value = 'ALCALDÍA MUNICIPAL DE QUIBDÓ';
      subtitleCell.font = { name: 'Segoe UI', size: 12, bold: true };
      subtitleCell.alignment = { horizontal: 'left', vertical: 'middle' };

      worksheet.mergeCells(3, logoSpanCount + 1, 3, logoSpanCount + 2);
      const depLabelCell = worksheet.getCell(3, logoSpanCount + 1);
      depLabelCell.value = 'DEPENDENCIA:';
      depLabelCell.font = { name: 'Segoe UI', size: 10, bold: true };
      depLabelCell.alignment = { horizontal: 'left', vertical: 'middle' };

      worksheet.mergeCells(3, logoSpanCount + 3, 3, endCol);
      const depValueCell = worksheet.getCell(3, logoSpanCount + 3);
      depValueCell.value = (act.dependencia || 'SECRETARÍA DE INCLUSIÓN Y COHESIÓN SOCIAL').toUpperCase();
      depValueCell.font = { name: 'Segoe UI', size: 10 };
      depValueCell.alignment = { horizontal: 'left', vertical: 'middle' };

      // Apply borders & background for cells D1 to endCol under rows 1-4
      for (let r = 1; r <= 4; r++) {
        for (let c = logoSpanCount + 1; c <= endCol; c++) {
          worksheet.getCell(r, c).border = borderStyle;
          worksheet.getCell(r, c).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF' }
          };
        }
      }
    }

    // Set height of info rows (5-7)
    worksheet.getRow(5).height = 22;
    worksheet.getRow(6).height = 22;
    worksheet.getRow(7).height = 22;

    // Row 5: Tema & Objetivo
    // Tema label (A5:B5)
    const mergeTemaLabelEnd = Math.min(2, endCol);
    worksheet.mergeCells(5, 1, 5, mergeTemaLabelEnd);
    const temaLabelCell = worksheet.getCell(5, 1);
    temaLabelCell.value = 'TEMA:';
    temaLabelCell.font = { name: 'Segoe UI', size: 10, bold: true };
    temaLabelCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // Tema value (C5 to leftCols)
    const leftColsFinal = Math.max(mergeTemaLabelEnd + 1, Math.min(leftCols, endCol - 2));
    const themeValEnd = Math.min(leftColsFinal, endCol - 2);
    if (themeValEnd >= mergeTemaLabelEnd + 1) {
      worksheet.mergeCells(5, mergeTemaLabelEnd + 1, 5, themeValEnd);
      const themeValCell = worksheet.getCell(5, mergeTemaLabelEnd + 1);
      themeValCell.value = (act.tema || act.nombre || '').toUpperCase();
      themeValCell.font = { name: 'Segoe UI', size: 10 };
      themeValCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    }

    // Objetivo Label (themeValEnd+1 to themeValEnd+objLabelMerge)
    const objLabelStart = themeValEnd + 1;
    const objLabelEnd = Math.min(objLabelStart + objLabelMerge, endCol - 1);
    if (objLabelStart <= endCol) {
      worksheet.mergeCells(5, objLabelStart, 7, objLabelEnd);
      const objLabelCell = worksheet.getCell(5, objLabelStart);
      objLabelCell.value = 'OBJETIVO:';
      objLabelCell.font = { name: 'Segoe UI', size: 10, bold: true };
      objLabelCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    }

    // Objetivo Value (objLabelEnd+1 to endCol)
    // Limits the Objetivo cell exactly to endCol, preventing any overflow onto column Q (17) or beyond
    const objValStart = objLabelEnd + 1;
    if (objValStart <= endCol) {
      worksheet.mergeCells(5, objValStart, 7, endCol);
      const objValCell = worksheet.getCell(5, objValStart);
      objValCell.value = (act.objetivo || '').toUpperCase();
      objValCell.font = { name: 'Segoe UI', size: 10 };
      objValCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    }

    // Row 6 LHS: FECHA (A6:B6) and Date Value (C6), LUGAR label (D6) and Place Value (E6 to themeValEnd)
    worksheet.mergeCells(6, 1, 6, mergeTemaLabelEnd);
    const fechaLabelCell = worksheet.getCell(6, 1);
    fechaLabelCell.value = 'FECHA:';
    fechaLabelCell.font = { name: 'Segoe UI', size: 10, bold: true };
    fechaLabelCell.alignment = { horizontal: 'left', vertical: 'middle' };

    const fechaValCell = worksheet.getCell(6, mergeTemaLabelEnd + 1);
    fechaValCell.value = act.fecha ? new Date(act.fecha).toLocaleDateString('es-ES') : '';
    fechaValCell.font = { name: 'Segoe UI', size: 10 };
    fechaValCell.alignment = { horizontal: 'left', vertical: 'middle' };

    if (mergeTemaLabelEnd + 2 <= themeValEnd) {
      const lugarLabelCell = worksheet.getCell(6, mergeTemaLabelEnd + 2);
      lugarLabelCell.value = 'LUGAR:';
      lugarLabelCell.font = { name: 'Segoe UI', size: 10, bold: true };
      lugarLabelCell.alignment = { horizontal: 'left', vertical: 'middle' };

      worksheet.mergeCells(6, mergeTemaLabelEnd + 3, 6, themeValEnd);
      const lugarValCell = worksheet.getCell(6, mergeTemaLabelEnd + 3);
      lugarValCell.value = (act.lugar || '').toUpperCase();
      lugarValCell.font = { name: 'Segoe UI', size: 10 };
      lugarValCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    }

    // Row 7 LHS: HORA INICIO (A7:B7) and value (C7), HORA FINALIZACIÓN label (D7) and value (E7 to themeValEnd)
    worksheet.mergeCells(7, 1, 7, mergeTemaLabelEnd);
    const horaInicioLabelCell = worksheet.getCell(7, 1);
    horaInicioLabelCell.value = 'HORA INICIO:';
    horaInicioLabelCell.font = { name: 'Segoe UI', size: 10, bold: true };
    horaInicioLabelCell.alignment = { horizontal: 'left', vertical: 'middle' };

    const horaInicioValCell = worksheet.getCell(7, mergeTemaLabelEnd + 1);
    horaInicioValCell.value = act.horaInicio || act.hora_inicio || '';
    horaInicioValCell.font = { name: 'Segoe UI', size: 10 };
    horaInicioValCell.alignment = { horizontal: 'left', vertical: 'middle' };

    if (mergeTemaLabelEnd + 2 <= themeValEnd) {
      const horaFinLabelCell = worksheet.getCell(7, mergeTemaLabelEnd + 2);
      horaFinLabelCell.value = 'HORA FINALIZACIÓN:';
      horaFinLabelCell.font = { name: 'Segoe UI', size: 10, bold: true };
      horaFinLabelCell.alignment = { horizontal: 'left', vertical: 'middle' };

      worksheet.mergeCells(7, mergeTemaLabelEnd + 3, 7, themeValEnd);
      const horaFinValCell = worksheet.getCell(7, mergeTemaLabelEnd + 3);
      horaFinValCell.value = act.horaFin || act.hora_fin || '';
      horaFinValCell.font = { name: 'Segoe UI', size: 10 };
      horaFinValCell.alignment = { horizontal: 'left', vertical: 'middle' };
    }

    // Format all cells in Info Card rows 5-7 (c=1..endCol)
    for (let r = 5; r <= 7; r++) {
      for (let c = 1; c <= endCol; c++) {
        // Only format cells that actually exist inside active bounding box
        const cell = worksheet.getCell(r, c);
        cell.border = borderStyle;
        if (!cell.fill) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF' }
          };
        }
      }
    }

    // Space Row 8 Height
    worksheet.getRow(8).height = 12;

    // Row 9 Headers formatting and setting
    worksheet.getRow(9).height = 36;
    columnsDef.forEach((col, colIdx) => {
      const cell = worksheet.getCell(9, colIdx + 1);
      cell.value = col.header;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2E75B6' } // High-contrast Steel Blue
      };
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.border = borderStyle;
    });

    // Populate rows with participant data and embed digital signatures
    for (let attendeeIdx = 0; attendeeIdx < attendeeRows.length; attendeeIdx++) {
      const rowCells = attendeeRows[attendeeIdx];
      const rIdx = 10 + attendeeIdx;
      const row = worksheet.getRow(rIdx);

      // Determine height of the row based on the availability of a physical signature
      const hasFirmaImg = rowCells.some((val, colIndex) => {
        const key = activeKeys[colIndex];
        return key === 'firma' && val && val.startsWith('data:image');
      });

      row.height = hasFirmaImg ? 60 : 25;

      for (let colIndex = 0; colIndex < rowCells.length; colIndex++) {
        const val = rowCells[colIndex];
        const key = activeKeys[colIndex];
        const cell = worksheet.getCell(rIdx, colIndex + 1);

        // Grid lines formatting
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } },
        };
        cell.font = { name: 'Segoe UI', size: 10 };

        // Center specific columns
        if (['index', 'firma', 'genero', 'rango_edad', 'comuna', 'discapacidad', 'certificado_discapacidad', 'tipo_discapacidad', 'victima'].includes(key)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }

        if (key === 'firma' && val && val.startsWith('data:image')) {
          try {
            const trimmedSig = await trimImage(val, 6);
            const cleanBase64Sig = cleanBase64(trimmedSig);
            const sigImgId = workbook.addImage({
              base64: cleanBase64Sig,
              extension: 'png',
            });
            worksheet.addImage(sigImgId, {
              tl: { col: colIndex + 0.05, row: rIdx - 1 + 0.05 } as any,
              br: { col: colIndex + 1.05, row: rIdx - 1 + 1.05 } as any,
              editAs: 'oneCell'
            });
            cell.value = ''; // Clean background text so raw Base64 data is never printed
          } catch (err) {
            console.warn('Error inserting signature image in ExcelJS:', err);
            cell.value = 'FIRMA';
          }
        } else {
          cell.value = val;
        }
      }
    }

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Asistencia_${act.tema || act.nombre || 'Actividad'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Safe remove to prevent "Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node'"
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
    } catch (e) {
      console.error('Error generating Excel file with ExcelJS:', e);
    }
    
    setIsExportColumnsOpen(false);
  };

  const renderExportColumnsModal = () => {
    if (!isExportColumnsOpen) return null;
    return (
      <Dialog.Root open={isExportColumnsOpen} onOpenChange={setIsExportColumnsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-[4px] z-[150] transition-all" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[32px] shadow-2xl z-[151] overflow-hidden outline-none border border-slate-100 flex flex-col max-h-[85vh] animate-scaleIn">
            <div className="bg-brand-green p-6 text-white flex items-center justify-between shrink-0">
              <Dialog.Title className="text-lg font-display font-black uppercase tracking-wide">Seleccionar columnas para exportar</Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-white/80 hover:text-white transition-colors cursor-pointer outline-none">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar columnas..."
                  value={exportColumnsSearch}
                  onChange={(e) => setExportColumnsSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition-all outline-none animate-fadeIn"
                />
              </div>

               {/* Select All Toggle */}
              <div className="border-b border-slate-100 pb-2">
                <button
                  onClick={toggleAllColumns}
                  className="flex items-center gap-2.5 py-1.5 px-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  <div className="w-5 h-5 rounded border border-brand-green bg-emerald-50/50 flex items-center justify-center text-brand-green relative transition-all">
                    <span className="w-2.5 h-0.5 bg-brand-green rounded-sm"></span>
                  </div>
                  {allMarked ? 'Desmarcar todas' : 'Marcar todas'}
                </button>
              </div>

              {/* Scrollable Column List */}
              <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                {filteredColumns.map(col => (
                  <button
                    key={col.key}
                    onClick={() => {
                      setSelectedColumns(prev => ({
                        ...prev,
                        [col.key]: !prev[col.key]
                      }));
                    }}
                    className="w-full flex items-center gap-3 py-2 text-left hover:bg-slate-50 rounded-lg px-2 transition-colors group cursor-pointer"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0",
                      selectedColumns[col.key]
                        ? "bg-brand-green border-brand-green text-white"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
                    )}>
                      {selectedColumns[col.key] && (
                        <svg className="w-3.5 h-3.5 stroke-current stroke-[3px] fill-none" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">{col.title}</span>
                  </button>
                ))}
                {filteredColumns.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs font-semibold animate-fadeIn">
                    No se encontraron columnas que coincidan.
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button
                onClick={() => setIsExportColumnsOpen(false)}
                className="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateExcel}
                className="flex-1 py-3.5 bg-brand-green hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-brand-green/20 cursor-pointer"
              >
                Generar Excel
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  };

  const filteredActividades = useMemo(() => {
    return actividades
      .filter(act => {
        const matchesSearch = (act.nombre || act.tema || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (act.lugar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (act.linea || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (act.dependencia || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        if (dateFilter) {
          return matchesSearch && act.fecha?.startsWith(dateFilter);
        }
        return matchesSearch;
      })
      .sort((a, b) => {
        // First try by fecha_creacion descending (newest first)
        const dateA = a.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0;
        const dateB = b.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0;
        
        if (dateA !== dateB && (dateA !== 0 || dateB !== 0)) {
          return dateB - dateA;
        }
        
        // Fallback to _id descending if hex MongoDB ID
        if (a._id && b._id) {
          return b._id.toString().localeCompare(a._id.toString());
        }
        
        return 0;
      });
  }, [actividades, searchTerm, dateFilter]);

  const paginatedActividades = useMemo(() => {
    const startIndex = (currentPageActividades - 1) * actividadesPerPage;
    return filteredActividades.slice(startIndex, startIndex + actividadesPerPage);
  }, [filteredActividades, currentPageActividades, actividadesPerPage]);

  const availableAssistants = useMemo(() => {
    const isMeeting = viewMode === 'meeting' || formData.tipo === 'Reunión';
    let list = isMeeting ? [...allAsistentes] : [...allBeneficiarios];
    
    // Filter by line if Nueva Actividad
    if (!isMeeting && viewMode === 'activity' && user?.lineaTrabajo && user.rol !== 'admin') {
      const userLineId = user.lineaTrabajo;
      list = list.filter(b => b.linea_trabajo === userLineId || b.linea_nombre === userLineId);
    }

    // Search by name or cedula
    if (assistantSearch) {
      const query = assistantSearch.toLowerCase();
      list = list.filter(b => 
        (b.nombre_completo || '').toLowerCase().includes(query) ||
        (b.numero_documento || '').toLowerCase().includes(query)
      );
    }

    // Filter by date (if beneficiaries have a registration date?)
    if (assistantDateFilter) {
      list = list.filter(b => b.fecha_registro?.startsWith(assistantDateFilter));
    }

    // Sort: selected first
    return list;
  }, [allBeneficiarios, allAsistentes, viewMode, formData.tipo, user, assistantSearch, assistantDateFilter]);

  const toggleAssistant = (beneficiary: any) => {
    if (selectedAssistants.find(a => a._id === beneficiary._id)) {
      setSelectedAssistants(prev => prev.filter(a => a._id !== beneficiary._id));
    } else {
      setSelectedAssistants(prev => [...prev, beneficiary]);
    }
  };

  if (viewMode === 'detail' && selectedActDetail) {
    const act = selectedActDetail;
    const realAsistentes = (act.asistentes_detalles && act.asistentes_detalles.length > 0) 
      ? act.asistentes_detalles 
      : (act.asistentes || []);
    const confirmados = realAsistentes.length || 0;
    
    return (
      <>
        <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fadeIn">
        {/* Header Visual */}
        <div className="bg-gradient-to-r from-brand-green to-brand-blue rounded-[32px] p-6 md:p-10 text-white shadow-xl relative overflow-hidden text-center">
          <div className="relative z-10 space-y-2">
            <h2 className="text-4xl font-display font-black tracking-tight uppercase">{act.tema || act.nombre}</h2>
            <p className="text-white/90 font-medium text-base">
              Detalles de la actividad y gestión de asistentes
            </p>
          </div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -ml-20 -mt-20" />
        </div>

        {/* Action Bar / Back Navigation */}
        <div className="px-2">
          <button 
            onClick={() => setViewMode('list')}
            className="w-full flex items-center justify-center gap-3 py-4 bg-brand-green hover:bg-emerald-700 text-white rounded-[20px] shadow-lg shadow-brand-green/20 transition-all font-black text-lg group"
          >
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>Volver atras</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (Tabs) */}
          <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col min-h-[600px] overflow-hidden">
            {/* Tab Header */}
            <div className="flex border-b border-slate-50 px-8">
              <button 
                onClick={() => setActiveTab('info')}
                className={cn(
                  "py-6 px-8 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 border-b-4 transition-all",
                  activeTab === 'info' 
                    ? "border-brand-blue text-brand-blue" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <FileText size={16} />
                Información
              </button>
              <button 
                onClick={() => setActiveTab('assistants')}
                className={cn(
                  "py-6 px-8 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 border-b-4 transition-all",
                  activeTab === 'assistants' 
                    ? "border-brand-blue text-brand-blue" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <Users size={16} />
                Asistentes
              </button>
            </div>

            <div className="p-8 flex-1">
              {activeTab === 'info' ? (
                <div className="space-y-12">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-full bg-brand-green text-white py-4 px-8 rounded-xl font-black text-center text-lg shadow-lg shadow-brand-green/20">
                      Detalles de la Actividad
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-10 pl-4">
                    <div className="flex gap-6 items-start">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                        <Target size={22} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Objetivo</p>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed max-w-2xl">{act.objetivo || 'Sin objetivo definido'}</p>
                      </div>
                    </div>

                    <div className="flex gap-6 items-start">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                        <Calendar size={22} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Fecha</p>
                        <p className="text-sm font-bold text-slate-700">{new Date(act.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="flex gap-6 items-start">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                        <Clock size={22} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Horario</p>
                        <p className="text-sm font-bold text-slate-700">{act.horaInicio} - {act.horaFin}</p>
                      </div>
                    </div>

                    <div className="flex gap-6 items-start">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                        <MapPin size={22} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Lugar</p>
                        <p className="text-sm font-bold text-slate-700">{act.lugar}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <div className="bg-brand-blue px-6 py-2 rounded-lg text-white font-black text-sm uppercase">Lista de Asistentes</div>
                     <p className="text-[10px] font-bold text-slate-400">{confirmados} de {confirmados} asistentes registrados</p>
                   </div>

                   <div className="overflow-x-auto rounded-[20px] border border-slate-100 min-h-[400px]">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="bg-brand-green text-white">
                           <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase">Nombre</th>
                           <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-center">Documento</th>
                           <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-center">Asistencia</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {realAsistentes
                            .slice((currentPageAsistentes - 1) * asistentesPerPage, currentPageAsistentes * asistentesPerPage)
                            .map((asistenteItem: any, index: number) => {
                            const isObject = typeof asistenteItem === 'object' && asistenteItem !== null;
                            const idValue = isObject ? (asistenteItem.beneficiario_id || asistenteItem._id) : asistenteItem;
                            const reactKey = idValue || `asistente-${index}`;
                            
                            // Try to find in allBeneficiarios
                            let beneficiary = allBeneficiarios.find(b => b._id === idValue || b.id === idValue) || allAsistentes.find(b => b._id === idValue || b.id === idValue);
                            
                            // If still not fully resolved, maybe data is in the asistenteItem itself
                            let nombre = beneficiary?.nombre_completo || beneficiary?.nombre;
                            let doc = beneficiary?.numero_documento || beneficiary?.cedula;
                            
                            if ((!nombre || !doc) && isObject) {
                              nombre = nombre || asistenteItem.nombre_beneficiario || asistenteItem.nombre_completo || asistenteItem.nombre;
                              doc = doc || asistenteItem.documento_beneficiario || asistenteItem.numero_documento || asistenteItem.cedula || asistenteItem.documento;
                            }
                            
                            nombre = nombre || 'Desconocido / Eliminado';
                            doc = doc || '---';

                            return (
                              <tr key={reactKey} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-5 text-xs font-bold text-slate-700">{nombre}</td>
                                <td className="px-6 py-5 text-xs font-bold text-slate-400 text-center">
                                  {doc.toString().toLowerCase().includes('cédula') || doc.toString().toLowerCase().includes('cedula') ? doc : `Cédula: ${doc}`}
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-full">
                                    <CheckCircle size={12} /> Asistió
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {realAsistentes.length === 0 && (
                            <tr>
                              <td colSpan={3} className="py-20 text-center italic text-slate-400 text-xs">No hay asistentes registrados</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="p-6 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/30">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          Asistentes totales: <span className="text-slate-900">{realAsistentes.length}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Mostrar:</span>
                          <select 
                            value={asistentesPerPage}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setAsistentesPerPage(val);
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

                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button 
                          onClick={() => setCurrentPageAsistentes(p => Math.max(1, p - 1))}
                          disabled={currentPageAsistentes === 1}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        
                        <div className="flex items-center gap-1 mx-2">
                          <span className="text-xs font-bold text-slate-400 uppercase">Página</span>
                          <span className="w-8 h-8 bg-brand-green text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-brand-green/20">
                            {currentPageAsistentes}
                          </span>
                          <span className="text-xs font-bold text-slate-400 uppercase">de {Math.ceil(realAsistentes.length / asistentesPerPage) || 1}</span>
                        </div>

                        <button 
                          onClick={() => setCurrentPageAsistentes(p => Math.min(Math.ceil(realAsistentes.length / asistentesPerPage), p + 1))}
                          disabled={currentPageAsistentes === Math.ceil(realAsistentes.length / asistentesPerPage) || Math.ceil(realAsistentes.length / asistentesPerPage) === 0}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                        >
                          <ChevronRight size={18} />
                        </button>
                     </div>
                    </div>
                 </div>
               )}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            {/* Estadísticas Card */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 space-y-10">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] pb-4 border-b border-slate-50">Estadísticas</h4>
              
              <div className="space-y-8 pl-2">
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total de asistentes</p>
                  <p className="text-3xl font-display font-black text-slate-800">{confirmados}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Asistencia confirmada</p>
                  <p className="text-2xl font-display font-black text-slate-600">{confirmados} (100%)</p>
                </div>
              </div>

              <button 
                onClick={() => setIsExportColumnsOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-brand-green hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-brand-green/20"
              >
                <FileText size={16} /> EXPORTAR A EXCEL
              </button>
            </div>

            {/* Acciones Rápidas Card */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 space-y-8">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] pb-4 border-b border-slate-50">Acciones Rápidas</h4>
              
              <div className="space-y-4">
                <button 
                  onClick={() => openEditForm(act)}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-pink-500 text-pink-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-pink-50 transition-all"
                >
                  <Pencil size={14} /> EDITAR ACTIVIDAD
                </button>
                <button 
                  onClick={() => handleDelete(act._id)}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-brand-red text-brand-red rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-all"
                >
                  <Trash2 size={14} /> ELIMINAR ACTIVIDAD
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
        {renderDeleteConfirmModal()}
        {renderExportColumnsModal()}
      </>
    );
  }

  if (viewMode !== 'list') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-green to-brand-blue rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-4">
            <button 
              onClick={() => setViewMode('list')}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl backdrop-blur-md transition-all border border-white/20"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-3xl font-display font-black tracking-tight">
                {editingId ? 'Editar Actividad' : (viewMode === 'activity' ? 'Nueva Actividad' : 'Nueva Reunión')}
              </h2>
              <p className="text-white/80 font-medium text-sm mt-0.5">
                {editingId 
                  ? 'Modifica los detalles de la actividad existente'
                  : (viewMode === 'activity' ? 'Registra una nueva actividad en el sistema' : 'Organiza una nueva reunión con los asistentes')}
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-brand-green px-8 py-4">
                <h3 className="text-white font-bold text-sm tracking-wide uppercase">Información Básica</h3>
              </div>
              <form onSubmit={handleCreate} className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <FormInput 
                    label={viewMode === 'activity' ? 'Tema de la actividad *' : 'Tema de la reunión *'}
                    icon={<Calendar size={18} />}
                    value={formData.tema}
                    onChange={(val) => setFormData({...formData, tema: val})}
                    placeholder={viewMode === 'activity' ? "Ej: Taller de Emprendimiento" : "Ej: Reunión de coordinación del equipo"}
                    required
                  />
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1 mb-1">
                      <Target size={12} className="text-brand-green" />
                      Objetivo *
                    </label>
                    <textarea 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-green transition-all min-h-[120px] resize-none"
                      placeholder="Describa el objetivo principal..."
                      value={formData.objetivo}
                      onChange={(e) => setFormData({...formData, objetivo: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput 
                      label="Lugar *"
                      icon={<MapPin size={18} />}
                      value={formData.lugar}
                      onChange={(val) => setFormData({...formData, lugar: val})}
                      placeholder="Ej: Sala de juntas, Piso 3"
                      required
                    />
                    <FormInput 
                      label="Dependencia *"
                      icon={<Building2 size={18} />}
                      value={formData.dependencia}
                      onChange={(val) => setFormData({...formData, dependencia: val})}
                      placeholder="Ej: Departamento de Recursos Humanos"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormInput 
                      label={viewMode === 'activity' ? 'Fecha de la actividad' : 'Fecha de la reunión'}
                      icon={<Calendar size={18} />}
                      type="date"
                      value={formData.fecha}
                      onChange={(val) => setFormData({...formData, fecha: val})}
                      required
                    />
                    <FormInput 
                      label="Hora de inicio"
                      icon={<Clock size={18} />}
                      type="time"
                      value={formData.horaInicio}
                      onChange={(val) => setFormData({...formData, horaInicio: val})}
                      required
                    />
                    <FormInput 
                      label="Hora de fin"
                      icon={<Clock size={18} />}
                      type="time"
                      value={formData.horaFin}
                      onChange={(val) => setFormData({...formData, horaFin: val})}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1 mb-1">
                      <Layers size={12} className="text-brand-green" />
                      Línea de Trabajo
                    </label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-brand-green transition-all appearance-none cursor-pointer"
                      value={formData.lineaTrabajo}
                      onChange={(e) => setFormData({...formData, lineaTrabajo: e.target.value})}
                    >
                      {lineas.map(l => (
                        <option key={l._id} value={l.nombre}>{l.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    type="submit"
                    className="flex items-center gap-2 px-10 py-4 bg-brand-green hover:bg-emerald-700 text-white rounded-[20px] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand-green/20"
                  >
                    <Save size={18} />
                    {editingId ? 'ACTUALIZAR ACTIVIDAD' : (viewMode === 'activity' ? 'GUARDAR ACTIVIDAD' : 'GUARDAR REUNIÓN')}
                  </button>
                </div>

                {error && <p className="text-brand-red text-xs font-bold text-center">{error}</p>}
                {success && <p className="text-emerald-600 text-xs font-bold text-center">{success}</p>}
              </form>
            </div>
          </div>

          {/* Sidebar Asistentes */}
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[700px]">
              <div className="bg-brand-green px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-white" />
                  <h3 className="text-white font-bold text-sm tracking-wide uppercase">Asistentes</h3>
                </div>
                <div className="relative group">
                  <input 
                    type="date" 
                    className="bg-white/10 text-white text-[10px] rounded-lg px-2 py-1 outline-none border border-white/20 focus:bg-white/20 transition-all font-bold placeholder:text-white/50"
                    value={assistantDateFilter}
                    onChange={(e) => setAssistantDateFilter(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 border-b border-slate-50 space-y-4">
                {viewMode === 'meeting' && availableAssistants.length > 0 && (
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Seleccionar asistentes ({availableAssistants.length} disponibles)
                    </p>
                    <button 
                      onClick={() => {
                        if (selectedAssistants.length === availableAssistants.length) {
                          setSelectedAssistants([]);
                        } else {
                          setSelectedAssistants([...availableAssistants]);
                        }
                      }}
                      className="text-[9px] font-black text-brand-green uppercase tracking-widest hover:underline"
                    >
                      {selectedAssistants.length === availableAssistants.length ? 'DESMARCAR TODOS' : 'SELECCIONAR TODOS'}
                    </button>
                  </div>
                )}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar por documento o nombre..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-1 focus:ring-brand-green transition-all"
                    value={assistantSearch}
                    onChange={(e) => setAssistantSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {availableAssistants.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-400 font-bold italic">No se encontraron beneficiarios</p>
                  </div>
                ) : (
                  availableAssistants.map((b) => {
                    const isSelected = selectedAssistants.find(a => a._id === b._id);
                    return (
                      <button 
                        key={b._id}
                        onClick={() => toggleAssistant(b)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group",
                          isSelected 
                            ? "bg-brand-green/5 border-brand-green/20 ring-1 ring-brand-green/10" 
                            : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                          isSelected 
                            ? "bg-brand-green border-brand-green text-white" 
                            : "bg-slate-50 border-slate-200 group-hover:border-slate-300"
                        )}>
                          {isSelected && <CheckCircle size={12} strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-slate-800 truncate leading-tight group-hover:text-brand-green transition-colors">
                            {b.nombre_completo}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold tracking-tight">
                            {b.tipo_documento}: {b.numero_documento}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Asistentes seleccionados ({selectedAssistants.length})
                  </p>
                  <button 
                    onClick={() => setSelectedAssistants([])}
                    className="text-[9px] font-black text-brand-red uppercase tracking-widest flex items-center gap-1 hover:underline"
                  >
                    <Trash2 size={10} />
                    LIMPIAR TODO
                  </button>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {selectedAssistants.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic font-medium">Ningún asistente seleccionado</p>
                  ) : (
                    selectedAssistants.map(a => (
                      <div key={a._id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm animate-fadeIn">
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black text-slate-800 truncate leading-none mb-0.5">{a.nombre_completo}</p>
                          <p className="text-[8px] text-slate-400 font-bold tracking-tight">Registrado: {a.fecha_registro?.split('T')[0] || 'N/A'}</p>
                        </div>
                        <button 
                          onClick={() => toggleAssistant(a)}
                          className="text-slate-300 hover:text-brand-red p-1 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Visual */}
      <div className="bg-gradient-to-r from-brand-green to-brand-blue rounded-[32px] p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <h2 className="text-4xl font-display font-black tracking-tight">Gestión de Actividades</h2>
          <p className="text-white/90 font-medium text-sm">
            Administra reuniones, actividades y eventos de la Alcaldía de Quibdó
          </p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -mr-20 -mt-20" />
      </div>

      {/* Stats Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
        <StatsCard 
          label="TOTAL ACTIVIDADES" 
          value={stats.activitiesCount} 
          icon={<Calendar className="text-[#00a859]" size={24} />} 
        />
        <StatsCard 
          label="REUNIONES" 
          value={stats.meetings} 
          icon={<Clock className="text-brand-green" size={24} />} 
        />
        <StatsCard 
          label="ESTE MES" 
          value={stats.thisMonth} 
          icon={<Calendar className="text-[#00a859]" size={24} />} 
        />
        <StatsCard 
          label="TOTAL ASISTENTES" 
          value={stats.totalAssistants} 
          icon={<Users className="text-brand-green" size={24} />} 
          subValue={`PROMEDIO: ${stats.total > 0 ? Math.round(stats.totalAssistants / stats.total) : 30} POR ACTIVIDAD`}
        />
      </div>

      {/* List Area */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h3 className="text-xl font-display font-black text-slate-800 tracking-tight">Listado de Actividades</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                const userLine = lineas.find(l => l._id === user?.lineaTrabajo || l.nombre === user?.lineaTrabajo)?.nombre || lineas[0]?.nombre || '';
                setFormData({
                  tema: '',
                  objetivo: '',
                  lugar: '',
                  dependencia: 'Secretaría de Inclusión y Cohesión Social',
                  fecha: new Date().toISOString().split('T')[0],
                  horaInicio: '08:00',
                  horaFin: '10:00',
                  lineaTrabajo: userLine,
                  tipo: 'Actividad'
                });
                setSelectedAssistants([]);
                setViewMode('activity');
              }}
              className="w-full sm:w-auto justify-center bg-brand-green hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-lg shadow-brand-green/20 transition-all flex items-center gap-2"
            >
              <Plus size={16} strokeWidth={2.5} />
              NUEVA ACTIVIDAD
            </button>
            <button
              onClick={() => {
                const userLine = lineas.find(l => l._id === user?.lineaTrabajo || l.nombre === user?.lineaTrabajo)?.nombre || lineas[0]?.nombre || '';
                setFormData({
                  tema: '',
                  objetivo: '',
                  lugar: '',
                  dependencia: 'Secretaría de Inclusión y Cohesión Social',
                  fecha: new Date().toISOString().split('T')[0],
                  horaInicio: '08:00',
                  horaFin: '10:00',
                  lineaTrabajo: userLine,
                  tipo: 'Reunión'
                });
                setSelectedAssistants([]);
                setViewMode('meeting');
              }}
              className="w-full sm:w-auto justify-center bg-white hover:bg-slate-50 text-brand-green font-black text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-2xl border-2 border-brand-green transition-all flex items-center gap-2"
            >
              <Users size={16} strokeWidth={2.5} />
              NUEVA REUNIÓN
            </button>
          </div>
        </div>

        <div className="p-8 pb-0 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por tema, lugar, dependencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-brand-green placeholder:text-slate-400 transition-all shadow-inner"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="relative w-full md:w-64">
            <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-11 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-brand-green transition-all shadow-inner text-slate-400"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-brand-green text-white">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest rounded-tl-2xl flex items-center gap-2">
                    <Tag size={12} /> TEMA
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} /> FECHA Y HORA
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} /> LUGAR
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Building2 size={12} /> DEPENDENCIA
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Users size={12} /> ASISTENTES
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest rounded-tr-2xl text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="p-8 text-center"><div className="w-8 h-8 border-4 border-slate-100 border-t-brand-green rounded-full animate-spin mx-auto"></div></td>
                    </tr>
                  ))
                ) : filteredActividades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center">
                      <div className="space-y-3">
                        <FileText size={48} className="text-slate-200 mx-auto" />
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay registros que coincidan con la búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedActividades.map((act) => (
                    <tr key={act._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-6 border-b border-slate-50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-brand-green transition-colors">{act.tema || act.nombre}</p>
                            {act._isOffline && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-black uppercase rounded-md tracking-wider border border-amber-200 animate-pulse">
                                Local
                              </span>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-brand-green text-[9px] font-black uppercase rounded-md border border-emerald-100">
                             <Tag size={8} /> {act.tipo || 'Actividad'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6 border-b border-slate-50">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">{new Date(act.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{act.horaInicio} - {act.horaFin}</p>
                        </div>
                      </td>
                      <td className="px-6 py-6 border-b border-slate-50 text-xs font-bold text-slate-600">{act.lugar}</td>
                      <td className="px-6 py-6 border-b border-slate-50">
                        <p className="text-[10px] text-slate-500 font-bold leading-tight max-w-[200px]">{act.dependencia || 'Secretaría de Inclusión'}</p>
                      </td>
                      <td className="px-6 py-6 border-b border-slate-50">
                        <div className="flex items-center gap-2 text-xs font-black text-brand-green">
                          <Users size={14} />
                          {act.asistentes?.length || 0}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                             onClick={async () => {
                               setCurrentPageAsistentes(1);
                               setSelectedActDetail(act);
                               setViewMode('detail');
                               try {
                                 // 1. Fetch full details (will have populated asistentes if available natively)
                                 const isReunion = act.tipo?.toLowerCase().includes('reun');
                                 // We only added /api/actividades/:id but maybe we need it to just be /api/actividades/:id
                                 const endpoint = isReunion ? `/reuniones/${act._id}` : `/actividades/${act._id}`;
                                 const resDetail = await api.get('/actividades/' + act._id); // Always use actividades as we only have one collection API right now in server.ts
                                 
                                 // 2. Fetch attendance confirmation details too
                                 const resAsist = await api.get('/asistencia', { params: { actividad_id: act._id } });
                                 
                                 setSelectedActDetail((prev: any) => {
                                   if (!prev || prev._id !== act._id) return prev;
                                   
                                   let populated = resDetail.data?.asistentes_detalles || [];
                                   let attendance = resAsist.data || [];
                                   
                                   // If attendance exists, prefer that. If not, use populated natively
                                   const finalAsistentes = attendance.length > 0 ? attendance : populated;
                                   
                                   return { 
                                     ...resDetail.data,
                                     asistentes_detalles: finalAsistentes 
                                   };
                                 });
                               } catch (err) {
                                 console.log("Could not fetch detailed attendance.");
                               }
                             }}
                             className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100 shadow-sm bg-white"
                          >
                            <Calendar size={18} />
                          </button>
                          <button 
                            onClick={() => openEditForm(act)}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 shadow-sm bg-white"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(act._id)}
                            className="p-2.5 text-brand-red hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm bg-white"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 border-t border-slate-150 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/10 mt-4 rounded-b-2xl">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Actividades totales: <span className="text-slate-900">{filteredActividades.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Mostrar:</span>
                <select 
                  value={actividadesPerPage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setActividadesPerPage(val);
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

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button 
                type="button"
                onClick={() => setCurrentPageActividades(p => Math.max(1, p - 1))}
                disabled={currentPageActividades === 1}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Página</span>
                <span className="w-8 h-8 bg-brand-green text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-brand-green/20">
                  {currentPageActividades}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">de {Math.ceil(filteredActividades.length / actividadesPerPage) || 1}</span>
              </div>

              <button 
                type="button"
                onClick={() => setCurrentPageActividades(p => Math.min(Math.ceil(filteredActividades.length / actividadesPerPage), p + 1))}
                disabled={currentPageActividades === Math.ceil(filteredActividades.length / actividadesPerPage) || Math.ceil(filteredActividades.length / actividadesPerPage) === 0}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
      {renderDeleteConfirmModal()}
      {renderExportColumnsModal()}

      <AnimatePresence>
        {successToast && (
          <div className="fixed bottom-6 right-6 z-[120] max-w-sm w-full bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3 shadow-2xl shadow-emerald-950/10">
            <CheckCircle2 className="text-brand-green shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <span className="block text-xs font-black text-emerald-800 uppercase tracking-wider">Operación Exitosa</span>
              <p className="text-xs text-emerald-700 font-medium leading-relaxed">{successToast}</p>
            </div>
          </div>
        )}

        {errorToast && (
          <div className="fixed bottom-6 right-6 z-[120] max-w-sm w-full bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 shadow-2xl shadow-red-950/10">
            <AlertCircle className="text-brand-red shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <span className="block text-xs font-black text-brand-red uppercase tracking-wider">Error Operativo</span>
              <p className="text-xs text-red-700 font-medium leading-relaxed">{errorToast}</p>
            </div>
          </div>
        )}
      </AnimatePresence>

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
    </>
  );
}

function StatsCard({ label, value, icon, subValue }: { label: string, value: any, icon: React.ReactNode, subValue?: string }) {
  return (
    <div className="bg-white rounded-3xl p-7 border border-slate-50 shadow-sm flex flex-col justify-center h-36 hover:shadow-md transition-all group relative">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl border border-slate-100 flex items-center justify-center bg-white shadow-sm shrink-0">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-4xl font-black text-slate-800 tracking-tight leading-none">{value}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{label}</span>
        </div>
      </div>
      {subValue && (
        <div className="absolute bottom-4 left-7">
          <p className="text-[9px] font-black text-brand-green uppercase tracking-wider">{subValue}</p>
        </div>
      )}
    </div>
  );
}

function FormInput({ label, icon, value, onChange, placeholder, type = 'text', required = false }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1 mb-1">
        <span className="text-brand-green">{icon}</span>
        {label}
      </label>
      <input 
        type={type}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-green transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

