import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Download, Upload, Search, Edit, Trash2, X, Save, LayoutGrid, List } from 'lucide-react';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' lub 'cards'
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    status: 'Członek',
    join_date: '',
    group_home: '',
    ministry: ''
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase.from('members').select('*').order('last_name');
    setMembers(data || []);
  };

  const handleSave = async () => {
    const payload = { ...formData };
    // Usuwamy pustą datę, żeby SQL nie zgłaszał błędu formatu
    if (!payload.join_date) delete payload.join_date;

    if (formData.id) {
      await supabase.from('members').update(payload).eq('id', formData.id);
    } else {
      const { id, ...newMember } = payload;
      await supabase.from('members').insert([newMember]);
    }
    setShowModal(false);
    fetchMembers();
    resetForm();
  };

  const handleDelete = async (id) => {
    if (confirm('Czy na pewno chcesz trwale usunąć tego członka?')) {
      await supabase.from('members').delete().eq('id', id);
      fetchMembers();
    }
  };

  const openEdit = (member) => {
    setFormData(member);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      status: 'Członek',
      join_date: '',
      group_home: '',
      ministry: ''
    });
  };

  const handleExportCSV = () => {
    const headers = ['Imię', 'Nazwisko', 'Email', 'Telefon', 'Adres', 'Status', 'Data członkostwa', 'Grupa domowa', 'Służba'];
    const rows = members.map(m => [m.first_name, m.last_name, m.email, m.phone, m.address, m.status, m.join_date, m.group_home, m.ministry]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'czlonkowie.csv';
    link.click();
  };

  const filteredMembers = members.filter(m => 
    (m.first_name + ' ' + m.last_name).toLowerCase().includes(filter.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* NAGŁÓWEK */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Baza Członków</h1>
        <div className="flex gap-3">
          <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm">
            <Plus size={18} /> Dodaj Członka
          </button>
          <button onClick={handleExportCSV} className="bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded font-medium hover:bg-gray-50 flex items-center gap-2">
            <Download size={18} /> Eksport CSV
          </button>
        </div>
      </div>

      {/* FILTRY I PRZEŁĄCZNIK WIDOKU */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4 flex justify-between items-center">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input 
            className="w-full pl-10 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-200 outline-none" 
            placeholder="Szukaj..." 
            value={filter} onChange={e => setFilter(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button 
            onClick={() => setViewMode('table')} 
            className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={18} /> Lista
          </button>
          <button 
            onClick={() => setViewMode('cards')} 
            className={`p-2 rounded-md flex items-center gap-2 text-sm font-medium transition ${viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid size={18} /> Karty
          </button>
        </div>
      </div>

      {/* WIDOK TABELI */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm font-bold border-b border-gray-200">
                <th className="p-4">Imię i nazwisko</th>
                <th className="p-4">Email</th>
                <th className="p-4">Telefon</th>
                <th className="p-4">Status</th>
                <th className="p-4">Grupa domowa</th>
                <th className="p-4">Służba</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors text-sm text-gray-700">
                  <td className="p-4 font-medium text-gray-900">{m.first_name} {m.last_name}</td>
                  <td className="p-4 text-gray-600">{m.email}</td>
                  <td className="p-4 text-gray-600">{m.phone}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${m.status === 'Członek' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-4">{m.group_home}</td>
                  <td className="p-4">{m.ministry}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => openEdit(m)} className="bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200 text-xs font-medium">Edytuj</button>
                    <button onClick={() => handleDelete(m.id)} className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-xs font-medium">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* WIDOK KART */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map(m => (
            <div key={m.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold uppercase">
                  {(m.first_name?.[0] || '')}{(m.last_name?.[0] || '')}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${m.status === 'Członek' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {m.status}
                </span>
              </div>
              
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {m.first_name} {m.last_name}
              </h3>
              <p className="text-sm text-gray-500 mb-4 truncate" title={m.email}>
                {m.email || 'Brak email'}
              </p>
              
              <div className="space-y-2 text-sm text-gray-600 mb-6 flex-1">
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-400">Telefon:</span> 
                  <span className="font-medium text-right">{m.phone || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-400">Grupa:</span> 
                  <span className="font-medium text-right">{m.group_home || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-400">Służba:</span> 
                  <span className="font-medium text-right truncate max-w-[150px]" title={m.ministry}>{m.ministry || '-'}</span>
                </div>
                 <div className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-400">Od:</span> 
                  <span className="font-medium text-right">{m.join_date || '-'}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
                <button 
                  onClick={() => openEdit(m)} 
                  className="flex-1 bg-white text-gray-700 py-2 rounded text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-colors"
                >
                  Edytuj
                </button>
                <button 
                  onClick={() => handleDelete(m.id)} 
                  className="flex-1 bg-white text-red-600 py-2 rounded text-sm font-medium hover:bg-red-50 border border-red-100 transition-colors"
                >
                  Usuń
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORMULARZ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">{formData.id ? 'Edytuj Członka' : 'Dodaj Członka'}</h2>
              <button onClick={() => setShowModal(false)}><X size={24} className="text-gray-400"/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Imię</label>
                  <input className="w-full p-3 border border-gray-300 rounded-lg" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nazwisko</label>
                  <input className="w-full p-3 border border-gray-300 rounded-lg" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input className="w-full p-3 border border-gray-300 rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Telefon</label>
                <input className="w-full p-3 border border-gray-300 rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Adres</label>
                <input className="w-full p-3 border border-gray-300 rounded-lg" placeholder="ul. Kwiatowa 5, Warszawa" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Status *</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option>Członek</option>
                  <option>Sympatyk</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Data członkostwa</label>
                <input type="date" className="w-full p-3 border border-gray-300 rounded-lg" value={formData.join_date} onChange={e => setFormData({...formData, join_date: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Grupa domowa</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg bg-white" value={formData.group_home} onChange={e => setFormData({...formData, group_home: e.target.value})}>
                  <option value="">-- Wybierz grupę --</option>
                  <option>Grupa Centrum</option>
                  <option>Grupa Północ</option>
                  <option>Grupa Południe</option>
                  <option>Grupa Młodzieżowa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Służba</label>
                <input className="w-full p-3 border border-gray-300 rounded-lg" value={formData.ministry} onChange={e => setFormData({...formData, ministry: e.target.value})} />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
              <button onClick={() => setShowModal(false)} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Anuluj</button>
              <button onClick={handleSave} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Zapisz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
