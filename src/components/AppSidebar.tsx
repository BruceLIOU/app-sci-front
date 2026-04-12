import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { CSidebar, CSidebarBrand, CSidebarNav, CSidebarToggler } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { AppSidebarNav } from './AppSidebarNav'
import { sygnet } from 'src/assets/brand/sygnet'
import { set } from '../store'
import { RootState } from '../store'
import SimpleBar from 'simplebar-react'
import 'simplebar/dist/simplebar.min.css'
import navigation from '../_nav'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state: RootState) => state.ui.sidebarUnfoldable)
  const sidebarShow = useSelector((state: RootState) => state.ui.sidebarShow)
  const userRole = useSelector((state: RootState) => state.auth.user?.role ?? 'viewer')

  const filteredNav = navigation.filter(
    (item) => !item.roles || item.roles.includes(userRole as any),
  )

  return (
    <CSidebar
      className="app-sidebar"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible: boolean) => dispatch(set({ sidebarShow: visible }))}
    >
      <CSidebarBrand className="d-none d-md-flex app-sidebar-brand">
        <span className="app-sidebar-brand-mark">
          <CIcon className="sidebar-brand-narrow" icon={sygnet} height={24} />
        </span>
        <span className="app-sidebar-brand-text">
          <span className="app-sidebar-brand-title">Pilotage Immo</span>
          <span className="app-sidebar-brand-subtitle">Gestion locative, finance et documents</span>
        </span>
      </CSidebarBrand>
      <CSidebarNav>
        <SimpleBar>
          <AppSidebarNav items={filteredNav} />
        </SimpleBar>
      </CSidebarNav>
      <CSidebarToggler
        className="d-none d-lg-flex"
        onClick={() => dispatch(set({ sidebarUnfoldable: !unfoldable }))}
      />
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
