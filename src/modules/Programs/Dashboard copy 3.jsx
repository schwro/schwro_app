import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Save, FileText, Presentation, Copy, Trash2, Calendar, ChevronDown, GripVertical, Search, X, Check, ChevronUp, History, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { generatePDF } from '../../lib/utils';
import { generatePPT } from '../../lib/ppt';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const MUSICAL_KEYS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];

// --- KOMPONENTY POMOCNICZE ---

const SectionCard = ({ title, dataKey, fields, program, setProgram }) => (
  <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 p-6 h-full hover:shadow-xl transition relative z-0">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-bold text-lg bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">{title}</h3>
    </div>
    <div className="space-y-4">
      {fields.map(field => (
        <div key={field.key}>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{field.label}</label>
          <input 
            className="w-full px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition"
            value={program[dataKey]?.[field.key] || ''}
            onChange={e => setProgram(prev => ({
              ...prev,
              [dataKey]: { ...prev[dataKey], [field.key]: e.target.value }
            }))}
          />
        </div>
      ))}
    </div>
  </div>
);

const ElementSelector = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:text-gray-400"
          placeholder="Wybierz lub wpisz..."
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onClick={() => setIsOpen(true)}
        />
        <ChevronDown 
          size={16} 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)} 
        />
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((opt) => (
            <div
              key={opt}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MultiSelect = ({ label, options, value, onChange }) => {
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
    <div ref={wrapperRef} className="relative group">
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{label}</label>
      <div 
        className="w-full min-h-[42px] px-4 py-2 bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 cursor-pointer flex flex-wrap gap-2 items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItems.length === 0 ? (
          <span className="text-gray-400 text-sm">Wybierz osoby...</span>
        ) : (
          selectedItems.map((item, idx) => (
            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-xs font-medium border border-blue-200 flex items-center gap-1">
              {item}
              <span 
                onClick={(e) => { e.stopPropagation(); toggleSelection(item); }}
                className="hover:bg-blue-200 rounded-full p-0.5 cursor-pointer"
              >
                <X size={10} />
              </span>
            </span>
          ))
        )}
        <div className="ml-auto">
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((person) => {
            const isSelected = selectedItems.includes(person.full_name);
            return (
              <div 
                key={person.id}
                className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-blue-50 transition ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                onClick={() => toggleSelection(person.full_name)}
              >
                <span>{person.full_name} <span className="text-xs text-gray-400 ml-1">({person.role})</span></span>
                {isSelected && <Check size={16} />}
              </div>
            );
          })}
          {options.length === 0 && <div className="p-3 text-center text-gray-400 text-xs">Brak członków w bazie</div>}
        </div>
      )}
    </div>
  );
};

const SongSelector = ({ songs, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSongs = songs.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className="w-full px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 font-medium flex items-center justify-between cursor-pointer hover:bg-blue-100 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>+ Wybierz pieśń...</span>
        <ChevronDown size={16} className="text-blue-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-gray-200">
              <Search size={14} className="text-gray-400" />
              <input 
                autoFocus
                className="bg-transparent outline-none text-sm w-full"
                placeholder="Szukaj..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 max-h-48 custom-scrollbar">
            {filteredSongs.length === 0 ? (
              <div className="p-3 text-xs text-gray-400 text-center">Brak wyników</div>
            ) : (
              filteredSongs.map(s => (
                <div 
                  key={s.id}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 flex justify-between items-center border-b border-gray-50 last:border-0"
                  onClick={() => {
                    onSelect(s);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span className="font-medium">{s.title}</span>
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{s.key}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SortableSongItem = ({ item, idx, songDef, onRemove, onChangeKey }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.internalId });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 999 : 'auto',
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-blue-100 rounded-lg shadow-sm group">
      <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-blue-600 active:cursor-grabbing">
        <GripVertical size={14} />
      </div>

      <div className="flex items-center gap-2 flex-1">
        <span className="text-blue-700 font-medium text-xs">{idx + 1}.</span>
        <span className="text-gray-700 text-sm truncate">{songDef.title}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <div className="relative">
          <select 
            className="appearance-none bg-gray-50 border border-gray-200 text-gray-600 text-[10px] font-bold py-0.5 pl-2 pr-4 rounded focus:outline-none cursor-pointer hover:bg-gray-100"
            value={item.key}
            onChange={(e) => onChangeKey(item.internalId, e.target.value)}
          >
            {MUSICAL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <button onClick={() => onRemove(item.internalId)} className="text-gray-300 hover:text-red-500 p-1 hover:bg-red-50 rounded transition">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

const SortableRow = ({ row, index, program, setProgram, songs }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 999 : 'auto', 
    position: 'relative',
  };

  const currentSongs = row.selectedSongs || (row.songIds || []).map(id => {
    const s = songs.find(x => x.id === id);
    return { internalId: Math.random(), songId: id, key: s?.key || 'C' };
  });

  const updateSongs = (newSongs) => {
    const newSchedule = [...program.schedule];
    newSchedule[index].selectedSongs = newSongs;
    newSchedule[index].songIds = newSongs.map(s => s.songId); 
    setProgram(prev => ({ ...prev, schedule: newSchedule }));
  };

  const handleSongDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = currentSongs.findIndex((item) => item.internalId === active.id);
      const newIndex = currentSongs.findIndex((item) => item.internalId === over.id);
      const newOrder = arrayMove(currentSongs, oldIndex, newIndex);
      updateSongs(newOrder);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const removeSong = (internalId) => {
    updateSongs(currentSongs.filter(s => s.internalId !== internalId));
  };

  const changeSongKey = (internalId, newKey) => {
    const newSongs = currentSongs.map(s => s.internalId === internalId ? { ...s, key: newKey } : s);
    updateSongs(newSongs);
  };

  return (
    <div ref={setNodeRef} style={style} className="grid grid-cols-12 gap-4 p-3 items-start hover:bg-blue-50/30 transition duration-150 bg-white border-b border-gray-100 last:border-0">
      <div className="col-span-1 flex items-center justify-center pt-2 cursor-grab text-gray-300 hover:text-blue-500 active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical size={20} />
      </div>

      <div className="col-span-3">
        <ElementSelector 
          value={row.element || ''}
          options={PROGRAM_ELEMENTS}
          onChange={(newValue) => {
            const newSchedule = [...program.schedule];
            newSchedule[index].element = newValue;
            setProgram(prev => ({ ...prev, schedule: newSchedule }));
          }}
        />
      </div>

      <div className="col-span-3">
        <input 
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
          placeholder="Jan Kowalski"
          value={row.person || ''}
          onChange={e => {
            const newSchedule = [...program.schedule];
            newSchedule[index].person = e.target.value;
            setProgram(prev => ({ ...prev, schedule: newSchedule }));
          }}
        />
      </div>

      <div className="col-span-4">
        {(row.element || '').toLowerCase().includes('uwielbienie') ? (
          <div className="space-y-2">
            <SongSelector 
              songs={songs}
              onSelect={(song) => {
                const newSong = { 
                  internalId: Date.now() + Math.random(), 
                  songId: song.id, 
                  key: song.key || 'C' 
                };
                updateSongs([...currentSongs, newSong]);
              }}
            />
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSongDragEnd}>
              <SortableContext items={currentSongs.map(s => s.internalId)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-1">
                  {currentSongs.map((item, idx) => {
                    const songDef = songs.find(x => x.id === item.songId);
                    if (!songDef) return null;
                    return (
                      <SortableSongItem 
                        key={item.internalId} 
                        item={item} 
                        idx={idx} 
                        songDef={songDef} 
                        onRemove={removeSong}
                        onChangeKey={changeSongKey}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <input 
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
            value={row.details || ''}
            onChange={e => {
              const newSchedule = [...program.schedule];
              newSchedule[index].details = e.target.value;
              setProgram(prev => ({ ...prev, schedule: newSchedule }));
            }}
          />
        )}
      </div>

      <div className="col-span-1 flex justify-center pt-2">
        <button 
          onClick={() => {
            const newSchedule = program.schedule.filter(r => r.id !== row.id);
            setProgram(prev => ({ ...prev, schedule: newSchedule }));
          }}
          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
        >
          <Trash2 size={18}/>
        </button>
      </div>
    </div>
  );
};

// --- GŁÓWNY KOMPONENT ---

export default function Dashboard() {
  const [programs, setPrograms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('');
  const [program, setProgram] = useState(getEmptyProgram());
  const [songs, setSongs] = useState([]);
  const [worshipTeam, setWorshipTeam] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' (rosnąco) lub 'desc' (malejąco)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchPrograms();
    fetchSongs();
    fetchWorshipTeam();
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
      zespol: { lider: '', piano: '', gitara_akustyczna: '', gitara_elektryczna: '', bas: '', wokale: '', cajon: '' }
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

  const fetchWorshipTeam = async () => {
    const { data } = await supabase.from('worship_team').select('*').order('full_name');
    setWorshipTeam(data || []);
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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setProgram((prev) => {
        const oldIndex = prev.schedule.findIndex((item) => item.id === active.id);
        const newIndex = prev.schedule.findIndex((item) => item.id === over.id);
        return { ...prev, schedule: arrayMove(prev.schedule, oldIndex, newIndex) };
      });
    }
  };

  const filteredPrograms = programs.filter(p => {
    const search = filter.toLowerCase();
    return (
      (p.date || '').toLowerCase().includes(search) ||
      (p.title || '').toLowerCase().includes(search)
    );
  });

  const today = new Date().toISOString().split('T')[0];
  
  const sortPrograms = (list) => {
    return list.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  const upcomingPrograms = sortPrograms(filteredPrograms.filter(p => p.date >= today));
  const pastPrograms = sortPrograms(filteredPrograms.filter(p => p.date < today));

  const formatDateFull = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('pl-PL', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const ProgramItem = ({ p }) => (
    <div 
      key={p.id}
      onClick={() => setSelectedId(p.id)}
      className={`p-3 rounded-xl border cursor-pointer transition group relative overflow-hidden mb-2 ${
        selectedId === p.id 
          ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100' 
          : 'bg-white/40 border-white/60 hover:bg-white/80 hover:shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className={`font-bold text-sm mb-0.5 ${selectedId === p.id ? 'text-blue-700' : 'text-gray-700'}`}>
            {p.date ? formatDateFull(p.date) : 'Brak daty'}
          </div>
          <div className="text-[10px] text-gray-500 font-medium bg-gray-100/50 px-1.5 py-0.5 rounded inline-block">
            {p.schedule?.length || 0} elem.
          </div>
        </div>
      </div>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition duration-200">
        <button onClick={(e) => { e.stopPropagation(); handleDuplicate(p); }} className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Duplikuj"><Copy size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-1 bg-red-50 text-red-500 rounded hover:bg-red-100" title="Usuń"><Trash2 size={14} /></button>
      </div>
      {selectedId === p.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
    </div>
  );

  return (
    <div className="flex h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="w-80 bg-white/40 backdrop-blur-xl border-r border-white/40 flex flex-col h-full">
        <div className="p-6 border-b border-white/40">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Lista programów</h2>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input 
                placeholder="Szukaj..." 
                className="w-full px-4 py-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" 
                value={filter} 
                onChange={e => setFilter(e.target.value)} 
              />
            </div>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl text-gray-600 hover:bg-white hover:shadow-sm transition"
              title="Sortuj"
            >
              <ArrowUpDown size={18} />
            </button>
          </div>
          <button onClick={() => setSelectedId(null)} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-xl font-bold shadow-lg hover:shadow-blue-500/30 transition transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2"><Plus size={16} /> Nowy Program</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Nadchodzące</h3>
            {upcomingPrograms.length === 0 ? <div className="text-xs text-gray-400 italic ml-1">Brak planów</div> : upcomingPrograms.map(p => <ProgramItem key={p.id} p={p} />)}
          </div>
          <div>
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1 hover:text-blue-600 transition w-full text-left"><History size={12} /> Historia {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</button>
            {showHistory && <div className="animate-in fade-in slide-in-from-top-2 duration-200">{pastPrograms.map(p => <ProgramItem key={p.id} p={p} />)}</div>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-8 min-h-full">
          <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200/50">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Program Nabożeństwa</h1>
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-200/50 w-fit">
                <Calendar size={16} className="text-blue-600" />
                <input type="date" className="bg-transparent text-gray-700 font-medium outline-none text-sm" value={program.date} onChange={e => setProgram({...program, date: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="bg-white text-green-600 px-4 py-2.5 rounded-xl border border-green-100 font-bold hover:bg-green-50 flex items-center gap-2 transition shadow-sm" onClick={handleSave}><Save size={18}/> <span className="hidden md:inline">Zapisz</span></button>
              <div className="h-10 w-px bg-gray-300 mx-1 self-center"></div>
              <button onClick={() => { const songsMap = {}; songs.forEach(s => songsMap[s.id] = s); generatePDF(program, songsMap); }} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg transition"><FileText size={18}/> <span className="hidden md:inline">PDF</span></button>
              <button onClick={() => { const songsMap = {}; songs.forEach(s => songsMap[s.id] = s); generatePPT(program, songsMap); }} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg transition"><Presentation size={18}/> <span className="hidden md:inline">PPT</span></button>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 p-6 mb-8 min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2"><div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>Plan szczegółowy</h3>
              <button onClick={() => setProgram({...program, schedule: [...program.schedule, { id: Date.now(), element: '', person: '', details: '', songIds: [], selectedSongs: [] }]})} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm px-4 py-2 rounded-xl font-bold hover:shadow-lg transition">+ Dodaj Element</button>
            </div>
            <div className="bg-white/50 rounded-xl border border-gray-200/50 shadow-inner">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200/50 bg-gray-50/50 font-bold text-xs text-gray-500 uppercase tracking-wider"><div className="col-span-1"></div><div className="col-span-3">Element</div><div className="col-span-3">Osoba</div><div className="col-span-4">Szczegóły / Notatki</div><div className="col-span-1"></div></div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={program.schedule.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div>{program.schedule.map((row, idx) => <SortableRow key={row.id} row={row} index={idx} program={program} setProgram={setProgram} songs={songs} />)}</div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 p-6 mb-6 hover:shadow-xl transition relative z-50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">Zespół Uwielbienia</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[{ key: 'lider', label: 'Lider Uwielbienia' }, { key: 'piano', label: 'Piano' }, { key: 'gitara_akustyczna', label: 'Gitara Akustyczna' }, { key: 'gitara_elektryczna', label: 'Gitara Elektryczna' }, { key: 'bas', label: 'Gitara Basowa' }, { key: 'wokale', label: 'Wokale' }, { key: 'cajon', label: 'Cajon / Perkusja' }].map(field => (
                <MultiSelect key={field.key} label={field.label} options={worshipTeam} value={program.zespol?.[field.key] || ''} onChange={(newValue) => setProgram(prev => ({ ...prev, zespol: { ...prev.zespol, [field.key]: newValue } }))} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-0">
            <SectionCard title="Atmosfera Team" dataKey="atmosfera_team" program={program} setProgram={setProgram} fields={[{ key: 'przygotowanie', label: 'Przygotowanie:' }, { key: 'witanie', label: 'Witanie:' }]} />
            <SectionCard title="Produkcja" dataKey="produkcja" program={program} setProgram={setProgram} fields={[{ key: 'naglosnienie', label: 'Nagłośnienie:' }, { key: 'propresenter', label: 'ProPresenter:' }, { key: 'social', label: 'Social Media:' }, { key: 'host', label: 'Host wydarzenia:' }]} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-0">
            <SectionCard title="Scena" dataKey="scena" program={program} setProgram={setProgram} fields={[{ key: 'prowadzenie', label: 'Prowadzenie:' }, { key: 'modlitwa', label: 'Modlitwa:' }, { key: 'kazanie', label: 'Kazanie:' }, { key: 'wieczerza', label: 'Wieczerza:' }, { key: 'ogloszenia', label: 'Ogłoszenia:' }]} />
            <SectionCard title="Szkółka Niedzielna" dataKey="szkolka" program={program} setProgram={setProgram} fields={[{ key: 'mlodsza', label: 'Grupa Młodsza:' }, { key: 'srednia', label: 'Grupa Średnia:' }, { key: 'starsza', label: 'Grupa Starsza:' }]} />
          </div>
        </div>
      </div>
    </div>
  );
}
