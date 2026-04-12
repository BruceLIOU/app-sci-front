import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  CContainer, CHeader, CHeaderBrand, CHeaderDivider,
  CHeaderNav, CHeaderToggler, CNavLink, CNavItem, CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilMenu, cilCheckAlt, cilArrowRight, cilEnvelopeOpen } from '@coreui/icons'
import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'
import { logo } from 'src/assets/brand/logo'
import { set } from '../store'
import { RootState } from '../store'
import { useNotifications } from '../hooks/useNotifications'
import { DateUtils } from 'src/utils/date'

const typeColor: Record<string, string> = {
  matera_charge: '#f9a825',
  email_sent: '#0d6efd',
}

const AppHeader = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const sidebarShow = useSelector((state: RootState) => state.ui.sidebarShow)
  const { unreadCount, recentUnread, popoverLoaded, loadUnread, markRead, markAllRead } = useNotifications()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fermer le popover au clic extérieur
  useEffect(() => {
    if (!popoverOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [popoverOpen])

  const handleBellClick = () => {
    if (popoverOpen) {
      setPopoverOpen(false)
      return
    }
    setPopoverOpen(true)
    loadUnread()
  }

  const goToPage = () => {
    setPopoverOpen(false)
    navigate('/admin/notifications')
  }

  return (
    <CHeader position="sticky" className="mb-4">
      <CContainer fluid>
        <CHeaderToggler
          className="ps-1"
          onClick={() => dispatch(set({ sidebarShow: !sidebarShow }))}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderBrand className="mx-auto d-md-none">
          <CIcon icon={logo} height={48} />
        </CHeaderBrand>
        <CHeaderNav className="d-none d-md-flex me-auto"></CHeaderNav>
        <CHeaderNav>
          <CNavItem>
            <div ref={containerRef} style={{ position: 'relative' }}>
              <CNavLink
                style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', padding: '0.4rem 0.6rem' }}
                onClick={handleBellClick}
              >
                <CIcon icon={cilBell} size="lg" />
                {unreadCount > 0 && (
                  <CBadge
                    color="success"
                    shape="rounded-pill"
                    style={{ position: 'absolute', top: 0, right: 0, fontSize: '0.65rem', minWidth: '1.1rem', padding: '0.15rem 0.3rem' }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </CBadge>
                )}
              </CNavLink>

              {popoverOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 340,
                  background: 'var(--cui-body-bg, #fff)',
                  border: '1px solid var(--cui-border-color, #dee2e6)',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 1050,
                  overflow: 'hidden',
                }}>
                  {/* Header popover */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--cui-border-color, #dee2e6)',
                    background: 'var(--cui-tertiary-bg, #f8f9fa)',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                      Notifications non lues
                      {unreadCount > 0 && (
                        <CBadge color="success" shape="rounded-pill" className="ms-2">{unreadCount}</CBadge>
                      )}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--cui-success, #2eb85c)', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Tout marquer comme lu"
                      >
                        <CIcon icon={cilCheckAlt} size="sm" /> Tout lire
                      </button>
                    )}
                  </div>

                  {/* Liste */}
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {!popoverLoaded ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--cui-secondary-color, #6c757d)', fontSize: '0.85rem' }}>
                        Chargement…
                      </div>
                    ) : recentUnread.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--cui-secondary-color, #6c757d)', fontSize: '0.85rem' }}>
                        <CIcon icon={cilEnvelopeOpen} size="lg" style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                        Aucune notification non lue
                      </div>
                    ) : (
                      recentUnread.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--cui-border-color, #dee2e6)',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cui-tertiary-bg, #f8f9fa)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: typeColor[n.type] ?? 'var(--cui-success)',
                            flexShrink: 0,
                            marginTop: 5,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.83rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {n.title}
                            </div>
                            {n.message && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--cui-secondary-color, #6c757d)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {n.message}
                              </div>
                            )}
                            <div style={{ fontSize: '0.72rem', color: 'var(--cui-secondary-color, #6c757d)', marginTop: 3 }}>
                              {DateUtils.formatWithTime(n.createdAt)}
                            </div>
                          </div>
                          <CIcon icon={cilCheckAlt} size="sm" style={{ flexShrink: 0, opacity: 0.4, marginTop: 4 }} title="Marquer comme lu" />
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    onClick={goToPage}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 14px',
                      borderTop: '1px solid var(--cui-border-color, #dee2e6)',
                      cursor: 'pointer',
                      fontSize: '0.83rem',
                      fontWeight: 600,
                      color: 'var(--cui-primary, #321fdb)',
                      background: 'var(--cui-tertiary-bg, #f8f9fa)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cui-secondary-bg, #e9ecef)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--cui-tertiary-bg, #f8f9fa)')}
                  >
                    Voir toutes les notifications <CIcon icon={cilArrowRight} size="sm" />
                  </div>
                </div>
              )}
            </div>
          </CNavItem>
        </CHeaderNav>
        <CHeaderNav className="ms-3">
          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>
      <CHeaderDivider />
      <CContainer fluid>
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
