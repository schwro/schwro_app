import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';

export default function LocationManager({ onLocationsChange }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    room_number: '',
    min_age: '',
    max_age: '',
    capacity: '',
    sort_order: 0
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('checkin_locations')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setLocations(data || []);
      if (onLocationsChange) onLocationsChange(data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      room_number: '',
      min_age: '',
      max_age: '',
      capacity: '',
      sort_order: locations.length
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (location) => {
    setFormData({
      name: location.name,
      room_number: location.room_number || '',
      min_age: location.min_age?.toString() || '',
      max_age: location.max_age?.toString() || '',
      capacity: location.capacity?.toString() || '',
      sort_order: location.sort_order || 0
    });
    setEditingId(location.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = {
      name: formData.name,
      room_number: formData.room_number || null,
      min_age: formData.min_age ? parseInt(formData.min_age) : null,
      max_age: formData.max_age ? parseInt(formData.max_age) : null,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      sort_order: formData.sort_order || 0,
      is_active: true
    };

    try {
      if (editingId) {
        const { data, error } = await supabase
          .from('checkin_locations')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;
        setLocations(prev => prev.map(l => (l.id === data.id ? data : l)));
      } else {
        const { data, error } = await supabase
          .from('checkin_locations')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setLocations(prev => [...prev, data]);
      }

      resetForm();
      fetchLocations(); // Refresh to get updated list
    } catch (err) {
      console.error('Error saving location:', err);
      alert('Błąd podczas zapisywania sali');
    }
  };

  const handleToggleActive = async (location) => {
    try {
      const { data, error } = await supabase
        .from('checkin_locations')
        .update({ is_active: !location.is_active })
        .eq('id', location.id)
        .select()
        .single();

      if (error) throw error;

      setLocations(prev =>
        prev.map(l => (l.id === data.id ? data : l))
      );
    } catch (err) {
      console.error('Error toggling location:', err);
    }
  };

  const handleDelete = async (locationId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę salę?')) return;

    try {
      const { error } = await supabase
        .from('checkin_locations')
        .delete()
        .eq('id', locationId);

      if (error) throw error;

      setLocations(prev => prev.filter(l => l.id !== locationId));
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Nie można usunąć sali - może być używana w check-inach');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Sale / Lokalizacje</h3>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
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
          + Nowa sala
        </button>
      </div>

      {/* Create/Edit form */}
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
            <div>
              <label style={labelStyle}>Nazwa sali *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="np. Przedszkolaki"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Numer pokoju</label>
              <input
                type="text"
                value={formData.room_number}
                onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                placeholder="np. 101"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Wiek min.</label>
              <input
                type="number"
                value={formData.min_age}
                onChange={(e) => setFormData(prev => ({ ...prev, min_age: e.target.value }))}
                placeholder="np. 3"
                min="0"
                max="18"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Wiek max.</label>
              <input
                type="number"
                value={formData.max_age}
                onChange={(e) => setFormData(prev => ({ ...prev, max_age: e.target.value }))}
                placeholder="np. 5"
                min="0"
                max="18"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Pojemność</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                placeholder="np. 15"
                min="1"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Kolejność</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                min="0"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={resetForm}
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
              onClick={handleSave}
              disabled={!formData.name}
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
              {editingId ? 'Zapisz zmiany' : 'Dodaj salę'}
            </button>
          </div>
        </div>
      )}

      {/* Locations list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Ładowanie...
        </div>
      ) : locations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Brak sal. Dodaj pierwszą salę dla dzieci.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {locations.map((location) => (
            <div
              key={location.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                backgroundColor: '#ffffff',
                border: `2px solid ${location.is_active ? '#e5e7eb' : '#fecaca'}`,
                borderRadius: '12px',
                opacity: location.is_active ? 1 : 0.6
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    {location.name}
                  </span>
                  {location.room_number && (
                    <span
                      style={{
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      Sala {location.room_number}
                    </span>
                  )}
                  {!location.is_active && (
                    <span
                      style={{
                        backgroundColor: '#fecaca',
                        color: '#991b1b',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      Nieaktywna
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  {location.min_age !== null || location.max_age !== null ? (
                    <>
                      Wiek:{' '}
                      {location.min_age !== null && location.max_age !== null
                        ? `${location.min_age}-${location.max_age} lat`
                        : location.min_age !== null
                        ? `od ${location.min_age} lat`
                        : `do ${location.max_age} lat`}
                    </>
                  ) : (
                    'Wszystkie wieki'
                  )}
                  {location.capacity && ` • Pojemność: ${location.capacity}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(location)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleToggleActive(location)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    backgroundColor: location.is_active ? '#fee2e2' : '#dcfce7',
                    color: location.is_active ? '#991b1b' : '#166534',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {location.is_active ? 'Wyłącz' : 'Włącz'}
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
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
