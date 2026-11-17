// src/features/inventory/pages/SaprotanStockPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/ui/Button';
import { fmtKg, fmtIdr } from '@/core/format/money';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Plus, Truck, Warehouse } from 'lucide-react';

interface SaprotanStockRow {
  id: number;
  item_code: string;
  item_name: string;
  category: string;
  warehouse: string;
  current_stock: string;
  min_stock: string;
  unit: string;
  cost_price: string;
  is_low: boolean;
}

export default function SaprotanStockPage() {
  const [data] = useState<SaprotanStockRow[]>([
    {
      id: 1,
      item_code: 'SAP-PUPUK-01',
      item_name: 'Pupuk NPK Phonska Plus',
      category: 'Pupuk Kimia',
      warehouse: 'Gudang Saprotan (GD-SPR)',
      current_stock: '480.00',
      min_stock: '500.00',
      unit: 'kg',
      cost_price: '14500',
      is_low: true,
    },
    {
      id: 2,
      item_code: 'SAP-ORG-01',
      item_name: 'Pupuk Kompos Organik Super',
      category: 'Pupuk Organik',
      warehouse: 'Gudang Saprotan (GD-SPR)',
      current_stock: '1850.00',
      min_stock: '1000.00',
      unit: 'kg',
      cost_price: '3500',
      is_low: false,
    },
    {
      id: 3,
      item_code: 'SAP-BENIH-01',
      item_name: 'Benih Cabai Unggul F1',
      category: 'Benih',
      warehouse: 'Gudang Saprotan (GD-SPR)',
      current_stock: '45.00',
      min_stock: '20.00',
      unit: 'bungkus',
      cost_price: '85000',
      is_low: false,
    },
  ]);

  const columns: ColumnDef<SaprotanStockRow>[] = [
    {
      accessorKey: 'item_code',
      header: 'Kode Item',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-navy-700">{row.original.item_code}</span>
      ),
    },
    {
      accessorKey: 'item_name',
      header: 'Nama Sarana Produksi',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-ink-900">{row.original.item_name}</p>
          <p className="text-[11px] text-ink-600">{row.original.category}</p>
        </div>
      ),
    },
    {
      accessorKey: 'warehouse',
      header: 'Gudang Penyimpanan',
    },
    {
      accessorKey: 'current_stock',
      header: 'Stok Saat Ini',
      cell: ({ row }) => {
        const isLow = row.original.is_low;
        return (
          <div className="flex items-center gap-2">
            <span className={`readout font-bold ${isLow ? 'text-amber-800' : 'text-ink-900'}`}>
              {row.original.current_stock} {row.original.unit}
            </span>
            {isLow && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Perlu Restock
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'min_stock',
      header: 'Batas Minimum',
      cell: ({ row }) => (
        <span className="text-ink-600">
          {row.original.min_stock} {row.original.unit}
        </span>
      ),
    },
    {
      accessorKey: 'cost_price',
      header: 'Harga Pokok',
      cell: ({ row }) => (
        <span className="font-mono text-ink-900">{fmtIdr(row.original.cost_price)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Stok Saprotan (Sarana Produksi)</h1>
          <p className="text-xs text-ink-600 mt-1">
            Monitoring persediaan pupuk, benih, dan sarana produksi pertanian serta peringatan ROP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/inventaris/penyaluran">
            <Button variant="primary" size="md" className="gap-2 font-bold shadow-sm">
              <Truck className="w-4 h-4" />
              Salurkan ke Anggota
            </Button>
          </Link>
          <Link to="/pengadaan/po">
            <Button variant="outline" size="md" className="gap-2">
              <Plus className="w-4 h-4" />
              Buat Pesanan PO
            </Button>
          </Link>
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

