"use client";

import { useState, useEffect } from 'react';

export default function LinkPreview({ url }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchPreview() {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if (!cancelled) {
          if (json.title || json.description) {
            setData(json);
          } else {
            setError(true);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchPreview();
    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return (
      <div className="my-2 border border-[var(--voz-border)] rounded-lg overflow-hidden bg-[var(--voz-accent)] animate-pulse">
        <div className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 bg-[var(--voz-border)] rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-[var(--voz-border)] rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-[var(--voz-border)] rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="my-2 border border-[var(--voz-border)] rounded-lg overflow-hidden bg-[var(--voz-accent)] hover:bg-[var(--voz-hover)] transition-colors flex flex-col no-underline hover:no-underline"
      style={{ display: 'flex', textDecoration: 'none' }}
    >
      {/* OG Image */}
      {data.image && (
        <div className="w-full max-h-[200px] overflow-hidden border-b border-[var(--voz-border)]">
          <img 
            src={data.image} 
            alt={data.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
      
      {/* Content */}
      <div className="flex items-center gap-3 p-3">
        {/* Favicon */}
        <img 
          src={data.favicon} 
          alt=""
          className="w-8 h-8 rounded object-contain flex-shrink-0 bg-white p-[2px]"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        
        <div className="flex-1 min-w-0">
          {data.title && (
            <div className="text-[14px] font-semibold text-[var(--voz-text)] leading-tight line-clamp-2">
              {data.title}
            </div>
          )}
          {data.description && (
            <div className="text-[12px] text-[var(--voz-text-muted)] mt-1 line-clamp-2">
              {data.description}
            </div>
          )}
          <div className="text-[11px] text-[var(--voz-link)] mt-1">
            {data.siteName}
          </div>
        </div>
      </div>
    </a>
  );
}
