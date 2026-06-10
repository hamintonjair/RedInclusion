import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { Save, User, MapPin, HeartPulse, GraduationCap, ClipboardList } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { barriosPorComuna } from '../data/barriosPorComuna';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

import SignatureCanvas from 'react-signature-canvas';

const schema = z.object({
  nombre_completo: z.string().min(3, 'Mínimo 3 caracteres'),
  tipo_documento: z.string(),
  numero_documento: z.string().min(5, 'Documento inválido'),
  genero: z.string(),
  rango_edad: z.string(),
  sabe_leer: z.boolean(),
  sabe_escribir: z.boolean(),
  numero_celular: z.string().min(7, 'Mínimo 7 dígitos'),
  correo_electronico: z.string().email().optional().or(z.literal('')),
  etnia: z.string(),
  comuna: z.string().min(1, 'Requerido'),
  barrio: z.string().min(1, 'Requerido'),
  tiene_discapacidad: z.boolean(),
  tipo_discapacidad: z.string().optional().or(z.literal('')),
  nombre_cuidadora: z.string().optional().or(z.literal('')),
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

  const sigPad = React.useRef<any>(null);
  const sigContainerRef = React.useRef<HTMLDivElement>(null);
  const [isEditingSignature, setIsEditingSignature] = React.useState(false);

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


  // Validar cedula existente
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
    setIsSubmitting(true);
    // Capturar firma antes de enviar si hay algo en el pad
    if (sigPad.current && !sigPad.current.isEmpty()) {
      data.firma = sigPad.current.getCanvas().toDataURL('image/png');
    }

    try {
      if (editId) {
        await api.put(`/beneficiarios/${editId}`, data);
        alert('Información actualizada exitosamente.');
      } else {
        const payload = {
          ...data,
          funcionario_id: user?.id,
          funcionario_nombre: user?.nombreCompleto || 'Administrador del Sistema',
          linea_trabajo: user?.lineaTrabajo || 'No Aplica',
          fecha_registro: new Date().toISOString()
        };
        await api.post('/beneficiarios', payload);
        alert('Beneficiario registrado exitosamente.');
      }
      navigate('/beneficiarios');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al procesar la solicitud.');
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
              <InputField label="Nombre Completo" {...register('nombre_completo')} error={errors.nombre_completo?.message} />
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
                  {...register('numero_documento')} 
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
              <InputField label="Número de Celular" {...register('numero_celular')} error={errors.numero_celular?.message} />
              <div className="relative">
                <InputField 
                  label="Correo Electrónico" 
                  {...register('correo_electronico')} 
                  type="email" 
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
              <InputField label="Nombre de la Cuidadora" {...register('nombre_cuidadora')} />
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
            <h3 className="text-sm font-bold text-slate-800 text-left">Firma del Beneficiario</h3>
            
            <div className="border border-slate-200 rounded-xl p-6 flex flex-col items-center gap-6 bg-slate-50/30">
              {watch('firma') && !isEditingSignature ? (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="w-full max-w-lg h-48 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 shadow-inner">
                    <img src={watch('firma')} alt="Firma Guardada" className="max-w-full max-h-full object-contain" />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditingSignature(true);
                      setTimeout(() => sigPad.current?.clear(), 100);
                    }}
                    className="flex items-center gap-2 text-brand-green font-bold text-sm bg-white border border-brand-green/20 px-6 py-3 rounded-xl hover:bg-brand-green hover:text-white transition-all shadow-sm"
                  >
                    <PencilIcon size={16} /> CAMBIAR FIRMA
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div 
                    ref={sigContainerRef}
                    className="w-full max-w-lg h-60 bg-white rounded-xl border-2 border-dashed border-slate-300 relative overflow-hidden group"
                  >
                    <SignatureCanvas 
                      ref={sigPad}
                      penColor='black'
                      onEnd={saveSignature}
                      canvasProps={{
                        className: "signature-canvas cursor-crosshair w-full h-full"
                      }} 
                    />
                    {(!watch('firma') || isEditingSignature) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
                        <p className="text-slate-500 font-display italic text-3xl select-none">
                          {watch('nombre_completo') || 'Firme aquí'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => {
                        sigPad.current?.clear();
                        setValue('firma', '');
                      }}
                      className="px-6 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors"
                    >
                      LIMPIAR
                    </button>
                    {editId && watch('firma') && (
                      <button 
                        type="button" 
                        onClick={() => setIsEditingSignature(false)}
                        className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                      >
                        CANCELAR
                      </button>
                    )}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-slate-400 text-center italic max-w-md">
                Por favor, asegúrese de que la firma sea legible. Si utiliza un dispositivo móvil, puede firmar directamente con su dedo sobre el recuadro punteado.
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
        "w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all placeholder:text-slate-300",
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
        "w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all appearance-none cursor-pointer",
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

