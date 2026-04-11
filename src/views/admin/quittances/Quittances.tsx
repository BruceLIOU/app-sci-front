import React, { useState, useEffect, useRef } from 'react'
import QuittanceDataService from '../../../services/quittance.service'
import TenantDataService from '../../../services/tenant.service'
import PropertyDataService from '../../../services/property.service'
import LeaseDataService from '../../../services/lease.service'
import PdfDataService from '../../../services/pdf.service'
import DocumentDataService from '../../../services/document.service'
import ActionButtons from '../../../components/ActionButtons'
import CrudModal from '../../../components/CrudModal'
import DeleteModal from '../../../components/DeleteModal'
import EntityTableCard from '../../../components/EntityTableCard'
import StatCard from '../../../components/StatCard'
import TableEmptyRow from '../../../components/TableEmptyRow'
import useEntityCrud from '../../../hooks/useEntityCrud'
import {
  CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CButton, CModal, CModalHeader,
  CModalTitle, CModalBody, CFormInput, CFormSelect, CTooltip, CSpinner, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilDescription, cilExternalLink, cilCloudDownload } from '@coreui/icons'

const Quittances = () => {
  const [tenants, setTenants] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [leases, setLeases] = useState<any[]>([])
  const [printModal, setPrintModal] = useState(false)
  const [printing, setPrinting] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [quittanceDocs, setQuittanceDocs] = useState<Record<number, any>>({})

  const emptyForm = { tenant_id: '', property_id: '', lease_id: '', payment_id: '', period: '', rent_amount: '', charges_amount: '0', total_amount: '', issue_date: new Date().toISOString().split('T')[0] }

  const {
    items: quittances,
    modalVisible, setModalVisible,
    deleteModal, setDeleteModal,
    editing, toDelete, form, setForm,
    handleChange, openCreate, openEdit, openDelete,
    handleDelete, fetchAll,
  } = useEntityCrud({
    service: QuittanceDataService,
    emptyForm,
    toForm: (q) => ({ tenant_id: q.tenant_id || '', property_id: q.property_id || '', lease_id: q.lease_id || '', payment_id: q.payment_id || '', period: q.period || '', rent_amount: q.rent_amount || '', charges_amount: q.charges_amount || '0', total_amount: q.total_amount || '', issue_date: q.issue_date || '' }),
  })

  const rent = parseFloat(form.rent_amount || '0')
  const charges = parseFloat(form.charges_amount || '0')

  const fetchDocs = () =>
    DocumentDataService.getAll({ entity_type: 'quittance' })
      .then((r) => {
        const map: Record<number, any> = {}
        r.data.forEach((d: any) => { map[d.entity_id] = d })
        setQuittanceDocs(map)
      })
      .catch(console.error)

  useEffect(() => {
    fetchDocs()
    TenantDataService.getAll().then((r) => setTenants(r.data))
    PropertyDataService.getAll().then((r) => setProperties(r.data))
    LeaseDataService.getAll().then((r) => setLeases(r.data))
  }, [])

  const handleQuittanceChange = (e: React.ChangeEvent<any>) => {
    const updated = { ...form, [e.target.name]: e.target.value }
    if (e.target.name === 'rent_amount' || e.target.name === 'charges_amount') {
      const r = parseFloat(e.target.name === 'rent_amount' ? e.target.value : form.rent_amount) || 0
      const c = parseFloat(e.target.name === 'charges_amount' ? e.target.value : form.charges_amount) || 0
      updated.total_amount = (r + c).toFixed(2)
    }
    setForm(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const total = (parseFloat(form.rent_amount || '0') + parseFloat(form.charges_amount || '0')).toFixed(2)
    const fd = new FormData()
    Object.entries({ ...form, total_amount: total }).forEach(([k, v]) => fd.append(k, v as string))
    try {
      if (editing) await QuittanceDataService.update(editing.id, fd)
      else await QuittanceDataService.create(fd)
      setModalVisible(false); fetchAll()
    } catch (err) { console.error(err) }
  }

  const handleGeneratePdf = async () => {
    if (!printing?.id) return
    setPdfGenerating(true); setPdfUrl(null)
    try {
      const res = await PdfDataService.generateQuittance(printing.id)
      const doc = res.data.document
      setPdfUrl(DocumentDataService.downloadUrl(doc.id))
      setQuittanceDocs((prev) => ({ ...prev, [printing.id]: doc }))
    } catch (e) { console.error(e) }
    finally { setPdfGenerating(false) }
  }

  return (
    <>
      <CRow className="mb-4">
        <StatCard value={quittances.length} label="Quittances émises" color="primary" />
        <StatCard value={`${quittances.reduce((s, q) => s + parseFloat(q.total_amount || 0), 0).toFixed(2)} €`} label="Montant total" color="success" />
        <StatCard value={new Set(quittances.map((q) => q.tenant_id)).size} label="Locataires concernés" color="info" />
      </CRow>

      <EntityTableCard title="Quittances de loyer" addLabel="Nouvelle quittance" onAdd={openCreate}>
        <CTable align="middle" hover responsive bordered>
          <CTableHead color="light">
            <CTableRow>
              <CTableHeaderCell>N°</CTableHeaderCell><CTableHeaderCell>Période</CTableHeaderCell>
              <CTableHeaderCell>Locataire</CTableHeaderCell><CTableHeaderCell>Bien</CTableHeaderCell>
              <CTableHeaderCell>Loyer HC</CTableHeaderCell><CTableHeaderCell>Charges</CTableHeaderCell>
              <CTableHeaderCell>Total</CTableHeaderCell><CTableHeaderCell>Date émission</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {quittances.length === 0 ? (
              <TableEmptyRow colSpan={9} message="Aucune quittance émise" />
            ) : quittances.map((q) => (
              <CTableRow key={q.id}>
                <CTableDataCell><strong>{q.number}</strong></CTableDataCell>
                <CTableDataCell>{q.period}</CTableDataCell>
                <CTableDataCell>{q.Tenant ? `${q.Tenant.civility || ''} ${q.Tenant.lastname}` : '-'}</CTableDataCell>
                <CTableDataCell>{q.Property ? `${q.Property.type} - ${q.Property.city}` : '-'}</CTableDataCell>
                <CTableDataCell>{parseFloat(q.rent_amount || 0).toFixed(2)} €</CTableDataCell>
                <CTableDataCell>{parseFloat(q.charges_amount || 0).toFixed(2)} €</CTableDataCell>
                <CTableDataCell><strong>{parseFloat(q.total_amount || 0).toFixed(2)} €</strong></CTableDataCell>
                <CTableDataCell>{q.issue_date}</CTableDataCell>
                <CTableDataCell className="text-end">
                  <ActionButtons onEdit={() => openEdit(q)} onDelete={() => openDelete(q)}>
                    {quittanceDocs[q.id] ? (
                      <CTooltip content="Télécharger PDF">
                        <a href={DocumentDataService.downloadUrl(quittanceDocs[q.id].id)} target="_blank" rel="noopener noreferrer">
                          <CButton color="light" size="sm" className="me-1"><CIcon icon={cilCloudDownload} /></CButton>
                        </a>
                      </CTooltip>
                    ) : (
                      <CTooltip content="Générer PDF">
                        <CButton color="light" size="sm" className="me-1" onClick={() => { setPrinting(q); setPrintModal(true); setPdfUrl(null) }}>
                          <CIcon icon={cilDescription} />
                        </CButton>
                      </CTooltip>
                    )}
                  </ActionButtons>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </EntityTableCard>

      <CrudModal
        visible={modalVisible}
        editing={editing}
        addTitle="Nouvelle quittance"
        editTitle="Modifier la quittance"
        size="xl"
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        submitLabel={editing ? 'Modifier' : 'Créer'}
      >
        <CCol md={6}><CFormSelect label="Locataire" name="tenant_id" value={form.tenant_id} onChange={handleQuittanceChange}><option value="">-- Sélectionner --</option>{tenants.map((t) => <option key={t.id} value={t.id}>{`${t.civility || ''} ${t.firstname} ${t.lastname}`}</option>)}</CFormSelect></CCol>
        <CCol md={6}><CFormSelect label="Bien" name="property_id" value={form.property_id} onChange={handleQuittanceChange}><option value="">-- Sélectionner --</option>{properties.map((p) => <option key={p.id} value={p.id}>{`${p.type} - ${p.address}, ${p.city}`}</option>)}</CFormSelect></CCol>
        <CCol md={6}><CFormSelect label="Bail associé (optionnel)" name="lease_id" value={form.lease_id} onChange={handleQuittanceChange}><option value="">-- Aucun --</option>{leases.map((l) => <option key={l.id} value={l.id}>{`Bail ${l.Property?.city || ''} — ${l.start_date}`}</option>)}</CFormSelect></CCol>
        <CCol md={6}><CFormInput type="text" name="period" label="Période (ex: Janvier 2024)" value={form.period} onChange={handleQuittanceChange} required /></CCol>
        <CCol md={4}><CFormInput type="number" name="rent_amount" label="Loyer hors charges (€)" value={form.rent_amount} onChange={handleQuittanceChange} required /></CCol>
        <CCol md={4}><CFormInput type="number" name="charges_amount" label="Charges (€)" value={form.charges_amount} onChange={handleQuittanceChange} /></CCol>
        <CCol md={4}><CFormInput type="number" name="total_amount" label="Total (€)" value={(rent + charges).toFixed(2)} readOnly /></CCol>
        <CCol md={6}><CFormInput type="date" name="issue_date" label="Date d'émission" value={form.issue_date} onChange={handleQuittanceChange} required /></CCol>
      </CrudModal>

      {printing && (
        <CModal size="lg" alignment="center" visible={printModal} onClose={() => { setPrintModal(false); setPdfUrl(null) }}>
          <CModalHeader><CModalTitle>Quittance {printing.number}</CModalTitle></CModalHeader>
          <CModalBody>
            {pdfUrl && (
              <CAlert color="success" className="d-flex align-items-center gap-2 mb-3">
                <CIcon icon={cilDescription} className="me-1" />
                PDF généré —{' '}
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="alert-link d-flex align-items-center gap-1">
                  Ouvrir <CIcon icon={cilExternalLink} size="sm" />
                </a>
              </CAlert>
            )}
            <div ref={printRef}>
              <div className="header"><h1>Quittance de loyer</h1><h2>N° {printing.number} — {printing.period}</h2></div>
              <div className="section"><h3>Bailleur (SCI)</h3><div className="row"><span className="label">Société</span><span className="value">SCI</span></div></div>
              <div className="section">
                <h3>Locataire</h3>
                {printing.Tenant && (<>
                  <div className="row"><span className="label">Nom</span><span className="value">{printing.Tenant.civility || ''} {printing.Tenant.firstname} {printing.Tenant.lastname}</span></div>
                  <div className="row"><span className="label">Email</span><span className="value">{printing.Tenant.email}</span></div>
                </>)}
              </div>
              <div className="section">
                <h3>Bien loué</h3>
                {printing.Property && (<>
                  <div className="row"><span className="label">Adresse</span><span className="value">{printing.Property.address}, {printing.Property.zipcode} {printing.Property.city}</span></div>
                  <div className="row"><span className="label">Type</span><span className="value">{printing.Property.type}</span></div>
                </>)}
              </div>
              <div className="section">
                <h3>Détail du paiement</h3>
                <div className="row"><span className="label">Période</span><span className="value">{printing.period}</span></div>
                <div className="row"><span className="label">Loyer hors charges</span><span className="value">{parseFloat(printing.rent_amount).toFixed(2)} €</span></div>
                <div className="row"><span className="label">Charges</span><span className="value">{parseFloat(printing.charges_amount || 0).toFixed(2)} €</span></div>
                <div className="total">Total payé : <strong>{parseFloat(printing.total_amount).toFixed(2)} €</strong></div>
              </div>
              <div className="signature">
                <div className="signature-box">Signature du bailleur</div>
                <div className="signature-box">Signature du locataire</div>
              </div>
            </div>
            <hr />
            <div className="d-flex gap-2 justify-content-end">
              <CButton color="secondary" onClick={() => { setPrintModal(false); setPdfUrl(null) }}>Fermer</CButton>
              <CButton color="primary" onClick={handleGeneratePdf} disabled={pdfGenerating}>
                {pdfGenerating ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilDescription} className="me-1" />}
                Générer PDF
              </CButton>
            </div>
          </CModalBody>
        </CModal>
      )}

      <DeleteModal
        visible={deleteModal}
        itemLabel={toDelete ? `la quittance ${toDelete.number || ''}` : undefined}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}

export default Quittances
