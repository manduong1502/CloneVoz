"use client";

import { useState, useTransition } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { updateNodeOrder } from '@/actions/nodeActions';

export default function ReorderButton({ nodeId, nodeTitle, currentOrder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [order, setOrder] = useState(currentOrder || 10);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateNodeOrder(nodeId, order);
        setIsOpen(false);
      } catch (err) {
        alert('Lỗi: ' + err.message);
      }
    });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-[var(--voz-text-muted)] hover:text-blue-500 bg-transparent rounded border border-transparent hover:border-[var(--voz-border)] transition"
        title={`Thứ tự: ${currentOrder} — Bấm để đổi`}
      >
        <ArrowUpDown size={15} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        className="w-[50px] px-1 py-0.5 text-xs border border-[var(--voz-border)] rounded bg-[var(--voz-surface)] text-[var(--voz-text)] text-center"
        min="0"
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? '...' : 'Lưu'}
      </button>
      <button
        onClick={() => setIsOpen(false)}
        className="px-1 py-0.5 text-xs text-[var(--voz-text-muted)] hover:text-[var(--voz-text)]"
      >
        ✕
      </button>
    </div>
  );
}
