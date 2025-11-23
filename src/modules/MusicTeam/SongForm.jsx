import React, { useState } from 'react';
import { X, HelpCircle, Plus, FileText, Music } from 'lucide-react';

export default function SongForm({ initialData = {}, onSave, onCancel }) {
  // Poprawna inicjalizacja wartości domyślnych!
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
    chord_format: initialData.chord_format || 'chords_over_lyrics',
    sheet_music_url: initialData.sheet_music_url || '',
    attachments: Array.isArray(initialData.attachments) ? initialData.attachments : [],
  });
  const [tab, setTab] = useState('basic');

  const insertSection = (sectionName) => {
    const textToInsert = `\n\n${sectionName}:\n`;
    const textarea = document.getElementById('lyrics-editor');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.lyrics_chords || '';
      const newText = text.substring(0, start) + textToInsert + text.substring(end);
      setFormData({ ...formData, lyrics_chords: newText });
    }
  };

  const handleSave = () => {
    const payload = {
      ...formData,
      tempo: formData.tempo ? parseInt(formData.tempo, 10) : null,
      tags: Array.isArray(formData.tags) ? formData.tags : [],
      attachments: formData.attachments || [],
      chord_format: formData.chord_format || 'chords_over_lyrics',
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        
        {/* NAGŁÓWEK */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{formData.id ? 'Edytuj Pieśń' : 'Nowa Pieśń'}</h2>
          <button onClick={onCancel}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        {/* ZAKŁADKI */}
        <div className="flex border-b px-6">
          {['Podstawowe', 'Tekst i Akordy', 'Załączniki'].map((t, i) => {
             const key = ['basic', 'chords', 'attachments'][i];
             return (
               <button 
                 key={key}
                 onClick={() => setTab(key)}
                 className={`px-6 py-3 font-medium border-b-2 transition-colors ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
               >
                 {t}
               </button>
             )
          })}
        </div>

        {/* TREŚĆ */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          
          {/* 1. DANE PODSTAWOWE */}
          {tab === 'basic' && (
            <div className="space-y-6 max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm">
              <div>
                <label className="block font-bold mb-1 text-sm">Tytuł pieśni *</label>
                <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div>
                <label className="block font-bold mb-1 text-sm">Kategoria *</label>
                <select className="w-full p-3 border rounded-lg bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option>Uwielbienie</option><option>Modlitwa</option><option>Kolęda</option><option>Hymn</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1 text-sm">Tonacja</label>
                  <input className="w-full p-3 border rounded-lg" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} placeholder="np. G" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-sm">Tempo (BPM)</label>
                  <input type="number" className="w-full p-3 border rounded-lg" value={formData.tempo} onChange={e => setFormData({...formData, tempo: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-sm">Metrum</label>
                <select className="w-full p-3 border rounded-lg bg-white" value={formData.meter} onChange={e => setFormData({...formData, meter: e.target.value})}>
                  <option>4/4 (Common time)</option><option>3/4</option><option>6/8</option><option>2/4</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-sm">Tagi (oddzielone przecinkami)</label>
                <input className="w-full p-3 border rounded-lg" value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags} onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim())})} />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {['uwielbienie', 'szybka', 'wolna'].map(tag => (
                    <span key={tag} onClick={() => setFormData({...formData, tags: [...(formData.tags || []), tag]})} className="bg-gray-100 px-2 py-1 rounded text-xs cursor-pointer hover:bg-blue-100 hover:text-blue-600 transition">+{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. TEKST I AKORDY */}
          {tab === 'chords' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <label className="block font-bold mb-4 text-sm">Format akordów:</label>
                <select 
                  className="w-full p-3 border rounded-lg bg-gray-50 mb-4"
                  value={formData.chord_format || 'chords_over_lyrics'} 
                  onChange={e => setFormData({...formData, chord_format: e.target.value})}
                >
                  <option value="chords_over_lyrics">Tekst z akordami (klasyczny)</option>
                  <option value="bars">Akordy w taktach (z kreską taktową)</option>
                </select>

                {formData.chord_format === 'bars' && (
                  <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4 border border-blue-100">
                    <div className="font-bold flex items-center gap-2 mb-2"><HelpCircle size={16}/> Wskazówki:</div>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>Każdy takt oddzielony kreską |</li>
                      <li>Puste takty: wpis tylko | lub spację między kreskami</li>
                      <li>Przykład: | G | Em7 Dsus4 | C2 |</li>
                    </ul>
                  </div>
                )}

                <div className="relative">
                  <textarea 
                    id="lyrics-editor"
                    className="w-full p-4 border rounded-lg font-mono text-sm leading-loose min-h-[400px] focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder={formData.chord_format === 'bars' ? "| G | C | D |\n\nzwr.\n| G | Em | C | D |" : "G       C\nPanie Jezu..."}
                    value={formData.lyrics_chords}
                    onChange={e => setFormData({...formData, lyrics_chords: e.target.value})}
                  />
                  
                  {/* Pasek narzędzi sekcji */}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => insertSection('Zwrotka')} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-medium hover:bg-blue-700">+ Zwrotka</button>
                    <button onClick={() => insertSection('Refren')} className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full font-medium hover:bg-purple-700">+ Refren</button>
                    <button onClick={() => insertSection('Bridge')} className="px-3 py-1 bg-pink-600 text-white text-xs rounded-full font-medium hover:bg-pink-700">+ Bridge</button>
                    <button onClick={() => insertSection('Pre-chorus')} className="px-3 py-1 bg-teal-600 text-white text-xs rounded-full font-medium hover:bg-teal-700">+ Pre-chorus</button>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <label className="block font-bold mb-2 text-sm">Tekst pieśni (sam tekst)</label>
                <textarea 
                  className="w-full p-3 border rounded-lg font-sans text-sm min-h-[150px]"
                  placeholder="Wersja bez akordów do rzutnika..."
                  value={formData.lyrics}
                  onChange={e => setFormData({...formData, lyrics: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* 3. ZAŁĄCZNIKI */}
          {tab === 'attachments' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-bold mb-4 text-sm">Pliki i Nuty</h3>
                
                <div className="mb-6">
                  <label className="block font-bold mb-2 text-xs text-gray-500 uppercase">Link do nut (PDF/URL)</label>
                  <input 
                    className="w-full p-3 border rounded-lg text-blue-600 underline" 
                    placeholder="https://example.com/nuty.pdf" 
                    value={formData.sheet_music_url} 
                    onChange={e => setFormData({...formData, sheet_music_url: e.target.value})} 
                  />
                </div>

                <div className="border-t pt-6">
                  <label className="block font-bold mb-4 text-sm">Załączniki (MP3, PDF)</label>
                  
                  <div className="space-y-2 mb-4">
                    {formData.attachments?.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <div className="flex items-center gap-3">
                          {file.type === 'audio' ? <Music size={20} className="text-blue-500"/> : <FileText size={20} className="text-red-500"/>}
                          <span className="text-sm font-medium">{file.name}</span>
                        </div>
                        <button 
                          onClick={() => {
                             const newAtt = formData.attachments.filter((_, i) => i !== idx);
                             setFormData({...formData, attachments: newAtt});
                          }}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <X size={16}/>
                        </button>
                      </div>
                    ))}
                    {(!formData.attachments || formData.attachments.length === 0) && (
                      <div className="text-center py-8 bg-gray-50 rounded border border-dashed text-gray-500 text-sm">
                        Brak załączników
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const name = prompt('Podaj nazwę pliku:');
                        if(name) {
                          setFormData({
                            ...formData, 
                            attachments: [...(formData.attachments || []), { name, type: 'pdf', url: '#' }]
                          });
                        }
                      }}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200"
                    >
                      + Dodaj Plik
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* STOPKA */}
        <div className="p-6 border-t bg-white flex justify-end gap-3">
          <button onClick={onCancel} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Anuluj</button>
          <button onClick={handleSave} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition">Zapisz</button>
        </div>
      </div>
    </div>
  );
}
