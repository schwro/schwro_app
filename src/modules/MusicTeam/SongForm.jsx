import React, { useState, useEffect, useRef } from 'react';
import { X, PlusCircle, Music, Hash, AlignLeft, Check, Upload, FileText, Link as LinkIcon, Trash2, Edit3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CustomSelect from '../../components/CustomSelect';

// --- STAŁE DANYCH ---
const KEYS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
const DEFAULT_CATEGORIES = ["Uwielbienie", "Modlitwa", "Na wejście", "Na ofiarowanie", "Komunia", "Uwielbienie (szybkie)", "Kolęda", "Inne"];
const METERS = ["4/4", "3/4", "2/4", "6/8", "12/8", "Inne"];
const AVAILABLE_TAGS = ["intymna", "modlitewna", "niedzielna", "popularna", "szybko", "wolna", "nowość", "klasyk"];

// Szablony sekcji muzycznych
const MUSIC_SECTIONS = [
  { label: 'Intro', template: '\n[INTRO]\n|      |      |      |      |\n' },
  { label: 'Zwrotka', template: '\n[ZWROTKA]\n|      |      |      |      |\n' },
  { label: 'Refren', template: '\n[REFREN]\n|      |      |      |      |\n' },
  { label: 'Bridge', template: '\n[BRIDGE]\n|      |      |      |      |\n' },
  { label: 'Solo', template: '\n[SOLO]\n|      |      |      |      |\n' },
  { label: 'Outro', template: '\n[OUTRO]\n|      |      |      |      |\n' },
  { label: 'Pusty Takt', template: '|      |      |      |      |' },
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

export default function SongForm({ initialData, onSave, onCancel }) {
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
    chords_bars: '', // ZMIANA NAZWY POLA NA ZGODNĄ Z BAZĄ
    sheet_music_url: '',
    attachments: []
  });

  const [activeTab, setActiveTab] = useState('basic'); // basic | lyrics | attachments
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [newLinkDescription, setNewLinkDescription] = useState('');
  const [editingAttachmentIdx, setEditingAttachmentIdx] = useState(null);
  const [editingDescription, setEditingDescription] = useState('');
  const chordsTextareaRef = useRef(null);

  // Pobierz kategorie ze słownika
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await supabase
          .from('app_dictionaries')
          .select('label')
          .eq('category', 'song_category');

        if (data && data.length > 0) {
          setCategories(data.map(d => d.label));
        }
      } catch (err) {
        console.error('Błąd pobierania kategorii:', err);
      }
    };
    fetchCategories();
  }, []);

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
        chords_bars: initialData.chords_bars || '' // ZMIANA
      });
    }
  }, [initialData]);

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

  // Funkcja wstawiająca szablon w miejscu kursora (DLA POLA CHORDS_BARS)
  const insertAtCursor = (template) => {
    const textarea = chordsTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.chords_bars || ''; // ZMIANA

    const newText = text.substring(0, start) + template + text.substring(end);
    
    setFormData({ ...formData, chords_bars: newText }); // ZMIANA

    // Przywrócenie focusu i ustawienie kursora po wstawionym tekście
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + template.length, start + template.length);
    }, 0);
  };

  return (
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CustomSelect 
                  label="Tonacja"
                  options={KEYS} 
                  value={formData.key} 
                  onChange={val => setFormData({...formData, key: val})} 
                  placeholder="Klucz"
                  icon={Music}
                />
                <CustomSelect 
                  label="Metrum"
                  options={METERS} 
                  value={formData.meter} 
                  onChange={val => setFormData({...formData, meter: val})} 
                  placeholder="4/4"
                  icon={Hash}
                />
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
                 <CustomSelect
                  label="Kategoria"
                  options={categories}
                  value={formData.category}
                  onChange={val => setFormData({...formData, category: val})}
                  placeholder="Rodzaj"
                  icon={AlignLeft}
                />
              </div>

              {/* Tagi */}
              <TagMultiSelect 
                label="Tagi"
                options={AVAILABLE_TAGS}
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

                 {/* KOLUMNA 2: CHWYTY / TAKTY (CHORDS_BARS) */}
                 <div className="flex flex-col h-full">
                    <div className="flex justify-between items-end mb-1">
                       <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Chwyty / Takty (chords_bars)</label>
                       <span className="text-[10px] text-gray-400">Kliknij przycisk poniżej, aby wstawić</span>
                    </div>

                    <textarea
                      ref={chordsTextareaRef}
                      className="flex-1 w-full px-4 py-3 rounded-t-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 focus:ring-2 focus:ring-pink-500/20 outline-none transition resize-none font-mono text-sm leading-relaxed"
                      placeholder="[INTRO] | C | G | Am | F |..."
                      value={formData.chords_bars}
                      onChange={e => setFormData({...formData, chords_bars: e.target.value})}
                    />

                    {/* PASEK NARZĘDZI DO WSTAWIANIA SEKCJI */}
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-xl flex flex-wrap gap-2">
                        {MUSIC_SECTIONS.map((section) => (
                            <button
                                key={section.label}
                                onClick={() => insertAtCursor(section.template)}
                                className="px-3 py-1.5 bg-white dark:bg-gray-700 hover:bg-pink-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-600 transition flex items-center gap-1"
                            >
                                <PlusCircle size={12} className="text-pink-500 dark:text-pink-400"/>
                                {section.label}
                            </button>
                        ))}
                    </div>

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
    </div>
  );
}
