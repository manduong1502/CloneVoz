"use client";

import { useMemo } from 'react';
import LinkPreview from './LinkPreview';

// Regex phát hiện URL trong HTML text
const URL_REGEX = /https?:\/\/[^\s<>"']+/g;

export default function PostContentWithPreview({ html }) {
  // Trích xuất tất cả URL từ nội dung bài viết (chỉ URL nằm trong <a> tag hoặc text thường)
  const urls = useMemo(() => {
    if (!html) return [];
    
    // Lấy URL từ href attributes
    const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/g;
    const foundUrls = new Set();
    let match;
    
    while ((match = hrefRegex.exec(html)) !== null) {
      const url = match[1];
      // Loại bỏ URL nội bộ (link forum)
      if (!url.includes('danongthongminh.vn') && !url.includes('localhost')) {
        foundUrls.add(url);
      }
    }

    // Cũng tìm URL nằm ngoài tag (plain text URLs)
    // Loại bỏ tag HTML trước
    const textOnly = html.replace(/<[^>]+>/g, ' ');
    while ((match = URL_REGEX.exec(textOnly)) !== null) {
      const url = match[0];
      if (!url.includes('danongthongminh.vn') && !url.includes('localhost')) {
        foundUrls.add(url);
      }
    }

    return Array.from(foundUrls).slice(0, 3); // Tối đa 3 preview
  }, [html]);

  return (
    <div>
      {/* Nội dung bài viết gốc */}
      <div className="post-content" dangerouslySetInnerHTML={{ __html: html }} />
      
      {/* Link previews */}
      {urls.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {urls.map((url) => (
            <LinkPreview key={url} url={url} />
          ))}
        </div>
      )}
    </div>
  );
}
