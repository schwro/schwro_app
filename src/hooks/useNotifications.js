import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Cache powiadomień
const CACHE_KEY = 'notifications_cache';

export function useNotifications(userEmail) {
  // Inicjalizuj z cache
  const [notifications, setNotifications] = useState(() => {
    if (!userEmail) return [];
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${userEmail}`);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]); // Wewnętrzne powiadomienia toast
  const audioRef = useRef(null);

  // Pobierz powiadomienia
  const fetchNotifications = useCallback(async () => {
    if (!userEmail) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);

      // Zapisz do cache
      try {
        localStorage.setItem(`${CACHE_KEY}_${userEmail}`, JSON.stringify(data || []));
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [userEmail]);

  // Oznacz jako przeczytane
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Oznacz wszystkie jako przeczytane
  const markAllAsRead = useCallback(async () => {
    if (!userEmail) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_email', userEmail)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [userEmail]);

  // Usuń powiadomienie
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  // Wyczyść wszystkie powiadomienia
  const clearAll = useCallback(async () => {
    if (!userEmail) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_email', userEmail);

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  }, [userEmail]);

  // Pokaż wewnętrzne powiadomienie toast
  const showToast = useCallback((notification) => {
    // Dodaj do listy toastów
    setToasts(prev => [...prev, notification]);

    // Odtwórz dźwięk
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.volume = 0.3;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => { /* ignore */ });
    } catch (e) { /* ignore */ }
  }, []);

  // Zamknij toast
  const closeToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  // Kliknięcie w toast - przejdź do linku i oznacz jako przeczytane
  const handleToastClick = useCallback((notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      window.location.href = notification.link;
    }
  }, [markAsRead]);

  // Pobierz początkowe dane i subskrybuj na zmiany
  useEffect(() => {
    if (!userEmail) return;

    fetchNotifications();

    // Subskrypcja real-time
    const subscription = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_email=eq.${userEmail}`
      }, (payload) => {
        const newNotification = payload.new;

        // Dodaj do listy
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Pokaż wewnętrzny toast
        showToast(newNotification);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userEmail, fetchNotifications, showToast]);

  // Oblicz unreadCount z notifications
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  return {
    notifications,
    loading,
    unreadCount,
    toasts,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    closeToast,
    handleToastClick,
    showToast,
    refetch: fetchNotifications
  };
}

// Ikony dla typów powiadomień
export const notificationIcons = {
  message: 'MessageSquare',
  mention: 'AtSign',
  task: 'CheckSquare',
  event: 'Calendar',
  system: 'Bell'
};

// Kolory dla typów powiadomień
export const notificationColors = {
  message: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  mention: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  task: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  event: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
  system: 'text-gray-500 bg-gray-100 dark:bg-gray-900/30'
};
