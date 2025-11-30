import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Settings, List, Plus, Trash2, Save, 
  Shield, CheckCircle, AlertCircle, Upload, Lock, 
  Image as ImageIcon, Loader2, Eye, Edit3, ToggleLeft, ToggleRight, User, UserX, UserCheck, ChevronDown, Check
} from 'lucide-react';

// --- UI HELPERS ---

const SectionHeader = ({ title, description }) => (
  <div className="mb-6 border-b border-gray-100 pb-4">
    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
    <p className="text-sm text-gray-500">{description}</p>
  </div>
);

const CustomSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 rounded-xl border border-gray-200 bg-white cursor-pointer flex justify-between items-center hover:border-blue-400 transition"
      >
        <span className={selectedLabel ? 'text-gray-800' : 'text-gray-400'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-400"/>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {options.map(opt => (
            <div 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-sm text-gray-700"
            >
              {opt.label}
              {value === opt.value && <Check size={14} className="text-blue-600"/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- GŁÓWNY KOMPONENT ---

export default function GlobalSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // DANE
  const [appSettings, setAppSettings] = useState([]);
  const [dictionaries, setDictionaries] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);

  // FORMULARZE
  const [userForm, setUserForm] = useState({ id: null, full_name: '', email: '', role: '', is_active: true });
  const [showUserModal, setShowUserModal] = useState(false);

  // STATYCZNE DEFINICJE (ROLES)
  const definedRoles = [
    { key: 'rada_starszych', label: 'Rada Starszych (Admin)' },
    { key: 'koordynator', label: 'Koordynator' },
    { key: 'lider', label: 'Lider Służby' },
    { key: 'czlonek', label: 'Członek' }
  ];

  const definedResources = [
    { key: 'module:members', label: 'Moduł: Członkowie' },
    { key: 'module:worship', label: 'Moduł: Uwielbienie' },
    { key: 'module:kids', label: 'Moduł: Małe SchWro' },
    { key: 'module:media', label: 'Moduł: Media' },
    { key: 'module:settings', label: 'Moduł: Ustawienia' },
    { key: 'section:finance', label: 'Sekcja: Finanse' },
  ];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: s } = await supabase.from('app_settings').select('*');
    const { data: d } = await supabase.from('app_dictionaries').select('*');
    const { data: p } = await supabase.from('app_permissions').select('*');
    const { data: u } = await supabase.from('app_users').select('*').order('full_name');
    
    if (s) setAppSettings(s);
    if (d) setDictionaries(d);
    if (p) setPermissions(p);
    if (u) setUsers(u);
    setLoading(false);
  };

  // --- 1. LOGO UPLOAD ---
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `org-logo-${Date.now()}.${fileExt}`;
      await supabase.storage.from('public-assets').upload(fileName, file);
      const { data } = supabase.storage.from('public-assets').getPublicUrl(fileName);
      
      await supabase.from('app_settings').upsert({ key: 'org_logo_url', value: data.publicUrl }, { onConflict: 'key' });
      fetchData();
      window.location.reload(); 
    } catch (err) { alert('Błąd uploadu'); }
  };

  // --- 2. MODUŁY (TOGGLE) ---
  const toggleModule = async (key, currentValue) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    await supabase.from('app_settings').update({ value: newValue }).eq('key', key);
    setAppSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
    setTimeout(() => window.location.reload(), 500); 
  };

  // --- 3. UŻYTKOWNICY (CRUD) ---
  const saveUser = async () => {
    if (!userForm.email || !userForm.role) return alert('Wymagany Email i Rola');
    
    const payload = { 
      full_name: userForm.full_name || '', // Zabezpieczenie przed null
      email: userForm.email, 
      role: userForm.role, 
      is_active: userForm.is_active 
    };

    try {
      if (userForm.id) {
        const { error } = await supabase.from('app_users').update(payload).eq('id', userForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('app_users').insert([payload]);
        if (error) throw error;
      }
      setShowUserModal(false);
      fetchData();
      setMessage({ type: 'success', text: 'Zapisano użytkownika' });
    } catch (err) { 
      alert('Błąd zapisu: ' + err.message); 
    }
  };

  const deleteUser = async (id) => {
    if(confirm('Usunąć użytkownika?')) {
      await supabase.from('app_users').delete().eq('id', id);
      fetchData();
    }
  };

  const toggleUserStatus = async (user) => {
    await supabase.from('app_users').update({ is_active: !user.is_active }).eq('id', user.id);
    fetchData();
  };

  // --- 4. SŁOWNIKI ---
  const addDict = async (category, label) => {
    const { data } = await supabase.from('app_dictionaries').insert([{ category, label, value: label }]).select();
    if (data) setDictionaries([...dictionaries, data[0]]);
  };
  const delDict = async (id) => {
    if(confirm('Usunąć?')) { await supabase.from('app_dictionaries').delete().eq('id', id); fetchData(); }
  };

  // --- 5. UPRAWNIENIA ---
  const togglePermission = async (role, resource, field, value) => {
    const existing = permissions.find(p => p.role === role && p.resource === resource);
    const payload = { 
      role, resource, [field]: value,
      [field === 'can_read' ? 'can_write' : 'can_read']: existing ? existing[field === 'can_read' ? 'can_write' : 'can_read'] : false
    };
    await supabase.from('app_permissions').upsert(payload, { onConflict: 'role, resource' });
    fetchData();
  };

  const logoUrl = appSettings.find(s => s.key === 'org_logo_url')?.value;
  const modulesSettings = appSettings.filter(s => s.key.startsWith('module_'));

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* NAGŁÓWEK + MENU */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">Konfiguracja</h1>
        </div>
        <div className="flex bg-white/50 p-1 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          {['general', 'modules', 'users', 'permissions', 'dictionaries'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-bold transition capitalize whitespace-nowrap ${activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {{ general: 'Organizacja', modules: 'Moduły', users: 'Użytkownicy', permissions: 'Uprawnienia', dictionaries: 'Słowniki' }[tab]}
            </button>
          ))}
        </div>
      </div>

      {message && <div className={`p-4 rounded-xl flex items-center gap-2 cursor-pointer ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} onClick={() => setMessage(null)}>{message.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>} {message.text}</div>}

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 flex-1 overflow-y-auto">
        
        {/* --- TAB: ORGANIZACJA --- */}
        {activeTab === 'general' && (
          <div className="max-w-2xl">
            <SectionHeader title="Identyfikacja" description="Logo i nazwa wyświetlana w aplikacji." />
            <div className="flex gap-8 items-start">
              <div className="w-48 text-center">
                <div className="border-2 border-dashed border-gray-300 rounded-2xl aspect-square flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden group hover:border-blue-400 transition mb-2">
                  {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-4"/> : <ImageIcon size={40} className="text-gray-300"/>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button onClick={() => document.getElementById('logo-u').click()} className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"><Upload size={16}/> Zmień</button>
                  </div>
                  <input id="logo-u" type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
                <span className="text-xs text-gray-400">Kliknij by zmienić</span>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nazwa Organizacji</label>
                <input className="w-full p-3 rounded-xl border border-gray-200" defaultValue={appSettings.find(s=>s.key==='org_name')?.value} onBlur={async (e) => { await supabase.from('app_settings').update({value: e.target.value}).eq('key', 'org_name'); setMessage({type:'success', text:'Zapisano'}); }} />
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: MODUŁY --- */}
        {activeTab === 'modules' && (
          <div className="max-w-3xl">
            <SectionHeader title="Zarządzanie Modułami" description="Włączaj lub ukrywaj funkcje systemu. Zmiana wymaga przeładowania." />
            <div className="space-y-3">
              {modulesSettings.map(mod => (
                <div key={mod.key} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition">
                  <div>
                    <div className="font-bold text-gray-800">{mod.description}</div>
                    <div className="text-xs text-gray-400 font-mono">{mod.key}</div>
                  </div>
                  <button onClick={() => toggleModule(mod.key, mod.value)} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${mod.value === 'true' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {mod.value === 'true' ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                    {mod.value === 'true' ? 'Włączony' : 'Wyłączony'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: UŻYTKOWNICY --- */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <SectionHeader title="Użytkownicy Systemu" description="Zarządzanie dostępem, rolami i statusem kont." />
              <button onClick={() => { setUserForm({ id: null, full_name: '', email: '', role: '', is_active: true }); setShowUserModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition"><Plus size={18}/> Dodaj Użytkownika</button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm text-left bg-white">
                <thead className="bg-gray-50 text-gray-600"><tr><th className="p-4">Użytkownik</th><th className="p-4">Email</th><th className="p-4">Rola</th><th className="p-4">Status</th><th className="p-4 text-right">Akcje</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => {
                    const roleLabel = definedRoles.find(r => r.key === user.role)?.label || user.role;
                    return (
                      <tr key={user.id} className="hover:bg-blue-50/30 transition">
                        <td className="p-4 font-medium text-gray-800 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold uppercase">
                            {(user.full_name || user.email || '?').charAt(0)}
                          </div>
                          {user.full_name || 'Brak imienia'}
                        </td>
                        <td className="p-4 text-gray-600">{user.email}</td>
                        <td className="p-4"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-bold">{roleLabel}</span></td>
                        <td className="p-4">
                          <button onClick={() => toggleUserStatus(user)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${user.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {user.is_active ? <UserCheck size={12}/> : <UserX size={12}/>} {user.is_active ? 'Aktywny' : 'Zablokowany'}
                          </button>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={() => { setUserForm(user); setShowUserModal(true); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><Edit3 size={16}/></button>
                          <button onClick={() => deleteUser(user.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB: UPRAWNIENIA --- */}
        {activeTab === 'permissions' && (
          <div>
            <SectionHeader title="Macierz Uprawnień" description="Kto może czytać (R) i edytować (W) dane moduły." />
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 font-bold text-gray-600 w-1/3">Zasób / Moduł</th>
                    {definedRoles.map(role => (
                      <th key={role.key} className="p-4 font-bold text-center text-gray-700 border-l border-gray-200 min-w-[120px]">
                        {role.label}
                        <div className="flex justify-center gap-4 mt-2 text-[10px] font-normal text-gray-400 uppercase"><span className="flex items-center gap-1"><Eye size={10}/> R</span><span className="flex items-center gap-1"><Edit3 size={10}/> W</span></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {definedResources.map(res => (
                    <tr key={res.key} className="hover:bg-blue-50/30 transition">
                      <td className="p-4 font-medium text-gray-800">{res.label}<div className="text-xs text-gray-400 font-mono mt-0.5">{res.key}</div></td>
                      {definedRoles.map(role => {
                        const perm = permissions.find(p => p.role === role.key && p.resource === res.key) || { can_read: false, can_write: false };
                        return (
                          <td key={`${role.key}-${res.key}`} className="p-4 text-center border-l border-gray-200">
                            <div className="flex justify-center gap-8">
                              <input type="checkbox" className="w-4 h-4 accent-blue-600 cursor-pointer" checked={perm.can_read} onChange={() => togglePermission(role.key, res.key, 'can_read', !perm.can_read)} />
                              <input type="checkbox" className="w-4 h-4 accent-red-500 cursor-pointer" checked={perm.can_write} onChange={() => togglePermission(role.key, res.key, 'can_write', !perm.can_write)} />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB: SŁOWNIKI --- */}
        {activeTab === 'dictionaries' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DictionaryEditor title="Statusy Członków" category="member_status" items={dictionaries} onAdd={addDict} onDelete={delDict} />
            <DictionaryEditor title="Role w Zespole" category="team_role" items={dictionaries} onAdd={addDict} onDelete={delDict} />
            <DictionaryEditor title="Typy Materiałów" category="material_type" items={dictionaries} onAdd={addDict} onDelete={delDict} />
            <DictionaryEditor title="Kategorie Pieśni" category="song_category" items={dictionaries} onAdd={addDict} onDelete={delDict} />
          </div>
        )}

      </div>

      {/* MODAL DODAWANIA UŻYTKOWNIKA */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between mb-6"><h3 className="font-bold text-xl">Użytkownik</h3><button onClick={() => setShowUserModal(false)}><X/></button></div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Imię i nazwisko</label>
                <input className="w-full p-3 rounded-xl border border-gray-200" placeholder="Jan Kowalski" value={userForm.full_name || ''} onChange={e => setUserForm({...userForm, full_name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email (Login)</label>
                <input className="w-full p-3 rounded-xl border border-gray-200" placeholder="jan@example.com" value={userForm.email || ''} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Rola w systemie</label>
                <CustomSelect options={definedRoles.map(r => ({value: r.key, label: r.label}))} value={userForm.role} onChange={v => setUserForm({...userForm, role: v})} placeholder="Wybierz rolę..." />
              </div>
              <button onClick={saveUser} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-2 hover:bg-blue-700 transition">Zapisz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DictionaryEditor = ({ category, title, items, onAdd, onDelete }) => {
  const [newItem, setNewItem] = useState('');
  return (
    <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
      <h3 className="font-bold text-lg text-gray-700 mb-4 flex items-center gap-2"><List size={20} className="text-blue-500"/> {title}</h3>
      <div className="flex gap-2 mb-4">
        <input className="flex-1 p-2.5 rounded-xl border border-gray-300 text-sm outline-none" placeholder="Nowa opcja..." value={newItem} onChange={e => setNewItem(e.target.value)} />
        <button onClick={() => { if(newItem) { onAdd(category, newItem); setNewItem(''); } }} className="bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-700"><Plus size={18}/></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.filter(i => i.category === category).map(item => (
          <div key={item.id} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 group hover:border-blue-300 transition">
            <span className="font-medium text-gray-700">{item.label}</span>
            <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={14}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};
