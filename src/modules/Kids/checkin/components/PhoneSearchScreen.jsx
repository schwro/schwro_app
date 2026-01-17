import React, { useState, useEffect } from 'react';
import VirtualKeypad from './VirtualKeypad';

export default function PhoneSearchScreen({
  onHouseholdFound,
  onMultipleHouseholds,
  onNoResults,
  onGuestClick,
  searchByPhone,
  loading
}) {
  const [phoneDigits, setPhoneDigits] = useState('');
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);

  // Auto-search when 4 digits entered
  useEffect(() => {
    if (phoneDigits.length === 4) {
      handleSearch();
    } else {
      setNoResults(false);
    }
  }, [phoneDigits]);

  const handleSearch = async () => {
    if (phoneDigits.length !== 4) return;

    setSearching(true);
    setNoResults(false);

    try {
      const results = await searchByPhone(phoneDigits);

      if (results.length === 0) {
        setNoResults(true);
        onNoResults?.();
      } else if (results.length === 1) {
        onHouseholdFound(results[0]);
      } else {
        onMultipleHouseholds(results);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleGuestClick = () => {
    onGuestClick?.();
  };

  const handleClear = () => {
    setPhoneDigits('');
    setNoResults(false);
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
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '12px'
          }}
        >
          Check-in Dzieci
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280' }}>
          Wpisz ostatnie 4 cyfry numeru telefonu
        </p>
      </div>

      {/* Keypad */}
      <VirtualKeypad
        value={phoneDigits}
        onChange={setPhoneDigits}
        maxLength={4}
        disabled={searching || loading}
      />

      {/* Loading/Status */}
      {(searching || loading) && (
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#3b82f6'
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '3px solid #3b82f6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <span style={{ fontSize: '16px' }}>Szukam rodziny...</span>
        </div>
      )}

      {/* No results */}
      {noResults && !searching && (
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            maxWidth: '400px'
          }}
        >
          <p style={{ fontSize: '16px', color: '#92400e', marginBottom: '16px' }}>
            Nie znaleziono rodziny z tym numerem telefonu.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleClear}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Spróbuj ponownie
            </button>
            <button
              onClick={handleGuestClick}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Dodaj jako gościa
            </button>
          </div>
        </div>
      )}

      {/* Guest button */}
      <div style={{ marginTop: '40px' }}>
        <button
          onClick={handleGuestClick}
          style={{
            padding: '16px 32px',
            fontSize: '16px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#f3f4f6';
          }}
        >
          <span style={{ fontSize: '20px' }}>+</span>
          Gość / Nowe dziecko
        </button>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
