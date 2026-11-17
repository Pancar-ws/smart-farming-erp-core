// src/features/procurement/pages/POListPage.tsx
import { useState } from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { fmtIdr } from '@/core/format/money';
import { fmtDate } from '@/core/format/date';
import { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

interface PORow {
  id: number;
  po_number: string;
  supplier_name: string;
  total_amount: string;
  status: string;
  created_at: string;
}

export default function POListPage() {
  const [data] = useState<PORow[]>([
    {
      id: 1,
      po_number: 'PO-202611-0001',
      supplier_name: 'PT Petrokimia Sejahtera',
      total_amount: '14500000.00',
      status: 'ORDERED',
      created_at: '2026-11-10',
    },
    {
      id: 2,
      po_number: 'PO-202611-0002',
      supplier_name: 'CV Benih Unggul Nusantara',
      total_amount: '8500000.00',
      status: 'RECEIVED',
      created_at: '2026-11-08',
    },
  ]);

  const columns: ColumnDef<PORow>[] = [
    {
      accessorKey: 'po_number',
      header: 'No. PO Pembelian',
      cell: ({ row }) => <span className="font-semibold text-ink-900">{row.original.po_number}</span>,
    },
    {
      accessorKey: 'supplier_name',
      header: 'Supplier / Pemasok',
    },
    {
      accessorKey: 'total_amount',
      header: 'Total Nilai PO',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-ink-900">{fmtIdr(row.original.total_amount)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'created_at',
      header: 'Tanggal Pesan',
      cell: ({ row }) => <span className="text-xs text-ink-600">{fmtDate(row.original.created_at)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Pesanan Pembelian Saprotan (PO)</h1>
          <p className="text-xs text-ink-600 mt-1">
            Pengadaan barang logistik pupuk, benih, dan sarana produksi dari mitra pemasok resmi.
          </p>
        </div>

        <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm">
          <Plus className="w-4 h-4" />
          Buat PO Baru
        </Button>
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

