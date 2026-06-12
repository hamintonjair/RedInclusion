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
    console.log('Stored user in localStorage:', stored);
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored);
        console.log('Parsed user:', parsedUser);
        setUser(parsedUser);
        
        // Fetch fresh, real data of the user/funcionario from database
        const fetchFreshProfile = async () => {
          try {
            const userId = parsedUser.id || parsedUser._id;
            console.log('UserId to fetch profile:', userId);
            if (userId) {
              const res = await api.get(`/auth/profile?id=${userId}`);
              console.log('Profile fetch response:', res.data);
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
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    console.log('[AUTH] Attempting login for:', email);

    const parseUserData = (data: any) => {
      if (!data) return null;
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      }
      return data;
    };

    const isValidUser = (userData: any) => {
      return userData && typeof userData === 'object' && (userData.id || userData._id);
    };

    const normalizeUser = (userData: any) => ({
      id: String(userData.id || userData._id),
      nombreCompleto: userData.nombreCompleto || userData.nombre || 'Usuario',
      correo: userData.correo || userData.email || '',
      rol: userData.rol || 'funcionario',
      estado: userData.estado || 'Activo',
      lineaTrabajo: userData.lineaTrabajo || userData.linea_trabajo,
      secretaría: userData.secretaría || userData.secretaria,
      token: userData.token,
    });

    try {
      const endpoints = ['/v2/login', '/auth/login', '/api/auth/login'];
      let response: any;
      let userData: any = null;

      for (const endpoint of endpoints) {
        try {
          console.log('[AUTH] Trying endpoint:', endpoint);
          response = await api.post(endpoint, { email, password: pass });
          userData = parseUserData(response?.data);
          console.log('[AUTH] Login response from', endpoint, { status: response?.status, data: userData });
          if (isValidUser(userData)) break;
        } catch (err: any) {
          console.warn('[AUTH] Endpoint failed:', endpoint, err?.message || err);
          continue;
        }
      }

      if (isValidUser(userData)) {
        const normalizedUser = normalizeUser(userData);
        setUser(normalizedUser);
        localStorage.setItem('auth_user', JSON.stringify(normalizedUser));
        setIsLoading(false);
        return true;
      }

      console.error('[AUTH] Invalid user data received:', userData);
      setIsLoading(false);
      return false;
    } catch (error: any) {
      console.error('[AUTH] Login error:', error?.message || error);
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
