import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, Trash2, X, FileText, Calendar, Check, UserX, 
  ChevronUp, ChevronDown, Users, BookOpen, GraduationCap,
  MapPin, Baby, User, Upload, UserPlus, Link as LinkIcon, Edit, Loader2
} from 'lucide-react';

// --- KOMPONENTY UI ---

const CustomSelect = ({ options, value, onChange, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div onClick={() => setIsOpen(!isOpen)} className="w-full p-3 rounded-xl border border-gray-200 bg-white cursor-pointer flex justify-between items-center hover:border-pink-400 transition text-sm">
        <div className="flex items-center gap-2 text-gray-700 overflow-hidden">
          {Icon && <Icon size={16} className="text-gray-400 shrink-0"/>}
          <span className={`truncate ${!selectedLabel ? 'text-gray-400' : ''}`}>{selectedLabel || placeholder || 'Wybierz...'}</span>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}/>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((opt) => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`p-3 text-sm cursor-pointer hover:bg-pink-50 transition flex items-center justify-between ${String(value) === String(opt.value) ? 'bg-pink-50 text-pink-600 font-medium' : 'text-gray-700'}`}>
              {opt.label}
              {String(value) === String(opt.value) && <Check size={14}/>}
            </div>
          ))}
          {options.length === 0 && <div className="p-3 text-gray-400 text-xs text-center">Brak opcji</div>}
        </div>
      )}
    </div>
  );
};

const TeacherMultiSelect = ({ teachers, selectedIds, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTeacher = (id) => {
    const newIds = selectedIds.includes(id) ? selectedIds.filter(tid => tid !== id) : [...selectedIds, id];
    onChange(newIds);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div onClick={() => setIsOpen(!isOpen)} className="w-full p-3 rounded-xl border border-gray-200 bg-white cursor-pointer min-h-[50px] flex flex-wrap gap-2 hover:border-pink-400 transition">
        {selectedIds.length === 0 && <span className="text-gray-400 text-sm pt-1">Wybierz nauczycieli...</span>}
        {selectedIds.map(id => {
          const teacher = teachers.find(t => t.id === id);
          return teacher ? (
            <span key={id} className="bg-pink-50 text-pink-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-pink-100">
              {teacher.full_name} <X size={12} className="cursor-pointer hover:text-pink-900" onClick={(e) => { e.stopPropagation(); toggleTeacher(id); }}/>
            </span>
          ) : null;
        })}
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {teachers.map(t => (
            <div key={t.id} onClick={() => toggleTeacher(t.id)} className={`p-3 text-sm hover:bg-gray-50 cursor-pointer flex justify-between items-center ${selectedIds.includes(t.id) ? 'bg-pink-50 text-pink-700 font-medium' : 'text-gray-700'}`}>
              <span>{t.full_name}</span>
              {selectedIds.includes(t.id) && <Check size={16}/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- GRAFIK (TableMultiSelect i AbsenceMultiSelect skrócone dla czytelności) ---
const TableMultiSelect = ({ options, value, onChange, absentMembers = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedItems = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
  useEffect(() => {
    function h(e) { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const t = (n, a) => { if(a)return; const s=selectedItems.includes(n)?selectedItems.filter(i=>i!==n):[...selectedItems,n]; onChange(s.join(', ')); };
  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="w-full min-h-[32px] px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs cursor-pointer flex flex-wrap gap-1 items-center hover:border-pink-300 transition" onClick={()=>setIsOpen(!isOpen)}>
        {selectedItems.length===0?<span className="text-gray-400 text-[10px] italic">Wybierz...</span>:selectedItems.map((i,x)=><span key={x} className="bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded text-[10px] border border-pink-100 whitespace-nowrap">{i}</span>)}
      </div>
      {isOpen && <div className="absolute z-[9999] left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">{options.map(p=><div key={p.id} className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between transition ${absentMembers.includes(p.full_name)?'bg-gray-50 text-gray-400 cursor-not-allowed':'hover:bg-pink-50 text-gray-700'} ${selectedItems.includes(p.full_name)?'bg-pink-50 text-pink-700 font-medium':''}`} onClick={()=>t(p.full_name, absentMembers.includes(p.full_name))}><span className={absentMembers.includes(p.full_name)?'line-through':''}>{p.full_name}</span>{selectedItems.includes(p.full_name)&&!absentMembers.includes(p.full_name)&&<Check size={12}/>}</div>)}</div>}
    </div>
  );
};
const AbsenceMultiSelect = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedItems = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
  useEffect(() => {
    function h(e) { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false); }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const t = (n) => { const s=selectedItems.includes(n)?selectedItems.filter(i=>i!==n):[...selectedItems,n]; onChange(s.join(', ')); };
  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="w-full min-h-[32px] px-2 py-1 bg-white border border-red-200 rounded-lg text-xs cursor-pointer flex flex-wrap gap-1 items-center hover:border-red-300 transition" onClick={()=>setIsOpen(!isOpen)}>
        {selectedItems.length===0?<span className="text-gray-400 text-[10px] italic">Wybierz...</span>:selectedItems.map((i,x)=><span key={x} className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] border border-red-100 whitespace-nowrap flex items-center gap-1">{i}</span>)}
      </div>
      {isOpen && <div className="absolute z-[9999] left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">{options.map(p=><div key={p.id} className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between hover:bg-red-50 transition ${selectedItems.includes(p.full_name)?'bg-red-50 text-red-700 font-medium':'text-gray-700'}`} onClick={()=>t(p.full_name)}><span>{p.full_name}</span>{selectedItems.includes(p.full_name)&&<UserX size={12}/>}</div>)}</div>}
    </div>
  );
};

const ScheduleTable = ({ programs, teachers, groups, onUpdateProgram }) => {
  const [expandedMonths, setExpandedMonths] = useState({});
  const groupedPrograms = programs.reduce((acc, prog) => {
    if (!prog.date) return acc;
    const d = new Date(prog.date);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[k]) acc[k] = []; acc[k].push(prog); return acc;
  }, {});
  const sortedMonths = Object.keys(groupedPrograms).sort().reverse();
  useEffect(() => { setExpandedMonths(prev => ({ ...prev, [new Date().toISOString().slice(0, 7)]: true })); }, []);
  const dynamicColumns = groups.map(g => ({ id: g.id, label: g.name }));

  const updateRole = async (pid, gid, val) => {
    const p = programs.find(x => x.id === pid); if(!p) return;
    const u = { ...p.szkolka, [gid]: val }; await onUpdateProgram(pid, { szkolka: u });
  };
  const updateField = async (pid, f, val) => {
    const p = programs.find(x => x.id === pid); if(!p) return;
    const u = { ...p.szkolka, [f]: val }; await onUpdateProgram(pid, { szkolka: u });
  };

  return (
    <div className="space-y-4">
      {sortedMonths.map(monthKey => {
        const isExpanded = expandedMonths[monthKey];
        return (
          <div key={monthKey} className={`bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm transition-all duration-300 ${isExpanded ? 'mb-8' : 'mb-0'}`}>
            <button onClick={() => setExpandedMonths(p => ({...p, [monthKey]: !p[monthKey]}))} className={`w-full px-6 py-4 bg-white/50 hover:bg-white/80 flex justify-between items-center transition border-b border-gray-100 ${isExpanded ? 'rounded-t-2xl' : 'rounded-2xl'}`}>
              <span className="font-bold text-gray-800 text-sm uppercase tracking-wider">{new Date(monthKey).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</span>
              {isExpanded ? <ChevronUp size={18} className="text-gray-500"/> : <ChevronDown size={18} className="text-gray-500"/>}
            </button>
            {isExpanded && (
              <div className="overflow-visible pb-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase">
                      <th className="p-3 font-semibold w-24 min-w-[90px]">Data</th>
                      <th className="p-3 font-semibold min-w-[150px] text-pink-600">Temat lekcji</th> {/* PRZENIESIONO TUTAJ */}
                      {dynamicColumns.map(c => <th key={c.id} className="p-3 font-semibold min-w-[130px]">{c.label}</th>)}
                      <th className="p-3 font-semibold min-w-[130px] text-red-500">Absencja</th>
                      <th className="p-3 font-semibold min-w-[150px]">Notatki</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {groupedPrograms[monthKey].sort((a, b) => new Date(a.date) - new Date(b.date)).map(prog => {
                      const abs = prog.szkolka?.absencja ? prog.szkolka.absencja.split(',').map(s=>s.trim()).filter(Boolean) : [];
                      return (
                        <tr key={prog.id} className="hover:bg-white/60 transition relative">
                          <td className="p-3 font-medium text-gray-700 font-mono text-xs">{new Date(prog.date).toLocaleDateString('pl-PL', {day:'2-digit', month:'2-digit', year:'numeric'})}</td>
                          <td className="p-2"><input className="w-full bg-transparent border-b border-transparent hover:border-pink-300 focus:border-pink-500 text-xs p-1 outline-none font-semibold text-pink-700 placeholder-pink-200" placeholder="Temat..." defaultValue={prog.szkolka?.temat || ''} onBlur={e => updateField(prog.id, 'temat', e.target.value)} /></td>
                          {dynamicColumns.map(c => (
                            <td key={c.id} className="p-2 relative"><TableMultiSelect options={teachers} value={prog.szkolka?.[c.id] || ''} onChange={v => updateRole(prog.id, c.id, v)} absentMembers={abs} /></td>
                          ))}
                          <td className="p-2 relative"><AbsenceMultiSelect options={teachers} value={prog.szkolka?.absencja || ''} onChange={v => updateField(prog.id, 'absencja', v)} /></td>
                          <td className="p-2"><input className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-pink-500 text-xs p-1 outline-none" placeholder="Notatki..." defaultValue={prog.szkolka?.notatki || ''} onBlur={e => updateField(prog.id, 'notatki', e.target.value)} /></td>
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

// --- GŁÓWNY MODUŁ ---

export default function KidsModule() {
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [studentFilter, setStudentFilter] = useState('');

  // Modale
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showGroupStudentsModal, setShowGroupStudentsModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [showGlobalStudentModal, setShowGlobalStudentModal] = useState(false);
  
  // Formularze
  const [teacherForm, setTeacherForm] = useState({ id: null, full_name: '', role: 'Nauczyciel', email: '', phone: '' });
  const [groupForm, setGroupForm] = useState({ id: null, name: '', teacher_ids: [], room: '', age_range: '' });
  const [globalStudentForm, setGlobalStudentForm] = useState({ id: null, full_name: '', birth_year: '', parent_info: '', notes: '', group_id: null });
  const [materialForm, setMaterialForm] = useState({ title: '', type: 'Lekcja', attachment: null });
  
  const [currentGroup, setCurrentGroup] = useState(null);
  const [attachStudentId, setAddStudentId] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: t } = await supabase.from('kids_teachers').select('*').order('full_name');
      const { data: g } = await supabase.from('kids_groups').select('*').order('created_at');
      const { data: s } = await supabase.from('kids_students').select('*').order('full_name');
      const { data: p } = await supabase.from('programs').select('*').order('date', { ascending: false });

      setTeachers(t || []);
      setGroups(g || []);
      setStudents(s || []);
      setPrograms(p || []);
    } catch (err) {
      console.error('Błąd:', err);
    }
    setLoading(false);
  }

  // --- NAUCZYCIELE ---
  const saveTeacher = async () => {
    if (!teacherForm.full_name) return alert('Podaj imię i nazwisko');
    if (teacherForm.id) await supabase.from('kids_teachers').update(teacherForm).eq('id', teacherForm.id);
    else await supabase.from('kids_teachers').insert([{ ...teacherForm, id: undefined }]);
    setShowTeacherModal(false); fetchData();
  };
  const deleteTeacher = async (id) => {
    if (confirm('Usunąć?')) { await supabase.from('kids_teachers').delete().eq('id', id); fetchData(); }
  };

  // --- GRUPY ---
  const saveGroup = async () => {
    if (!groupForm.name) return alert('Podaj nazwę grupy');
    const payload = { 
      name: groupForm.name, 
      room: groupForm.room, 
      age_range: groupForm.age_range, 
      teacher_ids: groupForm.teacher_ids
    };
    try {
      if (groupForm.id) await supabase.from('kids_groups').update(payload).eq('id', groupForm.id);
      else await supabase.from('kids_groups').insert([{ ...payload, materials: [] }]);
      setShowGroupModal(false); fetchData();
    } catch (err) { alert('Błąd: ' + err.message); }
  };
  const deleteGroup = async (id) => {
    if (confirm('Usunąć grupę?')) { await supabase.from('kids_groups').delete().eq('id', id); fetchData(); }
  };

  // --- UCZNIOWIE ---
  const saveGlobalStudent = async () => {
    if (!globalStudentForm.full_name) return alert('Podaj imię i nazwisko');
    const payload = {
      full_name: globalStudentForm.full_name,
      birth_year: globalStudentForm.birth_year,
      parent_info: globalStudentForm.parent_info,
      notes: globalStudentForm.notes,
      group_id: globalStudentForm.group_id ? parseInt(globalStudentForm.group_id) : null
    };
    try {
      if (globalStudentForm.id) await supabase.from('kids_students').update(payload).eq('id', globalStudentForm.id);
      else await supabase.from('kids_students').insert([payload]);
      setShowGlobalStudentModal(false); fetchData();
    } catch (err) { alert('Błąd: ' + err.message); }
  };
  const deleteStudent = async (id) => {
    if(confirm('Usunąć ucznia z bazy?')) { await supabase.from('kids_students').delete().eq('id', id); fetchData(); }
  };
  const openEditStudent = (s) => {
    setGlobalStudentForm({ id: s.id, full_name: s.full_name, birth_year: s.birth_year, parent_info: s.parent_info, notes: s.notes, group_id: s.group_id });
    setShowGlobalStudentModal(true);
  };
  const attachStudentToGroup = async () => {
    if (!attachStudentId) return alert('Wybierz ucznia');
    await supabase.from('kids_students').update({ group_id: currentGroup.id }).eq('id', attachStudentId);
    setAddStudentId(''); fetchData();
  };
  const detachStudentFromGroup = async (studentId) => {
    await supabase.from('kids_students').update({ group_id: null }).eq('id', studentId); fetchData();
  };

  // --- MATERIAŁY (Z UPLOADEM) ---
  const handleFileUpload = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage.from('kids-materials').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('kids-materials').getPublicUrl(filePath);
    return { url: data.publicUrl, name: file.name };
  };

  const addMaterial = async () => {
    if (!materialForm.title) return alert('Podaj nazwę materiału');
    setUploading(true);
    
    try {
      let attachmentData = null;
      if (materialForm.attachment) {
        attachmentData = await handleFileUpload(materialForm.attachment);
      }

      const newMaterial = { 
        id: Date.now(), 
        title: materialForm.title, 
        type: materialForm.type, 
        date: new Date().toISOString(),
        attachmentUrl: attachmentData?.url || null,
        attachmentName: attachmentData?.name || null
      };

      const updatedMaterials = [...(currentGroup.materials || []), newMaterial];
      setCurrentGroup({ ...currentGroup, materials: updatedMaterials });
      await supabase.from('kids_groups').update({ materials: updatedMaterials }).eq('id', currentGroup.id);
      
      setMaterialForm({ title: '', type: 'Lekcja', attachment: null });
      fetchData();
    } catch (err) {
      alert('Błąd dodawania materiału: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteMaterial = async (materialId) => {
    if(!confirm('Usunąć materiał?')) return;
    const updatedMaterials = currentGroup.materials.filter(m => m.id !== materialId);
    setCurrentGroup({ ...currentGroup, materials: updatedMaterials });
    await supabase.from('kids_groups').update({ materials: updatedMaterials }).eq('id', currentGroup.id);
    fetchData();
  };

  // --- GRAFIK ---
  const handleProgramUpdate = async (id, updates) => {
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, ...updates, szkolka: { ...p.szkolka, ...updates.szkolka } } : p));
    await supabase.from('programs').update(updates).eq('id', id);
  };

  const filteredStudents = students.filter(s => s.full_name.toLowerCase().includes(studentFilter.toLowerCase()));
  const groupStudents = currentGroup ? students.filter(s => s.group_id === currentGroup.id) : [];
  const availableStudents = students.filter(s => s.group_id !== (currentGroup?.id || -1));

  const groupOptions = groups.map(g => ({ value: g.id, label: g.name }));
  const availableStudentOptions = availableStudents.map(s => ({ value: s.id, label: s.full_name }));
  const materialTypeOptions = ['Lekcja', 'Kolorowanka', 'Gra', 'Film', 'Książka', 'Inne'].map(t => ({ value: t, label: t }));

  if (loading) return <div className="p-10 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Małe SchWro</h1>
      </div>

      {/* 1. GRAFIK */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Grafik Nauczycieli</h2></div>
        <ScheduleTable programs={programs} teachers={teachers} groups={groups} onUpdateProgram={handleProgramUpdate} />
      </section>

      {/* 2. GRUPY */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Grupy Wiekowe</h2>
          <button onClick={() => { setGroupForm({ id: null, name: '', teacher_ids: [], room: '', age_range: '' }); setShowGroupModal(true); }} className="bg-gradient-to-r from-pink-600 to-orange-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"><Plus size={18}/> Dodaj grupę</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => {
            const teacherNames = (group.teacher_ids || []).map(tid => teachers.find(t => t.id === tid)?.full_name).filter(Boolean).join(', ');
            const studentCount = students.filter(s => s.group_id === group.id).length;
            return (
              <div key={group.id} className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-gray-800">{group.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => { setGroupForm(group); setShowGroupModal(true); }} className="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg"><FileText size={16}/></button>
                    <button onClick={() => deleteGroup(group.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                </div>
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><GraduationCap size={16} className="text-pink-500"/> <span className="font-medium">Nauczyciele:</span> {teacherNames || 'Brak'}</div>
                  <div className="flex items-center gap-2"><MapPin size={16} className="text-orange-500"/> <span className="font-medium">Sala:</span> {group.room || '-'}</div>
                  <div className="flex items-center gap-2"><Baby size={16} className="text-green-500"/> <span className="font-medium">Wiek:</span> {group.age_range || '-'}</div>
                </div>
                <div className="flex gap-2 border-t border-gray-100 pt-3 mt-2">
                  <button onClick={() => { setCurrentGroup(group); setShowGroupStudentsModal(true); }} className="flex-1 bg-pink-50 text-pink-700 text-xs font-bold py-2 rounded-xl hover:bg-pink-100 transition flex items-center justify-center gap-1"><Users size={14}/> Uczniowie ({studentCount})</button>
                  <button onClick={() => { setCurrentGroup(group); setShowMaterialsModal(true); }} className="flex-1 bg-orange-50 text-orange-700 text-xs font-bold py-2 rounded-xl hover:bg-orange-100 transition flex items-center justify-center gap-1"><BookOpen size={14}/> Materiały ({group.materials?.length || 0})</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. UCZNIOWIE (GLOBALNIE) */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Wszyscy Uczniowie ({filteredStudents.length})</h2>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-xl border border-gray-200/50 w-64">
              <Search size={16} className="text-gray-400"/>
              <input className="bg-transparent text-sm outline-none w-full" placeholder="Szukaj ucznia..." value={studentFilter} onChange={e => setStudentFilter(e.target.value)}/>
            </div>
            <button onClick={() => { setGlobalStudentForm({ id: null, full_name: '', birth_year: '', parent_info: '', notes: '', group_id: null }); setShowGlobalStudentModal(true); }} className="bg-gradient-to-r from-pink-600 to-orange-600 text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"><UserPlus size={18}/> Nowy uczeń</button>
          </div>
        </div>
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-pink-50/80 to-orange-50/80 text-gray-700 font-bold border-b border-gray-200/50">
              <tr><th className="p-4">Imię i nazwisko</th><th className="p-4">Wiek/Rocznik</th><th className="p-4">Rodzic/Opiekun</th><th className="p-4">Grupa</th><th className="p-4 text-right">Akcje</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {filteredStudents.map((s) => {
                const gName = groups.find(g => g.id === s.group_id)?.name || '-';
                return (
                  <tr key={s.id} className="hover:bg-pink-50/30 transition">
                    <td className="p-4 font-medium text-gray-800">{s.full_name}</td>
                    <td className="p-4 text-gray-600">{s.birth_year || '-'}</td>
                    <td className="p-4 text-gray-600">{s.parent_info || '-'}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${s.group_id ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-500'}`}>{gName}</span></td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => openEditStudent(s)} className="text-pink-600 font-medium hover:underline">Edytuj</button>
                      <button onClick={() => deleteStudent(s.id)} className="text-red-500 font-medium hover:underline">Usuń</button>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-400">Brak uczniów</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. NAUCZYCIELE */}
      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Nauczyciele ({teachers.length})</h2>
          <button onClick={() => { setTeacherForm({ id: null, full_name: '', role: 'Nauczyciel', email: '', phone: '' }); setShowTeacherModal(true); }} className="bg-gradient-to-r from-pink-600 to-orange-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"><Plus size={18}/> Dodaj nauczyciela</button>
        </div>
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-pink-50/80 to-orange-50/80 text-gray-700 font-bold border-b border-gray-200/50">
              <tr><th className="p-4">Imię i nazwisko</th><th className="p-4">Rola</th><th className="p-4">Email</th><th className="p-4 text-right">Akcje</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {teachers.map(t => (
                <tr key={t.id} className="hover:bg-pink-50/30 transition">
                  <td className="p-4 font-medium">{t.full_name}</td><td className="p-4">{t.role}</td><td className="p-4">{t.email}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setTeacherForm(t); setShowTeacherModal(true); }} className="text-pink-600 font-medium">Edytuj</button>
                    <button onClick={() => deleteTeacher(t.id)} className="text-red-500 font-medium">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- MODALE --- */}

      {/* MODAL GRUPY */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20">
            <div className="flex justify-between mb-6"><h3 className="font-bold text-xl">Grupa Wiekowa</h3><button onClick={() => setShowGroupModal(false)}><X/></button></div>
            <div className="space-y-4">
              <input className="w-full p-3 rounded-xl border" placeholder="Nazwa grupy" value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})} />
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nauczyciele</label><TeacherMultiSelect teachers={teachers} selectedIds={groupForm.teacher_ids || []} onChange={ids => setGroupForm({...groupForm, teacher_ids: ids})} /></div>
              <input className="w-full p-3 rounded-xl border" placeholder="Numer sali" value={groupForm.room} onChange={e => setGroupForm({...groupForm, room: e.target.value})} />
              <input className="w-full p-3 rounded-xl border" placeholder="Przedział wiekowy" value={groupForm.age_range} onChange={e => setGroupForm({...groupForm, age_range: e.target.value})} />
              <button onClick={saveGroup} className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold mt-4">Zapisz Grupę</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GLOBALNY UCZNIA */}
      {showGlobalStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20">
            <div className="flex justify-between mb-6"><h3 className="font-bold text-xl text-pink-700">{globalStudentForm.id ? 'Edytuj Ucznia' : 'Nowy Uczeń'}</h3><button onClick={() => setShowGlobalStudentModal(false)}><X/></button></div>
            <div className="space-y-4">
              <input className="w-full p-3 rounded-xl border" placeholder="Imię i nazwisko *" value={globalStudentForm.full_name} onChange={e => setGlobalStudentForm({...globalStudentForm, full_name: e.target.value})} />
              <input className="w-full p-3 rounded-xl border" placeholder="Wiek / Rocznik" value={globalStudentForm.birth_year} onChange={e => setGlobalStudentForm({...globalStudentForm, birth_year: e.target.value})} />
              <input className="w-full p-3 rounded-xl border" placeholder="Rodzic / Opiekun (kontakt)" value={globalStudentForm.parent_info} onChange={e => setGlobalStudentForm({...globalStudentForm, parent_info: e.target.value})} />
              <CustomSelect options={groupOptions} value={globalStudentForm.group_id} onChange={v => setGlobalStudentForm({...globalStudentForm, group_id: v})} placeholder="Przypisz do grupy (opcjonalne)" icon={Users} />
              <textarea className="w-full p-3 rounded-xl border resize-none" rows={3} placeholder="Uwagi..." value={globalStudentForm.notes} onChange={e => setGlobalStudentForm({...globalStudentForm, notes: e.target.value})} />
              <button onClick={saveGlobalStudent} className="w-full py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl font-bold mt-2">{globalStudentForm.id ? 'Zapisz zmiany' : 'Dodaj ucznia'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL W GRUPIE (PRZYPINANIE) */}
      {showGroupStudentsModal && currentGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-3xl p-6 border border-white/20 flex flex-col max-h-[80vh]">
            <div className="flex justify-between mb-4 pb-4 border-b"><h3 className="font-bold text-xl text-pink-700">Uczniowie: {currentGroup.name}</h3><button onClick={() => setShowGroupStudentsModal(false)}><X/></button></div>
            <div className="bg-pink-50 p-4 rounded-xl mb-4 flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-pink-700 uppercase mb-1 ml-1">Przypnij ucznia z bazy</label>
                <CustomSelect options={availableStudentOptions} value={attachStudentId} onChange={setAddStudentId} placeholder="Wybierz ucznia..." icon={UserPlus} />
              </div>
              <button onClick={attachStudentToGroup} className="bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-pink-700 h-[46px] flex items-center gap-2">Przypnij</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600"><tr><th className="p-3">Dziecko</th><th className="p-3">Wiek</th><th className="p-3">Kontakt</th><th className="p-3">Akcja</th></tr></thead>
                <tbody className="divide-y">
                  {groupStudents.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{s.full_name}</td><td className="p-3">{s.birth_year}</td><td className="p-3">{s.parent_info}</td>
                      <td className="p-3"><button onClick={() => detachStudentFromGroup(s.id)} className="text-red-500 hover:underline text-xs uppercase font-bold">Odłącz</button></td>
                    </tr>
                  ))}
                  {groupStudents.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-400">Brak uczniów w tej grupie</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MATERIAŁY */}
      {showMaterialsModal && currentGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl p-6 border border-white/20 flex flex-col max-h-[80vh]">
            <div className="flex justify-between mb-4 pb-4 border-b"><h3 className="font-bold text-xl text-orange-700">Materiały: {currentGroup.name}</h3><button onClick={() => setShowMaterialsModal(false)}><X/></button></div>
            <div className="bg-orange-50 p-4 rounded-xl mb-4 space-y-2">
              <input className="w-full p-3 rounded-xl border" placeholder="Nazwa materiału" value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} />
              <div className="flex gap-2 items-center">
                <div className="flex-1"><CustomSelect options={materialTypeOptions} value={materialForm.type} onChange={val => setMaterialForm({...materialForm, type: val})} icon={BookOpen}/></div>
                <input type="file" id="file-upload" className="hidden" onChange={e => setMaterialForm({...materialForm, attachment: e.target.files[0]})} />
                <button onClick={() => document.getElementById('file-upload').click()} className={`border px-4 rounded-xl flex items-center gap-2 h-[46px] transition ${materialForm.attachment ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-white border-orange-200 text-gray-600 hover:bg-gray-50'}`}>
                  <Upload size={16}/> {materialForm.attachment ? 'Plik wybrany' : 'Wybierz plik'}
                </button>
                <button onClick={addMaterial} disabled={uploading} className="bg-orange-600 text-white px-6 rounded-xl font-bold hover:bg-orange-700 h-[46px] flex items-center gap-2">{uploading ? <Loader2 className="animate-spin"/> : 'Dodaj'}</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {(currentGroup.materials || []).map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><BookOpen size={18}/></div>
                    <div><div className="font-bold text-gray-800">{m.title}</div><div className="text-xs text-gray-500">{m.type} • {new Date(m.date).toLocaleDateString('pl-PL')}</div></div>
                  </div>
                  <div className="flex gap-2">
                    {m.attachmentUrl && <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="text-orange-600 hover:bg-orange-50 p-2 rounded-lg" title="Pobierz"><LinkIcon size={18}/></a>}
                    <button onClick={() => deleteMaterial(m.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
              {(currentGroup.materials || []).length === 0 && <div className="text-center text-gray-400 p-4">Brak materiałów</div>}
            </div>
          </div>
        </div>
      )}

      {/* MODAL NAUCZYCIELA */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20">
            <div className="flex justify-between mb-6"><h3 className="font-bold text-xl">Nauczyciel</h3><button onClick={() => setShowTeacherModal(false)}><X/></button></div>
            <div className="space-y-4">
              <input className="w-full p-3 rounded-xl border" placeholder="Imię i nazwisko" value={teacherForm.full_name} onChange={e => setTeacherForm({...teacherForm, full_name: e.target.value})} />
              <input className="w-full p-3 rounded-xl border" placeholder="Rola" value={teacherForm.role} onChange={e => setTeacherForm({...teacherForm, role: e.target.value})} />
              <input className="w-full p-3 rounded-xl border" placeholder="Telefon" value={teacherForm.phone} onChange={e => setTeacherForm({...teacherForm, phone: e.target.value})} />
              <input className="w-full p-3 rounded-xl border" placeholder="Email" value={teacherForm.email} onChange={e => setTeacherForm({...teacherForm, email: e.target.value})} />
              <button onClick={saveTeacher} className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold mt-4">Zapisz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
