import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './modules/Login';
import Dashboard from './modules/Programs/Dashboard';
import Members from './modules/Members';
import WorshipModule from './modules/MusicTeam/WorshipModule';
import MediaTeamModule from './modules/MediaTeamModule';
import AtmosferaTeamModule from './modules/AtmosferaTeamModule'; // NOWY MODUŁ
import KidsModule from './modules/Kids/KidsModule';
import HomeGroupsModule from './modules/HomeGroups/HomeGroupsModule';
import FinanceModule from './modules/FinanceModule';
import GlobalSettings from './modules/Settings/GlobalSettings';
import UserSettings from './modules/Settings/UserSettings';
import CalendarModule from './modules/CalendarModule'; // <-- Import

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Stan dla trybu ciemnego (domyślnie false)
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  // Efekt do nakładania klasy 'dark' na HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

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
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar user={session.user} darkMode={darkMode} toggleTheme={toggleTheme} />
          <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/worship" element={<WorshipModule />} />
              <Route path="/media" element={<MediaTeamModule />} />
              <Route path="/atmosfera" element={<AtmosferaTeamModule />} /> {/* NOWY ROUTE */}
              <Route path="/kids" element={<KidsModule />} />
              <Route path="/home-groups" element={<HomeGroupsModule />} />
              <Route path="/finance" element={<FinanceModule />} />
              <Route path="/settings" element={<GlobalSettings />} />
              <Route path="/profile" element={<UserSettings />} />
              <Route path="/calendar" element={<CalendarModule />} /> {/* <-- NOWE */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
