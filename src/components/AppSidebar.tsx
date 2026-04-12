import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { CSidebar, CSidebarBrand, CSidebarNav, CSidebarToggler } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { AppSidebarNav } from './AppSidebarNav'
import { sygnet } from 'src/assets/brand/sygnet'
import { set, setOwnerProfileType } from '../store'
import { RootState } from '../store'
import SimpleBar from 'simplebar-react'
import 'simplebar/dist/simplebar.min.css'
import navigation from '../_nav'
import OwnerConfigDataService from '../services/owner_config.service'
import { useMemo } from 'react'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state: RootState) => state.ui.sidebarUnfoldable)
  const sidebarShow = useSelector((state: RootState) => state.ui.sidebarShow)
  const userRole = useSelector((state: RootState) => state.auth.user?.role ?? 'viewer')
  const ownerType = useSelector((state: RootState) => state.owner.profileType)

  useEffect(() => {
    // Charger le type de bailleur au montage
    OwnerConfigDataService.get()
      .then((r) => {
        const type = (r.data.owner_profile_type || 'INDIVIDUAL') as 'SCI' | 'PROFESSIONAL' | 'INDIVIDUAL'
        dispatch(setOwnerProfileType(type))
      })
      .catch(() => {
        dispatch(setOwnerProfileType('INDIVIDUAL'))
      })
  }, [dispatch])

  const getAssociatesLabel = () => {
    if (ownerType === 'SCI') return 'Co-bailleurs'
    if (ownerType === 'PROFESSIONAL') return 'Co-propriétaires'
    return 'Collaborateurs'
  }

  const isSciProfile = ownerType === 'SCI'

  const filteredNav = useMemo(
    () => navigation.map((item) => {
      // Adapter le label pour la page co-bailleurs
      if (item.to === '/admin/associates') {
        return { ...item, name: getAssociatesLabel() }
      }
      if (item.name === 'Co-bailleurs') {
        return { ...item, name: getAssociatesLabel() }
      }
      return item
    }).filter((item) => {
      if (item.to === '/admin/declarations' && !isSciProfile) return false
      if (item.name === 'Déclaration 2072' && !isSciProfile) return false
      return !item.roles || item.roles.includes(userRole as any)
    }),
    [isSciProfile, userRole, ownerType],
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
