import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, Image, FileText, Loader } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatFileSize, isImageFile } from '../utils/messageHelpers';

export default function MessageInput({ onSend, onTyping, disabled = false, placeholder = 'Napisz wiadomość...' }) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!content.trim() && attachments.length === 0) || disabled || uploading) return;

    try {
      await onSend(content.trim(), attachments);
      setContent('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit 10 plików
    if (attachments.length + files.length > 10) {
      alert('Maksymalnie 10 załączników na wiadomość');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedFiles = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Limit 10MB
        if (file.size > 10 * 1024 * 1024) {
          alert(`Plik "${file.name}" przekracza limit 10MB`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('messenger-attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('messenger-attachments')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          url: urlData.publicUrl,
          name: file.name,
          type: file.type,
          size: file.size
        });

        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      setAttachments(prev => [...prev, ...uploadedFiles]);
    } catch (err) {
      console.error('Error uploading files:', err);
      alert('Błąd podczas przesyłania plików');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleTextareaChange = (e) => {
    setContent(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
    // Wyślij status pisania
    if (e.target.value.trim()) {
      onTyping?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      {/* Podgląd załączników */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="relative group flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              {isImageFile(att.type) ? (
                <img src={att.url} alt={att.name} className="w-10 h-10 object-cover rounded" />
              ) : (
                <FileText size={20} className="text-gray-500" />
              )}
              <div className="max-w-[120px]">
                <p className="text-xs font-medium truncate">{att.name}</p>
                <p className="text-[10px] text-gray-500">{formatFileSize(att.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pasek postępu uploadu */}
      {uploading && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader size={16} className="animate-spin" />
            <span>Przesyłanie... {uploadProgress}%</span>
          </div>
          <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Przycisk załącznika */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="p-2 text-gray-500 hover:text-pink-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition disabled:opacity-50"
        >
          <Paperclip size={20} />
        </button>

        {/* Pole tekstowe */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || uploading}
            rows={1}
            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 disabled:opacity-50"
            style={{ maxHeight: '150px' }}
          />
        </div>

        {/* Przycisk wyślij */}
        <button
          type="submit"
          disabled={(!content.trim() && attachments.length === 0) || disabled || uploading}
          className="p-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
}
