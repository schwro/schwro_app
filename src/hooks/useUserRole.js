import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useUserRole() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        // Sprawdź czy rola jest w localStorage (cache)
        const cachedRole = localStorage.getItem('userRole');
        if (cachedRole) {
          setUserRole(cachedRole);
          setLoading(false);
        }

        // Spróbuj pobrać z bazy danych
        const { data: profile, error } = await supabase
          .from('app_users')
          .select('role')
          .eq('email', user.email)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          // Jeśli błąd, ale mamy cache - użyj cache
          if (cachedRole) {
            setUserRole(cachedRole);
          } else {
            // Domyślna rola jeśli nie ma dostępu
            setUserRole('czlonek');
            localStorage.setItem('userRole', 'czlonek');
          }
        } else {
          const role = profile?.role || 'czlonek';
          setUserRole(role);
          localStorage.setItem('userRole', role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Fallback do cache lub domyślnej roli
        const cachedRole = localStorage.getItem('userRole');
        setUserRole(cachedRole || 'czlonek');
        if (!cachedRole) {
          localStorage.setItem('userRole', 'czlonek');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  return { userRole, loading };
}
