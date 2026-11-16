// src/features/members/pages/MemberListPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/data-table/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fmtKg } from '@/core/format/money';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Search, UserCheck } from 'lucide-react';

interface MemberRow {
  id: number;
  member_code: string;
  name: string;
  nik_masked: string;
  commodity: string;
  land_area_ha: string;
  status: string;
  total_harvest_kg: string;
}

export default function MemberListPage() {
  const [search, setSearch] = useState('');

  const [data] = useState<MemberRow[]>([
    {
      id: 1,
      member_code: 'AGT-00001',
      name: 'Budi Santoso',
      nik_masked: '3301••••••••1234',
      commodity: 'Cabai Merah Keriting',
      land_area_ha: '1.20',
      status: 'AKTIF',
      total_harvest_kg: '14250.00',
    },
    {
      id: 2,
      member_code: 'AGT-00002',
      name: 'Siti Aminah',
      nik_masked: '3301••••••••5678',
      commodity: 'Bawang Merah Brebes',
      land_area_ha: '0.80',
      status: 'AKTIF',
      total_harvest_kg: '9800.00',
    },
    {
      id: 3,
      member_code: 'AGT-00003',
      name: 'Ahmad Fauzi',
      nik_masked: '3301••••••••9012',
      commodity: 'Padi Ciherang',
      land_area_ha: '2.00',
      status: 'AKTIF',
      total_harvest_kg: '22100.00',
    },
  ]);

  const columns: ColumnDef<MemberRow>[] = [
    {
      accessorKey: 'member_code',
      header: 'Kode Anggota',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-navy-700">{row.original.member_code}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nama Petani',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-ink-900">{row.original.name}</p>
          <p className="text-[11px] text-ink-600 font-mono">{row.original.nik_masked}</p>
        </div>
      ),
    },
    {
      accessorKey: 'commodity',
      header: 'Komoditas Utama',
    },
    {
      accessorKey: 'land_area_ha',
      header: 'Luas Lahan',
      cell: ({ row }) => <span>{row.original.land_area_ha} ha</span>,
    },
    {
      accessorKey: 'total_harvest_kg',
      header: 'Total Setoran',
      cell: ({ row }) => (
        <span className="readout font-bold text-ink-900">
          {fmtKg(row.original.total_harvest_kg)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <Link
          to={`/anggota/${row.original.id}`}
          className="text-xs font-semibold text-navy-700 hover:underline"
        >
          Lihat Rekap
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Data Master Anggota Tani</h1>
          <p className="text-xs text-ink-600 mt-1">
            Pengelolaan legalitas keanggotaan, lahan pertanian, dan rekap partisipasi panen.
          </p>
        </div>

        <Link to="/anggota/baru">
          <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm">
            <Plus className="w-4 h-4" />
            Tambah Anggota Baru
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Cari nama, NIK, atau kode anggota..."
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

