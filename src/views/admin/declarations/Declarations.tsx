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
import { DateUtils } from 'src/utils/date'
import StatCard from '../../../components/StatCard'
import TableEmptyRow from '../../../components/TableEmptyRow'

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

  const yearCharges = charges.filter((c) => (c.date || '').startsWith(String(year)))

  const totalCharges = yearCharges.reduce((s, c) => s + parseFloat(c.amount || 0), 0)

  const netResult = totalRevenues - totalCharges

  const byProperty = properties.map((p) => {
    const rev = yearPayments.filter((pay) => pay.property_id === p.id).reduce((s, pay) => s + parseFloat(pay.amount || 0), 0)
    const chg = yearCharges
      .filter((c) => c.property_id === p.id)
      .reduce((s, c) => s + parseFloat(c.amount || 0), 0)
    return { ...p, revenues: rev, charges: chg, net: rev - chg }
  })

  const byAssociate = associates.map((a) => ({ ...a, share: parseFloat(a.shares || 0), allocated: (netResult * parseFloat(a.shares || 0)) / 100 }))

  return (
    <>
      <CRow className="mb-4 g-3 no-print">
        <CCol lg={8}>
          <CCard className="app-page-hero h-100 border-0">
            <CCardBody className="p-0 position-relative">
              <div className="app-page-kicker mb-3">Declaration fiscale</div>
              <h2 className="mb-2 app-display-title">Preparation du formulaire 2072 simplifiee</h2>
              <p className="app-page-description mb-4">
                Controlez vos revenus, charges et quote-parts puis exportez la declaration annuelle au format PDF.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <span className="app-filter-chip">Exercice {year}</span>
                <span className="app-filter-chip">{yearPayments.length} loyers percus</span>
                <span className="app-filter-chip">{yearCharges.length} charges deduites</span>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={4}>
          <CCard className="app-panel-card h-100 border-0">
            <CCardBody>
              <div className="text-uppercase fw-semibold mb-2" style={{ fontSize: '0.74rem', letterSpacing: '0.08em', color: 'var(--app-accent)' }}>
                Parametres
              </div>
              <h5 className="mb-3">Annee de declaration</h5>
              <CFormSelect className="app-filter-select mb-3" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </CFormSelect>
              <CButton color="primary" className="app-ghost-button w-100" onClick={handleGeneratePdf} disabled={generating}>
                <CIcon icon={cilCloudDownload} className="me-1" />
                {generating ? 'Generation…' : 'Generer le PDF 2072-S'}
              </CButton>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4 text-center">
        <StatCard value={`${totalRevenues.toFixed(2)} €`} label={`Revenus locatifs ${year}`} color="success" sm={4} />
        <StatCard value={`${totalCharges.toFixed(2)} €`} label={`Charges deductibles ${year}`} color="danger" sm={4} />
        <StatCard value={`${netResult.toFixed(2)} €`} label={`Resultat net ${netResult >= 0 ? '(benefice)' : '(deficit)'}`} color={netResult >= 0 ? 'info' : 'warning'} sm={4} />
      </CRow>

      <CRow className="mb-4">
        <CCol md={6}>
          <CCard className="mb-4 app-panel-card app-table-card">
            <CCardHeader><strong>Revenus par bien — {year}</strong></CCardHeader>
            <CCardBody>
              <CTable bordered align="middle" responsive hover>
                <CTableHead color="light"><CTableRow><CTableHeaderCell>Bien</CTableHeaderCell><CTableHeaderCell>Revenus</CTableHeaderCell><CTableHeaderCell>Charges</CTableHeaderCell><CTableHeaderCell>Net</CTableHeaderCell></CTableRow></CTableHead>
                <CTableBody>
                  {byProperty.length === 0 ? (
                    <TableEmptyRow colSpan={4} message="Aucun bien" />
                  ) : byProperty.map((p) => (
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
          <CCard className="mb-4 app-panel-card app-table-card">
            <CCardHeader><strong>Quote-part par co-bailleur — {year}</strong></CCardHeader>
            <CCardBody>
              <CTable bordered align="middle" responsive hover>
                <CTableHead color="light"><CTableRow><CTableHeaderCell>Co-bailleur</CTableHeaderCell><CTableHeaderCell>Role</CTableHeaderCell><CTableHeaderCell>Parts</CTableHeaderCell><CTableHeaderCell>Quote-part</CTableHeaderCell></CTableRow></CTableHead>
                <CTableBody>
                  {byAssociate.length === 0 ? (
                    <TableEmptyRow colSpan={4} message="Aucun co-bailleur" />
                  ) : byAssociate.map((a) => (
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

      <CCard className="mb-4 app-panel-card app-table-card">
        <CCardHeader><strong>Detail des loyers percus — {year}</strong></CCardHeader>
        <CCardBody>
          <CTable bordered align="middle" hover responsive>
            <CTableHead color="light"><CTableRow><CTableHeaderCell>Locataire</CTableHeaderCell><CTableHeaderCell>Bien</CTableHeaderCell><CTableHeaderCell>Periode</CTableHeaderCell><CTableHeaderCell>Date paiement</CTableHeaderCell><CTableHeaderCell>Montant</CTableHeaderCell></CTableRow></CTableHead>
            <CTableBody>
              {yearPayments.length === 0 ? (
                <TableEmptyRow colSpan={5} message={`Aucun loyer percu pour ${year}`} />
              ) : yearPayments.map((p) => (
                <CTableRow key={p.id}>
                  <CTableDataCell>{p.Tenant ? `${p.Tenant.firstname} ${p.Tenant.lastname}` : '-'}</CTableDataCell>
                  <CTableDataCell>{p.Property ? `${p.Property.type} - ${p.Property.city}` : '-'}</CTableDataCell>
                  <CTableDataCell>{p.month || '-'}</CTableDataCell>
                  <CTableDataCell>{DateUtils.formatShort(p.paid_date) || '-'}</CTableDataCell>
                  <CTableDataCell>{parseFloat(p.amount || 0).toFixed(2)} €</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CCard className="app-panel-card app-table-card">
        <CCardHeader><strong>Detail des charges deductibles — {year}</strong></CCardHeader>
        <CCardBody>
          <CTable bordered align="middle" hover responsive>
            <CTableHead color="light"><CTableRow><CTableHeaderCell>Type</CTableHeaderCell><CTableHeaderCell>Description</CTableHeaderCell><CTableHeaderCell>Bien</CTableHeaderCell><CTableHeaderCell>Frequence</CTableHeaderCell><CTableHeaderCell>Montant annualise</CTableHeaderCell></CTableRow></CTableHead>
            <CTableBody>
              {yearCharges.length === 0 ? (
                <TableEmptyRow colSpan={5} message={`Aucune charge deductible pour ${year}`} />
              ) : yearCharges.map((c) => {
                const a = parseFloat(c.amount || 0)
                return (
                  <CTableRow key={c.id}>
                    <CTableDataCell>{c.type}</CTableDataCell>
                    <CTableDataCell>{c.description || '-'}</CTableDataCell>
                    <CTableDataCell>{c.Property ? `${c.Property.type} - ${c.Property.city}` : 'General'}</CTableDataCell>
                    <CTableDataCell>{c.frequency}</CTableDataCell>
                    <CTableDataCell>{a.toFixed(2)} €</CTableDataCell>
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
