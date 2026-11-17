// src/features/harvest/pages/HarvestListPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/data-table/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { fmtKg } from '@/core/format/money';
import { fmtDateTime } from '@/core/format/date';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Scale, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface HarvestRow {
  id: number;
  receipt_no: string;
  batch_code: string;
  member_name: string;
  commodity_name: string;
  gross_kg: string;
  tare_kg: string;
  net_kg: string;
  status: string;
  received_at: string;
}

export default function HarvestListPage() {
  const [search, setSearch] = useState('');

  const [data] = useState<HarvestRow[]>([
    {
      id: 1,
      receipt_no: 'STR-202611-001',
      batch_code: 'BATCH-20261114-001',
      member_name: 'Budi Santoso',
      commodity_name: 'Cabai Merah Keriting',
      gross_kg: '1020.00',
      tare_kg: '20.00',
      net_kg: '1000.00',
      status: 'MENUNGGU_SORTASI',
      received_at: '2026-11-14T08:30:00Z',
    },
    {
      id: 2,
      receipt_no: 'STR-202611-002',
      batch_code: 'BATCH-20261114-002',
      member_name: 'Siti Aminah',
      commodity_name: 'Bawang Merah Brebes',
      gross_kg: '865.00',
      tare_kg: '15.00',
      net_kg: '850.00',
      status: 'SELESAI',
      received_at: '2026-11-14T09:15:00Z',
    },
  ]);

  const columns: ColumnDef<HarvestRow>[] = [
    {
      accessorKey: 'receipt_no',
      header: 'No. Bukti',
      cell: ({ row }) => (
        <span className="font-semibold text-ink-900">{row.original.receipt_no}</span>
      ),
    },
    {
      accessorKey: 'batch_code',
      header: 'Kode Batch',
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
      accessorKey: 'member_name',
      header: 'Anggota Petani',
    },
    {
      accessorKey: 'commodity_name',
      header: 'Komoditas',
    },
    {
      accessorKey: 'net_kg',
      header: 'Berat Bersih',
      cell: ({ row }) => (
        <span className="readout font-bold text-ink-900">{fmtKg(row.original.net_kg)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'received_at',
      header: 'Waktu Timbang',
      cell: ({ row }) => (
        <span className="text-xs text-ink-600">{fmtDateTime(row.original.received_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Daftar Penerimaan Panen</h1>
          <p className="text-xs text-ink-600 mt-1">
            Riwayat penimbangan panen anggota yang masuk ke gudang penerimaan.
          </p>
        </div>

        <Link to="/timbang">
          <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm">
            <Scale className="w-4 h-4" />
            Buka Stasiun Timbang Kiosk
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Cari nomor bukti, kode batch, atau petani..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          <Search className="w-4 h-4 text-ink-600 absolute left-3 top-3 pointer-events-none" />
        </div>
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

