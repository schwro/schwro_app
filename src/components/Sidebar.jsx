import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Music, Users, Video, Home } from 'lucide-react';

export default function Sidebar() {
  const links = [
    { name: 'Członkowie', path: '/members', icon: Users }, 
    { name: 'Programy', path: '/', icon: Calendar },
    { name: 'Grupa Uwielbienia', path: '/worship', icon: Music },
    { name: 'Media Team', path: '/media', icon: Video },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-full flex flex-col">
      <div className="p-6 text-2xl font-bold flex items-center gap-2">
        <Home /> SchWro App
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <link.icon size={20} />
            {link.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
