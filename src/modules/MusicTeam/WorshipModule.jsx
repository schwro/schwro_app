import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Trash2, X, FileText, Music } from 'lucide-react';
import SongForm from './SongForm';

const TAGS = [
  "intymna", "modlitewna", "niedzielna", "popularna", "szybko", "uwielbienie", "wolna"
];
const CHORDS = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

function transposeChord(chord, steps) {
  const idx = CHORDS.findIndex(c => chord.startsWith(c));
  if (idx === -1) return chord;
  const mod = (idx + steps + 12) % 12;
  return chord.replace(CHORDS[idx], CHORDS[mod]);
}
function transposeLine(line, steps) {
  return line.replace(/\b([A-G][b#]?)(m7|m|7|sus4|add2|dim|aug|maj7)?(\/[A-G][b#]?)?\b/g,
    (all, root, qual, bass) => transposeChord(root, steps) + (qual || "") + (bass || ""));
}

function SongDetailsModal({ song, onClose, onEdit }) {
  const [transpose, setTranspose] = useState(0);
  const originalKey = song.key || "C";
  const actualKeyIdx = CHORDS.indexOf(originalKey);
  const displayKey = CHORDS[(actualKeyIdx + transpose + 12) % 12];
  const usageHistory = [
    { date: "2025-10-20", desc: "Nabożeństwo 20 października 2025" },
    { date: "2025-10-13", desc: "Nabożeństwo 13 października 2025" },
  ];
  const transposedLyricsChords = song.lyrics_chords
    ? song.lyrics_chords.split("\n").map(line => transposeLine(line, transpose)).join("\n")
    : "";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* HEADER */}
        <div className="flex justify-between items-center py-6 px-8 border-b">
          <div className="text-xl font-bold text-gray-900">{song.title}</div>
          <button onClick={onClose}><X size={28} className="text-gray-400 hover:text-gray-700" /></button>
        </div>

        {/* AKORDY */}
        <div className="px-8 pt-8">
          <div className="font-bold text-blue-700 mb-2 text-lg">Tekst z akordami (pełna wersja)</div>
          <pre className="bg-gray-50 rounded border p-4 text-gray-700 font-mono text-sm min-h-[120px]">{transposedLyricsChords || "(brak tekstu)"}</pre>
        </div>

        {/* ZAŁĄCZNIKI */}
        <div className="px-8 pt-5 pb-0">
          <div className="font-bold text-gray-900 text-base mb-2">Załączniki:</div>
          <div className="space-y-2">
            {Array.isArray(song.attachments) && song.attachments.length > 0
              ? song.attachments.map((file,i) =>
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded border p-3">
                    {file.name?.endsWith('.mp3') 
                      ? <Music size={18} className="text-blue-600"/> 
                      : <FileText size={18} className="text-black"/>}
                    <span className="font-semibold">{file.name}</span>
                    <span className="ml-auto text-xs text-gray-500">
                      {file.size ? (file.size > 1024*1024 
                        ? (file.size/1024/1024).toFixed(1) + " MB"
                        : (file.size/1024).toFixed(0) + " KB") : ''}
                    </span>
                  </div>)
              : <div className="text-gray-500 text-sm">Brak załączników</div>
            }
          </div>
        </div>

        {/* HISTORIA */}
        <div className="px-8 py-5 mt-4 bg-blue-50 border-t border-b">
          <div className="font-bold text-blue-700 text-md mb-1">Historia wykorzystania ({usageHistory.length}x)</div>
          <div className="text-gray-600 text-sm mb-2">
            Ostatnio użyto: poniedziałek, 20 października 2025
          </div>
          {usageHistory.map((row, idx) => (
            <div key={idx} className="bg-white py-2 px-4 rounded mb-2 border">
              <b>{new Date(row.date).toLocaleDateString('pl-PL', {weekday:'long',day:'numeric', month:'long', year:'numeric'})}</b>
              {" – "}{row.desc}
            </div>
          ))}
        </div>

        {/* PARAMETRY i PODWÓJNA KOLUMNA */}
        <div className="px-8 pt-7 pb-4">
          <div className="font-bold text-blue-700 text-2xl mb-2">{song.title}</div>
          <div className="mb-3 text-base"><b>Kategoria:</b> {song.category}</div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <b>Tonacja:</b>
            <button
              onClick={()=>setTranspose(transpose-1)}
              className="px-2 py-1 rounded border bg-white text-blue-700 font-bold hover:bg-blue-50">▼ Niżej</button>
            <span className="font-bold text-lg mx-1">{displayKey}</span>
            <button
              onClick={()=>setTranspose(transpose+1)}
              className="px-2 py-1 rounded border bg-white text-blue-700 font-bold hover:bg-blue-50">▲ Wyżej</button>
            <span className="ml-2 text-xs text-gray-500">(Oryginalna: <b>{originalKey}</b>)</span>
            <button
              onClick={()=>setTranspose(0)}
              className="px-2 py-1 rounded text-xs ml-2 border-gray-200 text-gray-500 border hover:bg-gray-50">Reset</button>
          </div>
          <div className="mb-1 text-base">
            <b>Tempo:</b> {song.tempo ? `${song.tempo} BPM` : "–"}
          </div>
          <div className="mb-1 text-base">
            <b>Metrum:</b> {song.meter || "–"}
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            <b>Tagi:</b>
            {Array.isArray(song.tags) && song.tags.length ? song.tags.map((t,i) =>
              <span key={i} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{t}</span>
            ) : <span className="text-gray-400 text-xs">brak</span>}
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <b>Pliki:</b>{' '}
            {song.sheet_music_url
              ? <a href={song.sheet_music_url} className="underline text-blue-700 cursor-pointer" target="_blank" rel="noopener noreferrer">Zobacz nuty ↗</a>
              : <span className="text-gray-400 text-xs ml-1">brak</span>}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <div className="font-bold text-blue-700 mb-1">Tekst pieśni</div>
              <pre className="bg-gray-50 border rounded h-32 p-3 text-sm font-mono text-gray-900">{song.lyrics || "(brak)"}</pre>
            </div>
            <div>
              <div className="font-bold text-blue-700 mb-1">Akordy ({displayKey})</div>
              <pre className="bg-gray-50 border rounded h-32 p-3 text-sm font-mono text-gray-900">{song.chords|| "(brak)"}</pre>
            </div>
          </div>
        </div>

        {/* BTN */}
        <div className="flex justify-end gap-3 p-6 border-t bg-white">
          <button onClick={onClose} className="px-5 py-2 bg-white border font-medium rounded">Zamknij</button>
          <button className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Generuj PDF</button>
          <button
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            onClick={onEdit}
          >
            Edytuj pieśń
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorshipModule() {
  const [team, setTeam] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSongModal, setShowSongModal] = useState(false);
  const [showSongDetails, setShowSongDetails] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const [songForm, setSongForm] = useState({});
  const [memberForm, setMemberForm] = useState({ id: null, full_name: '', role: '', status: 'Aktywny', phone: '', email: '' });

  const [songFilter, setSongFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: t } = await supabase.from('worship_team').select('*').order('full_name');
    const { data: s } = await supabase.from('songs').select('*').order('title');
    setTeam(t || []);
    setSongs(s || []);
    setLoading(false);
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

  // Filtrowanie listy pieśni
  const filteredSongs = songs.filter(s =>
    (s.title || '').toLowerCase().includes(songFilter.toLowerCase()) &&
    (tagFilter ? (Array.isArray(s.tags) ? s.tags.map(String).map(t => t.toLowerCase()).includes(tagFilter.toLowerCase()) : false) : true)
  );

  if (loading) return <div className="p-10 text-gray-500">Ładowanie...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <h1 className="text-3xl font-bold text-gray-900">Grupa Uwielbienia</h1>

      {/* Lista członków */}
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
                <th className="p-4">Instrument/Rola</th>
                <th className="p-4">Status</th>
                <th className="p-4">Telefon</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {team.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Brak danych</td></tr>
              ) : team.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{m.full_name}</td>
                  <td className="p-4">{m.role}</td>
                  <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">{m.status}</span></td>
                  <td className="p-4">{m.phone}</td>
                  <td className="p-4">{m.email}</td>
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

      {/* Baza pieśni */}
      <section>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-gray-800">Baza Pieśni</h2>
          <button onClick={() => { setSongForm({}); setShowSongModal(true); }} className="bg-blue-600 text-white text-sm px-4 py-2 rounded font-medium hover:bg-blue-700 flex items-center gap-2"><Plus size={16}/> Dodaj pieśń</button>
        </div>
        <div className="bg-white p-4 mb-4 rounded border flex flex-col md:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2">
            <Search className="text-gray-400" size={20} />
            <input className="w-full outline-none text-sm" placeholder="Szukaj pieśni..." value={songFilter} onChange={e => setSongFilter(e.target.value)} />
          </div>
          <div className="flex gap-1 flex-wrap items-center mt-2 md:mt-0">
            <input className="p-2 border rounded text-sm" placeholder="Szukaj po tagach..." value={tagFilter} onChange={e => setTagFilter(e.target.value)} />
            {TAGS.map(tag => tagFilter !== tag && (
              <button key={tag} onClick={() => setTagFilter(tag)} className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-800 border hover:bg-blue-100">{tag}</button>
            ))}
            {tagFilter && <button onClick={() => setTagFilter('')} className="ml-2 text-sm text-gray-500">Wyczyść tag</button>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left text-sm align-middle">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b">
              <tr>
                <th className="p-4 font-bold">Tytuł</th>
                <th className="p-4">Kategoria</th>
                <th className="p-4">Tonacja</th>
                <th className="p-4">Tempo</th>
                <th className="p-4">Tagi</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSongs.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Brak danych</td></tr>
              ) : filteredSongs.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold">{s.title}</td>
                  <td className="p-4">{s.category}</td>
                  <td className="p-4">{s.key}</td>
                  <td className="p-4">{s.tempo || "-"}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {Array.isArray(s.tags) && s.tags.length > 0 ? s.tags.map((t, i) => (
                        <span key={i} className="bg-blue-100 px-2 py-1 text-xs rounded text-blue-800">{t}</span>
                      )) : <span className="text-gray-400 text-xs">-</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => setShowSongDetails(s)} className="text-gray-800 font-semibold px-3 rounded hover:bg-gray-100">Pokaż szczegóły</button>
                    <button onClick={() => { setSongForm(s); setShowSongModal(true); }} className="text-blue-600 hover:underline">Edytuj</button>
                    <button onClick={() => deleteSong(s.id)} className="text-red-500 hover:underline">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL - DODAJ/EDYTUJ CZŁONKA */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">Członek Zespołu</h3><button onClick={() => setShowMemberModal(false)}><X size={20}/></button></div>
            <div className="space-y-3">
              <input className="w-full p-2 border rounded" placeholder="Imię i nazwisko" value={memberForm.full_name} onChange={e => setMemberForm({...memberForm, full_name: e.target.value})} />
              <input className="w-full p-2 border rounded" placeholder="Rola (np. Wokal)" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} />
              <input className="w-full p-2 border rounded" placeholder="Telefon" value={memberForm.phone} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} />
              <input className="w-full p-2 border rounded" placeholder="Email" value={memberForm.email} onChange={e => setMemberForm({...memberForm, email: e.target.value})} />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowMemberModal(false)} className="px-4 py-2 border rounded">Anuluj</button>
                <button onClick={saveMember} className="px-4 py-2 bg-blue-600 text-white rounded">Zapisz</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL - DODAJ/EDYTUJ PIEŚŃ */}
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
      {/* MODAL PIEŚNI - SZCZEGÓŁY */}
      {showSongDetails && (
        <SongDetailsModal
          song={showSongDetails}
          onClose={() => setShowSongDetails(null)}
          onEdit={() => {
            setSongForm(showSongDetails);
            setShowSongModal(true);
            setShowSongDetails(null);
          }}
        />
      )}
    </div>
  );
}
