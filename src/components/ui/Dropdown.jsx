"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function Dropdown({ trigger, children, align = 'left', width = 'auto' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left h-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="cursor-pointer h-full flex items-center"
      >
        {trigger(isOpen)}
      </div>

      {isOpen && (
        <div 
          className={`dropdown-panel absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-1 bg-[var(--voz-surface)] border border-[var(--voz-border)] shadow-xl z-50`}
          style={{ width: width, minWidth: '150px' }}
        >
          {/* Arrow pointing up */}
          <div className={`absolute -top-2 ${align === 'right' ? 'right-4' : 'left-4'} w-3 h-3 bg-[var(--voz-surface)] border-t border-l border-[var(--voz-border)] transform rotate-45`}></div>
          <div className="relative z-10 bg-[var(--voz-surface)]">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
