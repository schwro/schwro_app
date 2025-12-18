import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';
import {
  Plus, Search, Trash2, X, CheckSquare, LayoutGrid, List, Save,
  Calendar, User, GripVertical, Check
} from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';

const STATUSES = ['Do zrobienia', 'W trakcie', 'Gotowe'];

export default function TasksTab({ moduleKey, moduleName, currentUserEmail }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban');
  const [filterScope, setFilterScope] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'Do zrobienia',
    assigned_to: '',
    due_date: ''
  });

  const tableName = `custom_${moduleKey}_tasks`;

  // Pobierz zadania
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code === '42P01') {
        setTasks([]);
        setLoading(false);
        return;
      }

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Błąd pobierania zadań:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [moduleKey]);

  // Filtrowanie
  const filteredTasks = tasks.filter(t => {
    if (filterScope === 'mine' && t.assigned_to !== currentUserEmail) return false;
    if (filterStatus === 'active' && t.status === 'Gotowe') return false;
    if (filterStatus === 'completed' && t.status !== 'Gotowe') return false;
    return true;
  });

  // Grupowanie po statusie dla widoku kanban
  const tasksByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = filteredTasks.filter(t => t.status === status);
    return acc;
  }, {});

  // Zapisz zadanie
  const handleSave = async () => {
    if (!form.title) return;

    try {
      const taskData = {
        ...form,
        module_key: moduleKey
      };

      if (editingTask) {
        await supabase.from(tableName).update(taskData).eq('id', editingTask.id);
      } else {
        await supabase.from(tableName).insert([taskData]);
      }

      setShowModal(false);
      setEditingTask(null);
      setForm({ title: '', description: '', status: 'Do zrobienia', assigned_to: '', due_date: '' });
      fetchTasks();
    } catch (err) {
      console.error('Błąd zapisu:', err);
      alert('Błąd zapisu zadania. Upewnij się, że tabela istnieje w bazie danych.');
    }
  };

  // Zmiana statusu zadania
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await supabase.from(tableName).update({ status: newStatus }).eq('id', taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error('Błąd zmiany statusu:', err);
    }
  };

  // Usuń zadanie
  const handleDelete = async (id) => {
    if (!confirm('Usunąć to zadanie?')) return;
    try {
      await supabase.from(tableName).delete().eq('id', id);
      fetchTasks();
    } catch (err) {
      console.error('Błąd usuwania:', err);
    }
  };

  // Otwórz modal do edycji
  const openEditModal = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'Do zrobienia',
      assigned_to: task.assigned_to || '',
      due_date: task.due_date || ''
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
          Zadania ({filteredTasks.length})
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50 gap-2 items-center">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow text-pink-600' : 'text-gray-500'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow text-pink-600' : 'text-gray-500'}`}
            >
              <List size={18} />
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            <div className="w-28">
              <CustomSelect
                value={filterScope}
                onChange={setFilterScope}
                options={[
                  { value: 'all', label: 'Wszyscy' },
                  { value: 'mine', label: 'Moje' }
                ]}
              />
            </div>
            <div className="w-32">
              <CustomSelect
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: 'active', label: 'Otwarte' },
                  { value: 'completed', label: 'Zakończone' },
                  { value: 'all', label: 'Wszystkie' }
                ]}
              />
            </div>
          </div>
          <button
            onClick={() => {
              setEditingTask(null);
              setForm({ title: '', description: '', status: 'Do zrobienia', assigned_to: '', due_date: '' });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition"
          >
            <Plus size={18} />
            Nowe zadanie
          </button>
        </div>
      </div>

      {/* Widok Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-3 gap-4">
          {STATUSES.map(status => (
            <div key={status} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  status === 'Do zrobienia' ? 'bg-gray-400' :
                  status === 'W trakcie' ? 'bg-blue-500' : 'bg-green-500'
                }`}></span>
                {status} ({tasksByStatus[status].length})
              </h3>
              <div className="space-y-3">
                {tasksByStatus[status].map(task => (
                  <div
                    key={task.id}
                    onClick={() => openEditModal(task)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 dark:border-gray-700 group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-800 dark:text-white text-sm">{task.title}</h4>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Calendar size={12} />
                          {new Date(task.due_date).toLocaleDateString('pl-PL')}
                        </span>
                      )}
                      {task.assigned_to && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <User size={12} />
                          {task.assigned_to.split('@')[0]}
                        </span>
                      )}
                    </div>
                    {/* Szybka zmiana statusu */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-1">
                      {STATUSES.filter(s => s !== status).map(s => (
                        <button
                          key={s}
                          onClick={(e) => { e.stopPropagation(); handleStatusChange(task.id, s); }}
                          className="flex-1 text-xs py-1 px-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-600 transition"
                        >
                          {s === 'Gotowe' ? <Check size={12} className="inline mr-1" /> : null}
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {tasksByStatus[status].length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    Brak zadań
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Widok Listy */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div
                key={task.id}
                onClick={() => openEditModal(task)}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition cursor-pointer flex items-center gap-4"
              >
                <span className={`w-3 h-3 rounded-full shrink-0 ${
                  task.status === 'Do zrobienia' ? 'bg-gray-400' :
                  task.status === 'W trakcie' ? 'bg-blue-500' : 'bg-green-500'
                }`}></span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 dark:text-white">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400 shrink-0">
                  {task.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(task.due_date).toLocaleDateString('pl-PL')}
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs">
                    {task.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center">
              <CheckSquare size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Brak zadań</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && document.body && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                {editingTask ? 'Edytuj zadanie' : 'Nowe zadanie'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Tytuł *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  placeholder="Co trzeba zrobić?"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Opis
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white resize-none"
                  placeholder="Szczegóły zadania..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Status
                  </label>
                  <CustomSelect
                    value={form.status}
                    onChange={(val) => setForm({ ...form, status: val })}
                    options={STATUSES.map(s => ({ value: s, label: s }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Termin
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Przypisane do (email)
                </label>
                <input
                  type="email"
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  placeholder="jan@example.com"
                />
              </div>
              <button
                onClick={handleSave}
                className="w-full py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition"
              >
                <Save size={18} />
                Zapisz
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
