import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { Save, User, MapPin, HeartPulse, GraduationCap, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { barriosPorComuna } from '../data/barriosPorComuna';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

import SignatureCanvas from 'react-signature-canvas';

const schema = z.object({
  nombre_completo: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo debe contener texto'),
  tipo_documento: z.string(),
  numero_documento: z.string()
    .min(5, 'Documento inválido')
    .regex(/^\d+$/, 'El documento solo debe contener números'),
  genero: z.string(),
  rango_edad: z.string(),
  sabe_leer: z.boolean(),
  sabe_escribir: z.boolean(),
  numero_celular: z.string()
    .min(7, 'Mínimo 7 dígitos')
    .regex(/^\d+$/, 'El teléfono solo debe contener números'),
  correo_electronico: z.string()
    .email('Ingrese un correo electrónico válido (ej: usuario@correo.com)')
    .optional()
    .or(z.literal('')),
  etnia: z.string(),
  comuna: z.string().min(1, 'Requerido'),
  barrio: z.string().min(1, 'Requerido'),
  tiene_discapacidad: z.boolean(),
  tipo_discapacidad: z.string().optional().or(z.literal('')),
  nombre_cuidadora: z.string()
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/, 'El nombre de la cuidadora solo debe contener texto')
    .optional()
    .or(z.literal('')),
  labora_cuidadora: z.boolean().optional(),
  tiene_certificado_discapacidad: z.boolean().optional(),
  victima_conflicto: z.boolean(),
  hijos_a_cargo: z.string(),
  estudia_actualmente: z.boolean(),
  nivel_educativo: z.string(),
  situacion_laboral: z.string(),
  tipo_vivienda: z.string(),
  ayuda_humanitaria: z.boolean(),
  descripcion_ayuda_humanitaria: z.string().optional().or(z.literal('')),
  // New Migrantes fields
  eres_desplazado: z.boolean().optional(),
  mujeres_hogar: z.string().optional().or(z.literal('')),
  ninos_hogar: z.string().optional().or(z.literal('')),
  adolescentes_hogar: z.string().optional().or(z.literal('')),
  jovenes_hogar: z.string().optional().or(z.literal('')),
  madre_cabeza_familia: z.boolean().optional(),
  nombre_madre_cabeza: z.string().optional().or(z.literal('')),
  tipo_pobreza: z.string().optional().or(z.literal('')),
  firma: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export const Registro: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(!!editId);
  const [lineas, setLineas] = React.useState<any[]>([]);
  const [recordData, setRecordData] = React.useState<any>(null);
  const [checkingDoc, setCheckingDoc] = React.useState(false);
  const [docExists, setDocExists] = React.useState<{ exists: boolean; nombre: string | null } | null>(null);
  const [checkingEmail, setCheckingEmail] = React.useState(false);
  const [emailExists, setEmailExists] = React.useState<{ exists: boolean; nombre: string | null } | null>(null);
  const [successModal, setSuccessModal] = React.useState<{message: string; isUpdate: boolean} | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const sigPad = React.useRef<any>(null);
  const sigContainerRef = React.useRef<HTMLDivElement>(null);
  const [isEditingSignature, setIsEditingSignature] = React.useState(false);

  const [isFullScreenSignatureOpen, setIsFullScreenSignatureOpen] = React.useState(false);
  const fullScreenSigPad = React.useRef<any>(null);

  const openSignatureModal = async () => {
    setIsFullScreenSignatureOpen(true);
    
    // Detect mobile and try to rotate screen orientation programmatically
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    const orientation = window.screen && (window.screen.orientation as any);
    if (isMobile && orientation && typeof orientation.lock === 'function') {
      try {
        await orientation.lock('landscape');
      } catch (err) {
        console.log("Orientation lock not supported without fullscreen mode restriction", err);
      }
    }
  };

  const closeSignatureModal = () => {
    setIsFullScreenSignatureOpen(false);
    const orientation = window.screen && (window.screen.orientation as any);
    if (orientation && typeof orientation.unlock === 'function') {
      try {
        orientation.unlock();
      } catch (err) {
        console.log("Could not unlock orientation:", err);
      }
    }
  };

  // Asegurar que el canvas tenga el tamaño correcto al mostrarse
  React.useEffect(() => {
    if ((isEditingSignature || !editId) && sigPad.current && sigContainerRef.current) {
      const canvas = sigPad.current.getCanvas();
      const container = sigContainerRef.current;
      if (canvas && container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        sigPad.current.clear(); // Limpiar para resetear el estado interno del canvas tras redimensionar
      }
    }
  }, [isEditingSignature, editId]);

  React.useEffect(() => {
    if (isFullScreenSignatureOpen) {
      // Delay slightly to allow the modal paint to complete perfectly
      const timer = setTimeout(() => {
        if (fullScreenSigPad.current) {
          const canvas = fullScreenSigPad.current.getCanvas();
          if (canvas) {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect) {
              canvas.width = rect.width;
              canvas.height = rect.height;
              fullScreenSigPad.current.clear();
            }
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFullScreenSignatureOpen]);

  React.useEffect(() => {
    const handleResize = () => {
      if (isFullScreenSignatureOpen && fullScreenSigPad.current) {
        const canvas = fullScreenSigPad.current.getCanvas();
        if (canvas) {
          const rect = canvas.parentElement?.getBoundingClientRect();
          if (rect) {
            canvas.width = rect.width;
            canvas.height = rect.height;
            fullScreenSigPad.current.clear();
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isFullScreenSignatureOpen]);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo_documento: 'Cédula',
      genero: 'Femenino',
      rango_edad: '26-35',
      sabe_leer: true,
      sabe_escribir: true,
      tiene_discapacidad: false,
      labora_cuidadora: false,
      tiene_certificado_discapacidad: false,
      victima_conflicto: false,
      hijos_a_cargo: '0',
      estudia_actualmente: false,
      nivel_educativo: 'Primaria completa',
      situacion_laboral: 'Desempleado',
      tipo_vivienda: 'Propia',
      ayuda_humanitaria: false,
      etnia: 'Ninguna',
      descripcion_ayuda_humanitaria: '',
      eres_desplazado: false,
      mujeres_hogar: '0',
      ninos_hogar: '0',
      adolescentes_hogar: '0',
      jovenes_hogar: '0',
      madre_cabeza_familia: false,
      nombre_madre_cabeza: '',
      tipo_pobreza: 'Pobreza extrema (A)',
      firma: '',
    }
  });

  const selectedComuna = watch('comuna');
  const hasDiscapacidad = watch('tiene_discapacidad');
  const hasAyuda = watch('ayuda_humanitaria');
  const hasMadreCabeza = watch('madre_cabeza_familia');
  const numero_doc = watch('numero_documento');
  const email = watch('correo_electronico');

  const userLineaNombre = React.useMemo(() => {
    const targetLinea = editId ? recordData?.linea_trabajo : user?.lineaTrabajo;
    if (!targetLinea || targetLinea === 'admin') return '';
    const found = lineas.find(l => l._id === targetLinea || l.nombre === targetLinea);
    return found ? found.nombre : targetLinea;
  }, [editId, recordData, user, lineas]);


  const isMigrantesLine = userLineaNombre.toLowerCase().includes('migrante') || userLineaNombre.toLowerCase().includes('población migrante');

  React.useEffect(() => {
    if (editId) return; // No validar si estamos editando
    const trimmed = numero_doc?.toString().trim();
    if (!trimmed || trimmed.length < 5) {
      setDocExists(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDoc(true);
      try {
        const res = await api.get(`/beneficiarios/check/${trimmed}`);
        setDocExists(res.data);
      } catch (err) {
        console.error('Error checking documento:', err);
      } finally {
        setCheckingDoc(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [numero_doc, editId]);

  // Validar correo existente
  React.useEffect(() => {
    if (editId) return;
    const trimmed = email?.toString().trim();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailExists(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await api.get(`/beneficiarios/check-email/${trimmed}`);
        setEmailExists(res.data);
      } catch (err) {
        console.error('Error checking email:', err);
      } finally {
        setCheckingEmail(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [email, editId]);

  React.useEffect(() => {
    const fetchLineas = async () => {
      try {
        const response = await api.get('/lineas');
        setLineas(response.data || []);
      } catch (error) {
        console.error('Error fetching lineas:', error);
      }
    };
    fetchLineas();

    if (editId) {
      const fetchBeneficiario = async () => {
        try {
          const response = await api.get(`/beneficiarios?search=${editId}`);
          // The API returns { data: [...], total: ... }
          const beneficiarioData = response.data?.data?.[0] || (Array.isArray(response.data) ? response.data[0] : response.data);
          
          if (beneficiarioData) {
            console.log('Loading beneficiario:', beneficiarioData);
            setRecordData(beneficiarioData);
            const formattedData = {
              ...beneficiarioData,
              tipo_vivienda: beneficiarioData.tipo_vivienda || beneficiarioData.tenencia_vivienda || 'Propia',
              descripcion_ayuda_humanitaria: beneficiarioData.descripcion_ayuda_humanitaria || beneficiarioData.tipo_ayuda || '',
              hijos_a_cargo: (beneficiarioData.hijos_a_cargo ?? '0').toString(),
              // Ensure boolean fields are indeed booleans
              sabe_leer: !!beneficiarioData.sabe_leer,
              sabe_escribir: !!beneficiarioData.sabe_escribir,
              tiene_discapacidad: !!beneficiarioData.tiene_discapacidad,
              victima_conflicto: !!beneficiarioData.victima_conflicto,
              estudia_actualmente: !!beneficiarioData.estudia_actualmente,
              ayuda_humanitaria: !!beneficiarioData.ayuda_humanitaria,
              labora_cuidadora: !!beneficiarioData.labora_cuidadora,
              tiene_certificado_discapacidad: !!beneficiarioData.tiene_certificado_discapacidad,
              // Migrantes fields
              eres_desplazado: !!beneficiarioData.eres_desplazado,
              mujeres_hogar: (beneficiarioData.mujeres_hogar ?? '0').toString(),
              ninos_hogar: (beneficiarioData.ninos_hogar ?? '0').toString(),
              adolescentes_hogar: (beneficiarioData.adolescentes_hogar ?? '0').toString(),
              jovenes_hogar: (beneficiarioData.jovenes_hogar ?? '0').toString(),
              madre_cabeza_familia: !!beneficiarioData.madre_cabeza_familia,
              nombre_madre_cabeza: beneficiarioData.nombre_madre_cabeza ?? '',
              tipo_pobreza: beneficiarioData.tipo_pobreza ?? 'Pobreza extrema (A)',
            };
            reset(formattedData);
            if (beneficiarioData.firma) {
              setIsEditingSignature(false);
            } else {
              setIsEditingSignature(true);
            }
          } else {
            console.warn('No beneficiario found for ID:', editId);
          }
        } catch (error) {
          console.error('Error fetching beneficiary:', error);
          alert('Error al cargar datos del beneficiario.');
        } finally {
          setLoading(false);
        }
      };
      fetchBeneficiario();
    }
  }, [editId, reset]);

  const clearSignature = () => {
    sigPad.current?.clear();
    setValue('firma', '');
  };

  const saveSignature = () => {
    if (sigPad.current && !sigPad.current.isEmpty()) {
      // Use getCanvas() instead of getTrimmedCanvas() to avoid the trim-canvas dependency error in some environments
      const signatureData = sigPad.current.getCanvas().toDataURL('image/png');
      setValue('firma', signatureData);
    }
  };

  const barrios = barriosPorComuna.find(c => c.comuna === selectedComuna)?.barrios || [];

  const onSubmit = async (data: FormData) => {
    // Verificar si el documento ya está registrado en la base de datos para prevenir duplicados
    if (!editId && docExists?.exists) {
      setErrorMessage(`El número de documento "${numero_doc}" ya se encuentra registrado a nombre de "${docExists.nombre}". No se permiten registros duplicados en ninguna línea de trabajo.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const currentFirma = watch('firma') || data.firma;
    const inlinePadHasSignature = sigPad.current && !sigPad.current.isEmpty();
    
    if (!currentFirma && !inlinePadHasSignature) {
      setErrorMessage('La firma del beneficiario es un campo obligatorio para guardar el registro. Por favor, firme utilizando el botón de firma digital.');
      setTimeout(() => setErrorMessage(null), 6000);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    // Capturar firma antes de enviar si hay algo en el pad
    if (inlinePadHasSignature) {
      data.firma = sigPad.current.getCanvas().toDataURL('image/png');
    } else {
      data.firma = currentFirma;
    }

    try {
      if (editId) {
        await api.put(`/beneficiarios/${editId}`, data);
        setSuccessModal({
          message: '¡La información municipal del beneficiario ha sido actualizada de manera formal y guardada en el servidor!',
          isUpdate: true
        });
      } else {
        const payload = {
          ...data,
          funcionario_id: user?.id,
          funcionario_nombre: user?.nombreCompleto || 'Administrador del Sistema',
          linea_trabajo: user?.lineaTrabajo || 'No Aplica',
          fecha_registro: new Date().toISOString()
        };
        await api.post('/beneficiarios', payload);
        setSuccessModal({
          message: '¡Registrado con éxito! El nuevo beneficiario ha sido sumado al censo de la Red de Inclusión de Quibdó.',
          isUpdate: false
        });
      }
      setTimeout(() => {
        setSuccessModal(null);
        navigate('/beneficiarios');
      }, 2500);
    } catch (error: any) {
      console.error('Error saving:', error);
      setErrorMessage(error.response?.data?.error || 'Ocurrió un error inesperado al procesar el registro del beneficiario. Intente nuevamente.');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">Cargando información...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header Metadata */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputField 
          label="Nombre del Funcionario" 
          value={user?.nombreCompleto || 'Administrador del Sistema'} 
          readOnly 
          className="bg-slate-50/50"
        />
        <InputField 
          label="Línea de Trabajo" 
          value={
            (() => {
              if (editId) {
                const targetLinea = recordData?.linea_trabajo;
                const found = lineas.find(l => l._id === targetLinea || l.nombre === targetLinea);
                return found ? found.nombre : (targetLinea || 'No Aplica');
              }
              if (user?.rol === 'admin') return 'Todas las Líneas';
              const targetLinea = user?.lineaTrabajo;
              const found = lineas.find(l => l._id === targetLinea || l.nombre === targetLinea);
              return found ? found.nombre : (targetLinea || 'No Aplica');
            })()
          } 
          readOnly 
          className="bg-slate-50/50"
        />
        <InputField 
          label="Fecha de Registro" 
          value={new Date().toLocaleDateString()} 
          readOnly 
          className="bg-slate-50/50"
          type="text"
        />
      </div>

      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
          <ClipboardList size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">
            {editId ? 'Formulario de Edición de Habitantes' : 'Registro de Datos de la Persona'}
          </h2>
          <p className="text-sm text-slate-500">
            {editId ? 'Actualice los datos personales y socioeconómicos del beneficiario.' : 'Complete la información para ingresar al sistema de beneficios.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Personal Data */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-brand-green font-display">Datos de la persona</h3>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Nombre Completo" 
                {...register('nombre_completo', {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
                  }
                })} 
                error={errors.nombre_completo?.message} 
              />
              <SelectField label="Tipo de Documento" {...register('tipo_documento')} error={errors.tipo_documento?.message}>
                <option value="Cédula">Cédula</option>
                <option value="Tarjeta de Identidad">Tarjeta de Identidad</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Registro Civil">Registro Civil</option>
                <option value="PPT - Permiso por Protección Temporal">PPT - Permiso por Protección Temporal</option>
                <option value="PEP - Permiso Especial de Permanencia">PEP - Permiso Especial de Permanencia</option>
                <option value="Cédula de extranjería">Cédula de extranjería</option>
              </SelectField>
              <div className="relative">
                <InputField 
                  label="Número de Documento" 
                  {...register('numero_documento', {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      e.target.value = e.target.value.replace(/\D/g, '');
                    }
                  })} 
                  error={errors.numero_documento?.message} 
                  className={cn(
                    docExists?.exists && "border-red-500",
                    docExists && !docExists.exists && "border-green-500"
                  )}
                />
                <div className="absolute right-3 top-[32px] flex items-center gap-2">
                  {checkingDoc && (
                    <div className="w-4 h-4 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin"></div>
                  )}
                  {docExists && !checkingDoc && (
                    docExists.exists ? (
                      <div className="text-red-500">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      </div>
                    ) : (
                      <div className="text-green-500">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )
                  )}
                </div>
                {docExists?.exists && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"
                  >
                    <div className="text-red-600 shrink-0 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <p className="text-[10px] font-bold text-red-800 leading-tight">
                      ¡ALERTA! Este documento ya existe: <span className="uppercase">{docExists.nombre}</span>.
                    </p>
                  </motion.div>
                )}
                {docExists && !docExists.exists && (
                  <p className="text-[10px] text-green-600 font-bold mt-1 ml-1 px-1">✓ Documento libre para registro</p>
                )}
              </div>
              <SelectField label="Género" {...register('genero')}>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
                <option value="Prefiero no decir">Prefiero no decir</option>
              </SelectField>
              <SelectField label="Rango de Edad" {...register('rango_edad')}>
                <option value="0-12">0-12</option>
                <option value="13-18">13-18</option>
                <option value="19-25">19-25</option>
                <option value="26-35">26-35</option>
                <option value="36-45">36-45</option>
                <option value="46-55">46-55</option>
                <option value="56-65">56-65</option>
                <option value="66 o más">66 o más</option>
              </SelectField>
              <ToggleField label="¿Sabe leer?" checked={watch('sabe_leer')} onChange={(v) => setValue('sabe_leer', v)} />
              <ToggleField label="¿Sabe escribir?" checked={watch('sabe_escribir')} onChange={(v) => setValue('sabe_escribir', v)} />
              <InputField 
                label="Número de Celular" 
                {...register('numero_celular', {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    e.target.value = e.target.value.replace(/\D/g, '');
                  }
                })} 
                error={errors.numero_celular?.message} 
              />
              <div className="relative">
                <InputField 
                  label="Correo Electrónico" 
                  {...register('correo_electronico')} 
                  type="email" 
                  error={errors.correo_electronico?.message}
                  className={cn(
                    emailExists?.exists && "border-red-500",
                    emailExists && !emailExists.exists && "border-green-500"
                  )}
                />
                <div className="absolute right-3 top-[32px] flex items-center gap-2">
                  {checkingEmail && (
                    <div className="w-4 h-4 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin"></div>
                  )}
                  {emailExists && !checkingEmail && (
                    emailExists.exists ? (
                      <div className="text-red-500">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      </div>
                    ) : (
                      <div className="text-green-500">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )
                  )}
                </div>
                {emailExists?.exists && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 ml-1 px-1">Este correo ya está registrado a nombre de: {emailExists.nombre}</p>
                )}
                {emailExists && !emailExists.exists && (
                  <p className="text-[10px] text-green-600 font-bold mt-1 ml-1 px-1">✓ Correo disponible</p>
                )}
              </div>
              <SelectField label="Etnia" {...register('etnia')}>
                <option value="Afrodescendiente">Afrodescendiente</option>
                <option value="Indígena">Indígena</option>
                <option value="Raizal">Raizal</option>
                <option value="Palenquero">Palenquero</option>
                <option value="Mestizo">Mestizo</option>
                <option value="Otro (especificar)">Otro (especificar)</option>
                <option value="Ninguna">Ninguna</option>
              </SelectField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <SelectField label="Comuna" {...register('comuna')} error={errors.comuna?.message}>
                <option value="">Seleccione Comuna</option>
                {barriosPorComuna.map(c => <option key={c.comuna} value={c.comuna}>{c.comuna}</option>)}
              </SelectField>
              
              {selectedComuna === 'Zonas Rurales' ? (
                <InputField label="Nombre de la Vereda/Corregimiento" {...register('barrio')} error={errors.barrio?.message} />
              ) : (
                <SelectField label="Barrio" {...register('barrio')} disabled={!selectedComuna} error={errors.barrio?.message}>
                  <option value="">Seleccione Barrio</option>
                  {barrios.map(b => <option key={b.nombre} value={b.nombre}>{b.nombre}</option>)}
                </SelectField>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Disability */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <ToggleField label="¿Tiene alguna discapacidad?" checked={hasDiscapacidad} onChange={(v) => setValue('tiene_discapacidad', v)} />
            <ToggleField label="¿Es víctima del conflicto armado? (Opcional)" checked={watch('victima_conflicto')} onChange={(v) => setValue('victima_conflicto', v)} />
          </div>

          {hasDiscapacidad && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100"
            >
              <SelectField label="Tipo de Discapacidad" {...register('tipo_discapacidad')}>
                <option value="Física">Física</option>
                <option value="Visual">Visual</option>
                <option value="Auditiva">Auditiva</option>
                <option value="Psicosocial">Psicosocial</option>
                <option value="Cognitiva">Cognitiva</option>
                <option value="Múltiple">Múltiple</option>
              </SelectField>
              <InputField 
                label="Nombre de la Cuidadora" 
                {...register('nombre_cuidadora', {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
                  }
                })} 
                error={errors.nombre_cuidadora?.message}
              />
              <ToggleField label="¿Labora la Cuidadora?" checked={watch('labora_cuidadora')} onChange={(v) => setValue('labora_cuidadora', v)} />
              <ToggleField label="¿Tiene certificado de discapacidad?" checked={watch('tiene_certificado_discapacidad')} onChange={(v) => setValue('tiene_certificado_discapacidad', v)} />
            </motion.div>
          )}
        </div>

        {/* Section 3: Others */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Hijos a Cargo" type="number" {...register('hijos_a_cargo')} />
            <ToggleField label="¿Estudia actualmente? (Opcional)" checked={watch('estudia_actualmente')} onChange={(v) => setValue('estudia_actualmente', v)} />
            <SelectField label="Nivel Educativo" {...register('nivel_educativo')}>
              <option value="Primaria">Primaria</option>
              <option value="Secundaria">Secundaria</option>
              <option value="Técnico">Técnico</option>
              <option value="Tecnólogo">Tecnólogo</option>
              <option value="Universitario">Universitario</option>
              <option value="Posgrado">Posgrado</option>
              <option value="Ninguno">Ninguno</option>
            </SelectField>
            <SelectField label="Situación Laboral" {...register('situacion_laboral')}>
              <option value="Empleado">Empleado</option>
              <option value="Desempleado">Desempleado</option>
              <option value="Estudiante">Estudiante</option>
              <option value="Independiente">Independiente</option>
              <option value="Jubilado">Jubilado</option>
            </SelectField>
            <SelectField label="Tenencia de la vivienda" {...register('tipo_vivienda')}>
              <option value="Propia">Propia</option>
              <option value="Arrendada">Arrendada</option>
              <option value="Familiar">Familiar</option>
              <option value="Compartida">Compartida</option>
              <option value="Cedida / prestada">Cedida / prestada</option>
              <option value="En custodia">En custodia</option>
              <option value="Habitación / Inquilinato">Habitación / Inquilinato</option>
              <option value="Cambuche / Rancho">Cambuche / Rancho</option>
              <option value="Situación de calle">Situación de calle</option>
              <option value="Refugio / Albergue">Refugio / Albergue</option>
              <option value="Institucional">Institucional</option>
            </SelectField>
            <ToggleField label="¿Recibe ayuda humanitaria? (Opcional)" checked={hasAyuda} onChange={(v) => setValue('ayuda_humanitaria', v)} />
          </div>

          {hasAyuda && (
            <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="pt-4 border-t border-slate-100"
            >
              <InputField label="¿Qué tipo de ayuda recibe?" {...register('descripcion_ayuda_humanitaria')} placeholder="Especifique la ayuda humanitaria..." />
            </motion.div>
          )}
        </div>

        {/* Section: Migración (Conditional) */}
        {isMigrantesLine && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-bold text-brand-blue font-display">Información de Población Migrante</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ToggleField label="¿Eres desplazado?" checked={watch('eres_desplazado') || false} onChange={(v) => setValue('eres_desplazado', v)} />
              <SelectField label="Tipo de Pobreza (SISBEN)" {...register('tipo_pobreza')}>
                <option value="Pobreza extrema (A)">Pobreza extrema (A)</option>
                <option value="Pobreza moderada (B)">Pobreza moderada (B)</option>
                <option value="Vulnerable (C)">Vulnerable (C)</option>
                <option value="No pobre, no vulnerable">No pobre, no vulnerable</option>
                <option value="En proceso">En proceso</option>
                <option value="No tiene">No tiene</option>
              </SelectField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <InputField label="Mujeres en hogar" type="number" {...register('mujeres_hogar')} />
              <InputField label="Niños en hogar" type="number" {...register('ninos_hogar')} />
              <InputField label="Adolescentes en hogar" type="number" {...register('adolescentes_hogar')} />
              <InputField label="Jóvenes en hogar" type="number" {...register('jovenes_hogar')} />
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <ToggleField label="¿Hay madre cabeza de familia?" checked={hasMadreCabeza || false} onChange={(v) => setValue('madre_cabeza_familia', v)} />
              {hasMadreCabeza && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <InputField label="Nombre de la Madre Cabeza de Familia" {...register('nombre_madre_cabeza')} placeholder="Ingrese el nombre completo..." />
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: Signature */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 text-left">
              Firma del Beneficiario <span className="text-red-500 font-extrabold">*</span>
            </h3>
            
            <div className="border border-slate-200 rounded-xl p-6 flex flex-col items-center gap-6 bg-slate-50/30">
              {watch('firma') ? (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="w-full max-w-lg h-48 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 shadow-inner">
                    <img src={watch('firma')} alt="Firma Guardada" className="max-w-full max-h-full object-contain" />
                  </div>
                  
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Firma Capturada con Éxito
                  </span>

                  <button 
                    type="button" 
                    onClick={openSignatureModal}
                    className="flex items-center gap-2 text-[#00a859] hover:bg-[#00a859] hover:text-white border border-[#00a859]/20 font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm uppercase tracking-wider cursor-pointer font-sans"
                  >
                    <PencilIcon size={14} /> REHACER O FIRMAR DE NUEVO
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full py-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Firma Digital Obligatoria</h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Para continuar con el registro en el censo, es obligatorio capturar la firma digital de conformidad del beneficiario.
                    </p>
                  </div>

                  <button 
                    type="button" 
                    onClick={openSignatureModal}
                    className="flex items-center gap-2 text-white bg-[#00a859] hover:bg-[#00904a] font-black text-xs px-8 py-3.5 rounded-xl transition-all shadow-md shadow-[#00a859]/15 uppercase tracking-wider cursor-pointer font-sans"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Firmar Presencialmente
                  </button>
                </div>
              )}
              <p className="text-[10px] text-slate-400 text-center italic max-w-sm">
                Al hacer clic se habilitará el lienzo móvil rotado en pantalla completa para que firme con su dedo cómodamente en posición horizontal.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8">
          <button 
            type="button" 
            onClick={() => navigate('/beneficiarios')}
            className="flex-1 md:flex-none px-12 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors"
          >
            CANCELAR
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 md:flex-none px-12 py-4 bg-brand-green text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-xl shadow-brand-green/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save size={20} />
            )}
            {editId ? 'ACTUALIZAR PERSONA' : 'FINALIZAR REGISTRO'}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-[4px] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl border border-slate-100 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-emerald-50 text-brand-green rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-black text-slate-800 uppercase tracking-tight">
                  {successModal.isUpdate ? 'Actualización Exitosa' : 'Registro Completo'}
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  {successModal.message}
                </p>
              </div>
              <div className="pt-2">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.3, ease: 'linear' }}
                    className="bg-brand-green h-full"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-2">Redireccionando...</span>
              </div>
            </motion.div>
          </div>
        )}

        {errorMessage && (
          <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 shadow-xl shadow-red-900/5">
            <AlertCircle className="text-brand-red shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <span className="block text-xs font-black text-brand-red uppercase tracking-wider">Error de Validación</span>
              <p className="text-xs text-red-700 font-medium leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {isFullScreenSignatureOpen && (
          <div className="fixed inset-0 z-[140] bg-slate-900 flex flex-col text-white select-none">
            {/* Top Header / Bar */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-emerald-500/10 text-[#00a859] rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white leading-tight">Lienzo de Firma Oficial</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-none mt-0.5">
                    Beneficiario: <span className="text-emerald-400 font-extrabold">{watch('nombre_completo') || 'Registro de Censo'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSignatureModal}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 flex flex-col md:flex-row relative">
              
              {/* Optional warning when held in portrait mode on mobile/tablet */}
              <div className="portrait:flex landscape:hidden md:hidden absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="p-4 bg-emerald-500/5 rounded-full border border-emerald-500/10">
                  <DeviceRotateIllustration />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h4 className="text-lg font-black uppercase tracking-wider text-emerald-400">Girar Dispositivo</h4>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    Para una firma digital cómoda, amplia y de alta resolución, por favor coloque su teléfono en posición **Horizontal (Apaisado)**.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const forcePortraitOverride = document.querySelector('.portrait\\:flex');
                    if (forcePortraitOverride) {
                      forcePortraitOverride.classList.add('hidden');
                      forcePortraitOverride.classList.remove('portrait:flex');
                    }
                  }}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-slate-700"
                >
                  Continuar en Vertical
                </button>
              </div>

              {/* Sidebar/Controls Section */}
              <div className="w-full md:w-80 bg-slate-950 p-6 flex flex-col justify-between border-r border-slate-800 shrink-0 gap-6 text-left">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-[#00a859] border border-emerald-500/20">
                    Censo Oficial
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Dibuje su firma con su dedo o lápiz óptico sobre el área blanca. Asegúrese de que coincida con su documento de identidad.
                  </p>
                  
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Documento</span>
                    <p className="text-xs text-slate-300 font-extrabold font-mono">
                      {watch('tipo_documento') || 'No ingresado'}: {watch('numero_documento') || 'No ingresado'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (fullScreenSigPad.current) {
                        const signatureData = fullScreenSigPad.current.getCanvas().toDataURL('image/png');
                        if (fullScreenSigPad.current.isEmpty()) {
                          setErrorMessage('Por favor, dibuje una firma antes de guardar.');
                          setTimeout(() => setErrorMessage(null), 4000);
                          return;
                        }
                        setValue('firma', signatureData);
                        closeSignatureModal();
                      }
                    }}
                    className="w-full py-4 bg-[#00a859] hover:bg-[#00904a] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-950/50 cursor-pointer font-sans"
                  >
                    Guardar Firma
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      fullScreenSigPad.current?.clear();
                    }}
                    className="w-full py-3.5 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-slate-750 cursor-pointer font-sans"
                  >
                    Limpiar Lienzo
                  </button>

                  <button
                    type="button"
                    onClick={closeSignatureModal}
                    className="w-full py-3 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer font-sans"
                  >
                    Volver Atrás
                  </button>
                </div>
              </div>

              {/* Drawing Board Canvas Area */}
              <div className="flex-1 bg-white relative p-4 flex items-center justify-center min-h-[300px]">
                <div className="absolute inset-4 border-4 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden bg-slate-50">
                  <SignatureCanvas
                    ref={fullScreenSigPad}
                    penColor="black"
                    canvasProps={{
                      className: "absolute inset-0 w-full h-full cursor-crosshair",
                      style: { width: '100%', height: '100%' }
                    }}
                  />
                  
                  <div className="pointer-events-none opacity-[0.06] flex flex-col items-center justify-center select-none space-y-2 text-center">
                    <span className="text-3xl lg:text-5xl font-black uppercase tracking-wider text-slate-900 leading-none">
                      ÁREA DE FIRMA DIGITAL
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-900">
                      MUNICIPIO DE QUIBDÓ
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-components as shown in images
const InputField = React.forwardRef(({ label, error, className, ...props }: any, ref: any) => (
  <div className={cn("relative", className)}>
    <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-brand-green uppercase tracking-tight z-10 transition-colors">
      {label} {props.required && <span className="text-brand-red">**</span>}
    </label>
    <input 
      ref={ref}
      {...props}
      className={cn(
        "w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all placeholder:text-slate-300 text-slate-900",
        error && "border-brand-red ring-brand-red/20"
      )}
    />
    {error && <p className="text-[10px] text-brand-red font-bold mt-1 ml-1">{error}</p>}
  </div>
));

const SelectField = React.forwardRef(({ label, className, children, error, ...props }: any, ref: any) => (
  <div className={cn("relative", className)}>
    <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-brand-green uppercase tracking-tight z-10">
      {label} {props.required && <span className="text-brand-red">**</span>}
    </label>
    <select 
      ref={ref}
      {...props}
      className={cn(
        "w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all appearance-none cursor-pointer text-slate-900",
        error && "border-brand-red ring-brand-red/20"
      )}
    >
      {children}
    </select>
    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
    </div>
    {error && <p className="text-[10px] text-brand-red font-bold mt-1 ml-1">{error}</p>}
  </div>
));

const ToggleField = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-slate-600">{label}</label>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ring-transparent focus:ring-brand-green/20",
          checked ? "bg-brand-green shadow-inner" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
      <span className={cn("text-sm font-bold uppercase tracking-wider", checked ? "text-brand-green" : "text-slate-400")}>
        {checked ? 'Sí' : 'No'}
      </span>
    </div>
  </div>
);

const PencilIcon = ({ size, className }: any) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
);

const DeviceRotateIllustration = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 animate-pulse text-[#00a859]">
    <rect x="25" y="10" width="50" height="80" rx="8" fill="none" stroke="currentColor" strokeWidth="4" />
    <circle cx="50" cy="82" r="3" fill="currentColor" />
    <path d="M50 30 C30 30 15 45 15 65" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4,4" />
    <path d="M10 60 L15 65 L20 60" fill="none" stroke="currentColor" strokeWidth="3" />
    <text x="50" y="52" fontSize="12" fontWeight="black" textAnchor="middle" fill="currentColor" className="animate-bounce">↺</text>
  </svg>
);

