import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './modules/Login';
import Dashboard from './modules/Programs/Dashboard';
import Members from './modules/Members';
import WorshipModule from './modules/MusicTeam/WorshipModule';
// POPRAWIONA ŚCIEŻKA PONIŻEJ (zakładając, że plik jest w src/modules):
import MediaTeamModule from './modules/MediaTeamModule'; 

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) setSession(data.session);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      if (authListener?.data?.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar user={session.user} />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/worship" element={<WorshipModule />} />
              <Route path="/media" element={<MediaTeamModule />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
