import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserRole } from '../hooks/useUserRole';

export default function ProtectedRoute({ children, resource }) {
  const { userRole, loading: roleLoading } = useUserRole();
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data: perms } = await supabase.from('app_permissions').select('*');
        if (perms) {
          setPermissions(perms);
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
      } finally {
        setPermissionsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  // Pokaż loader podczas ładowania
  if (roleLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  // Superadmin ma dostęp do wszystkiego
  if (userRole === 'superadmin') {
    return children;
  }

  // Rada starszych zawsze ma dostęp do ustawień
  if (userRole === 'rada_starszych' && resource === 'module:settings') {
    return children;
  }

  // Sprawdź uprawnienia
  const perm = permissions.find(p => p.role === userRole && p.resource === resource);
  const hasAccess = perm?.can_read === true;

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}
