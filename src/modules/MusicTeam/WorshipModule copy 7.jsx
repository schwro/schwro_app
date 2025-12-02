import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Trash2, X, FileText, Music, Calendar, ChevronDown, Check, ChevronUp, User, UserX } from 'lucide-react';
import SongForm from './SongForm';

const TAGS = [
  "intymna", "modlitewna", "niedzielna", "popularna", "szybko", "uwielbienie", "wolna"
];
const CHORDS = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

// --- POMOCNICZE FUNKCJE MUZYCZNE ---

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

// --- KOMPONENTY POMOCNICZE DLA GRAFIKU ---

const TableMultiSelect = ({ options, value, onChange, absentMembers = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedItems = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelection = (name, isAbsent) => {
    if (isAbsent) return;
    let newSelection;
    if (selectedItems.includes(name)) {
      newSelection = selectedItems.filter(i => i !== name);
    } else {
      newSelection = [...selectedItems, name];
    }
    onChange(newSelection.join(', '));
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        className="w-full min-h-[32px] px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs cursor-pointer flex flex-wrap gap-1 items-center hover:border-pink-300 dark:hover:border-pink-500 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItems.length === 0 ? (
          <span className="text-gray-400 dark:text-gray-500 text-[10px] italic">Wybierz...</span>
        ) : (
          selectedItems.map((item, idx) => (
            <span key={idx} className="bg-pink-50 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 px-1.5 py-0.5 rounded text-[10px] border border-pink-100 dark:border-pink-800 whitespace-nowrap">
              {item}
            </span>
          ))
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[9999] left-0 mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((person) => {
            const isSelected = selectedItems.includes(person.full_name);
            const isAbsent = absentMembers.includes(person.full_name);

            return (
              <div 
                key={person.id}
                className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between transition 
                  ${isAbsent ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'hover:bg-pink-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}
                  ${isSelected ? 'bg-pink-50 dark:bg-gray-800 text-pink-700 dark:text-pink-300 font-medium' : ''}
                `}
                onClick={() => toggleSelection(person.full_name, isAbsent)}
              >
                <span className={isAbsent ? 'line-through decoration-gray-400 dark:decoration-gray-600' : ''}>
                  {person.full_name}
                </span>
                {isSelected && !isAbsent && <Check size={12} />}
                {isAbsent && <UserX size={12} className="text-red-300 dark:text-red-500" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AbsenceMultiSelect = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedItems = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelection = (name) => {
    let newSelection;
    if (selectedItems.includes(name)) {
      newSelection = selectedItems.filter(i => i !== name);
    } else {
      newSelection = [...selectedItems, name];
    }
    onChange(newSelection.join(', '));
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        className="w-full min-h-[32px] px-2 py-1 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 rounded-lg text-xs cursor-pointer flex flex-wrap gap-1 items-center hover:border-red-300 dark:hover:border-red-700 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItems.length === 0 ? (
          <span className="text-gray-400 dark:text-gray-500 text-[10px] italic">Wybierz...</span>
        ) : (
          selectedItems.map((item, idx) => (
            <span key={idx} className="bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded text-[10px] border border-red-100 dark:border-red-800 whitespace-nowrap flex items-center gap-1">
              {item}
            </span>
          ))
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[9999] left-0 mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((person) => {
            const isSelected = selectedItems.includes(person.full_name);
            return (
              <div 
                key={person.id}
                className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/30 transition ${isSelected ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                onClick={() => toggleSelection(person.full_name)}
              >
                <span>{person.full_name}</span>
                {isSelected && <UserX size={12} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ScheduleTable = ({ programs, worshipTeam, onUpdateProgram }) => {
  const [expandedMonths, setExpandedMonths] = useState({});

  const groupedPrograms = programs.reduce((acc, prog) => {
    if (!prog.date) return acc;
    const date = new Date(prog.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(prog);
    return acc;
  }, {});

  const sortedMonths = Object.keys(groupedPrograms).sort().reverse();

  useEffect(() => {
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    setExpandedMonths(prev => ({ ...prev, [currentMonthKey]: true }));
  }, []);

  const toggleMonth = (monthKey) => {
    setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  const formatMonthName = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const updateRole = async (programId, field, value) => {
    const programToUpdate = programs.find(p => p.id === programId);
    if (!programToUpdate) return;
    const currentZespol = programToUpdate.zespol || {};
    const updatedZespol = { ...currentZespol, [field]: value };
    await onUpdateProgram(programId, { zespol: updatedZespol });
  };

  const updateNotes = async (programId, value) => {
     const programToUpdate = programs.find(p => p.id === programId);
     if (!programToUpdate) return;
     const currentZespol = programToUpdate.zespol || {};
     const updatedZespol = { ...currentZespol, notatki: value };
     await onUpdateProgram(programId, { zespol: updatedZespol });
  };

  const updateAbsence = async (programId, value) => {
    const programToUpdate = programs.find(p => p.id === programId);
    if (!programToUpdate) return;
    const currentZespol = programToUpdate.zespol || {};
    const updatedZespol = { ...currentZespol, absencja: value };
    await onUpdateProgram(programId, { zespol: updatedZespol });
  };

  const columns = [
    { key: 'lider', label: 'Lider' },
    { key: 'piano', label: 'Piano' },
    { key: 'wokale', label: 'Wokal' },
    { key: 'gitara_akustyczna', label: 'Git. Akust.' },
    { key: 'gitara_elektryczna', label: 'Git. Elektr.' },
    { key: 'bas', label: 'Bas' },
    { key: 'cajon', label: 'Cajon' },
  ];

  return (
    <div className="space-y-4">
      {sortedMonths.map(monthKey => {
        const isExpanded = expandedMonths[monthKey];
        
        return (
          <div 
            key={monthKey} 
            className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative z-0 transition-all duration-300 ${isExpanded ? 'mb-8' : 'mb-0'}`}
          >
            <button 
              onClick={() => toggleMonth(monthKey)}
              className={`w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center transition border-b border-gray-200 dark:border-gray-700 ${isExpanded ? 'rounded-t-2xl' : 'rounded-2xl'}`}
            >
              <span className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wider">{formatMonthName(monthKey)}</span>
              {isExpanded ? <ChevronUp size={18} className="text-gray-500 dark:text-gray-400"/> : <ChevronDown size={18} className="text-gray-500 dark:text-gray-400"/>}
            </button>
            
            {isExpanded && (
              <div className="overflow-visible pb-4 bg-white dark:bg-gray-900 rounded-b-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    {/* HEADER BEZ GRADIENTU W DARK MODE */}
                    <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                      <th className="p-3 font-semibold w-24 min-w-[90px]">Data</th>
                      {columns.map(col => (
                        <th key={col.key} className="p-3 font-semibold min-w-[130px]">{col.label}</th>
                      ))}
                      <th className="p-3 font-semibold min-w-[130px] text-red-500 dark:text-red-400">Absencja</th>
                      <th className="p-3 font-semibold min-w-[150px]">Notatki</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-800 relative">
                    {groupedPrograms[monthKey]
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((prog, idx) => {
                        const absentList = prog.zespol?.absencja 
                          ? prog.zespol.absencja.split(',').map(s => s.trim()).filter(Boolean) 
                          : [];

                        return (
                          <tr key={prog.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition relative">
                            <td className="p-3 font-medium text-gray-700 dark:text-gray-300 font-mono text-xs">
                              {formatDateShort(prog.date)}
                            </td>
                            {columns.map(col => (
                              <td key={col.key} className="p-2 relative">
                                <TableMultiSelect 
                                  options={worshipTeam} 
                                  value={prog.zespol?.[col.key] || ''} 
                                  onChange={(val) => updateRole(prog.id, col.key, val)}
                                  absentMembers={absentList}
                                />
                              </td>
                            ))}
                            <td className="p-2 relative">
                              <AbsenceMultiSelect 
                                options={worshipTeam}
                                value={prog.zespol?.absencja || ''}
                                onChange={(val) => updateAbsence(prog.id, val)}
                              />
                            </td>
                            <td className="p-2">
                              <input 
                                className="w-full bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-pink-500 text-xs p-1 outline-none transition placeholder-gray-300 dark:placeholder-gray-600 text-gray-700 dark:text-gray-300"
                                placeholder="Wpisz..."
                                defaultValue={prog.zespol?.notatki || ''}
                                onBlur={(e) => updateNotes(prog.id, e.target.value)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// --- GŁÓWNY KOMPONENT ---

function SongDetailsModal({ song, onClose, onEdit }) {
    // Placeholder - jeśli potrzebujesz pełnego kodu, daj znać
    return null; 
}

export default function WorshipModule() {
  const [team, setTeam] = useState([]);
  const [songs, setSongs] = useState([]);
  const [programs, setPrograms] = useState([]);
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
    try {
      const { data: t } = await supabase.from('worship_team').select('*').order('full_name');
      const { data: s } = await supabase.from('songs').select('*').order('title');
      const { data: p } = await supabase.from('programs').select('*').order('date', { ascending: false });
      
      setTeam(t || []);
      setSongs(s || []);
      setPrograms(p || []);
    } catch (err) {
      console.error('Błąd pobierania danych:', err);
    }
    setLoading(false);
  }

  const saveMember = async () => {
    try {
      if (memberForm.id) {
        await supabase.from('worship_team').update(memberForm).eq('id', memberForm.id);
      } else {
        const { id, ...rest } = memberForm;
        await supabase.from('worship_team').insert([rest]);
      }
      setShowMemberModal(false);
      fetchData();
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const deleteMember = async (id) => {
    if(confirm('Usunąć?')) {
      await supabase.from('worship_team').delete().eq('id', id);
      fetchData();
    }
  };

  const deleteSong = async (id) => {
    if(confirm('Usunąć pieśń?')) {
      await supabase.from('songs').delete().eq('id', id);
      fetchData();
    }
  };

  const handleProgramUpdate = async (id, updates) => {
    setPrograms(prev => prev.map(p => {
      if (p.id === id) {
        if (updates.zespol) {
          return { ...p, ...updates, zespol: { ...p.zespol, ...updates.zespol } };
        }
        return { ...p, ...updates };
      }
      return p;
    }));
    await supabase.from('programs').update(updates).eq('id', id);
  };

  const filteredSongs = songs.filter(s =>
    (s.title || '').toLowerCase().includes(songFilter.toLowerCase()) &&
    (tagFilter ? (Array.isArray(s.tags) ? s.tags.map(String).map(t => t.toLowerCase()).includes(tagFilter.toLowerCase()) : false) : true)
  );

  if (loading) return <div className="p-10 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">Grupa Uwielbienia</h1>
      </div>

      {/* SEKCJA 1: GRAFIK ZESPOŁU */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 relative z-[50] transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Grafik Zespołu</h2>
        </div>
        <ScheduleTable 
          programs={programs} 
          worshipTeam={team}
          onUpdateProgram={handleProgramUpdate}
        />
      </section>

      {/* SEKCJA 2: BAZA PIEŚNI */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 relative z-[40] transition-colors">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Baza Pieśni</h2>
          <button onClick={() => { setSongForm({}); setShowSongModal(true); }} className="bg-gradient-to-r from-orange-600 to-pink-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/50 transition flex items-center gap-2"><Plus size={18}/> Dodaj pieśń</button>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 mb-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2">
            <Search className="text-gray-400 dark:text-gray-500" size={20} />
            <input className="w-full outline-none text-sm bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Szukaj pieśni..." value={songFilter} onChange={e => setSongFilter(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <input className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400" placeholder="Szukaj po tagach..." value={tagFilter} onChange={e => setTagFilter(e.target.value)} />
            {TAGS.map(tag => tagFilter !== tag && (
              <button key={tag} onClick={() => setTagFilter(tag)} className="bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/40 dark:to-orange-900/40 px-3 py-1.5 rounded-xl text-xs text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-800 hover:from-pink-100 hover:to-orange-100 dark:hover:from-pink-900/60 dark:hover:to-orange-900/60 transition font-medium">{tag}</button>
            ))}
            {tagFilter && <button onClick={() => setTagFilter('')} className="ml-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">Wyczyść</button>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-left text-sm align-middle">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4">Tytuł</th>
                <th className="p-4">Kategoria</th>
                <th className="p-4">Tonacja</th>
                <th className="p-4">Tempo</th>
                <th className="p-4">Tagi</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSongs.map(s => (
                <tr key={s.id} className="hover:bg-pink-50/30 dark:hover:bg-gray-800/50 transition">
                  <td className="p-4 font-bold text-gray-800 dark:text-gray-200">{s.title}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{s.category}</td>
                  <td className="p-4 font-mono font-bold text-pink-600 dark:text-pink-400">{s.key}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{s.tempo || "-"}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {Array.isArray(s.tags) && s.tags.length > 0 ? s.tags.map((t, i) => (
                        <span key={i} className="bg-gradient-to-r from-pink-100 to-orange-100 dark:from-pink-900/30 dark:to-orange-900/30 px-2 py-1 text-xs rounded-full text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-800 font-medium">{t}</span>
                      )) : <span className="text-gray-400 text-xs">-</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => setShowSongDetails(s)} className="text-gray-800 dark:text-gray-300 font-semibold px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">Szczegóły</button>
                    <button onClick={() => { setSongForm(s); setShowSongModal(true); }} className="text-pink-600 dark:text-pink-400 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition">Edytuj</button>
                    <button onClick={() => deleteSong(s.id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SEKCJA 3: CZŁONKOWIE ZESPOŁU */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 relative z-[30] transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Członkowie Zespołu</h2>
          <button onClick={() => { setMemberForm({ id: null, full_name: '', role: '', status: 'Aktywny', phone: '', email: '' }); setShowMemberModal(true); }} className="bg-gradient-to-r from-pink-600 to-orange-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition flex items-center gap-2"><Plus size={18}/> Dodaj członka</button>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-4">Imię i nazwisko</th>
                <th className="p-4">Instrument/Rola</th>
                <th className="p-4">Status</th>
                <th className="p-4">Telefon</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {team.map(m => (
                <tr key={m.id} className="hover:bg-pink-50/30 dark:hover:bg-gray-800/50 transition">
                  <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{m.full_name}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{m.role}</td>
                  <td className="p-4"><span className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium border border-green-200 dark:border-green-800">{m.status}</span></td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{m.phone}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{m.email}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setMemberForm(m); setShowMemberModal(true); }} className="text-pink-600 dark:text-pink-400 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition">Edytuj</button>
                    <button onClick={() => deleteMember(m.id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modale */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20 dark:border-gray-700">
             <div className="flex justify-between mb-6"><h3 className="font-bold text-xl text-gray-800 dark:text-white">Członek Zespołu</h3><button onClick={() => setShowMemberModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition text-gray-500 dark:text-gray-400"><X size={20}/></button></div>
            <div className="space-y-4">
              <input className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" placeholder="Imię i nazwisko" value={memberForm.full_name} onChange={e => setMemberForm({...memberForm, full_name: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" placeholder="Rola (np. Wokal)" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" placeholder="Telefon" value={memberForm.phone} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" placeholder="Email" value={memberForm.email} onChange={e => setMemberForm({...memberForm, email: e.target.value})} />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowMemberModal(false)} className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Anuluj</button>
                <button onClick={saveMember} className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition font-medium">Zapisz</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSongModal && (
        <SongForm 
          initialData={songForm} 
          onSave={async (data) => {
            try {
              const cleanData = {
                title: (data.title || '').trim(),
                category: (data.category || '').trim(),
                key: (data.key || 'C').trim(),
                tempo: data.tempo ? parseInt(data.tempo) : null,
                meter: (data.meter || '').trim(),
                tags: Array.isArray(data.tags) ? data.tags : [],
                chords_bars: (data.chords_bars || '').trim(),
                lyrics: (data.lyrics || '').trim(),
                lyrics_chords: (data.lyrics_chords || '').trim(),
                sheet_music_url: (data.sheet_music_url || '').trim(),
                attachments: Array.isArray(data.attachments) ? data.attachments : []
              };

              if (data.id) {
                await supabase.from('songs').update(cleanData).eq('id', data.id);
              } else {
                await supabase.from('songs').insert([cleanData]);
              }
              
              setShowSongModal(false);
              fetchData();
            } catch (err) {
              alert('Błąd: ' + (err.message || 'Nie udało się zapisać pieśni'));
            }
          }}
          onCancel={() => setShowSongModal(false)}
        />
      )}

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
