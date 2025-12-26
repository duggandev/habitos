import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ClearCache: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const clearAll = async () => {
      try {
        // 1. Clear localStorage
        localStorage.clear();
        
        // 2. Clear sessionStorage
        sessionStorage.clear();
        
        // 3. Clear IndexedDB
        const dbs = await window.indexedDB.databases?.() || [];
        for (const db of dbs) {
          if (db.name) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }

        // 4. Clear all cookies (incluir path y domain variations)
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          
          if (name) {
            // Borrar con diferentes combinaciones de path y domain
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
          }
        }

        // 5. Clear service worker cache
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
            }
          } catch (e) {
            console.warn('Error unregistering service workers:', e);
          }
        }

        // 6. Clear Cache API (todos los cachés)
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          } catch (e) {
            console.warn('Error clearing caches:', e);
          }
        }

        // 7. Clear WebSQL (si existe, para compatibilidad)
        try {
          if (window.openDatabase) {
            const dbs = ['_localstorage', '_sessionstorage'];
            for (const dbName of dbs) {
              const db = window.openDatabase(dbName, '', '', 0);
              if (db) {
                db.transaction((tx) => {
                  tx.executeSql('DELETE FROM ??', [dbName]);
                });
              }
            }
          }
        } catch (e) {
          // WebSQL no soportado, ignorar
        }

        // 8. Usar Clear-Site-Data headers vía fetch (si el servidor lo soporta)
        try {
          await fetch(window.location.href, {
            method: 'HEAD',
            headers: {
              'Clear-Site-Data': '"cache", "cookies", "storage", "executionContexts"'
            }
          });
        } catch (e) {
          // Ignorar errores de fetch
        }

        // 9. Esperar un poco antes de recargar para asegurar que todo se borre
        await new Promise(resolve => setTimeout(resolve, 500));

        // 10. Recarga dura del navegador (bypass cache)
        window.location.href = '/?nocache=' + Date.now();
      } catch (error) {
        console.error('Error al limpiar caché:', error);
        // Si hay error, intentamos navegar de todas formas
        window.location.href = '/?nocache=' + Date.now();
      }
    };

    clearAll();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Limpiando caché y datos...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Borrando localStorage, sessionStorage, IndexedDB, cookies, cache, service workers...
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
          Redirigiendo a la página principal...
        </p>
      </div>
    </div>
  );
};

export default ClearCache;
