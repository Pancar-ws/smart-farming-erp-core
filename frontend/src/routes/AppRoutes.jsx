import { Navigate, Route, Routes } from 'react-router-dom'
import { ROLES } from '../config/roles'
import MainLayout from '../layouts/MainLayout'
import LoginPage from '../pages/auth/LoginPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import CustomersPage from '../pages/master-data/CustomersPage'
import MembersPage from '../pages/master-data/MembersPage'
import PricingCatalogPage from '../pages/master-data/PricingCatalogPage'
import SaprotanPage from '../pages/master-data/SaprotanPage'
import ModulePlaceholderPage from '../pages/placeholders/ModulePlaceholderPage'
import SalesOrderPage from '../pages/sales/SalesOrderPage'
import ProtectedRoute from './ProtectedRoute'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Route Publik: Halaman Otentikasi Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Route Terproteksi di dalam MainLayout (Sidebar RBAC + Header) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* FITUR 1: Modul Master Data & Keanggotaan (Tugas Rani) */}
        <Route
          path="/master/members"
          element={
            <ProtectedRoute requiredPermissions={['member:read', 'member:write']}>
              <MembersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master/saprotan"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.SUPERADMIN,
                ROLES.ADMIN_GUDANG,
                ROLES.ADMIN_KEANGGOTAAN,
                ROLES.PETUGAS_PENERIMAAN,
                ROLES.BAGIAN_KEUANGAN,
                ROLES.PENGURUS,
              ]}
            >
              <SaprotanPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master/customers"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.SUPERADMIN,
                ROLES.BAGIAN_PENJUALAN,
                ROLES.ADMIN_GUDANG,
                ROLES.BAGIAN_KEUANGAN,
                ROLES.PENGURUS,
              ]}
            >
              <CustomersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master/pricing"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.SUPERADMIN,
                ROLES.BAGIAN_PENJUALAN,
                ROLES.BAGIAN_KEUANGAN,
                ROLES.PETUGAS_SORTASI_QC,
                ROLES.ADMIN_GUDANG,
                ROLES.PENGURUS,
              ]}
            >
              <PricingCatalogPage />
            </ProtectedRoute>
          }
        />

        {/* FITUR 5: Modul Sales, Price Tiering & Alokasi FIFO (Tugas Rani) */}
        <Route
          path="/sales/orders"
          element={
            <ProtectedRoute requiredPermissions={['sales:read', 'sales:order', 'sales:ship']}>
              <SalesOrderPage />
            </ProtectedRoute>
          }
        />

        {/* PLACEHOLDER ROUTES UNTUK ANGGOTA TIM LAIN (Caca & Amel) */}
        <Route
          path="/procurement/harvest"
          element={
            <ProtectedRoute requiredPermissions={['harvest:receive', 'harvest:read']}>
              <ModulePlaceholderPage
                screenId="UI-PRC-01"
                title="Penerimaan Panen Anggota & Penimbangan Digital"
                owner="Caca (Frontend UI/UX & Field Operations)"
                description="Antarmuka pencatatan setoran panen curah anggota yang terhubung dengan Web Serial API timbangan digital, validasi status keanggotaan aktif, dan penerbitan nomor batch unik."
                ursRefs={['URS-PRC-004', 'URS-PRC-005', 'UAT-04']}
                endpoints={[
                  'POST /api/v1/procurement/harvest-receipts',
                  'GET  /api/v1/procurement/harvest-receipts',
                  'POST /api/v1/procurement/purchase-orders',
                  'POST /api/v1/procurement/goods-receipts',
                ]}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manufacturing/sorting"
          element={
            <ProtectedRoute requiredPermissions={['mfg:sort', 'mfg:read', 'mfg:config']}>
              <ModulePlaceholderPage
                screenId="UI-MFG-01"
                title="Sortasi, Grading Mutu & Kalkulator Mass Balance"
                owner="Caca (Frontend UI/UX & Field Operations)"
                description="Antarmuka pemilahan hasil panen curah menjadi stok per grade (Grade A, Grade B, Afkir/Susut) dengan validasi keseimbangan massa real-time (Input = Output Grade + Afkir)."
                ursRefs={['URS-MFG-003', 'URS-MFG-004', 'URS-MFG-005', 'UAT-05']}
                endpoints={[
                  'POST /api/v1/manufacturing/sorting-orders',
                  'GET  /api/v1/manufacturing/sorting-orders',
                  'POST /api/v1/manufacturing/sorting-orders/{order_id}/quality-checks',
                  'POST /api/v1/manufacturing/sorting-orders/{order_id}/post',
                ]}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/stock"
          element={
            <ProtectedRoute
              requiredPermissions={[
                'inventory:read',
                'inventory:issue',
                'inventory:adjust',
                'po:read',
              ]}
            >
              <ModulePlaceholderPage
                screenId="UI-INV-01"
                title="Manajemen Inventaris 4 Gudang, Penyaluran Saprotan & Mutasi"
                owner="Caca & Aufa"
                description="Pemantauan stok real-time 4 kategori (Saprotan, Panen Mentah Curah, Hasil Sortasi per Grade, Produk Kemasan), penyaluran saprotan ke anggota, serta stock opname."
                ursRefs={['URS-INV-001', 'URS-INV-003', 'URS-INV-005', 'UAT-03']}
                endpoints={[
                  'GET  /api/v1/inventory/saprotan',
                  'GET  /api/v1/inventory/lots',
                  'POST /api/v1/inventory/saprotan-issues',
                  'POST /api/v1/inventory/transfers',
                  'POST /api/v1/inventory/adjustments',
                ]}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/accounting"
          element={
            <ProtectedRoute requiredPermissions={['acct:read', 'acct:post', 'acct:payment']}>
              <ModulePlaceholderPage
                screenId="UI-ACC-01"
                title="Akuntansi Double-Entry, Pembayaran Anggota, Laba Rugi & SHU"
                owner="Pancar & Amel"
                description="Pencatatan pembayaran hutang panen anggota, penerimaan piutang pelanggan, laporan Laba Rugi, Buku Besar, margin kotor per batch, serta kalkulasi Sisa Hasil Usaha (SHU)."
                ursRefs={['URS-ACC-001 s.d. 010', 'UAT-09', 'UAT-11']}
                endpoints={[
                  'GET  /api/v1/accounting/journals',
                  'POST /api/v1/accounting/payments/member',
                  'GET  /api/v1/accounting/reports/income-statement',
                  'GET  /api/v1/accounting/reports/margin',
                  'POST /api/v1/accounting/shu/calculate',
                ]}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/esg"
          element={
            <ProtectedRoute requiredPermissions={['report:esg', 'report:operational']}>
              <ModulePlaceholderPage
                screenId="UI-ESG-01"
                title="Dashboard Keberlanjutan ESG, SDGs & Ketertelusuran Batch (QR Code)"
                owner="Amel (QA, Reporting & UAT)"
                description="Visualisasi indikator Environmental (rasio pupuk organik vs kimia & food loss), Social (jumlah anggota aktif & ketepatan bayar), dan Governance (traceability batch ke petani asal)."
                ursRefs={['URS-RPT-005 s.d. 009', 'UAT-10', 'UAT-11']}
                endpoints={[
                  'GET /api/v1/reports/esg/environmental',
                  'GET /api/v1/reports/esg/social',
                  'GET /api/v1/reports/esg/governance',
                  'GET /api/v1/trace/batches/{code}',
                  'GET /api/v1/reports/finished-stock?format=xlsx',
                ]}
              />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
