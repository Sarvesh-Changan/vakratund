import { Button } from "./button";

export function Pagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange?: (page: number) => void }) {
  const isInteractive = Boolean(onPageChange);
  return <nav aria-label="Pagination" className="flex items-center justify-center gap-2"><Button type="button" variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>Previous</Button><span aria-live="polite" className="px-2 text-sm text-ink-muted">Page {page} of {pageCount}</span><Button type="button" variant="secondary" size="sm" disabled={page >= pageCount || !isInteractive} onClick={() => onPageChange?.(page + 1)}>Next</Button></nav>;
}
