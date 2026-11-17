/**
 * Konfigurasi 9 Role & Permission RBAC sesuai backend (sql/011_seed_reference.sql)
 */

export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN_KEANGGOTAAN: 'ADMIN_KEANGGOTAAN',
  PETUGAS_PENERIMAAN: 'PETUGAS_PENERIMAAN',
  PETUGAS_SORTASI_QC: 'PETUGAS_SORTASI_QC',
  ADMIN_GUDANG: 'ADMIN_GUDANG',
  BAGIAN_PENJUALAN: 'BAGIAN_PENJUALAN',
  BAGIAN_KEUANGAN: 'BAGIAN_KEUANGAN',
  PENGURUS: 'PENGURUS',
  ANGGOTA_READONLY: 'ANGGOTA_READONLY',
}

export const ROLE_META = {
  SUPERADMIN: {
    code: 'SUPERADMIN',
    label: 'Administrator Sistem',
    shortLabel: 'Superadmin',
    description: 'Akses penuh ke seluruh modul, pengaturan sistem, dan manajemen pengguna.',
    permissions: ['*'],
  },
  ADMIN_KEANGGOTAAN: {
    code: 'ADMIN_KEANGGOTAAN',
    label: 'Admin Keanggotaan',
    shortLabel: 'Keanggotaan',
    description: 'Mengelola data master petani anggota, profil lahan, dan riwayat setoran panen.',
    permissions: ['member:read', 'member:write', 'harvest:read', 'inventory:read', 'report:operational'],
  },
  PETUGAS_PENERIMAAN: {
    code: 'PETUGAS_PENERIMAAN',
    label: 'Petugas Penerimaan',
    shortLabel: 'Penerimaan',
    description: 'Menimbang dan mencatat penerimaan hasil panen curah anggota serta menerbitkan batch.',
    permissions: ['harvest:receive', 'harvest:read', 'member:read', 'inventory:read'],
  },
  PETUGAS_SORTASI_QC: {
    code: 'PETUGAS_SORTASI_QC',
    label: 'Petugas Sortasi & QC',
    shortLabel: 'Sortasi & QC',
    description: 'Mengeksekusi order sortasi, grading mutu (Grade A/B/Afkir), dan pemeriksaan kualitas.',
    permissions: ['mfg:sort', 'mfg:config', 'mfg:read', 'harvest:read', 'inventory:read', 'report:operational'],
  },
  ADMIN_GUDANG: {
    code: 'ADMIN_GUDANG',
    label: 'Admin Gudang',
    shortLabel: 'Gudang',
    description: 'Mengelola master saprotan/gudang, pengadaan PO supplier, penyaluran saprotan, dan stok FIFO.',
    permissions: [
      'inventory:read',
      'inventory:issue',
      'inventory:adjust',
      'po:read',
      'po:write',
      'harvest:read',
      'master:write',
      'mfg:read',
      'report:operational',
    ],
  },
  BAGIAN_PENJUALAN: {
    code: 'BAGIAN_PENJUALAN',
    label: 'Bagian Penjualan',
    shortLabel: 'Penjualan',
    description: 'Memproses Sales Order 3 segmen pasar (price tiering), alokasi batch FIFO, dan Surat Jalan.',
    permissions: ['sales:read', 'sales:order', 'sales:ship', 'price:sales:write', 'inventory:read', 'report:operational'],
  },
  BAGIAN_KEUANGAN: {
    code: 'BAGIAN_KEUANGAN',
    label: 'Bagian Keuangan',
    shortLabel: 'Keuangan',
    description: 'Mengelola pembayaran anggota, penagihan faktur, penetapan harga, jurnal, Laba Rugi, dan SHU.',
    permissions: [
      'acct:read',
      'acct:post',
      'acct:payment',
      'acct:close',
      'price:purchase:write',
      'price:sales:write',
      'member:read',
      'harvest:read',
      'po:read',
      'sales:read',
      'inventory:read',
      'report:esg',
      'report:operational',
    ],
  },
  PENGURUS: {
    code: 'PENGURUS',
    label: 'Pengurus Koperasi',
    shortLabel: 'Pengurus',
    description: 'Memantau ringkasan operasional, laporan keuangan koperasi, dan indikator keberlanjutan ESG.',
    permissions: ['acct:read', 'report:esg', 'report:operational', 'member:read', 'inventory:read', 'sales:read'],
  },
  ANGGOTA_READONLY: {
    code: 'ANGGOTA_READONLY',
    label: 'Anggota (Baca Saja)',
    shortLabel: 'Anggota',
    description: 'Akses baca-saja untuk transparansi laporan keuangan koperasi dan indikator ESG.',
    permissions: ['acct:read', 'report:esg'],
  },
}

/**
 * Daftar 9 akun demo sesuai app/seed/run_seed.py (semua password: password123)
 */
export const DEMO_ACCOUNTS = [
  { id: 1, username: 'superadmin', password: 'password123', role: 'SUPERADMIN', name: 'Administrator Sistem' },
  { id: 2, username: 'admin_keanggotaan', password: 'password123', role: 'ADMIN_KEANGGOTAAN', name: 'Admin Keanggotaan' },
  { id: 3, username: 'penerimaan', password: 'password123', role: 'PETUGAS_PENERIMAAN', name: 'Petugas Penerimaan' },
  { id: 4, username: 'sortasi', password: 'password123', role: 'PETUGAS_SORTASI_QC', name: 'Petugas Sortasi & QC' },
  { id: 5, username: 'gudang', password: 'password123', role: 'ADMIN_GUDANG', name: 'Admin Gudang' },
  { id: 6, username: 'penjualan', password: 'password123', role: 'BAGIAN_PENJUALAN', name: 'Bagian Penjualan' },
  { id: 7, username: 'keuangan', password: 'password123', role: 'BAGIAN_KEUANGAN', name: 'Bagian Keuangan' },
  { id: 8, username: 'pengurus', password: 'password123', role: 'PENGURUS', name: 'Pengurus Koperasi' },
  { id: 9, username: 'anggota', password: 'password123', role: 'ANGGOTA_READONLY', name: 'Akun Anggota Tani' },
]

/**
 * Mengecek apakah user memiliki minimal salah satu permission yang diminta
 * (atau semua jika mode = 'all')
 */
export function hasPermission(user, requiredPerms = [], mode = 'any') {
  if (!user) return false
  if (!requiredPerms || requiredPerms.length === 0) return true

  const userPerms = user.permissions || ROLE_META[user.role]?.permissions || []
  if (userPerms.includes('*')) return true

  if (mode === 'all') {
    return requiredPerms.every((p) => userPerms.includes(p))
  }
  return requiredPerms.some((p) => userPerms.includes(p))
}

/**
 * Mengecek apakah role user termasuk dalam daftar role yang diizinkan
 */
export function hasRole(user, allowedRoles = []) {
  if (!user) return false
  if (!allowedRoles || allowedRoles.length === 0) return true
  if (user.role === ROLES.SUPERADMIN) return true
  return allowedRoles.includes(user.role)
}
