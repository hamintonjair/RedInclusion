import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Building2, AlertCircle, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted:', { email });
    setError('');
    
    if (!email.trim() || !password) {
      setError('Por favor ingrese correo y contraseña');
      return;
    }

    const success = await login(email.trim(), password);
    console.log('Login result:', success);
    if (success) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      setError('Credenciales incorrectas. Verifique su correo y contraseña.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
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
            <div className="mt-8 flex flex-col items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">v2.0.4-Sync-Final</span>
              <button 
                type="button"
                onClick={() => {
                  localStorage.clear();
                  if ('caches' in window) {
                    caches.keys().then(names => {
                      for (const name of names) {
                        caches.delete(name);
                      }
                    });
                  }
                  window.location.href = window.location.origin + '?v=' + Date.now();
                }}
                className="text-[10px] text-[#0066cc] underline cursor-pointer hover:text-[#00a859]"
              >
                Limpiar Cache y Forzar Actualización
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
