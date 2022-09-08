import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilHome,
  cilContact,
  cilEuro,
  cilSpeedometer,
  cilChartLine,
  cilFolder,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Tableau de bord',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    // badge: {
    //   color: 'info',
    //   text: 'NEW',
    // },
  },
  {
    component: CNavTitle,
    name: 'Administration',
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
    name: 'Mes paiements',
    to: '/admin/payments',
    icon: <CIcon icon={cilEuro} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Ma comptabilité',
    to: '/admin/comptability',
    icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Mes documents',
    to: '/admin/documents',
    icon: <CIcon icon={cilFolder} customClassName="nav-icon" />,
  },
]

export default _nav
