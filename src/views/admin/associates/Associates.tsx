import React, { useState, useEffect } from 'react'
import AssociateDataService from '../../../services/associate.service'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CButton, CModal, CModalHeader,
  CModalTitle, CModalBody, CForm, CFormInput, CFormSelect, CFormTextarea,
  CProgress, CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPen, cilTrash, cilUser, cilUserFemale } from '@coreui/icons'

const emptyForm = { civility: 'MR', firstname: '', lastname: '', email: '', phone: '', address: '', shares: '', role: 'Associé' }

const Associates = () => {
  const [associates, setAssociates] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [toDelete, setToDelete] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)

  const fetchAll = () => AssociateDataService.getAll().then((r) => setAssociates(r.data)).catch(console.error)

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalVisible(true) }
  const openEdit = (a: any) => {
    setEditing(a)
    setForm({ civility: a.civility || 'MR', firstname: a.firstname || '', lastname: a.lastname || '', email: a.email || '', phone: a.phone || '', address: a.address || '', shares: a.shares || '', role: a.role || 'Associé' })
    setModalVisible(true)
  }

  const handleChange = (e: React.ChangeEvent<any>) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    try {
      if (editing) await AssociateDataService.update(editing.id, fd)
      else await AssociateDataService.create(fd)
      setModalVisible(false); fetchAll()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async () => { await AssociateDataService.delete(toDelete.id); setDeleteModal(false); fetchAll() }

  const totalShares = associates.reduce((s, a) => s + parseFloat(a.shares || 0), 0)
  const gerant = associates.find((a) => a.role === 'Gérant')

  return (
    <>
      <CRow className="mb-4">
        <CCol sm={4}><CCard className="text-white bg-primary mb-3"><CCardBody><div className="fs-4 fw-semibold">{associates.length}</div><div>Associés</div></CCardBody></CCard></CCol>
        <CCol sm={4}><CCard className={`text-white mb-3 ${totalShares === 100 ? 'bg-success' : 'bg-warning'}`}><CCardBody><div className="fs-4 fw-semibold">{totalShares.toFixed(2)} %</div><div>Parts {totalShares !== 100 && '⚠ ≠ 100%'}</div></CCardBody></CCard></CCol>
        <CCol sm={4}><CCard className="text-white bg-info mb-3"><CCardBody><div className="fs-5 fw-semibold">{gerant ? `${gerant.civility || ''} ${gerant.lastname}` : '—'}</div><div>Gérant</div></CCardBody></CCard></CCol>
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
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Liste des associés</strong>
              <CButton color="primary" size="sm" onClick={openCreate}><CIcon icon={cilPlus} className="me-1" />Ajouter</CButton>
            </CCardHeader>
            <CCardBody>
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
                    <CTableRow><CTableDataCell colSpan={5} className="text-center text-muted">Aucun associé</CTableDataCell></CTableRow>
                  ) : associates.map((a) => (
                    <CTableRow key={a.id}>
                      <CTableDataCell>{a.civility || ''} {a.firstname} {a.lastname}</CTableDataCell>
                      <CTableDataCell><CBadge color={a.role === 'Gérant' ? 'primary' : 'secondary'}>{a.role}</CBadge></CTableDataCell>
                      <CTableDataCell>{a.email || '-'}</CTableDataCell>
                      <CTableDataCell><strong>{parseFloat(a.shares || 0).toFixed(2)} %</strong></CTableDataCell>
                      <CTableDataCell className="text-end">
                        <CTooltip content="Modifier"><CButton color="light" size="sm" className="me-1" onClick={() => openEdit(a)}><CIcon icon={cilPen} /></CButton></CTooltip>
                        <CTooltip content="Supprimer"><CButton color="light" size="sm" onClick={() => { setToDelete(a); setDeleteModal(true) }}><CIcon icon={cilTrash} /></CButton></CTooltip>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal size="lg" alignment="center" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader><CModalTitle>{editing ? "Modifier l'associé" : 'Nouvel associé'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm className="row g-3" onSubmit={handleSubmit}>
            <CCol md={4}><CFormSelect label="Civilité" name="civility" value={form.civility} onChange={handleChange}><option value="MR">M.</option><option value="MME">Mme</option></CFormSelect></CCol>
            <CCol md={4}><CFormInput type="text" name="firstname" label="Prénom" value={form.firstname} onChange={handleChange} /></CCol>
            <CCol md={4}><CFormInput type="text" name="lastname" label="Nom" value={form.lastname} onChange={handleChange} required /></CCol>
            <CCol md={6}><CFormInput type="email" name="email" label="Email" value={form.email} onChange={handleChange} /></CCol>
            <CCol md={6}><CFormInput type="text" name="phone" label="Téléphone" value={form.phone} onChange={handleChange} /></CCol>
            <CCol md={8}><CFormTextarea label="Adresse" name="address" rows={2} value={form.address} onChange={handleChange} /></CCol>
            <CCol md={4}><CFormInput type="number" name="shares" label="Parts (%)" min="0" max="100" step="0.01" value={form.shares} onChange={handleChange} required /></CCol>
            <CCol md={4}><CFormSelect label="Rôle" name="role" value={form.role} onChange={handleChange}><option value="Associé">Associé</option><option value="Gérant">Gérant</option><option value="Gérant associé">Gérant associé</option></CFormSelect></CCol>
            <hr />
            <CCol md={12} className="d-flex gap-2 justify-content-end">
              <CButton color="secondary" onClick={() => setModalVisible(false)}>Annuler</CButton>
              <CButton color="primary" type="submit">{editing ? 'Modifier' : 'Ajouter'}</CButton>
            </CCol>
          </CForm>
        </CModalBody>
      </CModal>

      <CModal alignment="center" visible={deleteModal} onClose={() => setDeleteModal(false)}>
        <CModalHeader><CModalTitle>Suppression</CModalTitle></CModalHeader>
        <CModalBody>
          <p>Supprimer <strong>{toDelete?.civility} {toDelete?.firstname} {toDelete?.lastname}</strong> ?</p>
          <div className="d-flex gap-2 justify-content-end">
            <CButton color="secondary" onClick={() => setDeleteModal(false)}>Annuler</CButton>
            <CButton color="danger" onClick={handleDelete}>Supprimer</CButton>
          </div>
        </CModalBody>
      </CModal>
    </>
  )
}

export default Associates
