import { hasPermission, hasRole, ROLES } from './roles'

/**
 * Daftar menu navigasi Sidebar dinamis berdasarkan Role & Permission RBAC.
 * Mencakup modul utama Rani (Dashboard, Master Data, Sales Order) serta
 * route modul tim (Caca: Penerimaan, Sortasi, Gudang; Amel: Akuntansi, Laporan & ESG).
 */
export const MENU_SECTIONS = [
  {
    section: 'Utama',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard Utama',
        path: '/dashboard',
        icon: 'dashboard',
        permissions: [], // Semua user terautentikasi
      },
    ],
  },
  {
    section: 'Data Master & Keanggotaan',
    items: [
      {
        id: 'master-members',
        label: 'Petani Anggota',
        path: '/master/members',
        icon: 'users',
        permissions: ['member:read', 'member:write'],
        badge: 'Fitur 1',
      },
      {
        id: 'master-saprotan',
        label: 'Master Saprotan',
        path: '/master/saprotan',
        icon: 'box',
        roles: [
          ROLES.SUPERADMIN,
          ROLES.ADMIN_GUDANG,
          ROLES.ADMIN_KEANGGOTAAN,
          ROLES.PETUGAS_PENERIMAAN,
          ROLES.BAGIAN_KEUANGAN,
          ROLES.PENGURUS,
        ],
      },
      {
        id: 'master-customers',
        label: 'Direktori Pelanggan',
        path: '/master/customers',
        icon: 'store',
        roles: [
          ROLES.SUPERADMIN,
          ROLES.BAGIAN_PENJUALAN,
          ROLES.ADMIN_GUDANG,
          ROLES.BAGIAN_KEUANGAN,
          ROLES.PENGURUS,
        ],
      },
      {
        id: 'master-pricing',
        label: 'Produk, Grade & Harga',
        path: '/master/pricing',
        icon: 'tag',
        roles: [
          ROLES.SUPERADMIN,
          ROLES.BAGIAN_PENJUALAN,
          ROLES.BAGIAN_KEUANGAN,
          ROLES.PETUGAS_SORTASI_QC,
          ROLES.ADMIN_GUDANG,
          ROLES.PENGURUS,
        ],
      },
    ],
  },
  {
    section: 'Komersial & Distribusi',
    items: [
      {
        id: 'sales-orders',
        label: 'Sales Order & FIFO',
        path: '/sales/orders',
        icon: 'cart',
        permissions: ['sales:read', 'sales:order', 'sales:ship'],
        badge: 'Fitur 5',
      },
    ],
  },
  {
    section: 'Operasional Gudang & Produksi',
    items: [
      {
        id: 'procurement-harvest',
        label: 'Penerimaan Panen',
        path: '/procurement/harvest',
        icon: 'scale',
        permissions: ['harvest:receive', 'harvest:read'],
      },
      {
        id: 'manufacturing-sorting',
        label: 'Sortasi, Grading & QC',
        path: '/manufacturing/sorting',
        icon: 'filter',
        permissions: ['mfg:sort', 'mfg:read', 'mfg:config'],
      },
      {
        id: 'inventory-stock',
        label: 'Inventaris & Multi-Gudang',
        path: '/inventory/stock',
        icon: 'warehouse',
        permissions: ['inventory:read', 'inventory:issue', 'inventory:adjust', 'po:read'],
      },
    ],
  },
  {
    section: 'Keuangan & Keberlanjutan',
    items: [
      {
        id: 'accounting-ledger',
        label: 'Akuntansi & Buku Besar',
        path: '/accounting',
        icon: 'wallet',
        permissions: ['acct:read', 'acct:post', 'acct:payment'],
      },
      {
        id: 'reports-esg',
        label: 'Laporan & Dashboard ESG',
        path: '/reports/esg',
        icon: 'leaf',
        permissions: ['report:esg', 'report:operational'],
      },
    ],
  },
]

/**
 * Filter daftar menu berdasarkan user yang sedang login
 */
export function getMenusForUser(user) {
  if (!user) return []

  return MENU_SECTIONS.map((sec) => {
    const visibleItems = sec.items.filter((item) => {
      if (item.roles && item.roles.length > 0) {
        return hasRole(user, item.roles)
      }
      if (item.permissions && item.permissions.length > 0) {
        return hasPermission(user, item.permissions, 'any')
      }
      return true
    })
    return { ...sec, items: visibleItems }
  }).filter((sec) => sec.items.length > 0)
}
