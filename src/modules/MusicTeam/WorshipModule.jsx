import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Trash2, X, FileText, Music, Calendar, ChevronDown, Check, ChevronUp, User, UserX, Link as LinkIcon, Clock, History, Download, ExternalLink, Printer, Minus, Hash, DollarSign } from 'lucide-react';
import SongForm from './SongForm';
import FinanceTab from '../shared/FinanceTab';
import CustomSelect from '../../components/CustomSelect';
import { useUserRole } from '../../hooks/useUserRole';
import { hasTabAccess } from '../../utils/tabPermissions';

const TAGS = [
  "intymna", "modlitewna", "niedzielna", "popularna", "szybko", "uwielbienie", "wolna"
];

// --- ZAAWANSOWANA LOGIKA TRANSPOZYCJI ---

// Baza chromatyczna - domyślny format wyjściowy
const CHORDS_SCALE = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

// Mapa normalizacji wejścia (żeby C# i Db były traktowane tak samo przy wyszukiwaniu)
const NORMALIZE_MAP = {
  "Cb": "B", 
  "Db": "C#", 
  "D#": "Eb", 
  "Fb": "E",
  "E#": "F",
  "Gb": "F#", 
  "G#": "Ab", 
  "A#": "Bb",
  "B#": "C"
};

function getChordIndex(chord) {
  // 1. Usuwamy ewentualne śmieci, zostawiamy samą literę + znak
  let root = chord;
  // 2. Sprawdzamy mapę normalizacji
  if (NORMALIZE_MAP[root]) {
    root = NORMALIZE_MAP[root];
  }
  // 3. Szukamy w skali
  return CHORDS_SCALE.findIndex(c => c === root);
}

function transposeChord(chord, steps) {
  if (!chord) return "";
  
  const idx = getChordIndex(chord);
  if (idx === -1) return chord; // Nie rozpoznano akordu, zwracamy oryginał

  // Matematyka modulo z obsługą ujemnych liczb (dodajemy 120 prewencyjnie)
  const newIdx = (idx + steps + 120) % 12;
  return CHORDS_SCALE[newIdx];
}

function transposeLine(line, steps) {
  if (!line) return "";
  
  // NOWY, LEPSZY REGEX:
  // 1. Grupa (Root): [A-G] opcjonalnie z '#' lub 'b'
  // 2. Grupa (Suffix): Wszystko co NIE jest ukośnikiem '/' ani spacją '\s' (to łapie 'm', '7', '2', 'sus4', 'maj7', 'dim' itd.)
  // 3. Grupa (Bass): Opcjonalnie '/' i [A-G] z opcjonalnym '#' lub 'b'
  const chordRegex = /\b([A-G][#b]?)([^/\s]*)(\/[A-G][#b]?)?\b/g;

  return line.replace(chordRegex, (match, root, suffix, bass) => {
      // Transponujemy korzeń
      const newRoot = transposeChord(root, steps);
      
      // Transponujemy bas (jeśli istnieje)
      let newBass = "";
      if (bass) {
          // bass to np. "/F#" -> ucinamy "/" i transponujemy resztę
          const bassNote = bass.substring(1);
          newBass = "/" + transposeChord(bassNote, steps);
      }

      return newRoot + (suffix || "") + newBass;
  });
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

// --- MODAL SZCZEGÓŁÓW PIEŚNI ---

function SongDetailsModal({ song, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview | history | materials
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [newLink, setNewLink] = useState('');
  
  // Transpozycja
  const [transposeSteps, setTransposeSteps] = useState(0);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  async function fetchHistory() {
    setLoadingHistory(true);
    try {
        const { data: programs } = await supabase.from('programs').select('*').order('date', { ascending: false });
        const songHistory = programs.filter(p => {
            if (!p.songs) return false;
            if (Array.isArray(p.songs)) {
                return p.songs.some(s => s.id === song.id || s.title === song.title);
            }
            return false;
        });
        setHistory(songHistory);
    } catch (e) {
        console.error("Błąd historii", e);
    }
    setLoadingHistory(false);
  }

  const handleAddLink = async () => {
      if(!newLink) return;
      const currentAttachments = song.attachments || [];
      const updated = [...currentAttachments, { type: 'link', url: newLink, name: newLink, date: new Date().toISOString() }];
      await supabase.from('songs').update({ attachments: updated }).eq('id', song.id);
      song.attachments = updated; 
      setNewLink('');
  };

  // FUNKCJA DRUKOWANIA (PDF)
  const handlePrint = () => {
      const transposedChords = song.chords_bars 
        ? transposeLine(song.chords_bars, transposeSteps)
        : "";
      const currentKey = transposeChord(song.key, transposeSteps);

      const printContent = `
        <html>
        <head>
            <title>${song.title} - PDF</title>
            <style>
                body { font-family: sans-serif; padding: 30px; color: #111; }
                h1 { font-size: 24px; margin-bottom: 5px; }
                .meta { font-size: 14px; color: #555; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
                .grid { display: flex; gap: 30px; }
                .col { flex: 1; }
                h3 { font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
                pre { font-family: monospace; white-space: pre-wrap; font-size: 13px; line-height: 1.5; }
                .chords { color: #0044cc; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>${song.title}</h1>
            <div class="meta">
                Autor: ${song.author || '-'} | 
                Tonacja: <strong>${currentKey}</strong> | 
                Tempo: ${song.tempo || '-'} BPM | 
                Metrum: ${song.meter || '-'}
            </div>
            <div class="grid">
                <div class="col">
                    <h3>Tekst</h3>
                    <pre>${song.lyrics || ''}</pre>
                </div>
                <div class="col">
                    <h3>Akordy w taktach</h3>
                    <pre class="chords">${transposedChords}</pre>
                </div>
            </div>
            <script>window.print();</script>
        </body>
        </html>
      `;

      const printWindow = window.open('', '', 'width=900,height=700');
      printWindow.document.write(printContent);
      printWindow.document.close();
  };

  // Obliczamy transponowane wartości do wyświetlenia
  const displayKey = transposeChord(song.key, transposeSteps);
  const displayChords = song.chords_bars 
    ? transposeLine(song.chords_bars, transposeSteps)
    : (song.chords || "Brak układu...");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{song.title}</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                {song.author && <span>{song.author}</span>}
                {song.category && (
                    <>
                        <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                        <span>{song.category}</span>
                    </>
                )}
            </p>
          </div>
          <div className="flex gap-2">
             <button onClick={handlePrint} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-2">
                <Printer size={16}/> PDF
            </button>
            <button onClick={onEdit} className="px-4 py-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl font-bold text-sm hover:bg-pink-100 dark:hover:bg-pink-900/50 transition">
                Edytuj
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
                <X size={24} />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="px-6 pt-6 pb-0">
             <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'overview' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                    <FileText size={16}/> Przegląd
                </button>
                <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                    <History size={16}/> Historia użycia
                </button>
                <button onClick={() => setActiveTab('materials')} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'materials' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                    <LinkIcon size={16}/> Materiały
                </button>
            </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    
                    {/* PŁASKI PASEK: TONACJA | TEMPO | METRUM */}
                    <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                        
                        {/* TONACJA + TRANSPOZYCJA */}
                        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">
                                <Music size={14}/> Tonacja
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setTransposeSteps(s => s - 1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition"><Minus size={12}/></button>
                                <span className="font-mono text-lg font-bold text-pink-600 dark:text-pink-400 min-w-[24px] text-center">{displayKey || "-"}</span>
                                <button onClick={() => setTransposeSteps(s => s + 1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition"><Plus size={12}/></button>
                            </div>
                        </div>

                        {/* TEMPO */}
                        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                             <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">
                                <Clock size={14}/> Tempo
                            </div>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{song.tempo ? `${song.tempo} BPM` : '-'}</span>
                        </div>

                        {/* METRUM */}
                        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                             <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase">
                                <Hash size={14}/> Metrum
                            </div>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{song.meter || '-'}</span>
                        </div>

                         {/* TAGI */}
                         <div className="flex items-center gap-2 ml-auto">
                            {(song.tags || []).map(t => (
                                <span key={t} className="px-3 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs font-bold border border-orange-100 dark:border-orange-800">
                                    #{t}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* TEKST / CHWYTY */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Tekst</h3>
                            <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                                {song.lyrics || "Brak tekstu..."}
                            </pre>
                        </div>
                        <div className="bg-pink-50/50 dark:bg-gray-800 rounded-xl p-5 border border-pink-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Akordy w taktach</h3>
                                {transposeSteps !== 0 && <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900 px-2 py-0.5 rounded">TRANSPONOWANO ({transposeSteps > 0 ? `+${transposeSteps}` : transposeSteps})</span>}
                            </div>
                            <pre className="whitespace-pre-wrap font-mono text-pink-800 dark:text-pink-300 text-sm leading-relaxed">
                                {displayChords}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4">
                    {loadingHistory ? (
                        <div className="text-center py-10 text-gray-400">Ładowanie historii...</div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                            Brak historii użycia tej pieśni w programach.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.map(h => (
                                <div key={h.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-sm transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center text-pink-600 dark:text-pink-300 font-bold text-xs">
                                            {new Date(h.date).getDate()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800 dark:text-gray-200">{new Date(h.date).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Lider: {h.zespol?.lider || 'Nieznany'}</div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold">
                                        Program
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'materials' && (
                <div className="space-y-6">
                     {/* DODAWANIE LINKU */}
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm outline-none focus:border-pink-500 transition"
                            placeholder="Wklej link (YouTube, Drive, Chords)..."
                            value={newLink}
                            onChange={e => setNewLink(e.target.value)}
                        />
                        <button onClick={handleAddLink} className="px-6 py-3 bg-pink-600 text-white rounded-xl font-bold text-sm hover:bg-pink-700 transition">
                            Dodaj Link
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mt-2">Załączniki i Linki</h3>
                        
                        {(!song.attachments || song.attachments.length === 0) && (
                             <div className="text-center py-8 text-gray-400 text-sm italic border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">Brak materiałów</div>
                        )}

                        {(song.attachments || []).map((att, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-300 dark:hover:border-pink-500 transition group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${att.type === 'link' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'}`}>
                                        {att.type === 'link' ? <LinkIcon size={20}/> : <FileText size={20}/>}
                                    </div>
                                    <div className="truncate">
                                        <div className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{att.name || att.url}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(att.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a href={att.url} target="_blank" rel="noreferrer" className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900 hover:text-pink-600 transition" title="Otwórz">
                                        <ExternalLink size={18}/>
                                    </a>
                                </div>
                            </div>
                        ))}

                        {/* Kompatybilność wsteczna dla starych pól */}
                        {song.sheet_music_url && (
                             <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center"><FileText size={20}/></div>
                                    <div><div className="font-bold text-sm text-gray-800 dark:text-gray-200">Nuty / PDF (Legacy)</div></div>
                                </div>
                                <a href={song.sheet_music_url} target="_blank" rel="noreferrer" className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:text-pink-600"><ExternalLink size={18}/></a>
                             </div>
                        )}
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}

// --- GŁÓWNY MODUŁ ---

export default function WorshipModule() {
  const { userRole } = useUserRole();
  const [activeTab, setActiveTab] = useState('schedule');
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

  // Finance data
  const [budgetItems, setBudgetItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    payment_date: '',
    amount: '',
    contractor: '',
    category: 'Grupa Uwielbienia',
    description: '',
    detailed_description: '',
    responsible_person: '',
    documents: [],
    tags: [],
    ministry: 'Grupa Uwielbienia'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'finances') {
      fetchFinanceData();
    }
  }, [activeTab]);

  const fetchFinanceData = async () => {
    const currentYear = new Date().getFullYear();
    const ministryName = 'Grupa Uwielbienia';

    try {
      const { data: budget, error: budgetError } = await supabase
        .from('budget_items')
        .select('*')
        .eq('ministry', ministryName)
        .eq('year', currentYear)
        .order('id', { ascending: true });

      if (budgetError) throw budgetError;
      setBudgetItems(budget || []);

      const { data: exp, error: expError } = await supabase
        .from('expense_transactions')
        .select('*')
        .eq('ministry', ministryName)
        .gte('payment_date', `${currentYear}-01-01`)
        .lte('payment_date', `${currentYear}-12-31`)
        .order('payment_date', { ascending: false });

      if (expError) throw expError;
      setExpenses(exp || []);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    }
  };

  const saveExpense = async () => {
    if (!expenseForm.payment_date || !expenseForm.amount || !expenseForm.contractor || !expenseForm.description || !expenseForm.responsible_person) {
      alert('Wypełnij wymagane pola');
      return;
    }

    try {
      const { error } = await supabase.from('expense_transactions').insert([{
        payment_date: expenseForm.payment_date,
        amount: parseFloat(expenseForm.amount),
        contractor: expenseForm.contractor,
        category: expenseForm.category,
        description: expenseForm.description,
        detailed_description: expenseForm.detailed_description,
        responsible_person: expenseForm.responsible_person,
        documents: expenseForm.documents,
        tags: expenseForm.tags,
        ministry: expenseForm.ministry
      }]);

      if (error) throw error;

      setShowExpenseModal(false);
      const ministryName = expenseForm.ministry;
      setExpenseForm({
        payment_date: '',
        amount: '',
        contractor: '',
        category: ministryName,
        description: '',
        detailed_description: '',
        responsible_person: '',
        documents: [],
        tags: [],
        ministry: ministryName
      });
      fetchFinanceData();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Błąd zapisywania: ' + error.message);
    }
  };

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

      {/* TAB NAVIGATION */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-2 inline-flex gap-2">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-6 py-2.5 rounded-xl font-medium transition text-sm ${
            activeTab === 'schedule'
              ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Calendar size={16} className="inline mr-2" />
          Grafik
        </button>
        <button
          onClick={() => setActiveTab('songs')}
          className={`px-6 py-2.5 rounded-xl font-medium transition text-sm ${
            activeTab === 'songs'
              ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Music size={16} className="inline mr-2" />
          Baza Pieśni
        </button>
        {hasTabAccess('worship', 'members', userRole) && (
          <button
            onClick={() => setActiveTab('members')}
            className={`px-6 py-2.5 rounded-xl font-medium transition text-sm ${
              activeTab === 'members'
                ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <User size={16} className="inline mr-2" />
            Członkowie
          </button>
        )}
        {hasTabAccess('worship', 'finances', userRole) && (
          <button
            onClick={() => setActiveTab('finances')}
            className={`px-6 py-2.5 rounded-xl font-medium transition text-sm ${
              activeTab === 'finances'
                ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <DollarSign size={16} className="inline mr-2" />
            Finanse
          </button>
        )}
      </div>

      {/* SEKCJA 1: GRAFIK ZESPOŁU */}
      {activeTab === 'schedule' && (
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
      )}

      {/* SEKCJA 2: BAZA PIEŚNI */}
      {activeTab === 'songs' && (
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
      )}

      {/* SEKCJA 3: CZŁONKOWIE ZESPOŁU */}
      {activeTab === 'members' && (
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
      )}

      {/* FINANCES TAB */}
      {activeTab === 'finances' && (
        <FinanceTab
          ministry="Grupa Uwielbienia"
          budgetItems={budgetItems}
          expenses={expenses}
          onAddExpense={() => setShowExpenseModal(true)}
          onRefresh={fetchFinanceData}
        />
      )}

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

      {/* MODAL: Add Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl p-6 border border-white/20 dark:border-gray-700">
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                Dodaj wydatek - {expenseForm.ministry}
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-gray-500 dark:text-gray-400">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={expenseForm.payment_date}
                  onChange={(e) => setExpenseForm({...expenseForm, payment_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Kwota (PLN)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <CustomSelect
                  label="Pozycja budżetowa"
                  value={expenseForm.description}
                  onChange={(value) => setExpenseForm({...expenseForm, description: value})}
                  options={[
                    { value: '', label: 'Wybierz pozycję' },
                    ...budgetItems.map(item => ({
                      value: item.description,
                      label: item.description
                    }))
                  ]}
                  placeholder="Wybierz pozycję"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Kontrahent</label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={expenseForm.contractor}
                  onChange={(e) => setExpenseForm({...expenseForm, contractor: e.target.value})}
                  placeholder="Nazwa firmy/osoby"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Szczegółowy opis</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  rows={2}
                  value={expenseForm.detailed_description}
                  onChange={(e) => setExpenseForm({...expenseForm, detailed_description: e.target.value})}
                  placeholder="Dodatkowe informacje..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Osoba odpowiedzialna</label>
                <input
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  value={expenseForm.responsible_person}
                  onChange={(e) => setExpenseForm({...expenseForm, responsible_person: e.target.value})}
                  placeholder="Imię i nazwisko"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowExpenseModal(false)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Anuluj
              </button>
              <button
                onClick={saveExpense}
                className="px-6 py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition"
              >
                Zapisz wydatek
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
