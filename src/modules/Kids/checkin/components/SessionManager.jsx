import React, { useState, useEffect } from 'react';
import { supabase, getCachedUser } from '../../../../lib/supabase';

export default function SessionManager({ onSessionChange }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '13:00'
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('checkin_sessions')
        .select('*')
        .order('session_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const user = await getCachedUser();
      const { data, error } = await supabase
        .from('checkin_sessions')
        .insert({
          ...formData,
          is_active: true,
          created_by: user?.email || 'system'
        })
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => [data, ...prev]);
      setShowForm(false);
      setFormData({
        name: '',
        session_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '13:00'
      });

      if (onSessionChange) onSessionChange(data);
    } catch (err) {
      console.error('Error creating session:', err);
      alert('Błąd podczas tworzenia sesji');
    }
  };

  const handleToggleActive = async (session) => {
    try {
      const { data, error } = await supabase
        .from('checkin_sessions')
        .update({ is_active: !session.is_active })
        .eq('id', session.id)
        .select()
        .single();

      if (error) throw error;

      setSessions(prev =>
        prev.map(s => (s.id === data.id ? data : s))
      );

      if (data.is_active && onSessionChange) {
        onSessionChange(data);
      }
    } catch (err) {
      console.error('Error toggling session:', err);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę sesję?')) return;

    try {
      const { error } = await supabase
        .from('checkin_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Error deleting session:', err);
      alert('Błąd podczas usuwania sesji');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Sesje Check-in</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          + Nowa sesja
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          style={{
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nazwa sesji</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="np. Nabożeństwo niedzielne"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Data</label>
              <input
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData(prev => ({ ...prev, session_date: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Start</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Koniec</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Anuluj
            </button>
            <button
              onClick={handleCreate}
              disabled={!formData.name || !formData.session_date}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: formData.name ? '#22c55e' : '#e5e7eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: formData.name ? 'pointer' : 'not-allowed'
              }}
            >
              Utwórz sesję
            </button>
          </div>
        </div>
      )}

      {/* Sessions list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Ładowanie...
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Brak sesji. Utwórz pierwszą sesję check-in.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                backgroundColor: '#ffffff',
                border: `2px solid ${session.is_active ? '#22c55e' : '#e5e7eb'}`,
                borderRadius: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                  {session.name}
                  {session.is_active && (
                    <span
                      style={{
                        marginLeft: '8px',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      Aktywna
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  {new Date(session.session_date).toLocaleDateString('pl-PL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                  {session.start_time && ` • ${session.start_time} - ${session.end_time}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleToggleActive(session)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    backgroundColor: session.is_active ? '#fee2e2' : '#dcfce7',
                    color: session.is_active ? '#991b1b' : '#166534',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {session.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                </button>
                <button
                  onClick={() => handleDelete(session.id)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '14px',
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  backgroundColor: '#ffffff'
};
