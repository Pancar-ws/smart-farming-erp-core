// src/components/data-table/DataTable.tsx
import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (newPage: number) => void;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Belum ada data untuk ditampilkan.',
  emptyAction,
  pagination,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;

  return (
    <div className="rounded-panel border border-line bg-surface overflow-hidden shadow-sm flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-ink-900 border-collapse">
          <thead className="bg-canvas text-ink-600 border-b border-line text-xs font-semibold uppercase tracking-wider sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 select-none">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="h-12">
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-navy-50/50 transition-colors h-12"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-48 text-center py-8">
                  <div className="flex flex-col items-center justify-center text-ink-600 gap-2">
                    <Inbox className="w-8 h-8 text-ink-600/50" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                    {emptyAction && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={emptyAction.onClick}
                        className="mt-2"
                      >
                        {emptyAction.label}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-line bg-canvas/40 text-xs text-ink-600">
          <div>
            Menampilkan{' '}
            <span className="font-semibold text-ink-900">
              {pagination.total > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0}
            </span>{' '}
            sampai{' '}
            <span className="font-semibold text-ink-900">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>{' '}
            dari <span className="font-semibold text-ink-900">{pagination.total}</span> data
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || loading}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Sebelumnya
            </Button>
            <span className="px-2 font-medium">
              Hal {pagination.page} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= totalPages || loading}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Berikutnya
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

