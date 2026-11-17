// src/features/sorting/pages/SortingListPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/data-table/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { fmtKg, fmtPct } from '@/core/format/money';
import { fmtDate } from '@/core/format/date';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, ListChecks } from 'lucide-react';

interface SortingOrderRow {
  id: number;
  order_no: string;
  batch_input: string;
  commodity_name: string;
  input_kg: string;
  shrink_pct: string;
  status: string;
  processed_date: string;
}

export default function SortingListPage() {
  const [data] = useState<SortingOrderRow[]>([
    {
      id: 1,
      order_no: 'SRT-2026110001',
      batch_input: 'BATCH-20261114-001',
      commodity_name: 'Cabai Merah Keriting',
      input_kg: '1000.00',
      shrink_pct: '10.00',
      status: 'POSTED',
      processed_date: '2026-11-14',
    },
    {
      id: 2,
      order_no: 'SRT-2026110002',
      batch_input: 'BATCH-20261114-002',
      commodity_name: 'Bawang Merah Brebes',
      input_kg: '850.00',
      shrink_pct: '5.50',
      status: 'POSTED',
      processed_date: '2026-11-14',
    },
  ]);

  const columns: ColumnDef<SortingOrderRow>[] = [
    {
      accessorKey: 'order_no',
      header: 'No. Order Sortasi',
      cell: ({ row }) => (
        <span className="font-semibold text-ink-900">{row.original.order_no}</span>
      ),
    },
    {
      accessorKey: 'batch_input',
      header: 'Batch Input',
      cell: ({ row }) => (
        <Link
          to={`/telusur?q=${row.original.batch_input}`}
          className="font-mono text-xs font-bold text-navy-700 hover:underline"
        >
          {row.original.batch_input}
        </Link>
      ),
    },
    {
      accessorKey: 'commodity_name',
      header: 'Komoditas',
    },
    {
      accessorKey: 'input_kg',
      header: 'Input Mentah',
      cell: ({ row }) => (
        <span className="readout font-bold text-ink-900">{fmtKg(row.original.input_kg)}</span>
      ),
    },
    {
      accessorKey: 'shrink_pct',
      header: 'Susut (% Afkir)',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-coral-700">
          {fmtPct(row.original.shrink_pct)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'processed_date',
      header: 'Tanggal Sortasi',
      cell: ({ row }) => (
        <span className="text-xs text-ink-600">{fmtDate(row.original.processed_date)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Daftar Order Sortasi & Grading</h1>
          <p className="text-xs text-ink-600 mt-1">
            Riwayat pemilahan grade mutu komoditas dan verifikasi hukum kekekalan massa.
          </p>
        </div>

        <Link to="/sortasi/baru">
          <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm">
            <Plus className="w-4 h-4" />
            Order Sortasi Baru
          </Button>
        </Link>
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

