import React, { useState, useEffect } from 'react'
import DocumentDataService from '../../../services/document.service'
import TenantDataService from '../../../services/tenant.service'
import PropertyDataService from '../../../services/property.service'
import LeaseDataService from '../../../services/lease.service'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CButton, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CModal, CModalHeader, CModalTitle,
  CModalBody, CForm, CFormInput, CFormSelect, CFormLabel, CFormTextarea, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilTrash, cilCloudDownload, cilFolder, cilFile, cilDescription, cilNotes } from '@coreui/icons'
import useIsAdmin from '../../../hooks/useIsAdmin'

const CATEGORIES = [
  { value: 'identite', label: "Carte d'identité / Passeport", color: 'warning' },
  { value: 'bail', label: 'Bail', color: 'primary' },
  { value: 'etat-des-lieux', label: 'État des lieux', color: 'info' },
  { value: 'quittance', label: 'Quittance', color: 'success' },
  { value: 'assurance', label: 'Assurance', color: 'danger' },
  { value: 'justificatif', label: 'Justificatif de domicile', color: 'secondary' },
  { value: 'revenu', label: 'Justificatif de revenus', color: 'secondary' },
  { value: 'diagnostic', label: 'Diagnostic immobilier', color: 'dark' },
  { value: 'autre', label: 'Autre', color: 'light' },
]

const ENTITY_TYPES = [
  { value: 'tenant', label: 'Locataire' },
  { value: 'property', label: 'Bien immobilier' },
  { value: 'lease', label: 'Bail' },
]

const catInfo = (value: string) => CATEGORIES.find((c) => c.value === value) ?? { label: value, color: 'secondary' }

const formatSize = (bytes: number | null) => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const Documents = () => {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [leases, setLeases] = useState<any[]>([])

  const [filterEntityType, setFilterEntityType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const [addModal, setAddModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [toDelete, setToDelete] = useState<any>(null)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState<{
    title: string; category: string; entity_type: string; entity_id: string; notes: string; file: File | null
  }>({ title: '', category: 'identite', entity_type: 'tenant', entity_id: '', notes: '', file: null })

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const res = await DocumentDataService.getAll()
      setDocs(res.data)
    } catch { /* silently */ }
    finally { setLoading(false) }
  }

  const isAdmin = useIsAdmin()

  useEffect(() => {
    fetchDocs()
    TenantDataService.getAll().then((r) => setTenants(r.data)).catch(() => {})
    PropertyDataService.getAll().then((r) => setProperties(r.data)).catch(() => {})
    LeaseDataService.getAll().then((r) => setLeases(r.data)).catch(() => {})
  }, [])

  const entityOptions = () => {
    if (form.entity_type === 'tenant') return tenants.map((t) => ({ value: t.id, label: `${t.civility || ''} ${t.firstname} ${t.lastname}` }))
    if (form.entity_type === 'property') return properties.map((p) => ({ value: p.id, label: `${p.type} – ${p.city}` }))
    if (form.entity_type === 'lease') return leases.map((l) => ({ value: l.id, label: `Bail #${l.id}${l.Property ? ` (${l.Property.city})` : ''}` }))
    return []
  }

  const filteredDocs = docs.filter((d) => {
    if (filterEntityType && d.entity_type !== filterEntityType) return false
    if (filterCategory && d.category !== filterCategory) return false
    return true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.file || !form.title || !form.entity_id) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('category', form.category)
      fd.append('entity_type', form.entity_type)
      fd.append('entity_id', form.entity_id)
      fd.append('notes', form.notes)
      fd.append('file', form.file)
      await DocumentDataService.create(fd)
      setAddModal(false)
      setForm({ title: '', category: 'identite', entity_type: 'tenant', entity_id: '', notes: '', file: null })
      fetchDocs()
    } catch { /* error */ }
    finally { setUploading(false) }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await DocumentDataService.delete(toDelete.id)
      setDeleteModal(false)
      fetchDocs()
    } catch { /* error */ }
  }

  const entityLabel = (doc: any) => {
    if (doc.entity_type === 'tenant') {
      const t = tenants.find((x) => x.id === doc.entity_id)
      return t ? `${t.civility || ''} ${t.firstname} ${t.lastname}`.trim() : `Locataire #${doc.entity_id}`
    }
    if (doc.entity_type === 'property') {
      const p = properties.find((x) => x.id === doc.entity_id)
      return p ? `${p.type} – ${p.city}` : `Bien #${doc.entity_id}`
    }
    if (doc.entity_type === 'lease') return `Bail #${doc.entity_id}`
    return `#${doc.entity_id}`
  }

  return (
    <>
      {/* Stats */}
      <CRow className="mb-4 text-center">
        <CCol sm={4}>
          <CCard className="text-white bg-primary mb-3">
            <CCardBody><div className="fs-4 fw-semibold">{docs.length}</div><div>Documents</div></CCardBody>
          </CCard>
        </CCol>
        <CCol sm={4}>
          <CCard className="text-white bg-warning mb-3">
            <CCardBody><div className="fs-4 fw-semibold">{docs.filter((d) => d.entity_type === 'tenant').length}</div><div>Locataires</div></CCardBody>
          </CCard>
        </CCol>
        <CCol sm={4}>
          <CCard className="text-white bg-info mb-3">
            <CCardBody><div className="fs-4 fw-semibold">{docs.filter((d) => d.entity_type === 'property').length}</div><div>Biens</div></CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <strong>Mes documents</strong>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <CFormSelect size="sm" style={{ width: 170 }} value={filterEntityType} onChange={(e) => setFilterEntityType(e.target.value)}>
              <option value="">Toutes les entités</option>
              {ENTITY_TYPES.map((et) => <option key={et.value} value={et.value}>{et.label}</option>)}
            </CFormSelect>
            <CFormSelect size="sm" style={{ width: 200 }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </CFormSelect>
            {isAdmin && (
              <CButton color="primary" size="sm" onClick={() => setAddModal(true)}>
                <CIcon icon={cilPlus} className="me-1" />Ajouter
              </CButton>
            )}
          </div>
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <div className="text-center py-5"><CSpinner color="primary" /></div>
          ) : (
            <CTable align="middle" hover responsive bordered>
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Document</CTableHeaderCell>
                  <CTableHeaderCell>Catégorie</CTableHeaderCell>
                  <CTableHeaderCell>Entité</CTableHeaderCell>
                  <CTableHeaderCell>Fichier</CTableHeaderCell>
                  <CTableHeaderCell>Taille</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredDocs.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center text-muted py-5">
                      <CIcon icon={cilFolder} size="xl" className="mb-2 d-block mx-auto" />
                      Aucun document
                    </CTableDataCell>
                  </CTableRow>
                ) : filteredDocs.map((doc) => {
                  const cat = catInfo(doc.category)
                  return (
                    <CTableRow key={doc.id}>
                      <CTableDataCell>
                        <CIcon icon={cilFile} className="me-2 text-muted" />
                        <strong>{doc.title}</strong>
                        {doc.notes && <div className="text-muted small">{doc.notes}</div>}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={cat.color as any}>{cat.label}</CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="light" textColor="dark" className="me-1">
                          {ENTITY_TYPES.find((et) => et.value === doc.entity_type)?.label ?? doc.entity_type}
                        </CBadge>
                        {entityLabel(doc)}
                      </CTableDataCell>
                      <CTableDataCell className="text-muted small">{doc.file_name || '—'}</CTableDataCell>
                      <CTableDataCell className="text-muted small">{formatSize(doc.file_size)}</CTableDataCell>
                      <CTableDataCell className="text-muted small">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR') : '—'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex gap-1 justify-content-end flex-nowrap">
                          <CButton
                            color="light" size="sm"
                            href={DocumentDataService.downloadUrl(doc.id)} target="_blank" rel="noreferrer"
                            title="Télécharger / Ouvrir"
                          >
                            <CIcon icon={cilCloudDownload} />
                          </CButton>
                          {isAdmin && (
                            <CButton color="light" size="sm" onClick={() => { setToDelete(doc); setDeleteModal(true) }}>
                              <CIcon icon={cilTrash} />
                            </CButton>
                          )}
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Modale ajout */}
      <CModal size="lg" alignment="center" visible={addModal} onClose={() => setAddModal(false)}>
        <CModalHeader><CModalTitle>Ajouter un document</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm className="row g-3" onSubmit={handleSubmit}>
            <CCol md={12}>
              <CFormLabel>Titre du document <span className="text-danger">*</span></CFormLabel>
              <CFormInput required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex : Bail signé 2025, Carte identité M. Dupont..." />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Catégorie <span className="text-danger">*</span></CFormLabel>
              <CFormSelect value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>Lié à <span className="text-danger">*</span></CFormLabel>
              <CFormSelect value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value, entity_id: '' })}>
                {ENTITY_TYPES.map((et) => <option key={et.value} value={et.value}>{et.label}</option>)}
              </CFormSelect>
            </CCol>
            <CCol md={12}>
              <CFormLabel>
                {ENTITY_TYPES.find((et) => et.value === form.entity_type)?.label ?? 'Entité'} <span className="text-danger">*</span>
              </CFormLabel>
              <CFormSelect required value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })}>
                <option value="">-- Sélectionner --</option>
                {entityOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </CFormSelect>
            </CCol>
            <CCol md={12}>
              <CFormLabel>Fichier <span className="text-danger">*</span></CFormLabel>
              <CFormInput
                required type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setForm({ ...form, file, title: form.title || (file?.name.replace(/\.[^.]+$/, '') ?? '') })
                }}
              />
              <div className="text-muted small mt-1">PDF, Word, images, Excel acceptés</div>
            </CCol>
            <CCol md={12}>
              <CFormLabel>Notes</CFormLabel>
              <CFormTextarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Précisions optionnelles..." />
            </CCol>
            <hr />
            <CCol md={12} className="d-flex gap-2 justify-content-end">
              <CButton color="secondary" onClick={() => setAddModal(false)}>Annuler</CButton>
              <CButton color="primary" type="submit" disabled={uploading}>
                {uploading ? <CSpinner size="sm" className="me-1" /> : null}
                Enregistrer
              </CButton>
            </CCol>
          </CForm>
        </CModalBody>
      </CModal>

      {/* Modale suppression */}
      <CModal alignment="center" visible={deleteModal} onClose={() => setDeleteModal(false)}>
        <CModalHeader><CModalTitle>Suppression</CModalTitle></CModalHeader>
        <CModalBody>
          <p>Supprimer le document <strong>{toDelete?.title}</strong> ? Cette action est irréversible.</p>
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
