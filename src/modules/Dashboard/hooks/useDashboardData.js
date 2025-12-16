import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

export function useDashboardData(userEmail) {
  const [data, setData] = useState({
    userProfile: null,
    upcomingMinistry: [],
    pastMinistry: [],
    upcomingPrograms: [],
    tasks: [],
    absences: [],
    prayers: [],
    stats: {
      tasksCount: 0,
      upcomingServicesCount: 0,
      prayersCount: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const userNameRef = useRef(null);

  // Pobierz profil użytkownika
  const fetchUserProfile = useCallback(async () => {
    if (!userEmail) return null;

    try {
      const { data: profile } = await supabase
        .from('app_users')
        .select('full_name, avatar_url, role')
        .eq('email', userEmail)
        .maybeSingle();

      if (profile) {
        userNameRef.current = profile.full_name;
      }
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, [userEmail]);

  // Helper do filtrowania i mapowania programów
  const filterAndMapPrograms = (programs, searchName) => {
    if (!programs) return [];

    const userPrograms = programs.filter(program => {
      const zespol = program.zespol || {};
      const produkcja = program.produkcja || {};
      const atmosfera_team = program.atmosfera_team || {};
      const szkolka = program.szkolka || {};
      const scena = program.scena || {};

      const checkField = (obj) => Object.values(obj).some(val =>
        typeof val === 'string' && val.toLowerCase().includes(searchName.toLowerCase())
      );

      return checkField(zespol) || checkField(produkcja) || checkField(atmosfera_team) ||
             checkField(szkolka) || checkField(scena);
    });

    return userPrograms.map(program => {
      const roles = [];

      const checkRoles = (obj, category) => {
        Object.entries(obj || {}).forEach(([key, val]) => {
          if (typeof val === 'string' && val.toLowerCase().includes(searchName.toLowerCase())) {
            roles.push({ category, role: key });
          }
        });
      };

      checkRoles(program.zespol, 'Zespół');
      checkRoles(program.produkcja, 'Produkcja');
      checkRoles(program.atmosfera_team, 'Atmosfera');
      checkRoles(program.szkolka, 'Szkółka');
      checkRoles(program.scena, 'Scena');

      return {
        id: program.id,
        date: program.date,
        title: program.title || 'Nabożeństwo niedzielne',
        roles,
        notes: program.zespol?.notatki || '',
      };
    });
  };

  // Pobierz nadchodzące służby użytkownika (z pominięciem tych, na które ma nieobecność)
  const fetchUpcomingMinistry = useCallback(async (userName) => {
    if (!userEmail) return [];

    try {
      const today = new Date().toISOString().split('T')[0];

      // Pobierz programy i nieobecności równolegle
      const [programsResponse, absencesResponse] = await Promise.all([
        supabase
          .from('programs')
          .select('*')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(20),
        supabase
          .from('user_absences')
          .select('program_id')
          .eq('user_email', userEmail)
          .gte('absence_date', today)
      ]);

      const programs = programsResponse.data || [];
      const absences = absencesResponse.data || [];

      // Utwórz zbiór ID programów, na które użytkownik ma nieobecność
      const absentProgramIds = new Set(absences.map(a => a.program_id));

      // Filtruj programy - pomiń te z nieobecnością
      const availablePrograms = programs.filter(p => !absentProgramIds.has(p.id));

      return filterAndMapPrograms(availablePrograms, userName || userEmail);
    } catch (error) {
      console.error('Error fetching upcoming ministry:', error);
      return [];
    }
  }, [userEmail]);

  // Pobierz historię służb użytkownika
  const fetchPastMinistry = useCallback(async (userName) => {
    if (!userEmail) return [];

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: programs } = await supabase
        .from('programs')
        .select('*')
        .lt('date', today)
        .order('date', { ascending: false })
        .limit(10);

      return filterAndMapPrograms(programs, userName || userEmail);
    } catch (error) {
      console.error('Error fetching past ministry:', error);
      return [];
    }
  }, [userEmail]);

  // Pobierz wszystkie nadchodzące programy (dla widgetu nieobecności)
  const fetchUpcomingPrograms = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: programs } = await supabase
        .from('programs')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(30);

      return programs || [];
    } catch (error) {
      console.error('Error fetching upcoming programs:', error);
      return [];
    }
  }, []);

  // Pobierz zadania użytkownika ze wszystkich źródeł
  const fetchTasks = useCallback(async (userName) => {
    if (!userEmail) return [];

    try {
      const allTasks = [];

      // 1. Pobierz osobiste zadania z user_tasks
      const { data: personalTasks } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_email', userEmail)
        .order('due_date', { ascending: true });

      if (personalTasks) {
        allTasks.push(...personalTasks.map(task => ({
          ...task,
          source: 'personal',
          source_label: 'Osobiste',
        })));
      }

      // 2. Pobierz zadania z grup domowych (home_group_tasks)
      // Szukaj lidera po emailu lub po full_name
      let homeGroupLeaderId = null;

      // Najpierw spróbuj po emailu
      const { data: leaderByEmail } = await supabase
        .from('home_group_leaders')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (leaderByEmail?.id) {
        homeGroupLeaderId = leaderByEmail.id;
      } else if (userName) {
        // Jeśli nie znaleziono po emailu, szukaj po full_name
        const { data: leaderByName } = await supabase
          .from('home_group_leaders')
          .select('id')
          .eq('full_name', userName)
          .maybeSingle();

        if (leaderByName?.id) {
          homeGroupLeaderId = leaderByName.id;
        }
      }

      if (homeGroupLeaderId) {
        const { data: homeGroupTasks } = await supabase
          .from('home_group_tasks')
          .select(`
            *,
            home_groups:group_id (name)
          `)
          .eq('assigned_to', homeGroupLeaderId)
          .order('due_date', { ascending: true });

        if (homeGroupTasks) {
          allTasks.push(...homeGroupTasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            due_date: task.due_date,
            status: task.status === 'Do zrobienia' ? 'todo' : task.status === 'W trakcie' ? 'in_progress' : 'done',
            created_at: task.created_at,
            updated_at: task.updated_at,
            source: 'home_group',
            source_label: task.home_groups?.name || 'Grupa domowa',
            original_id: task.id,
            original_table: 'home_group_tasks',
          })));
        }
      }

      // 3. Pobierz zadania z media team (media_tasks)
      // Szukaj członka po emailu lub po full_name
      let mediaTeamMemberId = null;

      // Najpierw spróbuj po emailu
      const { data: mediaByEmail } = await supabase
        .from('media_team')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (mediaByEmail?.id) {
        mediaTeamMemberId = mediaByEmail.id;
      } else if (userName) {
        // Jeśli nie znaleziono po emailu, szukaj po full_name
        const { data: mediaByName } = await supabase
          .from('media_team')
          .select('id')
          .eq('full_name', userName)
          .maybeSingle();

        if (mediaByName?.id) {
          mediaTeamMemberId = mediaByName.id;
        }
      }

      if (mediaTeamMemberId) {
        const { data: mediaTasks } = await supabase
          .from('media_tasks')
          .select('*')
          .eq('assigned_to', mediaTeamMemberId)
          .order('due_date', { ascending: true });

        if (mediaTasks) {
          allTasks.push(...mediaTasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            due_date: task.due_date,
            status: task.status === 'Do zrobienia' ? 'todo' : task.status === 'W trakcie' ? 'in_progress' : 'done',
            created_at: task.created_at,
            updated_at: task.updated_at,
            source: 'media_team',
            source_label: 'Media Team',
            original_id: task.id,
            original_table: 'media_tasks',
          })));
        }
      }

      // Sortuj wszystkie zadania według due_date
      allTasks.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });

      return allTasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }, [userEmail]);

  // Pobierz nieobecności użytkownika
  const fetchAbsences = useCallback(async () => {
    if (!userEmail) return [];

    try {
      const { data: absences } = await supabase
        .from('user_absences')
        .select(`
          *,
          programs:program_id (date)
        `)
        .eq('user_email', userEmail)
        .order('absence_date', { ascending: false })
        .limit(10);

      return absences || [];
    } catch (error) {
      console.error('Error fetching absences:', error);
      return [];
    }
  }, [userEmail]);

  // Pobierz modlitwy użytkownika (tylko aktywne)
  const fetchPrayers = useCallback(async () => {
    if (!userEmail) return [];

    try {
      const { data: prayers } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('user_email', userEmail)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      return prayers || [];
    } catch (error) {
      console.error('Error fetching prayers:', error);
      return [];
    }
  }, [userEmail]);

  // Pobierz wszystkie dane
  const fetchAllData = useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const userProfile = await fetchUserProfile();
      const userName = userProfile?.full_name;

      const [upcomingMinistry, pastMinistry, upcomingPrograms, tasks, absences, prayers] = await Promise.all([
        fetchUpcomingMinistry(userName),
        fetchPastMinistry(userName),
        fetchUpcomingPrograms(),
        fetchTasks(userName),
        fetchAbsences(),
        fetchPrayers(),
      ]);

      const pendingTasks = tasks.filter(t => t.status !== 'done');

      setData({
        userProfile,
        upcomingMinistry,
        pastMinistry,
        upcomingPrograms,
        tasks,
        absences,
        prayers,
        stats: {
          tasksCount: pendingTasks.length,
          upcomingServicesCount: upcomingMinistry.length,
          prayersCount: prayers.length,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [userEmail, fetchUserProfile, fetchUpcomingMinistry, fetchPastMinistry, fetchUpcomingPrograms, fetchTasks, fetchAbsences, fetchPrayers]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refreshMinistry = useCallback(async () => {
    const [upcoming, past] = await Promise.all([
      fetchUpcomingMinistry(userNameRef.current),
      fetchPastMinistry(userNameRef.current),
    ]);
    setData(prev => ({
      ...prev,
      upcomingMinistry: upcoming,
      pastMinistry: past,
      stats: { ...prev.stats, upcomingServicesCount: upcoming.length },
    }));
  }, [fetchUpcomingMinistry, fetchPastMinistry]);

  const refreshTasks = useCallback(async () => {
    const tasks = await fetchTasks(userNameRef.current);
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    setData(prev => ({
      ...prev,
      tasks,
      stats: { ...prev.stats, tasksCount: pendingTasks.length },
    }));
  }, [fetchTasks]);

  const refreshAbsences = useCallback(async () => {
    const absences = await fetchAbsences();
    setData(prev => ({ ...prev, absences }));
  }, [fetchAbsences]);

  const refreshPrayers = useCallback(async () => {
    const prayers = await fetchPrayers();
    setData(prev => ({
      ...prev,
      prayers,
      stats: { ...prev.stats, prayersCount: prayers.length },
    }));
  }, [fetchPrayers]);

  return {
    ...data,
    loading,
    refresh: fetchAllData,
    refreshMinistry,
    refreshTasks,
    refreshAbsences,
    refreshPrayers,
  };
}
