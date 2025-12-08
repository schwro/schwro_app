import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase'; 
import { 
  Plus, Search, Trash2, X, Calendar, User, 
  Check, UserX, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, HeartHandshake
} from 'lucide-react';

// --- UI COMPONENTS (PORTALS) ---

function useDropdownPosition(triggerRef, isOpen) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      };
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen]);

  return coords;
}

const CustomDatePicker = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const triggerRef = useRef(null);
  const coords = useDropdownPosition(triggerRef, isOpen);

  useEffect(() => { if (value) setViewDate(new Date(value)); }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && !e.target.closest('.portal-datepicker')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleDayClick = (day) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const monthName = viewDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const startDay = (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7;

  return (
    <div className="relative w-full">
      {label && <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 ml-1">{label}</label>}
      <div 
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm cursor-pointer flex justify-between items-center transition-all
          ${isOpen ? 'border-pink-500 ring-2 ring-pink-500/20 dark:border-pink-400' : 'border-gray-200/50 dark:border-gray-700/50 hover:border-pink-300 dark:hover:border-pink-600'}
        `}
      >
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={16} className="text-gray-400" />
          <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
            {value ? new Date(value).toLocaleDateString('pl-PL') : 'Wybierz datę'}
          </span>
        </div>
      </div>

      {isOpen && createPortal(
        <div 
          className="portal-datepicker fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-100 w-[280px]"
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="flex justify-between items-center mb-4">
            <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1))); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><ChevronLeft size={18} className="text-gray-600 dark:text-gray-400"/></button>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize">{monthName}</span>
            <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1))); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><ChevronRight size={18} className="text-gray-600 dark:text-gray-400"/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Pn','Wt','Śr','Cz','Pt','So','Nd'].map(d => <div key={d} className="text-[10px] font-bold text-gray-400 uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isSelected = value === dateStr;
              return (
                <button
                  key={day}
                  onClick={(e) => { e.stopPropagation(); handleDayClick(day); }}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition ${isSelected ? 'bg-pink-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const TableMultiSelect = ({ options, value, onChange, absentMembers = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const coords = useDropdownPosition(triggerRef, isOpen);
  const selectedItems = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && !e.target.closest('.portal-multiselect')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleSelection = (name, isAbsent) => {
    if (isAbsent) return;
    let newSelection;
    if (selectedItems.includes(name)) newSelection = selectedItems.filter(i => i !== name);
    else newSelection = [...selectedItems, name];
    onChange(newSelection.join(', '));
  };

  return (
    <div className="relative w-full">
      <div 
        ref={triggerRef}
        className="w-full min-h-[32px] px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs cursor-pointer flex flex-wrap gap-1 items-center hover:border-pink-300 dark:hover:border-pink-500 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItems.length === 0 ? (
          <span className="text-gray-400 dark:text-gray-500 text-[10px] italic">Wybierz...</span>
        ) : (
          selectedItems.map((item, idx) => (
            <span key={idx} className="bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-1.5 py-0.5 rounded text-[10px] border border-pink-100 dark:border-pink-800 whitespace-nowrap">
              {item}
            </span>
          ))
        )}
      </div>

      {isOpen && createPortal(
        <div 
          className="portal-multiselect fixed z-[9999] w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100"
          style={{ top: coords.top, left: coords.left }}
        >
          {options.map((person) => {
            const isSelected = selectedItems.includes(person.full_name);
            const isAbsent = absentMembers.includes(person.full_name);
            return (
              <div 
                key={person.id}
                className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between transition 
                  ${isAbsent ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'hover:bg-pink-50 dark:hover:bg-pink-900/20 text-gray-700 dark:text-gray-300'}
                  ${isSelected ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-medium' : ''}
                `}
                onClick={() => toggleSelection(person.full_name, isAbsent)}
              >
                <span className={isAbsent ? 'line-through decoration-gray-400 dark:decoration-gray-600' : ''}>
                  {person.full_name}
                </span>
                {isSelected && !isAbsent && <Check size={12} />}
                {isAbsent && <UserX size={12} className="text-red-300 dark:text-red-400" />}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};

// --- TABLE COMPONENT ---

const ScheduleTable = ({ programs, team, onUpdateProgram }) => {
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
    return new Date(dateString).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const updateRole = async (programId, field, value) => {
    const programToUpdate = programs.find(p => p.id === programId);
    if (!programToUpdate) return;
    const currentData = programToUpdate.atmosfera_team || {};
    const updatedData = { ...currentData, [field]: value };
    await onUpdateProgram(programId, { atmosfera_team: updatedData });
  };

  const updateNotes = async (programId, value) => {
     const programToUpdate = programs.find(p => p.id === programId);
     if (!programToUpdate) return;
     const currentData = programToUpdate.atmosfera_team || {};
     const updatedData = { ...currentData, notatki: value }; // Dodajemy pole notatki, jeśli nie istnieje w schemacie to trzeba dodać w bazie lub JSON
     await onUpdateProgram(programId, { atmosfera_team: updatedData });
  };

  return (
    <div className="space-y-4">
      {sortedMonths.map(monthKey => {
        const isExpanded = expandedMonths[monthKey];
        return (
          <div key={monthKey} className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm relative z-0 transition-all duration-300 ${isExpanded ? 'mb-8' : 'mb-0'}`}>
            <button 
              onClick={() => toggleMonth(monthKey)}
              className={`w-full px-6 py-4 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 flex justify-between items-center transition border-b border-gray-100 dark:border-gray-700 ${isExpanded ? 'rounded-t-2xl' : 'rounded-2xl'}`}
            >
              <span className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wider">{formatMonthName(monthKey)}</span>
              {isExpanded ? <ChevronUp size={18} className="text-gray-500 dark:text-gray-400"/> : <ChevronDown size={18} className="text-gray-500 dark:text-gray-400"/>}
            </button>
            
            {isExpanded && (
              <div className="overflow-visible pb-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase">
                      <th className="p-3 font-semibold w-24 min-w-[90px]">Data</th>
                      <th className="p-3 font-semibold min-w-[130px]">Przygotowanie</th>
                      <th className="p-3 font-semibold min-w-[130px]">Witanie</th>
                      <th className="p-3 font-semibold min-w-[150px]">Notatki</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700 relative">
                    {groupedPrograms[monthKey]
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((prog) => (
                        <tr key={prog.id} className="hover:bg-white/60 dark:hover:bg-gray-700/30 transition relative">
                          <td className="p-3 font-medium text-gray-700 dark:text-gray-300 font-mono text-xs">
                            {formatDateShort(prog.date)}
                          </td>
                          <td className="p-2 relative">
                            <TableMultiSelect 
                              options={team} 
                              value={prog.atmosfera_team?.przygotowanie || ''} 
                              onChange={(val) => updateRole(prog.id, 'przygotowanie', val)}
                            />
                          </td>
                          <td className="p-2 relative">
                            <TableMultiSelect 
                              options={team} 
                              value={prog.atmosfera_team?.witanie || ''} 
                              onChange={(val) => updateRole(prog.id, 'witanie', val)}
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              className="w-full bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-pink-500 dark:focus:border-pink-400 text-xs p-1 outline-none transition placeholder-gray-300 dark:placeholder-gray-600 text-gray-700 dark:text-gray-300"
                              placeholder="Wpisz..."
                              defaultValue={prog.atmosfera_team?.notatki || ''}
                              onBlur={(e) => updateNotes(prog.id, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
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

// --- MAIN MODULE ---

export default function AtmosferaTeamModule() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [team, setTeam] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({ id: null, full_name: '', role: 'Atmosfera', email: '', phone: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Zakładam, że używamy tej samej tabeli media_team lub nowej atmosfera_team. 
      // Jeśli nowej, trzeba zmienić nazwę tabeli. Tutaj używam 'atmosfera_team_members' (nowa tabela) lub 'media_team' z filtrowaniem?
      // Zróbmy nową tabelę 'atmosfera_team_members' dla porządku, albo użyjmy 'media_team' jeśli to jedna pula ludzi.
      // W Twoim opisie nie ma info o bazie, więc założę tabelę 'atmosfera_members'.
      
      let { data: teamData, error: teamError } = await supabase.from('atmosfera_members').select('*').order('full_name');
      
      // Fallback: jeśli tabela nie istnieje, spróbujmy pobrać pustą listę żeby nie wywalić błędu
      if (teamError && teamError.code === '42P01') { // undefined table
         console.warn("Tabela atmosfera_members nie istnieje. Używam pustej listy.");
         teamData = [];
      } else if (teamError) throw teamError;

      const { data: progData, error: progError } = await supabase
        .from('programs')
        .select('*')
        .order('date', { ascending: false });

      if (progError) throw progError;
      
      setTeam(teamData || []);
      setPrograms(progData || []);
    } catch (err) {
      console.error('Błąd:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleProgramUpdate = async (id, updates) => {
    setPrograms(prev => prev.map(p => {
      if (p.id === id) {
        if (updates.atmosfera_team) {
          return { ...p, ...updates, atmosfera_team: { ...p.atmosfera_team, ...updates.atmosfera_team } };
        }
        return { ...p, ...updates };
      }
      return p;
    }));
    await supabase.from('programs').update(updates).eq('id', id);
  };

  const saveMember = async () => {
    try {
      if (!memberForm.full_name.trim()) return alert('Imię wymagane');
      
      if (memberForm.id) {
        const { error } = await supabase.from('atmosfera_members').update(memberForm).eq('id', memberForm.id);
        if (error) throw error;
      } else {
        const { id, ...rest } = memberForm;
        const { error } = await supabase.from('atmosfera_members').insert([rest]);
        if (error) throw error;
      }
      setShowMemberModal(false);
      fetchData();
    } catch (err) {
      alert('Błąd zapisu (sprawdź czy tabela atmosfera_members istnieje): ' + err.message);
    }
  };

  const deleteMember = async (id) => {
    if (!confirm('Usunąć?')) return;
    try {
      const { error } = await supabase.from('atmosfera_members').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  if (loading) return <div className="p-10 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 dark:border-pink-400 mx-auto"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
          <HeartHandshake size={40} className="text-pink-600 dark:text-pink-400" />
          Atmosfera Team
        </h1>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
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
      </div>

      {/* GRAFIK */}
      {activeTab === 'schedule' && (
      <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 relative z-[50] transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">Grafik</h2>
        </div>
        <ScheduleTable
          programs={programs}
          team={team}
          onUpdateProgram={handleProgramUpdate}
        />
      </section>
      )}

      {/* CZŁONKOWIE */}
      {activeTab === 'members' && (
      <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 relative z-[30] transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">Członkowie ({team.length})</h2>
          <button onClick={() => { setMemberForm({ id: null, full_name: '', role: 'Atmosfera', email: '', phone: '' }); setShowMemberModal(true); }} className="bg-gradient-to-r from-pink-600 to-orange-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"><Plus size={18}/> Dodaj</button>
        </div>
        <div className="bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-pink-50/80 to-orange-50/80 dark:from-pink-900/20 dark:to-orange-900/20 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200/50 dark:border-gray-700/50">
              <tr><th className="p-4">Imię i nazwisko</th><th className="p-4">Rola</th><th className="p-4">Email</th><th className="p-4">Telefon</th><th className="p-4 text-right">Akcje</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {team.map(m => (
                <tr key={m.id} className="hover:bg-pink-50/30 dark:hover:bg-pink-900/10 transition text-gray-700 dark:text-gray-300">
                  <td className="p-4 font-medium">{m.full_name}</td><td className="p-4">{m.role}</td><td className="p-4">{m.email}</td><td className="p-4">{m.phone}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setMemberForm(m); setShowMemberModal(true); }} className="text-pink-600 dark:text-pink-400 font-medium">Edytuj</button>
                    <button onClick={() => deleteMember(m.id)} className="text-red-500 dark:text-red-400 font-medium">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {/* MODAL CZŁONKA */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] transition-opacity">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20 dark:border-gray-700/50 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-xl text-gray-800 dark:text-gray-200">{memberForm.id ? 'Edytuj członka' : 'Nowy członek'}</h3>
              <button onClick={() => setShowMemberModal(false)} className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl transition"><X size={20} className="text-gray-500 dark:text-gray-400"/></button>
            </div>
            <div className="space-y-4">
              <input className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-gray-100" placeholder="Imię i nazwisko *" value={memberForm.full_name} onChange={e => setMemberForm({...memberForm, full_name: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-gray-100" placeholder="Rola (np. Atmosfera)" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-gray-100" placeholder="Email" type="email" value={memberForm.email} onChange={e => setMemberForm({...memberForm, email: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-gray-100" placeholder="Telefon" value={memberForm.phone} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowMemberModal(false)} className="px-5 py-2.5 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300">Anuluj</button>
                <button onClick={saveMember} className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition font-medium">Zapisz</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
