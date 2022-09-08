import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Properties = React.lazy(() => import('./views/admin/properties/Properties'))
const CreateProperty = React.lazy(() => import('./views/admin/forms/CreateForms'))
const Tenants = React.lazy(() => import('./views/admin/tenants/Tenants'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/admin', name: 'Administration', element: Properties, exact: true },
  { path: '/admin/properties', name: 'Mes biens', element: Properties },
  { path: '/admin/properties/create', name: 'Ajouter un bien', element: CreateProperty },
  { path: '/admin/tenants', name: 'Mes locataires', element: Tenants },
]

export default routes
