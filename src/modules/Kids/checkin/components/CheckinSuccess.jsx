import React, { useEffect, useState } from 'react';
import { printLabels } from '../utils/labelGenerator';

export default function CheckinSuccess({
  checkins,
  onDone,
  autoPrint = true,
  autoReturnSeconds = 5
}) {
  const [countdown, setCountdown] = useState(autoReturnSeconds);
  const [printed, setPrinted] = useState(false);

  // Auto print on mount
  useEffect(() => {
    if (autoPrint && checkins?.length > 0 && !printed) {
      printLabels(checkins);
      setPrinted(true);
    }
  }, [autoPrint, checkins, printed]);

  // Auto return countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onDone();
    }
  }, [countdown, onDone]);

  const handlePrintAgain = () => {
    printLabels(checkins);
  };

  const handleDoneNow = () => {
    onDone();
  };

  // Get unique security code (should be same for family)
  const securityCode = checkins?.[0]?.security_code || '---';
  const isGuest = checkins?.some(c => c.is_guest);

  // Get children names
  const childrenNames = checkins?.map(c => {
    if (c.is_guest) return c.guest_name;
    return c.kids_students?.full_name || 'Nieznane';
  }) || [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        minHeight: '100%',
        textAlign: 'center'
      }}
    >
      {/* Success icon */}
      <div
        style={{
          width: '100px',
          height: '100px',
          backgroundColor: '#dcfce7',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          animation: 'scaleIn 0.3s ease-out'
        }}
      >
        <svg
          width="50"
          height="50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: '#22c55e',
          marginBottom: '16px'
        }}
      >
        Zameldowano!
      </h1>

      {/* Security code */}
      <div
        style={{
          backgroundColor: '#fdf2f8',
          padding: '20px 40px',
          borderRadius: '16px',
          marginBottom: '24px'
        }}
      >
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
          Kod bezpieczeństwa
        </div>
        <div
          style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: '#ec4899',
            letterSpacing: '4px'
          }}
        >
          {securityCode}
        </div>
      </div>

      {/* Children list */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
          Zameldowane dzieci:
        </div>
        <div style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
          {childrenNames.join(', ')}
          {isGuest && (
            <span
              style={{
                marginLeft: '8px',
                backgroundColor: '#fbbf24',
                color: '#000',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                verticalAlign: 'middle'
              }}
            >
              GOŚĆ
            </span>
          )}
        </div>
      </div>

      {/* Print info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '32px',
          color: '#6b7280'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        <span>Etykiety zostały wysłane do drukarki</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={handlePrintAgain}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Drukuj ponownie
        </button>
        <button
          onClick={handleDoneNow}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Gotowe
        </button>
      </div>

      {/* Auto return countdown */}
      <div style={{ color: '#9ca3af', fontSize: '14px' }}>
        Powrót do ekranu głównego za {countdown}s...
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
