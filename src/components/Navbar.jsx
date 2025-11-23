import React from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Navbar({ user }) {
  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
      <div className="text-gray-500">Zalogowany: <span className="font-bold text-gray-800">{user?.email}</span></div>
      <button 
        onClick={() => supabase.auth.signOut()}
        className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-md transition"
      >
        <LogOut size={18} /> Wyloguj
      </button>
    </header>
  );
}
