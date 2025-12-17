import React from 'react';
import { ArrowLeft, Users, Settings, Bell, BellOff } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { getMinistryName } from '../utils/messageHelpers';

export default function ConversationHeader({
  conversation,
  onBack,
  onOpenSettings,
  onToggleMute,
  showBackButton = false
}) {
  if (!conversation) return null;

  const getConversationIcon = () => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(p => p.user_email !== conversation.created_by);
      return <UserAvatar user={otherParticipant || { full_name: conversation.displayName }} size="md" />;
    }

    if (conversation.type === 'ministry') {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
          <Users size={20} />
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

  const getSubtitle = () => {
    if (conversation.type === 'direct') {
      return 'Prywatna rozmowa';
    }

    if (conversation.type === 'ministry') {
      return `Kanał służby • ${conversation.participants?.length || 0} członków`;
    }

    return `${conversation.participants?.length || 0} uczestników`;
  };

  const displayName = conversation.type === 'ministry'
    ? getMinistryName(conversation.ministry_key) || conversation.name
    : conversation.displayName || conversation.name;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {showBackButton && (
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition lg:hidden"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      )}

      <div className="flex-shrink-0">
        {getConversationIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
          {displayName}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {getSubtitle()}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
            title={conversation.muted ? 'Włącz powiadomienia' : 'Wycisz powiadomienia'}
          >
            {conversation.muted ? (
              <BellOff size={18} className="text-gray-500" />
            ) : (
              <Bell size={18} className="text-gray-500" />
            )}
          </button>
        )}

        {conversation.type !== 'direct' && onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
            title="Ustawienia grupy"
          >
            <Settings size={18} className="text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}
