import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2, Check, X, FileText, Image, Table, File, Download, CheckCheck } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { formatMessageTime, formatFileSize, isImageFile, getFileIcon } from '../utils/messageHelpers';

export default function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  onEdit,
  onDelete,
  isRead = false,
  readBy = []
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Czy na pewno chcesz usunąć tę wiadomość?')) {
      onDelete?.(message.id);
    }
    setShowMenu(false);
  };

  const renderAttachment = (attachment, idx) => {
    const iconMap = {
      'image': Image,
      'file-text': FileText,
      'table': Table,
      'file': File
    };
    const IconComponent = iconMap[getFileIcon(attachment.type)] || File;

    if (isImageFile(attachment.type)) {
      return (
        <a
          key={idx}
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-xs max-h-48 rounded-lg object-cover hover:opacity-90 transition"
          />
        </a>
      );
    }

    return (
      <a
        key={idx}
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 p-2 rounded-lg transition ${
          isOwn
            ? 'bg-pink-700/30 hover:bg-pink-700/50'
            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        <IconComponent size={20} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.name}</p>
          <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
        </div>
        <Download size={16} className="opacity-60" />
      </a>
    );
  };

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} group`}>
      {/* Avatar lub placeholder dla wyrównania */}
      {!isOwn && (
        showAvatar ? (
          <UserAvatar user={message.sender} size="sm" className="flex-shrink-0 mt-1" />
        ) : (
          <div className="w-8 flex-shrink-0" />
        )
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isOwn && showAvatar && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">
            {message.sender?.full_name || message.sender_email}
          </span>
        )}

        <div className="relative">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-w-[200px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex gap-1 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="p-1.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={`px-4 py-2 rounded-2xl ${
                  isOwn
                    ? 'bg-pink-600 text-white rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>

                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((att, idx) => renderAttachment(att, idx))}
                  </div>
                )}
              </div>

              {isOwn && (
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-opacity"
                >
                  <MoreVertical size={16} />
                </button>
              )}

              {showMenu && (
                <div className="absolute -left-32 top-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 z-10">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Edit2 size={14} />
                    Edytuj
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Trash2 size={14} />
                    Usuń
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {formatMessageTime(message.created_at)}
          </span>
          {message.edited_at && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">
              (edytowano)
            </span>
          )}
          {/* Status przeczytania - tylko dla własnych wiadomości */}
          {isOwn && (
            <span className="flex items-center" title={isRead ? `Przeczytane${readBy.length > 0 ? ` przez ${readBy.map(r => r.user_email).join(', ')}` : ''}` : 'Wysłane'}>
              {isRead ? (
                <CheckCheck size={14} className="text-blue-500" />
              ) : (
                <Check size={14} className="text-gray-400" />
              )}
            </span>
          )}
        </div>
      </div>

      {showAvatar && isOwn && <div className="w-8 flex-shrink-0" />}
    </div>
  );
}
