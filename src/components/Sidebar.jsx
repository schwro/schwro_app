import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Music, Video, Home, School, UserCircle } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const active = location.pathname;

  const links = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/programs', icon: Calendar, label: 'Programy' },
    { path: '/members', icon: Users, label: 'Członkowie' },
    { path: '/worship', icon: Music, label: 'Grupa Uwielbienia' },
    { path: '/media', icon: Video, label: 'MediaTeam' },
    { path: '/sunday-school', icon: School, label: 'Szkoła Niedzielna' },
    { path: '/groups', icon: UserCircle, label: 'Grupy domowe' },
  ];

  return (
    <div className="w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200/50">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          SchWro App
        </h1>
        <p className="text-xs text-gray-500 mt-1">Zarządzanie Kościołem</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(link => {
          const isActive = active === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-700 hover:bg-gray-100/80'
              }`}
            >
              <link.icon size={20} />
              <span className="font-medium text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
