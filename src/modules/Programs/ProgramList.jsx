import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FileText, Plus } from 'lucide-react';
import { generatePDF } from '../../lib/utils';

export default function ProgramList() {
  const [programs, setPrograms] = useState([]);
  const [songsMap, setSongsMap] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const {  progs } = await supabase.from('programs').select('*').order('date', { ascending: false });
    const {  songs } = await supabase.from('songs').select('*');
    
    setPrograms(progs || []);
    const map = {};
    songs?.forEach(s => map[s.id] = s);
    setSongsMap(map);
  }

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Programy Nabożeństw</h1>
        <Link to="/programs/new" className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={20} /> Nowy Program
        </Link>
      </div>
      
      <div className="grid gap-4">
        {programs.map(program => (
          <div key={program.id} className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-pink-900">
                {new Date(program.date).toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <p className="text-gray-500">Elementy: {program.schedule?.length || 0}</p>
            </div>
            
            <button 
              onClick={() => generatePDF(program, songsMap)}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
            >
              <FileText size={18} /> PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
