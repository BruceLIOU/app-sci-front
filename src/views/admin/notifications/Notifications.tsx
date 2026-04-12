import React, { useState, useEffect, useCallback } from 'react'
import NotificationService, { Notification } from '../../../services/notification.service'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody,
  CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
  CBadge, CButton, CButtonGroup, CSpinner, CAlert, CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilEnvelopeClosed, cilTrash, cilCheckAlt } from '@coreui/icons'
import { DateUtils } from 'src/utils/date'

const typeConfig: Record<string, { label: string; icon: string[]; color: string }> = {
  matera_charge: { label: 'Charge MATERA', icon: cilBell, color: 'warning' },
  email_sent:    { label: 'Email envoyé', icon: cilEnvelopeClosed, color: 'info' },
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const fetchAll = useCallback(() => {
    setLoading(true)
    NotificationService.getAll()
      .then((r) => setNotifications(r.data))
      .catch(() => setAlert({ type: 'danger', message: 'Impossible de charger les notifications.' }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkRead = async (id: number) => {
    await NotificationService.markRead(id).catch(() => {})
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setAlert({ type: 'success', message: 'Toutes les notifications ont été marquées comme lues.' })
    } catch {
      setAlert({ type: 'danger', message: 'Erreur lors de la mise à jour.' })
    }
  }

  const handleDelete = async (id: number) => {
    await NotificationService.delete(id).catch(() => {})
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s })
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    try {
      await NotificationService.bulkDelete(ids)
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)))
      setSelectedIds(new Set())
      setAlert({ type: 'success', message: `${ids.length} notification(s) supprimée(s).` })
    } catch {
      setAlert({ type: 'danger', message: 'Erreur lors de la suppression.' })
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const isAllSelected = filtered.length > 0 && filtered.every((n) => selectedIds.has(n.id))
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((n) => n.id)))
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        {alert && (
          <CAlert color={alert.type} dismissible onClose={() => setAlert(null)} className="mb-3">
            {alert.message}
          </CAlert>
        )}

        <CCard>
          <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-3">
              <strong>Notifications</strong>
              {unreadCount > 0 && (
                <CBadge color="success" shape="rounded-pill">{unreadCount} non lues</CBadge>
              )}
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <CButtonGroup size="sm">
                <CButton color={filter === 'all' ? 'primary' : 'outline-primary'} onClick={() => setFilter('all')}>
                  Toutes ({notifications.length})
                </CButton>
                <CButton color={filter === 'unread' ? 'primary' : 'outline-primary'} onClick={() => setFilter('unread')}>
                  Non lues ({unreadCount})
                </CButton>
              </CButtonGroup>
              {unreadCount > 0 && (
                <CButton size="sm" color="outline-success" onClick={handleMarkAllRead}>
                  <CIcon icon={cilCheckAlt} className="me-1" />Tout marquer comme lu
                </CButton>
              )}
              {selectedIds.size > 0 && (
                <CButton size="sm" color="danger" onClick={handleBulkDelete}>
                  <CIcon icon={cilTrash} className="me-1" />Supprimer ({selectedIds.size})
                </CButton>
              )}
            </div>
          </CCardHeader>

          <CCardBody className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <CSpinner color="primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-medium-emphasis py-5">
                {filter === 'unread' ? 'Aucune notification non lue.' : 'Aucune notification.'}
              </div>
            ) : (
              <CTable hover responsive className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 40 }}>
                      <CFormCheck checked={isAllSelected} onChange={toggleSelectAll} />
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 12 }}></CTableHeaderCell>
                    <CTableHeaderCell>Type</CTableHeaderCell>
                    <CTableHeaderCell>Libellé</CTableHeaderCell>
                    <CTableHeaderCell>Détail</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 80 }}></CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filtered.map((n) => {
                    const cfg = typeConfig[n.type] ?? { label: n.type, icon: cilBell, color: 'secondary' }
                    return (
                      <CTableRow
                        key={n.id}
                        style={{ cursor: !n.is_read ? 'pointer' : 'default', fontWeight: !n.is_read ? 600 : 400 }}
                        onClick={() => { if (!n.is_read) handleMarkRead(n.id) }}
                      >
                        <CTableDataCell onClick={(e) => e.stopPropagation()}>
                          <CFormCheck
                            checked={selectedIds.has(n.id)}
                            onChange={() => toggleSelect(n.id)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          {!n.is_read && (
                            <span
                              style={{
                                display: 'inline-block',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: 'var(--cui-success)',
                              }}
                              title="Non lue"
                            />
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={cfg.color} className="d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                            <CIcon icon={cfg.icon} size="sm" />
                            {cfg.label}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>{n.title}</CTableDataCell>
                        <CTableDataCell className="text-medium-emphasis small">{n.message || '—'}</CTableDataCell>
                        <CTableDataCell className="text-medium-emphasis small text-nowrap">
                          {DateUtils.formatWithTime(n.createdAt)}
                        </CTableDataCell>
                        <CTableDataCell onClick={(e) => e.stopPropagation()}>
                          <CButton
                            size="sm"
                            color="ghost-danger"
                            onClick={() => handleDelete(n.id)}
                            title="Supprimer"
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Notifications
