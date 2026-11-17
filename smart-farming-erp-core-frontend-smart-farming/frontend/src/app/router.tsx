// src/app/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { RequireAuth, RequirePermission } from '@/core/auth/guards';
import { AppShell } from './layouts/AppShell';
import { KioskShell } from './layouts/KioskShell';
import { PortalShell } from './layouts/PortalShell';

import LoginPage from '@/features/auth/pages/LoginPage';
import ForbiddenPage from '@/features/auth/pages/ForbiddenPage';
import NotFoundPage from '@/features/auth/pages/NotFoundPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';

import WeighStationPage from '@/features/harvest/pages/WeighStationPage';
import HarvestListPage from '@/features/harvest/pages/HarvestListPage';
import MemberListPage from '@/features/members/pages/MemberListPage';

import SaprotanStockPage from '@/features/inventory/pages/SaprotanStockPage';
import HarvestStockPage from '@/features/inventory/pages/HarvestStockPage';
import IssueSaprotanPage from '@/features/inventory/pages/IssueSaprotanPage';
import WarehouseMutationPage from '@/features/inventory/pages/WarehouseMutationPage';

import POListPage from '@/features/procurement/pages/POListPage';
import GoodsReceiptPage from '@/features/procurement/pages/GoodsReceiptPage';

import SortingListPage from '@/features/sorting/pages/SortingListPage';
import SortingFormPage from '@/features/sorting/pages/SortingFormPage';
import PackagingPage from '@/features/sorting/pages/PackagingPage';

import SalesOrderListPage from '@/features/sales/pages/SalesOrderListPage';
import SalesOrderFormPage from '@/features/sales/pages/SalesOrderFormPage';

import PaymentsPage from '@/features/accounting/pages/PaymentsPage';
import PayablesReceivablesPage from '@/features/accounting/pages/PayablesReceivablesPage';
import JournalPage from '@/features/accounting/pages/JournalPage';
import FinancialReportsPage from '@/features/accounting/pages/FinancialReportsPage';
import SHUCalculationPage from '@/features/accounting/pages/SHUCalculationPage';

import TraceSearchPage from '@/features/traceability/pages/TraceSearchPage';
import ESGIndicatorsPage from '@/features/esg/pages/ESGIndicatorsPage';
import OperationalReportsPage from '@/features/reporting/pages/OperationalReportsPage';
import SystemSettingsPage from '@/features/settings/pages/SystemSettingsPage';
import MemberPortalPage from '@/features/portal/pages/MemberPortalPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  {
    element: <RequireAuth />,
    children: [
      // Kiosk Timbang Panen
      {
        element: <RequirePermission any={['harvest:receive']} />,
        children: [
          {
            element: <KioskShell />,
            children: [{ path: '/timbang', element: <WeighStationPage /> }],
          },
        ],
      },
      // Portal Anggota (Read-only)
      {
        element: <PortalShell />,
        children: [{ path: '/portal', element: <MemberPortalPage /> }],
      },
      // AppShell Utama
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/setoran', element: <HarvestListPage /> },
          { path: '/sortasi', element: <SortingListPage /> },
          { path: '/sortasi/baru', element: <SortingFormPage /> },
          { path: '/pengemasan', element: <PackagingPage /> },

          { path: '/inventaris/saprotan', element: <SaprotanStockPage /> },
          { path: '/inventaris/stok', element: <HarvestStockPage /> },
          { path: '/inventaris/penyaluran', element: <IssueSaprotanPage /> },
          { path: '/inventaris/mutasi', element: <WarehouseMutationPage /> },

          { path: '/pengadaan/po', element: <POListPage /> },
          { path: '/pengadaan/penerimaan', element: <GoodsReceiptPage /> },

          { path: '/penjualan', element: <SalesOrderListPage /> },
          { path: '/penjualan/baru', element: <SalesOrderFormPage /> },

          { path: '/keuangan/pembayaran', element: <PaymentsPage /> },
          { path: '/keuangan/hutang-piutang', element: <PayablesReceivablesPage /> },
          { path: '/keuangan/jurnal', element: <JournalPage /> },
          { path: '/keuangan/laporan', element: <FinancialReportsPage /> },
          { path: '/keuangan/shu', element: <SHUCalculationPage /> },

          { path: '/anggota', element: <MemberListPage /> },
          { path: '/telusur', element: <TraceSearchPage /> },
          { path: '/esg', element: <ESGIndicatorsPage /> },
          { path: '/laporan', element: <OperationalReportsPage /> },
          { path: '/pengaturan/sistem', element: <SystemSettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

