import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Skeleton } from './States';
import { Pagination } from './Pagination';
import { EmptyState } from './States';

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** When false (or omitted) the column is not sortable. */
  sortable?: boolean;
  /** Optional accessor for sorting when the cell value differs from `row[key]`. */
  sortValue?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  className?: string;
  cellClassName?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  hidePagination?: boolean;
  empty?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  onRowClick,
  pageSize = 8,
  hidePagination = false,
  empty,
  emptyTitle = 'No records found',
  emptyDescription,
  toolbar,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;
    const getter = col.sortValue ?? ((row: T) => (row as Record<string, unknown>)[sortKey]);
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = hidePagination ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  // Reset to page 1 whenever the dataset changes size.
  useEffect(() => {
    setPage(1);
  }, [sorted.length, sortKey, sortDir]);

  const toggleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  };

  return (
    <div className={className}>
      {toolbar}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.className,
                  )}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => toggleSort(col)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded transition-colors hover:text-foreground',
                        col.align === 'right' && 'flex-row-reverse',
                      )}
                      aria-label={`Sort by ${String(col.header)}`}
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5 text-primary" aria-hidden />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-primary" aria-hidden />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-50" aria-hidden />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-border">
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3', col.cellClassName)}>
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-0 py-0">
                  {empty ?? (
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  )}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-border transition-colors last:border-b-0',
                    onRowClick && 'cursor-pointer hover:bg-muted/50',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm text-foreground',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                        col.cellClassName,
                      )}
                    >
                      {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as ReactNode}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!hidePagination && !loading && sorted.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={sorted.length} onPageChange={setPage} className="px-4 pb-4 pt-3" />
      )}
    </div>
  );
}
