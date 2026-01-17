import React from 'react';

export default function HouseholdSelection({ households, onSelect, onBack }) {
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
            marginBottom: '12px'
          }}
        >
          Wybierz rodzinę
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          Znaleziono {households.length} rodzin z tym numerem telefonu
        </p>
      </div>

      {/* Household cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '500px'
        }}
      >
        {households.map((household) => {
          const primaryContact = household.parent_contacts?.find(c => c.is_primary)
            || household.parent_contacts?.[0];
          const childrenCount = household.kids_students?.length || 0;

          return (
            <button
              key={household.id}
              onClick={() => onSelect(household)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '20px 24px',
                backgroundColor: '#ffffff',
                border: '2px solid #e5e7eb',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              {/* Family name */}
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '8px'
                }}
              >
                {household.family_name}
              </div>

              {/* Primary contact */}
              {primaryContact && (
                <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '4px' }}>
                  {primaryContact.full_name}
                  {primaryContact.phone && ` • ${primaryContact.phone}`}
                </div>
              )}

              {/* Children count */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px'
                }}
              >
                <span
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  {childrenCount} {childrenCount === 1 ? 'dziecko' : childrenCount < 5 ? 'dzieci' : 'dzieci'}
                </span>
              </div>

              {/* Children names preview */}
              {household.kids_students?.length > 0 && (
                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '14px',
                    color: '#9ca3af'
                  }}
                >
                  {household.kids_students.map(s => s.full_name).join(', ')}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          marginTop: '32px',
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#f3f4f6',
          color: '#374151',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        ← Wróć do wyszukiwania
      </button>
    </div>
  );
}
