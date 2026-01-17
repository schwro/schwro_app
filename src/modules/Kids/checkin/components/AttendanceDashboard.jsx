import React, { useState } from 'react';
import { useAttendance } from '../hooks/useAttendance';

export default function AttendanceDashboard({ session, locations }) {
  const [view, setView] = useState('list'); // 'list' or 'rooms'
  const [filter, setFilter] = useState('active'); // 'active', 'all', 'checkedout'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const {
    checkins,
    activeCheckins,
    checkedOutCheckins,
    locationStats,
    loading,
    refresh
  } = useAttendance(session?.id);

  // Filter checkins based on filter state
  const getFilteredCheckins = () => {
    let filtered = [];

    if (filter === 'active') {
      filtered = activeCheckins;
    } else if (filter === 'checkedout') {
      filtered = checkedOutCheckins;
    } else {
      filtered = checkins;
    }

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(c => c.location_id === selectedLocation);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => {
        const name = c.is_guest ? c.guest_name : c.kids_students?.full_name;
        return name?.toLowerCase().includes(term) ||
          c.security_code?.toLowerCase().includes(term);
      });
    }

    return filtered;
  };

  const filteredCheckins = getFilteredCheckins();

  // Get fill status color
  const getFillColor = (percentage) => {
    if (percentage === null) return '#e5e7eb';
    if (percentage < 70) return '#22c55e';
    if (percentage < 90) return '#eab308';
    return '#ef4444';
  };

  if (!session) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        Brak aktywnej sesji. Przejdź do ustawień, aby utworzyć sesję.
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            Lista obecności
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
            Aktualnie obecnych: <strong>{activeCheckins.length}</strong>
          </p>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setView('list')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: view === 'list' ? '#3b82f6' : '#f3f4f6',
              color: view === 'list' ? '#ffffff' : '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            📋 Lista
          </button>
          <button
            onClick={() => setView('rooms')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: view === 'rooms' ? '#3b82f6' : '#f3f4f6',
              color: view === 'rooms' ? '#ffffff' : '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🏠 Sale
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* Rooms view */}
      {view === 'rooms' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}
        >
          {locationStats.map((loc) => (
            <div
              key={loc.id}
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #e5e7eb',
                borderRadius: '16px',
                padding: '20px',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Room header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                    {loc.name}
                  </h3>
                  {loc.room_number && (
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Sala {loc.room_number}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: getFillColor(loc.fillPercentage)
                  }}
                >
                  {loc.currentCount}
                  {loc.capacity && <span style={{ fontSize: '16px', color: '#9ca3af' }}>/{loc.capacity}</span>}
                </div>
              </div>

              {/* Fill bar */}
              {loc.capacity && (
                <div
                  style={{
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(loc.fillPercentage || 0, 100)}%`,
                      backgroundColor: getFillColor(loc.fillPercentage),
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              )}

              {/* Children list */}
              {loc.children.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {loc.children.map((child) => (
                    <div
                      key={child.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    >
                      <span>
                        {child.name}
                        {child.isGuest && (
                          <span
                            style={{
                              marginLeft: '6px',
                              backgroundColor: '#fbbf24',
                              color: '#000',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}
                          >
                            GOŚĆ
                          </span>
                        )}
                      </span>
                      <span style={{ color: '#ec4899', fontWeight: '600' }}>
                        {child.securityCode}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center' }}>
                  Brak dzieci w tej sali
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <>
          {/* Filters */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}
          >
            {/* Status filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="active">Obecni ({activeCheckins.length})</option>
              <option value="checkedout">Odebrani ({checkedOutCheckins.length})</option>
              <option value="all">Wszyscy ({checkins.length})</option>
            </select>

            {/* Location filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="all">Wszystkie sale</option>
              {locations?.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Szukaj po imieniu lub kodzie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                minWidth: '250px'
              }}
            />
          </div>

          {/* Table */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={thStyle}>Imię</th>
                  <th style={thStyle}>Sala</th>
                  <th style={thStyle}>Kod</th>
                  <th style={thStyle}>Check-in</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheckins.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                      Brak wyników
                    </td>
                  </tr>
                ) : (
                  filteredCheckins.map((checkin) => {
                    const name = checkin.is_guest
                      ? checkin.guest_name
                      : checkin.kids_students?.full_name;
                    const isCheckedOut = !!checkin.checked_out_at;

                    return (
                      <tr
                        key={checkin.id}
                        style={{
                          borderTop: '1px solid #e5e7eb',
                          opacity: isCheckedOut ? 0.6 : 1
                        }}
                      >
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {name}
                            {checkin.is_guest && (
                              <span
                                style={{
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
                        </td>
                        <td style={tdStyle}>
                          {checkin.checkin_locations?.name}
                          {checkin.checkin_locations?.room_number && (
                            <span style={{ color: '#6b7280' }}>
                              {' '}({checkin.checkin_locations.room_number})
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              color: '#ec4899',
                              fontWeight: '600',
                              fontSize: '16px'
                            }}
                          >
                            {checkin.security_code}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {new Date(checkin.checked_in_at).toLocaleTimeString('pl-PL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={tdStyle}>
                          {isCheckedOut ? (
                            <span
                              style={{
                                backgroundColor: '#f3f4f6',
                                color: '#6b7280',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px'
                              }}
                            >
                              Odebrany{' '}
                              {new Date(checkin.checked_out_at).toLocaleTimeString('pl-PL', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          ) : (
                            <span
                              style={{
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              Obecny
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {loading && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid #ffffff',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          Odświeżanie...
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const thStyle = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tdStyle = {
  padding: '14px 16px',
  fontSize: '14px'
};
