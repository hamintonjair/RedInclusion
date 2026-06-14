import React from 'react';
import { Smartphone, Shield, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pt-[env(safe-area-inset-top,0px)]">
      {/* Header Fijo Estilo Alcaldía */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <img 
            src="/icon.png" 
            alt="Logo Alcladía" 
            className="h-9 w-9 rounded-lg border border-slate-200 object-contain shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">Alcaldía de Quibdó</h1>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Sistema Red de Inclusión</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <Shield size={14} className="text-emerald-500" />
          <span>Ley 1581 de 2012</span>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <Shield size={24} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Política de Privacidad y Protección de Datos Personales</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Última actualización: 13 de junio, 2026</p>
          </div>

          <div className="prose prose-slate prose-sm max-w-none space-y-6">
            <section className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">1. Introducción y Marco Legal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                La <strong>Alcaldía de Quibdó</strong>, identificada con las normativas locales vigentes en Colombia, a través de su Secretaría de Inclusión y Cohesión Social, presenta esta Política de Tratamiento de Información y Datos Personales en cumplimiento estricto de la <strong>Ley Estatutaria 1581 de 2012</strong>, el <strong>Decreto 1377 de 2013</strong> y demás normas concordantes para la recolección, almacenamiento, uso y sincronización de datos de los ciudadanos y beneficiarios de los programas de inclusión en la ciudad de Quibdó.
              </p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-900 mb-2">2. Datos Recolectados y Finalidad</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Nuestra aplicación móvil y plataforma web procesa datos de carácter socioeconómico de la población vulnerable y personas registradas con el fin exclusivo de:
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex gap-2 items-start">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Identificación única de beneficiarios sociales en las diferentes comunas y barrios de Quibdó.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Seguimiento y focalización de coberturas de las diferentes líneas de trabajo social de la Alcaldía.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Generar reportes estadísticos y mapas sectorizados de atención para el mejoramiento continuo de las políticas públicas locales.</span>
                </li>
              </ul>
            </section>

            <section className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900 mb-2">3. Uso de Permisos y Almacenamiento</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                La aplicación móvil de la <strong>Red de Inclusión Social</strong> puede solicitar permisos de almacenamiento de archivos temporales únicamente para posibilitar el funcionamiento del motor de sincronización offline (sin conexión a internet). Este proceso facilita a los funcionarios estatales registrar la información en zonas rurales y asentamientos dispersos de Quibdó sin requerir conectividad constante. Ninguna información confidencial de su dispositivo es compartida con terceros.
              </p>
            </section>

            <section className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900 mb-2">4. Derechos del Titular (Habeas Data)</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                De conformidad con el artículo 8 de la Ley 1581 de 2012, usted como titular de la información posee los siguientes derechos constitucionales consagrados:
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex gap-2 items-start">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Conocer, actualizar y rectificar sus datos personales frente a las dependencias de la Secretaría de Inclusión.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Ser informado por la administración respecto al uso que se le ha dado a sus datos proporcionados.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Revocar la autorización y/o solicitar la supresión del dato cuando en el tratamiento no se respeten los principios, derechos y garantías constitucionales y legales.</span>
                </li>
              </ul>
            </section>

            <section className="border-t border-slate-100 pt-5 bg-slate-50/50 p-4 rounded-xl border border-slate-100/80">
              <h3 className="text-sm font-bold text-slate-900 mb-2">5. Canales de Atención al Ciudadano</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Si desea ejercer sus derechos de consulta, reclamo o rectificación, o ante cualquier inquietud respecto al tratamiento de su privacidad, puede manifestarlo escribiendo directamente a:
              </p>
              <div className="mt-3 space-y-1.5 text-xs">
                <p className="text-slate-700"><strong>Entidad Responsable:</strong> Alcaldía de Quibdó - Chocó, Colombia</p>
                <p className="text-slate-700"><strong>Dependencia:</strong> Secretaría de Inclusión Social y Cohesión Social</p>
                <p className="text-slate-700"><strong>Canal Virtual de Soporte / Enlaces Corporativos:</strong> alcaldia@quibdo-choco.gov.co</p>
              </div>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center sm:text-left">
              © 2026 Alcaldía de Quibdó • Todos los derechos reservados.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              Volver al Inicio de Sesión
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
