import Link from "next/link";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui";

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (row: Row) => ReactNode;
}

export function DataTable<Row>({ columns, rows, pathname, query, page, pageCount, searchPlaceholder = "Search" }: { columns: readonly DataTableColumn<Row>[]; rows: readonly Row[]; pathname: string; query: Record<string, string | undefined>; page: number; pageCount: number; searchPlaceholder?: string }) {
  const makeQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    Object.entries({ ...query, ...updates }).forEach(([key, value]) => { if (value) params.set(key, value); });
    return params.toString();
  };
  const sort = query.sort;
  const direction = query.direction === "desc" ? "desc" : "asc";

  return <div className="space-y-4"><form method="get" action={pathname} className="flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="table-search">{searchPlaceholder}</label><input id="table-search" name="q" defaultValue={query.q} placeholder={searchPlaceholder} className="min-h-11 flex-1 rounded-control border bg-surface px-3 text-base text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2" /><button className="min-h-11 rounded-control border bg-surface px-4 font-semibold text-ink hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2" type="submit">Search</button></form>{rows.length === 0 ? <EmptyState title="Nothing here yet" description="Try a different search or add the first record when this module is connected." /> : <div className="overflow-x-auto rounded-card border bg-surface"><table className="w-full min-w-[42rem] text-left text-sm"><thead className="border-b bg-surface-alt text-ink-muted"><tr>{columns.map((column) => <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold" key={column.key}>{column.sortable ? <Link href={`${pathname}?${makeQuery({ sort: column.key, direction: sort === column.key && direction === "asc" ? "desc" : "asc", page: "1" })}`} className="underline-offset-4 hover:text-brand-deep hover:underline">{column.header}{sort === column.key ? <span aria-label={direction === "asc" ? " sorted ascending" : " sorted descending"}> {direction === "asc" ? "↑" : "↓"}</span> : null}</Link> : column.header}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row, index) => <tr key={index} className="hover:bg-surface-alt/60">{columns.map((column) => <td className="px-4 py-4 align-top" key={column.key}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>}<nav aria-label="Table pagination" className="flex items-center justify-between gap-3 text-sm"><span className="text-ink-muted">Page {page} of {pageCount}</span><div className="flex gap-2">{page > 1 ? <Link className="rounded-control border px-3 py-2 font-semibold hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2" href={`${pathname}?${makeQuery({ page: String(page - 1) })}`}>Previous</Link> : null}{page < pageCount ? <Link className="rounded-control border px-3 py-2 font-semibold hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-brand-deep focus-visible:outline-offset-2" href={`${pathname}?${makeQuery({ page: String(page + 1) })}`}>Next</Link> : null}</div></nav></div>;
}
