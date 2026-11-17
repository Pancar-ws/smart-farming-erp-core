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
import HarvestReceiptPage from '../pages/procurement/HarvestReceiptPage'
import SortingPage from '../pages/manufacturing/SortingPage'
import SalesOrderPage from '../pages/sales/SalesOrderPage'
import InventoryStockPage from '../pages/inventory/InventoryStockPage'
import AccountingPage from '../pages/accounting/AccountingPage'
import ReportsEsgPage from '../pages/reports/ReportsEsgPage'
import ProtectedRoute from './ProtectedRoute'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

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

        <Route
          path="/sales/orders"
          element={
            <ProtectedRoute requiredPermissions={['sales:read', 'sales:order', 'sales:ship']}>
              <SalesOrderPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/procurement/harvest"
          element={
            <ProtectedRoute requiredPermissions={['harvest:receive', 'harvest:read']}>
              <HarvestReceiptPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manufacturing/sorting"
          element={
            <ProtectedRoute requiredPermissions={['mfg:sort', 'mfg:read', 'mfg:config']}>
              <SortingPage />
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
              <InventoryStockPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/accounting"
          element={
            <ProtectedRoute requiredPermissions={['acct:read', 'acct:post', 'acct:payment']}>
              <AccountingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/esg"
          element={
            <ProtectedRoute requiredPermissions={['report:esg', 'report:operational']}>
              <ReportsEsgPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
