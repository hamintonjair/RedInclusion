import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../types';
import api from '../lib/api';

interface AuthContextType {
  user: Usuario | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updatedFields: Partial<Usuario>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      
      // Fetch fresh, real data of the user/funcionario from database
      const fetchFreshProfile = async () => {
        try {
          const userId = parsedUser.id || parsedUser._id;
          if (userId) {
            const res = await api.get(`/auth/profile?id=${userId}`);
            if (res.data) {
              setUser(res.data);
              localStorage.setItem('auth_user', JSON.stringify(res.data));
            }
          }
        } catch (err) {
          console.error('No se pudo refrescar el perfil real desde la base de datos:', err);
        }
      };
      fetchFreshProfile();
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    console.log('Intentando login para:', email);
    try {
      const response = await api.post('/auth/login', { email, password: pass });
      console.log('Respuesta de login recibida:', response.status, response.data);
      const userData = response.data;
      
      // Valida que el objeto de usuario tenga una estructura mínima válida
      if (!userData || typeof userData !== 'object' || (!userData.id && !userData._id)) {
        console.error('La respuesta del servidor no tiene el formato esperado o está vacía:', userData);
        setIsLoading(false);
        return false;
      }
      
      console.log('Login exitoso, guardando usuario...');
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      // Guardar credenciales locales de respaldo de forma segura para permitir inicio de sesión offline
      try {
        const cachedStr = localStorage.getItem('cached_users_auth') || '[]';
        const cached = JSON.parse(cachedStr);
        const filtered = cached.filter((item: any) => item.email.toLowerCase() !== email.toLowerCase().trim());
        filtered.push({
          email: email.toLowerCase().trim(),
          password: pass,
          userData
        });
        localStorage.setItem('cached_users_auth', JSON.stringify(filtered));
      } catch (err) {
        console.error('Error al guardar credenciales en caché:', err);
      }

      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Error detallado de login:', error.response?.status, error.response?.data || error.message);
      
      // Comprobar si el error se debe a falta de internet
      const isOfflineErr = !navigator.onLine || 
                           error.message?.includes('Network') || 
                           error.code === 'ERR_NETWORK' || 
                           error.status === 0 || 
                           !error.response;
                           
      if (isOfflineErr) {
        console.warn('[Offline] Sin conexión detectada. Buscando credenciales locales...');
        try {
          const cachedStr = localStorage.getItem('cached_users_auth') || '[]';
          const cached = JSON.parse(cachedStr);
          const found = cached.find((item: any) => 
            item.email.toLowerCase() === email.toLowerCase().trim() && 
            item.password === pass
          );
          
          if (found) {
            console.log('[Offline] Inició sesión local con éxito!');
            setUser(found.userData);
            localStorage.setItem('auth_user', JSON.stringify(found.userData));
            setIsLoading(false);
            return true;
          }
        } catch (err) {
          console.error('[Offline] Error buscando credenciales locales:', err);
        }
      }
      
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const updateUser = async (updatedFields: Partial<Usuario>) => {
    if (user) {
      const updated = { ...user, ...updatedFields };
      try {
        await api.put('/auth/profile', {
          id: user.id || (user as any)._id,
          nombreCompleto: updated.nombreCompleto,
          correo: updated.correo,
          secretaría: updated.secretaría,
          lineaTrabajo: updated.lineaTrabajo
        });
      } catch (error) {
        console.error('No se pudo persistir el perfil en el servidor:', error);
      }
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
