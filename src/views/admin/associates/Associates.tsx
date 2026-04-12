import React, { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import AssociateDataService from '../../../services/associate.service'
import OwnerConfigDataService from '../../../services/owner_config.service'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CFormInput, CFormSelect, CFormTextarea,
  CProgress, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilUserFemale } from '@coreui/icons'
import ActionButtons from '../../../components/ActionButtons'
import CrudModal from '../../../components/CrudModal'
import DeleteModal from '../../../components/DeleteModal'
import EntityTableCard from '../../../components/EntityTableCard'
import StatCard from '../../../components/StatCard'
import TableEmptyRow from '../../../components/TableEmptyRow'
import useEntityCrud from '../../../hooks/useEntityCrud'
import { associateFormSchema } from '../../../validation/schemas'
import { FormInputField } from '../../../components/FormFields'
import { RootState, setOwnerProfileType } from '../../../store'

const emptyForm = { civility: 'MR', firstname: '', lastname: '', email: '', phone: '', address: '', shares: '', role: 'Collaborateur' }

const Associates = () => {
  const dispatch = useDispatch()
  const ownerType = useSelector((state: RootState) => state.owner.profileType)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Charger le type de bailleur au montage si nécessaire
    OwnerConfigDataService.get()
      .then((r) => {
        const type = (r.data.owner_profile_type || 'INDIVIDUAL') as 'SCI' | 'PROFESSIONAL' | 'INDIVIDUAL'
        dispatch(setOwnerProfileType(type))
      })
      .catch(() => {
        dispatch(setOwnerProfileType('INDIVIDUAL'))
      })
      .finally(() => setLoading(false))
  }, [dispatch])

  // Métodes d'aide pour les labels et rôles
  const getPageTitle = () => {
    if (ownerType === 'SCI') return 'Co-bailleurs'
    if (ownerType === 'PROFESSIONAL') return 'Co-propriétaires'
    return 'Collaborateurs'
  }

  const getStatLabels = () => {
    if (ownerType === 'SCI') return { item: 'Co-bailleurs', referent: 'Gérant' }
    if (ownerType === 'PROFESSIONAL') return { item: 'Co-propriétaires', referent: 'Responsable' }
    return { item: 'Collaborateurs', referent: 'Référent' }
  }

  const getRoleOptions = () => {
    if (ownerType === 'SCI') {
      return [
        { value: 'Co-bailleur', label: 'Co-bailleur' },
        { value: 'Bailleur principal', label: 'Bailleur principal' },
        { value: 'Gérant', label: 'Gérant' },
        { value: 'Gérant associé', label: 'Gérant associé' },
      ]
    }
    if (ownerType === 'PROFESSIONAL') {
      return [
        { value: 'Co-propriétaire', label: 'Co-propriétaire' },
        { value: 'Responsable', label: 'Responsable' },
        { value: 'Collaborateur', label: 'Collaborateur' },
      ]
    }
    return [
      { value: 'Collaborateur', label: 'Collaborateur' },
    ]
  }

  const getDefaultRole = () => {
    if (ownerType === 'SCI') return 'Co-bailleur'
    if (ownerType === 'PROFESSIONAL') return 'Co-propriétaire'
    return 'Collaborateur'
  }

  // Construire emptyForm dynamiquement selon le type de bailleur
  const formConfig = {
    ...emptyForm,
    role: getDefaultRole(),
  }

  const {
    items: associates,
    modalVisible, setModalVisible,
    deleteModal, setDeleteModal,
    editing, toDelete, form,
    formErrors,
    handleChange, openCreate, openEdit, openDelete,
    handleSubmit, handleDelete,
  } = useEntityCrud({
    service: AssociateDataService,
    emptyForm: formConfig,
    validationSchema: associateFormSchema,
    toForm: (a) => ({ civility: a.civility || 'MR', firstname: a.firstname || '', lastname: a.lastname || '', email: a.email || '', phone: a.phone || '', address: a.address || '', shares: a.shares || '', role: a.role || getDefaultRole() }),
  })

  const totalShares = associates.reduce((s, a) => s + parseFloat(a.shares || 0), 0)
  const gerant = associates.find((a) => a.role === 'Gérant' || a.role === 'Gérant associé' || a.role === 'Responsable')

  if (loading) return <div className="sk-spinner sk-spinner-pulse" />

  const labels = getStatLabels()
  const pageTitle = getPageTitle()

  // Pour les bailleurs individuels, afficher une info
  if (ownerType === 'INDIVIDUAL') {
    return (
      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <strong>{pageTitle}</strong>
            </CCardHeader>
            <CCardBody>
              <CAlert color="info">
                <strong>Bailleur particulier</strong><br />
                Pour un bailleur particulier, vous pouvez ajouter des collaborateurs associés à votre gestion locative. 
                Cette fonctionnalité est essentiellement destinée aux co-propriétaires et aux structures professionnelles.
              </CAlert>
              <EntityTableCard title={`Liste des ${pageTitle.toLowerCase()}`} onAdd={openCreate}>
                <CTable align="middle" hover responsive bordered>
                  <CTableHead color="light">
                    <CTableRow>
                      <CTableHeaderCell>Nom</CTableHeaderCell><CTableHeaderCell>Rôle</CTableHeaderCell>
                      <CTableHeaderCell>Email</CTableHeaderCell><CTableHeaderCell>Parts</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {associates.length === 0 ? (
                      <TableEmptyRow colSpan={5} message={`Aucun ${pageTitle.toLowerCase()}`} />
                    ) : associates.map((a) => (
                      <CTableRow key={a.id}>
                        <CTableDataCell>{a.civility || ''} {a.firstname} {a.lastname}</CTableDataCell>
                        <CTableDataCell><CBadge color="secondary">{a.role}</CBadge></CTableDataCell>
                        <CTableDataCell>{a.email || '-'}</CTableDataCell>
                        <CTableDataCell><strong>{parseFloat(a.shares || 0).toFixed(2)} %</strong></CTableDataCell>
                        <CTableDataCell className="text-end">
                          <ActionButtons onEdit={() => openEdit(a)} onDelete={() => openDelete(a)} />
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </EntityTableCard>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    )
  }

  return (
    <>
      <CRow className="mb-4 text-center">
        <StatCard value={associates.length} label={labels.item} color="primary" />
        <StatCard
          value={`${totalShares.toFixed(2)} %`}
          label={`Parts${totalShares !== 100 ? ' ⚠ ≠ 100%' : ''}`}
          color={totalShares === 100 ? 'success' : 'warning'}
        />
        <StatCard
          value={gerant ? `${gerant.civility || ''} ${gerant.lastname}` : '—'}
          label={labels.referent}
          color="info"
        />
      </CRow>

      <CRow>
        <CCol md={5}>
          <CCard className="mb-4">
            <CCardHeader><strong>Répartition des quotes-parts</strong></CCardHeader>
            <CCardBody>
              {associates.length === 0 ? <p className="text-muted">Aucun {pageTitle.toLowerCase()}</p> : associates.map((a) => (
                <div key={a.id} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>
                      <CIcon icon={a.civility === 'MR' ? cilUser : cilUserFemale} className="me-1" />
                      {a.civility || ''} {a.firstname} {a.lastname}
                      {(a.role === 'Gérant' || a.role === 'Gérant associé' || a.role === 'Responsable') && 
                        <CBadge color="primary" className="ms-2">{ownerType === 'SCI' ? 'Gérant' : 'Responsable'}</CBadge>}
                    </span>
                    <strong>{parseFloat(a.shares || 0).toFixed(2)} %</strong>
                  </div>
                  <CProgress value={parseFloat(a.shares || 0)} color="primary" />
                </div>
              ))}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={7}>
          <EntityTableCard title={`Liste des ${pageTitle.toLowerCase()}`} onAdd={openCreate}>
            <CTable align="middle" hover responsive bordered>
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Nom</CTableHeaderCell><CTableHeaderCell>Rôle</CTableHeaderCell>
                  <CTableHeaderCell>Email</CTableHeaderCell><CTableHeaderCell>Parts</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {associates.length === 0 ? (
                  <TableEmptyRow colSpan={5} message={`Aucun ${pageTitle.toLowerCase()}`} />
                ) : associates.map((a) => (
                  <CTableRow key={a.id}>
                    <CTableDataCell>{a.civility || ''} {a.firstname} {a.lastname}</CTableDataCell>
                    <CTableDataCell><CBadge color={a.role === 'Gérant' || a.role === 'Gérant associé' || a.role === 'Responsable' ? 'primary' : 'secondary'}>{a.role}</CBadge></CTableDataCell>
                    <CTableDataCell>{a.email || '-'}</CTableDataCell>
                    <CTableDataCell><strong>{parseFloat(a.shares || 0).toFixed(2)} %</strong></CTableDataCell>
                    <CTableDataCell className="text-end">
                      <ActionButtons onEdit={() => openEdit(a)} onDelete={() => openDelete(a)} />
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </EntityTableCard>
        </CCol>
      </CRow>

      <CrudModal
        visible={modalVisible}
        editing={editing}
        addTitle={`Nouveau ${labels.item.toLowerCase().slice(0, -1)}`}
        editTitle={`Modifier le ${labels.item.toLowerCase().slice(0, -1)}`}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      >
        <CCol md={4}><CFormSelect label="Civilité" name="civility" value={form.civility} onChange={handleChange}><option value="MR">M.</option><option value="MME">Mme</option></CFormSelect></CCol>
        <CCol md={4}><FormInputField type="text" name="firstname" label="Prénom" value={form.firstname} onChange={handleChange} /></CCol>
        <CCol md={4}><FormInputField type="text" name="lastname" label="Nom" value={form.lastname} onChange={handleChange} required error={formErrors.lastname} /></CCol>
        <CCol md={6}><FormInputField type="email" name="email" label="Email" value={form.email} onChange={handleChange} error={formErrors.email} /></CCol>
        <CCol md={6}><CFormInput type="text" name="phone" label="Téléphone" value={form.phone} onChange={handleChange} /></CCol>
        <CCol md={8}><CFormTextarea label="Adresse" name="address" rows={2} value={form.address} onChange={handleChange} /></CCol>
        <CCol md={4}><FormInputField type="number" name="shares" label="Quote-part (%)" min="0" max="100" step="0.01" value={form.shares} onChange={handleChange} required error={formErrors.shares} /></CCol>
        <CCol md={12}>
          <CFormSelect label="Rôle" name="role" value={form.role} onChange={handleChange}>
            {getRoleOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </CFormSelect>
        </CCol>
      </CrudModal>

      <DeleteModal
        visible={deleteModal}
        itemLabel={toDelete ? `${toDelete.civility || ''} ${toDelete.firstname} ${toDelete.lastname}`.trim() : undefined}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}

export default Associates
