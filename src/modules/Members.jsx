import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import {
  Plus, Search, Trash2, Edit2, X, User,
  Mail, Phone, CheckCircle, XCircle,
  MapPin, Users, Home
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

// --- STAŁE DANE ---

const HOME_GROUPS = [
  "Wrocław Północ",
  "Wrocław Południe",
  "Wrocław Centrum",
  "Wrocław Zachód",
  "Online",
  "Brak"
];

const STATUS_OPTIONS = [
  "Aktywny",
  "Nieaktywny",
  "Gość",
  "Urlop"
];

// --- GŁÓWNY KOMPONENT ---

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Stan modala
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',      // NOWE POLE
    ministry: '',
    home_group: '',   // NOWE POLE (rozdzielone)
    status: 'Aktywny'
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('last_name');
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Błąd pobierania członków:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { id, ...dataToSave } = formData;
      
      if (!dataToSave.first_name || !dataToSave.last_name) {
        alert("Imię i nazwisko są wymagane");
        return;
      }

      if (id) {
        const { error } = await supabase
          .from('members')
          .update(dataToSave)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('members')
          .insert([dataToSave]);
        if (error) throw error;
      }

      setShowModal(false);
      fetchMembers();
    } catch (error) {
      console.error('Błąd zapisu:', error);
      alert('Wystąpił błąd podczas zapisywania. Sprawdź czy baza danych posiada kolumny "address" i "home_group".');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Czy na pewno chcesz usunąć tego członka?')) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchMembers();
    } catch (error) {
      console.error('Błąd usuwania:', error);
    }
  };

  const openModal = (member = null) => {
    if (member) {
      // Upewniamy się, że nowe pola nie są undefined
      setFormData({
        ...member,
        address: member.address || '',
        home_group: member.home_group || '',
        ministry: member.ministry || ''
      });
    } else {
      setFormData({
        id: null,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        ministry: '',
        home_group: '',
        status: 'Aktywny'
      });
    }
    setShowModal(true);
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = (
      (member.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.home_group || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'active' 
        ? member.status === 'Aktywny'
        : member.status !== 'Aktywny';

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 dark:border-pink-400 mx-auto"></div>
        <div className="mt-4 text-gray-600 dark:text-gray-400">Ładowanie bazy członków...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
          Baza Członków
        </h1>
      </div>

      <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 transition-colors duration-300">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex-1 w-full md:w-auto flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-pink-500/20 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                placeholder="Szukaj..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50 gap-1">
              <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === 'all' ? 'bg-white dark:bg-gray-700 shadow text-pink-600 dark:text-pink-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Wszyscy</button>
              <button onClick={() => setStatusFilter('active')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === 'active' ? 'bg-white dark:bg-gray-700 shadow text-green-600 dark:text-green-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Aktywni</button>
            </div>
          </div>

          <button 
            onClick={() => openModal()} 
            className="bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-500 dark:to-orange-500 text-white text-sm px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-pink-500/30 transition flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18}/> Dodaj osobę
          </button>
        </div>

        <div className="bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-pink-50/80 to-orange-50/80 dark:from-pink-900/20 dark:to-orange-900/20 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200/50 dark:border-gray-700/50">
              <tr>
                <th className="p-4 pl-6">Osoba</th>
                <th className="p-4">Kontakt & Adres</th>
                <th className="p-4">Zaangażowanie</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-pink-50/30 dark:hover:bg-pink-900/10 transition duration-200">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-900 dark:to-orange-900 flex items-center justify-center text-pink-700 dark:text-pink-300 font-bold shadow-sm border border-white dark:border-gray-700">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 dark:text-gray-200">{member.first_name} {member.last_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {member.id?.toString().slice(0, 4)}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="space-y-1">
                      {member.email && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs"><Mail size={14} className="text-pink-400" /> {member.email}</div>}
                      {member.phone && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs"><Phone size={14} className="text-orange-400" /> {member.phone}</div>}
                      {member.address && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs"><MapPin size={14} className="text-green-500" /> {member.address}</div>}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      {member.ministry && (
                         <span className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-md text-xs font-medium">
                           <User size={12} className="text-pink-500"/> {member.ministry}
                         </span>
                      )}
                      {member.home_group && (
                        <span className="inline-flex items-center gap-1.5 bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30 text-pink-700 dark:text-pink-300 px-2.5 py-1 rounded-md text-xs font-medium">
                          <Home size={12} /> {member.home_group}
                        </span>
                      )}
                      {!member.ministry && !member.home_group && <span className="text-gray-400 dark:text-gray-600 text-xs">-</span>}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      member.status === 'Aktywny' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-800/50'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-gray-700/50'
                    }`}>
                      {member.status === 'Aktywny' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {member.status || 'Nieaktywny'}
                    </span>
                  </td>

                  <td className="p-4 pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(member)} className="p-2 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg transition"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(member.id)} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL */}
      {showModal && document.body && createPortal(
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] transition-opacity">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-white/20 dark:border-gray-700/50 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
                {formData.id ? 'Edytuj dane' : 'Nowa osoba'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-full transition">
                <X size={24} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Imię i Nazwisko */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Imię</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-pink-500/20 outline-none text-gray-900 dark:text-gray-100"
                    value={formData.first_name} 
                    onChange={e => setFormData({...formData, first_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Nazwisko</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-pink-500/20 outline-none text-gray-900 dark:text-gray-100"
                    value={formData.last_name} 
                    onChange={e => setFormData({...formData, last_name: e.target.value})} 
                  />
                </div>
              </div>

              {/* Kontakt */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Email</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-pink-500/20 outline-none text-gray-900 dark:text-gray-100"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Telefon</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-pink-500/20 outline-none text-gray-900 dark:text-gray-100"
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
                {/* DROPDOWN STATUSU */}
                <div>
                  <CustomSelect 
                    label="Status"
                    value={formData.status}
                    options={STATUS_OPTIONS}
                    onChange={(val) => setFormData({...formData, status: val})}
                  />
                </div>
              </div>

              {/* Nowe pole Adres */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Adres Zamieszkania</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    className="w-full pl-10 pr-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-pink-500/20 outline-none text-gray-900 dark:text-gray-100"
                    placeholder="Ulica, numer domu, miasto"
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                  />
                </div>
              </div>

              {/* Grupa i Służba (Rozdzielone) */}
              <div className="grid grid-cols-2 gap-4">
                {/* DROPDOWN GRUP DOMOWYCH */}
                <div>
                  <CustomSelect 
                    label="Grupa Domowa"
                    placeholder="Wybierz grupę..."
                    value={formData.home_group}
                    options={HOME_GROUPS}
                    onChange={(val) => setFormData({...formData, home_group: val})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Służba</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-pink-500/20 outline-none text-gray-900 dark:text-gray-100"
                    placeholder="np. Media, Lider"
                    value={formData.ministry} 
                    onChange={e => setFormData({...formData, ministry: e.target.value})} 
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">Anuluj</button>
                <button onClick={handleSave} className="px-8 py-3 bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-500 dark:to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition">Zapisz</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
