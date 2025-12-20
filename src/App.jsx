import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { PermissionsProvider } from './contexts/PermissionsContext';

import Sidebar, { SidebarProvider } from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/ToastNotification';
import InstallPrompt from './components/InstallPrompt';
import { useNotifications } from './hooks/useNotifications';
import useOffline from './hooks/useOffline';
import Login from './modules/Login';
import ResetPassword from './modules/ResetPassword';
import PersonalDashboard from './modules/Dashboard/PersonalDashboard';
import ProgramsDashboard from './modules/Programs/Dashboard';
import Members from './modules/Members';
import WorshipModule from './modules/MusicTeam/WorshipModule';
import MediaTeamModule from './modules/MediaTeamModule';
import AtmosferaTeamModule from './modules/AtmosferaTeamModule';
import KidsModule from './modules/Kids/KidsModule';
import HomeGroupsModule from './modules/HomeGroups/HomeGroupsModule';
import FinanceModule from './modules/FinanceModule';
import GlobalSettings from './modules/Settings/GlobalSettings';
import UserSettings from './modules/Settings/UserSettings';
import CalendarModule from './modules/CalendarModule';
import TeachingModule from './modules/Teaching/TeachingModule';
import PrayerWallModule from './modules/PrayerWall/PrayerWallModule';
import KomunikatorModule from './modules/Komunikator/KomunikatorModule';
import MlodziezowkaModule from './modules/MlodziezowkaModule';
import CustomModule from './modules/CustomModule/CustomModule';

// Lista kluczy systemowych modułów (mają dedykowane komponenty)
const SYSTEM_MODULE_KEYS = [
  'dashboard', 'programs', 'calendar', 'members', 'worship', 'media',
  'atmosfera', 'kids', 'homegroups', 'finance', 'teaching', 'prayer',
  'komunikator', 'mlodziezowka', 'settings'
];

// Komponent do wyświetlania toast notifications
function ToastNotifications({ userEmail }) {
  const { toasts, closeToast, handleToastClick } = useNotifications(userEmail);
  return <ToastContainer toasts={toasts} onClose={closeToast} onClick={handleToastClick} />;
}

// Komponent baneru offline
function OfflineBanner() {
  const { isOffline } = useOffline();

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium">
      Brak połączenia z internetem. Niektóre funkcje mogą być niedostępne.
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customModules, setCustomModules] = useState([]);

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

  // Pobierz niestandardowe moduły z bazy danych
  useEffect(() => {
    const fetchCustomModules = async () => {
      try {
        const { data, error } = await supabase
          .from('app_modules')
          .select('*')
          .eq('is_enabled', true)
          .order('display_order', { ascending: true });

        if (!error && data) {
          // Filtruj tylko moduły niestandardowe (nie systemowe)
          const custom = data.filter(m => !SYSTEM_MODULE_KEYS.includes(m.key));
          setCustomModules(custom);
        }
      } catch (err) {
        console.log('Błąd pobierania niestandardowych modułów:', err);
      }
    };

    fetchCustomModules();

    // Subskrybuj zmiany w modułach
    const channel = supabase
      .channel('app-modules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_modules' }, () => {
        fetchCustomModules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  // Sprawdź czy to jest strona resetowania hasła (dostępna bez logowania przy odpowiednim tokenie)
  const isResetPasswordPage = window.location.pathname === '/reset-password' ||
                               window.location.hash.includes('type=recovery');

  if (!session && !isResetPasswordPage) return <Login />;

  // Jeśli użytkownik jest na stronie reset-password (z tokenem w URL)
  if (isResetPasswordPage) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<ResetPassword />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <PermissionsProvider>
        <SidebarProvider>
          <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Navbar user={session.user} darkMode={darkMode} toggleTheme={toggleTheme} />
              {/* Toast Notifications - fixed positioned */}
              <ToastNotifications userEmail={session.user?.email} />
              {/* PWA Install Prompt */}
              <InstallPrompt />
              {/* Offline Banner */}
              <OfflineBanner />
              <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
              <Routes>
                <Route path="/" element={<PersonalDashboard user={session.user} />} />
                <Route path="/programs" element={<ProgramsDashboard />} />
                <Route path="/calendar" element={<CalendarModule />} />
                <Route path="/members" element={
                  <ProtectedRoute resource="module:members"><Members /></ProtectedRoute>
                } />
                <Route path="/worship" element={
                  <ProtectedRoute resource="module:worship"><WorshipModule /></ProtectedRoute>
                } />
                <Route path="/media" element={
                  <ProtectedRoute resource="module:media"><MediaTeamModule /></ProtectedRoute>
                } />
                <Route path="/atmosfera" element={
                  <ProtectedRoute resource="module:atmosfera"><AtmosferaTeamModule /></ProtectedRoute>
                } />
                <Route path="/kids" element={
                  <ProtectedRoute resource="module:kids"><KidsModule /></ProtectedRoute>
                } />
                <Route path="/home-groups" element={
                  <ProtectedRoute resource="module:homegroups"><HomeGroupsModule /></ProtectedRoute>
                } />
                <Route path="/finance" element={
                  <ProtectedRoute resource="module:finance"><FinanceModule /></ProtectedRoute>
                } />
                <Route path="/teaching" element={
                  <ProtectedRoute resource="module:teaching"><TeachingModule /></ProtectedRoute>
                } />
                <Route path="/prayer" element={
                  <ProtectedRoute resource="module:prayer"><PrayerWallModule /></ProtectedRoute>
                } />
                <Route path="/komunikator" element={
                  <ProtectedRoute resource="module:komunikator"><KomunikatorModule /></ProtectedRoute>
                } />
                <Route path="/mlodziezowka" element={
                  <ProtectedRoute resource="module:mlodziezowka"><MlodziezowkaModule /></ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute resource="module:settings"><GlobalSettings /></ProtectedRoute>
                } />
                <Route path="/profile" element={<UserSettings />} />

                {/* Dynamiczne trasy dla niestandardowych modułów */}
                {customModules.map(mod => (
                  <Route
                    key={mod.id}
                    path={mod.path}
                    element={
                      <ProtectedRoute resource={mod.resource_key}>
                        <CustomModule />
                      </ProtectedRoute>
                    }
                  />
                ))}

                {/* Trasa generyczna dla modułów z parametrem (fallback) */}
                <Route path="/module/:moduleKey" element={<CustomModule />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </PermissionsProvider>
    </BrowserRouter>
  );
}
