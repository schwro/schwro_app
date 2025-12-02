import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Music, Video, Home, Baby, UserCircle, Settings, HeartHandshake, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Sidebar() {
  const location = useLocation();
  const active = location.pathname;
  const [logoUrl, setLogoUrl] = useState(null);
  const [visibleModules, setVisibleModules] = useState({ 
    members: true, 
    worship: true, 
    media: true, 
    atmosfera: true,
    kids: true, 
    groups: true 
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('app_settings').select('key, value');
        if (data) {
          const logo = data.find(s => s.key === 'org_logo_url')?.value;
          if (logo) setLogoUrl(logo);

          const newVisibility = { ...visibleModules };
          data.forEach(s => {
            if (s.key === 'module_members_enabled') newVisibility.members = s.value === 'true';
            if (s.key === 'module_worship_enabled') newVisibility.worship = s.value === 'true';
            if (s.key === 'module_media_enabled') newVisibility.media = s.value === 'true';
            if (s.key === 'module_atmosfera_enabled') newVisibility.atmosfera = s.value === 'true';
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
    { path: '/', icon: Home, label: 'Programy', show: true },
    { path: '/calendar', icon: Calendar, label: 'Kalendarz', show: true },
    { path: '/members', icon: Users, label: 'Członkowie', show: visibleModules.members },
    { path: '/worship', icon: Music, label: 'Grupa Uwielbienia', show: visibleModules.worship },
    { path: '/media', icon: Video, label: 'MediaTeam', show: visibleModules.media },
    { path: '/atmosfera', icon: HeartHandshake, label: 'Atmosfera Team', show: visibleModules.atmosfera },
    { path: '/kids', icon: Baby, label: 'Małe SchWro', show: visibleModules.kids },
    { path: '/groups', icon: UserCircle, label: 'Grupy domowe', show: visibleModules.groups },
  ];

  return (
    <div className="w-64 bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700 shadow-lg flex flex-col transition-colors duration-300 h-full">
      
      {/* LOGO */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700 flex justify-center items-center shrink-0">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="w-full max-h-32 object-contain rounded-md"
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-900 dark:to-orange-900 rounded-xl flex items-center justify-center text-pink-600 dark:text-pink-300 font-bold text-4xl shadow-sm">
            S
          </div>
        )}
      </div>

      {/* NAWIGACJA */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar mt-2">
        {allLinks.filter(l => l.show).map(link => {
          const isActive = active === link.path;
          return (
            <Link key={link.path} to={link.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/30 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-700 hover:text-pink-600 dark:hover:text-white'}`}>
              <link.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-pink-500 dark:group-hover:text-white transition-colors'} />
              <span className="text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* USTAWIENIA */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
        <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full ${active === '/settings' ? 'bg-gray-800 dark:bg-gray-900 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
          <Settings size={20} />
          <span className="text-sm font-medium">Ustawienia</span>
        </Link>
      </div>
    </div>
  );
}
