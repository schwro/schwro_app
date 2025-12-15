import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, PlusCircle, Music, Hash, Check, Upload, FileText, Link as LinkIcon, Trash2, Edit3, Type, AlignJustify, Minus, Plus, CornerDownLeft, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Strikethrough, Superscript, Subscript, Palette, Keyboard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CustomSelect from '../../components/CustomSelect';

// --- STAŁE DANYCH ---
const KEYS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// Mapowanie stopni na akordy dla każdej tonacji (poprawny zapis enharmoniczny)
// Format: { tonacja: [I, II, III, IV, V, VI, VII] }
const SCALE_DEGREES = {
  'C':  ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'C#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
  'Db': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
  'D':  ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  'Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
  'E':  ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
  'F':  ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
  'Gb': ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
  'G':  ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
  'Ab': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
  'A':  ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
  'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
  'B':  ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
};

// Etykiety stopni (rzymskie)
const DEGREE_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Typowe akordy dla stopni w durze (domyślne typy)
// I=dur, II=moll, III=moll, IV=dur, V=dur, VI=moll, VII=zmniejszony
const DEFAULT_CHORD_TYPES = ['', 'm', 'm', '', '', 'm', 'dim'];

// Stała komórka HTML (80px) - używana w szablonach
const SPACER_CELL = '<span class="chord-spacer" contenteditable="true" style="display: inline-block; min-width: 80px; text-align: center;">\u00A0</span>';

// Szablony sekcji muzycznych z komórkami o stałej szerokości
const MUSIC_SECTIONS = [
  { label: 'Intro', template: `<br>[INTRO]<br>|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|<br>` },
  { label: 'Zwrotka', template: `<br>[ZWROTKA]<br>|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|<br>` },
  { label: 'Refren', template: `<br>[REFREN]<br>|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|<br>` },
  { label: 'Bridge', template: `<br>[BRIDGE]<br>|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|<br>` },
  { label: 'Solo', template: `<br>[SOLO]<br>|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|<br>` },
  { label: 'Outro', template: `<br>[OUTRO]<br>|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|<br>` },
  { label: 'Pusty Takt', template: `|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|${SPACER_CELL}|` },
];

// Kolory do wyboru dla czcionki
const FONT_COLORS = [
  { label: 'Czarny', value: '#000000' },
  { label: 'Biały', value: '#ffffff' },
  { label: 'Szary', value: '#6b7280' },
  { label: 'Czerwony', value: '#ef4444' },
  { label: 'Pomarańczowy', value: '#f97316' },
  { label: 'Żółty', value: '#eab308' },
  { label: 'Zielony', value: '#22c55e' },
  { label: 'Niebieski', value: '#3b82f6' },
  { label: 'Fioletowy', value: '#8b5cf6' },
  { label: 'Różowy', value: '#ec4899' },
];

// --- KOMPONENTY POMOCNICZE ---

const TagMultiSelect = ({ label, options, value = [], onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTag = (tag) => {
    const newValue = value.includes(tag)
      ? value.filter(t => t !== tag)
      : [...value, tag];
    onChange(newValue);
  };

  const addCustomTag = () => {
    const trimmedTag = customTag.trim().toLowerCase();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
      setCustomTag('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">{label}</label>}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer min-h-[50px] flex flex-wrap gap-2 hover:border-pink-400 dark:hover:border-pink-500 transition"
      >
        {value.length === 0 && <span className="text-gray-400 dark:text-gray-500 pt-0.5">Wybierz tagi...</span>}
        {value.map(tag => (
          <span key={tag} className="bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-orange-100 dark:border-orange-800">
            {tag}
            <div
              onMouseDown={(e) => { e.stopPropagation(); toggleTag(tag); }}
              className="cursor-pointer hover:text-orange-900 dark:hover:text-white"
            >
              <X size={12} />
            </div>
          </span>
        ))}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                placeholder="Dodaj własny tag..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-pink-500"
              />
              <button
                onClick={(e) => { e.stopPropagation(); addCustomTag(); }}
                className="px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm font-bold"
              >
                <PlusCircle size={16} />
              </button>
            </div>
          </div>
          {options.map((tag) => {
            const isSelected = value.includes(tag);
            return (
              <div
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition
                  ${isSelected ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
                `}
              >
                {tag}
                {isSelected && <Check size={14} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- GŁÓWNY FORMULARZ ---

export default function SongForm({ initialData, onSave, onCancel, allTags = [] }) {
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    author: '',
    category: '',
    key: '',
    tempo: '',
    meter: '',
    tags: [],
    lyrics: '',
    chords_bars: '',
    sheet_music_url: '',
    attachments: []
  });

  const [activeTab, setActiveTab] = useState('basic'); // basic | lyrics | attachments
  const [availableTags, setAvailableTags] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [newLinkDescription, setNewLinkDescription] = useState('');
  const [editingAttachmentIdx, setEditingAttachmentIdx] = useState(null);
  const [editingDescription, setEditingDescription] = useState('');
  const chordsTextareaRef = useRef(null);

  // Ustawienia edytora akordów
  const [chordsLineHeight, setChordsLineHeight] = useState(1.8);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [editorKey, setEditorKey] = useState(''); // Tonacja wybrana w edytorze (domyślnie z formData.key)
  const colorPickerRef = useRef(null);

  // Historia dla undo/redo
  const [chordsHistory, setChordsHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);
  const shouldUpdateDOMRef = useRef(true); // Flaga do kontrolowania aktualizacji DOM

  // Używaj tylko tagów z bazy (przekazanych przez props)
  useEffect(() => {
    setAvailableTags([...allTags].sort());
  }, [allTags]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        tags: initialData.tags || [],
        title: initialData.title || '',
        author: initialData.author || '',
        category: initialData.category || '',
        key: initialData.key || '',
        tempo: initialData.tempo || '',
        meter: initialData.meter || '',
        lyrics: initialData.lyrics || '',
        chords_bars: initialData.chords_bars || ''
      });
      // Ustaw tonację edytora na tonację pieśni
      if (initialData.key) {
        setEditorKey(initialData.key);
      }
      // Aktualizuj DOM edytora przy zmianie initialData
      shouldUpdateDOMRef.current = true;
    }
  }, [initialData]);

  // Synchronizuj editorKey gdy zmieni się formData.key
  useEffect(() => {
    if (formData.key && !editorKey) {
      setEditorKey(formData.key);
    }
  }, [formData.key, editorKey]);

  const handleSubmit = () => {
    if (!formData.title) return alert("Podaj tytuł pieśni");
    onSave(formData);
  };

  // Funkcje do obsługi załączników
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingFile(true);
    try {
      const uploadedDocs = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `song_attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('public-assets').getPublicUrl(filePath);

        uploadedDocs.push({
          type: 'file',
          name: file.name,
          url: data.publicUrl,
          description: '',
          date: new Date().toISOString()
        });
      }

      setFormData({
        ...formData,
        attachments: [...(formData.attachments || []), ...uploadedDocs]
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Błąd przesyłania pliku: ' + error.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddLink = () => {
    if (!newLink) return;

    const newAttachment = {
      type: 'link',
      name: newLinkDescription || newLink,
      url: newLink,
      description: newLinkDescription,
      date: new Date().toISOString()
    };

    setFormData({
      ...formData,
      attachments: [...(formData.attachments || []), newAttachment]
    });

    setNewLink('');
    setNewLinkDescription('');
  };

  const removeAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: (formData.attachments || []).filter((_, i) => i !== index)
    });
  };

  const updateAttachmentDescription = (index, newDescription) => {
    const updatedAttachments = [...(formData.attachments || [])];
    updatedAttachments[index] = {
      ...updatedAttachments[index],
      description: newDescription,
      name: newDescription || updatedAttachments[index].url
    };
    setFormData({ ...formData, attachments: updatedAttachments });
    setEditingAttachmentIdx(null);
    setEditingDescription('');
  };

  const startEditingDescription = (index) => {
    setEditingAttachmentIdx(index);
    setEditingDescription(formData.attachments[index]?.description || '');
  };

  // Funkcja zapisująca stan do historii
  const saveToHistory = (newText) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    const newHistory = chordsHistory.slice(0, historyIndex + 1);
    newHistory.push(newText);
    // Limit historii do 50 elementów
    if (newHistory.length > 50) newHistory.shift();
    setChordsHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Funkcja undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      shouldUpdateDOMRef.current = true; // Wymuszamy aktualizację DOM przy undo
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setFormData({ ...formData, chords_bars: chordsHistory[prevIndex] });
    }
  };

  // Funkcja redo
  const handleRedo = () => {
    if (historyIndex < chordsHistory.length - 1) {
      isUndoRedoRef.current = true;
      shouldUpdateDOMRef.current = true; // Wymuszamy aktualizację DOM przy redo
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setFormData({ ...formData, chords_bars: chordsHistory[nextIndex] });
    }
  };

  // Funkcja formatująca zaznaczony tekst (WYSIWYG)
  const execFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    // Aktualizuj stan po formatowaniu
    setTimeout(() => {
      if (chordsTextareaRef.current) {
        const newContent = chordsTextareaRef.current.innerHTML;
        setFormData({ ...formData, chords_bars: newContent });
        saveToHistory(newContent);
      }
    }, 0);
  };

  // Funkcja wstawiania tekstu w miejscu kursora (dla contentEditable)
  const insertTextAtCursor = (text) => {
    const editor = chordsTextareaRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand('insertText', false, text);
    setTimeout(() => {
      const newContent = editor.innerHTML;
      setFormData({ ...formData, chords_bars: newContent });
      saveToHistory(newContent);
    }, 0);
  };

  // Funkcja wstawiania HTML w miejscu kursora
  const insertHtmlAtCursor = (html) => {
    const editor = chordsTextareaRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand('insertHTML', false, html);
    setTimeout(() => {
      const newContent = editor.innerHTML;
      setFormData({ ...formData, chords_bars: newContent });
      saveToHistory(newContent);
    }, 0);
  };

  // Funkcja wstawiania akordów (jako span z kolorem)
  const insertChordAbove = (chord) => {
    insertHtmlAtCursor(`<span class="chord-marker" style="color: #ea580c; font-weight: bold;">[${chord}]</span>`);
  };

  // Funkcja wstawiania akordu na podstawie stopnia (I-VII)
  const insertChordByDegree = (degreeIndex, chordType = '') => {
    const key = editorKey || formData.key || 'C';
    const scale = SCALE_DEGREES[key] || SCALE_DEGREES['C'];
    const rootNote = scale[degreeIndex];
    // Użyj domyślnego typu akordu jeśli nie podano
    const type = chordType !== undefined ? chordType : DEFAULT_CHORD_TYPES[degreeIndex];
    const chord = rootNote + type;
    insertChordAbove(chord);
  };

  // Funkcja zmiany koloru czcionki
  const changeTextColor = (color) => {
    execFormat('foreColor', color);
    setShowColorPicker(false);
  };

  // Obsługa skrótów klawiszowych (WYSIWYG)
  const handleKeyDown = (e) => {
    // Tab = wstaw stałą "komórkę" o szerokości 80px (duży odstęp)
    // Używamy inline-block span żeby tekst wpisywany w środku nie przesuwał kolejnych elementów
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab = mniejsza komórka (40px)
        insertHtmlAtCursor('<span class="chord-spacer" contenteditable="true" style="display: inline-block; min-width: 40px; text-align: center;">\u00A0</span>');
      } else {
        // Tab = duża komórka (80px)
        insertHtmlAtCursor('<span class="chord-spacer" contenteditable="true" style="display: inline-block; min-width: 80px; text-align: center;">\u00A0</span>');
      }
      return;
    }
    // Ctrl/Cmd + B = Bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      execFormat('bold');
      return;
    }
    // Ctrl/Cmd + I = Italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      execFormat('italic');
      return;
    }
    // Ctrl/Cmd + U = Underline
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      execFormat('underline');
      return;
    }
    // Ctrl/Cmd + Z = Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }
    // Ctrl/Cmd + Shift + Z lub Ctrl/Cmd + Y = Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      handleRedo();
      return;
    }
    // Ctrl/Cmd + L = Wyrównaj do lewej
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
      e.preventDefault();
      execFormat('justifyLeft');
      return;
    }
    // Ctrl/Cmd + E = Wyśrodkuj
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      execFormat('justifyCenter');
      return;
    }
    // Ctrl/Cmd + R = Wyrównaj do prawej
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      execFormat('justifyRight');
      return;
    }
    // | (pipe) = kreska taktowa - wstaw z odstępami
    if (e.key === '|') {
      e.preventDefault();
      insertTextAtCursor('|');
      return;
    }
  };

  // Obsługa zmian w edytorze contentEditable
  const handleEditorInput = () => {
    if (chordsTextareaRef.current) {
      const newContent = chordsTextareaRef.current.innerHTML;
      setFormData({ ...formData, chords_bars: newContent });
    }
  };

  // Inicjalizacja historii przy pierwszym załadowaniu
  useEffect(() => {
    if (chordsHistory.length === 0 && formData.chords_bars) {
      setChordsHistory([formData.chords_bars]);
      setHistoryIndex(0);
    }
  }, []);

  // Inicjalizuj zawartość edytora gdy zmienia się initialData lub gdy użytkownik przełączy na zakładkę 'lyrics'
  // Ważne: contentEditable jest renderowany tylko gdy activeTab === 'lyrics'
  useEffect(() => {
    if (activeTab !== 'lyrics') return;

    // Użyj setTimeout żeby dać czas na renderowanie elementu contentEditable
    const timer = setTimeout(() => {
      if (chordsTextareaRef.current && initialData && initialData.chords_bars) {
        // Sprawdź czy edytor jest pusty lub ma tylko domyślną zawartość
        const currentContent = chordsTextareaRef.current.innerHTML;
        if (!currentContent || currentContent === '' || currentContent === '<br>') {
          chordsTextareaRef.current.innerHTML = initialData.chords_bars;
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [initialData, activeTab]);

  // Aktualizuj DOM tylko przy undo/redo (gdy flaga jest ustawiona)
  useEffect(() => {
    if (chordsTextareaRef.current && shouldUpdateDOMRef.current) {
      chordsTextareaRef.current.innerHTML = formData.chords_bars || '';
      shouldUpdateDOMRef.current = false;
    }
  }, [formData.chords_bars]);

  // Zamykaj color picker przy kliknięciu na zewnątrz
  useEffect(() => {
    if (!showColorPicker) return;
    const handleClickOutside = (e) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  // Zapisuj zmiany do historii (debounced)
  useEffect(() => {
    if (!isUndoRedoRef.current && formData.chords_bars !== undefined) {
      const timer = setTimeout(() => {
        if (chordsHistory[historyIndex] !== formData.chords_bars) {
          saveToHistory(formData.chords_bars);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.chords_bars]);

  if (!document.body) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700 flex flex-col max-h-[92vh] my-4">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {formData.id ? 'Edycja Pieśni' : 'Nowa Pieśń'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Uzupełnij szczegóły utworu</p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
            <X size={24} />
          </button>
        </div>

        {/* CONTENT - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* TABS */}
          <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'basic' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              Informacje Podstawowe
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'lyrics' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              Tekst i Chwyty
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'attachments' ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              <FileText size={14} />
              Załączniki {(formData.attachments || []).length > 0 && <span className="bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300 px-1.5 py-0.5 rounded text-xs">{formData.attachments.length}</span>}
            </button>
          </div>

          {activeTab === 'basic' && (
            <div className="space-y-6 min-h-[500px]">
              {/* Rząd 1: Tytuł i Autor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Tytuł</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500/20 outline-none transition"
                    placeholder="Np. Jak wielki jest Bóg"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Autor</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500/20 outline-none transition"
                    placeholder="Np. Chris Tomlin"
                    value={formData.author}
                    onChange={e => setFormData({...formData, author: e.target.value})}
                  />
                </div>
              </div>

              {/* Rząd 2: Dane Muzyczne */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <CustomSelect
                  label="Tonacja"
                  options={KEYS}
                  value={formData.key}
                  onChange={val => setFormData({...formData, key: val})}
                  placeholder="Klucz"
                  icon={Music}
                />
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Metrum</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500/20 outline-none transition"
                      placeholder="4/4"
                      value={formData.meter}
                      onChange={e => setFormData({...formData, meter: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Tempo (BPM)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500/20 outline-none transition"
                    placeholder="120"
                    value={formData.tempo}
                    onChange={e => setFormData({...formData, tempo: e.target.value})}
                  />
                </div>
              </div>

              {/* Tagi */}
              <TagMultiSelect
                label="Tagi"
                options={availableTags}
                value={formData.tags}
                onChange={val => setFormData({...formData, tags: val})}
              />
            </div>
          )}

          {activeTab === 'lyrics' && (
            <div className="space-y-6 h-full">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[500px]">
                 {/* KOLUMNA 1: CZYSTY TEKST */}
                 <div className="flex flex-col h-full">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">Tekst Pieśni (Lyrics)</label>
                    <textarea
                      className="flex-1 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500/20 outline-none transition resize-none font-mono text-sm leading-relaxed"
                      placeholder="Wpisz tekst tutaj..."
                      value={formData.lyrics}
                      onChange={e => setFormData({...formData, lyrics: e.target.value})}
                    />
                 </div>

                 {/* KOLUMNA 2: CHWYTY / TAKTY (CHORDS_BARS) - ZAAWANSOWANY EDYTOR */}
                 <div className="flex flex-col h-full">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Chwyty / Takty</label>

                    {/* PASEK NARZĘDZI - FORMATOWANIE */}
                    <div className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/80 border border-b-0 border-gray-200 dark:border-gray-700 rounded-t-xl">
                      {/* Rząd 0: Formatowanie tekstu */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                        {/* Undo/Redo */}
                        <button
                          onClick={handleUndo}
                          disabled={historyIndex <= 0}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Cofnij (Ctrl+Z)"
                        >
                          <Undo2 size={14} />
                        </button>
                        <button
                          onClick={handleRedo}
                          disabled={historyIndex >= chordsHistory.length - 1}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Ponów (Ctrl+Y)"
                        >
                          <Redo2 size={14} />
                        </button>

                        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

                        {/* Formatowanie tekstu - WYSIWYG */}
                        <button
                          onMouseDown={(e) => { e.preventDefault(); execFormat('bold'); }}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-600 hover:text-pink-600 dark:hover:text-pink-400 transition"
                          title="Pogrubienie (Ctrl+B)"
                        >
                          <Bold size={14} />
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); execFormat('italic'); }}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-600 hover:text-pink-600 dark:hover:text-pink-400 transition"
                          title="Kursywa (Ctrl+I)"
                        >
                          <Italic size={14} />
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); execFormat('underline'); }}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-600 hover:text-pink-600 dark:hover:text-pink-400 transition"
                          title="Podkreślenie (Ctrl+U)"
                        >
                          <Underline size={14} />
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); execFormat('strikeThrough'); }}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-600 hover:text-pink-600 dark:hover:text-pink-400 transition"
                          title="Przekreślenie"
                        >
                          <Strikethrough size={14} />
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); execFormat('superscript'); }}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-600 hover:text-pink-600 dark:hover:text-pink-400 transition"
                          title="Indeks górny"
                        >
                          <Superscript size={14} />
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); execFormat('subscript'); }}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-600 hover:text-pink-600 dark:hover:text-pink-400 transition"
                          title="Indeks dolny"
                        >
                          <Subscript size={14} />
                        </button>

                        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

                        {/* Wyrównanie tekstu */}
                        <button
                          onMouseDown={(e) => { e.preventDefault(); execFormat('justifyLeft'); }}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          title="Wyrównaj do lewej"
                        >
                          <AlignLeft size={14} />
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); execFormat('justifyCenter'); }}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          title="Wyśrodkuj"
                        >
                          <AlignCenter size={14} />
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); execFormat('justifyRight'); }}
                          className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          title="Wyrównaj do prawej"
                        >
                          <AlignRight size={14} />
                        </button>

                        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

                        {/* Kolor czcionki */}
                        <div className="relative" ref={colorPickerRef}>
                          <button
                            onMouseDown={(e) => { e.preventDefault(); setShowColorPicker(!showColorPicker); }}
                            className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-600 hover:text-purple-600 dark:hover:text-purple-400 transition"
                            title="Kolor czcionki"
                          >
                            <Palette size={14} />
                          </button>
                          {showColorPicker && (
                            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 grid grid-cols-5 gap-1">
                              {FONT_COLORS.map((color) => (
                                <button
                                  key={color.value}
                                  onMouseDown={(e) => { e.preventDefault(); changeTextColor(color.value); }}
                                  className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                                  style={{ backgroundColor: color.value }}
                                  title={color.label}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

                        {/* System stopni - wybór tonacji i akordy */}
                        <div className="flex items-center gap-2">
                          <Music size={14} className="text-orange-500" />
                          <select
                            value={editorKey}
                            onChange={(e) => setEditorKey(e.target.value)}
                            className="h-6 px-2 text-[11px] font-bold bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded text-orange-700 dark:text-orange-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400"
                            title="Wybierz tonację"
                          >
                            <option value="">Tonacja</option>
                            {KEYS.map((k) => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>

                          {/* Stopnie durowe */}
                          {DEGREE_LABELS.map((label, idx) => {
                            const key = editorKey || 'C';
                            const scale = SCALE_DEGREES[key] || SCALE_DEGREES['C'];
                            const chordRoot = scale[idx];
                            const defaultType = DEFAULT_CHORD_TYPES[idx];
                            const fullChord = chordRoot + defaultType;
                            return (
                              <button
                                key={label}
                                onClick={() => insertChordByDegree(idx, defaultType)}
                                className={`px-1.5 h-6 flex items-center justify-center border rounded transition text-[10px] font-bold ${
                                  defaultType === 'm' || defaultType === 'dim'
                                    ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                                    : 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50'
                                }`}
                                title={`${label} stopień: ${fullChord}`}
                              >
                                <span className="text-[9px] opacity-60 mr-0.5">{label}</span>
                                {fullChord}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Rząd 1: Kontrolki formatowania */}
                      <div className="flex flex-wrap items-center gap-3 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                        {/* Rozmiar czcionki dla zaznaczenia */}
                        <div className="flex items-center gap-1.5">
                          <Type size={14} className="text-gray-400" />
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Rozmiar:</span>
                          {[1, 2, 3, 4, 5, 6, 7].map((size) => (
                            <button
                              key={size}
                              onMouseDown={(e) => { e.preventDefault(); execFormat('fontSize', size.toString()); }}
                              className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-600 hover:text-pink-600 transition text-[10px] font-bold"
                              title={`Rozmiar ${size}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>

                        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600" />

                        {/* Globalne ustawienia */}
                        <div className="flex items-center gap-1.5">
                          <AlignJustify size={14} className="text-gray-400" />
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Interlinia:</span>
                          <button
                            onClick={() => setChordsLineHeight(Math.max(1.2, chordsLineHeight - 0.2))}
                            className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-gray-700 dark:text-gray-200">{chordsLineHeight.toFixed(1)}</span>
                          <button
                            onClick={() => setChordsLineHeight(Math.min(3.0, chordsLineHeight + 0.2))}
                            className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Rząd 2: Szybkie wstawianie */}
                      <div className="flex flex-wrap gap-1.5">
                        {/* Sekcje muzyczne */}
                        {MUSIC_SECTIONS.map((section) => (
                          <button
                            key={section.label}
                            onMouseDown={(e) => { e.preventDefault(); insertHtmlAtCursor(section.template); }}
                            className="px-2.5 py-1 bg-white dark:bg-gray-700 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-[11px] font-bold rounded-md border border-gray-200 dark:border-gray-600 transition flex items-center gap-1"
                          >
                            <PlusCircle size={10} className="text-pink-500 dark:text-pink-400"/>
                            {section.label}
                          </button>
                        ))}

                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

                        {/* Szybkie znaki */}
                        <button
                          onMouseDown={(e) => { e.preventDefault(); insertTextAtCursor('|'); }}
                          className="px-2.5 py-1 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-[11px] font-bold rounded-md border border-orange-200 dark:border-orange-800 transition font-mono"
                          title="Kreska taktowa"
                        >
                          |
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); insertHtmlAtCursor('<span class="chord-spacer" contenteditable="true" style="display: inline-block; min-width: 80px; text-align: center;">\u00A0</span>'); }}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-md border border-blue-200 dark:border-blue-800 transition"
                          title="Stała komórka (80px) - tekst wewnątrz nie przesuwa reszty"
                        >
                          TAB
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); insertHtmlAtCursor('<span class="chord-spacer" contenteditable="true" style="display: inline-block; min-width: 40px; text-align: center;">\u00A0</span>'); }}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-md border border-blue-200 dark:border-blue-800 transition"
                          title="Mała komórka (40px) - tekst wewnątrz nie przesuwa reszty"
                        >
                          SPC
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); insertHtmlAtCursor('<br>'); }}
                          className="px-2.5 py-1 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 text-[11px] font-bold rounded-md border border-green-200 dark:border-green-800 transition flex items-center gap-1"
                          title="Nowa linia"
                        >
                          <CornerDownLeft size={10} />
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); insertHtmlAtCursor('<hr style="border: 1px solid #ccc; margin: 4px 0;">'); }}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-[11px] font-bold rounded-md border border-gray-300 dark:border-gray-500 transition"
                          title="Linia pozioma (separator)"
                        >
                          ───
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); insertTextAtCursor('×2'); }}
                          className="px-2.5 py-1 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-[11px] font-bold rounded-md border border-red-200 dark:border-red-800 transition font-mono"
                          title="Znak powtórzenia"
                        >
                          ×2
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); insertTextAtCursor('𝄆  𝄇'); }}
                          className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[11px] font-bold rounded-md border border-purple-200 dark:border-purple-800 transition font-mono"
                          title="Znaki repetycji"
                        >
                          𝄆 𝄇
                        </button>
                      </div>
                    </div>

                    {/* EDYTOR WYSIWYG - contentEditable */}
                    <div
                      ref={chordsTextareaRef}
                      contentEditable
                      className="flex-1 w-full px-4 py-3 border-x border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:ring-inset min-h-[300px] overflow-auto font-mono text-sm"
                      style={{ lineHeight: chordsLineHeight, whiteSpace: 'pre-wrap' }}
                      onInput={handleEditorInput}
                      onKeyDown={handleKeyDown}
                      suppressContentEditableWarning
                      data-placeholder="Wpisz chwyty tutaj... Zaznacz tekst i użyj przycisków powyżej do formatowania."
                    />

                    {/* STOPKA Z INFORMACJAMI */}
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-xl flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          TAB = stała komórka (80px) • Shift+TAB = mała komórka (40px) • | = kreska taktowa
                        </span>
                        <button
                          onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
                          className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
                          title="Pokaż skróty klawiszowe"
                        >
                          <Keyboard size={12} />
                          Skróty
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                        {(formData.chords_bars || '').length} znaków
                      </span>
                    </div>

                    {/* PANEL POMOCY - SKRÓTY KLAWISZOWE */}
                    {showShortcutsHelp && (
                      <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-t-0 border-blue-200 dark:border-blue-800 rounded-b-xl">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Skróty klawiszowe</h4>
                          <button onClick={() => setShowShortcutsHelp(false)} className="text-blue-400 hover:text-blue-600">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-[11px]">
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Pogrubienie</span><kbd className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-600">Ctrl+B</kbd></div>
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Kursywa</span><kbd className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-600">Ctrl+I</kbd></div>
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Podkreślenie</span><kbd className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-600">Ctrl+U</kbd></div>
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Cofnij</span><kbd className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-600">Ctrl+Z</kbd></div>
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Ponów</span><kbd className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-600">Ctrl+Y</kbd></div>
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Do lewej</span><kbd className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-600">Ctrl+L</kbd></div>
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Wyśrodkuj</span><kbd className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-600">Ctrl+E</kbd></div>
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Do prawej</span><kbd className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-600">Ctrl+R</kbd></div>
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Komórka 80px</span><kbd className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-600">Tab</kbd></div>
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Komórka 40px</span><kbd className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-600">Shift+Tab</kbd></div>
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Kreska taktowa</span><kbd className="bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono border border-gray-200 dark:border-gray-600">|</kbd></div>
                        </div>
                      </div>
                    )}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-6 min-h-[500px]">
              {/* DODAWANIE PLIKU */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-4 flex items-center gap-2">
                  <Upload size={16} className="text-pink-500" /> Prześlij plik
                </h3>
                <label className="w-full px-6 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 cursor-pointer hover:border-pink-400 dark:hover:border-pink-500 transition flex flex-col items-center justify-center gap-2">
                  <Upload size={32} className="text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {uploadingFile ? 'Przesyłanie...' : 'Kliknij lub przeciągnij plik'}
                  </span>
                  <span className="text-xs text-gray-400">PDF, JPG, PNG, MP3, DOC (max 10MB)</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.mp3,.wav"
                    disabled={uploadingFile}
                    multiple
                  />
                </label>
              </div>

              {/* DODAWANIE LINKU */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-4 flex items-center gap-2">
                  <LinkIcon size={16} className="text-orange-500" /> Dodaj link
                </h3>
                <div className="space-y-3">
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm outline-none focus:border-pink-500 transition"
                    placeholder="https://youtube.com/watch?v=..."
                    value={newLink}
                    onChange={e => setNewLink(e.target.value)}
                  />
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm outline-none focus:border-pink-500 transition"
                    placeholder="Opis linku (np. Tutorial na YouTube)"
                    value={newLinkDescription}
                    onChange={e => setNewLinkDescription(e.target.value)}
                  />
                  <button
                    onClick={handleAddLink}
                    disabled={!newLink}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold text-sm hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Dodaj Link
                  </button>
                </div>
              </div>

              {/* LISTA ZAŁĄCZNIKÓW */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase mb-4">
                  Załączniki ({(formData.attachments || []).length})
                </h3>

                {(!formData.attachments || formData.attachments.length === 0) ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <FileText size={40} className="mx-auto mb-3 opacity-50" />
                    <p>Brak załączników</p>
                    <p className="text-sm mt-1">Dodaj pliki lub linki powyżej</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-300 dark:hover:border-pink-600 transition group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${att.type === 'link' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600'}`}>
                            {att.type === 'link' ? <LinkIcon size={20} /> : <FileText size={20} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            {editingAttachmentIdx === idx ? (
                              <div className="flex gap-2">
                                <input
                                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white outline-none focus:border-pink-500"
                                  value={editingDescription}
                                  onChange={e => setEditingDescription(e.target.value)}
                                  placeholder="Wpisz opis..."
                                  autoFocus
                                />
                                <button
                                  onClick={() => updateAttachmentDescription(idx, editingDescription)}
                                  className="px-3 py-1.5 bg-pink-600 text-white rounded-lg text-sm font-bold hover:bg-pink-700"
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => { setEditingAttachmentIdx(null); setEditingDescription(''); }}
                                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm"
                                >
                                  Anuluj
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">
                                  {att.description || att.name || att.url}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {att.type === 'link' ? att.url : att.name}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {editingAttachmentIdx !== idx && (
                          <div className="flex gap-2 shrink-0 ml-3">
                            <button
                              onClick={() => startEditingDescription(idx)}
                              className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg transition"
                              title="Edytuj opis"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => removeAttachment(idx)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                              title="Usuń załącznik"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-3xl flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition"
          >
            Anuluj
          </button>
          <button 
            onClick={handleSubmit}
            className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-pink-600 to-orange-600 hover:shadow-lg hover:shadow-pink-500/30 transition transform hover:-translate-y-0.5"
          >
            Zapisz Pieśń
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
