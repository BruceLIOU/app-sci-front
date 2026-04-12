import React from 'react'
import AssociateDataService from '../../../services/associate.service'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CFormInput, CFormSelect, CFormTextarea,
  CProgress,
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

const emptyForm = { civility: 'MR', firstname: '', lastname: '', email: '', phone: '', address: '', shares: '', role: 'Associé' }

const Associates = () => {
  const {
    items: associates,
    modalVisible, setModalVisible,
    deleteModal, setDeleteModal,
    editing, toDelete, form,
    handleChange, openCreate, openEdit, openDelete,
    handleSubmit, handleDelete,
  } = useEntityCrud({
    service: AssociateDataService,
    emptyForm,
    toForm: (a) => ({ civility: a.civility || 'MR', firstname: a.firstname || '', lastname: a.lastname || '', email: a.email || '', phone: a.phone || '', address: a.address || '', shares: a.shares || '', role: a.role || 'Associé' }),
  })

  const totalShares = associates.reduce((s, a) => s + parseFloat(a.shares || 0), 0)
  const gerant = associates.find((a) => a.role === 'Gérant' || a.role === 'Gérant associé')

  return (
    <>
      <CRow className="mb-4 text-center">
        <StatCard value={associates.length} label="Associés" color="primary" />
        <StatCard
          value={`${totalShares.toFixed(2)} %`}
          label={`Parts${totalShares !== 100 ? ' ⚠ ≠ 100%' : ''}`}
          color={totalShares === 100 ? 'success' : 'warning'}
        />
        <StatCard
          value={gerant ? `${gerant.civility || ''} ${gerant.lastname}` : '—'}
          label="Gérant"
          color="info"
        />
      </CRow>

      <CRow>
        <CCol md={5}>
          <CCard className="mb-4">
            <CCardHeader><strong>Répartition des parts</strong></CCardHeader>
            <CCardBody>
              {associates.length === 0 ? <p className="text-muted">Aucun associé</p> : associates.map((a) => (
                <div key={a.id} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>
                      <CIcon icon={a.civility === 'MR' ? cilUser : cilUserFemale} className="me-1" />
                      {a.civility || ''} {a.firstname} {a.lastname}
                      {a.role === 'Gérant' && <CBadge color="primary" className="ms-2">Gérant</CBadge>}
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
          <EntityTableCard title="Liste des associés" onAdd={openCreate}>
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
                  <TableEmptyRow colSpan={5} message="Aucun associé" />
                ) : associates.map((a) => (
                  <CTableRow key={a.id}>
                    <CTableDataCell>{a.civility || ''} {a.firstname} {a.lastname}</CTableDataCell>
                    <CTableDataCell><CBadge color={a.role === 'Gérant' ? 'primary' : 'secondary'}>{a.role}</CBadge></CTableDataCell>
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
        addTitle="Nouvel associé"
        editTitle="Modifier l'associé"
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      >
        <CCol md={4}><CFormSelect label="Civilité" name="civility" value={form.civility} onChange={handleChange}><option value="MR">M.</option><option value="MME">Mme</option></CFormSelect></CCol>
        <CCol md={4}><CFormInput type="text" name="firstname" label="Prénom" value={form.firstname} onChange={handleChange} /></CCol>
        <CCol md={4}><CFormInput type="text" name="lastname" label="Nom" value={form.lastname} onChange={handleChange} required /></CCol>
        <CCol md={6}><CFormInput type="email" name="email" label="Email" value={form.email} onChange={handleChange} /></CCol>
        <CCol md={6}><CFormInput type="text" name="phone" label="Téléphone" value={form.phone} onChange={handleChange} /></CCol>
        <CCol md={8}><CFormTextarea label="Adresse" name="address" rows={2} value={form.address} onChange={handleChange} /></CCol>
        <CCol md={4}><CFormInput type="number" name="shares" label="Parts (%)" min="0" max="100" step="0.01" value={form.shares} onChange={handleChange} required /></CCol>
        <CCol md={4}><CFormSelect label="Rôle" name="role" value={form.role} onChange={handleChange}><option value="Associé">Associé</option><option value="Gérant">Gérant</option><option value="Gérant associé">Gérant associé</option></CFormSelect></CCol>
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
