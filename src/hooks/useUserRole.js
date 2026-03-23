import { useState, useEffect } from 'react';
import { supabase, getCachedUser } from '../lib/supabase';

// Globalny cache - współdzielony między wszystkimi instancjami hooka
let globalUserRole = null;
let globalLoading = true;
let fetchPromise = null;
const listeners = new Set();

// Funkcja do powiadomienia wszystkich listenerów
const notifyListeners = () => {
  listeners.forEach(listener => listener({ userRole: globalUserRole, loading: globalLoading }));
};

// Funkcja do pobrania roli (wywoływana tylko raz)
const fetchRole = async () => {
  // Jeśli już pobieramy, zwróć istniejący promise
  if (fetchPromise) return fetchPromise;

  // Timeout - jeśli pobieranie trwa zbyt długo, użyj domyślnej roli
  const timeoutId = setTimeout(() => {
    if (globalLoading) {
      console.warn('useUserRole timeout - using default role');
      globalUserRole = 'czlonek';
      globalLoading = false;
      notifyListeners();
    }
  }, 5000);

  fetchPromise = (async () => {
    try {
      const user = await getCachedUser();
      if (!user) {
        globalUserRole = null;
        globalLoading = false;
        clearTimeout(timeoutId);
        notifyListeners();
        return;
      }

      const { data: profile, error } = await supabase
        .from('app_users')
        .select('role')
        .eq('email', user.email)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        globalUserRole = 'czlonek';
      } else {
        globalUserRole = profile?.role || 'czlonek';
      }
      localStorage.setItem('userRole', globalUserRole);
    } catch (error) {
      console.error('Error fetching user role:', error);
      globalUserRole = 'czlonek';
    } finally {
      clearTimeout(timeoutId);
      globalLoading = false;
      notifyListeners();
    }
  })();

  return fetchPromise;
};

export function useUserRole() {
  const [state, setState] = useState({
    userRole: globalUserRole,
    loading: globalLoading
  });

  useEffect(() => {
    // Dodaj listener
    const listener = (newState) => setState(newState);
    listeners.add(listener);

    // Zawsze pobieraj rolę z bazy (nie polegaj na cache)
    fetchRole();

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return state;
}

// Funkcja do resetu cache (np. po wylogowaniu)
export function resetUserRoleCache() {
  globalUserRole = null;
  globalLoading = true;
  fetchPromise = null;
  localStorage.removeItem('userRole');
  notifyListeners();
}
