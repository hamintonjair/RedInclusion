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
    console.log('[AUTH-V3-FIX] Attempting Login V2 at /api/v2/login for:', email);
    try {
      const response = await api.post('/v2/login', { email, password: pass });
      console.log('[AUTH-V3-FIX] Response received:', response.status, response.data);
      const userData = response.data;
      
      if (userData && typeof userData === 'object' && userData.id) {
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setIsLoading(false);
        return true;
      } else {
        console.error('[AUTH] Invalid user data received:', userData);
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('[AUTH] Login error:', error.message);
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
