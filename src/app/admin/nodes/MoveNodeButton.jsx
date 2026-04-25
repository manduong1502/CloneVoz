"use client";

import { useState, useTransition } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { moveNode } from '@/actions/nodeActions';

export default function MoveNodeButton({ nodeId, nodeTitle, categories, currentParentId }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(currentParentId || '');
  const [isPending, startTransition] = useTransition();

  const handleMove = () => {
    if (!selectedParent || selectedParent === currentParentId) return;
    startTransition(async () => {
      await moveNode(nodeId, selectedParent);
      setShowModal(false);
    });
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="p-1.5 text-[var(--voz-text-muted)] hover:text-blue-500 bg-transparent rounded border border-transparent hover:border-[var(--voz-border)] transition" 
        title="Di chuyển forum"
      >
        <ArrowRightLeft size={15} />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--voz-surface)] rounded-lg shadow-xl border border-[var(--voz-border)] w-[400px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-[var(--voz-border)] font-semibold text-[14px]">
              Di chuyển: {nodeTitle}
            </div>
            <div className="p-4 flex flex-col gap-3">
              <label className="text-[13px] font-semibold">Chuyển sang danh mục:</label>
              <select 
                value={selectedParent} 
                onChange={e => setSelectedParent(e.target.value)}
                className="w-full border border-[var(--voz-border)] bg-[var(--voz-bg)] text-[var(--voz-text)] px-3 py-2 rounded text-sm"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.id === currentParentId ? '(Hiện tại)' : ''}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-[var(--voz-border)] rounded">Hủy</button>
                <button 
                  onClick={handleMove} 
                  disabled={isPending || selectedParent === currentParentId}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  {isPending ? 'Đang di chuyển...' : 'Di chuyển'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
