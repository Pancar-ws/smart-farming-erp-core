// src/core/auth/menu.ts
export interface MenuItem {
  group: string;
  label: string;
  to: string;
  icon: string;
  any: string[];
}

export const MENU: MenuItem[] = [
  { group: 'Operasional', label: 'Stasiun timbang', to: '/timbang', icon: 'Scale', any: ['harvest:receive'] },
  { group: 'Operasional', label: 'Setoran panen', to: '/setoran', icon: 'ClipboardList', any: ['harvest:read'] },
  { group: 'Operasional', label: 'Sortasi panen', to: '/sortasi', icon: 'ListChecks', any: ['mfg:read'] },
  { group: 'Operasional', label: 'Pengemasan', to: '/pengemasan', icon: 'Package', any: ['mfg:sort'] },
  
  { group: 'Inventaris', label: 'Stok saprotan', to: '/inventaris/saprotan', icon: 'Sprout', any: ['inventory:read'] },
  { group: 'Inventaris', label: 'Stok panen & produk', to: '/inventaris/stok', icon: 'Warehouse', any: ['inventory:read'] },
  { group: 'Inventaris', label: 'Penyaluran saprotan', to: '/inventaris/penyaluran', icon: 'Truck', any: ['inventory:issue'] },
  { group: 'Inventaris', label: 'Mutasi & opname', to: '/inventaris/mutasi', icon: 'ArrowLeftRight', any: ['inventory:adjust'] },

  { group: 'Pengadaan', label: 'Pesanan pembelian', to: '/pengadaan/po', icon: 'FileSpreadsheet', any: ['po:read'] },
  { group: 'Pengadaan', label: 'Penerimaan logistik', to: '/pengadaan/penerimaan', icon: 'PackageCheck', any: ['po:write'] },

  { group: 'Penjualan', label: 'Pesanan penjualan', to: '/penjualan', icon: 'Receipt', any: ['sales:read'] },

  { group: 'Keuangan', label: 'Pembayaran kas', to: '/keuangan/pembayaran', icon: 'Wallet', any: ['acct:payment'] },
  { group: 'Keuangan', label: 'Hutang & piutang', to: '/keuangan/hutang-piutang', icon: 'Scale', any: ['acct:read'] },
  { group: 'Keuangan', label: 'Jurnal transaksi', to: '/keuangan/jurnal', icon: 'BookOpen', any: ['acct:read'] },
  { group: 'Keuangan', label: 'Laporan keuangan', to: '/keuangan/laporan', icon: 'FileBarChart', any: ['acct:read'] },
  { group: 'Keuangan', label: 'Perhitungan SHU', to: '/keuangan/shu', icon: 'PieChart', any: ['acct:read'] },

  { group: 'Keanggotaan', label: 'Data anggota tani', to: '/anggota', icon: 'Users', any: ['member:read'] },

  { group: 'Pelacakan', label: 'Telusur batch & QR', to: '/telusur', icon: 'Route', any: [] },
  { group: 'Keberlanjutan', label: 'Indikator ESG & SDGs', to: '/esg', icon: 'Leaf', any: ['report:esg'] },
  { group: 'Laporan', label: 'Laporan operasional', to: '/laporan', icon: 'BarChart3', any: ['report:operational'] },

  {
    group: 'Pengaturan',
    label: 'Pengaturan sistem',
    to: '/pengaturan/sistem',
    icon: 'Settings',
    any: ['*', 'mfg:config', 'price:sales:write', 'price:purchase:write', 'admin:user'],
  },
];

