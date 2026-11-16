// src/features/accounting/pages/PayablesReceivablesPage.tsx
import { useState } from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import { fmtIdr } from '@/core/format/money';
import { fmtDate } from '@/core/format/date';
import { ColumnDef } from '@tanstack/react-table';

interface AgingRow {
  id: number;
  party_name: string;
  doc_ref: string;
  total_val: string;
  due_date: string;
  aging_bucket: string;
}

export default function PayablesReceivablesPage() {
  const [tab, setTab] = useState<'PAYABLES' | 'RECEIVABLES'>('PAYABLES');

  const [data] = useState<AgingRow[]>([
    {
      id: 1,
      party_name: 'Budi Santoso (Petani)',
      doc_ref: 'SRT-2026110001',
      total_val: '32600000.00',
      due_date: '2026-11-28',
      aging_bucket: 'Belum Jatuh Tempo (0-14 Hari)',
    },
    {
      id: 2,
      party_name: 'PT Petrokimia Sejahtera (Supplier)',
      doc_ref: 'PO-202611-0001',
      total_val: '14500000.00',
      due_date: '2026-11-20',
      aging_bucket: 'Belum Jatuh Tempo (0-14 Hari)',
    },
  ]);

  const columns: ColumnDef<AgingRow>[] = [
    {
      accessorKey: 'party_name',
      header: 'Mitra / Pihak Terkait',
      cell: ({ row }) => <span className="font-semibold text-ink-900">{row.original.party_name}</span>,
    },
    {
      accessorKey: 'doc_ref',
      header: 'No. Dokumen Acuan',
      cell: ({ row }) => <span className="font-mono text-xs font-bold text-navy-700">{row.original.doc_ref}</span>,
    },
    {
      accessorKey: 'total_val',
      header: 'Sisa Saldo',
      cell: ({ row }) => <span className="font-mono font-bold text-ink-900">{fmtIdr(row.original.total_val)}</span>,
    },
    {
      accessorKey: 'due_date',
      header: 'Tanggal Jatuh Tempo',
      cell: ({ row }) => <span className="text-xs text-ink-600">{fmtDate(row.original.due_date)}</span>,
    },
    {
      accessorKey: 'aging_bucket',
      header: 'Umur Piutang/Hutang',
      cell: ({ row }) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700">
          {row.original.aging_bucket}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Monitoring Hutang & Piutang (Aging)</h1>
        <p className="text-xs text-ink-600 mt-1">
          Pengendalian jatuh tempo kewajiban koperasi dan piutang dagang pelanggan.
        </p>
      </div>

      <div className="flex border-b border-line gap-4">
        <button
          onClick={() => setTab('PAYABLES')}
          className={`pb-3 text-sm font-bold border-b-2 cursor-pointer ${
            tab === 'PAYABLES' ? 'border-navy-700 text-navy-700' : 'border-transparent text-ink-600'
          }`}
        >
          Daftar Hutang Usaha (AP)
        </button>
        <button
          onClick={() => setTab('RECEIVABLES')}
          className={`pb-3 text-sm font-bold border-b-2 cursor-pointer ${
            tab === 'RECEIVABLES' ? 'border-navy-700 text-navy-700' : 'border-transparent text-ink-600'
          }`}
        >
          Daftar Piutang Usaha (AR)
        </button>
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

