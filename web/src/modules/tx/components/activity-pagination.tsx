import { Button } from '@cuan/ui';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function ActivityPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const { t } = useTranslation();

  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      aria-label={t('transactions.pagination', 'Pagination Navigation')}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border"
    >
      {/* Item Range & Page Size */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {t('transactions.showingItems', 'Showing')}{' '}
          <strong className="text-foreground font-semibold">{startItem}</strong> -{' '}
          <strong className="text-foreground font-semibold">{endItem}</strong>{' '}
          {t('transactions.ofTotal', 'of')}{' '}
          <strong className="text-foreground font-semibold">{totalItems}</strong>
        </span>

        <span className="text-border">|</span>

        <div className="flex items-center gap-1.5">
          <label htmlFor="pagination-page-size" className="text-muted-foreground whitespace-nowrap">
            {t('transactions.rowsPerPage', 'Per page')}:
          </label>
          <select
            id="pagination-page-size"
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="h-7 px-2 rounded-md bg-card border border-border text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {/* Page Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label={t('transactions.firstPage', 'First page')}
        >
          <ChevronsLeft size={15} />
        </Button>

        {/* Previous Page */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label={t('transactions.prevPage', 'Previous page')}
        >
          <ChevronLeft size={15} />
        </Button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((page, idx) => {
            if (page === 'ellipsis') {
              const ellipsisKey = idx === 1 ? 'ellipsis-start' : 'ellipsis-end';
              return (
                <span
                  key={ellipsisKey}
                  className="px-1.5 text-xs text-muted-foreground select-none"
                >
                  …
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <Button
                key={page}
                type="button"
                variant={isCurrent ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(page)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`h-8 min-w-8 px-2 text-xs cursor-pointer ${
                  isCurrent
                    ? 'font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next Page */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label={t('transactions.nextPage', 'Next page')}
        >
          <ChevronRight size={15} />
        </Button>

        {/* Last Page */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label={t('transactions.lastPage', 'Last page')}
        >
          <ChevronsRight size={15} />
        </Button>
      </div>
    </nav>
  );
}
