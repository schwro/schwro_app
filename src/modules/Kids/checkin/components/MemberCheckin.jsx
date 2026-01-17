import React, { useState, useEffect } from 'react';
import { getSuggestedLocation, formatAge, formatAgeRange } from '../utils/ageCalculator';

export default function MemberCheckin({
  household,
  locations,
  onCheckin,
  onBack,
  loading
}) {
  const [selectedMembers, setSelectedMembers] = useState({});
  const [memberLocations, setMemberLocations] = useState({});

  const children = household?.kids_students || [];
  const primaryContact = household?.parent_contacts?.find(c => c.is_primary)
    || household?.parent_contacts?.[0];

  // Initialize default locations based on age
  useEffect(() => {
    if (children.length > 0 && locations.length > 0) {
      const defaults = {};
      children.forEach(child => {
        const suggested = getSuggestedLocation(child.birth_year, locations);
        if (suggested) {
          defaults[child.id] = suggested.id;
        }
      });
      setMemberLocations(defaults);
    }
  }, [children, locations]);

  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const handleLocationChange = (memberId, locationId) => {
    setMemberLocations(prev => ({
      ...prev,
      [memberId]: locationId
    }));
  };

  const handleCheckin = () => {
    const membersToCheckin = children
      .filter(child => selectedMembers[child.id])
      .map(child => ({
        studentId: child.id,
        locationId: memberLocations[child.id]
      }));

    if (membersToCheckin.length > 0) {
      onCheckin(membersToCheckin);
    }
  };

  const selectedCount = Object.values(selectedMembers).filter(Boolean).length;

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
          {household?.family_name}
        </h1>
        {primaryContact && (
          <p style={{ fontSize: '16px', color: '#6b7280' }}>
            {primaryContact.full_name}
          </p>
        )}
      </div>

      {/* Children list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '500px',
          marginBottom: '32px'
        }}
      >
        {children.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#fef3c7',
              borderRadius: '12px',
              color: '#92400e'
            }}
          >
            Brak zarejestrowanych dzieci w tej rodzinie
          </div>
        ) : (
          children.map((child) => {
            const isSelected = selectedMembers[child.id];
            const selectedLocation = locations.find(l => l.id === memberLocations[child.id]);

            return (
              <div
                key={child.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 20px',
                  backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                  border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: '16px',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Child row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleMemberToggle(child.id)}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      border: `2px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#3b82f6' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M13.5 4.5L6 12L2.5 8.5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Name and age */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}
                    >
                      {child.full_name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {formatAge(child.birth_year)}
                      {child.allergies && (
                        <span
                          style={{
                            marginLeft: '8px',
                            backgroundColor: '#fecaca',
                            color: '#991b1b',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                        >
                          Alergie
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location selector - only show when selected */}
                {isSelected && (
                  <div style={{ marginTop: '16px', paddingLeft: '44px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '8px'
                      }}
                    >
                      Sala:
                    </label>
                    <select
                      value={memberLocations[child.id] || ''}
                      onChange={(e) => handleLocationChange(child.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer'
                      }}
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
                    {selectedLocation && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '13px',
                          color: '#6b7280'
                        }}
                      >
                        Pojemność: {selectedLocation.capacity || '∞'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          width: '100%',
          maxWidth: '500px'
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
          onClick={handleCheckin}
          disabled={selectedCount === 0 || loading}
          style={{
            flex: 2,
            padding: '16px',
            fontSize: '18px',
            fontWeight: '600',
            backgroundColor: selectedCount > 0 ? '#22c55e' : '#d1d5db',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
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
            <>
              Check In {selectedCount > 0 && `(${selectedCount})`}
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
