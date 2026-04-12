import React, { useEffect, useState } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow,
  CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
  CBadge, CButton, CFormInput, CFormSelect, CModal, CModalBody,
  CModalFooter, CModalHeader, CModalTitle, CSpinner, CAlert, CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUserPlus, cilReload, cilTrash, cilEnvelopeClosed } from '@coreui/icons'
import UserDataService from '../../../services/user.service'
import StatCard from '../../../components/StatCard'
import TableEmptyRow from '../../../components/TableEmptyRow'
import DeleteModal from '../../../components/DeleteModal'

interface AppUser {
  id: number
  email: string
  name: string | null
  avatar: string | null
  role: 'admin' | 'viewer'
  status: 'pending' | 'active'
  createdAt: string
}

const roleLabel: Record<string, string> = { admin: 'Admin', viewer: 'Lecteur' }
const roleColor: Record<string, string> = { admin: 'danger', viewer: 'secondary' }
const statusColor: Record<string, string> = { active: 'success', pending: 'warning' }
const statusLabel: Record<string, string> = { active: 'Actif', pending: 'En attente' }

const Users = () => {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState(false)
  const [toDelete, setToDelete] = useState<AppUser | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [globalMsg, setGlobalMsg] = useState<{ type: string; text: string } | null>(null)

  const fetchUsers = () => {
    setLoading(true)
    UserDataService.getAll()
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError(null)
    setInviteSuccess(null)
    const fd = new FormData()
    fd.append('email', inviteEmail)
    fd.append('name', inviteName)
    fd.append('role', inviteRole)
    try {
      await UserDataService.invite(fd)
      setInviteSuccess(`Invitation envoyée à ${inviteEmail}.`)
      setInviteEmail('')
      setInviteName('')
      setInviteRole('viewer')
      fetchUsers()
    } catch (err: any) {
      setInviteError(err.response?.data?.message || "Erreur lors de l'envoi.")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleResend = async (user: AppUser) => {
    setActionLoading(user.id)
    try {
      await UserDataService.resendInvite(user.id)
      setGlobalMsg({ type: 'success', text: `Invitation renvoyée à ${user.email}.` })
    } catch (err: any) {
      setGlobalMsg({ type: 'danger', text: err.response?.data?.message || 'Erreur.' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRoleChange = async (user: AppUser, newRole: string) => {
    const fd = new FormData()
    fd.append('role', newRole)
    setActionLoading(user.id)
    try {
      await UserDataService.updateRole(user.id, fd)
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole as 'admin' | 'viewer' } : u))
    } catch (err: any) {
      setGlobalMsg({ type: 'danger', text: err.response?.data?.message || 'Erreur.' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await UserDataService.delete(toDelete.id)
      setUsers((prev) => prev.filter((u) => u.id !== toDelete.id))
      setDeleteModal(false)
      setToDelete(null)
    } catch (err: any) {
      setGlobalMsg({ type: 'danger', text: err.response?.data?.message || 'Erreur suppression.' })
      setDeleteModal(false)
    }
  }

  const activeCount = users.filter((u) => u.status === 'active').length
  const pendingCount = users.filter((u) => u.status === 'pending').length
  const adminCount = users.filter((u) => u.role === 'admin').length

  return (
    <>
      <CRow className="mb-4">
        <CCol>
          <CCard className="app-page-hero border-0">
            <CCardBody className="p-0 position-relative">
              <div className="app-page-kicker mb-3">Administration</div>
              <h2 className="mb-2 app-display-title">Pilotez les acces utilisateurs</h2>
              <p className="app-page-description mb-4">
                Gere les invitations, les roles et le suivi des comptes dans une interface uniforme avec le reste du back-office.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <span className="app-filter-chip">{users.length} comptes</span>
                <span className="app-filter-chip">{pendingCount} invitations</span>
                <span className="app-filter-chip">{adminCount} administrateurs</span>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4 text-center">
        <StatCard value={users.length} label="Utilisateurs" color="primary" />
        <StatCard value={activeCount} label="Comptes actifs" color="success" />
        <StatCard value={pendingCount} label="Invitations en attente" color="warning" />
        <StatCard value={adminCount} label="Administrateurs" color="danger" />
      </CRow>

      {globalMsg && (
        <CAlert color={globalMsg.type} dismissible onClose={() => setGlobalMsg(null)} className="mb-3">
          {globalMsg.text}
        </CAlert>
      )}

      <CRow>
        <CCol>
          <CCard className="app-panel-card app-table-card">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Gestion des utilisateurs</strong>
              <CButton color="primary" size="sm" className="app-ghost-button" onClick={() => { setInviteModal(true); setInviteSuccess(null); setInviteError(null) }}>
                <CIcon icon={cilUserPlus} className="me-2" />
                Inviter un utilisateur
              </CButton>
            </CCardHeader>
            <CCardBody>
              {loading ? (
                <div className="text-center py-4"><CSpinner /></div>
              ) : (
                <CTable align="middle" hover responsive bordered>
                  <CTableHead color="light">
                    <CTableRow>
                      <CTableHeaderCell>Utilisateur</CTableHeaderCell>
                      <CTableHeaderCell>Email</CTableHeaderCell>
                      <CTableHeaderCell>Statut</CTableHeaderCell>
                      <CTableHeaderCell>Rôle</CTableHeaderCell>
                      <CTableHeaderCell>Invité le</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {users.length === 0 ? (
                      <TableEmptyRow colSpan={6} message="Aucun utilisateur" />
                    ) : users.map((user) => (
                      <CTableRow key={user.id}>
                        <CTableDataCell>
                          <div className="d-flex align-items-center gap-2">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" width={32} height={32} className="rounded-circle" />
                            ) : (
                              <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                                   style={{ width: 32, height: 32, fontSize: 14, flexShrink: 0 }}>
                                {(user.name || user.email)[0].toUpperCase()}
                              </div>
                            )}
                            <span>{user.name || <em className="text-muted">—</em>}</span>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>{user.email}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={statusColor[user.status]}>{statusLabel[user.status]}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormSelect
                            className="app-view-filter"
                            size="sm"
                            value={user.role}
                            onChange={(e) => handleRoleChange(user, e.target.value)}
                            disabled={actionLoading === user.id}
                            style={{ width: 120 }}
                          >
                            <option value="viewer">Lecteur</option>
                            <option value="admin">Admin</option>
                          </CFormSelect>
                        </CTableDataCell>
                        <CTableDataCell>
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <div className="d-flex gap-2 justify-content-end">
                            {user.status === 'pending' && (
                              <CTooltip content="Renvoyer l'invitation">
                                <CButton
                                  color="warning"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResend(user)}
                                  disabled={actionLoading === user.id}
                                >
                                  {actionLoading === user.id
                                    ? <CSpinner size="sm" />
                                    : <CIcon icon={cilEnvelopeClosed} />
                                  }
                                </CButton>
                              </CTooltip>
                            )}
                            <CTooltip content="Supprimer">
                              <CButton
                                color="danger"
                                variant="outline"
                                size="sm"
                                onClick={() => { setToDelete(user); setDeleteModal(true) }}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </CTooltip>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Modal invitation */}
      <CModal visible={inviteModal} onClose={() => setInviteModal(false)}>
        <CModalHeader>
          <CModalTitle>Inviter un utilisateur</CModalTitle>
        </CModalHeader>
        <form onSubmit={handleInvite}>
          <CModalBody>
            {inviteError && (
              <CAlert color="danger" dismissible onClose={() => setInviteError(null)}>{inviteError}</CAlert>
            )}
            {inviteSuccess && (
              <CAlert color="success">{inviteSuccess}</CAlert>
            )}
            <div className="mb-3">
              <label className="form-label">Nom</label>
              <CFormInput
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Prénom Nom"
                disabled={inviteLoading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Adresse email <span className="text-danger">*</span></label>
              <CFormInput
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="utilisateur@exemple.fr"
                required
                disabled={inviteLoading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Rôle</label>
              <CFormSelect
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={inviteLoading}
              >
                <option value="viewer">Lecteur — consultation uniquement</option>
                <option value="admin">Administrateur — accès complet</option>
              </CFormSelect>
            </div>
            <p className="text-muted small mb-0">
              Un email contenant un lien d'activation (valable 24h) sera envoyé à cette adresse.
            </p>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setInviteModal(false)} disabled={inviteLoading}>
              Fermer
            </CButton>
            <CButton color="primary" type="submit" disabled={inviteLoading}>
              {inviteLoading ? <CSpinner size="sm" className="me-2" /> : null}
              Envoyer l'invitation
            </CButton>
          </CModalFooter>
        </form>
      </CModal>

      {/* Modal suppression */}
      <DeleteModal
        visible={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        itemLabel={toDelete ? `l'utilisateur ${toDelete.email}` : ''}
      />
    </>
  )
}

export default Users
