import Link from 'next/link';

export default function Pagination({ basePath, currentPage, totalPages, queryParam = 'page', existingParams = {} }) {

  const pageNumbers = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const buildUrl = (pageNum) => {
    // Nếu chỉ có trang 1 và không có params nào khác, trả về basePath cho sạch
    if (pageNum === 1 && queryParam === 'page' && Object.keys(existingParams).length === 0) {
      return basePath;
    }
    
    // Build search params
    const params = new URLSearchParams();
    Object.entries(existingParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    
    // Set page param
    params.set(queryParam, pageNum);
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex bg-[var(--voz-surface)] border border-[var(--voz-link)] rounded-sm text-[13px] overflow-hidden w-fit">
      {currentPage > 1 && (
        <Link href={buildUrl(currentPage - 1)} className="px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-[var(--voz-border)] cursor-pointer text-[var(--voz-link)]">
          ‹ Trước
        </Link>
      )}
      
      {startPage > 1 && (
        <Link href={buildUrl(1)} className="hidden sm:inline-block px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-[var(--voz-border)] cursor-pointer text-[var(--voz-link)]">
          1
        </Link>
      )}

      {startPage > 2 && <span className="hidden sm:inline-block px-2 py-[6px] border-r border-[var(--voz-border)] text-[var(--voz-text-muted)]">...</span>}

      {pageNumbers.map(number => (
        <Link 
          key={number} 
          href={buildUrl(number)}
          className={`px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-[var(--voz-border)] cursor-pointer ${currentPage === number ? 'bg-[#183254] text-white font-medium hover:bg-[#183254]' : 'text-[var(--voz-link)]'}`}
        >
          {number}
        </Link>
      ))}

      {endPage < totalPages - 1 && <span className="hidden sm:inline-block px-2 py-[6px] border-r border-[var(--voz-border)] text-[var(--voz-text-muted)]">...</span>}

      {endPage < totalPages && (
        <Link href={buildUrl(totalPages)} className="hidden sm:inline-block px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-[var(--voz-border)] cursor-pointer text-[var(--voz-link)]">
          {totalPages}
        </Link>
      )}

      {currentPage < totalPages && (
        <Link href={buildUrl(currentPage + 1)} className="px-3 py-[6px] hover:bg-[var(--voz-border)] cursor-pointer text-[var(--voz-link)]">
          Sau ›
        </Link>
      )}
    </div>
  );
}
