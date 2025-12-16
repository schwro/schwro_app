import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PermissionsContext = createContext({
  permissions: [],
  appSettings: {},
  logoUrl: null,
  loading: true
});

export function PermissionsProvider({ children }) {
  const [permissions, setPermissions] = useState([]);
  const [appSettings, setAppSettings] = useState({
    members: true,
    worship: true,
    media: true,
    atmosfera: true,
    kids: true,
    groups: true,
    prayer: true
  });
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Wykonaj oba zapytania równolegle
        const [settingsResult, permsResult] = await Promise.all([
          supabase.from('app_settings').select('key, value'),
          supabase.from('app_permissions').select('role, resource, can_read')
        ]);

        // Przetwórz ustawienia
        if (settingsResult.data) {
          const settings = settingsResult.data;
          const logo = settings.find(s => s.key === 'org_logo_url')?.value;
          if (logo) setLogoUrl(logo);

          const newSettings = { ...appSettings };
          settings.forEach(s => {
            if (s.key === 'module_members_enabled') newSettings.members = s.value === 'true';
            if (s.key === 'module_worship_enabled') newSettings.worship = s.value === 'true';
            if (s.key === 'module_media_enabled') newSettings.media = s.value === 'true';
            if (s.key === 'module_atmosfera_enabled') newSettings.atmosfera = s.value === 'true';
            if (s.key === 'module_kids_enabled') newSettings.kids = s.value === 'true';
            if (s.key === 'module_groups_enabled') newSettings.groups = s.value === 'true';
            if (s.key === 'module_prayer_enabled') newSettings.prayer = s.value === 'true';
          });
          setAppSettings(newSettings);
        }

        // Przetwórz uprawnienia
        if (permsResult.data) {
          setPermissions(permsResult.data);
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <PermissionsContext.Provider value={{ permissions, appSettings, logoUrl, loading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
