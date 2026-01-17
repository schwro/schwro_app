import React, { useState, useEffect } from 'react';
import { getSuggestedLocation, calculateAge, formatAgeRange } from '../utils/ageCalculator';

export default function GuestCheckinForm({
  locations,
  onCheckin,
  onBack,
  loading
}) {
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    name: '',
    birthYear: '',
    parentName: '',
    parentPhone: '',
    allergies: '',
    notes: ''
  });

  const [selectedLocation, setSelectedLocation] = useState('');
  const [errors, setErrors] = useState({});

  // Auto-suggest location when birth year changes
  useEffect(() => {
    if (formData.birthYear && locations.length > 0) {
      const suggested = getSuggestedLocation(parseInt(formData.birthYear), locations);
      if (suggested) {
        setSelectedLocation(suggested.id);
      }
    }
  }, [formData.birthYear, locations]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Imię jest wymagane';
    }
    if (!formData.birthYear) {
      newErrors.birthYear = 'Rok urodzenia jest wymagany';
    }
    if (!formData.parentName.trim()) {
      newErrors.parentName = 'Imię rodzica jest wymagane';
    }
    if (!formData.parentPhone.trim()) {
      newErrors.parentPhone = 'Telefon jest wymagany';
    }
    if (!selectedLocation) {
      newErrors.location = 'Wybierz salę';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onCheckin({
      name: formData.name.trim(),
      birthYear: parseInt(formData.birthYear),
      parentName: formData.parentName.trim(),
      parentPhone: formData.parentPhone.trim(),
      allergies: formData.allergies.trim() || null,
      notes: formData.notes.trim() || null,
      locationId: selectedLocation
    });
  };

  const age = formData.birthYear ? calculateAge(parseInt(formData.birthYear)) : null;

  // Generate year options (from current year - 15 to current year)
  const yearOptions = [];
  for (let year = currentYear; year >= currentYear - 15; year--) {
    yearOptions.push(year);
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.15s ease'
  };

  const inputErrorStyle = {
    ...inputStyle,
    borderColor: '#ef4444'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
        minHeight: '100%'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px'
          }}
        >
          Check-in Gościa
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          Wprowadź dane dziecka
        </p>
      </div>

      {/* Form */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%',
          maxWidth: '450px'
        }}
      >
        {/* Child name */}
        <div>
          <label style={labelStyle}>
            Imię i nazwisko dziecka *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="np. Jan Kowalski"
            style={errors.name ? inputErrorStyle : inputStyle}
          />
          {errors.name && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>
              {errors.name}
            </div>
          )}
        </div>

        {/* Birth year and age */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>
              Rok urodzenia *
            </label>
            <select
              value={formData.birthYear}
              onChange={(e) => handleChange('birthYear', e.target.value)}
              style={errors.birthYear ? inputErrorStyle : inputStyle}
            >
              <option value="">Wybierz...</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {errors.birthYear && (
              <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>
                {errors.birthYear}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>
              Wiek
            </label>
            <div
              style={{
                padding: '14px 16px',
                fontSize: '16px',
                backgroundColor: '#f3f4f6',
                borderRadius: '10px',
                color: age !== null ? '#1f2937' : '#9ca3af'
              }}
            >
              {age !== null ? `${age} lat` : '-'}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>
            Sala *
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={errors.location ? inputErrorStyle : inputStyle}
          >
            <option value="">Wybierz salę...</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
                {loc.room_number && ` (${loc.room_number})`}
                {' - '}
                {formatAgeRange(loc)}
              </option>
            ))}
          </select>
          {errors.location && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>
              {errors.location}
            </div>
          )}
          {formData.birthYear && selectedLocation && (
            <div style={{ fontSize: '13px', color: '#22c55e', marginTop: '4px' }}>
              ✓ Sala dopasowana do wieku
            </div>
          )}
        </div>

        {/* Separator */}
        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            margin: '8px 0',
            paddingTop: '8px'
          }}
        >
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Dane rodzica/opiekuna
          </span>
        </div>

        {/* Parent name */}
        <div>
          <label style={labelStyle}>
            Imię rodzica *
          </label>
          <input
            type="text"
            value={formData.parentName}
            onChange={(e) => handleChange('parentName', e.target.value)}
            placeholder="np. Anna Kowalska"
            style={errors.parentName ? inputErrorStyle : inputStyle}
          />
          {errors.parentName && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>
              {errors.parentName}
            </div>
          )}
        </div>

        {/* Parent phone */}
        <div>
          <label style={labelStyle}>
            Telefon *
          </label>
          <input
            type="tel"
            value={formData.parentPhone}
            onChange={(e) => handleChange('parentPhone', e.target.value)}
            placeholder="np. 123 456 789"
            style={errors.parentPhone ? inputErrorStyle : inputStyle}
          />
          {errors.parentPhone && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>
              {errors.parentPhone}
            </div>
          )}
        </div>

        {/* Optional: Allergies */}
        <div>
          <label style={labelStyle}>
            Alergie (opcjonalne)
          </label>
          <input
            type="text"
            value={formData.allergies}
            onChange={(e) => handleChange('allergies', e.target.value)}
            placeholder="np. orzechy, mleko"
            style={inputStyle}
          />
        </div>

        {/* Optional: Notes */}
        <div>
          <label style={labelStyle}>
            Uwagi (opcjonalne)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Dodatkowe informacje..."
            rows={2}
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: '60px'
            }}
          />
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '16px'
          }}
        >
          <button
            onClick={onBack}
            style={{
              flex: 1,
              padding: '16px',
              fontSize: '16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            ← Wróć
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 2,
              padding: '16px',
              fontSize: '18px',
              fontWeight: '600',
              backgroundColor: '#22c55e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                Meldowanie...
              </>
            ) : (
              'Zamelduj gościa'
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus, select:focus, textarea:focus {
          border-color: #3b82f6 !important;
        }
      `}</style>
    </div>
  );
}
