import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Save, FileText, Presentation, Copy, Trash2, Calendar, ChevronDown } from 'lucide-react';
import { generatePDF } from '../../lib/utils';
import { generatePPT } from '../../lib/ppt';

const PROGRAM_ELEMENTS = [
  'Wstęp',
  'Uwielbienie',
  'Modlitwa',
  'Czytanie',
  'Kazanie',
  'Wieczerza',
  'Uwielbienie / Kolekta',
  'Ogłoszenia',
  'Zakończenie'
];

export default function Dashboard() {
  const [programs, setPrograms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('');
  const [program, setProgram] = useState(getEmptyProgram());
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    fetchPrograms();
    fetchSongs();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const p = programs.find(p => p.id === selectedId);
      if (p) setProgram(p);
    } else {
      setProgram(getEmptyProgram());
    }
  }, [selectedId, programs]);

  function getEmptyProgram() {
    return {
      date: new Date().toISOString().split('T')[0],
      schedule: [],
      atmosfera_team: { przygotowanie: '', witanie: '' },
      produkcja: { naglosnienie: '', propresenter: '', social: '', host: '' },
      scena: { prowadzenie: '', czytanie: '', kazanie: '', modlitwa: '', wieczerza: '', ogloszenia: '' },
      szkolka: { mlodsza: '', srednia: '', starsza: '' },
      zespol: { lider: '', piano: '', gitara: '', bas: '', perkusja: '', wokale: '' }
    };
  }

  const fetchPrograms = async () => {
    const { data } = await supabase.from('programs').select('*').order('date', { ascending: false });
    setPrograms(data || []);
  };

  const fetchSongs = async () => {
    const { data } = await supabase.from('songs').select('*');
    setSongs(data || []);
  };

  const handleSave = async () => {
    if (program.id) {
      await supabase.from('programs').update(program).eq('id', program.id);
    } else {
      await supabase.from('programs').insert([program]);
    }
    fetchPrograms();
    alert('Zapisano!');
  };

  const handleDelete = async (id) => {
    if (confirm('Na pewno usunąć?')) {
      await supabase.from('programs').delete().eq('id', id);
      fetchPrograms();
      if (selectedId === id) setSelectedId(null);
    }
  };

  const handleDuplicate = async (p) => {
    const { id, created_at, ...rest } = p;
    await supabase.from('programs').insert([rest]);
    fetchPrograms();
  };

  const SectionCard = ({ title, dataKey, fields }) => (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 p-6 h-full hover:shadow-xl transition">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg bg-gradient-to-r from-pink-700 to-orange-700 bg-clip-text text-transparent">{title}</h3>
        <button className="bg-gradient-to-r from-pink-600 to-orange-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5">
          + Dodaj Pole
        </button>
      </div>
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.key}>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{field.label}</label>
            <input 
              className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-pink-500/20 outline-none text-sm transition"
              value={program[dataKey]?.[field.key] || ''}
              onChange={e => setProgram({
                ...program,
                [dataKey]: { ...program[dataKey], [field.key]: e.target.value }
              })}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-gradient-to-br from-pink-50 via-orange-50 to-pink-50">
      {/* LEWA KOLUMNA - LISTA */}
      <div className="w-80 bg-white/40 backdrop-blur-xl border-r border-white/40 flex flex-col h-full">
        <div className="p-6 border-b border-white/40">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Lista programów
          </h2>
          <input 
            placeholder="Szukaj..." 
            className="w-full px-4 py-2.5 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl mb-3 text-sm focus:ring-2 focus:ring-pink-500/20 outline-none"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <button 
            onClick={() => setSelectedId(null)}
            className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white py-2.5 rounded-xl font-bold shadow-lg hover:shadow-pink-500/30 transition transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Nowy Program
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {programs
            .filter(p => {
              const search = filter.toLowerCase();
              return (
                (p.date || '').toLowerCase().includes(search) ||
                (p.title || '').toLowerCase().includes(search) ||
                (p.scena?.prowadzenie || '').toLowerCase().includes(search)
              );
            })
            .map(p => (
            <div 
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition group relative overflow-hidden ${
                selectedId === p.id 
                  ? 'bg-white border-pink-200 shadow-md ring-1 ring-pink-100' 
                  : 'bg-white/40 border-white/60 hover:bg-white/80 hover:shadow-sm'
              }`}
            >
              <div className={`font-bold text-sm mb-1 ${selectedId === p.id ? 'text-pink-700' : 'text-gray-700'}`}>
                {p.date 
                  ? new Date(p.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Brak daty'}
              </div>
              <div className="text-xs text-gray-500 mb-3 font-medium bg-gray-100/50 px-2 py-1 rounded-lg inline-block">
                {p.schedule?.length || 0} elementów
              </div>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
                <button onClick={(e) => { e.stopPropagation(); handleDuplicate(p); }} className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-lg hover:bg-pink-100 font-medium">Duplikuj</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-lg hover:bg-red-100 font-medium">Usuń</button>
              </div>
              
              {selectedId === p.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* PRAWA KOLUMNA - EDYCJA */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-8 min-h-full">
          
          {/* NAGŁÓWEK */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200/50">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Program Nabożeństwa</h1>
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-200/50 w-fit">
                <Calendar size={16} className="text-pink-600" />
                <input 
                  type="date" 
                  className="bg-transparent text-gray-700 font-medium outline-none text-sm"
                  value={program.date}
                  onChange={e => setProgram({...program, date: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                className="bg-white text-gray-600 px-4 py-2.5 rounded-xl border border-gray-200/50 font-medium hover:bg-gray-50 hover:text-gray-800 flex items-center gap-2 transition shadow-sm"
                onClick={() => handleDuplicate(program)}
                disabled={!program.id}
              >
                <Copy size={18}/> <span className="hidden md:inline">Duplikuj</span>
              </button>

              <button onClick={handleSave} className="bg-white text-green-600 px-4 py-2.5 rounded-xl border border-green-100 font-bold hover:bg-green-50 flex items-center gap-2 transition shadow-sm">
                <Save size={18}/> <span className="hidden md:inline">Zapisz</span>
              </button>
              
              <div className="h-10 w-px bg-gray-300 mx-1 self-center"></div>

              <button 
                onClick={() => {
                  const songsMap = {};
                  songs.forEach(s => songsMap[s.id] = s);
                  generatePDF(program, songsMap);
                }} 
                className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-pink-500/30 flex items-center gap-2 transition transform hover:-translate-y-0.5"
              >
                <FileText size={18}/> <span className="hidden md:inline">PDF</span>
              </button>
              <button 
                onClick={() => {
                  const songsMap = {};
                  songs.forEach(s => songsMap[s.id] = s);
                  generatePPT(program, songsMap);
                }} 
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 flex items-center gap-2 transition transform hover:-translate-y-0.5"
              >
                <Presentation size={18}/> <span className="hidden md:inline">PPT</span>
              </button>
            </div>
          </div>

          {/* SEKCJA GŁÓWNA PROGRAMU */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-pink-600 rounded-full"></div>
                Plan szczegółowy
              </h3>
              <button 
                onClick={() => setProgram({...program, schedule: [...program.schedule, { id: Date.now(), element: '', person: '', details: '', songIds: [] }]})}
                className="bg-gradient-to-r from-pink-600 to-orange-600 text-white text-sm px-4 py-2 rounded-xl font-bold hover:shadow-lg transition"
              >
                + Dodaj Element
              </button>
            </div>
            
            <div className="bg-white/50 rounded-xl border border-gray-200/50 overflow-hidden shadow-inner">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200/50 bg-gray-50/50 font-bold text-xs text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Element</div>
                <div className="col-span-3">Osoba</div>
                <div className="col-span-5">Szczegóły / Notatki</div>
                <div className="col-span-1"></div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {program.schedule.map((row, idx) => (
                  <div key={row.id} className="grid grid-cols-12 gap-4 p-3 items-start hover:bg-pink-50/30 transition duration-150">
                    <div className="col-span-3">
                      <div className="relative">
                        <select
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 appearance-none focus:ring-2 focus:ring-pink-500/20 outline-none cursor-pointer"
                          value={row.element || ''}
                          onChange={e => {
                            const newSchedule = [...program.schedule];
                            newSchedule[idx].element = e.target.value;
                            setProgram({...program, schedule: newSchedule});
                          }}
                        >
                          <option value="">Wybierz element...</option>
                          {PROGRAM_ELEMENTS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="col-span-3">
                      <input 
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20 outline-none"
                        placeholder="Jan Kowalski"
                        value={row.person || ''}
                        onChange={e => {
                          const newSchedule = [...program.schedule];
                          newSchedule[idx].person = e.target.value;
                          setProgram({...program, schedule: newSchedule});
                        }}
                      />
                    </div>
                    <div className="col-span-5">
                      {(row.element || '').toLowerCase().includes('uwielbienie') ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <select 
                              className="w-full px-3 py-2 bg-pink-50 border border-pink-100 rounded-lg text-sm text-pink-800 font-medium appearance-none focus:ring-2 focus:ring-pink-500/20 outline-none cursor-pointer"
                              onChange={e => {
                                const id = parseInt(e.target.value);
                                if(id && !row.songIds?.includes(id)) {
                                  const newSchedule = [...program.schedule];
                                  newSchedule[idx].songIds = [...(newSchedule[idx].songIds || []), id];
                                  setProgram({...program, schedule: newSchedule});
                                }
                              }}
                            >
                              <option value="">+ Wybierz pieśń...</option>
                              {songs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-pink-400 pointer-events-none" />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {row.songIds?.map(sid => {
                              const s = songs.find(x => x.id === sid);
                              return s ? (
                                <span key={sid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-pink-100 text-pink-700 rounded-full text-xs font-medium shadow-sm">
                                  {s.title}
                                  <button onClick={() => {
                                    const newSchedule = [...program.schedule];
                                    newSchedule[idx].songIds = newSchedule[idx].songIds.filter(x => x !== sid);
                                    setProgram({...program, schedule: newSchedule});
                                  }} className="hover:text-red-500 font-bold ml-1">×</button>
                                </span>
                              ) : null
                            })}
                          </div>
                        </div>
                      ) : (
                        <input 
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20 outline-none"
                          value={row.details || ''}
                          onChange={e => {
                            const newSchedule = [...program.schedule];
                            newSchedule[idx].details = e.target.value;
                            setProgram({...program, schedule: newSchedule});
                          }}
                        />
                      )}
                    </div>
                    <div className="col-span-1 flex justify-center pt-2">
                      <button 
                        onClick={() => {
                          const newSchedule = program.schedule.filter(r => r.id !== row.id);
                          setProgram({...program, schedule: newSchedule});
                        }}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GRID SEKCJI DODATKOWYCH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <SectionCard 
              title="Atmosfera Team" 
              dataKey="atmosfera_team"
              fields={[
                { key: 'przygotowanie', label: 'Przygotowanie:' },
                { key: 'witanie', label: 'Witanie:' }
              ]} 
            />
            <SectionCard 
              title="Produkcja" 
              dataKey="produkcja"
              fields={[
                { key: 'naglosnienie', label: 'Nagłośnienie:' },
                { key: 'propresenter', label: 'ProPresenter:' },
                { key: 'social', label: 'Social Media:' },
                { key: 'host', label: 'Host wydarzenia:' }
              ]} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionCard 
              title="Scena" 
              dataKey="scena"
              fields={[
                { key: 'prowadzenie', label: 'Prowadzenie:' },
                { key: 'kazanie', label: 'Kazanie:' },
                { key: 'wieczerza', label: 'Wieczerza:' },
                { key: 'ogloszenia', label: 'Ogłoszenia:' }
              ]} 
            />
            <SectionCard 
              title="Szkółka Niedzielna" 
              dataKey="szkolka"
              fields={[
                { key: 'mlodsza', label: 'Grupa Młodsza:' },
                { key: 'srednia', label: 'Grupa Średnia:' },
                { key: 'starsza', label: 'Grupa Starsza:' }
              ]} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
