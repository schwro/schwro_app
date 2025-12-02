import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Trash2, X, FileText, Music, Calendar, ChevronDown, Check, ChevronUp, User, UserX } from 'lucide-react';
import SongForm from './SongForm';

const TAGS = [
  "intymna", "modlitewna", "niedzielna", "popularna", "szybko", "uwielbienie", "wolna"
];

// --- NAPRAWIONA LOGIKA TRANSPONOWANIA (Wersja 3.0) ---

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLATS = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#", "Cb": "B" };
const SHARPS = { "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb" };

const getNoteVal = (note) => {
  const n = FLATS[note] || note;
  return NOTES.indexOf(n);
};

const getNoteName = (val, useFlats = false) => {
  const note = NOTES[(val + 1200) % 12]; // +1200 zapewnia wynik dodatni
  if (useFlats && SHARPS[note]) return SHARPS[note];
  return note;
};

function transposeLine(line, steps) {
  if (steps === 0) return line;

  // Ulepszony Regex:
  // \b([A-G][#b]?) -> Grupa 1: Root (np. C, F#) na początku słowa
  // ([^\s\/\|]*)   -> Grupa 2: Suffix (wszystko co nie jest spacją, slashem ani kreską taktu |)
  // (\/[A-G][#b]?)? -> Grupa 3: Opcjonalny Bas (slash + nuta)
  // Flaga 'g' -> znajdź wszystkie wystąpienia w linii
  
  return line.replace(/\b([A-G][#b]?)([^\s\/\|]*)(\/[A-G][#b]?)?/g, (match, root, suffix, bassFull) => {
    
    // 1. Przetwarzanie Root
    const rootVal = getNoteVal(root);
    if (rootVal === -1) return match; // To nie akord (np. słowo zaczynające się dużą literą, które nie pasuje do schematu)

    // Heurystyka: użyj bemoli jeśli oryginał ma bemole LUB idziemy w dół (i nie jest to C/F/G itp)
    const useFlats = root.includes('b') || (steps < 0 && !root.includes('#'));
    const newRoot = getNoteName(rootVal + steps, useFlats);

    // 2. Przetwarzanie Basu (jeśli istnieje)
    let newBass = "";
    if (bassFull) {
      const bassNote = bassFull.substring(1); // utnij slash /
      const bassVal = getNoteVal(bassNote);
      if (bassVal !== -1) {
        newBass = "/" + getNoteName(bassVal + steps, useFlats);
      } else {
        newBass = bassFull; // Jeśli nie rozpoznano basu, zostaw oryginał
      }
    }

    return newRoot + suffix + newBass;
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
        className="w-full min-h-[32px] px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs cursor-pointer flex flex-wrap gap-1 items-center hover:border-pink-300 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItems.length === 0 ? (
          <span className="text-gray-400 text-[10px] italic">Wybierz...</span>
        ) : (
          selectedItems.map((item, idx) => (
            <span key={idx} className="bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded text-[10px] border border-pink-100 whitespace-nowrap">
              {item}
            </span>
          ))
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[9999] left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((person) => {
            const isSelected = selectedItems.includes(person.full_name);
            const isAbsent = absentMembers.includes(person.full_name);

            return (
              <div 
                key={person.id}
                className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between transition 
                  ${isAbsent ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:bg-pink-50 text-gray-700'}
                  ${isSelected ? 'bg-pink-50 text-pink-700 font-medium' : ''}
                `}
                onClick={() => toggleSelection(person.full_name, isAbsent)}
              >
                <span className={isAbsent ? 'line-through decoration-gray-400' : ''}>
                  {person.full_name}
                </span>
                {isSelected && !isAbsent && <Check size={12} />}
                {isAbsent && <UserX size={12} className="text-red-300" />}
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
        className="w-full min-h-[32px] px-2 py-1 bg-white border border-red-200 rounded-lg text-xs cursor-pointer flex flex-wrap gap-1 items-center hover:border-red-300 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItems.length === 0 ? (
          <span className="text-gray-400 text-[10px] italic">Wybierz...</span>
        ) : (
          selectedItems.map((item, idx) => (
            <span key={idx} className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] border border-red-100 whitespace-nowrap flex items-center gap-1">
              {item}
            </span>
          ))
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[9999] left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((person) => {
            const isSelected = selectedItems.includes(person.full_name);
            return (
              <div 
                key={person.id}
                className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between hover:bg-red-50 transition ${isSelected ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700'}`}
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
            className={`bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm relative z-0 transition-all duration-300 ${isExpanded ? 'mb-8' : 'mb-0'}`}
          >
            <button 
              onClick={() => toggleMonth(monthKey)}
              className={`w-full px-6 py-4 bg-white/50 hover:bg-white/80 flex justify-between items-center transition border-b border-gray-100 ${isExpanded ? 'rounded-t-2xl' : 'rounded-2xl'}`}
            >
              <span className="font-bold text-gray-800 text-sm uppercase tracking-wider">{formatMonthName(monthKey)}</span>
              {isExpanded ? <ChevronUp size={18} className="text-gray-500"/> : <ChevronDown size={18} className="text-gray-500"/>}
            </button>
            
            {isExpanded && (
              <div className="overflow-visible pb-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase">
                      <th className="p-3 font-semibold w-24 min-w-[90px]">Data</th>
                      {columns.map(col => (
                        <th key={col.key} className="p-3 font-semibold min-w-[130px]">{col.label}</th>
                      ))}
                      <th className="p-3 font-semibold min-w-[130px] text-red-500">Absencja</th>
                      <th className="p-3 font-semibold min-w-[150px]">Notatki</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100 relative">
                    {groupedPrograms[monthKey]
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((prog, idx) => {
                        const absentList = prog.zespol?.absencja 
                          ? prog.zespol.absencja.split(',').map(s => s.trim()).filter(Boolean) 
                          : [];

                        return (
                          <tr key={prog.id} className="hover:bg-white/60 transition relative">
                            <td className="p-3 font-medium text-gray-700 font-mono text-xs">
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
                                className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-pink-500 text-xs p-1 outline-none transition placeholder-gray-300"
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

// --- GŁÓWNY KOMPONENT MODAL DETALI ---

function SongDetailsModal({ song, onClose, onEdit }) {
  const [transpose, setTranspose] = useState(0);
  
  const originalKey = song.key || "C";
  const originalKeyVal = getNoteVal(originalKey);
  
  let displayKey = originalKey;
  if (originalKeyVal !== -1) {
    displayKey = getNoteName(originalKeyVal + transpose, originalKey.includes('b'));
  }

  const transposedChordsBars = song.chords_bars
    ? song.chords_bars.split("\n").map(line => transposeLine(line, transpose)).join("\n")
    : "";

  const lyricsWithChords = song.lyrics_chords 
    ? song.lyrics_chords.split("\n").map(line => transposeLine(line, transpose)).join("\n")
    : transposedChordsBars;

  const usageHistory = [
    { date: "2025-10-20", desc: "Nabożeństwo 20 października 2025" },
    { date: "2025-10-13", desc: "Nabożeństwo 13 października 2025" },
  ];

  const generatePDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFont('helvetica');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const colWidth = (pageWidth - margin * 3) / 2;
      let yPos = margin;

      // HEADER
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setFillColor(147, 51, 234);
      doc.circle(pageWidth, 10, 20, 'F');
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(song.title || 'Bez tytułu', margin, 18);
      doc.setTextColor(0, 0, 0);
      yPos = 35;

      // META
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setFillColor(229, 231, 235);
      doc.rect(margin, yPos - 4, pageWidth - margin * 2, 12, 'F');
      doc.setFont('helvetica', 'bold');
      const metaText = `Tonacja: ${displayKey} (oryginalna: ${originalKey}) | Tempo: ${song.tempo ? song.tempo + ' BPM' : '–'} | Metrum: ${song.meter || '–'}`;
      doc.text(metaText, margin + 3, yPos + 2);
      yPos += 18;

      // KOLUMNY
      const leftColX = margin;
      const rightColX = margin + colWidth + margin;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(219, 234, 254);
      doc.rect(leftColX, yPos - 3, colWidth - 1, 7, 'F');
      doc.rect(rightColX, yPos - 3, colWidth - 1, 7, 'F');
      doc.setTextColor(30, 58, 138);
      doc.text('TREŚĆ', leftColX + 2, yPos + 1);
      doc.text('AKORDY W TAKTACH', rightColX + 2, yPos + 1);
      doc.setTextColor(0, 0, 0);
      yPos += 8;

      const lyricsLines = (song.lyrics || '(brak tekstu)').split('\n');
      const chordLines = (transposedChordsBars || '(brak akordów)').split('\n');
      const maxLines = Math.max(lyricsLines.length, chordLines.length);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      for (let i = 0; i < maxLines; i++) {
        if (yPos > pageHeight - margin - 5) {
          doc.addPage();
          yPos = margin;
        }
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(leftColX, yPos - 2, colWidth - 1, 4.5, 'F');
          doc.rect(rightColX, yPos - 2, colWidth - 1, 4.5, 'F');
        }
        const lyricLine = lyricsLines[i] || '';
        const chordLine = chordLines[i] || '';
        doc.setTextColor(60, 60, 60);
        doc.text(lyricLine, leftColX + 1, yPos, { maxWidth: colWidth - 3 });
        doc.setTextColor(37, 99, 235);
        doc.setFont('helvetica', 'bold');
        doc.text(chordLine, rightColX + 1, yPos, { maxWidth: colWidth - 3 });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        yPos += 4.5;
      }
      doc.save(`${song.title || 'piesn'}.pdf`);
    }).catch(err => {
      console.error('Błąd ładowania jsPDF:', err);
      alert('Nie udało się wygenerować PDF');
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl max-w-5xl w-full rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-white/20 max-h-[90vh]">
        
        <div className="flex justify-between items-center py-6 px-10 border-b border-gray-200/50 bg-gradient-to-r from-pink-50/80 to-orange-50/80">
          <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
            {song.title}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-xl transition">
            <X size={28} className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Kategoria</div>
              <div className="text-lg font-bold text-gray-800">{song.category || "–"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Tagi</div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(song.tags) && song.tags.length > 0 ? (
                  song.tags.map((t, i) => (
                    <span key={i} className="bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700 px-3 py-1 rounded-full text-xs font-medium border border-pink-200/50">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">brak tagów</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-50/50 to-orange-50/50 border border-pink-200/30 rounded-2xl p-5">
            <div className="text-xs font-semibold text-gray-500 mb-2">Tonacja</div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                {displayKey}
              </span>
              <button
                onClick={() => setTranspose(transpose - 1)}
                className="px-4 py-2 rounded-xl border border-gray-300/50 bg-white/70 text-pink-700 font-bold hover:bg-gradient-to-r hover:from-pink-500 hover:to-orange-500 hover:text-white transition"
              >
                ▼ Niżej
              </button>
              <button
                onClick={() => setTranspose(transpose + 1)}
                className="px-4 py-2 rounded-xl border border-gray-300/50 bg-white/70 text-pink-700 font-bold hover:bg-gradient-to-r hover:from-pink-500 hover:to-orange-500 hover:text-white transition"
              >
                ▲ Wyżej
              </button>
              <button
                onClick={() => setTranspose(0)}
                className="px-4 py-2 rounded-xl border border-gray-300/50 bg-white/50 text-gray-600 hover:bg-gray-100/80 transition text-sm"
              >
                Reset
              </button>
              <span className="ml-2 text-xs text-gray-500">
                (Oryginalna: <b>{originalKey}</b>)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Tempo</div>
              <div className="text-lg font-bold text-gray-800">
                {song.tempo ? `${song.tempo} BPM` : "–"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1">Metrum</div>
              <div className="text-lg font-bold text-gray-800">{song.meter || "–"}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-bold text-pink-700 mb-2 flex items-center gap-2">
                <FileText size={18} />
                Tekst pieśni
              </div>
              <pre className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 text-sm font-mono text-gray-900 max-h-64 overflow-y-auto">
                {song.lyrics || "(brak tekstu)"}
              </pre>
            </div>
            <div>
              <div className="font-bold text-orange-700 mb-2 flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Music size={18} />
                  Akordy w taktach
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(transposedChordsBars)}
                  className="text-xs text-gray-500 hover:text-pink-600 underline"
                >
                  Kopiuj
                </button>
              </div>
              <pre className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 text-sm font-mono text-gray-900 max-h-64 overflow-y-auto">
                {transposedChordsBars || "(brak akordów)"}
              </pre>
            </div>
          </div>

          <div>
            <div className="font-bold text-pink-700 mb-2 flex items-center gap-2">
              <Music size={18} />
              Tekst z akordami (pełna wersja)
            </div>
            <pre className="bg-gradient-to-br from-pink-50/50 to-orange-50/50 backdrop-blur-sm border border-pink-200/30 rounded-xl p-5 text-sm font-mono text-gray-900 max-h-80 overflow-y-auto">
              {lyricsWithChords || "(brak)"}
            </pre>
          </div>

          <div>
            <div className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FileText size={20} />
              Załączniki
            </div>
            {Array.isArray(song.attachments) && song.attachments.length > 0 ? (
              song.attachments.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 mb-2 hover:bg-white/90 transition"
                >
                  {file.name?.endsWith(".mp3") ? (
                    <Music size={20} className="text-pink-600" />
                  ) : (
                    <FileText size={20} className="text-orange-600" />
                  )}
                  <span className="font-semibold flex-1">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {file.size
                      ? file.size > 1024 * 1024
                        ? (file.size / 1024 / 1024).toFixed(1) + " MB"
                        : (file.size / 1024).toFixed(0) + " KB"
                      : ""}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">Brak załączników</div>
            )}
          </div>

          <div>
            <div className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Music size={20} />
              Nuty / Nagrania
            </div>
            {song.sheet_music_url ? (
              <a
                href={song.sheet_music_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700 rounded-xl border border-pink-200/50 hover:from-pink-200 hover:to-orange-200 transition font-semibold"
              >
                Zobacz nuty / nagranie ↗
              </a>
            ) : (
              <div className="text-gray-500 text-sm">Brak linku</div>
            )}
          </div>

          <div className="bg-gradient-to-r from-pink-50/80 to-orange-50/80 backdrop-blur-sm border border-pink-200/30 rounded-2xl p-6">
            <div className="font-bold text-pink-700 mb-3 flex items-center gap-2">
              <Calendar size={20} />
              Historia wykorzystania ({usageHistory.length}x)
            </div>
            <div className="text-gray-600 text-sm mb-3">
              Ostatnio użyto: poniedziałek, 20 października 2025
            </div>
            {usageHistory.map((row, idx) => (
              <div
                key={idx}
                className="bg-white/70 backdrop-blur-sm border border-gray-200/30 py-3 px-4 rounded-xl mb-2"
              >
                <b>
                  {new Date(row.date).toLocaleDateString("pl-PL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </b>
                {" – "}
                {row.desc}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 p-6 border-t border-gray-200/50 bg-gradient-to-r from-pink-50/30 to-orange-50/30">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 font-medium rounded-xl hover:bg-white transition"
          >
            Zamknij
          </button>
          <button 
            onClick={generatePDF}
            className="px-7 py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition"
          >
            Generuj PDF
          </button>
          <button
            onClick={onEdit}
            className="px-7 py-3 bg-gradient-to-r from-orange-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition"
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Grupa Uwielbienia</h1>
      </div>

      {/* SEKCJA 1: GRAFIK ZESPOŁU */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 relative z-[50]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Grafik Zespołu</h2>
        </div>
        <ScheduleTable 
          programs={programs} 
          worshipTeam={team}
          onUpdateProgram={handleProgramUpdate}
        />
      </section>

      {/* SEKCJA 2: BAZA PIEŚNI */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 relative z-[40]">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Baza Pieśni</h2>
          <button onClick={() => { setSongForm({}); setShowSongModal(true); }} className="bg-gradient-to-r from-orange-600 to-pink-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/50 transition flex items-center gap-2"><Plus size={18}/> Dodaj pieśń</button>
        </div>
        
        <div className="bg-white/50 backdrop-blur-sm p-4 mb-4 rounded-2xl border border-gray-200/50 flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2">
            <Search className="text-gray-400" size={20} />
            <input className="w-full outline-none text-sm bg-transparent" placeholder="Szukaj pieśni..." value={songFilter} onChange={e => setSongFilter(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <input className="px-4 py-2 border border-gray-200/50 rounded-xl text-sm bg-white/50 backdrop-blur-sm" placeholder="Szukaj po tagach..." value={tagFilter} onChange={e => setTagFilter(e.target.value)} />
            {TAGS.map(tag => tagFilter !== tag && (
              <button key={tag} onClick={() => setTagFilter(tag)} className="bg-gradient-to-r from-pink-50 to-orange-50 px-3 py-1.5 rounded-xl text-xs text-pink-800 border border-pink-200/50 hover:from-pink-100 hover:to-orange-100 transition font-medium">{tag}</button>
            ))}
            {tagFilter && <button onClick={() => setTagFilter('')} className="ml-2 text-sm text-gray-500 hover:text-gray-700 transition">Wyczyść</button>}
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-x-auto">
          <table className="w-full text-left text-sm align-middle">
            <thead className="bg-gradient-to-r from-pink-50/80 to-orange-50/80 text-gray-700 font-bold border-b border-gray-200/50">
              <tr>
                <th className="p-4">Tytuł</th>
                <th className="p-4">Kategoria</th>
                <th className="p-4">Tonacja</th>
                <th className="p-4">Tempo</th>
                <th className="p-4">Tagi</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {filteredSongs.map(s => (
                <tr key={s.id} className="hover:bg-pink-50/30 transition">
                  <td className="p-4 font-bold">{s.title}</td>
                  <td className="p-4">{s.category}</td>
                  <td className="p-4 font-mono font-bold text-pink-600">{s.key}</td>
                  <td className="p-4">{s.tempo || "-"}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {Array.isArray(s.tags) && s.tags.length > 0 ? s.tags.map((t, i) => (
                        <span key={i} className="bg-gradient-to-r from-pink-100 to-orange-100 px-2 py-1 text-xs rounded-full text-pink-800 border border-pink-200/50 font-medium">{t}</span>
                      )) : <span className="text-gray-400 text-xs">-</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => setShowSongDetails(s)} className="text-gray-800 font-semibold px-3 py-1.5 rounded-xl hover:bg-white/50 transition">Szczegóły</button>
                    <button onClick={() => { setSongForm(s); setShowSongModal(true); }} className="text-pink-600 hover:text-orange-600 font-medium transition">Edytuj</button>
                    <button onClick={() => deleteSong(s.id)} className="text-red-500 hover:text-red-700 font-medium transition">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SEKCJA 3: CZŁONKOWIE ZESPOŁU */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 relative z-[30]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Członkowie Zespołu</h2>
          <button onClick={() => { setMemberForm({ id: null, full_name: '', role: '', status: 'Aktywny', phone: '', email: '' }); setShowMemberModal(true); }} className="bg-gradient-to-r from-pink-600 to-orange-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-500/50 transition flex items-center gap-2"><Plus size={18}/> Dodaj członka</button>
        </div>
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-pink-50/80 to-orange-50/80 text-gray-700 font-bold border-b border-gray-200/50">
              <tr>
                <th className="p-4">Imię i nazwisko</th>
                <th className="p-4">Instrument/Rola</th>
                <th className="p-4">Status</th>
                <th className="p-4">Telefon</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {team.map(m => (
                <tr key={m.id} className="hover:bg-pink-50/30 transition">
                  <td className="p-4 font-medium">{m.full_name}</td>
                  <td className="p-4">{m.role}</td>
                  <td className="p-4"><span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-200/50">{m.status}</span></td>
                  <td className="p-4">{m.phone}</td>
                  <td className="p-4">{m.email}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setMemberForm(m); setShowMemberModal(true); }} className="text-pink-600 hover:text-orange-600 font-medium transition">Edytuj</button>
                    <button onClick={() => deleteMember(m.id)} className="text-red-500 hover:text-red-700 font-medium transition">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20">
             <div className="flex justify-between mb-6"><h3 className="font-bold text-xl bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Członek Zespołu</h3><button onClick={() => setShowMemberModal(false)} className="p-2 hover:bg-gray-100/50 rounded-xl transition"><X size={20}/></button></div>
            <div className="space-y-4">
              <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" placeholder="Imię i nazwisko" value={memberForm.full_name} onChange={e => setMemberForm({...memberForm, full_name: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" placeholder="Rola (np. Wokal)" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" placeholder="Telefon" value={memberForm.phone} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" placeholder="Email" value={memberForm.email} onChange={e => setMemberForm({...memberForm, email: e.target.value})} />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowMemberModal(false)} className="px-5 py-2.5 border border-gray-200/50 rounded-xl bg-white/50 hover:bg-white transition">Anuluj</button>
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
