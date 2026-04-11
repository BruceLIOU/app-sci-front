import React, { useState, useEffect, useRef } from 'react'
import QuittanceDataService from '../../../services/quittance.service'
import TenantDataService from '../../../services/tenant.service'
import PropertyDataService from '../../../services/property.service'
import LeaseDataService from '../../../services/lease.service'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CButton, CModal, CModalHeader,
  CModalTitle, CModalBody, CForm, CFormInput, CFormSelect, CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPen, cilTrash, cilPrint } from '@coreui/icons'

const Quittances = () => {
  const [quittances, setQuittances] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [leases, setLeases] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [printModal, setPrintModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [printing, setPrinting] = useState<any>(null)
  const [toDelete, setToDelete] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const emptyForm = { tenant_id: '', property_id: '', lease_id: '', payment_id: '', period: '', rent_amount: '', charges_amount: '0', total_amount: '', issue_date: new Date().toISOString().split('T')[0] }
  const [form, setForm] = useState(emptyForm)

  const fetchAll = () => QuittanceDataService.getAll().then((r) => setQuittances(r.data)).catch(console.error)

  useEffect(() => {
    fetchAll()
    TenantDataService.getAll().then((r) => setTenants(r.data))
    PropertyDataService.getAll().then((r) => setProperties(r.data))
    LeaseDataService.getAll().then((r) => setLeases(r.data))
  }, [])

  const rent = parseFloat(form.rent_amount || '0')
  const charges = parseFloat(form.charges_amount || '0')

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalVisible(true) }
  const openEdit = (q: any) => {
    setEditing(q)
    setForm({ tenant_id: q.tenant_id || '', property_id: q.property_id || '', lease_id: q.lease_id || '', payment_id: q.payment_id || '', period: q.period || '', rent_amount: q.rent_amount || '', charges_amount: q.charges_amount || '0', total_amount: q.total_amount || '', issue_date: q.issue_date || '' })
    setModalVisible(true)
  }

  const handleChange = (e: React.ChangeEvent<any>) => {
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
    const fd = new FormData()
    const total = (parseFloat(form.rent_amount || '0') + parseFloat(form.charges_amount || '0')).toFixed(2)
    Object.entries({ ...form, total_amount: total }).forEach(([k, v]) => fd.append(k, v))
    try {
      if (editing) await QuittanceDataService.update(editing.id, fd)
      else await QuittanceDataService.create(fd)
      setModalVisible(false); fetchAll()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async () => { await QuittanceDataService.delete(toDelete.id); setDeleteModal(false); fetchAll() }

  const handlePrint = () => {
    if (!printRef.current) return
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>Quittance ${printing?.number}</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#333}.header{text-align:center;margin-bottom:30px}.section{margin:20px 0;padding:15px;border:1px solid #ddd;border-radius:4px}.row{display:flex;justify-content:space-between;margin:5px 0}.total{font-size:18px;text-align:center;padding:15px;background:#f5f5f5}.signature{margin-top:40px;display:flex;justify-content:space-between}.signature-box{width:45%;border-top:1px solid #333;padding-top:5px;text-align:center;color:#666;font-size:12px}</style></head><body>${content}</body></html>`)
    win.document.close(); win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol sm={4}><CCard className="text-white bg-primary mb-3"><CCardBody><div className="fs-4 fw-semibold">{quittances.length}</div><div>Quittances émises</div></CCardBody></CCard></CCol>
        <CCol sm={4}><CCard className="text-white bg-success mb-3"><CCardBody><div className="fs-4 fw-semibold">{quittances.reduce((s, q) => s + parseFloat(q.total_amount || 0), 0).toFixed(2)} €</div><div>Montant total</div></CCardBody></CCard></CCol>
        <CCol sm={4}><CCard className="text-white bg-info mb-3"><CCardBody><div className="fs-4 fw-semibold">{new Set(quittances.map((q) => q.tenant_id)).size}</div><div>Locataires concernés</div></CCardBody></CCard></CCol>
      </CRow>

      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Quittances de loyer</strong>
          <CButton color="primary" size="sm" onClick={openCreate}><CIcon icon={cilPlus} className="me-1" />Nouvelle quittance</CButton>
        </CCardHeader>
        <CCardBody>
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
                <CTableRow><CTableDataCell colSpan={9} className="text-center text-muted">Aucune quittance émise</CTableDataCell></CTableRow>
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
                    <CTooltip content="Imprimer"><CButton color="light" size="sm" className="me-1" onClick={() => { setPrinting(q); setPrintModal(true) }}><CIcon icon={cilPrint} /></CButton></CTooltip>
                    <CTooltip content="Modifier"><CButton color="light" size="sm" className="me-1" onClick={() => openEdit(q)}><CIcon icon={cilPen} /></CButton></CTooltip>
                    <CTooltip content="Supprimer"><CButton color="light" size="sm" onClick={() => { setToDelete(q); setDeleteModal(true) }}><CIcon icon={cilTrash} /></CButton></CTooltip>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CModal size="xl" alignment="center" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader><CModalTitle>{editing ? 'Modifier la quittance' : 'Nouvelle quittance'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm className="row g-3" onSubmit={handleSubmit}>
            <CCol md={6}><CFormSelect label="Locataire" name="tenant_id" value={form.tenant_id} onChange={handleChange}><option value="">-- Sélectionner --</option>{tenants.map((t) => <option key={t.id} value={t.id}>{`${t.civility || ''} ${t.firstname} ${t.lastname}`}</option>)}</CFormSelect></CCol>
            <CCol md={6}><CFormSelect label="Bien" name="property_id" value={form.property_id} onChange={handleChange}><option value="">-- Sélectionner --</option>{properties.map((p) => <option key={p.id} value={p.id}>{`${p.type} - ${p.address}, ${p.city}`}</option>)}</CFormSelect></CCol>
            <CCol md={6}><CFormSelect label="Bail associé (optionnel)" name="lease_id" value={form.lease_id} onChange={handleChange}><option value="">-- Aucun --</option>{leases.map((l) => <option key={l.id} value={l.id}>{`Bail ${l.Property?.city || ''} — ${l.start_date}`}</option>)}</CFormSelect></CCol>
            <CCol md={6}><CFormInput type="text" name="period" label="Période (ex: Janvier 2024)" value={form.period} onChange={handleChange} required /></CCol>
            <CCol md={4}><CFormInput type="number" name="rent_amount" label="Loyer hors charges (€)" value={form.rent_amount} onChange={handleChange} required /></CCol>
            <CCol md={4}><CFormInput type="number" name="charges_amount" label="Charges (€)" value={form.charges_amount} onChange={handleChange} /></CCol>
            <CCol md={4}><CFormInput type="number" name="total_amount" label="Total (€)" value={(rent + charges).toFixed(2)} readOnly /></CCol>
            <CCol md={6}><CFormInput type="date" name="issue_date" label="Date d'émission" value={form.issue_date} onChange={handleChange} required /></CCol>
            <hr />
            <CCol md={12} className="d-flex gap-2 justify-content-end">
              <CButton color="secondary" onClick={() => setModalVisible(false)}>Annuler</CButton>
              <CButton color="primary" type="submit">{editing ? 'Modifier' : 'Créer'}</CButton>
            </CCol>
          </CForm>
        </CModalBody>
      </CModal>

      {printing && (
        <CModal size="lg" alignment="center" visible={printModal} onClose={() => setPrintModal(false)}>
          <CModalHeader><CModalTitle>Quittance {printing.number}</CModalTitle></CModalHeader>
          <CModalBody>
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
              <CButton color="secondary" onClick={() => setPrintModal(false)}>Fermer</CButton>
              <CButton color="primary" onClick={handlePrint}><CIcon icon={cilPrint} className="me-1" />Imprimer / PDF</CButton>
            </div>
          </CModalBody>
        </CModal>
      )}

      <CModal alignment="center" visible={deleteModal} onClose={() => setDeleteModal(false)}>
        <CModalHeader><CModalTitle>Suppression</CModalTitle></CModalHeader>
        <CModalBody>
          <p>Supprimer la quittance <strong>{toDelete?.number}</strong> ?</p>
          <div className="d-flex gap-2 justify-content-end">
            <CButton color="secondary" onClick={() => setDeleteModal(false)}>Annuler</CButton>
            <CButton color="danger" onClick={handleDelete}>Supprimer</CButton>
          </div>
        </CModalBody>
      </CModal>
    </>
  )
}

export default Quittances
