import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Save, FileText, Presentation, Copy, Trash2, Calendar, 
  ChevronDown, GripVertical, Search, X, Check, ChevronUp, 
  History, ArrowUpDown, User, UserX, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { generatePDF } from '../../lib/utils';
import { generatePPT } from '../../lib/ppt';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PROGRAM_ELEMENTS = [
  'WstÄp', 'Uwielbienie', 'Modlitwa', 'Czytanie', 
  'Kazanie', 'Wieczerza', 'Uwielbienie / Kolekta', 
  'OgĹoszenia', 'ZakoĹczenie'
];

const MUSICAL_KEYS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];

// --- HOOKI I NARZÄDZIA (PORTALE) ---

function useDropdownPosition(triggerRef, isOpen) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      };
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen]);

  return coords;
}

// --- CUSTOM COMPONENTS ---

const CustomDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const triggerRef = useRef(null);
  const coords = useDropdownPosition(triggerRef, isOpen);

  useEffect(() => {
    if (value) setViewDate(new Date(value));
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && !e.target.closest('.portal-datepicker')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleDayClick = (day) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const monthName = viewDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const startDay = (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7; // PoniedziaĹek = 0

  return (
    <div className="relative">
      <div 
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-gray-200/50 dark:border-gray-700/50 cursor-pointer hover:border-pink-400 transition min-w-[160px]"
      >
        <Calendar size={16} className="text-pink-600 dark:text-pink-400" />
        <span className="text-gray-700 dark:text-gray-200 font-medium text-sm">
          {value ? new Date(value).toLocaleDateString('pl-PL') : 'Wybierz datÄ'}
        </span>
      </div>

      {isOpen && createPortal(
        <div 
          className="portal-datepicker fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-100 w-[280px]"
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="flex justify-between items-center mb-4">
            <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1))); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><ChevronLeft size={18} className="text-gray-600 dark:text-gray-400"/></button>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize">{monthName}</span>
            <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1))); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><ChevronRight size={18} className="text-gray-600 dark:text-gray-400"/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Pn','Wt','Ĺr','Cz','Pt','So','Nd'].map(d => <div key={d} className="text-[10px] font-bold text-gray-400 uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isSelected = value === dateStr;
              return (
                <button
                  key={day}
                  onClick={(e) => { e.stopPropagation(); handleDayClick(day); }}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition ${isSelected ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const CustomSelect = ({ value, onChange, options, placeholder = "Wybierz...", compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const coords = useDropdownPosition(triggerRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && !e.target.closest('.portal-select')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-full">
      <div 
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center cursor-pointer transition bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50
          ${compact ? 'px-2 py-1 rounded text-xs h-[26px]' : 'px-3 py-2 rounded-lg text-sm min-h-[38px]'}
          ${isOpen ? 'border-pink-500 ring-1 ring-pink-500/20' : 'hover:border-pink-300 dark:hover:border-pink-600'}
        `}
      >
        <span className={`truncate ${value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={compact ? 12 : 16} className="text-gray-400" />
      </div>

      {isOpen && createPortal(
        <div 
          className="portal-select fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100"
          style={{ top: coords.top, left: coords.left, width: coords.width, minWidth: '80px' }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              className={`px-3 py-2 cursor-pointer transition text-sm
                ${value === opt ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
              `}
              onClick={() => { onChange(opt); setIsOpen(false); }}
            >
              {opt}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

const ElementSelector = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const coords = useDropdownPosition(triggerRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && !e.target.closest('.portal-element-selector')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-full">
      <div ref={triggerRef} className="relative">
        <input
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-pink-500/20 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
          placeholder="Wybierz lub wpisz..."
          value={value}
          onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
          onClick={() => setIsOpen(true)}
        />
        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer" onClick={() => setIsOpen(!isOpen)} />
      </div>

      {isOpen && createPortal(
        <div 
          className="portal-element-selector fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              className="px-4 py-2 hover:bg-pink-50 dark:hover:bg-pink-900/20 cursor-pointer text-sm text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-800 last:border-0"
              onClick={() => { onChange(opt); setIsOpen(false); }}
            >
              {opt}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

const MultiSelect = ({ label, options, value, onChange, absentMembers = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const coords = useDropdownPosition(triggerRef, isOpen);
  const selectedItems = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && !e.target.closest('.portal-multiselect')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleSelection = (name, isAbsent) => {
    if (isAbsent) return;
    let newSelection;
    if (selectedItems.includes(name)) newSelection = selectedItems.filter(i => i !== name);
    else newSelection = [...selectedItems, name];
    onChange(newSelection.join(', '));
  };

  return (
    <div className="relative group">
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">{label}</label>
      <div 
        ref={triggerRef}
        className="w-full min-h-[42px] px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus-within:ring-2 focus-within:ring-pink-500/20 cursor-pointer flex flex-wrap gap-2 items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItems.length === 0 ? (
          <span className="text-gray-400 dark:text-gray-500 text-sm">Wybierz osoby...</span>
        ) : (
          selectedItems.map((item, idx) => (
            <span key={idx} className="bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-lg text-xs font-medium border border-pink-200 dark:border-pink-800 flex items-center gap-1">
              {item}
              <span onClick={(e) => { e.stopPropagation(); toggleSelection(item); }} className="hover:bg-pink-200 dark:hover:bg-pink-800 rounded-full p-0.5 cursor-pointer">
                <X size={10} />
              </span>
            </span>
          ))
        )}
        <div className="ml-auto"><ChevronDown size={16} className="text-gray-400" /></div>
      </div>

      {isOpen && createPortal(
        <div 
          className="portal-multiselect fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
          {options.map((person) => {
            const isSelected = selectedItems.includes(person.full_name);
            const isAbsent = absentMembers.includes(person.full_name);
            return (
              <div 
                key={person.id}
                className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between transition 
                  ${isAbsent ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'hover:bg-pink-50 dark:hover:bg-pink-900/20 text-gray-700 dark:text-gray-300'}
                  ${isSelected ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-medium' : ''}
                `}
                onClick={() => toggleSelection(person.full_name, isAbsent)}
              >
                <span className={isAbsent ? 'line-through decoration-gray-400 dark:decoration-gray-600' : ''}>
                  {person.full_name} <span className="text-xs ml-1 opacity-60">({person.role})</span>
                </span>
                {isSelected && !isAbsent && <Check size={16} />}
                {isAbsent && <UserX size={16} className="text-red-300 dark:text-red-400" />}
              </div>
            );
          })}
          {options.length === 0 && <div className="p-3 text-center text-gray-400 dark:text-gray-500 text-xs">Brak czĹonkĂłw w bazie</div>}
        </div>,
        document.body
      )}
    </div>
  );
};

const SongSelector = ({ songs, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef(null);
  const coords = useDropdownPosition(triggerRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && !e.target.closest('.portal-song-selector')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredSongs = songs.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full">
      <div 
        ref={triggerRef}
        className="w-full px-3 py-2 bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800 rounded-lg text-sm text-pink-800 dark:text-pink-300 font-medium flex items-center justify-between cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-900/30 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>+ Wybierz pieĹĹ...</span>
        <ChevronDown size={16} className="text-pink-400" />
      </div>

      {isOpen && createPortal(
        <div 
          className="portal-song-selector fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 flex flex-col overflow-hidden"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <Search size={14} className="text-gray-400" />
              <input 
                autoFocus
                className="bg-transparent outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder-gray-400"
                placeholder="Szukaj..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 max-h-48 custom-scrollbar">
            {filteredSongs.length === 0 ? (
              <div className="p-3 text-xs text-gray-400 text-center">Brak wynikĂłw</div>
            ) : (
              filteredSongs.map(s => (
                <div 
                  key={s.id}
                  className="px-4 py-2 hover:bg-pink-50 dark:hover:bg-pink-900/20 cursor-pointer text-sm text-gray-700 dark:text-gray-300 flex justify-between items-center border-b border-gray-50 dark:border-gray-800 last:border-0"
                  onClick={() => { onSelect(s); setIsOpen(false); setSearch(''); }}
                >
                  <span className="font-medium">{s.title}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">{s.key}</span>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

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

const SortableSongItem = ({ item, idx, songDef, onRemove, onChangeKey }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.internalId });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 999 : 'auto',
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-pink-100 dark:border-pink-900/30 rounded-lg shadow-sm group">
      <div {...attributes} {...listeners} className="cursor-grab text-gray-300 dark:text-gray-600 hover:text-pink-600 dark:hover:text-pink-400 active:cursor-grabbing">
        <GripVertical size={14} />
      </div>

      <div className="flex items-center gap-2 flex-1">
        <span className="text-pink-700 dark:text-pink-400 font-medium text-xs">{idx + 1}.</span>
        <span className="text-gray-700 dark:text-gray-200 text-sm truncate">{songDef.title}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <div className="w-[60px]">
          <CustomSelect 
            compact
            options={MUSICAL_KEYS}
            value={item.key}
            onChange={(val) => onChangeKey(item.internalId, val)}
          />
        </div>
        <button onClick={() => onRemove(item.internalId)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition">
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
      updateSongs(arrayMove(currentSongs, oldIndex, newIndex));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const removeSong = (internalId) => {
    updateSongs(currentSongs.filter(s => s.internalId !== internalId));
  };

  const changeSongKey = (internalId, newKey) => {
    const newSongs = currentSongs.map(s => s.internalId === internalId ? { ...s, key: newKey } : s);
    updateSongs(newSongs);
  };

  return (
    <div ref={setNodeRef} style={style} className="grid grid-cols-12 gap-4 p-3 items-start hover:bg-pink-50/30 dark:hover:bg-pink-900/10 transition duration-150 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="col-span-1 flex items-center justify-center pt-2 cursor-grab text-gray-300 dark:text-gray-600 hover:text-pink-500 dark:hover:text-pink-400 active:cursor-grabbing" {...attributes} {...listeners}>
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
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20 outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600"
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
                const newSong = { internalId: Date.now() + Math.random(), songId: song.id, key: song.key || 'C' };
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
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20 outline-none text-gray-700 dark:text-gray-200"
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
          className="text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition"
        >
          <Trash2 size={18}/>
        </button>
      </div>
    </div>
  );
};

// --- GĹĂWNY KOMPONENT ---

export default function Dashboard() {
  const [programs, setPrograms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('');
  const [program, setProgram] = useState(getEmptyProgram());
  const [songs, setSongs] = useState([]);
  const [worshipTeam, setWorshipTeam] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
      zespol: { lider: '', piano: '', gitara_akustyczna: '', gitara_elektryczna: '', bas: '', wokale: '', cajon: '', notatki: '', absencja: '' }
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
    if (program.id) await supabase.from('programs').update(program).eq('id', program.id);
    else await supabase.from('programs').insert([program]);
    fetchPrograms();
    alert('Zapisano!');
  };

  const handleDelete = async (id) => {
    if (confirm('Na pewno usunÄÄ?')) {
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
    return (p.date || '').toLowerCase().includes(search) || (p.title || '').toLowerCase().includes(search);
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

  const absentList = program.zespol?.absencja ? program.zespol.absencja.split(',').map(s => s.trim()).filter(Boolean) : [];

  const ProgramItem = ({ p }) => (
    <div 
      key={p.id}
      onClick={() => setSelectedId(p.id)}
      className={`p-3 rounded-xl border cursor-pointer transition group relative overflow-hidden mb-2 ${
        selectedId === p.id 
          ? 'bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-700 shadow-md ring-1 ring-pink-100 dark:ring-pink-900' 
          : 'bg-white/40 dark:bg-gray-800/40 border-white/60 dark:border-gray-700/60 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className={`font-bold text-sm mb-0.5 ${selectedId === p.id ? 'text-pink-700 dark:text-pink-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {p.date ? formatDateFull(p.date) : 'Brak daty'}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium bg-gray-100/50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded inline-block">
            {p.schedule?.length || 0} elem.
          </div>
        </div>
      </div>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition duration-200">
        <button onClick={(e) => { e.stopPropagation(); handleDuplicate(p); }} className="p-1 bg-pink-50 dark:bg-pink-900 text-pink-600 dark:text-pink-400 rounded hover:bg-pink-100 dark:hover:bg-pink-800" title="Duplikuj"><Copy size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-1 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50" title="UsuĹ"><Trash2 size={14} /></button>
      </div>
      {selectedId === p.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500 dark:bg-pink-400"></div>}
    </div>
  );

  return (
    <div className="flex h-full bg-gradient-to-br from-pink-50 via-orange-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* LEWA KOLUMNA - LISTA */}
      <div className="w-80 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border-r border-white/40 dark:border-gray-700/40 flex flex-col h-full">
        <div className="p-6 border-b border-white/40 dark:border-gray-700/40">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent mb-4">Lista programĂłw</h2>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input 
                placeholder="Szukaj..." 
                className="w-full px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                value={filter} 
                onChange={e => setFilter(e.target.value)} 
              />
            </div>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition"
              title="Sortuj"
            >
              <ArrowUpDown size={18} />
            </button>
          </div>
          <button onClick={() => setSelectedId(null)} className="w-full bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-500 dark:to-orange-500 text-white py-2 rounded-xl font-bold shadow-lg hover:shadow-pink-500/30 transition transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2"><Plus size={16} /> Nowy Program</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 ml-1">NadchodzÄce</h3>
            {upcomingPrograms.length === 0 ? <div className="text-xs text-gray-400 dark:text-gray-600 italic ml-1">Brak planĂłw</div> : upcomingPrograms.map(p => <ProgramItem key={p.id} p={p} />)}
          </div>
          <div>
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 ml-1 hover:text-pink-600 dark:hover:text-pink-400 transition w-full text-left"><History size={12} /> Historia {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</button>
            {showHistory && <div className="animate-in fade-in slide-in-from-top-2 duration-200">{pastPrograms.map(p => <ProgramItem key={p.id} p={p} />)}</div>}
          </div>
        </div>
      </div>

      {/* PRAWA KOLUMNA - EDYCJA */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* EDYCJA PROGRAMU */}
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700/50 p-8 transition-colors duration-300">
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2">Program NaboĹźeĹstwa</h1>
                <CustomDatePicker value={program.date} onChange={(val) => setProgram({...program, date: val})} />
              </div>
              <div className="flex gap-3">
                <button className="bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 px-4 py-2.5 rounded-xl border border-green-100 dark:border-green-900/30 font-bold hover:bg-green-50 dark:hover:bg-green-900/10 flex items-center gap-2 transition shadow-sm" onClick={handleSave}><Save size={18}/> <span className="hidden md:inline">Zapisz</span></button>
                <div className="h-10 w-px bg-gray-300 dark:bg-gray-700 mx-1 self-center"></div>
                <button onClick={() => { const songsMap = {}; songs.forEach(s => songsMap[s.id] = s); generatePDF(program, songsMap); }} className="bg-gradient-to-r from-pink-600 to-pink-700 dark:from-pink-500 dark:to-pink-600 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg transition"><FileText size={18}/> <span className="hidden md:inline">PDF</span></button>
                <button onClick={() => { const songsMap = {}; songs.forEach(s => songsMap[s.id] = s); generatePPT(program, songsMap); }} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg transition"><Presentation size={18}/> <span className="hidden md:inline">PPT</span></button>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 dark:border-gray-700/50 p-6 mb-8 min-h-[500px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200 flex items-center gap-2"><div className="w-1.5 h-6 bg-pink-600 dark:bg-pink-500 rounded-full"></div>Plan szczegĂłĹowy</h3>
                <button onClick={() => setProgram({...program, schedule: [...program.schedule, { id: Date.now(), element: '', person: '', details: '', songIds: [], selectedSongs: [] }]})} className="bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-500 dark:to-orange-500 text-white text-sm px-4 py-2 rounded-xl font-bold hover:shadow-lg transition">+ Dodaj Element</button>
              </div>
              <div className="bg-white/50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-inner overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="col-span-1"></div><div className="col-span-3">Element</div><div className="col-span-3">Osoba</div><div className="col-span-4">SzczegĂłĹy / Notatki</div><div className="col-span-1"></div></div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={program.schedule.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div>{program.schedule.map((row, idx) => <SortableRow key={row.id} row={row} index={idx} program={program} setProgram={setProgram} songs={songs} />)}</div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 dark:border-gray-700/50 p-6 mb-6 hover:shadow-xl transition relative z-50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg bg-gradient-to-r from-pink-700 to-orange-700 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">ZespĂłĹ Uwielbienia</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[{ key: 'lider', label: 'Lider Uwielbienia' }, { key: 'piano', label: 'Piano' }, { key: 'gitara_akustyczna', label: 'Gitara Akustyczna' }, { key: 'gitara_elektryczna', label: 'Gitara Elektryczna' }, { key: 'bas', label: 'Gitara Basowa' }, { key: 'wokale', label: 'Wokale' }, { key: 'cajon', label: 'Cajon / Perkusja' }].map(field => (
                  <MultiSelect 
                    key={field.key} 
                    label={field.label} 
                    options={worshipTeam} 
                    value={program.zespol?.[field.key] || ''} 
                    onChange={(newValue) => setProgram(prev => ({ ...prev, zespol: { ...prev.zespol, [field.key]: newValue } }))} 
                    absentMembers={absentList} 
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-0">
              <SectionCard title="Atmosfera Team" dataKey="atmosfera_team" program={program} setProgram={setProgram} fields={[{ key: 'przygotowanie', label: 'Przygotowanie:' }, { key: 'witanie', label: 'Witanie:' }]} />
              <SectionCard title="Produkcja" dataKey="produkcja" program={program} setProgram={setProgram} fields={[{ key: 'naglosnienie', label: 'NagĹoĹnienie:' }, { key: 'propresenter', label: 'ProPresenter:' }, { key: 'social', label: 'Social Media:' }, { key: 'host', label: 'Host wydarzenia:' }]} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-0">
              <SectionCard title="Scena" dataKey="scena" program={program} setProgram={setProgram} fields={[{ key: 'prowadzenie', label: 'Prowadzenie:' }, { key: 'modlitwa', label: 'Modlitwa:' }, { key: 'kazanie', label: 'Kazanie:' }, { key: 'wieczerza', label: 'Wieczerza:' }, { key: 'ogloszenia', label: 'OgĹoszenia:' }]} />
              <SectionCard title="SzkĂłĹka Niedzielna" dataKey="szkolka" program={program} setProgram={setProgram} fields={[{ key: 'mlodsza', label: 'Grupa MĹodsza:' }, { key: 'srednia', label: 'Grupa Ĺrednia:' }, { key: 'starsza', label: 'Grupa Starsza:' }]} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}