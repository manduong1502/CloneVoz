"use client";

import { useState, useTransition } from 'react';
import { Pencil } from 'lucide-react';
import { renameNode } from '@/actions/nodeActions';

export default function RenameButton({ nodeId, currentTitle }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!title.trim() || title.trim() === currentTitle) {
      setIsEditing(false);
      setTitle(currentTitle);
      return;
    }
    startTransition(async () => {
      try {
        await renameNode(nodeId, title.trim());
        setIsEditing(false);
      } catch (err) {
        alert('Lỗi: ' + err.message);
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setIsEditing(false); setTitle(currentTitle); }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="px-2 py-1 text-sm border border-blue-400 rounded bg-[var(--voz-bg)] text-[var(--voz-text)] outline-none w-[200px]"
          disabled={isPending}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="p-1.5 text-[var(--voz-text-muted)] hover:text-blue-500 bg-transparent rounded border border-transparent hover:border-[var(--voz-border)] transition"
      title="Đổi tên"
    >
      <Pencil size={14} />
    </button>
  );
}
