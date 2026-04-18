import Link from 'next/link';

export default function Pagination({ basePath, currentPage, totalPages }) {
  if (totalPages <= 1) return null;

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

  return (
    <div className="flex bg-[var(--voz-accent)] border border-[var(--voz-border)] rounded-sm text-[13px] overflow-hidden">
      {currentPage > 1 && (
        <Link href={`${basePath}?page=${currentPage - 1}`} className="px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-[var(--voz-border)] cursor-pointer text-[var(--voz-link)]">
          ‹ Prev
        </Link>
      )}
      
      {startPage > 1 && (
        <Link href={`${basePath}?page=1`} className="hidden sm:inline-block px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-[var(--voz-border)] cursor-pointer text-[var(--voz-link)]">
          1
        </Link>
      )}

      {startPage > 2 && <span className="hidden sm:inline-block px-2 py-[6px] border-r border-[var(--voz-border)] text-[var(--voz-text-muted)]">...</span>}

      {pageNumbers.map(number => (
        <Link 
          key={number} 
          href={number === 1 ? basePath : `${basePath}?page=${number}`}
          className={`px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-[var(--voz-border)] cursor-pointer ${currentPage === number ? 'bg-[#185886] text-white font-medium hover:bg-[#185886]' : 'text-[var(--voz-link)]'}`}
        >
          {number}
        </Link>
      ))}

      {endPage < totalPages - 1 && <span className="hidden sm:inline-block px-2 py-[6px] border-r border-[var(--voz-border)] text-[var(--voz-text-muted)]">...</span>}

      {endPage < totalPages && (
        <Link href={`${basePath}?page=${totalPages}`} className="hidden sm:inline-block px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-[var(--voz-border)] cursor-pointer text-[var(--voz-link)]">
          {totalPages}
        </Link>
      )}

      {currentPage < totalPages && (
        <Link href={`${basePath}?page=${currentPage + 1}`} className="px-3 py-[6px] hover:bg-[var(--voz-border)] cursor-pointer text-[var(--voz-link)]">
          Next ›
        </Link>
      )}
    </div>
  );
}
