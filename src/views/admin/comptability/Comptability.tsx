import React, { useState, useEffect } from 'react'
import PaymentDataService from '../../../services/payment.service'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CProgress,
} from '@coreui/react'
import { CChartBar } from '@coreui/react-chartjs'

const Comptability = () => {
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    PaymentDataService.getAll().then((res) => setPayments(res.data)).catch((err) => console.log(err.message))
  }, [])

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const totalPending = payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const totalLate = payments.filter((p) => p.status === 'late').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const totalExpected = totalPaid + totalPending + totalLate
  const recoveryRate = totalExpected > 0 ? ((totalPaid / totalExpected) * 100).toFixed(1) : 0

  const byMonth = payments.reduce((acc: Record<string, any>, p) => {
    const key = p.month || 'Non défini'
    if (!acc[key]) acc[key] = { paid: 0, pending: 0, late: 0 }
    const amount = parseFloat(p.amount || 0)
    acc[key][p.status] = (acc[key][p.status] || 0) + amount
    return acc
  }, {})

  const months = Object.keys(byMonth)
  const paidByMonth = months.map((m) => byMonth[m].paid.toFixed(2))
  const pendingByMonth = months.map((m) => (byMonth[m].pending + byMonth[m].late).toFixed(2))

  const byProperty = payments.reduce((acc: Record<string, any>, p) => {
    if (!p.Property) return acc
    const key = `${p.Property.type} - ${p.Property.city}`
    if (!acc[key]) acc[key] = { paid: 0, total: 0 }
    acc[key].total += parseFloat(p.amount || 0)
    if (p.status === 'paid') acc[key].paid += parseFloat(p.amount || 0)
    return acc
  }, {})

  return (
    <>
      <CRow className="mb-4 text-center">
        <CCol sm={3}><CCard className="text-white bg-success mb-3"><CCardBody><div className="fs-4 fw-semibold">{totalPaid.toFixed(2)} €</div><div>Loyers perçus</div></CCardBody></CCard></CCol>
        <CCol sm={3}><CCard className="text-white bg-warning mb-3"><CCardBody><div className="fs-4 fw-semibold">{totalPending.toFixed(2)} €</div><div>En attente</div></CCardBody></CCard></CCol>
        <CCol sm={3}><CCard className="text-white bg-danger mb-3"><CCardBody><div className="fs-4 fw-semibold">{totalLate.toFixed(2)} €</div><div>En retard</div></CCardBody></CCard></CCol>
        <CCol sm={3}><CCard className="text-white bg-info mb-3"><CCardBody><div className="fs-4 fw-semibold">{recoveryRate} %</div><div>Taux de recouvrement</div></CCardBody></CCard></CCol>
      </CRow>

      {months.length > 0 && (
        <CCard className="mb-4">
          <CCardHeader><strong>Loyers par mois</strong></CCardHeader>
          <CCardBody>
            <CChartBar
              style={{ height: '280px' }}
              data={{ labels: months, datasets: [{ label: 'Perçus (€)', backgroundColor: 'rgba(40,167,69,0.7)', data: paidByMonth }, { label: 'En attente / Retard (€)', backgroundColor: 'rgba(255,193,7,0.7)', data: pendingByMonth }] }}
              options={{ maintainAspectRatio: false, plugins: { legend: { display: true } } }}
            />
          </CCardBody>
        </CCard>
      )}

      <CRow>
        <CCol md={6}>
          <CCard className="mb-4">
            <CCardHeader><strong>Revenus par bien</strong></CCardHeader>
            <CCardBody>
              {Object.keys(byProperty).length === 0 ? <p className="text-muted">Aucune donnée disponible</p>
              : Object.entries(byProperty).map(([name, val]: [string, any]) => (
                <div key={name} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>{name}</span>
                    <span>{val.paid.toFixed(2)} € / {val.total.toFixed(2)} €</span>
                  </div>
                  <CProgress value={val.total > 0 ? (val.paid / val.total) * 100 : 0} color="success" />
                </div>
              ))}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6}>
          <CCard className="mb-4">
            <CCardHeader><strong>Détail des paiements</strong></CCardHeader>
            <CCardBody>
              <CTable align="middle" hover responsive bordered small>
                <CTableHead color="light"><CTableRow><CTableHeaderCell>Mois</CTableHeaderCell><CTableHeaderCell>Locataire</CTableHeaderCell><CTableHeaderCell>Montant</CTableHeaderCell><CTableHeaderCell>Statut</CTableHeaderCell></CTableRow></CTableHead>
                <CTableBody>
                  {payments.length === 0 ? <CTableRow><CTableDataCell colSpan={4} className="text-center text-muted">Aucun paiement</CTableDataCell></CTableRow>
                  : payments.map((p) => (
                    <CTableRow key={p.id}>
                      <CTableDataCell>{p.month || '-'}</CTableDataCell>
                      <CTableDataCell>{p.Tenant ? `${p.Tenant.firstname} ${p.Tenant.lastname}` : '-'}</CTableDataCell>
                      <CTableDataCell>{parseFloat(p.amount || 0).toFixed(2)} €</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={p.status === 'paid' ? 'success' : p.status === 'late' ? 'danger' : 'warning'}>
                          {p.status === 'paid' ? 'Payé' : p.status === 'late' ? 'Retard' : 'Attente'}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Comptability
