import React from 'react';

export default function VirtualKeypad({ value, onChange, maxLength = 4, disabled = false }) {
  const handleDigitPress = (digit) => {
    if (disabled) return;
    if (value.length < maxLength) {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  const buttonStyle = {
    width: '80px',
    height: '80px',
    fontSize: '32px',
    fontWeight: 'bold',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
    color: disabled ? '#9ca3af' : '#1f2937',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none'
  };

  const buttonHoverStyle = {
    ...buttonStyle,
    backgroundColor: '#f3f4f6'
  };

  const actionButtonStyle = {
    ...buttonStyle,
    fontSize: '18px',
    backgroundColor: '#f3f4f6'
  };

  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '<']
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
      {/* Display */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          justifyContent: 'center'
        }}
      >
        {[...Array(maxLength)].map((_, index) => (
          <div
            key={index}
            style={{
              width: '60px',
              height: '70px',
              border: '3px solid ' + (value[index] ? '#3b82f6' : '#e5e7eb'),
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#1f2937',
              backgroundColor: value[index] ? '#eff6ff' : '#ffffff',
              transition: 'all 0.15s ease'
            }}
          >
            {value[index] || ''}
          </div>
        ))}
      </div>

      {/* Keypad */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {digits.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', gap: '12px' }}>
            {row.map((key) => {
              if (key === 'C') {
                return (
                  <button
                    key={key}
                    onClick={handleClear}
                    disabled={disabled || value.length === 0}
                    style={{
                      ...actionButtonStyle,
                      color: '#ef4444',
                      opacity: value.length === 0 ? 0.5 : 1
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    Wyczyść
                  </button>
                );
              }
              if (key === '<') {
                return (
                  <button
                    key={key}
                    onClick={handleBackspace}
                    disabled={disabled || value.length === 0}
                    style={{
                      ...actionButtonStyle,
                      opacity: value.length === 0 ? 0.5 : 1
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    ←
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  onClick={() => handleDigitPress(key)}
                  disabled={disabled || value.length >= maxLength}
                  style={buttonStyle}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={(e) => {
                    if (!disabled) e.target.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled) e.target.style.backgroundColor = '#ffffff';
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
