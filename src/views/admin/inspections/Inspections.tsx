import React, { useState, useEffect } from 'react'
import InspectionDataService from '../../../services/inspection.service'
import TenantDataService from '../../../services/tenant.service'
import PropertyDataService from '../../../services/property.service'
import LeaseDataService from '../../../services/lease.service'
import DocumentsSection from '../../../components/DocumentsSection'
import PdfDataService from '../../../services/pdf.service'
import DocumentDataService from '../../../services/document.service'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CButton, CModal, CModalHeader,
  CModalTitle, CModalBody, CForm, CFormInput, CFormSelect, CFormTextarea, CTooltip,
  CSpinner, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPen, cilTrash, cilInfo, cilMinus, cilDescription, cilExternalLink } from '@coreui/icons'
import { DateUtils } from 'src/utils/date'

const typeLabel: Record<string, string> = { entree: 'Entrée', sortie: 'Sortie' }
const typeColor: Record<string, string> = { entree: 'success', sortie: 'danger' }
const statusLabel: Record<string, string> = { pending: 'En attente', completed: 'Complété' }
const statusColor: Record<string, string> = { pending: 'warning', completed: 'success' }
const conditionOptions = ['Très bon état', 'Bon état', 'État moyen', 'Mauvais état', 'À rénover']
const emptyRoom = { name: '', condition: 'Bon état', notes: '' }
const emptyForm = { property_id: '', tenant_id: '', lease_id: '', type: 'entree', date: new Date().toISOString().split('T')[0], status: 'pending', general_notes: '' }

const Inspections = () => {
  const [inspections, setInspections] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [leases, setLeases] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [viewing, setViewing] = useState<any>(null)
  const [toDelete, setToDelete] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [rooms, setRooms] = useState<any[]>([])

  const fetchAll = () => InspectionDataService.getAll().then((r) => setInspections(r.data)).catch(console.error)

  useEffect(() => {
    fetchAll()
    TenantDataService.getAll().then((r) => setTenants(r.data))
    PropertyDataService.getAll().then((r) => setProperties(r.data))
    LeaseDataService.getAll().then((r) => setLeases(r.data))
  }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setRooms([]); setModalVisible(true) }
  const openEdit = (i: any) => {
    setEditing(i)
    setForm({ property_id: i.property_id || '', tenant_id: i.tenant_id || '', lease_id: i.lease_id || '', type: i.type, date: i.date, status: i.status, general_notes: i.general_notes || '' })
    try { setRooms(i.rooms ? JSON.parse(i.rooms) : []) } catch { setRooms([]) }
    setModalVisible(true)
  }

  const handleChange = (e: React.ChangeEvent<any>) => setForm({ ...form, [e.target.name]: e.target.value })
  const addRoom = () => setRooms([...rooms, { ...emptyRoom }])
  const removeRoom = (idx: number) => setRooms(rooms.filter((_, i) => i !== idx))
  const updateRoom = (idx: number, field: string, value: string) => {
    const updated = [...rooms]; updated[idx] = { ...updated[idx], [field]: value }; setRooms(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.append('rooms', JSON.stringify(rooms))
    try {
      if (editing) await InspectionDataService.update(editing.id, fd)
      else await InspectionDataService.create(fd)
      setModalVisible(false); fetchAll()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async () => { await InspectionDataService.delete(toDelete.id); setDeleteModal(false); fetchAll() }

  const openView = (i: any) => {
    const copy = { ...i }
    try { copy._rooms = i.rooms ? JSON.parse(i.rooms) : [] } catch { copy._rooms = [] }
    setViewing(copy); setViewModal(true); setPdfUrl(null)
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol sm={4}><CCard className="text-white bg-success mb-3"><CCardBody><div className="fs-4 fw-semibold">{inspections.filter((i) => i.type === 'entree').length}</div><div>États d&apos;entrée</div></CCardBody></CCard></CCol>
        <CCol sm={4}><CCard className="text-white bg-danger mb-3"><CCardBody><div className="fs-4 fw-semibold">{inspections.filter((i) => i.type === 'sortie').length}</div><div>États de sortie</div></CCardBody></CCard></CCol>
        <CCol sm={4}><CCard className="text-white bg-warning mb-3"><CCardBody><div className="fs-4 fw-semibold">{inspections.filter((i) => i.status === 'pending').length}</div><div>En attente</div></CCardBody></CCard></CCol>
      </CRow>

      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>États des lieux</strong>
          <CButton color="primary" size="sm" onClick={openCreate}><CIcon icon={cilPlus} className="me-1" />Nouveau</CButton>
        </CCardHeader>
        <CCardBody>
          <CTable align="middle" hover responsive bordered>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Type</CTableHeaderCell><CTableHeaderCell>Bien</CTableHeaderCell>
                <CTableHeaderCell>Locataire</CTableHeaderCell><CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell>Pièces vérifiées</CTableHeaderCell><CTableHeaderCell>Statut</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {inspections.length === 0 ? (
                <CTableRow><CTableDataCell colSpan={7} className="text-center text-muted">Aucun état des lieux</CTableDataCell></CTableRow>
              ) : inspections.map((i) => {
                let roomCount = 0
                try { roomCount = i.rooms ? JSON.parse(i.rooms).length : 0 } catch { roomCount = 0 }
                return (
                  <CTableRow key={i.id}>
                    <CTableDataCell><CBadge color={typeColor[i.type]}>{typeLabel[i.type]}</CBadge></CTableDataCell>
                    <CTableDataCell>{i.Property ? `${i.Property.type} - ${i.Property.city}` : '-'}</CTableDataCell>
                    <CTableDataCell>{i.Tenant ? `${i.Tenant.civility || ''} ${i.Tenant.lastname}` : '-'}</CTableDataCell>
                    <CTableDataCell>{DateUtils.formatShort(i.date)}</CTableDataCell>
                    <CTableDataCell>{roomCount} pièce{roomCount > 1 ? 's' : ''}</CTableDataCell>
                    <CTableDataCell><CBadge color={statusColor[i.status]}>{statusLabel[i.status]}</CBadge></CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CTooltip content="Voir détails"><CButton color="light" size="sm" className="me-1" onClick={() => openView(i)}><CIcon icon={cilInfo} /></CButton></CTooltip>
                      <CTooltip content="Modifier"><CButton color="light" size="sm" className="me-1" onClick={() => openEdit(i)}><CIcon icon={cilPen} /></CButton></CTooltip>
                      <CTooltip content="Supprimer"><CButton color="light" size="sm" onClick={() => { setToDelete(i); setDeleteModal(true) }}><CIcon icon={cilTrash} /></CButton></CTooltip>
                    </CTableDataCell>
                  </CTableRow>
                )
              })}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CModal size="xl" alignment="center" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader><CModalTitle>{editing ? "Modifier l'état des lieux" : 'Nouvel état des lieux'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm className="row g-3" onSubmit={handleSubmit}>
            <CCol md={6}><CFormSelect label="Bien" name="property_id" value={form.property_id} onChange={handleChange} required><option value="">-- Sélectionner --</option>{properties.map((p) => <option key={p.id} value={p.id}>{`${p.type} - ${p.address}, ${p.city}`}</option>)}</CFormSelect></CCol>
            <CCol md={6}><CFormSelect label="Locataire" name="tenant_id" value={form.tenant_id} onChange={handleChange}><option value="">-- Sélectionner --</option>{tenants.map((t) => <option key={t.id} value={t.id}>{`${t.civility || ''} ${t.firstname} ${t.lastname}`}</option>)}</CFormSelect></CCol>
            <CCol md={4}><CFormSelect label="Type" name="type" value={form.type} onChange={handleChange}><option value="entree">État d'entrée</option><option value="sortie">État de sortie</option></CFormSelect></CCol>
            <CCol md={4}><CFormInput type="date" name="date" label="Date" value={DateUtils.formatShort(form.date)} onChange={handleChange} required /></CCol>
            <CCol md={4}><CFormSelect label="Statut" name="status" value={form.status} onChange={handleChange}><option value="pending">En attente</option><option value="completed">Complété</option></CFormSelect></CCol>
            <CCol md={12}><CFormTextarea label="Observations générales" name="general_notes" rows={2} value={form.general_notes} onChange={handleChange} /></CCol>
            <CCol md={12}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Pièces</strong>
                <CButton color="outline-primary" size="sm" type="button" onClick={addRoom}><CIcon icon={cilPlus} className="me-1" />Ajouter une pièce</CButton>
              </div>
              {rooms.map((room, idx) => (
                <CRow key={idx} className="g-2 mb-2 align-items-end">
                  <CCol md={3}><CFormInput placeholder="Pièce (ex: Salon)" value={room.name} onChange={(e) => updateRoom(idx, 'name', e.target.value)} /></CCol>
                  <CCol md={3}><CFormSelect value={room.condition} onChange={(e) => updateRoom(idx, 'condition', e.target.value)}>{conditionOptions.map((c) => <option key={c} value={c}>{c}</option>)}</CFormSelect></CCol>
                  <CCol md={5}><CFormInput placeholder="Observations" value={room.notes} onChange={(e) => updateRoom(idx, 'notes', e.target.value)} /></CCol>
                  <CCol md={1}><CButton color="danger" size="sm" type="button" onClick={() => removeRoom(idx)}><CIcon icon={cilMinus} /></CButton></CCol>
                </CRow>
              ))}
              {rooms.length === 0 && <div className="text-muted small">Aucune pièce ajoutée</div>}
            </CCol>
            <hr />
            <CCol md={12} className="d-flex gap-2 justify-content-end">
              <CButton color="secondary" onClick={() => setModalVisible(false)}>Annuler</CButton>
              <CButton color="primary" type="submit">{editing ? 'Modifier' : 'Créer'}</CButton>
            </CCol>
          </CForm>
        </CModalBody>
      </CModal>

      {viewing && (
        <CModal size="lg" alignment="center" visible={viewModal} onClose={() => { setViewModal(false); setPdfUrl(null) }}>
          <CModalHeader>
            <CModalTitle>
              <CBadge color={typeColor[viewing.type]} className="me-2">{typeLabel[viewing.type]}</CBadge>
              {viewing.Property ? `${viewing.Property.type} - ${viewing.Property.city}` : 'État des lieux'}
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow className="g-3 mb-3">
              <CCol sm={6}><div className="text-muted small">Locataire</div><div className="fw-semibold">{viewing.Tenant ? `${viewing.Tenant.civility || ''} ${viewing.Tenant.firstname} ${viewing.Tenant.lastname}` : '-'}</div></CCol>
              <CCol sm={3}><div className="text-muted small">Date</div><div className="fw-semibold">{DateUtils.formatShort(viewing.date)}</div></CCol>
              <CCol sm={3}><div className="text-muted small">Statut</div><CBadge color={statusColor[viewing.status]}>{statusLabel[viewing.status]}</CBadge></CCol>
            {viewing.general_notes && <CCol sm={12}><div className="text-muted small">Observations générales</div><div>{viewing.general_notes}</div></CCol>}
            </CRow>
            {viewing._rooms && viewing._rooms.length > 0 && (
              <>
                <strong>Pièces</strong>
                <CTable bordered small className="mt-2">
                  <CTableHead color="light"><CTableRow><CTableHeaderCell>Pièce</CTableHeaderCell><CTableHeaderCell>État</CTableHeaderCell><CTableHeaderCell>Observations</CTableHeaderCell></CTableRow></CTableHead>
                  <CTableBody>
                    {viewing._rooms.map((r: any, i: number) => (
                      <CTableRow key={i}>
                        <CTableDataCell>{r.name}</CTableDataCell>
                        <CTableDataCell><CBadge color={r.condition === 'Très bon état' || r.condition === 'Bon état' ? 'success' : r.condition === 'État moyen' ? 'warning' : 'danger'}>{r.condition}</CBadge></CTableDataCell>
                        <CTableDataCell>{r.notes || '-'}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}
            <hr />
            <strong className="d-block mb-2">Documents</strong>
            <DocumentsSection entityType="inspection" entityId={viewing.id} />
            <hr />
            {pdfUrl && (
              <CAlert color="success" className="d-flex align-items-center gap-2 mb-3">
                <CIcon icon={cilDescription} className="me-1" />
                PDF généré —{' '}
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="alert-link d-flex align-items-center gap-1">
                  Ouvrir <CIcon icon={cilExternalLink} size="sm" />
                </a>
              </CAlert>
            )}
            <div className="d-flex justify-content-end gap-2">
              <CButton color="info" variant="outline" disabled={pdfGenerating} onClick={async () => {
                setPdfGenerating(true)
                try { const r = await PdfDataService.generateEtatDesLieux(viewing.id); setPdfUrl(DocumentDataService.downloadUrl(r.data.document.id)) }
                catch (e: any) { console.error(e) }
                finally { setPdfGenerating(false) }
              }}>
                {pdfGenerating ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilDescription} className="me-1" />}
                Générer PDF
              </CButton>
              <CButton color="primary" onClick={() => setViewModal(false)}>Fermer</CButton>
            </div>
          </CModalBody>
        </CModal>
      )}

      <CModal alignment="center" visible={deleteModal} onClose={() => setDeleteModal(false)}>
        <CModalHeader><CModalTitle>Suppression</CModalTitle></CModalHeader>
        <CModalBody>
          <p>Supprimer cet état des lieux du <strong>{toDelete?.date}</strong> ?</p>
          <div className="d-flex gap-2 justify-content-end">
            <CButton color="secondary" onClick={() => setDeleteModal(false)}>Annuler</CButton>
            <CButton color="danger" onClick={handleDelete}>Supprimer</CButton>
          </div>
        </CModalBody>
      </CModal>
    </>
  )
}

export default Inspections
