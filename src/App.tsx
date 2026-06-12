import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ListadoBeneficiarios } from './pages/Beneficiarios';
import { Registro } from './pages/Registro';
import { LineasTrabajo } from './pages/LineasTrabajo';
import { Funcionarios } from './pages/Funcionarios';
import { Comunas } from './pages/Comunas';
import Actividades from './pages/Actividades';
import Asistentes from './pages/Asistentes';
import { DashboardLayout } from './components/DashboardLayout';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="w-12 h-12 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard" />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/beneficiarios" 
            element={
              <ProtectedRoute>
                <ListadoBeneficiarios />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/registro" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'funcionario']}>
                <Registro />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lineas" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LineasTrabajo />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/funcionarios" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Funcionarios />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/comunas" 
            element={
              <ProtectedRoute>
                <Comunas />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/actividades" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'funcionario']}>
                <Actividades />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/asistentes" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'funcionario']}>
                <Asistentes />
              </ProtectedRoute>
            } 
          />
          {/* Fallback routes */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route 
            path="*" 
            element={
              <ProtectedRoute>
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <div className="text-8xl font-black text-slate-200 mb-4">404</div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Módulo en Desarrollo</h2>
                  <p className="text-slate-500 max-w-xs">Estamos trabajando para habilitar esta sección lo antes posible dentro del sistema Red de Inclusión.</p>
                </div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
