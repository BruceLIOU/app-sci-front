import React, { useEffect, useState } from 'react'
import DocumentDataService from '../services/document.service'
import {
  CButton, CSpinner, CBadge, CFormInput, CFormSelect, CFormTextarea, CRow, CCol,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilTrash, cilPlus, cilX } from '@coreui/icons'

const CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: 'bail', label: 'Bail', color: 'primary' },
  { value: 'etat-des-lieux', label: 'État des lieux', color: 'info' },
  { value: 'quittance', label: 'Quittance', color: 'success' },
  { value: 'assurance', label: 'Assurance', color: 'warning' },
  { value: 'diagnostic', label: 'Diagnostic', color: 'secondary' },
  { value: 'identite', label: 'Identité', color: 'dark' },
  { value: 'justificatif', label: 'Justificatif', color: 'light' },
  { value: 'revenu', label: 'Revenus', color: 'success' },
  { value: 'autre', label: 'Autre', color: 'secondary' },
]

const CATEGORIES_BY_ENTITY: Record<string, string[]> = {
  property: ['bail', 'etat-des-lieux', 'diagnostic', 'assurance', 'autre'],
  tenant: ['identite', 'assurance', 'justificatif', 'revenu', 'autre'],
  lease: ['bail', 'quittance', 'assurance', 'diagnostic', 'autre'],
  inspection: ['etat-des-lieux', 'diagnostic', 'autre'],
}

function formatSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

interface DocumentsSectionProps {
  entityType: 'property' | 'tenant' | 'lease' | 'inspection'
  entityId: number
}

const emptyForm = { title: '', category: '', notes: '' }

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ entityType, entityId }) => {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const allowedCategories = CATEGORIES.filter((c) =>
    (CATEGORIES_BY_ENTITY[entityType] ?? []).includes(c.value),
  )

  const fetchDocs = () => {
    setLoading(true)
    DocumentDataService.getAll({ entity_type: entityType, entity_id: entityId })
      .then((r) => setDocs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (entityId) fetchDocs()
  }, [entityType, entityId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('category', form.category)
    fd.append('notes', form.notes)
    fd.append('entity_type', entityType)
    fd.append('entity_id', String(entityId))
    fd.append('file', file)
    setUploading(true)
    try {
      await DocumentDataService.create(fd)
      setShowForm(false)
      setForm(emptyForm)
      setFile(null)
      fetchDocs()
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce document ?')) return
    setDeleting(id)
    try {
      await DocumentDataService.delete(id)
      setDocs((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  const getCatMeta = (val: string) => CATEGORIES.find((c) => c.value === val)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-semibold text-medium-emphasis small">{docs.length} document{docs.length > 1 ? 's' : ''}</span>
        <CButton
          color="primary"
          size="sm"
          variant="outline"
          onClick={() => {
            setShowForm((v) => !v)
            if (showForm) { setForm(emptyForm); setFile(null) }
          }}
        >
          {showForm ? <><CIcon icon={cilX} className="me-1" />Annuler</> : <><CIcon icon={cilPlus} className="me-1" />Ajouter</>}
        </CButton>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-3 mb-3 bg-light">
          <CRow className="g-2 mb-2">
            <CCol md={6}>
              <CFormInput
                size="sm"
                placeholder="Titre du document"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </CCol>
            <CCol md={6}>
              <CFormSelect
                size="sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                <option value="">-- Catégorie --</option>
                {allowedCategories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={12}>
              <CFormInput
                type="file"
                size="sm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </CCol>
            <CCol md={12}>
              <CFormTextarea
                placeholder="Notes (optionnel)"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </CCol>
          </CRow>
          <div className="d-flex justify-content-end gap-2">
            <CButton
              color="secondary"
              size="sm"
              type="button"
              onClick={() => { setShowForm(false); setForm(emptyForm); setFile(null) }}
            >
              Annuler
            </CButton>
            <CButton color="primary" size="sm" type="submit" disabled={uploading}>
              {uploading ? <CSpinner size="sm" className="me-1" /> : null}
              Enregistrer
            </CButton>
          </div>
        </form>
      )}

      {/* Liste des documents */}
      {loading ? (
        <div className="text-center py-3"><CSpinner size="sm" /></div>
      ) : docs.length === 0 ? (
        <p className="text-medium-emphasis fst-italic small">Aucun document associé.</p>
      ) : (
        <ul className="list-group list-group-flush">
          {docs.map((doc) => {
            const cat = getCatMeta(doc.category)
            return (
              <li key={doc.id} className="list-group-item px-0 py-2 d-flex align-items-center gap-2">
                <div className="flex-grow-1 min-width-0">
                  <div className="fw-semibold small text-truncate">{doc.title}</div>
                  <div className="d-flex align-items-center gap-1 mt-1 flex-wrap">
                    {cat && <CBadge color={cat.color} className="small">{cat.label}</CBadge>}
                    {doc.file_size && <span className="text-muted" style={{ fontSize: '0.75rem' }}>{formatSize(doc.file_size)}</span>}
                    {doc.notes && <span className="text-muted fst-italic" style={{ fontSize: '0.75rem', maxWidth: 200 }} title={doc.notes}>{doc.notes}</span>}
                  </div>
                </div>
                <a
                  href={DocumentDataService.downloadUrl(doc.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-light btn-sm"
                  title="Télécharger"
                >
                  <CIcon icon={cilCloudDownload} />
                </a>
                <CButton
                  color="light"
                  size="sm"
                  title="Supprimer"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                >
                  {deleting === doc.id ? <CSpinner size="sm" /> : <CIcon icon={cilTrash} className="text-danger" />}
                </CButton>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default DocumentsSection
