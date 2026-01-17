import { useState, useCallback } from 'react';
import { supabase, getCachedUser } from '../../../../lib/supabase';

export function useCheckin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Wyszukaj rodziny po ostatnich 4 cyfrach telefonu
  const searchByPhone = useCallback(async (lastFourDigits) => {
    if (!lastFourDigits || lastFourDigits.length !== 4) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('households')
        .select(`
          *,
          parent_contacts (*),
          kids_students (*)
        `)
        .eq('phone_last_four', lastFourDigits);

      if (queryError) throw queryError;
      return data || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Pobierz aktywną sesję na dzisiaj
  const getActiveSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error: queryError } = await supabase
        .from('checkin_sessions')
        .select('*')
        .eq('session_date', today)
        .eq('is_active', true)
        .order('start_time', { ascending: true })
        .limit(1)
        .single();

      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }

      return data || null;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Pobierz lub utwórz sesję na dzisiaj
  const getOrCreateTodaySession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const user = await getCachedUser();

      // Sprawdź czy istnieje aktywna sesja
      let { data: session, error: selectError } = await supabase
        .from('checkin_sessions')
        .select('*')
        .eq('session_date', today)
        .eq('is_active', true)
        .order('start_time', { ascending: true })
        .limit(1)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      // Jeśli nie ma sesji, utwórz nową
      if (!session) {
        const dayName = new Date().toLocaleDateString('pl-PL', { weekday: 'long' });
        const { data: newSession, error: insertError } = await supabase
          .from('checkin_sessions')
          .insert({
            name: `Nabożeństwo - ${dayName}`,
            session_date: today,
            start_time: '09:00',
            end_time: '13:00',
            is_active: true,
            created_by: user?.email || 'system'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        session = newSession;
      }

      return session;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Pobierz dostępne lokalizacje (sale)
  const getLocations = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('checkin_locations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (queryError) throw queryError;
      return data || [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, []);

  // Wykonaj check-in dla dziecka
  const checkInStudent = useCallback(async (sessionId, studentId, locationId, householdId) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getCachedUser();

      // Wygeneruj kod bezpieczeństwa
      const { data: codeResult, error: codeError } = await supabase
        .rpc('generate_security_code', {
          p_session_id: sessionId,
          p_household_id: householdId
        });

      if (codeError) throw codeError;

      const securityCode = codeResult;

      // Utwórz rekord check-in
      const { data, error: insertError } = await supabase
        .from('checkins')
        .insert({
          session_id: sessionId,
          student_id: studentId,
          location_id: locationId,
          household_id: householdId,
          security_code: securityCode,
          checked_in_by: user?.email || 'system',
          is_guest: false
        })
        .select(`
          *,
          kids_students (*),
          checkin_locations (*)
        `)
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Wykonaj check-in dla gościa
  const checkInGuest = useCallback(async (sessionId, locationId, guestData) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getCachedUser();

      // Wygeneruj unikalny kod dla gościa (bez household_id)
      const { data: codeResult, error: codeError } = await supabase
        .rpc('generate_security_code', {
          p_session_id: sessionId,
          p_household_id: null
        });

      if (codeError) throw codeError;

      const securityCode = codeResult;

      // Utwórz rekord check-in dla gościa
      const { data, error: insertError } = await supabase
        .from('checkins')
        .insert({
          session_id: sessionId,
          student_id: null,
          location_id: locationId,
          household_id: null,
          security_code: securityCode,
          checked_in_by: user?.email || 'system',
          is_guest: true,
          guest_name: guestData.name,
          guest_birth_year: guestData.birthYear,
          guest_parent_name: guestData.parentName,
          guest_parent_phone: guestData.parentPhone,
          guest_allergies: guestData.allergies || null,
          guest_notes: guestData.notes || null
        })
        .select(`
          *,
          checkin_locations (*)
        `)
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Wyszukaj check-iny po kodzie bezpieczeństwa (dla checkout)
  const searchBySecurityCode = useCallback(async (sessionId, securityCode) => {
    if (!securityCode || securityCode.length < 2) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('checkins')
        .select(`
          *,
          kids_students (*),
          checkin_locations (*)
        `)
        .eq('session_id', sessionId)
        .eq('security_code', securityCode.toUpperCase())
        .is('checked_out_at', null);

      if (queryError) throw queryError;
      return data || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Wykonaj checkout
  const checkOut = useCallback(async (checkinId) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getCachedUser();

      const { data, error: updateError } = await supabase
        .from('checkins')
        .update({
          checked_out_at: new Date().toISOString(),
          checked_out_by: user?.email || 'system'
        })
        .eq('id', checkinId)
        .select(`
          *,
          kids_students (*),
          checkin_locations (*)
        `)
        .single();

      if (updateError) throw updateError;
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Checkout wielu dzieci naraz
  const checkOutMultiple = useCallback(async (checkinIds) => {
    setLoading(true);
    setError(null);

    try {
      const user = await getCachedUser();
      const results = [];

      for (const checkinId of checkinIds) {
        const { data, error: updateError } = await supabase
          .from('checkins')
          .update({
            checked_out_at: new Date().toISOString(),
            checked_out_by: user?.email || 'system'
          })
          .eq('id', checkinId)
          .select()
          .single();

        if (updateError) throw updateError;
        results.push(data);
      }

      return results;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Pobierz dzieci z rodziny (household)
  const getHouseholdChildren = useCallback(async (householdId) => {
    try {
      const { data, error: queryError } = await supabase
        .from('kids_students')
        .select('*')
        .eq('household_id', householdId)
        .order('full_name');

      if (queryError) throw queryError;
      return data || [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, []);

  return {
    loading,
    error,
    searchByPhone,
    getActiveSession,
    getOrCreateTodaySession,
    getLocations,
    checkInStudent,
    checkInGuest,
    searchBySecurityCode,
    checkOut,
    checkOutMultiple,
    getHouseholdChildren
  };
}
