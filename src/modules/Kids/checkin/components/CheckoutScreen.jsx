import React, { useState } from 'react';
import { useCheckin } from '../hooks/useCheckin';
import VirtualKeypad from './VirtualKeypad';

export default function CheckoutScreen({ session }) {
  const [searchMode, setSearchMode] = useState('code'); // 'code' or 'phone'
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCheckins, setSelectedCheckins] = useState({});
  const [searching, setSearching] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkedOutNames, setCheckedOutNames] = useState([]);

  const { searchBySecurityCode, searchByPhone, checkOutMultiple, loading } = useCheckin();

  const handleSearch = async () => {
    if (!searchValue || !session) return;

    setSearching(true);
    setSearchResults([]);
    setSelectedCheckins({});

    try {
      let results = [];

      if (searchMode === 'code') {
        results = await searchBySecurityCode(session.id, searchValue);
      } else {
        // Phone search - get household, then find active checkins
        const households = await searchByPhone(searchValue);
        if (households.length > 0) {
          // For simplicity, search by security code for each household's kids
          // In a real scenario, you'd want a dedicated endpoint
          for (const household of households) {
            const householdResults = await searchBySecurityCode(session.id, '');
            results = [
              ...results,
              ...householdResults.filter(c => c.household_id === household.id)
            ];
          }
        }
      }

      setSearchResults(results);

      // Auto-select all if only one result
      if (results.length === 1) {
        setSelectedCheckins({ [results[0].id]: true });
      }
    } finally {
      setSearching(false);
    }
  };

  const handleToggleSelect = (checkinId) => {
    setSelectedCheckins(prev => ({
      ...prev,
      [checkinId]: !prev[checkinId]
    }));
  };

  const handleSelectAll = () => {
    const allSelected = {};
    searchResults.forEach(r => {
      allSelected[r.id] = true;
    });
    setSelectedCheckins(allSelected);
  };

  const handleCheckout = async () => {
    const selectedIds = Object.entries(selectedCheckins)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedIds.length === 0) return;

    const results = await checkOutMultiple(selectedIds);

    if (results.length > 0) {
      const names = searchResults
        .filter(r => selectedIds.includes(r.id))
        .map(r => r.is_guest ? r.guest_name : r.kids_students?.full_name);

      setCheckedOutNames(names);
      setCheckoutSuccess(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setCheckoutSuccess(false);
        setSearchValue('');
        setSearchResults([]);
        setSelectedCheckins({});
        setCheckedOutNames([]);
      }, 3000);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    setSearchResults([]);
    setSelectedCheckins({});
  };

  const selectedCount = Object.values(selectedCheckins).filter(Boolean).length;

  // Success screen
  if (checkoutSuccess) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#dcfce7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e', marginBottom: '16px' }}>
          Odebrano!
        </h2>
        <p style={{ fontSize: '18px', color: '#374151' }}>
          {checkedOutNames.join(', ')}
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        Brak aktywnej sesji. Przejdź do ustawień, aby utworzyć sesję.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          Checkout - Odbiór dzieci
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          Wpisz kod bezpieczeństwa z biletu
        </p>
      </div>

      {/* Search mode toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => {
            setSearchMode('code');
            handleClear();
          }}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            backgroundColor: searchMode === 'code' ? '#3b82f6' : '#f3f4f6',
            color: searchMode === 'code' ? '#ffffff' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Po kodzie
        </button>
        <button
          onClick={() => {
            setSearchMode('phone');
            handleClear();
          }}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            backgroundColor: searchMode === 'phone' ? '#3b82f6' : '#f3f4f6',
            color: searchMode === 'phone' ? '#ffffff' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Po telefonie
        </button>
      </div>

      {/* Search input */}
      {searchMode === 'code' ? (
        <div style={{ marginBottom: '24px' }}>
          {/* Code input display */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
              placeholder="np. A34"
              maxLength={4}
              style={{
                width: '150px',
                padding: '16px',
                fontSize: '32px',
                fontWeight: 'bold',
                textAlign: 'center',
                border: '3px solid #e5e7eb',
                borderRadius: '12px',
                textTransform: 'uppercase',
                letterSpacing: '4px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchValue || searching}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: searchValue ? '#3b82f6' : '#e5e7eb',
              color: searchValue ? '#ffffff' : '#9ca3af',
              border: 'none',
              borderRadius: '10px',
              cursor: searchValue ? 'pointer' : 'not-allowed'
            }}
          >
            {searching ? 'Szukam...' : 'Szukaj'}
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: '24px' }}>
          <VirtualKeypad
            value={searchValue}
            onChange={setSearchValue}
            maxLength={4}
            disabled={searching}
          />
          <button
            onClick={handleSearch}
            disabled={searchValue.length !== 4 || searching}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: searchValue.length === 4 ? '#3b82f6' : '#e5e7eb',
              color: searchValue.length === 4 ? '#ffffff' : '#9ca3af',
              border: 'none',
              borderRadius: '10px',
              cursor: searchValue.length === 4 ? 'pointer' : 'not-allowed'
            }}
          >
            {searching ? 'Szukam...' : 'Szukaj rodziny'}
          </button>
        </div>
      )}

      {/* Results */}
      {searchResults.length > 0 && (
        <div
          style={{
            width: '100%',
            maxWidth: '500px',
            marginTop: '16px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}
          >
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              Znaleziono {searchResults.length} {searchResults.length === 1 ? 'dziecko' : 'dzieci'}
            </span>
            {searchResults.length > 1 && (
              <button
                onClick={handleSelectAll}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Zaznacz wszystkie
              </button>
            )}
          </div>

          {/* Children list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {searchResults.map((checkin) => {
              const name = checkin.is_guest
                ? checkin.guest_name
                : checkin.kids_students?.full_name;
              const isSelected = selectedCheckins[checkin.id];

              return (
                <div
                  key={checkin.id}
                  onClick={() => handleToggleSelect(checkin.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 20px',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      border: `2px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#3b82f6' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M13.5 4.5L6 12L2.5 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                      {name}
                      {checkin.is_guest && (
                        <span
                          style={{
                            marginLeft: '8px',
                            backgroundColor: '#fbbf24',
                            color: '#000',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}
                        >
                          GOŚĆ
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {checkin.checkin_locations?.name}
                      {' • '}
                      Check-in:{' '}
                      {new Date(checkin.checked_in_at).toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* Code */}
                  <div style={{ color: '#ec4899', fontWeight: '600', fontSize: '18px' }}>
                    {checkin.security_code}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout button */}
          <button
            onClick={handleCheckout}
            disabled={selectedCount === 0 || loading}
            style={{
              width: '100%',
              marginTop: '24px',
              padding: '16px',
              fontSize: '18px',
              fontWeight: '600',
              backgroundColor: selectedCount > 0 ? '#22c55e' : '#e5e7eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              cursor: selectedCount > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            {loading ? 'Przetwarzanie...' : `Odbierz ${selectedCount > 0 ? `(${selectedCount})` : ''}`}
          </button>
        </div>
      )}

      {/* No results */}
      {searchResults.length === 0 && searchValue && !searching && (
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
          <p style={{ fontSize: '16px', color: '#92400e' }}>
            Nie znaleziono aktywnych check-inów dla tego kodu.
          </p>
          <button
            onClick={handleClear}
            style={{
              marginTop: '12px',
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Spróbuj ponownie
          </button>
        </div>
      )}
    </div>
  );
}
