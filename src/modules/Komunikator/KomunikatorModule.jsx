import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ConversationList from './components/ConversationList';
import MessageThread from './components/MessageThread';
import NewConversationModal from './components/NewConversationModal';
import GroupSettingsModal from './components/GroupSettingsModal';
import useConversations from './hooks/useConversations';
import useMinistryChannels from './hooks/useMinistryChannels';

// Cache userEmail - współdzielony
const USER_EMAIL_CACHE_KEY = 'user_email_cache';

export default function KomunikatorModule() {
  // Inicjalizuj z cache od razu
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem(USER_EMAIL_CACHE_KEY) || null;
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        localStorage.setItem(USER_EMAIL_CACHE_KEY, user.email);
      }
    };
    // Pobierz w tle nawet jeśli mamy cache (dla weryfikacji)
    getUser();
  }, []);

  const {
    conversations,
    loading,
    refetch,
    createDirectConversation,
    createGroupConversation,
    markAsRead
  } = useConversations(userEmail);

  // Inicjalizacja kanałów służb - uruchomi się automatycznie po załadowaniu userEmail
  useMinistryChannels(userEmail);

  // Odśwież listę konwersacji po inicjalizacji kanałów służb
  useEffect(() => {
    if (userEmail) {
      // Odśwież po krótkim opóźnieniu, żeby kanały służb zdążyły się utworzyć
      const timeout = setTimeout(() => {
        refetch();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [userEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showList, setShowList] = useState(true);

  // Wykrywanie mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Aktualizuj selected conversation gdy lista się zmieni
  useEffect(() => {
    if (selectedConversation) {
      const updated = conversations.find(c => c.id === selectedConversation.id);
      if (updated) {
        setSelectedConversation(updated);
      }
    }
  }, [conversations, selectedConversation?.id]);

  // Wybierz konwersację
  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    if (isMobileView) {
      setShowList(false);
    }
  };

  // Wróć do listy (mobile)
  const handleBack = () => {
    setShowList(true);
    setSelectedConversation(null);
  };

  // Utwórz rozmowę direct
  const handleCreateDirect = async (email) => {
    const convId = await createDirectConversation(email);
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      handleSelectConversation(conv);
    } else {
      // Odśwież i znajdź nową konwersację
      await refetch();
    }
  };

  // Utwórz grupę
  const handleCreateGroup = async (name, emails) => {
    const convId = await createGroupConversation(name, emails);
    await refetch();
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      handleSelectConversation(conv);
    }
  };

  // Po aktualizacji ustawień grupy
  const handleSettingsUpdate = async () => {
    await refetch();
  };

  return (
    <div className="h-[calc(100vh-7rem)] -m-6 flex bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-200/50 dark:border-gray-700">
      {/* Lista konwersacji */}
      <div
        className={`
          ${isMobileView ? 'absolute inset-0 z-10' : 'w-80 flex-shrink-0'}
          ${isMobileView && !showList ? 'hidden' : ''}
        `}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id}
          onSelect={handleSelectConversation}
          onNewConversation={() => setShowNewModal(true)}
          loading={loading}
          currentUserEmail={userEmail}
        />
      </div>

      {/* Wątek wiadomości */}
      <div
        className={`
          flex-1 flex flex-col
          ${isMobileView ? 'absolute inset-0 z-10' : ''}
          ${isMobileView && showList ? 'hidden' : ''}
        `}
      >
        <MessageThread
          conversation={selectedConversation}
          userEmail={userEmail}
          onBack={handleBack}
          onOpenSettings={() => setShowSettingsModal(true)}
          onMarkAsRead={markAsRead}
        />
      </div>

      {/* Modal nowej rozmowy */}
      <NewConversationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreateDirect={handleCreateDirect}
        onCreateGroup={handleCreateGroup}
        currentUserEmail={userEmail}
      />

      {/* Modal ustawień grupy */}
      <GroupSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        conversation={selectedConversation}
        currentUserEmail={userEmail}
        onUpdate={handleSettingsUpdate}
      />
    </div>
  );
}
