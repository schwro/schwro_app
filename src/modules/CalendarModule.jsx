import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import {
  Calendar as CalIcon, ChevronLeft, ChevronRight,
  Plus, CheckCircle, Clock, Video, Music, X, Save,
  Users, HeartHandshake, Home, Baby, GripVertical, Trash2,
  ChevronDown, MapPin, AlignLeft, Search, Check, UserX,
  FileText, LayoutGrid, List, LayoutList, Columns, CalendarPlus, ListTodo
} from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CustomSelect from '../components/CustomSelect';

// --- KONFIGURACJA ZESPOŁÓW I DANYCH ---

const TEAMS = {
  program: { label: 'Nabożeństwa', color: 'pink', icon: Music },
  media: { label: 'Media Team', color: 'orange', icon: Video },
  atmosfera: { label: 'Atmosfera', color: 'teal', icon: HeartHandshake },
  worship: { label: 'Zespół Uwielbienia', color: 'purple', icon: Music },
  kids: { label: 'Małe SchWro', color: 'yellow', icon: Baby },
  groups: { label: 'Grupy Domowe', color: 'blue', icon: Home },
};

const PROGRAM_ELEMENTS = ['Wstęp', 'Uwielbienie', 'Modlitwa', 'Czytanie', 'Kazanie', 'Wieczerza', 'Uwielbienie / Kolekta', 'Ogłoszenia', 'Zakończenie'];
const MUSICAL_KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

// --- HELPERY UI ---

function useDropdownPosition(triggerRef, isOpen) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUpward: false });
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const update = () => {
        const rect = triggerRef.current.getBoundingClientRect();
        const dropdownMaxHeight = 300;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUpward = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow;
        setCoords({
          top: openUpward ? rect.top + window.scrollY - 4 : rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
          openUpward
        });
      };
      update();
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
      return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
    }
  }, [isOpen]);
  return coords;
}

const CustomDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const triggerRef = useRef(null);
  const coords = useDropdownPosition(triggerRef, isOpen);

  useEffect(() => { if (value) setViewDate(new Date(value)); }, [value]);

  const handleDayClick = (day) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    onChange(`${d.getFullYear()}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const { days, firstDay } = getDaysInMonth(viewDate);
  const daysArray = Array.from({ length: days }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay });

  return (
    <div className="relative w-full">
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-2 cursor-pointer hover:border-pink-400 transition">
        <CalIcon size={16} className="text-pink-600 dark:text-pink-400" />
        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
          {value ? new Date(value).toLocaleDateString('pl-PL') : 'Wybierz datę'}
        </span>
      </div>
      {isOpen && coords.width > 0 && document.body && createPortal(
        <div className="fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-100 w-[280px]" style={{ ...(coords.openUpward ? { bottom: `calc(100vh - ${coords.top}px)` } : { top: coords.top }), left: coords.left }}>
           <div className="flex justify-between items-center mb-4">
             <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1))); }} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={18} /></button>
             <span className="text-sm font-bold capitalize">{viewDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</span>
             <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1))); }} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={18} /></button>
           </div>
           <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[10px] font-bold text-gray-400 uppercase">{['Pn','Wt','Śr','Cz','Pt','So','Nd'].map(d => <div key={d}>{d}</div>)}</div>
           <div className="grid grid-cols-7 gap-1">
             {emptyDays.map((_, i) => <div key={`e-${i}`} />)}
             {daysArray.map(d => {
               const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
               return (
                 <button key={d} onClick={(e) => { e.stopPropagation(); handleDayClick(d); }} className={`h-8 w-8 rounded-lg text-xs font-medium transition ${value === dateStr ? 'bg-pink-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                   {d}
                 </button>
               )
             })}
           </div>
        </div>, document.body
      )}
    </div>
  );
};

const MultiSelect = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const coords = useDropdownPosition(triggerRef, isOpen);
  const selectedItems = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  const toggleSelection = (name) => {
    let newSelection;
    if (selectedItems.includes(name)) newSelection = selectedItems.filter(i => i !== name);
    else newSelection = [...selectedItems, name];
    onChange(newSelection.join(', '));
  };

  return (
    <div className="relative group">
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">{label}</label>
      <div ref={triggerRef} className="w-full min-h-[42px] px-3 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus-within:ring-2 focus-within:ring-pink-500/20 cursor-pointer flex flex-wrap gap-2 items-center" onClick={() => setIsOpen(!isOpen)}>
        {selectedItems.length === 0 ? (
          <span className="text-gray-400 dark:text-gray-500 text-sm">Wybierz osoby...</span>
        ) : (
          selectedItems.map((item, idx) => (
            <span key={idx} className="bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-lg text-xs font-medium border border-pink-200 dark:border-pink-800 flex items-center gap-1">
              {item} <span onClick={(e) => { e.stopPropagation(); toggleSelection(item); }} className="hover:bg-pink-200 rounded-full cursor-pointer"><X size={10} /></span>
            </span>
          ))
        )}
        <div className="ml-auto"><ChevronDown size={16} className="text-gray-400" /></div>
      </div>
      {isOpen && coords.width > 0 && document.body && createPortal(
        <div className="fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar" style={{ ...(coords.openUpward ? { bottom: `calc(100vh - ${coords.top}px)` } : { top: coords.top }), left: coords.left, width: coords.width }}>
          {(!options || options.length === 0) ? (
             <div className="p-3 text-center text-gray-400 text-xs">Brak osób w bazie</div>
          ) : (
             options.map(person => {
                const displayName = person.fullname || person.name || 'Brak danych';
                const isSelected = selectedItems.includes(displayName);
                return (
                  <div key={person.id} className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-pink-50 dark:hover:bg-pink-900/20 ${isSelected ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-700' : 'text-gray-700 dark:text-gray-300'}`} onClick={() => toggleSelection(displayName)}>
                    <span>{displayName}</span>
                    {isSelected && <Check size={16} />}
                  </div>
                );
             })
          )}
        </div>, document.body
      )}
    </div>
  );
};

const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  return { days, firstDay: firstDay === 0 ? 6 : firstDay - 1 };
};

// --- KOMPONENTY PIEŚNI ---

const SongSelector = ({ songs, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef(null);
  const coords = useDropdownPosition(triggerRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && !e.target.closest('.portal-song-selector')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredSongs = songs.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full">
      <div ref={triggerRef} className="w-full px-3 py-2 bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800 rounded-lg text-sm text-pink-800 dark:text-pink-300 font-medium flex items-center justify-between cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-900/30 transition" onClick={() => setIsOpen(!isOpen)}>
        <span>Wybierz pieśń...</span>
        <ChevronDown size={16} className="text-pink-400" />
      </div>
      {isOpen && document.body && createPortal(
        <div className="portal-song-selector fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 flex flex-col overflow-hidden" style={{ ...(coords.openUpward ? { bottom: `calc(100vh - ${coords.top}px)` } : { top: coords.top }), left: coords.left, width: coords.width }}>
           <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
             <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                <Search size={14} className="text-gray-400"/>
                <input autoFocus className="bg-transparent outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder-gray-400" placeholder="Szukaj..." value={search} onChange={e => setSearch(e.target.value)} />
             </div>
           </div>
           <div className="overflow-y-auto flex-1 max-h-48 custom-scrollbar">
             {filteredSongs.length === 0 ? (
                <div className="p-3 text-xs text-gray-400 text-center">Brak wyników</div>
             ) : (
                filteredSongs.map(s => (
                   <div key={s.id} className="px-4 py-2 hover:bg-pink-50 dark:hover:bg-pink-900/20 cursor-pointer text-sm text-gray-700 dark:text-gray-300 flex justify-between items-center border-b border-gray-50 dark:border-gray-800 last:border-0" onClick={() => { onSelect(s); setIsOpen(false); setSearch(""); }}>
                      <span className="font-medium">{s.title}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">{s.key}</span>
                   </div>
                ))
             )}
           </div>
        </div>, document.body
      )}
    </div>
  );
};

const SortableSongItem = ({ item, idx, songDef, onRemove, onChangeKey }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.internalId });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: transform ? 999 : 'auto', position: 'relative' };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-pink-100 dark:border-pink-900/30 rounded-lg shadow-sm group">
       <div {...attributes} {...listeners} className="cursor-grab text-gray-300 dark:text-gray-600 hover:text-pink-600 dark:hover:text-pink-400 active:cursor-grabbing"><GripVertical size={14}/></div>
       <div className="flex items-center gap-2 flex-1">
          <span className="text-pink-700 dark:text-pink-400 font-medium text-xs">{idx + 1}.</span>
          <span className="text-gray-700 dark:text-gray-200 text-sm truncate">{songDef?.title || "Nieznana pieśń"}</span>
       </div>
       <div className="flex items-center gap-1">
          <div className="w-[60px]"><CustomSelect compact options={MUSICAL_KEYS.map(k=>({value:k, label:k}))} value={item.key} onChange={(val) => onChangeKey(item.internalId, val)} /></div>
          <button onClick={() => onRemove(item.internalId)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"><X size={14}/></button>
       </div>
    </div>
  );
};

// --- PROGRAM EDITOR COMPONENTS ---

const SectionCard = ({ title, dataKey, fields, program, setProgram }) => (
  <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 dark:border-gray-700/50 p-6 h-full hover:shadow-xl transition relative z-0">
    <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg bg-gradient-to-r from-pink-700 to-orange-700 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">{title}</h3>
    </div>
    <div className="space-y-4">
      {fields.map(field => (
        <div key={field.key}>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">{field.label}</label>
          <input 
            className="w-full px-4 py-2.5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-pink-500/20 outline-none text-sm transition text-gray-700 dark:text-gray-200"
            value={program[dataKey]?.[field.key] || ''}
            onChange={e => setProgram(prev => ({ ...prev, [dataKey]: { ...prev[dataKey], [field.key]: e.target.value } }))}
          />
        </div>
      ))}
    </div>
  </div>
);

const SortableRow = ({ row, index, program, setProgram, onRemove, songs }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: transform ? 999 : 'auto', position: 'relative' };
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const isWorship = (row.element || "").toLowerCase().includes('uwielbienie');

  const currentSongs = (row.selectedSongs || row.songIds || []).map(id => {
      if (typeof id === 'object') return id; 
      const s = songs.find(x => x.id === id);
      return { internalId: Math.random(), songId: id, key: s?.key || 'C' };
  });

  const updateRow = (field, value) => {
    const newSchedule = [...program.schedule];
    newSchedule[index][field] = value;
    setProgram(prev => ({ ...prev, schedule: newSchedule }));
  };

  const updateSongs = (newSongs) => {
      const newSchedule = [...program.schedule];
      newSchedule[index].selectedSongs = newSongs;
      newSchedule[index].songIds = newSongs.map(s => s.songId);
      setProgram(prev => ({...prev, schedule: newSchedule}));
  };

  const handleSongDragEnd = (event) => {
      const { active, over } = event;
      if (active.id !== over.id) {
          const oldIndex = currentSongs.findIndex(item => item.internalId === active.id);
          const newIndex = currentSongs.findIndex(item => item.internalId === over.id);
          updateSongs(arrayMove(currentSongs, oldIndex, newIndex));
      }
  };

  return (
    <div ref={setNodeRef} style={style} className="grid grid-cols-12 gap-4 p-3 items-start hover:bg-pink-50/30 dark:hover:bg-pink-900/10 transition duration-150 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="col-span-1 flex items-center justify-center pt-2 cursor-grab text-gray-300 dark:text-gray-600 hover:text-pink-500 dark:hover:text-pink-400 active:cursor-grabbing" {...attributes} {...listeners}><GripVertical size={20} /></div>
      
      <div className="col-span-3">
          <CustomSelect value={row.element} onChange={v => updateRow('element', v)} options={PROGRAM_ELEMENTS.map(e => ({value: e, label: e}))} />
      </div>

      <div className="col-span-3"><input className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20 outline-none text-gray-700 dark:text-gray-200" placeholder="Osoba" value={row.person || ''} onChange={e => updateRow('person', e.target.value)} /></div>
      
      <div className="col-span-4 space-y-2">
          <input className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20 outline-none text-gray-700 dark:text-gray-200" placeholder="Szczegóły / Notatka" value={row.details || ''} onChange={e => updateRow('details', e.target.value)} />
          
          {isWorship && (
              <div className="mt-2">
                  <SongSelector songs={songs} onSelect={(song) => {
                      const newSong = { internalId: Date.now() + Math.random(), songId: song.id, key: song.key || 'C' };
                      updateSongs([...currentSongs, newSong]);
                  }} />
                  
                  <div className="mt-2 flex flex-col gap-1">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSongDragEnd}>
                        <SortableContext items={currentSongs.map(s => s.internalId)} strategy={verticalListSortingStrategy}>
                            {currentSongs.map((item, idx) => {
                                const songDef = songs.find(x => x.id === item.songId);
                                if (!songDef) return null;
                                return (
                                    <SortableSongItem 
                                        key={item.internalId} 
                                        item={item} 
                                        idx={idx} 
                                        songDef={songDef} 
                                        onRemove={(id) => updateSongs(currentSongs.filter(s => s.internalId !== id))}
                                        onChangeKey={(id, k) => updateSongs(currentSongs.map(s => s.internalId === id ? {...s, key: k} : s))}
                                    />
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                  </div>
              </div>
          )}
      </div>
      
      <div className="col-span-1 flex justify-center pt-2"><button onClick={() => onRemove(row.id)} className="text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition"><Trash2 size={18}/></button></div>
    </div>
  );
};

const ModalFullProgramEditor = ({ eventId, onClose, onSave, songs }) => {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [worshipTeam, setWorshipTeam] = useState([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    const fetch = async () => {
      const { data: pData } = await supabase.from('programs').select('*').eq('id', eventId).single();
      const { data: wData } = await supabase.from('worshipteam').select('*');
      
      if (pData) {
        if (!pData.schedule) pData.schedule = [];
        ['atmosferateam', 'produkcja', 'scena', 'szkolka', 'zespol'].forEach(key => {
             if (!pData[key]) pData[key] = {};
        });
        setProgram(pData);
      }
      if (wData) setWorshipTeam(wData);
      setLoading(false);
    };
    fetch();
  }, [eventId]);

  const handleSave = async () => {
    await supabase.from('programs').update(program).eq('id', program.id);
    onSave();
    onClose();
  };

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (active.id !== over.id) {
      setProgram(prev => {
        const oldIdx = prev.schedule.findIndex(i => i.id === active.id);
        const newIdx = prev.schedule.findIndex(i => i.id === over.id);
        return { ...prev, schedule: arrayMove(prev.schedule, oldIdx, newIdx) };
      });
    }
  };

  if (loading) return null;
  if (!program) return null;
  if (!document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* HEADER */}
        <div className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center shrink-0 z-10">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl text-white shadow-lg shadow-pink-500/30"><Music size={24} /></div>
             <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">Edycja Nabożeństwa</h2>
                <div className="mt-1 w-48">
                    <CustomDatePicker value={program.date} onChange={v => setProgram({...program, date: v})} />
                </div>
             </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition font-medium">Anuluj</button>
            <button onClick={handleSave} className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/30 flex items-center gap-2 transition transform hover:-translate-y-0.5"><Save size={18} /> Zapisz</button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-gradient-to-br from-pink-50/50 via-white to-orange-50/50 dark:from-gray-900 dark:to-gray-800">
          
          <div className="bg-white/70 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 dark:border-gray-700/50 p-6 min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200 flex items-center gap-2">
                 <div className="w-1.5 h-6 bg-pink-600 dark:bg-pink-500 rounded-full"></div>
                 Plan szczegółowy
               </h3>
               <button 
                  onClick={() => setProgram(p => ({ ...p, schedule: [...p.schedule, { id: Date.now(), element: '', person: '', details: '' }] }))} 
                  className="bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-500 dark:to-orange-500 text-white text-sm px-4 py-2 rounded-xl font-bold hover:shadow-lg transition"
               >
                  Dodaj Element
               </button>
            </div>
            <div className="bg-white/50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-inner overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="col-span-1"></div>
                    <div className="col-span-3">Element</div>
                    <div className="col-span-3">Osoba</div>
                    <div className="col-span-4">Szczegóły / Notatki</div>
                    <div className="col-span-1"></div>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={program.schedule.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div>
                    {program.schedule.map((row, idx) => (
                        <SortableRow 
                            key={row.id} 
                            row={row} 
                            index={idx} 
                            program={program} 
                            setProgram={setProgram} 
                            songs={songs} 
                            onRemove={id => setProgram(p => ({...p, schedule: p.schedule.filter(i => i.id !== id)}))} 
                        />
                    ))}
                    </div>
                </SortableContext>
                </DndContext>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 dark:border-gray-700/50 p-6 relative z-50">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-lg bg-gradient-to-r from-pink-700 to-orange-700 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">Zespół Uwielbienia</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                    { key: 'lider', label: 'Lider Uwielbienia' },
                    { key: 'piano', label: 'Piano' },
                    { key: 'gitaraakustyczna', label: 'Gitara Akustyczna' },
                    { key: 'gitaraelektryczna', label: 'Gitara Elektryczna' },
                    { key: 'bas', label: 'Gitara Basowa' },
                    { key: 'wokale', label: 'Wokale' },
                    { key: 'cajon', label: 'Cajon / Perkusja' }
                 ].map(field => (
                    <MultiSelect 
                        key={field.key} 
                        label={field.label} 
                        options={worshipTeam} 
                        value={program.zespol?.[field.key]} 
                        onChange={(newValue) => setProgram(prev => ({ ...prev, zespol: { ...prev.zespol, [field.key]: newValue } }))} 
                    />
                 ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-0">
            <SectionCard title="Atmosfera Team" dataKey="atmosferateam" program={program} setProgram={setProgram} fields={[{ key: 'przygotowanie', label: 'Przygotowanie' }, { key: 'witanie', label: 'Witanie' }]} />
            <SectionCard title="Produkcja" dataKey="produkcja" program={program} setProgram={setProgram} fields={[{ key: 'naglosnienie', label: 'Nagłośnienie' }, { key: 'propresenter', label: 'ProPresenter' }, { key: 'social', label: 'Social Media' }, { key: 'host', label: 'Host wydarzenia' }]} />
            <SectionCard title="Scena" dataKey="scena" program={program} setProgram={setProgram} fields={[{ key: 'prowadzenie', label: 'Prowadzenie' }, { key: 'modlitwa', label: 'Modlitwa' }, { key: 'kazanie', label: 'Kazanie' }, { key: 'wieczerza', label: 'Wieczerza' }, { key: 'ogloszenia', label: 'Ogłoszenia' }]} />
            <SectionCard title="Szkółka Niedzielna" dataKey="szkolka" program={program} setProgram={setProgram} fields={[{ key: 'mlodsza', label: 'Grupa Młodsza' }, { key: 'srednia', label: 'Grupa Średnia' }, { key: 'starsza', label: 'Grupa Starsza' }]} />
          </div>

        </div>
      </div>
    </div>, document.body
  );
};


// --- MODAL WYBORU TYPU (WYDARZENIE VS ZADANIE) ---

const ModalSelectType = ({ date, onClose, onSelectTask, onSelectEvent }) => {
  if (!document.body) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20 dark:border-gray-700 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <X size={20} className="text-gray-500" />
        </button>

        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
          <Plus size={24} className="text-pink-600" /> Co chcesz dodać?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {date ? new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Wybierz typ'}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onSelectEvent}
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 border-2 border-pink-200 dark:border-pink-800 rounded-2xl hover:border-pink-400 dark:hover:border-pink-600 hover:shadow-lg transition group"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 group-hover:scale-110 transition">
              <CalendarPlus size={28} />
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-800 dark:text-white">Wydarzenie</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Nabożeństwo, spotkanie...</div>
            </div>
          </button>

          <button
            onClick={onSelectTask}
            className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition group"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition">
              <ListTodo size={28} />
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-800 dark:text-white">Zadanie</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Do zrobienia, reminder...</div>
            </div>
          </button>
        </div>
      </div>
    </div>, document.body
  );
};

// --- MODAL WYBORU KATEGORII WYDARZENIA ---

const ModalSelectEventCategory = ({ date, categories, onClose, onSelectCategory }) => {
  if (!document.body) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-white/20 dark:border-gray-700 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <X size={20} className="text-gray-500" />
        </button>

        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
          <CalendarPlus size={24} className="text-pink-600" /> Wybierz kategorię wydarzenia
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {date ? new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
        </p>

        <div className="space-y-2">
          {/* Nabożeństwo - zawsze na górze */}
          <button
            onClick={() => onSelectCategory('nabożeństwo')}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 border-2 border-pink-200 dark:border-pink-800 rounded-xl hover:border-pink-400 dark:hover:border-pink-600 hover:shadow-md transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 group-hover:scale-105 transition">
              <Music size={24} />
            </div>
            <div className="text-left flex-1">
              <div className="font-bold text-gray-800 dark:text-white">Nabożeństwo</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Pełny program z pieśniami i służbami</div>
            </div>
          </button>

          {/* Kategorie ze słownika */}
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.label)}
              className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-300 dark:hover:border-pink-600 hover:bg-pink-50/50 dark:hover:bg-pink-900/10 transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition">
                <CalIcon size={24} />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-gray-800 dark:text-white">{cat.label}</div>
              </div>
            </button>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
              <p>Brak dodatkowych kategorii.</p>
              <p className="text-xs mt-1">Dodaj kategorie w Ustawienia → Słowniki → Kategorie Wydarzeń</p>
            </div>
          )}
        </div>
      </div>
    </div>, document.body
  );
};

// --- MODAL OGÓLNEGO WYDARZENIA (nie Nabożeństwo) ---

const ModalAddEvent = ({ initialEvent, category, onClose, onSave, onDelete }) => {
  const [event, setEvent] = useState(initialEvent || {
    title: '',
    description: '',
    category: category || '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    end_time: '12:00',
    location: ''
  });

  useEffect(() => {
    if (initialEvent) {
      setEvent({
        ...initialEvent,
        category: initialEvent.category || category || '',
        location: initialEvent.location || '',
        description: initialEvent.description || ''
      });
    }
  }, [initialEvent, category]);

  const handleSubmit = async () => {
    if (!event.title) return alert('Podaj tytuł wydarzenia');

    const payload = {
      title: event.title,
      description: event.description || '',
      category: event.category || category,
      date: event.date,
      time: event.time || '10:00',
      end_time: event.end_time || '',
      location: event.location || ''
    };

    if (event.id) payload.id = event.id;

    onSave(payload);
    onClose();
  };

  if (!document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-white/20 dark:border-gray-700 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <X size={20} className="text-gray-500" />
        </button>

        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
          <CalendarPlus size={24} className="text-pink-600" />
          {event.id ? 'Edytuj Wydarzenie' : 'Nowe Wydarzenie'}
        </h2>
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs font-bold rounded-full">
            {event.category || category}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tytuł</label>
            <input
              autoFocus
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500/20 outline-none"
              value={event.title}
              onChange={e => setEvent({...event, title: e.target.value})}
              placeholder="Nazwa wydarzenia"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
            <CustomDatePicker value={event.date} onChange={v => setEvent({...event, date: v})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Godzina rozpoczęcia</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white text-sm"
                  value={event.time}
                  onChange={e => setEvent({...event, time: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Godzina zakończenia</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white text-sm"
                  value={event.end_time || ''}
                  onChange={e => setEvent({...event, end_time: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Miejsce</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white text-sm"
                value={event.location || ''}
                onChange={e => setEvent({...event, location: e.target.value})}
                placeholder="np. Sala główna"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Opis</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white text-sm h-24 resize-none"
              value={event.description || ''}
              onChange={e => setEvent({...event, description: e.target.value})}
              placeholder="Szczegóły wydarzenia..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          {event.id && onDelete ? (
            <button onClick={() => onDelete(event.id)} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1">
              <Trash2 size={16}/> Usuń
            </button>
          ) : <div></div>}

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Anuluj</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg shadow-pink-500/30 flex items-center gap-2 transition">
              <Save size={16} /> Zapisz
            </button>
          </div>
        </div>
      </div>
    </div>, document.body
  );
};

// --- TASK MODAL ---

const ModalAddTask = ({ initialTask, onClose, onSave, onDelete }) => {
  const [task, setTask] = useState(initialTask || {
    title: '',
    description: '',
    team: 'media',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '10:00',
    location: '',
    status: 'Do zrobienia'
  });

  useEffect(() => {
      if (initialTask) {
          setTask({
              ...initialTask,
              location: initialTask.location || '',
              description: initialTask.description || ''
          });
      }
  }, [initialTask]);

  const handleDateChange = (val) => {
      setTask(prev => ({...prev, due_date: val}));
  };

  const handleSubmit = () => {
    if (!task.title) return alert('Podaj tytuł');
    
    const dateStr = task.due_date;
    const timeStr = task.due_time || '00:00';
    
    // Tworzymy datę w formacie ISO z offsetem, aby baza zapisała to poprawnie
    const localDate = new Date(`${dateStr}T${timeStr}:00`);
    
    const payload = {
        title: task.title,
        description: task.description || '',
        team: task.team || 'media',
        due_date: localDate.toISOString(), // Pełny timestamp ISO
        location: task.location || '',
        status: task.status || 'Do zrobienia'
    };
    
    if (task.id) payload.id = task.id;

    onSave(payload);
    onClose();
  };

  if (!document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-white/20 dark:border-gray-700 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={20} className="text-gray-500" /></button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            {task.id ? <CheckCircle size={24} className="text-blue-600" /> : <Plus size={24} className="text-blue-600" />} 
            {task.id ? 'Edytuj Zadanie' : 'Nowe Zadanie'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tytuł</label>
            <input autoFocus className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none" value={task.title} onChange={e => setTask({...task, title: e.target.value})} placeholder="Co jest do zrobienia?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategoria</label><CustomSelect value={task.team} onChange={v => setTask({...task, team: v})} options={Object.entries(TEAMS).filter(([k]) => k !== 'program').map(([k, v]) => ({ value: k, label: v.label }))} /></div>
             <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Miejsce</label><div className="relative"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white text-sm" value={task.location || ''} onChange={e => setTask({...task, location: e.target.value})} placeholder="np. Biuro" /></div></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label><CustomDatePicker value={task.due_date} onChange={handleDateChange} /></div>
             <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Godzina</label><div className="relative"><Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="time" className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white text-sm" value={task.due_time} onChange={e => setTask({...task, due_time: e.target.value})} /></div></div>
          </div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Opis</label><textarea className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white text-sm h-24 resize-none" value={task.description || ''} onChange={e => setTask({...task, description: e.target.value})} placeholder="Szczegóły zadania..." /></div>
        </div>
        <div className="mt-6 flex justify-between items-center">
           {task.id && onDelete ? (
              <button onClick={() => onDelete(task.id)} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1"><Trash2 size={16}/> Usuń</button>
           ) : <div></div>}
           
           <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">Anuluj</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/30 transition"><Save size={16} /> Zapisz</button>
           </div>
        </div>
      </div>
    </div>, document.body
  );
};

const EventBadge = ({ event, onClick }) => {
  const teamConfig = TEAMS[event.team] || TEAMS.media;
  const colors = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    pink: "bg-pink-100 text-pink-700 border-pink-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    teal: "bg-teal-100 text-teal-700 border-teal-200",
  };
  const style = colors[teamConfig.color] || colors.orange;

  // Formatowanie czasu z raw data, aby uniknąć konwersji stref czasowych
  let timeDisplay = "";
  if (event.raw) {
      // Próbujemy wziąć wprost due_time jeśli istnieje, a jak nie to parsować datę
      if (event.raw.due_time && event.raw.due_time.length === 5) {
         timeDisplay = event.raw.due_time;
      } else if (event.raw.due_date && event.raw.due_date.includes('T')) {
          const parts = event.raw.due_date.split('T')[1].split(':');
          timeDisplay = `${parts[0]}:${parts[1]}`;
      }
  }

  return (
    <div onClick={e => { e.stopPropagation(); onClick(event); }} className={`text-[10px] px-1.5 py-1 rounded-md border mb-1 cursor-pointer truncate flex items-center gap-1 transition hover:brightness-95 ${style}`}>
      <div className={`w-1.5 h-1.5 rounded-full bg-current opacity-50`} />
      <span className="truncate font-medium">{event.title}</span>
      {timeDisplay && <span className="ml-auto opacity-60 text-[9px]">{timeDisplay}</span>}
    </div>
  );
};


// --- MAIN MODULE ---


export default function CalendarModule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [songs, setSongs] = useState([]);
  const [visibleTeams, setVisibleTeams] = useState(() => {
    const saved = localStorage.getItem('calendarVisibleTeams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sprawdź czy wszystkie klucze są prawidłowe
        const validKeys = Object.keys(TEAMS);
        const filtered = parsed.filter(key => validKeys.includes(key));
        return filtered.length > 0 ? filtered : validKeys;
      } catch {
        return Object.keys(TEAMS);
      }
    }
    return Object.keys(TEAMS);
  });
  const [modals, setModals] = useState({
    addTask: null,
    editProgram: null,
    selectType: null,      // { date: 'YYYY-MM-DD' } - modal wyboru typu
    selectCategory: null,  // { date: 'YYYY-MM-DD' } - modal wyboru kategorii wydarzenia
    addEvent: null         // { date, category } - modal dodawania ogólnego wydarzenia
  });
  const [view, setView] = useState('month');
  const [eventCategories, setEventCategories] = useState([]);

  // Zapisz wybrane kalendarze do localStorage przy każdej zmianie
  useEffect(() => {
    localStorage.setItem('calendarVisibleTeams', JSON.stringify(visibleTeams));
  }, [visibleTeams]);

  useEffect(() => {
      fetchEvents();
      fetchSongs();
      fetchEventCategories();
  }, [currentDate.getMonth()]);

  const fetchEventCategories = async () => {
    const { data } = await supabase.from('app_dictionaries').select('*').eq('category', 'event_category');
    if (data) setEventCategories(data);
  };

  const fetchSongs = async () => {
      const { data } = await supabase.from('songs').select('*');
      if (data) setSongs(data);
  }

  const fetchEvents = async () => {
    const { data: prog } = await supabase.from('programs').select('*');
    const { data: task } = await supabase.from('tasks').select('*');
    const { data: eventsData } = await supabase.from('events').select('*');
    const all = [];

    prog?.forEach(p => all.push({ id: p.id, type: 'program', team: 'program', title: p.title || 'Nabożeństwo', date: new Date(p.date), raw: p }));

    // Ogólne wydarzenia (nie-nabożeństwa)
    eventsData?.forEach(ev => {
        if (!ev.date) return;
        const d = new Date(ev.date);
        if (isNaN(d.getTime())) return;

        all.push({
            id: ev.id,
            type: 'event',
            team: 'program', // Wyświetlamy jak program (różowe)
            title: ev.title,
            date: d,
            raw: {
                ...ev,
                due_time: ev.time || '10:00'
            }
        });
    });

    task?.forEach(t => {
        if (!t.due_date) return;
        const d = new Date(t.due_date);
        if (isNaN(d.getTime())) return;

        // FIX 2: Pobieranie czasu bezpośrednio ze stringa ISO, aby uniknąć przesunięć
        // Format ISO: YYYY-MM-DDTHH:MM:SS
        let timeStr = '00:00';
        let dateStr = t.due_date.split('T')[0];

        if (t.due_date.includes('T')) {
           const timePart = t.due_date.split('T')[1];
           const [h, m] = timePart.split(':');
           timeStr = `${h}:${m}`;
        }

        all.push({
            id: t.id,
            type: 'task',
            team: t.team || 'media',
            title: t.title,
            date: d,
            status: t.status,
            // Przekazujemy "surową" godzinę i datę do edycji
            raw: {
                ...t,
                due_time: timeStr,
                due_date: dateStr
            }
        });
    });
    setEvents(all.filter(e => e.date));
  };

  const handleSaveTask = async (taskData) => { 
      let error = null;
      if (taskData.id) {
          const { error: e } = await supabase.from('tasks').update(taskData).eq('id', taskData.id);
          error = e;
      } else {
          const { error: e } = await supabase.from('tasks').insert([taskData]); 
          error = e;
      }

      if (error) {
          alert(`Błąd zapisu: ${error.message}`);
          console.error(error);
      } else {
          fetchEvents(); 
      }
  };

  const handleDeleteTask = async (id) => {
      if (confirm("Czy na pewno chcesz usunąć to zadanie?")) {
          await supabase.from('tasks').delete().eq('id', id);
          setModals({...modals, addTask: null});
          fetchEvents();
      }
  }

  const handleSaveProgram = async () => { fetchEvents(); };

  // Obsługa zapisywania ogólnych wydarzeń
  const handleSaveEvent = async (eventData) => {
    let error = null;
    if (eventData.id) {
      const { error: e } = await supabase.from('events').update(eventData).eq('id', eventData.id);
      error = e;
    } else {
      const { error: e } = await supabase.from('events').insert([eventData]);
      error = e;
    }

    if (error) {
      alert(`Błąd zapisu wydarzenia: ${error.message}`);
      console.error(error);
    } else {
      fetchEvents();
    }
  };

  const handleDeleteEvent = async (id) => {
    if (confirm("Czy na pewno chcesz usunąć to wydarzenie?")) {
      await supabase.from('events').delete().eq('id', id);
      setModals({...modals, addEvent: null});
      fetchEvents();
    }
  };

  // Flow dodawania: kliknięcie na + otwiera modal wyboru typu
  const handleAddClick = (dateStr) => {
    setModals({...modals, selectType: { date: dateStr }});
  };

  // Po wyborze "Wydarzenie" - otwórz modal kategorii
  const handleSelectEvent = () => {
    const date = modals.selectType?.date;
    setModals({...modals, selectType: null, selectCategory: { date }});
  };

  // Po wyborze "Zadanie" - otwórz modal zadania
  const handleSelectTask = () => {
    const date = modals.selectType?.date;
    setModals({
      ...modals,
      selectType: null,
      addTask: { due_date: date, due_time: '10:00', team: 'media' }
    });
  };

  // Po wyborze kategorii wydarzenia
  const handleSelectCategory = async (category) => {
    const date = modals.selectCategory?.date;

    if (category.toLowerCase() === 'nabożeństwo') {
      // Utwórz nowy program i otwórz edytor
      const { data, error } = await supabase.from('programs').insert([{
        date: date,
        schedule: [],
        zespol: { lider: '', piano: '', gitara_akustyczna: '', gitara_elektryczna: '', bas: '', wokale: '', cajon: '', notatki: '', absencja: '' },
        atmosfera_team: { przygotowanie: '', witanie: '' },
        produkcja: { naglosnienie: '', propresenter: '', social: '', host: '' },
        scena: { prowadzenie: '', czytanie: '', kazanie: '', modlitwa: '', wieczerza: '', ogloszenia: '' },
        szkolka: { mlodsza: '', srednia: '', starsza: '' }
      }]).select().single();

      if (error) {
        alert('Błąd tworzenia nabożeństwa: ' + error.message);
        return;
      }

      setModals({...modals, selectCategory: null, editProgram: data.id});
      fetchEvents();
    } else {
      // Otwórz modal ogólnego wydarzenia
      setModals({
        ...modals,
        selectCategory: null,
        addEvent: { date, category, title: '', time: '10:00' }
      });
    }
  };

  // Obsługa kliknięcia w wydarzenie na kalendarzu
  const handleEventClick = (ev) => {
    if (ev.type === 'program') {
      setModals({...modals, editProgram: ev.id});
    } else if (ev.type === 'event') {
      setModals({...modals, addEvent: ev.raw});
    } else {
      setModals({...modals, addTask: ev.raw});
    }
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const today = () => setCurrentDate(new Date());

  const { days, firstDay } = getDaysInMonth(currentDate);
  const daysArray = Array.from({ length: days }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay });
  const filteredEvents = events.filter(e => visibleTeams.includes(e.team));

  // --- RENDER LOGIC FOR VIEWS ---

  const renderMonthView = () => (
    <>
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'].map(d => <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 uppercase">{d}</div>)}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-gray-200 dark:bg-gray-700 gap-px overflow-y-auto custom-scrollbar">
        {emptyDays.map((_, i) => <div key={`em-${i}`} className="bg-gray-50/50 dark:bg-gray-900/50" />)}
        {daysArray.map(d => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
          const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const dayEvents = filteredEvents.filter(e => e.date.getDate() === d && e.date.getMonth() === currentDate.getMonth());
          return (
            <div key={d} className="bg-white dark:bg-gray-900 min-h-[100px] p-2 relative group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${d === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>{d}</span>
                <button onClick={() => handleAddClick(dateStr)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400"><Plus size={14} /></button>
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[100px] custom-scrollbar">
                {dayEvents.map(ev => (
                  <EventBadge key={ev.id} event={ev} onClick={() => handleEventClick(ev)} />
                ))}
              </div>
            </div>
          )
        })}
        {Array.from({ length: (42 - (days + firstDay)) % 7 }).map((_, i) => <div key={`end-${i}`} className="bg-gray-50/50 dark:bg-gray-900/50" />)}
      </div>
    </>
  );

  const renderWeekView = () => {
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay() + 1; 
    const weekDays = Array.from({length: 7}, (_, i) => new Date(new Date(curr).setDate(first + i)));

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
         <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
             {weekDays.map(d => (
                 <div key={d.toString()} className="py-3 text-center border-r border-gray-100 dark:border-gray-700/50 last:border-0">
                     <div className="text-xs text-gray-500 uppercase mb-1">{d.toLocaleDateString('pl-PL', {weekday: 'short'})}</div>
                     <div className={`text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto ${d.getDate() === new Date().getDate() && d.getMonth() === new Date().getMonth() ? 'bg-pink-600 text-white' : 'text-gray-800 dark:text-white'}`}>
                         {d.getDate()}
                     </div>
                 </div>
             ))}
         </div>
         <div className="flex-1 grid grid-cols-7 divide-x divide-gray-100 dark:divide-gray-700/50 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900">
             {weekDays.map(d => {
                 const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                 const dayEvents = filteredEvents.filter(e => e.date.getDate() === d.getDate() && e.date.getMonth() === d.getMonth());
                 return (
                    <div key={d.toString()} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition min-h-[200px]">
                        {dayEvents.map(ev => <EventBadge key={ev.id} event={ev} onClick={() => handleEventClick(ev)} />)}
                        <button onClick={() => handleAddClick(dateStr)} className="w-full mt-2 py-2 text-xs text-gray-300 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg transition flex items-center justify-center gap-1"><Plus size={12}/> Dodaj</button>
                    </div>
                 )
             })}
         </div>
      </div>
    )
  };

  const renderDayView = () => {
      const dayEvents = filteredEvents.filter(e => e.date.getDate() === currentDate.getDate() && e.date.getMonth() === currentDate.getMonth());
      const hours = Array.from({length: 15}, (_, i) => i + 8); // 08:00 - 22:00

      return (
        <div className="flex-1 bg-white dark:bg-gray-900 overflow-y-auto custom-scrollbar flex">
            {/* Lewa kolumna godzin */}
            <div className="w-16 flex-shrink-0 border-r border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900">
                {hours.map(h => (
                    <div key={h} className="h-[80px] border-b border-gray-100 dark:border-gray-800 text-right pr-3 pt-2 text-xs text-gray-400 font-medium relative">
                        {String(h).padStart(2, '0')}:00
                    </div>
                ))}
            </div>

            {/* Prawa kolumna zdarzeń */}
            <div className="flex-1 relative min-h-[1200px]">
                {/* Linie poziome */}
                {hours.map(h => (
                    <div key={h} className="h-[80px] border-b border-gray-100 dark:border-gray-800/50 w-full absolute" style={{top: (h-8)*80}}></div>
                ))}
                
                {/* Zdarzenia */}
                {dayEvents.map(ev => {
                    // Pobieranie godziny z raw data jeśli dostępne, lub z daty
                    let h, m;
                    if (ev.raw.due_time) {
                        [h, m] = ev.raw.due_time.split(':').map(Number);
                    } else {
                        h = ev.date.getHours();
                        m = ev.date.getMinutes();
                    }

                    const startMin = (Math.max(8, h) - 8) * 60 + m;
                    const top = (startMin / 60) * 80; 
                    
                    return (
                        <div
                            key={ev.id}
                            onClick={() => handleEventClick(ev)}
                            className={`absolute left-2 right-2 rounded-xl p-3 shadow-sm border cursor-pointer hover:shadow-md transition z-10 ${ev.team === 'program' ? 'bg-pink-50 border-pink-200 text-pink-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}
                            style={{ top: `${top}px`, height: '70px' }}
                        >
                            <div className="flex items-center gap-2 text-xs font-bold opacity-70 mb-1">
                                <Clock size={12}/>
                                {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}
                            </div>
                            <div className="font-bold truncate">{ev.title}</div>
                            <div className="text-xs opacity-60 truncate">{TEAMS[ev.team]?.label}</div>
                        </div>
                    );
                })}

                {/* Aktualna godzina (linia) */}
                {currentDate.getDate() === new Date().getDate() && (
                    <div 
                        className="absolute w-full border-t-2 border-red-400 z-20 flex items-center"
                        style={{ top: `${((new Date().getHours() - 8) * 60 + new Date().getMinutes()) / 60 * 80}px` }}
                    >
                        <div className="w-2 h-2 bg-red-400 rounded-full -ml-1"></div>
                    </div>
                )}
            </div>
        </div>
      )
  };

  const renderListView = () => {
      const sortedEvents = [...filteredEvents].sort((a,b) => a.date - b.date);
      return (
        <div className="flex-1 bg-white dark:bg-gray-900 overflow-y-auto custom-scrollbar p-6">
             <div className="max-w-4xl mx-auto space-y-2">
                 {sortedEvents.map(ev => (
                     <div key={ev.id} onClick={() => handleEventClick(ev)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer transition">
                         <div className="w-16 text-center">
                             <div className="text-xs text-gray-400 uppercase font-bold">{ev.date.toLocaleDateString('pl-PL', {month: 'short'})}</div>
                             <div className="text-xl font-bold text-gray-800 dark:text-white">{ev.date.getDate()}</div>
                         </div>
                         <div className={`w-1 self-stretch rounded-full ${TEAMS[ev.team]?.color === 'pink' ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                         <div className="flex-1">
                             <h4 className="font-bold text-gray-800 dark:text-gray-200">{ev.title}</h4>
                             <div className="text-xs text-gray-500 flex gap-3 mt-0.5">
                                 <span>{TEAMS[ev.team]?.label || ev.raw?.category}</span>
                                 {ev.raw?.due_time && <span>• {ev.raw.due_time}</span>}
                             </div>
                         </div>
                     </div>
                 ))}
                 {sortedEvents.length === 0 && <div className="text-center text-gray-400 py-10">Brak wydarzeń w tym miesiącu</div>}
             </div>
        </div>
      )
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col gap-4">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400"><CalIcon size={24} /></div>
            <div>
               <h1 className="text-xl font-bold text-gray-800 dark:text-white">Kalendarz</h1>
               <p className="text-xs text-gray-500 dark:text-gray-400">Zarządzanie wydarzeniami i zadaniami</p>
            </div>
         </div>
         <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
            {[
              { id: 'month', icon: LayoutGrid, label: 'Miesiąc' },
              { id: 'week', icon: Columns, label: 'Tydzień' },
              { id: 'day', icon: LayoutList, label: 'Dzień' },
              { id: 'list', icon: List, label: 'Lista' },
            ].map(v => (
              <button 
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition ${view === v.id ? 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                 <v.icon size={14} /> {v.label}
              </button>
            ))}
         </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-6">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-lg text-gray-800 dark:text-white capitalize">{currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</span>
              <div className="flex gap-1">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ChevronLeft size={16} /></button>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">{['Pon','Wt','Śr','Czw','Pt','Sob','Nd'].map(d => <div key={d} className="py-1">{d.charAt(0)}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, i) => <div key={`e-${i}`} />)}
              {daysArray.map(d => (
                <div key={d} onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))} className={`h-8 w-8 flex items-center justify-center text-sm rounded-full cursor-pointer hover:bg-pink-50 dark:hover:bg-gray-700 ${d === currentDate.getDate() ? 'bg-pink-600 text-white font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                  {d}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-500 uppercase text-xs mb-4 tracking-wider">Twoje Kalendarze</h3>
            <div className="space-y-2">
              {Object.entries(TEAMS).map(([key, cfg]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition select-none">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 rounded cursor-pointer accent-pink-600" 
                    checked={visibleTeams.includes(key)} 
                    onChange={() => setVisibleTeams(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key])} 
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cfg.label}</span>
                </label>
              ))}
            </div>
            <button onClick={() => handleAddClick(new Date().toISOString().split('T')[0])} className="w-full mt-6 py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 hover:shadow-pink-500/50 transition transform hover:-translate-y-0.5">
              <Plus size={18} /> Dodaj
            </button>
          </div>
        </div>

        {/* MAIN CALENDAR CONTENT */}
        <div className="flex-1 bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
          {view === 'list' && renderListView()}
        </div>
      </div>

      {/* Modale */}
      {modals.selectType && (
        <ModalSelectType
          date={modals.selectType.date}
          onClose={() => setModals({...modals, selectType: null})}
          onSelectTask={handleSelectTask}
          onSelectEvent={handleSelectEvent}
        />
      )}

      {modals.selectCategory && (
        <ModalSelectEventCategory
          date={modals.selectCategory.date}
          categories={eventCategories}
          onClose={() => setModals({...modals, selectCategory: null})}
          onSelectCategory={handleSelectCategory}
        />
      )}

      {modals.addEvent && (
        <ModalAddEvent
          initialEvent={modals.addEvent}
          category={modals.addEvent.category}
          onClose={() => setModals({...modals, addEvent: null})}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {modals.addTask && <ModalAddTask initialTask={modals.addTask} onClose={() => setModals({...modals, addTask: null})} onSave={handleSaveTask} onDelete={handleDeleteTask} />}
      {modals.editProgram && <ModalFullProgramEditor eventId={modals.editProgram} onClose={() => setModals({...modals, editProgram: null})} onSave={handleSaveProgram} songs={songs} />}
    </div>
  );
}
