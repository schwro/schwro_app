import React, { useEffect, useRef, useCallback } from 'react';
import { Loader, MessageSquare } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ConversationHeader from './ConversationHeader';
import useMessages from '../hooks/useMessages';
import useRealtimeMessages from '../hooks/useRealtimeMessages';
import { groupMessagesByDate } from '../utils/messageHelpers';

export default function MessageThread({
  conversation,
  userEmail,
  onBack,
  onOpenSettings,
  onMarkAsRead
}) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const {
    messages,
    loading,
    hasMore,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    addMessage
  } = useMessages(conversation?.id, userEmail);

  // Real-time subscriptions
  const handleNewMessage = useCallback(async (newMessage) => {
    if (newMessage.sender_email !== userEmail) {
      await addMessage(newMessage);
      onMarkAsRead?.(conversation?.id);
    }
  }, [addMessage, userEmail, onMarkAsRead, conversation?.id]);

  const handleMessageUpdate = useCallback((updatedMessage) => {
    // Obsłużone przez hook useMessages
  }, []);

  const handleMessageDelete = useCallback((messageId) => {
    // Obsłużone przez hook useMessages
  }, []);

  useRealtimeMessages(
    conversation?.id,
    handleNewMessage,
    handleMessageUpdate,
    handleMessageDelete
  );

  // Scroll do najnowszych wiadomości
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  // Scroll przy nowych wiadomościach
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // Oznacz jako przeczytane przy otwarciu
  useEffect(() => {
    if (conversation?.id && conversation.unreadCount > 0) {
      onMarkAsRead?.(conversation.id);
    }
  }, [conversation?.id, conversation?.unreadCount, onMarkAsRead]);

  // Infinite scroll - ładowanie starszych wiadomości
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || loading || !hasMore) return;

    if (container.scrollTop < 100) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  // Wysyłanie wiadomości
  const handleSendMessage = async (content, attachments) => {
    await sendMessage(content, attachments);
    scrollToBottom();
  };

  // Toggle mute
  const handleToggleMute = async () => {
    // TODO: Implementacja mute
  };

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 text-center px-4">
        <MessageSquare size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
          Wybierz rozmowę
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Wybierz rozmowę z listy lub rozpocznij nową
        </p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);
  const dateGroups = Object.entries(groupedMessages);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800/30">
      <ConversationHeader
        conversation={conversation}
        onBack={onBack}
        onOpenSettings={onOpenSettings}
        onToggleMute={handleToggleMute}
        showBackButton={true}
      />

      {/* Wiadomości */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader size={24} className="animate-spin text-pink-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Brak wiadomości. Napisz pierwszą!
            </p>
          </div>
        ) : (
          <>
            {/* Loader dla ładowania starszych wiadomości */}
            {hasMore && (
              <div className="flex justify-center py-2 mb-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-sm text-pink-600 hover:text-pink-700 disabled:opacity-50"
                >
                  {loading ? 'Ładowanie...' : 'Załaduj starsze wiadomości'}
                </button>
              </div>
            )}

            {/* Wiadomości pogrupowane po datach */}
            {dateGroups.map(([date, msgs]) => (
              <div key={date}>
                {/* Separator daty */}
                <div className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {date}
                    </span>
                  </div>
                </div>

                {/* Wiadomości z danego dnia */}
                <div className="space-y-3">
                  {msgs.map((message, idx) => {
                    const isOwn = message.sender_email === userEmail;
                    const prevMessage = msgs[idx - 1];
                    const showAvatar = !prevMessage ||
                      prevMessage.sender_email !== message.sender_email ||
                      new Date(message.created_at) - new Date(prevMessage.created_at) > 5 * 60 * 1000;

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        onEdit={isOwn ? editMessage : undefined}
                        onDelete={isOwn ? deleteMessage : undefined}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={handleSendMessage} />
    </div>
  );
}
