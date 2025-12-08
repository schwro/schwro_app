import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus, Search, Trash2, X, Users, MapPin, Calendar,
  Phone, Mail, UserPlus, Edit2
} from 'lucide-react';

const HomeGroupsModule = () => {
  const [activeTab, setActiveTab] = useState('groups'); // 'groups', 'leaders', 'members'
  const [groups, setGroups] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('group');
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    leader_id: '',
    meeting_day: '',
    meeting_time: '',
    location: '',
    address: '',
    phone: '',
    email: ''
  });

  const [personForm, setPersonForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    group_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, leadersRes, membersRes] = await Promise.all([
        supabase.from('home_groups').select('*, home_group_leaders(full_name)').order('name'),
        supabase.from('home_group_leaders').select('*').order('full_name'),
        supabase.from('home_group_members').select('*, home_groups(name)').order('full_name')
      ]);

      if (groupsRes.data) setGroups(groupsRes.data);
      if (leadersRes.data) setLeaders(leadersRes.data);
      if (membersRes.data) setMembers(membersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Błąd pobierania danych: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name?.trim()) {
      alert('Podaj nazwę grupy');
      return;
    }

    try {
      const payload = {
        name: groupForm.name,
        description: groupForm.description || null,
        leader_id: groupForm.leader_id || null,
        meeting_day: groupForm.meeting_day || null,
        meeting_time: groupForm.meeting_time || null,
        location: groupForm.location || null,
        address: groupForm.address || null,
        phone: groupForm.phone || null,
        email: groupForm.email || null
      };

      if (editingItem) {
        const { error } = await supabase
          .from('home_groups')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('home_groups')
          .insert([payload]);
        if (error) throw error;
      }

      fetchData();
      closeModal();
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Błąd zapisywania grupy: ' + error.message);
    }
  };

  const handleSavePerson = async () => {
    if (!personForm.full_name?.trim()) {
      alert('Podaj imię i nazwisko');
      return;
    }

    try {
      const payload = {
        full_name: personForm.full_name,
        email: personForm.email || null,
        phone: personForm.phone || null
      };

      if (modalType === 'member') {
        payload.group_id = personForm.group_id || null;
      }

      const table = modalType === 'leader' ? 'home_group_leaders' : 'home_group_members';

      if (editingItem) {
        const { error } = await supabase
          .from(table)
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .insert([payload]);
        if (error) throw error;
      }

      fetchData();
      closeModal();
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Błąd zapisywania: ' + error.message);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Czy na pewno chcesz usunąć?')) return;

    try {
      const table = type === 'group' ? 'home_groups' :
                    type === 'leader' ? 'home_group_leaders' :
                    'home_group_members';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Błąd usuwania: ' + error.message);
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);

    if (type === 'group') {
      setGroupForm(item || {
        name: '',
        description: '',
        leader_id: '',
        meeting_day: '',
        meeting_time: '',
        location: '',
        address: '',
        phone: '',
        email: ''
      });
    } else {
      setPersonForm(item || {
        full_name: '',
        email: '',
        phone: '',
        group_id: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeaders = leaders.filter(l =>
    l.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = members.filter(m =>
    m.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
          Grupy Domowe
        </h1>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-2 inline-flex gap-2">
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-6 py-2.5 rounded-xl font-medium transition text-sm ${
            activeTab === 'groups'
              ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Users size={16} className="inline mr-2" />
          Grupy
        </button>
        <button
          onClick={() => setActiveTab('leaders')}
          className={`px-6 py-2.5 rounded-xl font-medium transition text-sm ${
            activeTab === 'leaders'
              ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <UserPlus size={16} className="inline mr-2" />
          Liderzy
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-6 py-2.5 rounded-xl font-medium transition text-sm ${
            activeTab === 'members'
              ? 'bg-gradient-to-r from-pink-600 to-orange-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Users size={16} className="inline mr-2" />
          Członkowie
        </button>
      </div>

      {/* Content Section */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {activeTab === 'groups' ? 'Grupy Domowe' : activeTab === 'leaders' ? 'Liderzy' : 'Członkowie Grup'}
          </h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Szukaj..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>
            <button
              onClick={() => openModal(activeTab === 'groups' ? 'group' : activeTab === 'leaders' ? 'leader' : 'member')}
              className="bg-gradient-to-r from-pink-600 to-orange-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"
            >
              <Plus size={18} />
              Dodaj {activeTab === 'groups' ? 'Grupę' : activeTab === 'leaders' ? 'Lidera' : 'Członka'}
            </button>
          </div>
        </div>

        {activeTab === 'groups' && (
          <GroupsGrid groups={filteredGroups} leaders={leaders} members={members} onEdit={(g) => openModal('group', g)} onDelete={(id) => handleDelete(id, 'group')} />
        )}

        {activeTab === 'leaders' && (
          <LeadersTable leaders={filteredLeaders} onEdit={(l) => openModal('leader', l)} onDelete={(id) => handleDelete(id, 'leader')} />
        )}

        {activeTab === 'members' && (
          <MembersTable members={filteredMembers} groups={groups} onEdit={(m) => openModal('member', m)} onDelete={(id) => handleDelete(id, 'member')} />
        )}
      </section>

      {/* Modal */}
      {showModal && (
        <Modal
          type={modalType}
          groupData={groupForm}
          personData={personForm}
          setGroupData={setGroupForm}
          setPersonData={setPersonForm}
          onSave={modalType === 'group' ? handleSaveGroup : handleSavePerson}
          onClose={closeModal}
          groups={groups}
          leaders={leaders}
          isEditing={!!editingItem}
        />
      )}
    </div>
  );
};

// Groups Grid Component
const GroupsGrid = ({ groups, leaders, members, onEdit, onDelete }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {groups.map(group => {
      const leader = leaders.find(l => l.id === group.leader_id);
      const groupMemberCount = members.filter(m => m.group_id === group.id).length;

      return (
        <div key={group.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:shadow-lg transition">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{group.name}</h3>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(group)}
                className="p-1.5 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(group.id)}
                className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {group.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{group.description}</p>
          )}

          <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
            {leader && (
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-pink-500" />
                <span className="font-medium">Lider:</span> {leader.full_name}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              <span className="font-medium">Członków:</span> {groupMemberCount}
            </div>
            {group.meeting_day && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-purple-500" />
                <span>{group.meeting_day} {group.meeting_time && `o ${group.meeting_time}`}</span>
              </div>
            )}
            {group.location && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-green-500" />
                <span>{group.location}</span>
              </div>
            )}
            {group.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-orange-500" />
                <span>{group.phone}</span>
              </div>
            )}
            {group.email && (
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-red-500" />
                <span className="truncate text-xs">{group.email}</span>
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

// Leaders Table Component
const LeadersTable = ({ leaders, onEdit, onDelete }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Imię i Nazwisko</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Email</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Telefon</th>
          <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Akcje</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {leaders.map(leader => (
          <tr key={leader.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{leader.full_name}</td>
            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{leader.email || '-'}</td>
            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{leader.phone || '-'}</td>
            <td className="px-6 py-4 text-right">
              <button
                onClick={() => onEdit(leader)}
                className="p-1.5 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-gray-700 rounded-lg transition mr-2"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(leader.id)}
                className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Members Table Component
const MembersTable = ({ members, groups, onEdit, onDelete }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Imię i Nazwisko</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Grupa</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Email</th>
          <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Telefon</th>
          <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Akcje</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {members.map(member => {
          const group = groups.find(g => g.id === member.group_id);
          return (
            <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{member.full_name}</td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{group?.name || '-'}</td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{member.email || '-'}</td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{member.phone || '-'}</td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onEdit(member)}
                  className="p-1.5 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-gray-700 rounded-lg transition mr-2"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(member.id)}
                  className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// Modal Component
const Modal = ({ type, groupData, personData, setGroupData, setPersonData, onSave, onClose, groups, leaders, isEditing }) => {
  const handleChange = (field, value) => {
    if (type === 'group') {
      setGroupData(prev => ({ ...prev, [field]: value }));
    } else {
      setPersonData(prev => ({ ...prev, [field]: value }));
    }
  };

  const data = type === 'group' ? groupData : personData;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edytuj' : 'Dodaj'} {type === 'group' ? 'Grupę' : type === 'leader' ? 'Lidera' : 'Członka'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {type === 'group' ? (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nazwa grupy *</label>
                <input
                  type="text"
                  value={data.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="np. Grupa Północ"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Opis</label>
                <textarea
                  value={data.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  rows={3}
                  placeholder="Krótki opis grupy..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Lider</label>
                <select
                  value={data.leader_id || ''}
                  onChange={(e) => handleChange('leader_id', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                >
                  <option value="">Wybierz lidera...</option>
                  {leaders.map(l => (
                    <option key={l.id} value={l.id}>{l.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Dzień spotkań</label>
                  <input
                    type="text"
                    value={data.meeting_day || ''}
                    onChange={(e) => handleChange('meeting_day', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="np. Piątek"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Godzina</label>
                  <input
                    type="time"
                    value={data.meeting_time || ''}
                    onChange={(e) => handleChange('meeting_time', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Lokalizacja</label>
                <input
                  type="text"
                  value={data.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="np. Ursynów"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Adres</label>
                <input
                  type="text"
                  value={data.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="Pełny adres"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={data.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="+48 123 456 789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={data.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Imię i Nazwisko *</label>
                <input
                  type="text"
                  value={data.full_name || ''}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder="Jan Kowalski"
                />
              </div>
              {type === 'member' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Grupa</label>
                  <select
                    value={data.group_id || ''}
                    onChange={(e) => handleChange('group_id', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  >
                    <option value="">Wybierz grupę...</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={data.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={data.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                    placeholder="+48 123 456 789"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Anuluj
          </button>
          <button
            onClick={onSave}
            className="px-6 py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeGroupsModule;
