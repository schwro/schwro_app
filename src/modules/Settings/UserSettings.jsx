import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  User, Lock, Camera, Save, Loader2, CheckCircle, AlertCircle, Mail, Key
} from 'lucide-react';

export default function UserSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [userSession, setUserSession] = useState(null);

  // Dane formularza
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    avatar_url: null
  });

  // Dane hasła
  const [passData, setPassData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // 1. Pobierz sesję (aby znać email)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserSession(user);

      // 2. Pobierz dane z tabeli app_users na podstawie emaila
      const { data: profile } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', user.email)
        .single();

      if (profile) {
        setFormData({
          full_name: profile.full_name || '',
          email: profile.email, // Email jest read-only
          avatar_url: profile.avatar_url
        });
      } else {
        // Fallback, jeśli nie ma profilu w app_users (np. superadmin)
        setFormData({ full_name: '', email: user.email, avatar_url: null });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // --- LOGIKA AVATARA ---
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${userSession.id}-${Date.now()}.${fileExt}`;
      
      // Upload do Supabase Storage
      const { error: uploadError } = await supabase.storage.from('public-assets').upload(fileName, file);
      if (uploadError) throw uploadError;

      // Pobranie publicznego URL
      const { data } = supabase.storage.from('public-assets').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      // Aktualizacja stanu i bazy
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      await updateProfileData({ avatar_url: publicUrl });
      
      setMessage({ type: 'success', text: 'Zdjęcie profilowe zaktualizowane!' });
      // Przeładowanie strony, aby odświeżyć avatar w Sidebarze
      setTimeout(() => window.location.reload(), 1000);

    } catch (err) {
      setMessage({ type: 'error', text: 'Błąd wysyłania zdjęcia.' });
    }
    setSaving(false);
  };

  // --- LOGIKA DANYCH OSOBOWYCH ---
  const updateProfileData = async (updates = {}) => {
    // Łączymy aktualny stan formularza z ewentualnymi nadpisaniami (np. avatar)
    const dataToUpdate = { 
      full_name: formData.full_name, 
      ...updates 
    };

    try {
      // Aktualizacja w app_users
      const { error } = await supabase
        .from('app_users')
        .update(dataToUpdate)
        .eq('email', formData.email);

      if (error) throw error;

      // Opcjonalnie: Aktualizacja metadanych w Auth (dla spójności)
      await supabase.auth.updateUser({
        data: { full_name: dataToUpdate.full_name }
      });

    } catch (err) {
      console.error("Błąd aktualizacji profilu:", err);
      throw err;
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfileData();
      setMessage({ type: 'success', text: 'Dane zapisane pomyślnie.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Nie udało się zapisać danych.' });
    }
    setSaving(false);
  };

  // --- LOGIKA HASŁA ---
  const handleChangePassword = async () => {
    setMessage(null);
    if (passData.newPassword !== passData.confirmPassword) {
      return setMessage({ type: 'error', text: 'Hasła nie są identyczne.' });
    }
    if (passData.newPassword.length < 6) {
      return setMessage({ type: 'error', text: 'Hasło musi mieć min. 6 znaków.' });
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passData.newPassword });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Hasło zostało zmienione.' });
      setPassData({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600 dark:text-pink-400"/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">Mój Profil</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 cursor-pointer animate-fade-in ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`} onClick={() => setMessage(null)}>
          {message.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>} {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEWA KOLUMNA: Karta Profilu i Avatar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center relative overflow-hidden transition-colors duration-300">
            <div className="w-full h-24 bg-gradient-to-r from-pink-500 to-orange-500 absolute top-0 left-0 opacity-10"></div>
            
            <div className="relative mt-4 mb-4 group">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-700 shadow-xl overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-gray-300 dark:text-gray-600" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-pink-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-pink-700 dark:hover:bg-pink-500 shadow-lg transition-transform hover:scale-110">
                <Camera size={18} />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={saving}/>
              </label>
            </div>

            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{formData.full_name || 'Użytkownik'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formData.email}</p>
          </div>
        </div>

        {/* PRAWA KOLUMNA: Formularze */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* DANE OSOBOWE */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-xl text-pink-600 dark:text-pink-400"><User size={24} /></div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Dane Osobowe</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Imię i Nazwisko</label>
                <input 
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 outline-none transition"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Np. Jan Kowalski"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Adres Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500"/>
                  <input 
                    className="w-full p-3 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    value={formData.email}
                    disabled
                  />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-1">Zmiana adresu email wymaga kontaktu z administratorem.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={handleSaveProfile} disabled={saving} className="bg-pink-600 dark:bg-pink-500 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:bg-pink-700 dark:hover:bg-pink-600 transition flex items-center gap-2">
                {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Zapisz zmiany
              </button>
            </div>
          </div>

          {/* BEZPIECZEŃSTWO */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400"><Lock size={24} /></div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Bezpieczeństwo</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Nowe hasło</label>
                <div className="relative">
                  <Key size={18} className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500"/>
                  <input 
                    type="password"
                    className="w-full p-3 pl-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-red-400 dark:focus:border-red-500 outline-none transition"
                    placeholder="••••••••"
                    value={passData.newPassword}
                    onChange={e => setPassData({...passData, newPassword: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Potwierdź hasło</label>
                <div className="relative">
                  <Key size={18} className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500"/>
                  <input 
                    type="password"
                    className="w-full p-3 pl-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-red-400 dark:focus:border-red-500 outline-none transition"
                    placeholder="••••••••"
                    value={passData.confirmPassword}
                    onChange={e => setPassData({...passData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={handleChangePassword} disabled={saving} className="bg-gray-800 dark:bg-gray-700 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:bg-black dark:hover:bg-gray-600 transition flex items-center gap-2">
                {saving ? <Loader2 size={18} className="animate-spin"/> : <Lock size={18}/>} Zmień hasło
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
