import React, { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import LeaseDataService from '../services/lease.service'
import TenantDataService from '../services/tenant.service'
import DocumentDataService from '../services/document.service'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CForm, CFormInput, CFormSelect, CFormTextarea, CRow, CCol, CSpinner, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSave, cilDescription } from '@coreui/icons'

interface PropertyLeaseModalProps {
  visible: boolean
  property: any            // objet bien complet
  lease?: any              // défini si modification d'un bail existant
  tenants: any[]           // liste de locataires
  onClose: () => void
  onSaved: () => void      // callback après sauvegarde (pour rafraîchir)
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

const typeLabel: Record<string, string> = { nu: 'Location nue', meublé: 'Meublé', commercial: 'Commercial' }

function generateLeasePdf(lease: any, property: any, tenant: any | null): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  // En-tête
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('CONTRAT DE BAIL', pageW / 2, 25, { align: 'center' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(typeLabel[lease.type] || lease.type, pageW / 2, 33, { align: 'center' })

  doc.setLineWidth(0.5)
  doc.line(15, 37, pageW - 15, 37)

  let y = 45

  const section = (title: string) => {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 15, y)
    y += 2
    doc.setLineWidth(0.2)
    doc.line(15, y, pageW - 15, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
  }

  const field = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label} :`, 15, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value || '—', 70, y)
    y += 7
  }

  // Bien loué
  section('BIEN LOUÉ')
  field('Type', property.type || '')
  field('Adresse', `${property.address || ''}, ${property.zipcode || ''} ${property.city || ''}`)
  if (property.area) field('Superficie', `${property.area} m²`)
  if (property.pieces) field('Nombre de pièces', String(property.pieces))
  y += 3

  // Locataire
  section('LOCATAIRE')
  if (tenant) {
    field('Civilité', tenant.civility || '')
    field('Prénom', tenant.firstname || '')
    field('Nom', tenant.lastname || '')
    if (tenant.email) field('Email', tenant.email)
    if (tenant.mobile) field('Téléphone', tenant.mobile)
  } else {
    doc.setFont('helvetica', 'italic')
    doc.text('Aucun locataire désigné', 15, y)
    y += 7
  }
  y += 3

  // Conditions financières
  section('CONDITIONS FINANCIÈRES')
  field('Loyer hors charges', `${parseFloat(lease.rent_amount || 0).toFixed(2)} €`)
  field('Charges', `${parseFloat(lease.charges_amount || 0).toFixed(2)} €`)
  field('Loyer charges comprises', `${(parseFloat(lease.rent_amount || 0) + parseFloat(lease.charges_amount || 0)).toFixed(2)} €`)
  field('Dépôt de garantie', `${parseFloat(lease.deposit_amount || 0).toFixed(2)} €`)
  y += 3

  // Durée du bail
  section('DURÉE DU BAIL')
  field('Date de début', lease.start_date || '')
  field('Date de fin', lease.end_date || 'En cours (bail à durée indéterminée)')
  field('Préavis', `${lease.notice_period || 3} mois`)
  field('Statut', lease.status === 'active' ? 'Actif' : lease.status === 'expired' ? 'Expiré' : 'Résilié')
  y += 3

  // Notes
  if (lease.notes) {
    section('NOTES')
    const lines = doc.splitTextToSize(lease.notes, pageW - 30)
    doc.text(lines, 15, y)
    y += lines.length * 6 + 3
  }

  // Signatures
  if (y > 230) doc.addPage()
  y = Math.max(y, 220)
  doc.setLineWidth(0.3)
  doc.line(15, y, 85, y)
  doc.line(pageW / 2 + 10, y, pageW - 15, y)
  y += 5
  doc.setFontSize(9)
  doc.text('Signature du bailleur', 15, y)
  doc.text('Signature du locataire', pageW / 2 + 10, y)

  // Pied de page
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(`Document généré le ${today}`, pageW / 2, 290, { align: 'center' })

  return doc.output('blob')
}

const PropertyLeaseModal: React.FC<PropertyLeaseModalProps> = ({
  visible, property, lease, tenants, onClose, onSaved,
}) => {
  const [form, setForm] = useState(emptyForm(property?.id ?? ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
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
    } else {
      setForm(emptyForm(property?.id ?? ''))
    }
    setError(null)
    setSuccess(null)
  }, [visible, lease, property])

  const handleChange = (e: React.ChangeEvent<any>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))

      let savedLease: any
      if (lease) {
        await LeaseDataService.update(lease.id, fd)
        savedLease = { ...lease, ...form }
      } else {
        const res = await LeaseDataService.create(fd)
        savedLease = res.data
      }

      // Générer le PDF
      const tenant = tenants.find((t) => String(t.id) === String(form.tenant_id)) ?? null
      const pdfBlob = generateLeasePdf(savedLease, property, tenant)

      const tenantName = tenant ? `${tenant.lastname}_${tenant.firstname}` : 'sans-locataire'
      const fileName = `bail_${property.city}_${tenantName}_${form.start_date}.pdf`
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_.-]/g, '')
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })

      const leaseId = savedLease.id ?? (lease?.id)
      const uploadPromises: Promise<any>[] = []

      // Attacher au bail
      if (leaseId) {
        const fdLease = new FormData()
        fdLease.append('title', `Bail – ${property.city} – ${form.start_date}`)
        fdLease.append('category', 'bail')
        fdLease.append('entity_type', 'lease')
        fdLease.append('entity_id', String(leaseId))
        fdLease.append('notes', `Généré automatiquement`)
        fdLease.append('file', pdfFile)
        uploadPromises.push(DocumentDataService.create(fdLease))
      }

      // Attacher au bien
      const fdProp = new FormData()
      fdProp.append('title', `Bail – ${tenant ? `${tenant.lastname} ${tenant.firstname}` : ''} – ${form.start_date}`)
      fdProp.append('category', 'bail')
      fdProp.append('entity_type', 'property')
      fdProp.append('entity_id', String(property.id))
      fdProp.append('notes', `Généré automatiquement`)
      fdProp.append('file', pdfFile)
      uploadPromises.push(DocumentDataService.create(fdProp))

      await Promise.all(uploadPromises)

      setSuccess('Bail enregistré et PDF généré avec succès.')
      setTimeout(() => { onSaved(); onClose() }, 1500)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  if (!property) return null

  return (
    <CModal size="lg" alignment="center" visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>
          {lease ? 'Modifier le bail' : 'Créer un bail'} — {property.type}, {property.city}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error && <CAlert color="danger">{error}</CAlert>}
        {success && <CAlert color="success">{success}</CAlert>}
        <CForm className="row g-3" onSubmit={handleSubmit} id="lease-form">
          <CCol md={12}>
            <CFormInput
              label="Bien loué (non modifiable)"
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
              <option value="nu">Location nue</option>
              <option value="meublé">Meublé</option>
              <option value="commercial">Commercial</option>
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
            <CFormTextarea label="Notes" name="notes" rows={3} value={form.notes} onChange={handleChange} />
          </CCol>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose} disabled={saving}>Annuler</CButton>
        <CButton color="primary" type="submit" form="lease-form" disabled={saving}>
          {saving ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={saving ? cilDescription : cilSave} className="me-1" />}
          {lease ? 'Enregistrer' : 'Créer le bail et générer le PDF'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default PropertyLeaseModal
