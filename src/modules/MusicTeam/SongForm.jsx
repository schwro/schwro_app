import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

const METER_OPTIONS = ['2/4', '3/4', '4/4', '6/8', '7/8', '9/8'];
const TAG_PRESETS = ['uwielbienie', 'szybka', 'wolna', 'popularna', 'niedzielna', 'modlitwa', 'intymna'];

export default function SongForm({ initialData = {}, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: initialData.id || null,
    title: initialData.title || '',
    category: initialData.category || 'Uwielbienie',
    key: initialData.key || '',
    tempo: initialData.tempo || '',
    meter: initialData.meter || '',
    lyrics: initialData.lyrics || '',
    chord_format: initialData.chord_format || 'bars',
    chords_bars: initialData.chords_bars || '',
    lyrics_chords: initialData.lyrics_chords || '',
    attachments: initialData.attachments || [],
    sheet_music_url: initialData.sheet_music_url || '',
    tags: Array.isArray(initialData.tags) ? initialData.tags : [],
  });
  const fileInput = useRef();

  const handleTags = val => setFormData({
    ...formData,
    tags: val.split(',').map(tag => tag.trim()).filter(Boolean)
  });

  const handleFileChange = e => {
    const newFiles = Array.from(e.target.files).map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    }));
    setFormData({ ...formData, attachments: [...(formData.attachments||[]), ...newFiles] });
  };

  const insertSection = sectionName => {
    const textarea = document.getElementById('chords-editor');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.lyrics_chords || '';
      const newText = text.substring(0, start) + `\n\n${sectionName}:\n` + text.substring(end);
      setFormData({ ...formData, lyrics_chords: newText });
    }
  };

  const removeFile = idx => setFormData({
    ...formData,
    attachments: formData.attachments.filter((_, i) => i !== idx)
  });

  const handleSave = () => onSave({ ...formData, tempo: formData.tempo ? parseInt(formData.tempo, 10) : null });

  const chordExample = `zwr.
|D   |Bm7 Asus4 |G2  |G2   |
|D   |Bm7 Asus4 |G2  |G2   |

ref.
|D2   |D/F# G2 |Asus4 |
|D2   |D/F# G2 |A  Bm7 |`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col relative max-h-[90vh]">
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 pb-2">
          <h2 className="font-bold text-lg">{formData.id ? "Edytuj Pieśń" : "Dodaj Pieśń"}</h2>
          <button type="button" onClick={onCancel}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <form className="flex-1 overflow-y-auto" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <div className="flex flex-col gap-5 px-8 pb-2">
            <div>
              <label className="block text-sm font-bold mb-1">Tytuł pieśni *</label>
              <input className="w-full p-3 border rounded-lg" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Kategoria *</label>
              <select className="w-full p-3 border rounded-lg" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                <option>Uwielbienie</option>
                <option>Modlitwa</option>
                <option>Kolęda</option>
                <option>Hymn</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="block text-sm font-bold mb-1">Tonacja</label>
                <input className="w-full p-3 border rounded-lg" value={formData.key} onChange={e => setFormData({ ...formData, key: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Tempo (BPM)</label>
                <input className="w-full p-3 border rounded-lg" type="number" value={formData.tempo} onChange={e => setFormData({ ...formData, tempo: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Metrum</label>
              <select className="w-full p-3 border rounded-lg" value={formData.meter} onChange={e => setFormData({ ...formData, meter: e.target.value })} required>
                <option value="">---</option>
                {METER_OPTIONS.map(met => <option key={met}>{met}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-5 px-8 pt-1 pb-2">
            <div>
              <label className="block text-sm font-bold mb-1">Tekst pieśni: *</label>
              <textarea className="w-full p-3 border rounded-lg" rows={4} value={formData.lyrics} onChange={e => setFormData({ ...formData, lyrics: e.target.value })} required placeholder="Wpisz pełny tekst pieśni (zwrotki, refren, bridge)" />
            </div>
            <div className="mb-1">
              <label className="block text-sm font-bold mb-1">Format akordów:</label>
              <select className="w-full p-3 border rounded-lg" value={formData.chord_format} onChange={e => setFormData({ ...formData, chord_format: e.target.value })}>
                <option value="bars">Akordy w taktach (z kreską taktową)</option>
                <option value="chords_over_lyrics">Akordy nad tekstem</option>
              </select>
            </div>
            {formData.chord_format === 'bars' && (
              <div>
                <div className="flex gap-2 mb-3 items-center">
                  <span className="text-xs py-1 px-2 bg-yellow-50 border rounded text-yellow-600 border-yellow-100">Akordy w taktach</span>
                  <button type="button" className="text-xs px-3 py-1 rounded border-green-400 bg-green-100 text-green-900" onClick={()=>window.alert('Pomoc dla akordów z kreską taktową!')}>Pomoc</button>
                  <button type="button" className="text-xs px-3 py-1 rounded border bg-blue-100 text-blue-800 font-bold" onClick={()=>{
                    setFormData({...formData, chords_bars: formData.chords_bars + " |"});
                  }}>[ Dodaj kreskę taktową ]</button>
                </div>
                <div>
                  <label className="block text-xs mb-1 font-bold">Przykład zapisu (metrum 4/4):</label>
                  <textarea className="w-full bg-gray-50 border rounded font-mono text-xs p-2 mb-2" rows={3} readOnly value={chordExample}/>
                  <div className="text-xs text-gray-500">Wskazówki:<br/>
                    • Każdy takt oddzielony kreską |<br/>
                    • Puste takty: wpis tylko | lub spację między kreskami<br/>
                    • Zmiana akordu w takcie: D/F# G2 (środek taktu)<br/>
                    • Sekcje: zwr., ref., bridge, pre-chorus, outro<br/>
                  </div>
                </div>
                <textarea
                  className="w-full p-3 border rounded-lg font-mono mt-2"
                  rows={5}
                  value={formData.chords_bars}
                  onChange={e => setFormData({ ...formData, chords_bars: e.target.value })}
                  placeholder="Wprowadź akordy w taktach..."
                />
              </div>
            )}
            {formData.chord_format === 'chords_over_lyrics' && (
              <div>
                <label className="block text-sm font-bold mb-2 mt-3">Akordy nad tekstem</label>
                <textarea
                  id="chords-editor"
                  className="w-full p-3 border rounded-lg font-mono"
                  rows={5}
                  value={formData.lyrics_chords}
                  onChange={e => setFormData({ ...formData, lyrics_chords: e.target.value })}
                  placeholder="G   D/F#  C2  ...\nPanie Jezu..."
                />
                <div className="flex gap-2 mt-2">
                  <button type="button" className="bg-blue-600 text-white font-bold rounded px-3 py-1 text-xs" onClick={()=>insertSection('Zwrotka')}>+ Zwrotka</button>
                  <button type="button" className="bg-purple-600 text-white font-bold rounded px-3 py-1 text-xs" onClick={()=>insertSection('Refren')}>+ Refren</button>
                  <button type="button" className="bg-pink-500 text-white font-bold rounded px-3 py-1 text-xs" onClick={()=>insertSection('Bridge')}>+ Bridge</button>
                  <button type="button" className="bg-green-600 text-white font-bold rounded px-3 py-1 text-xs" onClick={()=>insertSection('Pre-chorus')}>+ Pre-chorus</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5 px-8 pt-1 pb-5">
            <div>
              <div className="flex gap-2 items-center mb-2">
                <span className="font-bold text-sm mr-2">Załączniki</span>
                <input multiple ref={fileInput} type="file" style={{display:'none'}} onChange={handleFileChange}/>
                <button type="button" onClick={()=>fileInput.current.click()} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Wybierz pliki</button>
              </div>
              <div className="mb-2 text-xs text-gray-600">Nie zaznaczono żadnych plików</div>
              {Array.isArray(formData.attachments) && formData.attachments.length > 0 && (
                <div className="mb-2 text-xs">
                  <div className="font-bold">Istniejące załączniki:</div>
                  {formData.attachments.map((f, idx) => (
                    <div key={idx} className="flex gap-2 items-center mt-1">
                      <span>{f.name}</span>
                      <span className="text-gray-500 ml-1">({f.size > 1024*1024 ? (f.size/1024/1024).toFixed(1)+" MB" : (f.size/1024).toFixed(0)+" KB"})</span>
                      <button type="button" className="text-xs text-red-600 hover:underline ml-2" onClick={()=>removeFile(idx)}>usuń</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Nuty (link lub nazwa pliku PDF)</label>
              <input className="w-full p-3 border rounded-lg" value={formData.sheet_music_url || ""} onChange={e => setFormData({...formData, sheet_music_url: e.target.value})} placeholder="https://... lub nazwa pliku PDF" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2">Tagi (oddziel przecinkami)</label>
              <input className="w-full p-3 border rounded-lg" value={formData.tags.join(", ")} onChange={e => handleTags(e.target.value)} placeholder="uwielbienie, szybka, niedzielna, popularna" />
              <div className="flex flex-wrap gap-2 mt-1 text-xs">
                {TAG_PRESETS.map(tag =>
                  <span key={tag} onClick={()=>handleTags(formData.tags.concat([tag]).join(", "))} className="bg-blue-50 px-2 py-1 rounded cursor-pointer text-blue-800 border hover:bg-blue-100">+{tag}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 px-8 pb-6">
            <button type="button" onClick={onCancel} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Anuluj</button>
            <button type="submit" className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition">Zapisz</button>
          </div>
        </form>
      </div>
    </div>
  );
}
