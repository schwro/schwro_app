import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Trash, Save, ArrowLeft } from 'lucide-react';

export default function ProgramEditor() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('main');
  const [program, setProgram] = useState({
    date: new Date().toISOString().split('T')[0],
    schedule: [],
    atmosfera_team: { przygotowanie: '', witanie: '' },
    produkcja: { naglosnienie: '', propresenter: '', social: '' },
    scena: { prowadzenie: '', czytanie: '', kazanie: '', modlitwa: '', wieczerza: '', ogloszenia: '' },
    szkolka: { mlodsza: '', srednia: '', starsza: '' },
    zespol: { lider: '', piano: '', gitara: '', bas: '', perkusja: '', wokale: '' }
  });
  
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    supabase.from('songs').select('id, title, key').then(({ data }) => setSongs(data || []));
  }, []);

  const handleSave = async () => {
    const { error } = await supabase.from('programs').insert([program]);
    if (error) alert('Błąd: ' + error.message);
    else navigate('/');
  };

  const addScheduleRow = () => {
    setProgram(prev => ({
      ...prev,
      schedule: [...prev.schedule, { id: Date.now(), element: '', person: '', details: '', songIds: [] }]
    }));
  };

  const updateScheduleRow = (id, field, value) => {
    setProgram(prev => ({
      ...prev,
      schedule: prev.schedule.map(row => row.id === id ? { ...row, [field]: value } : row)
    }));
  };

  const removeScheduleRow = (id) => {
    setProgram(prev => ({
      ...prev,
      schedule: prev.schedule.filter(row => row.id !== id)
    }));
  };

  const updateNestedField = (section, field, value) => {
    setProgram(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      {/* NAGŁÓWEK */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Nowy Program Nabożeństwa</h1>
        </div>
        <div className="flex gap-4 items-center">
          <input 
            type="date" 
            className="p-2 border rounded-md font-medium"
            value={program.date} 
            onChange={e => setProgram({...program, date: e.target.value})} 
          />
          <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 font-bold shadow-sm">
            <Save size={20} /> Zapisz Program
          </button>
        </div>
      </div>

      {/* ZAKŁADKI */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['main', 'atmosfera', 'produkcja', 'scena', 'szkolka', 'zespol'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === tab 
                ? 'bg-white text-pink-600 border-t-2 border-pink-600 shadow-sm' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {tab === 'main' ? 'Harmonogram Główny' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* TREŚĆ ZAKŁADEK */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        
        {/* 1. HARMONOGRAM GŁÓWNY */}
        {activeTab === 'main' && (
          <div>
            <table className="w-full mb-4">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="pb-3 w-1/4 font-semibold">ELEMENT</th>
                  <th className="pb-3 w-1/4 font-semibold">OSOBA</th>
                  <th className="pb-3 w-1/3 font-semibold">SZCZEGÓŁY / PIEŚNI</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {program.schedule.map(row => (
                  <tr key={row.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <input 
                        list="elements" 
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-100 outline-none"
                        placeholder="Wybierz lub wpisz..."
                        value={row.element}
                        onChange={e => updateScheduleRow(row.id, 'element', e.target.value)}
                      />
                      <datalist id="elements">
                        <option value="Wstęp" /><option value="Uwielbienie" /><option value="Kazanie" />
                        <option value="Ogłoszenia" /><option value="Wieczerza" /><option value="Kolekta" />
                      </datalist>
                    </td>
                    <td className="py-3 pr-4">
                      <input 
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-100 outline-none"
                        placeholder="Osoba odpowiedzialna"
                        value={row.person}
                        onChange={e => updateScheduleRow(row.id, 'person', e.target.value)}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      {row.element === 'Uwielbienie' ? (
                        <div className="space-y-2">
                          <select 
                            className="w-full p-2 border rounded bg-pink-50 text-pink-800 font-medium"
                            onChange={e => {
                              const id = parseInt(e.target.value);
                              if(id && !row.songIds.includes(id)) {
                                updateScheduleRow(row.id, 'songIds', [...row.songIds, id]);
                              }
                            }}
                          >
                            <option value="">+ Dodaj pieśń z bazy...</option>
                            {songs.map(s => <option key={s.id} value={s.id}>{s.title} ({s.key})</option>)}
                          </select>
                          <div className="flex flex-wrap gap-2">
                            {row.songIds?.map(sid => {
                              const song = songs.find(s => s.id === sid);
                              if(!song) return null;
                              return (
                                <span key={sid} className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded text-sm">
                                  {song.title}
                                  <button 
                                    onClick={() => updateScheduleRow(row.id, 'songIds', row.songIds.filter(id => id !== sid))}
                                    className="hover:text-red-600 font-bold ml-1"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <textarea 
                          rows="1"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-100 outline-none resize-none"
                          placeholder="Dodatkowe informacje..."
                          value={row.details}
                          onChange={e => updateScheduleRow(row.id, 'details', e.target.value)}
                        />
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <button onClick={() => removeScheduleRow(row.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button 
              onClick={addScheduleRow}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={20} /> Dodaj nowy element programu
            </button>
          </div>
        )}

        {/* 2. POZOSTAŁE ZAKŁADKI - FORMULARZE */}
        {activeTab !== 'main' && (
          <div className="grid grid-cols-2 gap-6">
            {Object.keys(program[activeTab.replace('atmosfera', 'atmosfera_team')]).map(field => (
              <div key={field}>
                <label className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide">
                  {field.replace('_', ' ')}
                </label>
                <input
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                  value={program[activeTab.replace('atmosfera', 'atmosfera_team')][field]}
                  onChange={e => updateNestedField(activeTab.replace('atmosfera', 'atmosfera_team'), field, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
