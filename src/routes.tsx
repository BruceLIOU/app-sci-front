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
const Visits = React.lazy(() => import('./views/admin/visits/Visits'))
const Profile = React.lazy(() => import('./views/admin/profile/Profile'))
const Users = React.lazy(() => import('./views/admin/users/Users'))

interface Route {
  path: string
  name: string
  element?: React.ComponentType
  exact?: boolean
  roles?: ('admin' | 'viewer')[]
}

const routes: Route[] = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Tableau de bord', element: Dashboard },
  { path: '/admin', name: 'Administration', element: Properties, exact: true },
  { path: '/admin/properties', name: 'Mes biens', element: Properties },
  { path: '/admin/tenants', name: 'Mes locataires', element: Tenants },
  { path: '/admin/leases', name: 'Baux', element: Leases },
  { path: '/admin/inspections', name: 'États des lieux', element: Inspections },
  { path: '/admin/payments', name: 'Paiements', element: Payments, roles: ['admin'] },
  { path: '/admin/quittances', name: 'Quittances', element: Quittances, roles: ['admin'] },
  { path: '/admin/charges', name: 'Charges', element: Charges, roles: ['admin'] },
  { path: '/admin/comptability', name: 'Comptabilité', element: Comptability, roles: ['admin'] },
  { path: '/admin/associates', name: 'Associés', element: Associates },
  { path: '/admin/declarations', name: 'Déclaration 2072', element: Declarations, roles: ['admin'] },
  { path: '/admin/documents', name: 'Documents', element: Documents },
  { path: '/admin/settings', name: 'Paramètres', element: Settings },
  { path: '/admin/visits', name: 'Calendrier des visites', element: Visits },
  { path: '/admin/profile', name: 'Mon profil', element: Profile },
  { path: '/admin/users', name: 'Utilisateurs', element: Users, roles: ['admin'] },
]

export default routes
