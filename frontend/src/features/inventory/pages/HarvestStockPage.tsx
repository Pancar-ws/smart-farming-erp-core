// src/features/inventory/pages/HarvestStockPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/data-table/DataTable';
import { fmtKg } from '@/core/format/money';
import { fmtDate } from '@/core/format/date';
import { ColumnDef } from '@tanstack/react-table';

interface HarvestStockRow {
  id: number;
  batch_code: string;
  commodity_name: string;
  grade_name: string;
  warehouse: string;
  stock_kg: string;
  reserved_kg: string;
  available_kg: string;
  received_date: string;
  age_days: number;
}

export default function HarvestStockPage() {
  const [data] = useState<HarvestStockRow[]>([
    {
      id: 1,
      batch_code: 'BATCH-20261112-004',
      commodity_name: 'Cabai Merah Keriting',
      grade_name: 'Grade A (Super)',
      warehouse: 'Gudang Hasil Sortasi (GD-SRT)',
      stock_kg: '400.00',
      reserved_kg: '0.00',
      available_kg: '400.00',
      received_date: '2026-11-12',
      age_days: 2,
    },
    {
      id: 2,
      batch_code: 'BATCH-20261114-001',
      commodity_name: 'Cabai Merah Keriting',
      grade_name: 'Grade A (Super)',
      warehouse: 'Gudang Hasil Sortasi (GD-SRT)',
      stock_kg: '700.00',
      reserved_kg: '0.00',
      available_kg: '700.00',
      received_date: '2026-11-14',
      age_days: 0,
    },
    {
      id: 3,
      batch_code: 'BATCH-20261114-001',
      commodity_name: 'Cabai Merah Keriting',
      grade_name: 'Grade B (Medium)',
      warehouse: 'Gudang Hasil Sortasi (GD-SRT)',
      stock_kg: '200.00',
      reserved_kg: '0.00',
      available_kg: '200.00',
      received_date: '2026-11-14',
      age_days: 0,
    },
  ]);

  const columns: ColumnDef<HarvestStockRow>[] = [
    {
      accessorKey: 'batch_code',
      header: 'Kode Batch (Lot)',
      cell: ({ row }) => (
        <Link
          to={`/telusur?q=${row.original.batch_code}`}
          className="font-mono text-xs font-bold text-navy-700 hover:underline"
        >
          {row.original.batch_code}
        </Link>
      ),
    },
    {
      accessorKey: 'commodity_name',
      header: 'Komoditas & Grade',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-ink-900">{row.original.commodity_name}</p>
          <p className="text-xs text-navy-700 font-semibold">{row.original.grade_name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'warehouse',
      header: 'Gudang',
      cell: ({ row }) => <span className="text-xs text-ink-600">{row.original.warehouse}</span>,
    },
    {
      accessorKey: 'available_kg',
      header: 'Tersedia (FIFO)',
      cell: ({ row }) => (
        <span className="readout font-bold text-green-700 text-sm">
          {fmtKg(row.original.available_kg)}
        </span>
      ),
    },
    {
      accessorKey: 'age_days',
      header: 'Umur Stok',
      cell: ({ row }) => (
        <span className="text-xs text-ink-600">
          {row.original.age_days} hari ({fmtDate(row.original.received_date)})
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Stok Hasil Panen & Barang Jadi</h1>
        <p className="text-xs text-ink-600 mt-1">
          Daftar persediaan komoditas per batch lot dengan urutan FIFO (First In, First Out).
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

