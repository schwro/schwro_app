import React, { useState } from 'react';
import { ArrowLeft, Users, Settings, Bell, BellOff, Trash2 } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { getMinistryName } from '../utils/messageHelpers';

export default function ConversationHeader({
  conversation,
  onBack,
  onOpenSettings,
  onToggleMute,
  onDelete,
  showBackButton = false
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

        {conversation.type === 'direct' && onDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition"
            title="Usuń rozmowę"
          >
            <Trash2 size={18} className="text-gray-500 hover:text-red-500" />
          </button>
        )}
      </div>

      {/* Modal potwierdzenia usunięcia */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Usuń rozmowę
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Czy na pewno chcesz usunąć tę rozmowę? Wszystkie wiadomości zostaną trwale usunięte.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  onDelete(conversation.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
