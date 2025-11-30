import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Music, Video, Home, Baby, UserCircle, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Sidebar() {
  const location = useLocation();
  const active = location.pathname;
  const [logoUrl, setLogoUrl] = useState(null);
  const [orgName, setOrgName] = useState('SchWro App');
  
  // Stan widoczności modułów (domyślnie true, żeby nie mrugało przy ładowaniu)
  const [visibleModules, setVisibleModules] = useState({
    members: true,
    worship: true,
    media: true,
    kids: true,
    groups: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('app_settings').select('key, value');
        if (data) {
          const logo = data.find(s => s.key === 'org_logo_url')?.value;
          const name = data.find(s => s.key === 'org_name')?.value;
          if (logo) setLogoUrl(logo);
          if (name) setOrgName(name);

          // Aktualizacja widoczności modułów
          const newVisibility = { ...visibleModules };
          data.forEach(s => {
            if (s.key === 'module_members_enabled') newVisibility.members = s.value === 'true';
            if (s.key === 'module_worship_enabled') newVisibility.worship = s.value === 'true';
            if (s.key === 'module_media_enabled') newVisibility.media = s.value === 'true';
            if (s.key === 'module_kids_enabled') newVisibility.kids = s.value === 'true';
            if (s.key === 'module_groups_enabled') newVisibility.groups = s.value === 'true';
          });
          setVisibleModules(newVisibility);
        }
      } catch (err) { console.error(err); }
    };
    fetchSettings();
  }, []);

  const allLinks = [
    { path: '/', icon: Home, label: 'Dashboard', show: true },
    { path: '/members', icon: Users, label: 'Członkowie', show: visibleModules.members },
    { path: '/worship', icon: Music, label: 'Grupa Uwielbienia', show: visibleModules.worship },
    { path: '/media', icon: Video, label: 'MediaTeam', show: visibleModules.media },
    { path: '/kids', icon: Baby, label: 'Małe SchWro', show: visibleModules.kids },
    { path: '/groups', icon: UserCircle, label: 'Grupy domowe', show: visibleModules.groups },
  ];

  return (
    <div className="w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200/50 flex flex-col items-center text-center">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain mb-3 rounded-md" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl mb-3 shadow-sm">{orgName.charAt(0)}</div>
        )}
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">{orgName}</h1>
        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">Panel Zarządzania</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {allLinks.filter(l => l.show).map(link => {
          const isActive = active === link.path;
          return (
            <Link key={link.path} to={link.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30 font-medium' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}>
              <link.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500 transition-colors'} />
              <span className="text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200/50 bg-gray-50/50">
        <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${active === '/settings' ? 'bg-gray-200 text-gray-900 font-bold' : 'text-gray-500 hover:bg-white hover:shadow-sm hover:text-gray-700'}`}>
          <Settings size={20} className={active === '/settings' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}/>
          <span className="font-medium text-sm">Ustawienia</span>
        </Link>
      </div>
    </div>
  );
}
