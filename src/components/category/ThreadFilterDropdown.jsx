"use client";

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

export default function ThreadFilterDropdown({ prefixes = [], currentParams = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [startedBy, setStartedBy] = useState(currentParams.startedBy || '');
  const [lastUpdated, setLastUpdated] = useState(currentParams.lastUpdated || '');
  const [sortBy, setSortBy] = useState(currentParams.sortBy || 'updatedAt');
  const [sortOrder, setSortOrder] = useState(currentParams.sortOrder || 'desc');
  const [prefix, setPrefix] = useState(currentParams.prefix || '');
  const router = useRouter();
  const pathname = usePathname();

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (startedBy) params.set('startedBy', startedBy);
    if (lastUpdated) params.set('lastUpdated', lastUpdated);
    if (prefix) params.set('prefix', prefix);
    if (sortBy !== 'updatedAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setIsOpen(false);
  };

  const handleReset = () => {
    setStartedBy('');
    setLastUpdated('');
    setSortBy('updatedAt');
    setSortOrder('desc');
    setPrefix('');
    router.push(pathname);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-[var(--voz-link)] text-[13px] flex items-center gap-1 hover:text-[var(--voz-link-hover)] font-medium"
      >
        Bộ lọc <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full mt-1 bg-[var(--voz-surface)] border border-[var(--voz-border)] shadow-lg z-30 w-[280px] rounded-sm">
            <div className="border-b-[3px] border-[var(--voz-link)] p-0">
              <div className="px-3 py-2 text-[13px] text-[var(--voz-link)] font-medium border-b border-[var(--voz-border-light)]">Chỉ hiển thị:</div>
              
              {/* Prefix */}
              <div className="px-3 py-2 border-b border-[var(--voz-border-light)]">
                <label className="text-[12px] text-[var(--voz-text-muted)] block mb-1">Tiền tố:</label>
                <select 
                  value={prefix} 
                  onChange={e => setPrefix(e.target.value)}
                  className="w-full border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-sm p-1.5 text-[13px] outline-none"
                >
                  <option value="">(Tất cả)</option>
                  {prefixes.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Started by */}
              <div className="px-3 py-2 border-b border-[var(--voz-border-light)]">
                <label className="text-[12px] text-[var(--voz-text-muted)] block mb-1">Được tạo bởi:</label>
                <input 
                  type="text" 
                  value={startedBy}
                  onChange={e => setStartedBy(e.target.value)}
                  placeholder="Username..."
                  className="w-full border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-sm p-1.5 text-[13px] outline-none"
                />
              </div>

              {/* Last updated */}
              <div className="px-3 py-2 border-b border-[var(--voz-border-light)]">
                <label className="text-[12px] text-[var(--voz-text-muted)] block mb-1">Cập nhật gần nhất:</label>
                <select 
                  value={lastUpdated} 
                  onChange={e => setLastUpdated(e.target.value)}
                  className="w-full border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-sm p-1.5 text-[13px] outline-none"
                >
                  <option value="">Tất cả thời gian</option>
                  <option value="1d">Trong ngày</option>
                  <option value="7d">7 ngày qua</option>
                  <option value="30d">30 ngày qua</option>
                  <option value="90d">3 tháng qua</option>
                  <option value="365d">1 năm qua</option>
                </select>
              </div>

              {/* Sort */}
              <div className="px-3 py-2 border-b border-[var(--voz-border-light)]">
                <label className="text-[12px] text-[var(--voz-text-muted)] block mb-1">Sắp xếp theo:</label>
                <div className="flex gap-2">
                  <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value)}
                    className="flex-1 border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-sm p-1.5 text-[13px] outline-none"
                  >
                    <option value="updatedAt">Tin nhắn cuối</option>
                    <option value="createdAt">Ngày tạo</option>
                    <option value="replyCount">Số trả lời</option>
                    <option value="viewCount">Lượt xem</option>
                  </select>
                  <select 
                    value={sortOrder} 
                    onChange={e => setSortOrder(e.target.value)}
                    className="w-[100px] border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-sm p-1.5 text-[13px] outline-none"
                  >
                    <option value="desc">Giảm dần</option>
                    <option value="asc">Tăng dần</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="px-3 py-2 flex gap-2 justify-end">
                <button 
                  onClick={handleReset}
                  className="text-[12px] text-[var(--voz-text-muted)] hover:text-[var(--voz-text)] px-3 py-1.5"
                >
                  Đặt lại
                </button>
                <button 
                  onClick={handleFilter}
                  className="bg-[#183254] text-white text-[12px] px-4 py-1.5 rounded-sm hover:bg-[#134970] font-medium"
                >
                  Lọc
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
