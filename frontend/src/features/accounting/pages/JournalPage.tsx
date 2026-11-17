// src/features/accounting/pages/JournalPage.tsx
import { useState } from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtIdr } from '@/core/format/money';
import { fmtDate } from '@/core/format/date';
import { ColumnDef } from '@tanstack/react-table';
import { BookOpen } from 'lucide-react';

interface JournalRow {
  id: number;
  entry_no: string;
  source_type: string;
  source_ref: string;
  total_debit: string;
  total_credit: string;
  status: string;
  entry_date: string;
}

export default function JournalPage() {
  const [data] = useState<JournalRow[]>([
    {
      id: 1,
      entry_no: 'JRN-202611-0001',
      source_type: 'SORTING_POSTED',
      source_ref: 'SRT-2026110001',
      total_debit: '32600000.00',
      total_credit: '32600000.00',
      status: 'POSTED',
      entry_date: '2026-11-14',
    },
    {
      id: 2,
      entry_no: 'JRN-202611-0002',
      source_type: 'ORDER_SHIPPED',
      source_ref: 'DO-2026110005',
      total_debit: '39400000.00',
      total_credit: '39400000.00',
      status: 'POSTED',
      entry_date: '2026-11-14',
    },
  ]);

  const columns: ColumnDef<JournalRow>[] = [
    {
      accessorKey: 'entry_no',
      header: 'No. Jurnal',
      cell: ({ row }) => <span className="font-semibold text-ink-900">{row.original.entry_no}</span>,
    },
    {
      accessorKey: 'source_type',
      header: 'Sumber Transaksi',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-xs text-ink-900">{row.original.source_type}</p>
          <p className="text-[11px] font-mono text-navy-700">{row.original.source_ref}</p>
        </div>
      ),
    },
    {
      accessorKey: 'total_debit',
      header: 'Total Debit (Rp)',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-ink-900">{fmtIdr(row.original.total_debit)}</span>
      ),
    },
    {
      accessorKey: 'total_credit',
      header: 'Total Kredit (Rp)',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-ink-900">{fmtIdr(row.original.total_credit)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'entry_date',
      header: 'Tanggal',
      cell: ({ row }) => <span className="text-xs text-ink-600">{fmtDate(row.original.entry_date)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-navy-700" />
          Buku Jurnal Umum (General Journal)
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Pencatatan double-entry otomatis berbasis event sistem yang terkunci (immutable ledger).
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        pagination={{
          page: 1,
          pageSize: 25,
          total: data.length,
          onPageChange: () => {},
        }}
      />
    </div>
  );
}

