import type { ReactNode } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined'
import Layout from '../components/Layout'
import Dashboard from '../pages/Dashboard'
import LiveMetrics from '../pages/LiveMetrics'

export type AppNavItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

export const NAV_ITEMS: AppNavItem[] = [
  { to: '/dashboard', label: '指標監控', icon: <DashboardOutlinedIcon fontSize="small" /> },
  { to: '/live-metrics', label: '即時指標', icon: <SensorsOutlinedIcon fontSize="small" /> },
]

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'live-metrics', element: <LiveMetrics /> },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]
