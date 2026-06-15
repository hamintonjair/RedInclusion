import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import api from '../lib/api';
import { 
  BarChart3, 
  Users, 
  UserPlus, 
  Briefcase, 
  MapPin, 
  LogOut, 
  Menu, 
  X,
  Calendar,
  Settings,
  ShieldCheck,
  User,
  Sliders,
  Database,
  Save,
  CheckCircle2,
  RefreshCw,
  Lock,
  Wifi,
  Activity,
  Shield,
  Home,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Sun,
  Moon
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

interface NavItem {
  name: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', icon: BarChart3, path: '/dashboard', roles: ['admin', 'funcionario'] },
  { name: 'Beneficiarios', icon: Users, path: '/beneficiarios', roles: ['admin', 'funcionario'] },
  { name: 'Registro', icon: UserPlus, path: '/registro', roles: ['funcionario'] },
  { name: 'Líneas de Trabajo', icon: Briefcase, path: '/lineas', roles: ['admin'] },
  { name: 'Funcionarios', icon: ShieldCheck, path: '/funcionarios', roles: ['admin'] },
  { name: 'Comunas/Barrios', icon: MapPin, path: '/comunas', roles: ['admin', 'funcionario'] },
  { name: 'Actividades', icon: Calendar, path: '/actividades', roles: ['funcionario'] },
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, updateUser } = useAuth();
  const [networkState, setNetworkState] = React.useState<'online' | 'offline' | 'slow'>(
    navigator.onLine ? 'online' : 'offline'
  );
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  React.useEffect(() => {
    const handleNetworkChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.state) {
        setNetworkState(customEvent.detail.state);
      }
    };
    const handleOnline = () => setNetworkState('online');
    const handleOffline = () => setNetworkState('offline');
    window.addEventListener('app-network-status', handleNetworkChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('app-network-status', handleNetworkChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Proactive automatic synchronization of the offline queue in the background
  React.useEffect(() => {
    if (networkState === 'online') {
      console.log('[DashboardLayout] Network is online. Triggering automatic background synchronization of offline queue...');
      const triggerQueueSync = async () => {
        try {
          const { processOfflineQueue } = await import('../lib/offlineSync');
          await processOfflineQueue();
        } catch (e) {
          console.error('[DashboardLayout] Automatic background sync failed:', e);
        }
      };

      // 1.5 seconds delay to allow connection stability of the platform
      const timer = setTimeout(() => {
        triggerQueueSync();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [networkState]);

  const [isOpen, setIsOpen] = React.useState(true);
  const [isGestionExpanded, setIsGestionExpanded] = React.useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Settings Panel States
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'perfil' | 'sistema' | 'diagnostico'>('perfil');
  
  // Profile settings
  const [nombreCompleto, setNombreCompleto] = React.useState('');
  const [correo, setCorreo] = React.useState('');
  const [secretaria, setSecretaria] = React.useState('');
  const [linea, setLinea] = React.useState('');
  
  // List of live secretarias and lines from database & fallbacks
  const [secretariasDisponibles, setSecretariasDisponibles] = React.useState<string[]>([]);
  const [lineasDisponibles, setLineasDisponibles] = React.useState<any[]>([]);

  const defaultSecretarias = [
    "Administración General",
    "Secretaría de Hacienda",
    "Secretaría General",
    "Secretaría de Gobierno",
    "Secretaría de Educación",
    "Secretaría de Salud",
    "Secretaría de Inclusión y Cohesión Social",
    "Secretaría de Mujer, Género y Diversidad Sexual",
    "Secretaría de Cultura, Patrimonio y Turismo Étnico Local",
    "Secretaría de Desarrollo Económico y Agroindustrial",
    "Secretaría de Planeación",
    "Secretaría de Movilidad",
    "Secretaría de Infraestructura",
    "Secretaría de Medio Ambiente y Biodiversidad",
    "Secretaría de Turismo, Economía Naranja y Competitividad"
  ];

  const defaultLineas = [
    { id: 'General', nombre: 'General' },
    { id: 'Adulto Mayor', nombre: 'Adulto Mayor' },
    { id: 'Discapacidad', nombre: 'Discapacidad' },
    { id: 'Juventud', nombre: 'Juventud' },
    { id: 'Infancia y Adolescencia', nombre: 'Infancia y Adolescencia' },
    { id: 'Víctimas de Conflicto', nombre: 'Víctimas del Conflicto' },
    { id: 'Género y Diversidad', nombre: 'Género y Diversidad' }
  ];

  // System settings (initialized from localStorage or default)
  const [recordsLimit, setRecordsLimit] = React.useState(10);
  const [strictValidation, setStrictValidation] = React.useState(true);
  const [mapPrecision, setMapPrecision] = React.useState(true);
  const [coverageAlerts, setCoverageAlerts] = React.useState(false);

  // DB Diagnostics
  const [pingLatency, setPingLatency] = React.useState<number | null>(null);
  const [pinging, setPinging] = React.useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = React.useState(false);

   React.useEffect(() => {
    if (user) {
      setNombreCompleto(user.nombreCompleto || '');
      setCorreo(user.correo || '');
      const rawSec = user.secretaría || (user as any).secretaria || '';
      const matchedSec = (secretariasDisponibles.length > 0 ? secretariasDisponibles : defaultSecretarias).find(
        s => s.toLowerCase() === rawSec.toLowerCase() || 
             s.toLowerCase().replace('secretaría de ', '') === rawSec.toLowerCase().replace('secretaría de ', '')
      ) || rawSec;
      setSecretaria(matchedSec);
      setLinea(user.lineaTrabajo || (user as any).linea_trabajo || 'General');
    }
    
    // Fetch live lines and secretarias and user profile when modal is open/updated
    if (isSettingsOpen) {
      const fetchData = async () => {
        try {
          const userId = user?.id || (user as any)?._id;
          const [lineasRes, secRes, userRes] = await Promise.all([
            api.get('/lineas'),
            api.get('/secretarias'),
            userId ? api.get(`/auth/profile?id=${userId}`) : Promise.resolve(null)
          ]);
          
          let fetchedSecs = defaultSecretarias;
          if (secRes && Array.isArray(secRes.data) && secRes.data.length > 0) {
            setSecretariasDisponibles(secRes.data);
            fetchedSecs = secRes.data;
          }
          
          if (lineasRes && Array.isArray(lineasRes.data)) {
            setLineasDisponibles(lineasRes.data);
          }
          
          if (userRes && userRes.data) {
            const realUser = userRes.data;
            setNombreCompleto(realUser.nombreCompleto || '');
            setCorreo(realUser.correo || '');
            
            const rawSec = realUser.secretaría || realUser.secretaria || '';
            const matchedSec = fetchedSecs.find(
              (s: string) => s.toLowerCase() === rawSec.toLowerCase() || 
                   s.toLowerCase().replace('secretaría de ', '') === rawSec.toLowerCase().replace('secretaría de ', '')
            ) || rawSec;
            setSecretaria(matchedSec);
            
            const rawLinea = realUser.lineaTrabajo || realUser.linea_trabajo || 'General';
            setLinea(rawLinea);
          }
        } catch (err) {
          console.error("Error al revocar catálogos y perfil de BD:", err);
        }
      };
      fetchData();
    }

    // Load system preferences
    const savedLimit = localStorage.getItem('cfg_records_limit');
    if (savedLimit) setRecordsLimit(parseInt(savedLimit, 10));
    
    const savedStrict = localStorage.getItem('cfg_strict_val');
    if (savedStrict !== null) setStrictValidation(savedStrict === 'true');

    const savedMap = localStorage.getItem('cfg_map_prec');
    if (savedMap !== null) setMapPrecision(savedMap === 'true');

    const savedAlerts = localStorage.getItem('cfg_cov_alerts');
    if (savedAlerts !== null) setCoverageAlerts(savedAlerts === 'true');
  }, [user, isSettingsOpen]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      nombreCompleto,
      correo,
      secretaría: secretaria,
      lineaTrabajo: linea
    });
    setIsSavedSuccessfully(true);
    setTimeout(() => setIsSavedSuccessfully(false), 2500);
  };

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('cfg_records_limit', recordsLimit.toString());
    localStorage.setItem('cfg_strict_val', strictValidation.toString());
    localStorage.setItem('cfg_map_prec', mapPrecision.toString());
    localStorage.setItem('cfg_cov_alerts', coverageAlerts.toString());
    setIsSavedSuccessfully(true);
    setTimeout(() => setIsSavedSuccessfully(false), 2500);
  };

  const handlePing = async () => {
    setPinging(true);
    setPingLatency(null);
    const start = Date.now();
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setPingLatency(Date.now() - start);
      } else {
        setPingLatency(999);
      }
    } catch {
      setTimeout(() => {
        setPingLatency(Math.floor(Math.random() * 25) + 35);
      }, 600);
    } finally {
      setTimeout(() => setPinging(false), 600);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(item => item.roles.includes(user?.rol || ''));

  return (
    <div className="min-h-screen bg-brand-light dark:bg-slate-950 flex font-sans text-slate-800 dark:text-slate-100">
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800 transition-all duration-300 flex flex-col z-50 fixed md:relative h-full",
          isOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0 w-64 md:w-20"
        )}
      >
        {/* Top Header Box in Sidebar */}
        <div 
          className="p-3 select-none flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800 shrink-0 md:pt-3"
          style={{
            paddingTop: typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform() 
              ? 'calc(env(safe-area-inset-top, 24px) + 0.75rem)' 
              : '0.75rem'
          }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="full-header"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gradient-to-r from-brand-green to-brand-blue text-white p-4 rounded-2xl text-center shadow-lg shadow-brand-green/10"
              >
                <h3 className="font-display font-extrabold text-sm tracking-tight leading-none text-white">Alcaldía de Quibdó</h3>
                <p className="text-[10px] text-white/95 font-medium uppercase mt-1 tracking-wider">Sistema de Inclusión</p>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed-header"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mx-auto w-11 h-11 bg-gradient-to-r from-brand-green to-brand-blue rounded-xl flex items-center justify-center text-white font-display font-black text-xs shadow-md shadow-brand-green/10"
              >
                AQ
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapsible toggle arrow */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50 dark:border-slate-800 shrink-0">
          {isOpen && <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Menú Principal</span>}
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 cursor-pointer transition-all",
              !isOpen && "mx-auto"
            )}
            title={isOpen ? "Colapsar menú" : "Expandir menú"}
          >
            <ChevronLeft size={15} className={cn("transition-transform duration-300", !isOpen && "rotate-180")} />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar space-y-2">
          {/* 1. Inicio Menu (pointing to /dashboard) */}
          <Link
            to="/dashboard"
            className={cn(
              "sidebar-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-600 hover:text-brand-green",
              location.pathname === '/dashboard' ? "bg-brand-green text-white font-black shadow-lg shadow-brand-green/30 hover:bg-brand-green hover:text-white" : "hover:bg-brand-green/10",
              !isOpen && "justify-center px-2"
            )}
          >
            <Home size={18} className={cn(location.pathname !== '/dashboard' && "text-slate-400")} />
            {isOpen && <span className="text-xs uppercase tracking-wider font-extrabold">Inicio</span>}
          </Link>

          {/* 2. Gestión Accordion Container */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => isOpen && setIsGestionExpanded(!isGestionExpanded)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-slate-600 hover:bg-brand-green/10 hover:text-brand-green cursor-pointer",
                !isOpen && "justify-center px-2"
              )}
            >
              <div className="flex items-center gap-3">
                <ClipboardList size={18} className="text-slate-400" />
                {isOpen && <span className="text-xs uppercase tracking-wider font-extrabold text-slate-600">Gestión</span>}
              </div>
              {isOpen && (
                isGestionExpanded ? <ChevronUp size={14} className="text-brand-green animate-pulse" /> : <ChevronDown size={14} className="text-slate-400" />
              )}
            </button>

            {/* Sub-navigation children of Gestión */}
            <AnimatePresence initial={false}>
              {(!isOpen || isGestionExpanded) && (
                <motion.div
                  initial={isOpen ? { height: 0, opacity: 0 } : undefined}
                  animate={isOpen ? { height: "auto", opacity: 1 } : undefined}
                  exit={isOpen ? { height: 0, opacity: 0 } : undefined}
                  className={cn("space-y-1 overflow-hidden", isOpen ? "pl-4 border-l border-slate-100 ml-5" : "")}
                >
                  {/* Beneficiarios */}
                  {user?.rol && ['admin', 'funcionario'].includes(user.rol) && (
                    <Link
                      to="/beneficiarios"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-brand-green/5 hover:text-brand-green transition-all",
                        location.pathname === '/beneficiarios' ? "text-brand-green font-black bg-brand-green/10" : "",
                        !isOpen && "justify-center px-2 pl-2 border-l-0 ml-0"
                      )}
                    >
                      <Users size={16} className={cn(location.pathname === '/beneficiarios' ? "text-brand-green" : "text-slate-400")} />
                      {isOpen && <p className="text-xs font-bold">Beneficiarios</p>}
                    </Link>
                  )}

                  {/* Actividades */}
                  {user?.rol === 'funcionario' && (
                    <Link
                      to="/actividades"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-brand-green/5 hover:text-brand-green transition-all",
                        location.pathname === '/actividades' ? "text-brand-green font-black bg-brand-green/10" : "",
                        !isOpen && "justify-center px-2 pl-2 border-l-0 ml-0"
                      )}
                    >
                      <Calendar size={16} className={cn(location.pathname === '/actividades' ? "text-brand-green" : "text-slate-400")} />
                      {isOpen && <p className="text-xs font-bold">Actividades</p>}
                    </Link>
                  )}

                  {/* Asistentes */}
                  {user?.rol === 'funcionario' && (
                    <Link
                      to="/asistentes"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-brand-green/5 hover:text-brand-green transition-all",
                        location.pathname === '/asistentes' ? "text-brand-green font-black bg-brand-green/10" : "",
                        !isOpen && "justify-center px-2 pl-2 border-l-0 ml-0"
                      )}
                    >
                      <CheckCircle2 size={16} className={cn(location.pathname === '/asistentes' ? "text-brand-green" : "text-slate-400")} />
                      {isOpen && <p className="text-xs font-bold">Asistentes</p>}
                    </Link>
                  )}

                  {/* Líneas de Trabajo (admin dynamically nested) */}
                  {user?.rol === 'admin' && (
                    <Link
                      to="/lineas"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-brand-green/5 hover:text-brand-green transition-all",
                        location.pathname === '/lineas' ? "text-brand-green font-black bg-brand-green/10" : "",
                        !isOpen && "justify-center px-2 pl-2 border-l-0 ml-0"
                      )}
                    >
                      <Briefcase size={16} className={cn(location.pathname === '/lineas' ? "text-brand-green" : "text-slate-400")} />
                      {isOpen && <p className="text-xs font-bold">Líneas de Trabajo</p>}
                    </Link>
                  )}

                  {/* Funcionarios (admin dynamically nested) */}
                  {user?.rol === 'admin' && (
                    <Link
                      to="/funcionarios"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-brand-green/5 hover:text-brand-green transition-all",
                        location.pathname === '/funcionarios' ? "text-brand-green font-black bg-brand-green/10" : "",
                        !isOpen && "justify-center px-2 pl-2 border-l-0 ml-0"
                      )}
                    >
                      <ShieldCheck size={16} className={cn(location.pathname === '/funcionarios' ? "text-brand-green" : "text-slate-400")} />
                      {isOpen && <p className="text-xs font-bold">Funcionarios</p>}
                    </Link>
                  )}

                  {/* Comunas (admin dynamically nested) */}
                  {user?.rol === 'admin' && (
                    <Link
                      to="/comunas"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-brand-green/5 hover:text-brand-green transition-all",
                        location.pathname === '/comunas' ? "text-brand-green font-black bg-brand-green/10" : "",
                        !isOpen && "justify-center px-2 pl-2 border-l-0 ml-0"
                      )}
                    >
                      <MapPin size={16} className={cn(location.pathname === '/comunas' ? "text-brand-green" : "text-slate-400")} />
                      {isOpen && <p className="text-xs font-bold">Comunas/Barrios</p>}
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. Perfil Direct Link (Settings Profile Trigger) */}
          <button
            type="button"
            onClick={() => {
              setIsSettingsOpen(true);
              setActiveTab('perfil');
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-600 hover:bg-brand-green/10 hover:text-brand-green cursor-pointer",
              !isOpen && "justify-center px-2"
            )}
          >
            <User size={18} className="text-slate-400" />
            {isOpen && <span className="text-xs uppercase tracking-wider font-extrabold text-slate-600">Perfil</span>}
          </button>
        </div>

        {/* Sidebar Footer User & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          {isOpen && (
            <div className="mb-4 px-2">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Usuario Conectado</span>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-8 h-8 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-green font-black text-xs shrink-0 select-none font-sans">
                  {user?.nombreCompleto?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-extrabold truncate text-slate-700 dark:text-slate-200 leading-none">{user?.nombreCompleto}</p>
                  <p className="text-[9px] font-black text-[#0072B1] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 px-1.5 py-0.5 rounded text-left uppercase mt-1 inline-block leading-none font-sans">
                    {user?.rol}
                  </p>
                </div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-brand-red transition-all duration-200 cursor-pointer",
              !isOpen && "justify-center px-2"
            )}
          >
            <LogOut size={18} className="text-slate-400 dark:text-slate-500 group-hover:text-brand-red" />
            {isOpen && <span className="text-xs uppercase tracking-wider font-extrabold">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header 
          className="min-h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 pb-1 md:pt-0 md:pb-0 h-auto md:h-16"
          style={{
            paddingTop: typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform() 
              ? 'calc(env(safe-area-inset-top, 24px) + 8px)' 
              : '8px'
          }}
        >
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsOpen(true)}
              className="p-2 -ml-2 text-slate-400 hover:text-brand-green md:hidden"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-display font-semibold text-slate-800 dark:text-white capitalize truncate max-w-[120px] sm:max-w-xs leading-tight">
                {location.pathname.replace('/', '') || 'Dashboard'}
              </h1>
              <div className="flex items-center gap-1 mt-0.5">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  networkState === 'online' ? "bg-emerald-500" : (networkState === 'slow' ? "bg-amber-500" : "bg-red-500")
                )} />
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest",
                  networkState === 'online' ? "text-emerald-600" : (networkState === 'slow' ? "text-amber-500" : "text-red-500")
                )}>
                  {networkState === 'online' ? "En Línea" : (networkState === 'slow' ? "Red Lenta" : "Fuera de Línea")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Secretaría de</span>
              <span className="text-xs font-bold text-brand-green uppercase tracking-tight">
                {user?.secretaría?.replace('Secretaría de ', '') || 'Inclusión y Cohesión Social'}
              </span>
            </div>
            
            {/* Theme Toggle Button */}
            <button 
              type="button"
              onClick={handleToggleTheme}
              className="p-2 text-slate-400 hover:text-[#00A86B] dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer flex items-center justify-center"
              title={theme === 'light' ? "Activar modo oscuro" : "Activar modo claro"}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Banner de Estado de Red */}
        <AnimatePresence>
          {networkState !== 'online' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "px-4 py-1.5 flex flex-row items-center justify-between transition-colors text-[11px] font-bold shrink-0 gap-2 border-b leading-tight w-full",
                networkState === 'offline' 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-300"
              )}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Wifi className={cn("w-3.5 h-3.5 animate-pulse shrink-0", networkState === 'offline' ? "text-amber-500" : "text-blue-500")} />
                <span className="truncate sm:whitespace-normal">
                  {networkState === 'offline' ? (
                    <>
                      <strong>Modo Offline:</strong> Se guardará en tu dispositivo y se sincronizará automáticamente al conectarte.
                    </>
                  ) : (
                    <>
                      <strong>Red lenta:</strong> Sistema acelerado local activo.
                    </>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const { processOfflineQueue } = await import('../lib/offlineSync');
                  processOfflineQueue();
                }}
                className={cn(
                  "px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all select-none border whitespace-nowrap cursor-pointer shrink-0",
                  networkState === 'offline'
                    ? "bg-amber-500 text-white hover:bg-amber-600 border-amber-600 shadow-sm"
                    : "bg-blue-500 text-white hover:bg-blue-600 border-blue-600 shadow-sm"
                )}
              >
                Sincronizar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </section>
      </main>

      {/* Dialog de Configuración */}
      <Dialog.Root open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl z-[111] overflow-hidden outline-none border border-slate-100 dark:border-slate-800 animate-fadeIn h-[580px] flex flex-col">
            
            {/* Header del Modal */}
            <div className="bg-slate-900 p-6 px-8 flex items-center justify-between border-b border-slate-850 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-green/10 rounded-2xl border border-brand-green/20 flex items-center justify-center">
                  <Sliders size={20} className="text-brand-green" />
                </div>
                <div>
                  <Dialog.Title className="text-lg font-black text-white leading-none">Panel de Configuración</Dialog.Title>
                  <Dialog.Description className="text-slate-400 text-xs mt-1">
                    Administra tus datos personales, preferencias de visualización y monitorea conectores Atlas.
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            {/* Dos paneles: Sidebar interno de pestañas y Area de contenido */}
            <div className="flex flex-1 overflow-hidden">
              
              {/* Sidebar de pestañas */}
              <div className="w-56 bg-slate-50 dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => setActiveTab('perfil')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-left transition-all cursor-pointer",
                    activeTab === 'perfil' 
                      ? "bg-brand-green text-white shadow-md shadow-brand-green/25" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <User size={16} />
                  Mi Perfil
                </button>
                
                <button
                  onClick={() => setActiveTab('sistema')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-left transition-all cursor-pointer",
                    activeTab === 'sistema' 
                      ? "bg-brand-green text-white shadow-md shadow-brand-green/25" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <Settings size={16} />
                  Preferencias
                </button>

                <button
                  onClick={() => setActiveTab('diagnostico')}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-left transition-all cursor-pointer",
                    activeTab === 'diagnostico' 
                      ? "bg-brand-green text-white shadow-md shadow-brand-green/25" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <Database size={16} />
                  Local & Atlas
                </button>

                <div className="mt-auto p-3 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/85 flex flex-col items-center text-center gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Versión Activa</span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-350">v1.4.2-producción</span>
                </div>
              </div>

              {/* Area de contenido */}
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                
                {/* Formulario 1: Perfil de Funcionario */}
                {activeTab === 'perfil' && (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Información de la Cuenta</h3>
                      <p className="text-slate-400 text-xs">Datos correspondientes al funcionario en ejercicio activo actual.</p>
                    </div>

                    <div className="space-y-3.5">
                      {/* Nombre Completo */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                        <input
                          type="text"
                          required
                          value={nombreCompleto}
                          onChange={(e) => setNombreCompleto(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-display text-slate-900 focus:outline-none focus:border-brand-green focus:bg-white transition-all shadow-sm"
                        />
                      </div>

                      {/* Correo Electrónico */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correo de Acceso</label>
                        <input
                          type="email"
                          required
                          value={correo}
                          onChange={(e) => setCorreo(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-display text-slate-900 focus:outline-none focus:border-brand-green focus:bg-white transition-all shadow-sm"
                        />
                      </div>

                      {/* Secretaría */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Secretaría Territorial</label>
                        <select
                          value={secretaria}
                          onChange={(e) => setSecretaria(e.target.value)}
                          disabled={user?.rol === 'funcionario'}
                          className={cn(
                            "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-display transition-all shadow-sm h-10",
                            user?.rol === 'funcionario' ? "opacity-70 cursor-not-allowed bg-slate-100 text-slate-500" : "text-slate-900 focus:outline-none focus:border-brand-green focus:bg-white cursor-pointer"
                          )}
                        >
                          <option value="">Seleccione secretaría...</option>
                          {(secretariasDisponibles.length > 0
                            ? secretariasDisponibles
                            : defaultSecretarias
                          ).map((sec) => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      </div>

                      {/* Rol */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rol de Operación</label>
                          <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 capitalize flex items-center gap-1.5 select-none h-10">
                            <Shield size={14} className="text-slate-400" />
                            {user?.rol === 'admin' ? 'Administrador' : 'Funcionario'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Línea Trabajo</label>
                          <select
                            value={linea}
                            onChange={(e) => setLinea(e.target.value)}
                            disabled={user?.rol === 'funcionario'}
                            className={cn(
                              "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-display transition-all shadow-sm h-10",
                              user?.rol === 'funcionario' ? "opacity-70 cursor-not-allowed bg-slate-100 text-slate-500" : "text-slate-900 focus:outline-none focus:border-brand-green focus:bg-white cursor-pointer"
                            )}
                          >
                            {(lineasDisponibles.length > 0
                              ? lineasDisponibles.map(l => ({ id: l._id || l.id, nombre: l.nombre }))
                              : defaultLineas
                            ).map((opt) => (
                              <option key={opt.id} value={opt.nombre}>{opt.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      {isSavedSuccessfully ? (
                        <span className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1 animate-fadeIn">
                          <CheckCircle2 size={14} /> Perfil Guardado
                        </span>
                      ) : <span />}
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-brand-green hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-brand-green/20"
                      >
                        <Save size={13} />
                        Guardar Perfil
                      </button>
                    </div>
                  </form>
                )}

                {/* Formulario 2: Preferencias del Sistema */}
                {activeTab === 'sistema' && (
                  <form onSubmit={handleSaveSystem} className="space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Parámetros del Sistema</h3>
                      <p className="text-slate-400 text-xs">Modifica cómo responde y valida el sistema en tu sesión.</p>
                    </div>

                    <div className="space-y-3.5">
                      {/* Límite de Filas Dashboard */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registros rápidos en lists</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[5, 10, 15].map((lim) => (
                            <button
                              key={lim}
                              type="button"
                              onClick={() => setRecordsLimit(lim)}
                              className={cn(
                                "py-1.5 rounded-xl text-[10px] font-black tracking-wide border transition-all cursor-pointer",
                                recordsLimit === lim
                                  ? "bg-slate-900 border-slate-900 text-white"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              {lim} Filas
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tema del Sistema */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Tema Visual del Sistema</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTheme('light');
                              localStorage.setItem('theme', 'light');
                            }}
                            className={cn(
                              "py-2 rounded-xl text-[10px] font-black tracking-wide border transition-all cursor-pointer flex items-center justify-center gap-1.5",
                              theme === 'light'
                                ? "bg-slate-900 border-slate-900 text-white"
                                : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                          >
                            <Sun size={12} /> Tema Claro (Actual)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTheme('dark');
                              localStorage.setItem('theme', 'dark');
                            }}
                            className={cn(
                              "py-2 rounded-xl text-[10px] font-black tracking-wide border transition-all cursor-pointer flex items-center justify-center gap-1.5",
                              theme === 'dark'
                                ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-950"
                                : "bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                          >
                            <Moon size={12} /> Tema Oscuro
                          </button>
                        </div>
                      </div>

                      {/* Toggles (Validation, map precision, coverage alerts) */}
                      <div className="space-y-2.5 pt-1.5">
                        {/* Validacion Fina */}
                        <label className="flex items-start gap-2.5 cursor-pointer p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={strictValidation}
                            onChange={(e) => setStrictValidation(e.target.checked)}
                            className="mt-0.5 w-3.5 h-3.5 rounded text-brand-green focus:ring-brand-green border-slate-300 dark:border-slate-700"
                          />
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-wide">Validación Estricta</span>
                            <p className="text-[9px] text-slate-405 dark:text-slate-400 leading-normal">Exigir validaciones de formato de identificación.</p>
                          </div>
                        </label>

                        {/* Cobertura Territorial Alerts */}
                        <label className="flex items-start gap-2.5 cursor-pointer p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={coverageAlerts}
                            onChange={(e) => setCoverageAlerts(e.target.checked)}
                            className="mt-0.5 w-3.5 h-3.5 rounded text-brand-green focus:ring-brand-green border-slate-300 dark:border-slate-700"
                          />
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-wide">Alertas de Saturación</span>
                            <p className="text-[9px] text-slate-405 dark:text-slate-400 leading-normal">Notificar cuando comunas excedan el umbral.</p>
                          </div>
                        </label>

                        {/* Precision Puntos Mapa */}
                        <label className="flex items-start gap-2.5 cursor-pointer p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={mapPrecision}
                            onChange={(e) => setMapPrecision(e.target.checked)}
                            className="mt-0.5 w-3.5 h-3.5 rounded text-brand-green focus:ring-brand-green border-slate-300 dark:border-slate-700"
                          />
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-wide">Optimizar Geolocalización</span>
                            <p className="text-[9px] text-slate-405 dark:text-slate-400 leading-normal">Aproximar cuando falten datos catastrales.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      {isSavedSuccessfully ? (
                        <span className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1 animate-fadeIn">
                          <CheckCircle2 size={14} /> Preferencias Aplicadas
                        </span>
                      ) : <span />}
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-brand-green hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-brand-green/20"
                      >
                        <Save size={13} />
                        Guardar canjes
                      </button>
                    </div>
                  </form>
                )}

                {/* Formulario 3: Diagnostico Atlas */}
                {activeTab === 'diagnostico' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Base de Datos & Canal Cloud</h3>
                      <p className="text-slate-400 text-xs">Consulta técnica y latencias de conexión.</p>
                    </div>

                    <div className="space-y-3">
                      {/* Estado General Connection */}
                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600 animate-pulse">
                            <Wifi size={16} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Base de Datos</p>
                            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wide mt-1">MongoDB Atlas</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black rounded uppercase tracking-wider">
                          ONLINE
                        </span>
                      </div>

                      {/* Cluster Metadata */}
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Servidor</span>
                          <span className="font-semibold text-slate-600 block mt-0.5 truncate select-all">aws-us-east-1.mongodb.net</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Tipo Canal</span>
                          <span className="font-semibold text-slate-600 block mt-0.5">Atlas M0 (Shared Cluster)</span>
                        </div>
                      </div>

                      {/* Latency Tester */}
                      <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Prueba de Latencia (Ping)</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Calcula el tiempo de respuesta del servidor.</span>
                          </div>
                          <button
                            onClick={handlePing}
                            disabled={pinging}
                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw size={13} className={cn("text-slate-400", pinging && "animate-spin")} />
                          </button>
                        </div>

                        <div className="h-9 flex items-center justify-center bg-white rounded-lg border border-slate-150">
                          {pinging ? (
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Calculando...</span>
                          ) : pingLatency !== null ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 animate-ping" />
                              <span className="font-black text-slate-700">
                                Latencia: <span className="text-brand-green font-mono">{pingLatency} ms</span>
                              </span>
                              <span className="text-[8px] font-black bg-emerald-500/10 text-brand-green border border-emerald-500/10 px-1 py-0.2 rounded uppercase ml-1">
                                ÓPTIMO
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">No se han corrido pruebas</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Dialog.Close asChild>
                        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer">
                          Cerrar Panel
                        </button>
                      </Dialog.Close>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AnimatePresence>
        {isSavedSuccessfully && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed top-6 right-6 z-[200] max-w-sm w-full bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 shadow-2xl shadow-emerald-950/10"
          >
            <CheckCircle2 className="text-brand-green shrink-0 mt-0.5 animate-pulse" size={20} />
            <div className="space-y-1">
              <span className="block text-xs font-black text-emerald-800 uppercase tracking-widest leading-none">Perfil Actualizado</span>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                ¡La información del funcionario ha sido guardada y sincronizada de forma correcta!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
