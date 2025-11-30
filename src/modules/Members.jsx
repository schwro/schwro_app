import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Search, Trash2, Edit2, X, User, 
  Mail, Phone, Filter, CheckCircle, XCircle 
} from 'lucide-react';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Stan modala
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    ministry: '',
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
      alert('Wystąpił błąd podczas zapisywania.');
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
      setFormData(member);
    } else {
      setFormData({
        id: null,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        ministry: '',
        status: 'Aktywny'
      });
    }
    setShowModal(true);
  };

  // Filtrowanie
  const filteredMembers = members.filter(member => {
    const matchesSearch = (
      (member.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <div className="mt-4 text-gray-600">Ładowanie bazy członków...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* NAGŁÓWEK */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Baza Członków
        </h1>
      </div>

      {/* GŁÓWNY KONTENER - STYL GLASSMORPHISM */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        
        {/* PASEK NARZĘDZI (SZUKANIE / FILTROWANIE / DODAWANIE) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          
          <div className="flex-1 w-full md:w-auto flex items-center gap-3">
            {/* Wyszukiwarka */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                placeholder="Szukaj po imieniu, nazwisku, email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtr Statusu */}
            <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-gray-200/50 gap-1">
              <button 
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === 'all' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Wszyscy
              </button>
              <button 
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === 'active' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Aktywni
              </button>
            </div>
          </div>

          <button 
            onClick={() => openModal()} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18}/> Dodaj osobę
          </button>
        </div>

        {/* TABELA */}
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 text-gray-700 font-bold border-b border-gray-200/50">
              <tr>
                <th className="p-4 pl-6">Osoba</th>
                <th className="p-4">Kontakt</th>
                <th className="p-4">Służba / Grupa</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    Nie znaleziono członków spełniających kryteria.
                  </td>
                </tr>
              ) : filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-blue-50/30 transition duration-200">
                  
                  {/* Kolumna: Osoba */}
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-700 font-bold shadow-sm border border-white">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{member.first_name} {member.last_name}</div>
                        <div className="text-xs text-gray-500">ID: {member.id.toString().slice(0, 4)}...</div>
                      </div>
                    </div>
                  </td>

                  {/* Kolumna: Kontakt */}
                  <td className="p-4">
                    <div className="space-y-1">
                      {member.email && (
                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                          <Mail size={14} className="text-blue-400" /> {member.email}
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                          <Phone size={14} className="text-purple-400" /> {member.phone}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Kolumna: Służba */}
                  <td className="p-4">
                    {member.ministry ? (
                      <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium shadow-sm">
                        {member.ministry}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>

                  {/* Kolumna: Status */}
                  <td className="p-4">
                    {member.status === 'Aktywny' ? (
                      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200/50">
                        <CheckCircle size={12} /> Aktywny
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200/50">
                        <XCircle size={12} /> {member.status || 'Nieaktywny'}
                      </span>
                    )}
                  </td>

                  {/* Kolumna: Akcje */}
                  <td className="p-4 pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(member)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edytuj"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(member.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Usuń"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-white/20 relative animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {formData.id ? 'Edytuj dane' : 'Nowa osoba'}
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 hover:bg-gray-100/50 rounded-full transition"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Imię</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Jan" 
                    value={formData.first_name} 
                    onChange={e => setFormData({...formData, first_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nazwisko</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Kowalski" 
                    value={formData.last_name} 
                    onChange={e => setFormData({...formData, last_name: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="jan@example.com" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Telefon</label>
                  <input 
                    className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="123 456 789" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Status</label>
                  <select 
                    className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Aktywny">Aktywny</option>
                    <option value="Nieaktywny">Nieaktywny</option>
                    <option value="Gość">Gość</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Służba / Grupa</label>
                <input 
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="np. Uwielbienie, Media..." 
                  value={formData.ministry} 
                  onChange={e => setFormData({...formData, ministry: e.target.value})} 
                />
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
                >
                  Anuluj
                </button>
                <button 
                  onClick={handleSave} 
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition"
                >
                  Zapisz
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
