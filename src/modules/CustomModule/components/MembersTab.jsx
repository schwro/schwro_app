import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import { Plus, Search, Trash2, X, User, Mail, Phone, Save } from 'lucide-react';

export default function MembersTab({ moduleKey, moduleName }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: '' });

  const tableName = `custom_${moduleKey}_members`;

  // Pobierz członków
  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Najpierw sprawdź czy tabela istnieje, jeśli nie - utwórz
      const { error: checkError } = await supabase.from(tableName).select('id').limit(1);

      if (checkError && checkError.code === '42P01') {
        // Tabela nie istnieje - wyświetl komunikat
        setMembers([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Błąd pobierania członków:', err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [moduleKey]);

  // Filtrowanie
  const filteredMembers = members.filter(m =>
    m.full_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Zapisz członka
  const handleSave = async () => {
    if (!form.full_name) return;

    try {
      if (editingMember) {
        await supabase.from(tableName).update(form).eq('id', editingMember.id);
      } else {
        await supabase.from(tableName).insert([form]);
      }
      setShowModal(false);
      setEditingMember(null);
      setForm({ full_name: '', email: '', phone: '', role: '' });
      fetchMembers();
    } catch (err) {
      console.error('Błąd zapisu:', err);
      alert('Błąd zapisu członka. Upewnij się, że tabela istnieje w bazie danych.');
    }
  };

  // Usuń członka
  const handleDelete = async (id) => {
    if (!confirm('Usunąć tego członka?')) return;
    try {
      await supabase.from(tableName).delete().eq('id', id);
      fetchMembers();
    } catch (err) {
      console.error('Błąd usuwania:', err);
    }
  };

  // Otwórz modal do edycji
  const openEditModal = (member) => {
    setEditingMember(member);
    setForm({
      full_name: member.full_name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || ''
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
          Członkowie ({filteredMembers.length})
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Szukaj..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:border-pink-500 outline-none"
            />
          </div>
          <button
            onClick={() => {
              setEditingMember(null);
              setForm({ full_name: '', email: '', phone: '', role: '' });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition"
          >
            <Plus size={18} />
            Dodaj
          </button>
        </div>
      </div>

      {/* Lista członków */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map(member => (
            <div
              key={member.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold">
                    {member.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white">{member.full_name}</h4>
                    {member.role && (
                      <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full">
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-1.5 text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition"
                  >
                    <User size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {(member.email || member.phone) && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
                  {member.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Mail size={14} />
                      {member.email}
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Phone size={14} />
                      {member.phone}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center">
          <User size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Brak członków</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Kliknij "Dodaj" aby dodać pierwszego członka
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && document.body && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                {editingMember ? 'Edytuj członka' : 'Nowy członek'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Imię i nazwisko *
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  placeholder="Jan Kowalski"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  placeholder="jan@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  placeholder="+48 123 456 789"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Rola
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  placeholder="np. Lider, Członek"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition"
              >
                <Save size={18} />
                Zapisz
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
