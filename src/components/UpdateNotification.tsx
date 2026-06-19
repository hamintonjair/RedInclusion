import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { AlertCircle, Download, X } from 'lucide-react';

const CURRENT_VERSION = '1.2.0';
const VERSION_URL = '/version.json';

export const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch(VERSION_URL + '?t=' + new Date().getTime());
        const data = await response.json();
        if (data.version && data.version !== CURRENT_VERSION) {
          setShowUpdate(true);
        }
      } catch (error) {
        console.error('Error checking version:', error);
      }
    };

    const platform = Capacitor.getPlatform();
    setIsAndroid(platform === 'android');

    checkVersion();
  }, []);

  if (!showUpdate) return null;

  const handleUpdate = () => {
    if (isAndroid) {
      window.open('https://appsure.com/download/app', '_blank');
    } else {
      // For PWA/iOS, maybe just reload or inform user to refresh
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t border-slate-200 z-50 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <AlertCircle className="text-brand-blue" />
        <div>
          <h4 className="font-bold text-brand-blue">¡Nueva versión disponible!</h4>
          <p className="text-sm text-slate-600">
            {isAndroid 
              ? 'Hay una actualización importante disponible en AppSure.' 
              : 'Hay mejoras disponibles. Por favor, actualiza tu aplicación.'}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleUpdate} className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg font-medium text-sm">
          {isAndroid ? <Download size={16} /> : null}
          {isAndroid ? 'Actualizar' : 'Refrescar'}
        </button>
        <button onClick={() => setShowUpdate(false)} className="text-slate-400 p-2">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
