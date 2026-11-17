import { hasPermission, hasRole, ROLES } from './roles'

/**
 * Daftar menu navigasi Sidebar dinamis berdasarkan peran pengguna.
 */
export const MENU_SECTIONS = [
  {
    section: 'Ringkasan',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        permissions: [],
      },
    ],
  },
  {
    section: 'Master Data',
    items: [
      {
        id: 'master-members',
        label: 'Petani & Lahan',
        path: '/master/members',
        icon: 'users',
        permissions: ['member:read', 'member:write'],
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
        label: 'Data Pelanggan',
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
        label: 'Produk & Harga',
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
    section: 'Penjualan',
    items: [
      {
        id: 'sales-orders',
        label: 'Pesanan Penjualan',
        path: '/sales/orders',
        icon: 'cart',
        permissions: ['sales:read', 'sales:order', 'sales:ship'],
      },
    ],
  },
  {
    section: 'Gudang & Produksi',
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
        label: 'Sortasi & Grading',
        path: '/manufacturing/sorting',
        icon: 'filter',
        permissions: ['mfg:sort', 'mfg:read', 'mfg:config'],
      },
      {
        id: 'inventory-stock',
        label: 'Stok & Inventaris',
        path: '/inventory/stock',
        icon: 'warehouse',
        permissions: ['inventory:read', 'inventory:issue', 'inventory:adjust', 'po:read'],
      },
    ],
  },
  {
    section: 'Keuangan & Laporan',
    items: [
      {
        id: 'accounting-ledger',
        label: 'Akuntansi & Kas',
        path: '/accounting',
        icon: 'wallet',
        permissions: ['acct:read', 'acct:post', 'acct:payment'],
      },
      {
        id: 'reports-esg',
        label: 'Laporan & ESG',
        path: '/reports/esg',
        icon: 'leaf',
        permissions: ['report:esg', 'report:operational'],
      },
    ],
  },
]

/**
 * Filter daftar menu berdasarkan pengguna yang sedang login
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
