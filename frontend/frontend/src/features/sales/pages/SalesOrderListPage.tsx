// src/features/sales/pages/SalesOrderListPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/data-table/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { fmtIdr } from '@/core/format/money';
import { fmtDate } from '@/core/format/date';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Receipt, Truck } from 'lucide-react';

interface SalesOrderRow {
  id: number;
  order_no: string;
  customer_name: string;
  segment: string;
  total_idr: string;
  status: string;
  order_date: string;
}

export default function SalesOrderListPage() {
  const [data] = useState<SalesOrderRow[]>([
    {
      id: 1,
      order_no: 'SO-202611-0001',
      customer_name: 'Toko Maju Jaya',
      segment: 'Retail',
      total_idr: '39400000.00',
      status: 'CONFIRMED',
      order_date: '2026-11-14',
    },
    {
      id: 2,
      order_no: 'SO-202611-0002',
      customer_name: 'Pasar Induk Kramat Jati',
      segment: 'Konsumen langsung',
      total_idr: '18500000.00',
      status: 'SHIPPED',
      order_date: '2026-11-13',
    },
  ]);

  const columns: ColumnDef<SalesOrderRow>[] = [
    {
      accessorKey: 'order_no',
      header: 'No. Pesanan (SO)',
      cell: ({ row }) => (
        <span className="font-semibold text-ink-900">{row.original.order_no}</span>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: 'Pelanggan',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-ink-900">{row.original.customer_name}</p>
          <p className="text-[11px] text-ink-600">{row.original.segment}</p>
        </div>
      ),
    },
    {
      accessorKey: 'total_idr',
      header: 'Total Nilai',
      cell: ({ row }) => (
        <span className="readout font-bold text-ink-900">{fmtIdr(row.original.total_idr)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'order_date',
      header: 'Tanggal Pesanan',
      cell: ({ row }) => (
        <span className="text-xs text-ink-600">{fmtDate(row.original.order_date)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.status === 'CONFIRMED' && (
            <Button variant="secondary" size="sm" className="gap-1 text-xs">
              <Truck className="w-3.5 h-3.5" />
              Kirim (DO)
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Daftar Pesanan Penjualan (SO)</h1>
          <p className="text-xs text-ink-600 mt-1">
            Pengelolaan order penjualan, reservasi stok barang jadi, dan pengiriman surat jalan.
          </p>
        </div>

        <Link to="/penjualan/baru">
          <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm">
            <Plus className="w-4 h-4" />
            Pesanan Penjualan Baru
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

