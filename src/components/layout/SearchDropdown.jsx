"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SearchDropdown() {
  const [query, setQuery] = useState('');
  const [titleOnly, setTitleOnly] = useState(false);
  const router = useRouter();

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    const params = new URLSearchParams();
    params.set('q', query.trim());
    if (titleOnly) params.set('titleOnly', '1');
    
    router.push(`/search?${params.toString()}`);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="p-3 text-[14px]">
      <input 
        type="text" 
        placeholder="Tìm kiếm..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] p-2 rounded-[2px] mb-2 focus:border-[var(--voz-link)] outline-none" 
      />
      <div className="flex flex-col gap-2 mb-3">
        <label className="flex items-center gap-2 cursor-pointer text-[13px]">
          <input 
            type="checkbox" 
            checked={titleOnly}
            onChange={(e) => setTitleOnly(e.target.checked)}
          /> 
          Chỉ tìm trong tiêu đề
        </label>
      </div>
      <div className="border-t border-[var(--voz-border)] pt-2 flex justify-between items-center text-[13px]">
        <Link href="/search" className="text-[var(--voz-link)] hover:underline">Tìm kiếm nâng cao...</Link>
        <button onClick={handleSearch} className="voz-button">Tìm</button>
      </div>
    </div>
  );
}
