import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { DEFAULT_LAYOUT, LOCAL_STORAGE_KEY, validateLayout } from '../utils/layoutDefaults';

export function useDashboardLayout(userEmail) {
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pobierz układ z bazy danych lub localStorage
  useEffect(() => {
    async function fetchLayout() {
      if (!userEmail) {
        setLoading(false);
        return;
      }

      try {
        // Najpierw spróbuj z localStorage (cache)
        const cachedLayout = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userEmail}`);
        if (cachedLayout) {
          const parsed = JSON.parse(cachedLayout);
          setLayout(validateLayout(parsed));
        }

        // Pobierz z bazy danych
        const { data, error } = await supabase
          .from('user_dashboard_layouts')
          .select('layout')
          .eq('user_email', userEmail)
          .maybeSingle();

        if (error) {
          console.error('Error fetching dashboard layout:', error);
          // Fallback do cache lub domyślnego
          if (!cachedLayout) {
            setLayout(DEFAULT_LAYOUT);
          }
        } else if (data?.layout) {
          const validatedLayout = validateLayout(data.layout);
          setLayout(validatedLayout);
          // Zaktualizuj cache
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userEmail}`, JSON.stringify(validatedLayout));
        } else {
          // Brak zapisanego układu - użyj domyślnego
          setLayout(DEFAULT_LAYOUT);
        }
      } catch (error) {
        console.error('Error in fetchLayout:', error);
        setLayout(DEFAULT_LAYOUT);
      } finally {
        setLoading(false);
      }
    }

    fetchLayout();
  }, [userEmail]);

  // Zapisz układ do bazy danych
  const saveLayout = useCallback(async (newLayout) => {
    if (!userEmail) return;

    const validatedLayout = validateLayout(newLayout);
    setLayout(validatedLayout);
    setSaving(true);

    // Zapisz do localStorage natychmiast
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userEmail}`, JSON.stringify(validatedLayout));

    try {
      // Upsert do bazy danych
      const { error } = await supabase
        .from('user_dashboard_layouts')
        .upsert(
          {
            user_email: userEmail,
            layout: validatedLayout,
          },
          {
            onConflict: 'user_email',
          }
        );

      if (error) {
        console.error('Error saving dashboard layout:', error);
      }
    } catch (error) {
      console.error('Error in saveLayout:', error);
    } finally {
      setSaving(false);
    }
  }, [userEmail]);

  // Aktualizuj kolejność widgetów (po drag-and-drop)
  const updateOrder = useCallback((reorderedWidgetIds) => {
    const newLayout = layout.map(item => ({
      ...item,
      order: reorderedWidgetIds.indexOf(item.widgetId),
    })).sort((a, b) => a.order - b.order);

    saveLayout(newLayout);
  }, [layout, saveLayout]);

  // Zmień rozmiar widgetu
  const updateSize = useCallback((widgetId, newSize) => {
    const newLayout = layout.map(item =>
      item.widgetId === widgetId ? { ...item, size: newSize } : item
    );
    saveLayout(newLayout);
  }, [layout, saveLayout]);

  // Przełącz widoczność widgetu
  const toggleVisibility = useCallback((widgetId) => {
    const newLayout = layout.map(item =>
      item.widgetId === widgetId ? { ...item, visible: !item.visible } : item
    );
    saveLayout(newLayout);
  }, [layout, saveLayout]);

  // Resetuj do domyślnego układu
  const resetLayout = useCallback(() => {
    saveLayout(DEFAULT_LAYOUT);
  }, [saveLayout]);

  return {
    layout,
    loading,
    saving,
    saveLayout,
    updateOrder,
    updateSize,
    toggleVisibility,
    resetLayout,
  };
}
