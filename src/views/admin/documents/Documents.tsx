import React, { useState } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CButton, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CModal, CModalHeader, CModalTitle,
  CModalBody, CForm, CFormInput, CFormSelect,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilTrash, cilCloudDownload, cilFolder, cilFile, cilDescription } from '@coreui/icons'

interface Doc { id: number; name: string; type: string; filename: string; size: string; date: string }

const typeIcon: Record<string, any> = { Bail: cilFile, Quittance: cilDescription, Autre: cilFolder }
const typeColor: Record<string, string> = { Bail: 'primary', Quittance: 'info', Autre: 'secondary' }

const Documents = () => {
  const [documents, setDocuments] = useState<Doc[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [toDelete, setToDelete] = useState<Doc | null>(null)
  const [formData, setFormData] = useState<{ name: string; type: string; file: File | null }>({ name: '', type: 'Bail', file: null })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'file' && 'files' in e.target && e.target.files) {
      setFormData({ ...formData, file: e.target.files[0] })
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.file) return
    const newDoc: Doc = {
      id: Date.now(), name: formData.name, type: formData.type,
      filename: formData.file.name, size: (formData.file.size / 1024).toFixed(1) + ' Ko',
      date: new Date().toLocaleDateString('fr-FR'),
    }
    setDocuments([...documents, newDoc])
    setFormData({ name: '', type: 'Bail', file: null })
    setModalVisible(false)
  }

  const handleDelete = () => {
    if (!toDelete) return
    setDocuments(documents.filter((d) => d.id !== toDelete.id))
    setDeleteModal(false)
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol sm={4}><CCard className="text-white bg-primary mb-3"><CCardBody><div className="fs-4 fw-semibold">{documents.length}</div><div>Documents</div></CCardBody></CCard></CCol>
        <CCol sm={4}><CCard className="text-white bg-info mb-3"><CCardBody><div className="fs-4 fw-semibold">{documents.filter((d) => d.type === 'Bail').length}</div><div>Baux</div></CCardBody></CCard></CCol>
        <CCol sm={4}><CCard className="text-white bg-secondary mb-3"><CCardBody><div className="fs-4 fw-semibold">{documents.filter((d) => d.type === 'Quittance').length}</div><div>Quittances</div></CCardBody></CCard></CCol>
      </CRow>

      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Mes documents</strong>
          <CButton color="primary" size="sm" onClick={() => setModalVisible(true)}><CIcon icon={cilPlus} className="me-1" />Ajouter</CButton>
        </CCardHeader>
        <CCardBody>
          <CTable align="middle" hover responsive bordered>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Nom</CTableHeaderCell><CTableHeaderCell>Type</CTableHeaderCell>
                <CTableHeaderCell>Fichier</CTableHeaderCell><CTableHeaderCell>Taille</CTableHeaderCell>
                <CTableHeaderCell>Date</CTableHeaderCell><CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {documents.length === 0 ? (
                <CTableRow><CTableDataCell colSpan={6} className="text-center text-muted py-4"><CIcon icon={cilFolder} size="xl" className="mb-2 d-block mx-auto" />Aucun document enregistré</CTableDataCell></CTableRow>
              ) : documents.map((doc) => (
                <CTableRow key={doc.id}>
                  <CTableDataCell><CIcon icon={typeIcon[doc.type] || cilFile} className="me-2" />{doc.name}</CTableDataCell>
                  <CTableDataCell><CBadge color={typeColor[doc.type] || 'secondary'}>{doc.type}</CBadge></CTableDataCell>
                  <CTableDataCell>{doc.filename}</CTableDataCell>
                  <CTableDataCell>{doc.size}</CTableDataCell>
                  <CTableDataCell>{doc.date}</CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CButton color="light" size="sm" className="me-1" disabled><CIcon icon={cilCloudDownload} /></CButton>
                    <CButton color="light" size="sm" onClick={() => { setToDelete(doc); setDeleteModal(true) }}><CIcon icon={cilTrash} /></CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CModal alignment="center" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader><CModalTitle>Ajouter un document</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm className="row g-3" onSubmit={handleSubmit}>
            <CCol md={12}><CFormInput type="text" name="name" label="Nom du document" value={formData.name} onChange={handleChange} required /></CCol>
            <CCol md={12}><CFormSelect label="Type" name="type" value={formData.type} onChange={handleChange}><option value="Bail">Bail</option><option value="Quittance">Quittance</option><option value="Autre">Autre</option></CFormSelect></CCol>
            <CCol md={12}><CFormInput type="file" name="file" label="Fichier" onChange={handleChange} required /></CCol>
            <hr />
            <CCol md={12} className="d-flex gap-2 justify-content-end">
              <CButton color="secondary" onClick={() => setModalVisible(false)}>Annuler</CButton>
              <CButton color="primary" type="submit">Ajouter</CButton>
            </CCol>
          </CForm>
        </CModalBody>
      </CModal>

      <CModal alignment="center" visible={deleteModal} onClose={() => setDeleteModal(false)}>
        <CModalHeader><CModalTitle>Suppression</CModalTitle></CModalHeader>
        <CModalBody>
          <p>Supprimer le document <strong>{toDelete?.name}</strong> ?</p>
          <div className="d-flex gap-2 justify-content-end">
            <CButton color="secondary" onClick={() => setDeleteModal(false)}>Annuler</CButton>
            <CButton color="danger" onClick={handleDelete}>Supprimer</CButton>
          </div>
        </CModalBody>
      </CModal>
    </>
  )
}

export default Documents
