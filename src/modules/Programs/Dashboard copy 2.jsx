import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Save, FileText, Presentation, Copy, Trash2 } from 'lucide-react';
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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <button className="bg-pink-600 text-white text-xs px-3 py-1 rounded hover:bg-pink-700">+ Dodaj Pole</button>
      </div>
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
            <input 
              className="w-full p-2 border border-gray-200 rounded focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition"
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
    <div className="flex h-full bg-gray-50">
      {/* LEWA KOLUMNA - LISTA */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">Lista programów</h2>
          <input 
            placeholder="Szukaj..." 
            className="w-full p-2 border rounded bg-gray-50 text-sm mb-3"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <button 
            onClick={() => setSelectedId(null)}
            className="w-full bg-pink-600 text-white py-2 rounded font-medium text-sm hover:bg-pink-700 transition"
          >
            + Nowy Program
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
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
              className={`p-3 rounded-lg border cursor-pointer transition ${
                selectedId === p.id 
                  ? 'bg-pink-50 border-pink-200 ring-1 ring-pink-200' 
                  : 'bg-white border-gray-100 hover:border-pink-100 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-gray-800">
                {p.date 
                  ? new Date(p.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Brak daty'}
              </div>
              <div className="text-xs text-gray-500 mt-1 mb-2">{p.schedule?.length || 0} elementów</div>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleDuplicate(p); }} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-gray-600">Duplikuj</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="text-xs bg-red-50 px-2 py-1 rounded hover:bg-red-100 text-red-600">Usuń</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRAWA KOLUMNA - EDYCJA (Główny obszar) */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-6">
          {/* NAGŁÓWEK */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Program Nabożeństwa</h1>
              <input 
                type="date" 
                className="p-2 border rounded bg-white shadow-sm text-gray-600 font-medium"
                value={program.date}
                onChange={e => setProgram({...program, date: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <button
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-200 flex items-center gap-2"
                onClick={() => handleDuplicate(program)}
                disabled={!program.id}
              >
                <Copy size={18}/> Duplikuj
              </button>

              <button onClick={handleSave} className="bg-gray-100 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-200 flex items-center gap-2">
                <Save size={18}/> Zapisz
              </button>
              <button 
                onClick={() => {
                  const songsMap = {};
                  songs.forEach(s => songsMap[s.id] = s);
                  generatePDF(program, songsMap);
                }} 
                className="bg-pink-600 text-white px-4 py-2 rounded font-medium hover:bg-pink-700 flex items-center gap-2"
              >
                <FileText size={18}/> Generuj PDF
              </button>
              <button 
                onClick={() => {
                  const songsMap = {};
                  songs.forEach(s => songsMap[s.id] = s);
                  generatePPT(program, songsMap);
                }} 
                className="bg-pink-600 text-white px-4 py-2 rounded font-medium hover:bg-pink-700 flex items-center gap-2"
              >
                <Presentation size={18}/> Generuj PowerPoint
              </button>
            </div>
          </div>

          {/* SEKCJA GŁÓWNA PROGRAMU */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Program Nabożeństwa</h3>
              <button 
                onClick={() => setProgram({...program, schedule: [...program.schedule, { id: Date.now(), element: '', person: '', details: '', songIds: [] }]})}
                className="bg-pink-600 text-white text-xs px-3 py-1 rounded hover:bg-pink-700"
              >
                + Dodaj Element
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-3 border-b border-gray-200 bg-gray-100 font-semibold text-sm text-gray-600">
                <div className="col-span-3">Element</div>
                <div className="col-span-3">Osoba</div>
                <div className="col-span-5">Szczegóły / Notatki</div>
                <div className="col-span-1"></div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {program.schedule.map((row, idx) => (
                  <div key={row.id} className="grid grid-cols-12 gap-4 p-3 items-start bg-white hover:bg-gray-50 transition">
                    <div className="col-span-3">
                      <select
                        className="w-full p-2 border rounded text-sm font-medium"
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
                    </div>
                    <div className="col-span-3">
                      <input 
                        className="w-full p-2 border rounded text-sm"
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
                          <select 
                            className="w-full p-2 border rounded text-sm bg-pink-50 text-pink-800"
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
                          <div className="flex flex-wrap gap-1">
                            {row.songIds?.map(sid => {
                              const s = songs.find(x => x.id === sid);
                              return s ? (
                                <span key={sid} className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs">
                                  {s.title}
                                  <button onClick={() => {
                                    const newSchedule = [...program.schedule];
                                    newSchedule[idx].songIds = newSchedule[idx].songIds.filter(x => x !== sid);
                                    setProgram({...program, schedule: newSchedule});
                                  }} className="hover:text-red-600 font-bold">×</button>
                                </span>
                              ) : null
                            })}
                          </div>
                        </div>
                      ) : (
                        <input 
                          className="w-full p-2 border rounded text-sm"
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
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GRID SEKCJI DODATKOWYCH */}
          <div className="grid grid-cols-2 gap-6 mb-6">
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

          <div className="grid grid-cols-2 gap-6">
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