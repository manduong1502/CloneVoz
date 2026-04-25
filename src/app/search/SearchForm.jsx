"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchForm({ initialKeyword = '', initialTitleOnly = false }) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [titleOnly, setTitleOnly] = useState(initialTitleOnly);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    
    const params = new URLSearchParams();
    params.set('q', keyword.trim());
    if (titleOnly) params.set('titleOnly', '1');
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-4 text-[13px]">
      {/* Keywords */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4">
        <div className="w-full md:w-[150px] text-[var(--voz-text)] font-semibold md:text-right pt-2 shrink-0">Từ khóa:</div>
        <div className="flex-1 flex flex-col gap-2">
          <input 
            type="text" 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Nhập từ khóa tìm kiếm..."
            className="w-full border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] p-[8px] rounded-[3px] focus:outline-none focus:border-[var(--voz-link)]" 
          />
          <label className="flex items-center gap-2 cursor-pointer text-[var(--voz-text-muted)]">
            <input 
              type="checkbox" 
              checked={titleOnly}
              onChange={(e) => setTitleOnly(e.target.checked)}
            /> 
            Chỉ tìm tiêu đề
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2">
        <div className="hidden md:block w-[150px] shrink-0"></div>
        <div className="flex-1 flex gap-2">
          <button type="submit" className="voz-button px-6 py-[8px]">
            🔍 Tìm kiếm
          </button>
        </div>
      </div>
    </form>
  );
}
