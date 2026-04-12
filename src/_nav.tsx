import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilHome,
  cilContact,
  cilEuro,
  cilSpeedometer,
  cilChartLine,
  cilFolder,
  cilDescription,
  cilList,
  cilTask,
  cilPeople,
  cilBuilding,
  cilCalendar,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'
import { ComponentType } from 'react'

interface NavItem {
  component: ComponentType<any>
  name: string
  to?: string
  icon?: React.ReactNode
  items?: NavItem[]
  roles?: ('admin' | 'viewer')[]
}

const _nav: NavItem[] = [
  {
    component: CNavItem,
    name: 'Tableau de bord',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Gestion locative',
  },
  {
    component: CNavItem,
    name: 'Mes biens',
    to: '/admin/properties',
    icon: <CIcon icon={cilHome} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Mes locataires',
    to: '/admin/tenants',
    icon: <CIcon icon={cilContact} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Baux',
    to: '/admin/leases',
    icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'États des lieux',
    to: '/admin/inspections',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Calendrier visites',
    to: '/admin/visits',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Finance',
    roles: ['admin'],
  },
  {
    component: CNavItem,
    name: 'Paiements',
    to: '/admin/payments',
    icon: <CIcon icon={cilEuro} customClassName="nav-icon" />,
    roles: ['admin'],
  },
  {
    component: CNavItem,
    name: 'Quittances',
    to: '/admin/quittances',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
    roles: ['admin'],
  },
  {
    component: CNavItem,
    name: 'Charges',
    to: '/admin/charges',
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
    roles: ['admin'],
  },
  {
    component: CNavItem,
    name: 'Comptabilité',
    to: '/admin/comptability',
    icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />,
    roles: ['admin'],
  },
  {
    component: CNavTitle,
    name: 'SCI',
  },
  {
    component: CNavItem,
    name: 'Associés',
    to: '/admin/associates',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Déclaration 2072',
    to: '/admin/declarations',
    icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />,
    roles: ['admin'],
  },
  {
    component: CNavItem,
    name: 'Documents',
    to: '/admin/documents',
    icon: <CIcon icon={cilFolder} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Application',
    roles: ['admin'],
  },
  {
    component: CNavItem,
    name: 'Utilisateurs',
    to: '/admin/users',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    roles: ['admin'],
  },
]

export default _nav
