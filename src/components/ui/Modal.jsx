"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, width = '500px' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-[var(--voz-surface)] border border-[var(--voz-border)] shadow-2xl flex flex-col VozModal slide-down" 
        style={{ width: width, maxWidth: '100%', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#185886] text-white px-4 py-3 flex justify-between items-center text-[18px]">
          <h2 className="m-0 font-normal">{title}</h2>
          <button onClick={onClose} className="hover:text-gray-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="overflow-y-auto w-full p-0">
          {children}
        </div>
      </div>
    </div>
  );
}
