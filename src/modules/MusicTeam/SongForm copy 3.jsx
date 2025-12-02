import React, { useState, useRef } from 'react';
import { X, Music, FileText } from 'lucide-react';

const METER_OPTIONS = ['2/4', '3/4', '4/4', '6/8', '7/8', '9/8'];
const TAG_PRESETS = ['uwielbienie', 'szybka', 'wolna', 'popularna', 'niedzielna', 'modlitwa', 'intymna'];
const CHORDS_KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export default function SongForm({ initialData = {}, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: initialData.id || null,
    title: initialData.title || '',
    category: initialData.category || 'Uwielbienie',
    key: initialData.key || '',
    tempo: initialData.tempo || '',
    meter: initialData.meter || '4/4',
    lyrics: initialData.lyrics || '',
    chord_format: initialData.chord_format || 'bars',
    chords_bars: initialData.chords_bars || '',
    lyrics_chords: initialData.lyrics_chords || '',
    attachments: initialData.attachments || [],
    sheet_music_url: initialData.sheet_music_url || '',
    tags: Array.isArray(initialData.tags) ? initialData.tags : [],
  });
  
  const fileInput = useRef();

  const handleTags = val => {
    const newTags = val.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData({ ...formData, tags: newTags });
  };

  const toggleTag = tag => {
    const newTags = formData.tags.includes(tag)
      ? formData.tags.filter(t => t !== tag)
      : [...formData.tags, tag];
    setFormData({ ...formData, tags: newTags });
  };

  const handleFileChange = e => {
    const newFiles = Array.from(e.target.files).map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    }));
    setFormData({ ...formData, attachments: [...(formData.attachments || []), ...newFiles] });
  };

  const removeFile = idx => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== idx)
    });
  };

  const insertSection = (sectionName, shortName) => {
    const textarea = document.getElementById('chords-bars-editor');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.chords_bars || '';
      
      // Wylicz ile taktów na podstawie metrum
      const meter = formData.meter || '4/4';
      const barsCount = 4; // domyślnie 4 takty
      const emptyBars = Array(barsCount).fill('   ').join(' |');
      
      const newText = text.substring(0, start) + 
        `\n\n${shortName}\n|${emptyBars} |\n` + 
        text.substring(end);
      
      setFormData({ ...formData, chords_bars: newText });
      
      // Ustaw focus z powrotem
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + newText.length - text.length;
      }, 10);
    }
  };

  const handleSave = () => {
    const cleanData = {
      ...formData,
      tempo: formData.tempo ? parseInt(formData.tempo, 10) : null,
      title: formData.title.trim(),
      category: formData.category.trim(),
      key: formData.key.trim(),
      meter: formData.meter.trim(),
      lyrics: formData.lyrics.trim(),
      chords_bars: formData.chords_bars.trim(),
      lyrics_chords: formData.lyrics_chords.trim(),
      sheet_music_url: formData.sheet_music_url.trim(),
    };
    onSave(cleanData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl max-w-5xl w-full rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-white/20 max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center py-6 px-10 border-b border-gray-200/50 bg-gradient-to-r from-pink-50/80 to-orange-50/80">
          <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
            {formData.id ? "Edytuj Pieśń" : "Dodaj Pieśń"}
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/50 rounded-xl transition">
            <X size={28} className="text-gray-600" />
          </button>
        </div>

        {/* CONTENT - SCROLLABLE */}
        <form className="flex-1 overflow-y-auto px-10 py-8 space-y-6" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          
          {/* TYTUŁ */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Tytuł pieśni *</label>
            <input 
              className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/60 backdrop-blur-sm text-lg font-bold" 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
              required 
              placeholder="Wpisz tytuł pieśni"
            />
          </div>

          {/* 2 KOLUMNY: Kategoria + Tagi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Kategoria *</label>
              <select 
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/60 backdrop-blur-sm" 
                value={formData.category} 
                onChange={e => setFormData({ ...formData, category: e.target.value })} 
                required
              >
                <option>Uwielbienie</option>
                <option>Modlitwa</option>
                <option>Kolęda</option>
                <option>Hymn</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tagi</label>
              <div className="flex flex-wrap gap-2">
                {TAG_PRESETS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                      formData.tags.includes(tag)
                        ? 'bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700 border-pink-200/50'
                        : 'bg-white/60 text-gray-600 border-gray-200/50 hover:bg-gray-50'
                    }`}
                  >
                    {formData.tags.includes(tag) ? '✓ ' : ''}
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3 KOLUMNY: Tonacja, Tempo, Metrum */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tonacja</label>
              <select 
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/60 backdrop-blur-sm font-mono font-bold text-pink-600" 
                value={formData.key} 
                onChange={e => setFormData({ ...formData, key: e.target.value })}
              >
                <option value="">---</option>
                {CHORDS_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tempo (BPM)</label>
              <input 
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/60 backdrop-blur-sm" 
                type="number" 
                value={formData.tempo} 
                onChange={e => setFormData({ ...formData, tempo: e.target.value })} 
                placeholder="120"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Metrum</label>
              <select 
                className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/60 backdrop-blur-sm" 
                value={formData.meter} 
                onChange={e => setFormData({ ...formData, meter: e.target.value })}
              >
                {METER_OPTIONS.map(met => <option key={met}>{met}</option>)}
              </select>
            </div>
          </div>

          {/* FORMAT AKORDÓW */}
          <div className="bg-gradient-to-r from-pink-50/50 to-orange-50/50 border border-pink-200/30 rounded-2xl p-5">
            <label className="block text-xs font-semibold text-gray-500 mb-2">Format akordów</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, chord_format: 'bars' })}
                className={`flex-1 px-4 py-2 rounded-xl border font-bold transition ${
                  formData.chord_format === 'bars'
                    ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white border-transparent'
                    : 'bg-white/70 text-gray-700 border-gray-300/50 hover:bg-white'
                }`}
              >
                Akordy w taktach
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, chord_format: 'chords_over_lyrics' })}
                className={`flex-1 px-4 py-2 rounded-xl border font-bold transition ${
                  formData.chord_format === 'chords_over_lyrics'
                    ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white border-transparent'
                    : 'bg-white/70 text-gray-700 border-gray-300/50 hover:bg-white'
                }`}
              >
                Akordy nad tekstem
              </button>
            </div>
          </div>

          {/* WARUNKOWA ZAWARTOŚĆ: Akordy w taktach */}
          {formData.chord_format === 'bars' && (
            <>
              {/* 2 KOLUMNY: Treść + Akordy w taktach */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-bold text-pink-700 mb-2 flex items-center gap-2">
                    <FileText size={18} />
                    Tekst pieśni *
                  </label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/60 backdrop-blur-sm text-sm font-mono" 
                    rows={8}
                    value={formData.lyrics} 
                    onChange={e => setFormData({ ...formData, lyrics: e.target.value })} 
                    required 
                    placeholder="Wpisz pełny tekst pieśni..."
                  />
                </div>
                <div>
                  <label className="block font-bold text-orange-700 mb-2 flex items-center gap-2">
                    <Music size={18} />
                    Akordy w taktach
                  </label>
                  <textarea 
                    id="chords-bars-editor"
                    className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/60 backdrop-blur-sm text-sm font-mono" 
                    rows={8}
                    value={formData.chords_bars} 
                    onChange={e => setFormData({ ...formData, chords_bars: e.target.value })} 
                    placeholder="zwr.&#10;|D   |Bm7 Asus4 |G2  |G2   |"
                  />
                </div>
              </div>

              {/* PRZYCISKI SEKCJI */}
              <div className="bg-gradient-to-br from-pink-50/50 to-orange-50/50 backdrop-blur-sm border border-pink-200/30 rounded-2xl p-5">
                <div className="text-xs font-semibold text-gray-500 mb-3">Dodaj sekcję do akordów:</div>
                <div className="flex gap-2 flex-wrap">
                  <button 
                    type="button" 
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 to-pink-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition text-sm"
                    onClick={() => insertSection('Zwrotka', 'zwr.')}
                  >
                    + Zwrotka
                  </button>
                  <button 
                    type="button" 
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition text-sm"
                    onClick={() => insertSection('Refren', 'ref.')}
                  >
                    + Refren
                  </button>
                  <button 
                    type="button" 
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 to-pink-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition text-sm"
                    onClick={() => insertSection('Bridge', 'bridge')}
                  >
                    + Bridge
                  </button>
                  <button 
                    type="button" 
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition text-sm"
                    onClick={() => insertSection('Pre-chorus', 'pre-chorus')}
                  >
                    + Pre-chorus
                  </button>
                  <button 
                    type="button" 
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-teal-500/50 transition text-sm"
                    onClick={() => insertSection('Outro', 'outro')}
                  >
                    + Outro
                  </button>
                </div>
                <div className="text-xs text-gray-600 mt-3 bg-white/50 rounded-xl p-3 border border-gray-200/30">
                  <b>Wskazówki:</b>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Każdy takt oddzielony kreską | </li>
                    <li>Puste takty: wpis tylko | lub spację między kreskami</li>
                    <li>Zmiana akordu w takcie: D/F# G2 (środek taktu)</li>
                    <li>Sekcje: zwr., ref., bridge, pre-chorus, outro</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* WARUNKOWA ZAWARTOŚĆ: Akordy nad tekstem */}
          {formData.chord_format === 'chords_over_lyrics' && (
            <>
              {/* TREŚĆ */}
              <div>
                <label className="block font-bold text-pink-700 mb-2 flex items-center gap-2">
                  <FileText size={18} />
                  Tekst pieśni *
                </label>
                <textarea 
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/60 backdrop-blur-sm text-sm font-mono" 
                  rows={6}
                  value={formData.lyrics} 
                  onChange={e => setFormData({ ...formData, lyrics: e.target.value })} 
                  required 
                  placeholder="Wpisz pełny tekst pieśni..."
                />
              </div>

              {/* TREŚĆ Z AKORDAMI NAD TEKSTEM */}
              <div>
                <label className="block font-bold text-pink-700 mb-2 flex items-center gap-2">
                  <Music size={18} />
                  Tekst z akordami (pełna wersja)
                </label>
                <textarea 
                  id="chords-over-lyrics-editor"
                  className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/60 backdrop-blur-sm text-sm font-mono" 
                  rows={10}
                  value={formData.lyrics_chords} 
                  onChange={e => setFormData({ ...formData, lyrics_chords: e.target.value })} 
                  placeholder="G   D/F#  C2&#10;Panie Jezu..."
                />
                <div className="text-xs text-gray-600 mt-2 bg-white/50 rounded-xl p-3 border border-gray-200/30">
                  <b>Format:</b> Akordy w linii powyżej tekstu, np.:
                  <pre className="mt-1 font-mono text-xs">G   D/F#  C2{'\n'}Panie Jezu Ty jesteś</pre>
                </div>
              </div>
            </>
          )}

          {/* ZAŁĄCZNIKI */}
          <div>
            <div className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FileText size={20} />
              Załączniki
            </div>
            <div className="flex gap-3 items-center mb-3">
              <input 
                multiple 
                ref={fileInput} 
                type="file" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              <button 
                type="button" 
                onClick={() => fileInput.current.click()} 
                className="px-5 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl text-sm font-bold border border-gray-300/50 hover:from-gray-200 hover:to-gray-300 transition"
              >
                Wybierz pliki
              </button>
              <span className="text-xs text-gray-500">
                {formData.attachments.length === 0 ? 'Nie zaznaczono żadnych plików' : `${formData.attachments.length} plik(ów)`}
              </span>
            </div>
            {Array.isArray(formData.attachments) && formData.attachments.length > 0 && (
              <div className="space-y-2">
                {formData.attachments.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-3"
                  >
                    {f.name?.endsWith(".mp3") ? (
                      <Music size={18} className="text-pink-600" />
                    ) : (
                      <FileText size={18} className="text-orange-600" />
                    )}
                    <span className="font-semibold flex-1 text-sm">{f.name}</span>
                    <span className="text-xs text-gray-500">
                      {f.size > 1024 * 1024
                        ? (f.size / 1024 / 1024).toFixed(1) + " MB"
                        : (f.size / 1024).toFixed(0) + " KB"}
                    </span>
                    <button 
                      type="button" 
                      className="text-xs text-red-600 hover:underline font-medium" 
                      onClick={() => removeFile(idx)}
                    >
                      Usuń
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LINK DO NAGRANIA */}
          <div>
            <div className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Music size={20} />
              Link do nagrania / Nuty
            </div>
            <input 
              className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/60 backdrop-blur-sm text-sm" 
              value={formData.sheet_music_url || ""} 
              onChange={e => setFormData({ ...formData, sheet_music_url: e.target.value })} 
              placeholder="https://... lub nazwa pliku PDF"
            />
          </div>

        </form>

        {/* FOOTER */}
        <div className="flex justify-end gap-4 p-6 border-t border-gray-200/50 bg-gradient-to-r from-pink-50/30 to-orange-50/30">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 font-medium rounded-xl hover:bg-white transition"
          >
            Anuluj
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className="px-10 py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
}
