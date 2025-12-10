import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  List, Plus, Trash2, X,
  CheckCircle, AlertCircle, Upload,
  Image as ImageIcon, Eye, Edit3, ToggleLeft, ToggleRight, UserX, UserCheck, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';

// --- MODULE TABS DEFINITION ---
const MODULE_TABS = {
  homegroups: {
    label: 'Grupy Domowe',
    resourceKey: 'module:homegroups',
    tabs: {
      groups: 'Grupy',
      leaders: 'Liderzy',
      members: 'Członkowie',
      finances: 'Finanse'
    }
  },
  media: {
    label: 'Media Team',
    resourceKey: 'module:media',
    tabs: {
      schedule: 'Grafik',
      tasks: 'Zadania',
      members: 'Członkowie',
      finances: 'Finanse'
    }
  },
  kids: {
    label: 'Małe SchWro',
    resourceKey: 'module:kids',
    tabs: {
      schedule: 'Grafik',
      groups: 'Grupy',
      teachers: 'Nauczyciele',
      students: 'Uczniowie',
      finances: 'Finanse'
    }
  },
  worship: {
    label: 'Grupa Uwielbienia',
    resourceKey: 'module:worship',
    tabs: {
      schedule: 'Grafik',
      songs: 'Baza Pieśni',
      members: 'Członkowie',
      finances: 'Finanse'
    }
  },
  atmosfera: {
    label: 'Atmosfera Team',
    resourceKey: 'module:atmosfera',
    tabs: {
      schedule: 'Grafik',
      members: 'Członkowie',
      finances: 'Finanse'
    }
  }
};

// --- UI HELPERS ---

const SectionHeader = ({ title, description }) => (
  <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
  </div>
);

const DictionaryEditor = ({ category, title, items, onAdd, onDelete }) => {
  const [newItem, setNewItem] = useState('');
  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6 shadow-sm transition-colors">
      <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2"><List size={20} className="text-pink-500"/> {title}</h3>
      <div className="flex gap-2 mb-4">
        <input 
          className="flex-1 p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm outline-none focus:border-pink-500 transition" 
          placeholder="Nowa opcja..." 
          value={newItem} 
          onChange={e => setNewItem(e.target.value)} 
        />
        <button onClick={() => { if(newItem) { onAdd(category, newItem); setNewItem(''); } }} className="bg-pink-600 text-white px-4 rounded-xl font-bold hover:bg-pink-700"><Plus size={18}/></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.filter(i => i.category === category).map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 group hover:border-pink-300 transition">
            <span className="font-medium text-gray-700 dark:text-gray-200">{item.label}</span>
            <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={14}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- GŁÓWNY KOMPONENT ---

export default function GlobalSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [appSettings, setAppSettings] = useState([]);
  const [dictionaries, setDictionaries] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);

  const [userForm, setUserForm] = useState({ id: null, full_name: '', email: '', role: '', is_active: true });
  const [showUserModal, setShowUserModal] = useState(false);

  const [expandedModule, setExpandedModule] = useState(null);
  const [tabPermissions, setTabPermissions] = useState(null);

  const definedRoles = [
    { key: 'rada_starszych', label: 'Rada Starszych' },
    { key: 'koordynator', label: 'Koordynator' },
    { key: 'lider', label: 'Lider Służby' },
    { key: 'czlonek', label: 'Członek' }
  ];


  useEffect(() => {
    fetchData();
    loadTabPermissions();
  }, []);

  const loadTabPermissions = () => {
    const stored = localStorage.getItem('tabPermissions');
    if (stored) {
      setTabPermissions(JSON.parse(stored));
    } else {
      // Default tab permissions
      const defaultPerms = {
        homegroups: {
          groups: null,
          leaders: null,
          members: ['rada_starszych', 'koordynator', 'lider'],
          finances: ['rada_starszych', 'koordynator']
        },
        media: {
          schedule: null,
          tasks: null,
          members: ['rada_starszych', 'koordynator', 'lider'],
          finances: ['rada_starszych', 'koordynator']
        },
        kids: {
          schedule: null,
          groups: null,
          teachers: ['rada_starszych', 'koordynator', 'lider'],
          students: null,
          finances: ['rada_starszych', 'koordynator']
        },
        worship: {
          schedule: null,
          songs: null,
          members: ['rada_starszych', 'koordynator', 'lider'],
          finances: ['rada_starszych', 'koordynator']
        },
        atmosfera: {
          schedule: null,
          members: ['rada_starszych', 'koordynator', 'lider'],
          finances: ['rada_starszych', 'koordynator']
        }
      };
      setTabPermissions(defaultPerms);
    }
  };

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

  const toggleModule = async (key, currentValue) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    await supabase.from('app_settings').update({ value: newValue }).eq('key', key);
    setAppSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));
    setTimeout(() => window.location.reload(), 500); 
  };

  const saveUser = async () => {
    if (!userForm.email || !userForm.role) return alert('Wymagany Email i Rola');
    const payload = { full_name: userForm.full_name || '', email: userForm.email, role: userForm.role, is_active: userForm.is_active };
    try {
      if (userForm.id) await supabase.from('app_users').update(payload).eq('id', userForm.id);
      else await supabase.from('app_users').insert([payload]);
      setShowUserModal(false); fetchData(); setMessage({ type: 'success', text: 'Zapisano użytkownika' });
    } catch (err) { alert('Błąd zapisu: ' + err.message); }
  };

  const deleteUser = async (id) => { if(confirm('Usunąć?')) { await supabase.from('app_users').delete().eq('id', id); fetchData(); } };
  const toggleUserStatus = async (user) => { await supabase.from('app_users').update({ is_active: !user.is_active }).eq('id', user.id); fetchData(); };
  
  const addDict = async (category, label) => { const { data } = await supabase.from('app_dictionaries').insert([{ category, label, value: label }]).select(); if (data) setDictionaries([...dictionaries, data[0]]); };
  const delDict = async (id) => { if(confirm('Usunąć?')) { await supabase.from('app_dictionaries').delete().eq('id', id); fetchData(); } };

  const togglePermission = async (role, resource, field, value) => {
    const existing = permissions.find(p => p.role === role && p.resource === resource);
    const payload = { role, resource, [field]: value, [field === 'can_read' ? 'can_write' : 'can_read']: existing ? existing[field === 'can_read' ? 'can_write' : 'can_read'] : false };
    await supabase.from('app_permissions').upsert(payload, { onConflict: 'role, resource' }); fetchData();
  };

  // Tab permissions functions
  const toggleTabRoleAccess = (module, tab, roleKey) => {
    if (!tabPermissions) return;

    setTabPermissions(prev => {
      const currentTabPerms = prev[module]?.[tab];

      if (currentTabPerms === null) {
        // Jeśli wszyscy mają dostęp, zmień na tylko tę jedną rolę
        return {
          ...prev,
          [module]: {
            ...prev[module],
            [tab]: [roleKey]
          }
        };
      } else if (Array.isArray(currentTabPerms)) {
        if (currentTabPerms.includes(roleKey)) {
          // Odklikuj rolę
          const newRoles = currentTabPerms.filter(r => r !== roleKey);
          // Nie zmieniaj pustej tablicy na null - zostaw jako pusta tablica (nikt nie ma dostępu)
          return {
            ...prev,
            [module]: {
              ...prev[module],
              [tab]: newRoles
            }
          };
        } else {
          // Dodaj rolę
          return {
            ...prev,
            [module]: {
              ...prev[module],
              [tab]: [...currentTabPerms, roleKey]
            }
          };
        }
      }

      return prev;
    });
  };

  const setAllTabAccess = (module, tab) => {
    if (!tabPermissions) return;

    setTabPermissions(prev => {
      const currentTabPerms = prev[module]?.[tab];

      // Jeśli już jest null (wszyscy mają dostęp), zmień na pustą tablicę (nikt nie ma dostępu)
      if (currentTabPerms === null) {
        return {
          ...prev,
          [module]: {
            ...prev[module],
            [tab]: []
          }
        };
      }

      // W przeciwnym razie ustaw na null (wszyscy)
      return {
        ...prev,
        [module]: {
          ...prev[module],
          [tab]: null
        }
      };
    });
  };

  const hasTabRoleAccess = (module, tab, roleKey) => {
    if (!tabPermissions) return false;
    const tabPerms = tabPermissions[module]?.[tab];
    if (tabPerms === null) return true; // null = wszyscy mają dostęp
    if (!Array.isArray(tabPerms)) return false;
    return tabPerms.includes(roleKey); // pusta tablica = nikt nie ma dostępu
  };

  const saveTabPermissions = () => {
    localStorage.setItem('tabPermissions', JSON.stringify(tabPermissions));
    setMessage({ type: 'success', text: 'Uprawnienia zaktualizowane. Odśwież stronę, aby zobaczyć zmiany.' });
    setTimeout(() => window.location.reload(), 1500);
  };

  const logoUrl = appSettings.find(s => s.key === 'org_logo_url')?.value;
  const modulesSettings = appSettings.filter(s => s.key.startsWith('module_'));

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* NAGŁÓWEK + MENU */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Konfiguracja</h1>
        </div>
        <div className="flex bg-white/50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
          {['general', 'modules', 'users', 'permissions', 'dictionaries'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-bold transition capitalize whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-gray-700 shadow text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {{ general: 'Organizacja', modules: 'Moduły', users: 'Użytkownicy', permissions: 'Uprawnienia', dictionaries: 'Słowniki' }[tab]}
            </button>
          ))}
        </div>
      </div>

      {message && <div className={`p-4 rounded-xl flex items-center gap-2 cursor-pointer ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800'}`} onClick={() => setMessage(null)}>{message.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>} {message.text}</div>}

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700 p-8 flex-1 overflow-y-auto transition-colors">
        
        {/* --- TAB: ORGANIZACJA --- */}
        {activeTab === 'general' && (
          <div className="max-w-2xl">
            <SectionHeader title="Identyfikacja" description="Logo i nazwa wyświetlana w aplikacji." />
            <div className="flex gap-8 items-start">
              <div className="w-48 text-center">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl aspect-square flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 relative overflow-hidden group hover:border-pink-400 transition mb-2">
                  {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-4"/> : <ImageIcon size={40} className="text-gray-300 dark:text-gray-500"/>}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button onClick={() => document.getElementById('logo-u').click()} className="bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"><Upload size={16}/> Zmień</button>
                  </div>
                  <input id="logo-u" type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
                <span className="text-xs text-gray-400">Kliknij by zmienić</span>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Nazwa Organizacji</label>
                <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-pink-500 outline-none transition" defaultValue={appSettings.find(s=>s.key==='org_name')?.value} onBlur={async (e) => { await supabase.from('app_settings').update({value: e.target.value}).eq('key', 'org_name'); setMessage({type:'success', text:'Zapisano'}); }} />
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: MODUŁY --- */}
        {activeTab === 'modules' && (
          <div className="max-w-3xl">
            <SectionHeader title="Zarządzanie Modułami" description="Włączaj lub ukrywaj funkcje systemu." />
            <div className="space-y-3">
              {modulesSettings.map(mod => (
                <div key={mod.key} className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:shadow-sm transition">
                  <div>
                    <div className="font-bold text-gray-800 dark:text-white">{mod.description}</div>
                    <div className="text-xs text-gray-400 font-mono">{mod.key}</div>
                  </div>
                  <button onClick={() => toggleModule(mod.key, mod.value)} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${mod.value === 'true' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400'}`}>
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
              <button onClick={() => { setUserForm({ id: null, full_name: '', email: '', role: '', is_active: true }); setShowUserModal(true); }} className="bg-pink-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition"><Plus size={18}/> Dodaj Użytkownika</button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm text-left bg-white dark:bg-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"><tr><th className="p-4">Użytkownik</th><th className="p-4">Email</th><th className="p-4">Rola</th><th className="p-4">Status</th><th className="p-4 text-right">Akcje</th></tr></thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                  {users.map(user => {
                    const roleLabel = definedRoles.find(r => r.key === user.role)?.label || user.role;
                    return (
                      <tr key={user.id} className="hover:bg-pink-50/30 dark:hover:bg-gray-600 transition text-gray-800 dark:text-gray-200">
                        <td className="p-4 font-medium flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300 flex items-center justify-center font-bold uppercase">{(user.full_name || user.email || '?').charAt(0)}</div>
                          {user.full_name || 'Brak imienia'}
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="p-4"><span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-lg text-xs font-bold">{roleLabel}</span></td>
                        <td className="p-4">
                          <button onClick={() => toggleUserStatus(user)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${user.is_active ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                            {user.is_active ? <UserCheck size={12}/> : <UserX size={12}/>} {user.is_active ? 'Aktywny' : 'Zablokowany'}
                          </button>
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button onClick={() => { setUserForm(user); setShowUserModal(true); }} className="text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-gray-600 p-2 rounded-lg"><Edit3 size={16}/></button>
                          <button onClick={() => deleteUser(user.id)} className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-600 p-2 rounded-lg"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB: UPRAWNIENIA (UNIFIED) --- */}
        {activeTab === 'permissions' && (
          <div>
            <SectionHeader title="Uprawnienia" description="Zarządzaj dostępem do modułów i zakładek według ról użytkowników." />

            {/* MODUŁY Z ROZWIJANYMI ZAKŁADKAMI */}
            <div className="space-y-4">
              {Object.entries(MODULE_TABS).map(([moduleKey, moduleData]) => {
                const isExpanded = expandedModule === moduleKey;

                return (
                  <div key={moduleKey} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm">

                    {/* NAGŁÓWEK MODUŁU Z UPRAWNIENIAMI R/W */}
                    <div className="border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => setExpandedModule(isExpanded ? null : moduleKey)}
                            className="text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition"
                          >
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{moduleData.label}</h3>
                            <p className="text-xs text-gray-400 font-mono">{moduleData.resourceKey}</p>
                          </div>
                        </div>

                        {/* UPRAWNIENIA READ/WRITE DLA MODUŁU */}
                        <div className="flex gap-6">
                          {definedRoles.map(role => {
                            const perm = permissions.find(p => p.role === role.key && p.resource === moduleData.resourceKey) || { can_read: false, can_write: false };
                            return (
                              <div key={role.key} className="text-center">
                                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">{role.label}</div>
                                <div className="flex gap-3">
                                  <label className="flex flex-col items-center gap-1 cursor-pointer group">
                                    <Eye size={12} className="text-gray-400 group-hover:text-pink-500" />
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 accent-pink-600 cursor-pointer"
                                      checked={perm.can_read}
                                      onChange={() => togglePermission(role.key, moduleData.resourceKey, 'can_read', !perm.can_read)}
                                    />
                                  </label>
                                  <label className="flex flex-col items-center gap-1 cursor-pointer group">
                                    <Edit3 size={12} className="text-gray-400 group-hover:text-red-500" />
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 accent-red-500 cursor-pointer"
                                      checked={perm.can_write}
                                      onChange={() => togglePermission(role.key, moduleData.resourceKey, 'can_write', !perm.can_write)}
                                    />
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ROZWINIĘTE ZAKŁADKI */}
                    {isExpanded && tabPermissions && (
                      <div className="p-6 bg-white dark:bg-gray-700">
                        <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-4 uppercase tracking-wide">Widoczność zakładek</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-600">
                                <th className="text-left py-3 px-4 font-bold text-gray-600 dark:text-gray-300">Zakładka</th>
                                <th className="text-center py-3 px-4 font-bold text-gray-600 dark:text-gray-300">Wszyscy</th>
                                {definedRoles.map(role => (
                                  <th key={role.key} className="text-center py-3 px-4 font-bold text-gray-600 dark:text-gray-300">
                                    {role.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                              {Object.entries(moduleData.tabs).map(([tabKey, tabLabel]) => {
                                const allAccess = tabPermissions[moduleKey]?.[tabKey] === null;

                                return (
                                  <tr key={tabKey} className="hover:bg-gray-50 dark:hover:bg-gray-600/50">
                                    <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">
                                      {tabLabel}
                                      <div className="text-xs text-gray-400 font-mono">{tabKey}</div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <button
                                        onClick={() => setAllTabAccess(moduleKey, tabKey)}
                                        className={`w-6 h-6 rounded flex items-center justify-center transition mx-auto ${
                                          allAccess
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-600 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                                        }`}
                                      >
                                        {allAccess && <Check size={14} />}
                                      </button>
                                    </td>
                                    {definedRoles.map(role => {
                                      const hasRoleAccess = hasTabRoleAccess(moduleKey, tabKey, role.key);

                                      return (
                                        <td key={role.key} className="py-3 px-4 text-center">
                                          <button
                                            onClick={() => toggleTabRoleAccess(moduleKey, tabKey, role.key)}
                                            disabled={allAccess}
                                            className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition ${
                                              allAccess
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-300 cursor-not-allowed'
                                                : hasRoleAccess
                                                ? 'bg-pink-500 text-white'
                                                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                                            }`}
                                          >
                                            {hasRoleAccess && !allAccess && <Check size={14} />}
                                          </button>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PRZYCISKI AKCJI */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  loadTabPermissions();
                  setMessage({ type: 'success', text: 'Przywrócono domyślne uprawnienia zakładek' });
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Przywróć domyślne zakładki
              </button>
              <button
                onClick={saveTabPermissions}
                className="px-6 py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition font-bold"
              >
                Zapisz wszystkie uprawnienia
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Instrukcja:</strong> Rozwiń moduł aby zarządzać widocznością zakładek. Zaznacz "Wszyscy", aby dać dostęp wszystkim użytkownikom do danej zakładki.
                W przeciwnym razie zaznacz konkretne role, które mają mieć dostęp.
              </p>
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

      {/* MODAL DODAWANIA UŻYTKOWNIKA (DARK MODE) */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-white/20 dark:border-gray-700">
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-xl text-gray-800 dark:text-white">Użytkownik</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"><X/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Imię i nazwisko</label>
                <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" placeholder="Jan Kowalski" value={userForm.full_name || ''} onChange={e => setUserForm({...userForm, full_name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Email (Login)</label>
                <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" placeholder="jan@example.com" value={userForm.email || ''} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1 mb-1 block">Rola w systemie</label>
                <CustomSelect options={definedRoles.map(r => ({value: r.key, label: r.label}))} value={userForm.role} onChange={v => setUserForm({...userForm, role: v})} placeholder="Wybierz rolę..." />
              </div>
              <button onClick={saveUser} className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold mt-2 hover:bg-pink-700 transition">Zapisz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
