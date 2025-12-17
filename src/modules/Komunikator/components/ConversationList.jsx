import React, { useState, useMemo } from 'react';
import { Search, Plus, MessageSquare, Users, Music, Heart, Baby, Zap, UserCheck, Home, Shield, Sparkles } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { formatMessageDate, truncateText, getMinistryName } from '../utils/messageHelpers';
import { usePresence } from '../../../hooks/usePresence';

const ministryIcons = {
  worship_team: Music,
  media_team: Zap,
  atmosfera_team: Sparkles,
  kids_ministry: Baby,
  home_groups: Home,
  youth_ministry: Users,
  prayer_team: Heart,
  welcome_team: UserCheck,
  small_groups: Home,
  admin_team: Shield,
};

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
  loading,
  currentUserEmail
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Zbierz emaile wszystkich uczestników konwersacji direct
  const participantEmails = useMemo(() => {
    const emails = new Set();
    conversations
      .filter(c => c.type === 'direct')
      .forEach(c => {
        c.participants?.forEach(p => {
          if (p.user_email !== currentUserEmail) {
            emails.add(p.user_email);
          }
        });
      });
    return Array.from(emails);
  }, [conversations, currentUserEmail]);

  // Pobierz statusy presence
  const { getStatus } = usePresence(participantEmails);

  // Filtruj konwersacje po wyszukiwaniu
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.displayName?.toLowerCase().includes(query) ||
      conv.name?.toLowerCase().includes(query) ||
      conv.lastMessage?.content?.toLowerCase().includes(query)
    );
  });

  // Grupuj konwersacje po typie
  const directConversations = filteredConversations.filter(c => c.type === 'direct');
  const groupConversations = filteredConversations.filter(c => c.type === 'group');
  const ministryConversations = filteredConversations.filter(c => c.type === 'ministry');

  const renderConversationItem = (conv) => {
    const isSelected = conv.id === selectedId;
    const hasUnread = conv.unreadCount > 0;

    const getIcon = () => {
      if (conv.type === 'direct') {
        const otherParticipant = conv.participants?.find(p => p.user_email !== currentUserEmail);
        const otherEmail = otherParticipant?.user_email;
        const status = otherEmail ? getStatus(otherEmail) : 'offline';
        return (
          <UserAvatar
            user={otherParticipant || { full_name: conv.displayName }}
            size="md"
            showStatus={true}
            status={status}
          />
        );
      }

      if (conv.type === 'ministry') {
        const IconComponent = ministryIcons[conv.ministry_key] || Users;
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
            <IconComponent size={20} />
          </div>
        );
      }

      // Group
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
          <Users size={20} />
        </div>
      );
    };

    const displayName = conv.type === 'ministry'
      ? getMinistryName(conv.ministry_key) || conv.name
      : conv.displayName || conv.name;

    return (
      <button
        key={conv.id}
        onClick={() => onSelect(conv)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left
          ${isSelected
            ? 'bg-pink-50 dark:bg-pink-900/30'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
        `}
      >
        <div className="relative flex-shrink-0">
          {getIcon()}
          {hasUnread && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-pink-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`font-medium truncate ${hasUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {displayName}
            </span>
            {conv.lastMessage && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                {formatMessageDate(conv.lastMessage.created_at)}
              </span>
            )}
          </div>

          {conv.lastMessage && (
            <p className={`text-xs truncate ${hasUnread ? 'text-gray-600 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              {conv.lastMessage.sender_email === conv.created_by ? 'Ty: ' : ''}
              {truncateText(conv.lastMessage.content, 40)}
            </p>
          )}
        </div>
      </button>
    );
  };

  const renderSection = (title, items) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-1">
          {title}
        </h3>
        <div className="space-y-0.5">
          {items.map(renderConversationItem)}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Komunikator</h1>
          <button
            onClick={onNewConversation}
            className="p-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full transition"
            title="Nowa rozmowa"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Wyszukiwarka */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj rozmów..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Lista konwersacji */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <MessageSquare size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? 'Nie znaleziono rozmów' : 'Brak rozmów'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewConversation}
                className="mt-3 text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                Rozpocznij nową rozmowę
              </button>
            )}
          </div>
        ) : (
          <>
            {renderSection('Prywatne', directConversations)}
            {renderSection('Grupy', groupConversations)}
            {renderSection('Kanały służb', ministryConversations)}
          </>
        )}
      </div>
    </div>
  );
}
