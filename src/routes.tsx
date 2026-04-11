import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Properties = React.lazy(() => import('./views/admin/properties/Properties'))
const Tenants = React.lazy(() => import('./views/admin/tenants/Tenants'))
const Leases = React.lazy(() => import('./views/admin/leases/Leases'))
const Inspections = React.lazy(() => import('./views/admin/inspections/Inspections'))
const Payments = React.lazy(() => import('./views/admin/payments/Payments'))
const Quittances = React.lazy(() => import('./views/admin/quittances/Quittances'))
const Charges = React.lazy(() => import('./views/admin/charges/Charges'))
const Comptability = React.lazy(() => import('./views/admin/comptability/Comptability'))
const Associates = React.lazy(() => import('./views/admin/associates/Associates'))
const Declarations = React.lazy(() => import('./views/admin/declarations/Declarations'))
const Documents = React.lazy(() => import('./views/admin/documents/Documents'))
const Settings = React.lazy(() => import('./views/admin/settings/Settings'))

interface Route {
  path: string
  name: string
  element?: React.ComponentType
  exact?: boolean
}

const routes: Route[] = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Tableau de bord', element: Dashboard },
  { path: '/admin', name: 'Administration', element: Properties, exact: true },
  { path: '/admin/properties', name: 'Mes biens', element: Properties },
  { path: '/admin/tenants', name: 'Mes locataires', element: Tenants },
  { path: '/admin/leases', name: 'Baux', element: Leases },
  { path: '/admin/inspections', name: 'États des lieux', element: Inspections },
  { path: '/admin/payments', name: 'Paiements', element: Payments },
  { path: '/admin/quittances', name: 'Quittances', element: Quittances },
  { path: '/admin/charges', name: 'Charges', element: Charges },
  { path: '/admin/comptability', name: 'Comptabilité', element: Comptability },
  { path: '/admin/associates', name: 'Associés', element: Associates },
  { path: '/admin/declarations', name: 'Déclaration 2072', element: Declarations },
  { path: '/admin/documents', name: 'Documents', element: Documents },
  { path: '/admin/settings', name: 'Paramètres', element: Settings },
]

export default routes
