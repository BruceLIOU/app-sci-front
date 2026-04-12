import React, { useState, useEffect } from 'react'
import PaymentDataService from '../../../services/payment.service'
import ChargeDataService from '../../../services/charge.service'
import AssociateDataService from '../../../services/associate.service'
import PropertyDataService from '../../../services/property.service'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CButton, CFormSelect, CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload } from '@coreui/icons'
import http from '../../../utils/http-common'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

const Declarations = () => {
  const [year, setYear] = useState(currentYear)
  const [payments, setPayments] = useState<any[]>([])
  const [charges, setCharges] = useState<any[]>([])
  const [associates, setAssociates] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)

  const handleGeneratePdf = async () => {
    setGenerating(true)
    try {
      const response = await http.get(`/pdf/declaration-2072?year=${year}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `declaration_2072_S_${year}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Erreur lors de la génération du PDF.')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    PaymentDataService.getAll().then((r) => setPayments(r.data))
    ChargeDataService.getAll().then((r) => setCharges(r.data))
    AssociateDataService.getAll().then((r) => setAssociates(r.data))
    PropertyDataService.getAll().then((r) => setProperties(r.data))
  }, [])

  const yearPayments = payments.filter((p) => {
    if (p.status !== 'paid') return false
    const d = p.paid_date || p.due_date || ''
    return d.startsWith(String(year))
  })

  const totalRevenues = yearPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)

  const totalCharges = charges.reduce((s, c) => {
    const a = parseFloat(c.amount || 0)
    const d = c.date || ''
    if (d.startsWith(String(year))) return s + a
    if (c.frequency === 'mensuel') return s + a * 12
    if (c.frequency === 'trimestriel') return s + a * 4
    if (c.frequency === 'annuel') return s + a
    return s
  }, 0)

  const netResult = totalRevenues - totalCharges

  const byProperty = properties.map((p) => {
    const rev = yearPayments.filter((pay) => pay.property_id === p.id).reduce((s, pay) => s + parseFloat(pay.amount || 0), 0)
    const chg = charges.reduce((s, c) => {
      if (c.property_id !== p.id) return s
      const a = parseFloat(c.amount || 0)
      const d = c.date || ''
      if (d.startsWith(String(year))) return s + a
      if (c.frequency === 'mensuel') return s + a * 12
      if (c.frequency === 'trimestriel') return s + a * 4
      if (c.frequency === 'annuel') return s + a
      return s
    }, 0)
    return { ...p, revenues: rev, charges: chg, net: rev - chg }
  })

  const byAssociate = associates.map((a) => ({ ...a, share: parseFloat(a.shares || 0), allocated: (netResult * parseFloat(a.shares || 0)) / 100 }))

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div className="d-flex align-items-center gap-3">
          <h5 className="mb-0">Déclaration annuelle — Formulaire 2072</h5>
          <CFormSelect size="sm" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 120 }}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </CFormSelect>
        </div>
        <CButton color="primary" size="sm" onClick={handleGeneratePdf} disabled={generating}>
          <CIcon icon={cilCloudDownload} className="me-1" />
          {generating ? 'Génération…' : 'Générer le PDF 2072-S'}
        </CButton>
      </div>

      <CRow className="mb-4 text-center">
        <CCol sm={4}><CCard className="text-white bg-success mb-3"><CCardBody><div className="fs-4 fw-semibold">{totalRevenues.toFixed(2)} €</div><div>Revenus locatifs {year}</div></CCardBody></CCard></CCol>
        <CCol sm={4}><CCard className="text-white bg-danger mb-3"><CCardBody><div className="fs-4 fw-semibold">{totalCharges.toFixed(2)} €</div><div>Charges déductibles {year}</div></CCardBody></CCard></CCol>
        <CCol sm={4}><CCard className={`text-white mb-3 ${netResult >= 0 ? 'bg-info' : 'bg-warning'}`}><CCardBody><div className="fs-4 fw-semibold">{netResult.toFixed(2)} €</div><div>Résultat net {netResult >= 0 ? '(bénéfice)' : '(déficit)'}</div></CCardBody></CCard></CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol md={6}>
          <CCard className="mb-4">
            <CCardHeader><strong>Revenus par bien — {year}</strong></CCardHeader>
            <CCardBody>
              <CTable bordered small align="middle">
                <CTableHead color="light"><CTableRow><CTableHeaderCell>Bien</CTableHeaderCell><CTableHeaderCell>Revenus</CTableHeaderCell><CTableHeaderCell>Charges</CTableHeaderCell><CTableHeaderCell>Net</CTableHeaderCell></CTableRow></CTableHead>
                <CTableBody>
                  {byProperty.length === 0 ? <CTableRow><CTableDataCell colSpan={4} className="text-center text-muted">Aucun bien</CTableDataCell></CTableRow>
                  : byProperty.map((p) => (
                    <CTableRow key={p.id}>
                      <CTableDataCell>{p.type} - {p.city}</CTableDataCell>
                      <CTableDataCell>{p.revenues.toFixed(2)} €</CTableDataCell>
                      <CTableDataCell>{p.charges.toFixed(2)} €</CTableDataCell>
                      <CTableDataCell><strong className={p.net >= 0 ? 'text-success' : 'text-danger'}>{p.net.toFixed(2)} €</strong></CTableDataCell>
                    </CTableRow>
                  ))}
                  <CTableRow className="fw-bold">
                    <CTableDataCell>TOTAL</CTableDataCell>
                    <CTableDataCell>{totalRevenues.toFixed(2)} €</CTableDataCell>
                    <CTableDataCell>{totalCharges.toFixed(2)} €</CTableDataCell>
                    <CTableDataCell className={netResult >= 0 ? 'text-success' : 'text-danger'}>{netResult.toFixed(2)} €</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6}>
          <CCard className="mb-4">
            <CCardHeader><strong>Quote-part par associé — {year}</strong></CCardHeader>
            <CCardBody>
              <CTable bordered small align="middle">
                <CTableHead color="light"><CTableRow><CTableHeaderCell>Associé</CTableHeaderCell><CTableHeaderCell>Rôle</CTableHeaderCell><CTableHeaderCell>Parts</CTableHeaderCell><CTableHeaderCell>Quote-part</CTableHeaderCell></CTableRow></CTableHead>
                <CTableBody>
                  {byAssociate.length === 0 ? <CTableRow><CTableDataCell colSpan={4} className="text-center text-muted">Aucun associé</CTableDataCell></CTableRow>
                  : byAssociate.map((a) => (
                    <CTableRow key={a.id}>
                      <CTableDataCell>{a.civility || ''} {a.firstname} {a.lastname}</CTableDataCell>
                      <CTableDataCell><CBadge color={a.role === 'Gérant' ? 'primary' : 'secondary'}>{a.role}</CBadge></CTableDataCell>
                      <CTableDataCell>{a.share.toFixed(2)} %</CTableDataCell>
                      <CTableDataCell><strong className={a.allocated >= 0 ? 'text-success' : 'text-danger'}>{a.allocated.toFixed(2)} €</strong></CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard className="mb-4">
        <CCardHeader><strong>Détail des loyers perçus — {year}</strong></CCardHeader>
        <CCardBody>
          <CTable bordered small align="middle" hover>
            <CTableHead color="light"><CTableRow><CTableHeaderCell>Locataire</CTableHeaderCell><CTableHeaderCell>Bien</CTableHeaderCell><CTableHeaderCell>Période</CTableHeaderCell><CTableHeaderCell>Date paiement</CTableHeaderCell><CTableHeaderCell>Montant</CTableHeaderCell></CTableRow></CTableHead>
            <CTableBody>
              {yearPayments.length === 0 ? <CTableRow><CTableDataCell colSpan={5} className="text-center text-muted">Aucun loyer perçu pour {year}</CTableDataCell></CTableRow>
              : yearPayments.map((p) => (
                <CTableRow key={p.id}>
                  <CTableDataCell>{p.Tenant ? `${p.Tenant.firstname} ${p.Tenant.lastname}` : '-'}</CTableDataCell>
                  <CTableDataCell>{p.Property ? `${p.Property.type} - ${p.Property.city}` : '-'}</CTableDataCell>
                  <CTableDataCell>{p.month || '-'}</CTableDataCell>
                  <CTableDataCell>{p.paid_date || '-'}</CTableDataCell>
                  <CTableDataCell>{parseFloat(p.amount || 0).toFixed(2)} €</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader><strong>Détail des charges déductibles — {year}</strong></CCardHeader>
        <CCardBody>
          <CTable bordered small align="middle" hover>
            <CTableHead color="light"><CTableRow><CTableHeaderCell>Type</CTableHeaderCell><CTableHeaderCell>Description</CTableHeaderCell><CTableHeaderCell>Bien</CTableHeaderCell><CTableHeaderCell>Fréquence</CTableHeaderCell><CTableHeaderCell>Montant annualisé</CTableHeaderCell></CTableRow></CTableHead>
            <CTableBody>
              {charges.length === 0 ? <CTableRow><CTableDataCell colSpan={5} className="text-center text-muted">Aucune charge</CTableDataCell></CTableRow>
              : charges.map((c) => {
                const a = parseFloat(c.amount || 0)
                const annual = c.frequency === 'mensuel' ? a * 12 : c.frequency === 'trimestriel' ? a * 4 : a
                return (
                  <CTableRow key={c.id}>
                    <CTableDataCell>{c.type}</CTableDataCell>
                    <CTableDataCell>{c.description || '-'}</CTableDataCell>
                    <CTableDataCell>{c.Property ? `${c.Property.type} - ${c.Property.city}` : 'Général'}</CTableDataCell>
                    <CTableDataCell>{c.frequency}</CTableDataCell>
                    <CTableDataCell>{annual.toFixed(2)} €</CTableDataCell>
                  </CTableRow>
                )
              })}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default Declarations
