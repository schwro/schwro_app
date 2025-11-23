import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Trash2, X } from 'lucide-react';
import SongForm from './SongForm';

export default function WorshipModule() {
  const [team, setTeam] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showSongModal, setShowSongModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  
  const [songForm, setSongForm] = useState({});
  const [memberForm, setMemberForm] = useState({ id: null, full_name: '', role: '', status: 'Aktywny', phone: '', email: '' });

  const [songFilter, setSongFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: t, error: tError } = await supabase.from('worship_team').select('*').order('full_name');
      const { data: s, error: sError } = await supabase.from('songs').select('*').order('title');
      if (tError) console.error('worship_team error:', tError);
      if (sError) console.error('songs error:', sError);
      setTeam(t || []);
      setSongs(s || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const saveMember = async () => {
    if (memberForm.id) await supabase.from('worship_team').update(memberForm).eq('id', memberForm.id);
    else { const { id, ...rest } = memberForm; await supabase.from('worship_team').insert([rest]); }
    setShowMemberModal(false); fetchData();
  };

  const deleteMember = async (id) => {
    if(confirm('Usunąć?')) { await supabase.from('worship_team').delete().eq('id', id); fetchData(); }
  };

  const deleteSong = async (id) => {
    if(confirm('Usunąć pieśń?')) { await supabase.from('songs').delete().eq('id', id); fetchData(); }
  };

  const filteredSongs = songs.filter(s => (s.title || '').toLowerCase().includes(songFilter.toLowerCase()));

  if (loading) return <div className="p-10 text-gray-500">Ładowanie...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold text-gray-900">Grupa Uwielbienia</h1>

      {/* CZŁONKOWIE */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Członkowie Zespołu</h2>
          <button onClick={() => { setMemberForm({ id: null, full_name: '', role: '', status: 'Aktywny', phone: '', email: '' }); setShowMemberModal(true); }} className="bg-blue-600 text-white text-sm px-4 py-2 rounded font-medium hover:bg-blue-700 flex items-center gap-2"><Plus size={16}/> Dodaj członka</button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b">
              <tr>
                <th className="p-4">Imię i nazwisko</th>
                <th className="p-4">Rola</th>
                <th className="p-4">Status</th>
                <th className="p-4">Telefon</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {team.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400">Brak danych</td></tr>
              ) : team.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{m.full_name}</td>
                  <td className="p-4">{m.role}</td>
                  <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">{m.status}</span></td>
                  <td className="p-4 text-gray-500">{m.phone}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setMemberForm(m); setShowMemberModal(true); }} className="text-blue-600 hover:underline">Edytuj</button>
                    <button onClick={() => deleteMember(m.id)} className="text-red-500 hover:underline">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PIEŚNI */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Baza Pieśni</h2>
          <button onClick={() => { setSongForm({}); setShowSongModal(true); }} className="bg-blue-600 text-white text-sm px-4 py-2 rounded font-medium hover:bg-blue-700 flex items-center gap-2"><Plus size={16}/> Dodaj pieśń</button>
        </div>

        <div className="bg-white p-4 mb-4 rounded border flex items-center gap-2">
          <Search className="text-gray-400" size={20} />
          <input className="w-full outline-none text-sm" placeholder="Szukaj pieśni..." value={songFilter} onChange={e => setSongFilter(e.target.value)} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b">
              <tr>
                <th className="p-4">Tytuł</th>
                <th className="p-4">Kategoria</th>
                <th className="p-4">Tonacja</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSongs.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-400">Brak danych</td></tr>
              ) : filteredSongs.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold">{s.title}</td>
                  <td className="p-4">{s.category}</td>
                  <td className="p-4 font-mono font-bold text-blue-600">{s.key}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setSongForm(s); setShowSongModal(true); }} className="text-blue-600 hover:underline">Edytuj</button>
                    <button onClick={() => deleteSong(s.id)} className="text-red-500 hover:underline">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL CZŁONKA */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">Członek Zespołu</h3><button onClick={() => setShowMemberModal(false)}><X size={20}/></button></div>
            <div className="space-y-3">
              <input className="w-full p-2 border rounded" placeholder="Imię i nazwisko" value={memberForm.full_name} onChange={e => setMemberForm({...memberForm, full_name: e.target.value})} />
              <input className="w-full p-2 border rounded" placeholder="Rola (np. Wokal)" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} />
              <input className="w-full p-2 border rounded" placeholder="Telefon" value={memberForm.phone} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowMemberModal(false)} className="px-4 py-2 border rounded">Anuluj</button>
                <button onClick={saveMember} className="px-4 py-2 bg-blue-600 text-white rounded">Zapisz</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PIEŚNI */}
      {showSongModal && (
        <SongForm 
          initialData={songForm} 
          onSave={async (data) => {
             if (data.id) await supabase.from('songs').update(data).eq('id', data.id);
             else { const { id, ...rest } = data; await supabase.from('songs').insert([rest]); }
             setShowSongModal(false); fetchData();
          }}
          onCancel={() => setShowSongModal(false)}
        />
      )}
    </div>
  );
}
