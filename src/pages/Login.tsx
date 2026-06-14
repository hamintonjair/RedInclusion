import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Building2, AlertCircle, Loader2, Smartphone, Download, Share, X, Apple, ExternalLink, Shield, Globe } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isIosModalOpen, setIsIosModalOpen] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password) {
      setError('Por favor ingrese correo y contraseña');
      return;
    }

    const success = await login(email.trim(), password);
    if (success) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      setError('Credenciales incorrectas. Verifique su correo y contraseña.');
    }
  };

  return (
    <div 
      className="flex flex-col md:flex-row min-h-screen md:pt-0"
      style={{
        paddingTop: typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform() 
          ? 'env(safe-area-inset-top, 24px)' 
          : '0px'
      }}
    >
      {/* Lado izquierdo con imagen (Banner de la Alcaldía) */}
      <div 
        className="flex w-full md:w-7/12 bg-white flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-100"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#00a859]/5 to-[#cc0000]/5 pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col items-center gap-6 w-full max-w-lg"
        >
          <div className="p-6 w-full flex justify-center">
            <img 
              src="/logo.png" 
              alt="Alcaldía de Quibdó" 
              referrerPolicy="no-referrer"
              className="w-full max-w-md object-contain"
            />
          </div>
          <div className="text-center">
            <p className="text-[#0066cc] font-black tracking-widest uppercase text-xs bg-slate-50 py-2.5 px-6 rounded-full inline-block shadow-sm border border-slate-100">
              Sistema de Inclusión Social
            </p>
          </div>
        </motion.div>
      </div>

      {/* Formulario de login - Lado Derecho */}
      <div 
        className="flex-1 w-full md:w-5/12 flex flex-col justify-center px-4 py-8"
        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}
      >
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto w-full max-w-md bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          <div className="p-8 md:p-10">
            <div className="flex flex-col items-center mb-8">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-[#00a859]/30"
                style={{ backgroundColor: '#00a859' }}
              >
                <Lock size={28} />
              </div>
              
              <h1 
                className="text-[32px] font-bold mb-2 tracking-tight"
                style={{ color: '#00a859' }}
              >
                Iniciar Sesión
              </h1>
              
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={20} style={{ color: '#00a859' }} />
                <span className="font-medium" style={{ color: '#0066cc' }}>
                  Alcaldía de Quibdó
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-3 p-3.5 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100"
                  >
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label 
                  htmlFor="email" 
                  className="block text-[11px] font-bold uppercase tracking-wider px-1 text-[#00a859]"
                >
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-transparent border-2 rounded-xl outline-none transition-colors text-slate-700 font-medium focus:border-[#00a859]"
                  style={{ borderColor: 'rgba(0,168,89, 0.4)' }}
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <label 
                  htmlFor="password" 
                  className="block text-[11px] font-bold uppercase tracking-wider px-1 text-[#00a859]"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-transparent border-2 rounded-xl outline-none transition-colors text-slate-700 font-medium focus:border-[#00a859]"
                  style={{ borderColor: 'rgba(0,168,89, 0.4)' }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-4 px-4 rounded-xl text-white font-bold text-[15px] transition-transform hover:-translate-y-[2px] active:translate-y-0 mt-6 disabled:opacity-70 disabled:hover:translate-y-0"
                style={{ 
                  background: 'linear-gradient(135deg, #00a859 0%, #0066cc 100%)',
                  boxShadow: '0 6px 20px rgba(0,168,89,0.3)'
                }}
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'Iniciar Sesión'}
              </button>
            </form>

            {/* Sección de Descargas de la App Oficial */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3.5">
                Descarga la App Oficial
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                {/* Opción 1: APKPure Store */}
                <a
                  href="https://apkpure.com/Red-de-Inclusion-Quibdo/com.quibdo.inclusion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer group text-center min-h-[90px]"
                >
                  <div className="text-[#24cd77] group-hover:scale-110 transition-transform mb-1.5 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight block">
                    APKPure
                  </span>
                  <span className="text-[8px] text-[#24cd77] font-bold uppercase tracking-wide leading-tight mt-1">
                    Ver Tienda
                  </span>
                </a>

                {/* Opción 2: Descarga Directa en Google Drive */}
                <a
                  href="https://drive.google.com/drive/folders/1IX61CJPPfRxUGl5oC6hAMjM8TM2nj5uv?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer group text-center min-h-[90px]"
                >
                  <Download size={20} className="text-[#00a859] group-hover:scale-110 transition-transform mb-1.5" />
                  <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight block">
                    Directa Drive
                  </span>
                  <span className="text-[8px] text-[#00a859] font-bold uppercase tracking-wide leading-tight mt-1">
                    Descargar APK
                  </span>
                </a>

                {/* Opción 3: iPhone / iOS PWA */}
                <button
                  type="button"
                  onClick={() => setIsIosModalOpen(true)}
                  className="flex flex-col items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer group text-center min-h-[90px]"
                >
                  <Smartphone size={20} className="text-[#0066cc] group-hover:scale-110 transition-transform mb-1.5" />
                  <span className="text-[10px] font-extrabold text-[#0066cc] uppercase tracking-tight block">
                    iPhone / iOS
                  </span>
                  <span className="text-[8px] text-[#0066cc] font-semibold uppercase tracking-wide leading-tight mt-1">
                    Ver Guía PWA
                  </span>
                </button>
              </div>

              <div className="text-center pt-2 border-t border-slate-100/50">
                <button
                  type="button"
                  onClick={() => navigate('/politica-privacidad')}
                  className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#00a859] hover:text-[#00904a] transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <Shield size={12} className="text-emerald-500" />
                  <span>Política de Privacidad y de Datos</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        {/* Modal: Guía iOS PWA */}
        <AnimatePresence>
          {isIosModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl border border-slate-100"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-[#0066cc]/10 rounded-lg text-[#0066cc]">
                        <Smartphone size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Aplicación en iPhone / iOS</h3>
                    </div>
                    <button
                      onClick={() => setIsIosModalOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Header visual de la app */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3 mb-6">
                    <img 
                      src="/icon.png" 
                      alt="Logo App" 
                      className="w-11 h-11 rounded-xl shadow-sm border border-slate-200" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Red de Inclusión Quibdó</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Instalación instantánea sin App Store</p>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 mb-4">
                    Sigue estos sencillos pasos para agregar la app a tu pantalla de inicio:
                  </p>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Asegúrate de estar abriendo esta página desde el navegador oficial <strong className="text-slate-800 font-extrabold">Safari</strong> en tu iPhone o iPad.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Toca el botón oficial de <strong className="text-[#0066cc] font-extrabold">Compartir <Share size={12} className="inline-block relative -top-0.5" /></strong> en la barra de navegación de Safari (el cuadro con la flecha apuntando hacia arriba).
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Desplázate hacia abajo en el menú de compartición y selecciona <strong className="text-slate-800 font-extrabold">"Agregar a inicio"</strong> o <strong className="text-slate-800 font-extrabold">"Añadir a pantalla de inicio"</strong>.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#00a859] text-white flex items-center justify-center text-[10px] font-black shrink-0">4</div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Presiona <strong className="text-[#00a859] font-extrabold">"Fijar"</strong> o <strong className="text-[#00a859] font-extrabold">"Agregar"</strong> en la esquina superior derecha y ¡listo! Ya tienes el acceso directo premium directamente en tu teléfono.
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 flex justify-end">
                    <button
                      onClick={() => setIsIosModalOpen(false)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Entendido, cerrar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
