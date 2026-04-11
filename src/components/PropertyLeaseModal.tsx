import React, { useState, useEffect } from 'react'
import LeaseDataService from '../services/lease.service'
import PdfDataService from '../services/pdf.service'
import DocumentDataService from '../services/document.service'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CForm, CFormInput, CFormSelect, CFormTextarea, CRow, CCol,
  CSpinner, CAlert, CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilDescription, cilExternalLink } from '@coreui/icons'

interface PropertyLeaseModalProps {
  visible: boolean
  property: any
  lease?: any
  tenants: any[]
  onClose: () => void
  onSaved: () => void
}

const emptyForm = (propertyId: number | string) => ({
  property_id: String(propertyId),
  tenant_id: '',
  type: 'nu',
  start_date: '',
  end_date: '',
  rent_amount: '',
  charges_amount: '0',
  deposit_amount: '0',
  notice_period: '3',
  status: 'active',
  notes: '',
})

const PropertyLeaseModal: React.FC<PropertyLeaseModalProps> = ({
  visible, property, lease, tenants, onClose, onSaved,
}) => {
  const [form, setForm] = useState(emptyForm(property?.id ?? ''))
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedLeaseId, setSavedLeaseId] = useState<number | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) { setSavedLeaseId(null); setPdfUrl(null); return }
    setError(null)
    if (lease) {
      setForm({
        property_id: String(property.id),
        tenant_id: lease.tenant_id ? String(lease.tenant_id) : '',
        type: lease.type || 'nu',
        start_date: lease.start_date || '',
        end_date: lease.end_date || '',
        rent_amount: lease.rent_amount || '',
        charges_amount: lease.charges_amount || '0',
        deposit_amount: lease.deposit_amount || '0',
        notice_period: lease.notice_period || '3',
        status: lease.status || 'active',
        notes: lease.notes || '',
      })
      setSavedLeaseId(lease.id)
    } else {
      setForm(emptyForm(property?.id ?? ''))
      setSavedLeaseId(null)
      setPdfUrl(null)
    }
  }, [visible, lease, property])

  const handleChange = (e: React.ChangeEvent<any>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v as string))
      if (lease) {
        await LeaseDataService.update(lease.id, fd)
        setSavedLeaseId(lease.id)
      } else {
        const res = await LeaseDataService.create(fd)
        setSavedLeaseId(res.data.id)
      }
      onSaved()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Erreur lors de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePdf = async () => {
    const leaseId = savedLeaseId ?? lease?.id
    if (!leaseId) { setError('Enregistrez le bail avant de générer le PDF.'); return }
    setGenerating(true)
    setError(null)
    try {
      const res = await PdfDataService.generateBail(leaseId)
      setPdfUrl(DocumentDataService.downloadUrl(res.data.document.id))
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de la génération du PDF.')
    } finally {
      setGenerating(false)
    }
  }

  const loyer = (parseFloat(form.rent_amount || '0') + parseFloat(form.charges_amount || '0')).toFixed(2)

  if (!property) return null

  return (
    <CModal size="lg" alignment="center" visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>
          {lease ? 'Modifier le bail' : 'Créer un bail'} — {property.type}, {property.city}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error && <CAlert color="danger" dismissible onClose={() => setError(null)}>{error}</CAlert>}

        {pdfUrl && (
          <CAlert color="success" className="d-flex align-items-center gap-2">
            <CIcon icon={cilDescription} className="me-1" />
            PDF généré avec succès —{' '}
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="alert-link d-flex align-items-center gap-1">
              Ouvrir le PDF <CIcon icon={cilExternalLink} size="sm" />
            </a>
          </CAlert>
        )}

        <CForm className="row g-3" onSubmit={handleSave} id="lease-form">
          <CCol md={12}>
            <CFormInput
              label="Bien loué"
              value={`${property.type} – ${property.address}, ${property.city}`}
              readOnly
              plainText
            />
          </CCol>
          <CCol md={12}>
            <CFormSelect label="Locataire" name="tenant_id" value={form.tenant_id} onChange={handleChange}>
              <option value="">— Sélectionner un locataire —</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.civility ? `${t.civility} ` : ''}{t.firstname} {t.lastname}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={4}>
            <CFormSelect label="Type de bail" name="type" value={form.type} onChange={handleChange}>
              <option value="nu">Location nue (3 ans)</option>
              <option value="meublé">Meublé (1 an)</option>
              <option value="commercial">Commercial (9 ans)</option>
            </CFormSelect>
          </CCol>
          <CCol md={4}>
            <CFormInput type="date" name="start_date" label="Date de début" value={form.start_date} onChange={handleChange} required />
          </CCol>
          <CCol md={4}>
            <CFormInput type="date" name="end_date" label="Date de fin (optionnel)" value={form.end_date} onChange={handleChange} />
          </CCol>
          <CCol md={4}>
            <CFormInput type="number" name="rent_amount" label="Loyer hors charges (€)" value={form.rent_amount} onChange={handleChange} required min={0} step={0.01} />
          </CCol>
          <CCol md={4}>
            <CFormInput type="number" name="charges_amount" label="Charges (€)" value={form.charges_amount} onChange={handleChange} min={0} step={0.01} />
          </CCol>
          <CCol md={4}>
            <div className="p-2 border rounded bg-light text-center">
              <div className="text-muted small">Loyer CC</div>
              <strong>{loyer} €</strong>
            </div>
          </CCol>
          <CCol md={4}>
            <CFormInput type="number" name="deposit_amount" label="Dépôt de garantie (€)" value={form.deposit_amount} onChange={handleChange} min={0} step={0.01} />
          </CCol>
          <CCol md={4}>
            <CFormInput type="number" name="notice_period" label="Préavis (mois)" value={form.notice_period} onChange={handleChange} min={0} />
          </CCol>
          <CCol md={4}>
            <CFormSelect label="Statut" name="status" value={form.status} onChange={handleChange}>
              <option value="active">Actif</option>
              <option value="expired">Expiré</option>
              <option value="terminated">Résilié</option>
            </CFormSelect>
          </CCol>
          <CCol md={12}>
            <CFormTextarea label="Conditions particulières / Notes" name="notes" rows={3} value={form.notes} onChange={handleChange} />
          </CCol>
        </CForm>
      </CModalBody>
      <CModalFooter className="gap-2">
        <CButton color="secondary" onClick={onClose} disabled={saving || generating}>Annuler</CButton>

        {(savedLeaseId || lease?.id) && (
          <CButton color="info" variant="outline" onClick={handleGeneratePdf} disabled={generating || saving}>
            {generating
              ? <><CSpinner size="sm" className="me-1" />Génération…</>
              : <><CIcon icon={cilDescription} className="me-1" />Générer PDF</>
            }
          </CButton>
        )}

        <CButton color="primary" type="submit" form="lease-form" disabled={saving || generating}>
          {saving
            ? <><CSpinner size="sm" className="me-1" />Enregistrement…</>
            : <><CIcon icon={cilSave} className="me-1" />{lease ? 'Enregistrer' : 'Créer le bail'}</>
          }
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default PropertyLeaseModal
