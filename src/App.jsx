import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './modules/Login';
import Dashboard from './modules/Programs/Dashboard';
import Members from './modules/Members';
import WorshipModule from './modules/MusicTeam/WorshipModule'; // Nowa ścieżka!
import MediaTeam from './modules/MediaTeam';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) setSession(data.session);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      if (authListener?.data?.subscription) authListener.data.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">Ładowanie...</div>;
  if (!session) return <Login />;

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar user={session.user} />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/worship" element={<WorshipModule />} />
              <Route path="/media" element={<MediaTeam />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
