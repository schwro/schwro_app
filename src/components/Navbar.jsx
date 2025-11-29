import React from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Bell, Settings } from 'lucide-react';

export default function Navbar({ user }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="h-16 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm flex items-center justify-between px-6">
      <div className="text-lg font-semibold text-gray-800">
        {/* Opcjonalnie: nazwa strony/sekcji */}
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-xl hover:bg-gray-100/80 transition">
          <Bell size={20} className="text-gray-600" />
        </button>
        <button className="p-2 rounded-xl hover:bg-gray-100/80 transition">
          <Settings size={20} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-gray-200/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.email || 'Admin'}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition font-medium text-sm"
        >
          <LogOut size={16} />
          Wyloguj
        </button>
      </div>
    </div>
  );
}
