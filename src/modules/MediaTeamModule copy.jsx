import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Search, Trash2, X, FileText, Music, Calendar, Download, 
  AlertCircle, Paperclip, GripVertical, User, 
  LayoutGrid, List, CheckSquare, Filter, MessageSquare, Send
} from 'lucide-react';

const STATUSES = ['Do zrobienia', 'W trakcie', 'Gotowe'];

export default function MediaTeamModule() {
  const [team, setTeam] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  // --- STANY WIDOKU ---
  const [viewMode, setViewMode] = useState('kanban');
  const [filterScope, setFilterScope] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  const [memberForm, setMemberForm] = useState({ id: null, full_name: '', role: '', email: '', phone: '' });
  const [taskForm, setTaskForm] = useState({
    id: null,
    title: '',
    description: '',
    due_date: '',
    assigned_to: null,
    status: 'Do zrobienia',
    attachment: null
  });

  // --- KOMENTARZE ---
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  useEffect(() => {
    fetchData();
    getCurrentUser();
  }, []);

  async function getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setCurrentUserEmail(data.user.email);
    }
  }

  async function fetchData() {
    setLoading(true);
    setError(null);
    
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('media_team')
        .select('*')
        .order('full_name');
      
      if (teamError) throw new Error(`Błąd zespołu: ${teamError.message}`);
      
      const { data: tasksData, error: tasksError } = await supabase
        .from('media_tasks')
        .select('*')
        .order('due_date');
      
      if (tasksError) throw new Error(`Błąd zadań: ${tasksError.message}`);
      
      setTeam(teamData || []);
      setTasks(tasksData || []);
    } catch (err) {
      console.error('❌ Błąd pobierania danych:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- OBSŁUGA KOMENTARZY ---
  const fetchComments = async (taskId) => {
    if (!taskId) return;
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('media_task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Błąd pobierania komentarzy:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !taskForm.id) return;

    try {
      // Próbujemy znaleźć nazwę autora na podstawie maila w zespole
      const authorProfile = team.find(m => m.email === currentUserEmail);
      const authorName = authorProfile ? authorProfile.full_name : (currentUserEmail || 'Nieznany');

      const commentData = {
        task_id: taskForm.id,
        content: newComment.trim(),
        author_email: currentUserEmail,
        author_name: authorName
      };

      const { error } = await supabase
        .from('media_task_comments')
        .insert([commentData]);

      if (error) throw error;

      setNewComment('');
      fetchComments(taskForm.id);
    } catch (err) {
      console.error('Błąd dodawania komentarza:', err);
      alert('Nie udało się dodać komentarza');
    }
  };

  const openTaskModal = (task) => {
    setTaskForm(task || {
      id: null,
      title: '',
      description: '',
      due_date: '',
      assigned_to: null,
      status: 'Do zrobienia',
      attachment: null
    });
    
    if (task && task.id) {
      fetchComments(task.id);
    } else {
      setComments([]);
    }
    
    setShowTaskModal(true);
  };

  // --- FILTROWANIE ---
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (filterScope === 'mine') {
        const myMemberProfile = team.find(m => m.email === currentUserEmail);
        if (!myMemberProfile || task.assigned_to !== myMemberProfile.id) {
          return false;
        }
      }
      if (filterStatus === 'active') {
        if (task.status === 'Gotowe') return false;
      } else if (filterStatus === 'completed') {
        if (task.status !== 'Gotowe') return false;
      }
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  const toggleTaskCompletion = async (task) => {
    const newStatus = task.status === 'Gotowe' ? 'Do zrobienia' : 'Gotowe';
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);

    try {
      const { error } = await supabase
        .from('media_tasks')
        .update({ status: newStatus })
        .eq('id', task.id);
      if (error) throw error;
    } catch (err) {
      console.error('Błąd zmiany statusu:', err);
      fetchData();
    }
  };

  const saveMember = async () => {
    try {
      if (!memberForm.full_name.trim()) {
        alert('Imię i nazwisko jest wymagane');
        return;
      }
      if (memberForm.id) {
        const { error } = await supabase.from('media_team').update(memberForm).eq('id', memberForm.id);
        if (error) throw error;
      } else {
        const { id, ...rest } = memberForm;
        const { error } = await supabase.from('media_team').insert([rest]);
        if (error) throw error;
      }
      setShowMemberModal(false);
      await fetchData();
    } catch (err) {
      console.error('Błąd zapisywania członka:', err);
      alert('Błąd: ' + err.message);
    }
  };

  const deleteMember = async (id) => {
    if (confirm('Usunąć członka zespołu?')) {
      try {
        const { error } = await supabase.from('media_team').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
      } catch (err) {
        console.error('Błąd usuwania członka:', err);
        alert('Błąd: ' + err.message);
      }
    }
  };

  const saveTask = async () => {
    try {
      if (!taskForm.title.trim()) {
        alert('Tytuł zadania jest wymagany');
        return;
      }
      const taskData = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        due_date: taskForm.due_date || null,
        assigned_to: taskForm.assigned_to || null,
        status: taskForm.status,
        attachment: taskForm.attachment
      };

      let savedTaskId = taskForm.id;

      if (taskForm.id) {
        const { error } = await supabase.from('media_tasks').update(taskData).eq('id', taskForm.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('media_tasks').insert([taskData]).select();
        if (error) throw error;
        if (data && data[0]) savedTaskId = data[0].id;
      }
      
      // Jeśli to było nowe zadanie, a użytkownik dodał komentarz przed zapisaniem (rzadki case, ale możliwy w UI)
      // Tutaj zakładamy, że komentarze dodajemy tylko do istniejących zadań w modalu
      
      setShowTaskModal(false);
      await fetchData();
    } catch (err) {
      console.error('Błąd zapisywania zadania:', err);
      alert('Błąd: ' + err.message);
    }
  };

  const deleteTask = async (id) => {
    if (confirm('Usunąć zadanie?')) {
      try {
        const { error } = await supabase.from('media_tasks').delete().eq('id', id);
        if (error) throw error;
        await fetchData();
      } catch (err) {
        console.error('Błąd usuwania zadania:', err);
        alert('Błąd: ' + err.message);
      }
    }
  };

  // --- DRAG & DROP ---
  const handleDragStart = (task) => setDraggedTask(task);
  const handleDragOver = (e, status) => { e.preventDefault(); setDragOverColumn(status); };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTask || draggedTask.status === newStatus) { setDraggedTask(null); return; }
    try {
      const { error } = await supabase.from('media_tasks').update({ status: newStatus }).eq('id', draggedTask.id);
      if (error) throw error;
      await fetchData();
    } catch (err) { console.error('Błąd:', err); }
    setDraggedTask(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTaskForm({ ...taskForm, attachment: { name: file.name, type: file.type, size: file.size, data: event.target.result.split(',')[1] } });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="p-10 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div></div>;
  if (error) return <div className="p-10 text-red-600">Błąd: {error}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Zespół Medialny</h1>
      </div>

      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Członkowie ({team.length})</h2>
          <button onClick={() => { setMemberForm({ id: null, full_name: '', role: '', email: '', phone: '' }); setShowMemberModal(true); }} className="bg-gradient-to-r from-pink-600 to-orange-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"><Plus size={18}/> Dodaj członka</button>
        </div>
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-pink-50/80 to-orange-50/80 text-gray-700 font-bold border-b border-gray-200/50">
              <tr><th className="p-4">Imię i nazwisko</th><th className="p-4">Rola</th><th className="p-4">Email</th><th className="p-4">Telefon</th><th className="p-4 text-right">Akcje</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {team.map(m => (
                <tr key={m.id} className="hover:bg-pink-50/30 transition">
                  <td className="p-4 font-medium">{m.full_name}</td><td className="p-4">{m.role}</td><td className="p-4">{m.email}</td><td className="p-4">{m.phone}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => { setMemberForm(m); setShowMemberModal(true); }} className="text-pink-600 font-medium">Edytuj</button>
                    <button onClick={() => deleteMember(m.id)} className="text-red-500 font-medium">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">Zadania ({filteredTasks.length})</h2>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-gray-200/50 gap-1">
              <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition ${viewMode === 'kanban' ? 'bg-white shadow text-pink-600' : 'text-gray-500'}`}><LayoutGrid size={18} /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow text-pink-600' : 'text-gray-500'}`}><List size={18} /></button>
              <div className="w-px h-auto bg-gray-300 mx-1 my-1"></div>
              <select value={filterScope} onChange={(e) => setFilterScope(e.target.value)} className="bg-transparent text-sm font-medium text-gray-600 px-2 outline-none cursor-pointer"><option value="all">Wszyscy</option><option value="mine">Moje</option></select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent text-sm font-medium text-gray-600 px-2 outline-none cursor-pointer"><option value="active">Otwarte</option><option value="completed">Zakończone</option><option value="all">Wszystkie</option></select>
            </div>
            <button onClick={() => openTaskModal(null)} className="bg-gradient-to-r from-orange-600 to-pink-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"><Plus size={18}/> Dodaj zadanie</button>
          </div>
        </div>

        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUSES.map(status => (
              <div key={status} className={`bg-gradient-to-br from-gray-50/80 to-gray-100/50 backdrop-blur-sm rounded-2xl border-2 p-4 transition-all ${dragOverColumn === status ? 'border-pink-400 bg-pink-50/50 shadow-lg' : 'border-gray-200/50'}`}
                onDragOver={(e) => handleDragOver(e, status)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, status)}>
                <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg text-gray-800">{status}</h3><span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-bold">{filteredTasks.filter(t => t.status === status).length}</span></div>
                <div className="space-y-3">
                  {filteredTasks.filter(t => t.status === status).map(task => (
                    <div key={task.id} draggable onDragStart={() => handleDragStart(task)} className={`bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 shadow-sm hover:shadow-md transition cursor-move group ${task.status === 'Gotowe' ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-1"><input type="checkbox" checked={task.status === 'Gotowe'} onChange={() => toggleTaskCompletion(task)} className="w-5 h-5 rounded border-gray-300 text-pink-600 cursor-pointer" /></div>
                        <div className="flex-1">
                          <h4 className={`font-bold text-gray-800 mb-2 ${task.status === 'Gotowe' ? 'line-through text-gray-500' : ''}`}>{task.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                            {task.due_date && <div className="flex items-center gap-1"><Calendar size={14} />{new Date(task.due_date).toLocaleDateString('pl-PL')}</div>}
                            {task.assigned_to && <div className="flex items-center gap-1"><User size={14} />{team.find(m => m.id === task.assigned_to)?.full_name}</div>}
                          </div>
                          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                            <button onClick={() => openTaskModal(task)} className="text-pink-600 text-xs font-medium">Szczegóły</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-pink-50/80 to-orange-50/80 text-gray-700 font-bold border-b border-gray-200/50">
                <tr><th className="p-4 w-10"></th><th className="p-4">Zadanie</th><th className="p-4">Termin</th><th className="p-4">Przypisane</th><th className="p-4">Status</th><th className="p-4 text-right">Akcje</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-pink-50/30 transition">
                    <td className="p-4"><input type="checkbox" checked={task.status === 'Gotowe'} onChange={() => toggleTaskCompletion(task)} className="w-5 h-5 rounded border-gray-300 text-pink-600 cursor-pointer" /></td>
                    <td className="p-4 font-bold text-gray-800">{task.title}</td>
                    <td className="p-4">{task.due_date ? new Date(task.due_date).toLocaleDateString('pl-PL') : '-'}</td>
                    <td className="p-4">{team.find(m => m.id === task.assigned_to)?.full_name || '-'}</td>
                    <td className="p-4"><span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{task.status}</span></td>
                    <td className="p-4 text-right"><button onClick={() => openTaskModal(task)} className="text-pink-600 font-medium">Szczegóły</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL ZADANIA I KOMENTARZY */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl p-0 border border-white/20 my-8 flex overflow-hidden h-[80vh]">
            
            {/* LEWA KOLUMNA - EDYCJA */}
            <div className="w-3/5 p-8 overflow-y-auto border-r border-gray-200/50">
              <div className="flex justify-between mb-6">
                <h3 className="font-bold text-2xl bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">{taskForm.id ? 'Edycja zadania' : 'Nowe zadanie'}</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tytuł zadania</label>
                  <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-pink-500/20 outline-none" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Opis</label>
                  <textarea className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm resize-none h-32 focus:ring-2 focus:ring-pink-500/20 outline-none" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Termin</label><input type="date" className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label><select className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Przypisana osoba</label>
                  <select className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50" value={taskForm.assigned_to || ''} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value ? parseInt(e.target.value) : null})}>
                    <option value="">Nie przypisano</option>
                    {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Załącznik</label>
                  <input type="file" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" onChange={handleFileUpload} />
                  {taskForm.attachment && <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg"><Paperclip size={14} />{taskForm.attachment.name}</div>}
                </div>
                <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                  {taskForm.id && <button onClick={() => { deleteTask(taskForm.id); setShowTaskModal(false); }} className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition">Usuń zadanie</button>}
                  <button onClick={saveTask} className="px-6 py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg transition">Zapisz zmiany</button>
                </div>
              </div>
            </div>

            {/* PRAWA KOLUMNA - KOMENTARZE */}
            <div className="w-2/5 bg-gray-50/50 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-700 flex items-center gap-2"><MessageSquare size={18}/> Komentarze</h4>
                <button onClick={() => setShowTaskModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {!taskForm.id ? (
                  <div className="text-center text-gray-400 text-sm mt-10">Zapisz zadanie, aby dodawać komentarze.</div>
                ) : loadingComments ? (
                  <div className="text-center text-gray-400 text-sm">Ładowanie...</div>
                ) : comments.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm mt-10">Brak komentarzy. Bądź pierwszy!</div>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs text-pink-700">{comment.author_name}</span>
                        <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleString('pl-PL')}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              {taskForm.id && (
                <div className="mt-auto">
                  <div className="relative">
                    <textarea 
                      className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-pink-500/20 outline-none text-sm resize-none" 
                      placeholder="Napisz komentarz..." 
                      rows={2}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); }}}
                    />
                    <button 
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className="absolute right-2 bottom-2 p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {showMemberModal && (
        /* ... (Modal członka bez zmian) ... */
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-6 border border-white/20">
            {/* ... zawartość modala członka taka sama jak wcześniej ... */}
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-xl bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                {memberForm.id ? 'Edytuj członka' : 'Nowy członek'}
              </h3>
              <button onClick={() => setShowMemberModal(false)} className="p-2 hover:bg-gray-100/50 rounded-xl transition"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" placeholder="Imię i nazwisko *" value={memberForm.full_name} onChange={e => setMemberForm({...memberForm, full_name: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" placeholder="Rola (np. Dźwięk)" value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" placeholder="Email" type="email" value={memberForm.email} onChange={e => setMemberForm({...memberForm, email: e.target.value})} />
              <input className="w-full px-4 py-3 border border-gray-200/50 rounded-xl bg-white/50 backdrop-blur-sm" placeholder="Telefon" value={memberForm.phone} onChange={e => setMemberForm({...memberForm, phone: e.target.value})} />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowMemberModal(false)} className="px-5 py-2.5 border border-gray-200/50 rounded-xl bg-white/50 hover:bg-white transition">Anuluj</button>
                <button onClick={saveMember} className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-pink-500/50 transition font-medium">Zapisz</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
