import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Users, Music, Video, Home, Baby, UserCircle, Settings, HeartHandshake, Calendar, DollarSign, BookOpen, Heart, LayoutDashboard, FileText, MessageCircle, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUserRole } from '../hooks/useUserRole';
import { usePermissions } from '../contexts/PermissionsContext';
import { supabase } from '../lib/supabase';

// Komponent Tooltip zgodny z layoutem aplikacji - używa Portal
function Tooltip({ children, text, show }) {
  const [position, setPosition] = useState({ top: 0, left: 0, visible: false });
  const containerRef = useRef(null);

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
        visible: true
      });
    }
  };

  const handleMouseLeave = () => {
    setPosition(prev => ({ ...prev, visible: false }));
  };

  if (!show || !text) return children;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {position.visible && createPortal(
        <div
          className="fixed z-[99999] pointer-events-none"
          style={{ top: position.top, left: position.left, transform: 'translateY(-50%)' }}
        >
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-2 rounded-xl shadow-lg whitespace-nowrap border border-gray-700 dark:border-gray-600 relative">
            {text}
            {/* Strzałka */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Import stempla
import stampLogo from '../media/stamp.png';

export default function Sidebar() {
  const location = useLocation();
  const active = location.pathname;
  const { userRole } = useUserRole();
  const { permissions, appSettings: moduleSettings, logoUrl } = usePermissions();

  // Stan zwinięcia sidebara (z localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  // Zapisz stan do localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  // Dynamiczne moduły z bazy danych
  const [dynamicModules, setDynamicModules] = useState([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);

  // Funkcja do ładowania modułów
  const loadModules = async () => {
    try {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setDynamicModules(data);
      }
    } catch (err) {
      console.log('Tabela app_modules nie istnieje jeszcze, używam statycznej listy');
    } finally {
      setModulesLoaded(true);
    }
  };

  // Załaduj moduły z bazy danych i nasłuchuj na zmiany
  useEffect(() => {
    loadModules();

    // Subskrybuj zmiany w tabeli app_modules (realtime)
    let debounceTimer = null;
    const channel = supabase
      .channel('sidebar-modules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_modules'
        },
        () => {
          // Debounce - poczekaj 300ms na więcej zmian przed przeładowaniem
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            loadModules();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  // Pobierz komponent ikony po nazwie
  const getIconComponent = (iconName) => {
    return LucideIcons[iconName] || LucideIcons.Square;
  };

  // Sprawdź czy użytkownik ma dostęp do modułu (can_read)
  const hasModuleAccess = (moduleResource) => {
    // Superadmin ma dostęp do wszystkiego
    if (userRole === 'superadmin') return true;

    // Rada starszych zawsze ma dostęp do ustawień
    if (userRole === 'rada_starszych' && moduleResource === 'module:settings') return true;

    // Znajdź uprawnienie dla roli i zasobu
    const perm = permissions.find(p => p.role === userRole && p.resource === moduleResource);

    // Brak wpisu lub can_read !== true = brak dostępu
    if (!perm) return false;

    return perm.can_read === true;
  };

  // Mapowanie ścieżek na zasoby uprawnień
  const moduleResourceMap = {
    members: 'module:members',
    worship: 'module:worship',
    media: 'module:media',
    atmosfera: 'module:atmosfera',
    kids: 'module:kids',
    homegroups: 'module:homegroups',
    groups: 'module:homegroups', // alias
    finance: 'module:finance',
    teaching: 'module:teaching',
    prayer: 'module:prayer',
    komunikator: 'module:komunikator',
    mlodziezowka: 'module:mlodziezowka',
    settings: 'module:settings'
  };

  // Moduł jest widoczny jeśli: jest włączony globalnie ORAZ użytkownik ma uprawnienia
  const isModuleVisible = (moduleKey) => {
    return moduleSettings[moduleKey] && hasModuleAccess(moduleResourceMap[moduleKey]);
  };

  // Stałe linki nawigacyjne (zawsze widoczne)
  const coreLinks = [
    { path: '/', icon: LayoutDashboard, label: 'Pulpit', show: true },
    { path: '/programs', icon: FileText, label: 'Programy', show: true },
    { path: '/calendar', icon: Calendar, label: 'Kalendarz', show: true },
  ];

  // Statyczne linki modułów (fallback jeśli brak danych z bazy)
  const staticModuleLinks = [
    { path: '/members', icon: Users, label: 'Członkowie', show: isModuleVisible('members') },
    { path: '/worship', icon: Music, label: 'Grupa Uwielbienia', show: isModuleVisible('worship') },
    { path: '/media', icon: Video, label: 'MediaTeam', show: isModuleVisible('media') },
    { path: '/atmosfera', icon: HeartHandshake, label: 'Atmosfera Team', show: isModuleVisible('atmosfera') },
    { path: '/kids', icon: Baby, label: 'Małe SchWro', show: isModuleVisible('kids') },
    { path: '/home-groups', icon: UserCircle, label: 'Grupy domowe', show: isModuleVisible('groups') },
    { path: '/finance', icon: DollarSign, label: 'Finanse', show: hasModuleAccess('module:finance') },
    { path: '/teaching', icon: BookOpen, label: 'Nauczanie', show: hasModuleAccess('module:teaching') },
    { path: '/prayer', icon: Heart, label: 'Centrum Modlitwy', show: isModuleVisible('prayer') },
    { path: '/komunikator', icon: MessageCircle, label: 'Komunikator', show: hasModuleAccess('module:komunikator') },
    { path: '/mlodziezowka', icon: Sparkles, label: 'Młodzieżówka', show: hasModuleAccess('module:mlodziezowka') },
  ];

  // Wygeneruj linki modułów z bazy danych
  const getDynamicModuleLinks = () => {
    // Filtruj moduły: pomijamy dashboard, programs, calendar (są w coreLinks) oraz settings (osobno)
    const coreKeys = ['dashboard', 'programs', 'calendar', 'settings'];

    return dynamicModules
      .filter(mod => !coreKeys.includes(mod.key))
      .filter(mod => mod.is_enabled) // Tylko włączone moduły
      .map(mod => ({
        path: mod.path,
        icon: getIconComponent(mod.icon),
        label: mod.label,
        show: hasModuleAccess(mod.resource_key)
      }));
  };

  // Użyj dynamicznych modułów jeśli są dostępne, w przeciwnym razie statycznych
  const moduleLinks = dynamicModules.length > 0 ? getDynamicModuleLinks() : staticModuleLinks;
  const allLinks = [...coreLinks, ...moduleLinks];

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700 shadow-lg flex flex-col transition-all duration-300 h-full relative z-40`}>

      {/* Przycisk zwijania */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full shadow-md flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-300 dark:hover:border-pink-600 transition-all z-50"
        title={isCollapsed ? 'Rozwiń sidebar' : 'Zwiń sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* LOGO */}
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-b border-gray-200/50 dark:border-gray-700 flex justify-center items-center shrink-0`}>
        {isCollapsed ? (
          // Stempel gdy sidebar jest zwinięty
          <img src={stampLogo} alt="Logo" className="w-12 h-14 object-contain transition-all duration-300" />
        ) : logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="w-full max-h-32 object-contain rounded-md transition-all duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full aspect-video text-4xl bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-900 dark:to-orange-900 rounded-xl flex items-center justify-center text-pink-600 dark:text-pink-300 font-bold shadow-sm transition-all duration-300">
            S
          </div>
        )}
      </div>

      {/* NAWIGACJA */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} space-y-1 overflow-y-auto custom-scrollbar mt-2`}>
        {allLinks.filter(l => l.show).map(link => {
          const isActive = active === link.path;
          return (
            <Tooltip key={link.path} text={link.label} show={isCollapsed}>
              <Link
                to={link.path}
                className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl transition-all group ${isActive ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/30 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-700 hover:text-pink-600 dark:hover:text-white'}`}
              >
                <link.icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-pink-500 dark:group-hover:text-white transition-colors'}`} />
                {!isCollapsed && <span className="text-sm truncate">{link.label}</span>}
              </Link>
            </Tooltip>
          );
        })}
      </nav>

      {/* USTAWIENIA */}
      {hasModuleAccess('module:settings') && (
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200/50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0`}>
          <Tooltip text="Ustawienia" show={isCollapsed}>
            <Link
              to="/settings"
              className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl transition-all w-full ${active === '/settings' ? 'bg-gray-800 dark:bg-gray-900 text-white shadow-lg' : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Settings size={20} className="shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Ustawienia</span>}
            </Link>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
