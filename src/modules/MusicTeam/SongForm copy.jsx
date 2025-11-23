import React, { useState } from 'react';
import { X, HelpCircle, Plus, FileText, Music } from 'lucide-react';

export default function SongForm({ initialData, onSave, onCancel }) {
  // Inicjalizacja z bezpiecznymi wartościami domyślnymi
  const [formData, setFormData] = useState({
    id: initialData.id || null,
    title: initialData.title || '',
    category: initialData.category || 'Uwielbienie',
    key: initialData.key || '',
    tempo: initialData.tempo || '',
    meter: initialData.meter || '4/4',
    tags: Array.isArray(initialData.tags) ? initialData.tags : [],
    lyrics: initialData.lyrics || '',
    chords: initialData.chords || '',
    lyrics_chords: initialData.lyrics_chords || '',
    sheet_music_url: initialData.sheet_music_url || '',
    attachments: Array.isArray(initialData.attachments) ? initialData.attachments : [],
    chord_format: initialData.chord_format || 'chords_over_lyrics'
  });

  const [tab, setTab] = useState('basic');

  const insertSection = (sectionName) => {
    const textToInsert = `\n\n${sectionName}:\n`;
    const textarea = document.getElementById('lyrics-editor');
    
    // Aktualizujemy pole w zależności od wybranego formatu
    const fieldName = 'lyrics_chords'; 
    const currentText = formData[fieldName] || '';
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = currentText.substring(0, start) + textToInsert + currentText.substring(end);
      setFormData({ ...formData, [fieldName]: newText });
      // Przywrócenie fokusu (opcjonalne)
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
      }, 0);
    } else {
      setFormData({ ...formData, [fieldName]: currentText + textToInsert });
    }
  };

  const handleSubmit = () => {
    // Walidacja
    if (!formData.title.trim()) {
      alert('Podaj tytuł pieśni!');
      return;
    }

    // Przygotowanie danych (konwersja typów)
    const payload = {
      ...formData,
      tempo: formData.tempo ? parseInt(formData.tempo, 10) : null, // Int dla bazy
      // Upewnij się, że nie wysyłamy pól, których baza nie obsługuje (opcjonalne czyszczenie)
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        
        {/* NAGŁÓWEK */}
        <div className="flex justify-between items-center p-6 border-b bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-900">{formData.id ? 'Edytuj Pieśń' : 'Nowa Pieśń'}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-500" /></button>
        </div>

        {/* ZAKŁADKI */}
        <div className="flex border-b px-6 bg-gray-50">
          {['Podstawowe', 'Tekst i Akordy', 'Załączniki'].map((t, i) => {
             const key = ['basic', 'chords', 'attachments'][i];
             return (
               <button 
                 key={key}
                 onClick={() => setTab(key)}
                 className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${tab === key ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
               >
                 {t}
               </button>
             )
          })}
        </div>

        {/* TREŚĆ */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          
          {/* 1. DANE PODSTAWOWE */}
          {tab === 'basic' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <label className="block font-bold mb-1 text-sm text-gray-700">Tytuł pieśni *</label>
                <input 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Wpisz tytuł..."
                />
              </div>
              
              <div>
                <label className="block font-bold mb-1 text-sm text-gray-700">Kategoria *</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option>Uwielbienie</option><option>Modlitwa</option><option>Szybkie</option><option>Wolne</option><option>Kolęda</option><option>Hymn</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-bold mb-1 text-sm text-gray-700">Tonacja</label>
                  <input className="w-full p-3 border border-gray-300 rounded-lg" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} placeholder="np. G" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-sm text-gray-700">Tempo (BPM)</label>
                  <input type="number" className="w-full p-3 border border-gray-300 rounded-lg" value={formData.tempo} onChange={e => setFormData({...formData, tempo: e.target.value})} placeholder="120" />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-sm text-gray-700">Metrum</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg bg-white" value={formData.meter} onChange={e => setFormData({...formData, meter: e.target.value})}>
                  <option>4/4 (Common time)</option><option>3/4</option><option>6/8</option><option>2/4</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-sm text-gray-700">Tagi (oddzielone przecinkami)</label>
                <input className="w-full p-3 border border-gray-300 rounded-lg" value={formData.tags.join(', ')} onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim())})} placeholder="np. uwielbienie, radość" />
                <div className="flex gap-2 mt-3 flex-wrap">
                  {['uwielbienie', 'szybka', 'wolna'].map(tag => (
                    <button key={tag} onClick={() => { if(!formData.tags.includes(tag)) setFormData({...formData, tags: [...formData.tags, tag]}) }} className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition">+{tag}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. TEKST I AKORDY */}
          {tab === 'chords' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <label className="block font-bold text-sm text-gray-700">Format i Edytor:</label>
                  <select 
                    className="p-2 border border-gray-300 rounded-lg bg-white text-sm"
                    value={formData.chord_format} 
                    onChange={e => setFormData({...formData, chord_format: e.target.value})}
                  >
                    <option value="chords_over_lyrics">Tekst z akordami (klasyczny)</option>
                    <option value="bars">Akordy w taktach (z kreską taktową)</option>
                  </select>
                </div>

                {formData.chord_format === 'bars' && (
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4 border border-blue-100 flex gap-3">
                    <HelpCircle className="shrink-0" size={20}/>
                    <div>
                      <strong>Wskazówki dla zapisu taktowego:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                        <li>Każdy takt oddzielaj pionową kreską <code>|</code></li>
                        <li>Przykład: <code>| G | Em7 Dsus4 | C2 |</code></li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <textarea 
                    id="lyrics-editor"
                    className="w-full p-4 border border-gray-300 rounded-lg font-mono text-sm leading-loose min-h-[400px] focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-inner"
                    placeholder={formData.chord_format === 'bars' ? "| G | C | D |\n\nzwr.\n| G | Em | C | D |" : "G       C\nPanie Jezu..."}
                    value={formData.lyrics_chords}
                    onChange={e => setFormData({...formData, lyrics_chords: e.target.value})}
                  />
                  
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {['Zwrotka', 'Refren', 'Bridge', 'Pre-chorus', 'Intro', 'Outro', 'Instrumental'].map(s => (
                      <button 
                        key={s} 
                        onClick={() => insertSection(s)} 
                        className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs rounded-full font-medium hover:bg-gray-50 hover:border-gray-300 transition shadow-sm whitespace-nowrap"
                      >
                        +{s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <label className="block font-bold mb-2 text-sm text-gray-700">Tekst pieśni (Czysty tekst - dla rzutnika)</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg font-sans text-sm min-h-[150px]"
                  placeholder="Tutaj wklej sam tekst bez akordów..."
                  value={formData.lyrics}
                  onChange={e => setFormData({...formData, lyrics: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* 3. ZAŁĄCZNIKI */}
          {tab === 'attachments' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold mb-4 text-gray-800">Materiały</h3>
                
                <div className="mb-6">
                  <label className="block font-bold mb-2 text-xs text-gray-500 uppercase tracking-wide">Link do nut (PDF/URL)</label>
                  <input 
                    className="w-full p-3 border border-gray-300 rounded-lg text-blue-600" 
                    placeholder="https://drive.google.com/..." 
                    value={formData.sheet_music_url} 
                    onChange={e => setFormData({...formData, sheet_music_url: e.target.value})} 
                  />
                </div>

                {/* Tu można by dodać obsługę uploadu plików w przyszłości */}
                <div className="p-8 border-2 border-dashed border-gray-200 rounded-lg text-center bg-gray-50">
                  <FileText className="mx-auto text-gray-400 mb-2" size={32}/>
                  <p className="text-sm text-gray-500">Przeciągnij pliki tutaj lub kliknij, aby dodać (funkcja w budowie)</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* STOPKA */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onCancel} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition shadow-sm">Anuluj</button>
          <button onClick={handleSubmit} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition flex items-center gap-2">
            <Save size={18}/> Zapisz
          </button>
        </div>
      </div>
    </div>
  );
}

// Ikonka do przycisku
const Save = ({size}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
