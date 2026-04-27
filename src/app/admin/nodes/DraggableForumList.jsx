"use client";

import { useState, useRef, useTransition } from 'react';
import { GripVertical, ArrowRightLeft, Trash2, LayoutList, Pencil } from 'lucide-react';
import Link from 'next/link';
import { updateNodeOrder } from '@/actions/nodeActions';
import { moveNode, renameNode } from '@/actions/nodeActions';

export default function DraggableForumList({ forums, categories, categoryId }) {
  const [items, setItems] = useState(forums);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [moveForumId, setMoveForumId] = useState(null);
  const [renameForumId, setRenameForumId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    // Tạo ghost element đẹp hơn
    e.dataTransfer.setData('text/plain', idx.toString());
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIdx !== null && idx !== draggedIdx) {
      setDragOverIdx(idx);
    }
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    // Reorder items
    const newItems = [...items];
    const [moved] = newItems.splice(draggedIdx, 1);
    newItems.splice(dropIdx, 0, moved);
    setItems(newItems);
    setDraggedIdx(null);
    setDragOverIdx(null);

    // Save tất cả displayOrder mới
    startTransition(async () => {
      try {
        for (let i = 0; i < newItems.length; i++) {
          await updateNodeOrder(newItems[i].id, (i + 1) * 10);
        }
      } catch (err) {
        console.error('Lỗi lưu thứ tự:', err);
      }
    });
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleMove = async (forumId, newParentId) => {
    if (!newParentId || newParentId === categoryId) {
      setMoveForumId(null);
      return;
    }
    startTransition(async () => {
      try {
        await moveNode(forumId, newParentId);
        setItems(prev => prev.filter(f => f.id !== forumId));
        setMoveForumId(null);
      } catch (err) {
        alert('Lỗi: ' + err.message);
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-[var(--voz-text-muted)] italic bg-[var(--voz-bg)]">
        Trống. Chưa có phòng nào!
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--voz-border)]">
      {isPending && (
        <div className="px-4 py-1.5 bg-blue-600/10 text-blue-500 text-xs text-center">
          Đang lưu thứ tự...
        </div>
      )}
      {items.map((forum, idx) => (
        <div
          key={forum.id}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          className={`
            px-4 py-3 flex justify-between items-center transition-all cursor-grab active:cursor-grabbing select-none
            ${draggedIdx === idx ? 'opacity-30 bg-[var(--voz-hover)]' : 'hover:bg-[var(--voz-hover)]'}
            ${dragOverIdx === idx && draggedIdx !== null
              ? draggedIdx < idx
                ? 'border-b-2 !border-b-blue-500'
                : 'border-t-2 !border-t-blue-500'
              : ''
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="text-[var(--voz-text-muted)] hover:text-[var(--voz-text)] cursor-grab">
              <GripVertical size={16} />
            </div>
            <LayoutList className="text-[var(--voz-link)]" size={18} />
            <div>
              {renameForumId === forum.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      startTransition(async () => {
                        await renameNode(forum.id, renameValue);
                        const newItems = items.map(it => it.id === forum.id ? { ...it, title: renameValue } : it);
                        setItems(newItems);
                        setRenameForumId(null);
                      });
                    }
                    if (e.key === 'Escape') setRenameForumId(null);
                  }}
                  onBlur={() => setRenameForumId(null)}
                  className="px-2 py-0.5 text-sm border border-blue-400 rounded bg-[var(--voz-bg)] text-[var(--voz-text)] outline-none w-[180px]"
                />
              ) : (
                <Link href={`/admin/nodes/${forum.id}`} className="font-semibold text-[14px] text-[var(--voz-link)] hover:underline">
                  {forum.title}
                </Link>
              )}
              {forum.description && (
                <div className="text-[12px] text-[var(--voz-text-muted)] mt-0.5">{forum.description}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href={`/admin/nodes/${forum.id}`} className="text-right text-[12px] text-[var(--voz-link)] hover:underline w-[80px] hidden sm:block">
              {forum._count?.threads ?? 0} Chủ đề
            </Link>

            <div className="flex gap-1 items-center">
              {/* Rename Button */}
              <button
                onClick={(e) => { e.stopPropagation(); setRenameForumId(forum.id); setRenameValue(forum.title); }}
                className="p-1.5 text-[var(--voz-text-muted)] hover:text-blue-500 bg-transparent rounded border border-transparent hover:border-[var(--voz-border)] transition"
                title="Đổi tên"
              >
                <Pencil size={14} />
              </button>
              {/* Move Button */}
              {moveForumId === forum.id ? (
                <select
                  autoFocus
                  className="text-xs bg-[var(--voz-surface)] border border-[var(--voz-border)] rounded px-1 py-0.5 text-[var(--voz-text)]"
                  defaultValue=""
                  onChange={(e) => handleMove(forum.id, e.target.value)}
                  onBlur={() => setMoveForumId(null)}
                >
                  <option value="" disabled>Chuyển tới...</option>
                  {categories.filter(c => c.id !== categoryId).map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setMoveForumId(forum.id)}
                  className="p-1.5 text-[var(--voz-text-muted)] hover:text-blue-500 bg-transparent rounded border border-transparent hover:border-[var(--voz-border)] transition"
                  title="Di chuyển sang nhóm khác"
                >
                  <ArrowRightLeft size={15} />
                </button>
              )}

              {/* Delete */}
              <form action={`/admin/nodes`} onSubmit={async (e) => {
                e.preventDefault();
                if (!confirm(`Xóa forum "${forum.title}"?`)) return;
                const { deleteNode } = await import('@/actions/nodeActions');
                await deleteNode(forum.id);
                setItems(prev => prev.filter(f => f.id !== forum.id));
              }}>
                <button type="submit" className="p-1.5 text-[var(--voz-text-muted)] hover:text-red-500 bg-transparent rounded border border-transparent hover:border-[var(--voz-border)] transition" title="Xóa Forum">
                  <Trash2 size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
