import React, { useState, useEffect, useCallback } from 'react';
import { useCheckin } from './hooks/useCheckin';
import PhoneSearchScreen from './components/PhoneSearchScreen';
import HouseholdSelection from './components/HouseholdSelection';
import MemberCheckin from './components/MemberCheckin';
import GuestCheckinForm from './components/GuestCheckinForm';
import CheckinSuccess from './components/CheckinSuccess';
import CheckoutScreen from './components/CheckoutScreen';
import AttendanceDashboard from './components/AttendanceDashboard';
import SessionManager from './components/SessionManager';
import LocationManager from './components/LocationManager';

const MODES = {
  CHECKIN: 'checkin',
  GUEST: 'guest',
  CHECKOUT: 'checkout',
  ATTENDANCE: 'attendance',
  SETTINGS: 'settings'
};

const CHECKIN_STEPS = {
  PHONE_SEARCH: 'phone_search',
  HOUSEHOLD_SELECT: 'household_select',
  MEMBER_CHECKIN: 'member_checkin',
  SUCCESS: 'success'
};

export default function CheckinTab() {
  const [mode, setMode] = useState(MODES.CHECKIN);
  const [checkinStep, setCheckinStep] = useState(CHECKIN_STEPS.PHONE_SEARCH);
  const [session, setSession] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [multipleHouseholds, setMultipleHouseholds] = useState([]);
  const [checkinResults, setCheckinResults] = useState([]);
  const [settingsTab, setSettingsTab] = useState('sessions'); // 'sessions' or 'locations'

  const {
    loading,
    error,
    searchByPhone,
    getOrCreateTodaySession,
    getLocations,
    checkInStudent,
    checkInGuest
  } = useCheckin();

  // Initialize session and locations
  useEffect(() => {
    const init = async () => {
      const [sessionData, locationsData] = await Promise.all([
        getOrCreateTodaySession(),
        getLocations()
      ]);
      setSession(sessionData);
      setLocations(locationsData);
    };
    init();
  }, []);

  // Reset to start when mode changes
  useEffect(() => {
    if (mode === MODES.CHECKIN) {
      setCheckinStep(CHECKIN_STEPS.PHONE_SEARCH);
      setSelectedHousehold(null);
      setMultipleHouseholds([]);
      setCheckinResults([]);
    }
  }, [mode]);

  // Handle phone search results
  const handleHouseholdFound = useCallback((household) => {
    setSelectedHousehold(household);
    setCheckinStep(CHECKIN_STEPS.MEMBER_CHECKIN);
  }, []);

  const handleMultipleHouseholds = useCallback((households) => {
    setMultipleHouseholds(households);
    setCheckinStep(CHECKIN_STEPS.HOUSEHOLD_SELECT);
  }, []);

  const handleHouseholdSelect = useCallback((household) => {
    setSelectedHousehold(household);
    setCheckinStep(CHECKIN_STEPS.MEMBER_CHECKIN);
  }, []);

  // Handle check-in for registered children
  const handleMemberCheckin = useCallback(async (members) => {
    if (!session) return;

    const results = [];
    for (const member of members) {
      const result = await checkInStudent(
        session.id,
        member.studentId,
        member.locationId,
        selectedHousehold.id
      );
      if (result) {
        results.push(result);
      }
    }

    if (results.length > 0) {
      setCheckinResults(results);
      setCheckinStep(CHECKIN_STEPS.SUCCESS);
    }
  }, [session, selectedHousehold, checkInStudent]);

  // Handle guest check-in
  const handleGuestCheckin = useCallback(async (guestData) => {
    if (!session) return;

    const result = await checkInGuest(session.id, guestData.locationId, guestData);

    if (result) {
      setCheckinResults([result]);
      setMode(MODES.CHECKIN);
      setCheckinStep(CHECKIN_STEPS.SUCCESS);
    }
  }, [session, checkInGuest]);

  // Handle success done - return to start
  const handleSuccessDone = useCallback(() => {
    setCheckinStep(CHECKIN_STEPS.PHONE_SEARCH);
    setSelectedHousehold(null);
    setMultipleHouseholds([]);
    setCheckinResults([]);
  }, []);

  // Handle back navigation
  const handleBackToSearch = useCallback(() => {
    setCheckinStep(CHECKIN_STEPS.PHONE_SEARCH);
    setSelectedHousehold(null);
    setMultipleHouseholds([]);
  }, []);

  const handleBackFromHouseholdSelect = useCallback(() => {
    setCheckinStep(CHECKIN_STEPS.PHONE_SEARCH);
    setMultipleHouseholds([]);
  }, []);

  // Render navigation tabs
  const renderNav = () => (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: '#f3f4f6',
        borderBottom: '1px solid #e5e7eb',
        flexWrap: 'wrap'
      }}
    >
      <NavButton
        active={mode === MODES.CHECKIN}
        onClick={() => setMode(MODES.CHECKIN)}
        icon="📥"
        label="Check-in"
      />
      <NavButton
        active={mode === MODES.GUEST}
        onClick={() => setMode(MODES.GUEST)}
        icon="➕"
        label="Gość"
      />
      <NavButton
        active={mode === MODES.CHECKOUT}
        onClick={() => setMode(MODES.CHECKOUT)}
        icon="📤"
        label="Checkout"
      />
      <NavButton
        active={mode === MODES.ATTENDANCE}
        onClick={() => setMode(MODES.ATTENDANCE)}
        icon="📋"
        label="Lista obecności"
      />
      <NavButton
        active={mode === MODES.SETTINGS}
        onClick={() => setMode(MODES.SETTINGS)}
        icon="⚙️"
        label="Ustawienia"
      />
    </div>
  );

  // Render session info bar
  const renderSessionBar = () => {
    if (!session) return null;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '8px 16px',
          backgroundColor: '#dbeafe',
          borderBottom: '1px solid #bfdbfe',
          fontSize: '14px',
          color: '#1d4ed8'
        }}
      >
        <span>📅</span>
        <span>
          <strong>{session.name}</strong>
          {' • '}
          {new Date(session.session_date).toLocaleDateString('pl-PL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </span>
      </div>
    );
  };

  // Render main content based on mode
  const renderContent = () => {
    // Settings mode
    if (mode === MODES.SETTINGS) {
      return (
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <button
              onClick={() => setSettingsTab('sessions')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: settingsTab === 'sessions' ? '#3b82f6' : '#f3f4f6',
                color: settingsTab === 'sessions' ? '#ffffff' : '#374151',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Sesje
            </button>
            <button
              onClick={() => setSettingsTab('locations')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: settingsTab === 'locations' ? '#3b82f6' : '#f3f4f6',
                color: settingsTab === 'locations' ? '#ffffff' : '#374151',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Sale
            </button>
          </div>
          {settingsTab === 'sessions' ? (
            <SessionManager onSessionChange={setSession} />
          ) : (
            <LocationManager onLocationsChange={setLocations} />
          )}
        </div>
      );
    }

    // Attendance mode
    if (mode === MODES.ATTENDANCE) {
      return <AttendanceDashboard session={session} locations={locations} />;
    }

    // Checkout mode
    if (mode === MODES.CHECKOUT) {
      return <CheckoutScreen session={session} />;
    }

    // Guest mode
    if (mode === MODES.GUEST) {
      return (
        <GuestCheckinForm
          locations={locations}
          onCheckin={handleGuestCheckin}
          onBack={() => setMode(MODES.CHECKIN)}
          loading={loading}
        />
      );
    }

    // Check-in mode (wizard)
    switch (checkinStep) {
      case CHECKIN_STEPS.PHONE_SEARCH:
        return (
          <PhoneSearchScreen
            searchByPhone={searchByPhone}
            onHouseholdFound={handleHouseholdFound}
            onMultipleHouseholds={handleMultipleHouseholds}
            onNoResults={() => {}}
            onGuestClick={() => setMode(MODES.GUEST)}
            loading={loading}
          />
        );

      case CHECKIN_STEPS.HOUSEHOLD_SELECT:
        return (
          <HouseholdSelection
            households={multipleHouseholds}
            onSelect={handleHouseholdSelect}
            onBack={handleBackFromHouseholdSelect}
          />
        );

      case CHECKIN_STEPS.MEMBER_CHECKIN:
        return (
          <MemberCheckin
            household={selectedHousehold}
            locations={locations}
            onCheckin={handleMemberCheckin}
            onBack={handleBackToSearch}
            loading={loading}
          />
        );

      case CHECKIN_STEPS.SUCCESS:
        return (
          <CheckinSuccess
            checkins={checkinResults}
            onDone={handleSuccessDone}
          />
        );

      default:
        return null;
    }
  };

  // Error display
  if (error) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#dc2626'
        }}
      >
        <h2>Wystąpił błąd</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Odśwież stronę
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff'
      }}
    >
      {renderNav()}
      {renderSessionBar()}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {renderContent()}
      </div>
    </div>
  );
}

// Nav button component
function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: active ? '600' : '400',
        backgroundColor: active ? '#3b82f6' : '#ffffff',
        color: active ? '#ffffff' : '#374151',
        border: active ? 'none' : '1px solid #e5e7eb',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
