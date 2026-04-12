import React, { useState, useEffect } from 'react'
import PaymentDataService from '../../../services/payment.service'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CProgress,
} from '@coreui/react'
import { CChartBar } from '@coreui/react-chartjs'
import { DateUtils } from 'src/utils/date'
import StatCard from '../../../components/StatCard'
import TableEmptyRow from '../../../components/TableEmptyRow'

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

  const byMonth: Record<string, any> = {}
  const monthSortKey: Record<string, string> = {}
  payments.forEach((p) => {
    const key = p.month || 'Non défini'
    if (!byMonth[key]) byMonth[key] = { paid: 0, pending: 0, late: 0 }
    const amount = parseFloat(p.amount || 0)
    byMonth[key][p.status] = (byMonth[key][p.status] || 0) + amount
    if (!monthSortKey[key] || (p.due_date && p.due_date < monthSortKey[key])) {
      monthSortKey[key] = p.due_date || ''
    }
  })

  const months = Object.keys(byMonth).sort((a, b) => (monthSortKey[a] || '').localeCompare(monthSortKey[b] || ''))
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

  const propertyEntries = Object.entries(byProperty) as Array<[string, { paid: number; total: number }]>

  return (
    <>
      <CRow className="mb-4">
        <CCol>
          <CCard className="app-page-hero border-0">
            <CCardBody className="p-0 position-relative">
              <div className="app-page-kicker mb-3">Pilotage comptable</div>
              <h2 className="mb-2 app-display-title">Suivi financier de votre parc</h2>
              <p className="app-page-description mb-3">
                Visualisez les loyers encaisses, les retards et la performance de recouvrement avec une vue
                centralisee sur les paiements.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <span className="app-filter-chip">{payments.length} paiements</span>
                <span className="app-filter-chip">{totalExpected.toFixed(2)} € attendus</span>
                <span className="app-filter-chip">{recoveryRate} % recouvres</span>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4 text-center">
        <StatCard value={`${totalPaid.toFixed(2)} €`} label="Loyers perçus" color="success" sm={3} />
        <StatCard value={`${totalPending.toFixed(2)} €`} label="En attente" color="warning" sm={3} />
        <StatCard value={`${totalLate.toFixed(2)} €`} label="En retard" color="danger" sm={3} />
        <StatCard value={`${recoveryRate} %`} label="Taux de recouvrement" color="info" sm={3} />
      </CRow>

      {months.length > 0 && (
        <CCard className="mb-4 app-panel-card">
          <CCardHeader><strong>Loyers par mois</strong></CCardHeader>
          <CCardBody>
            <CChartBar
              style={{ height: '280px' }}
              data={{
                labels: months.map((m) => DateUtils.formatMonthYear(m)),
                datasets: [
                  { label: 'Perçus (€)', backgroundColor: 'rgba(21, 128, 61, 0.78)', data: paidByMonth },
                  { label: 'En attente / Retard (€)', backgroundColor: 'rgba(234, 88, 12, 0.75)', data: pendingByMonth },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'bottom' } },
              }}
            />
          </CCardBody>
        </CCard>
      )}

      <CRow>
        <CCol md={6}>
          <CCard className="mb-4 app-panel-card">
            <CCardHeader><strong>Revenus par bien</strong></CCardHeader>
            <CCardBody>
              {propertyEntries.length === 0 ? (
                <p className="text-muted">Aucune donnée disponible</p>
              ) : (
                propertyEntries.map(([name, val]) => (
                  <div key={name} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>{name}</span>
                      <span>{val.paid.toFixed(2)} € / {val.total.toFixed(2)} €</span>
                    </div>
                    <CProgress value={val.total > 0 ? (val.paid / val.total) * 100 : 0} color="success" />
                  </div>
                ))
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6}>
          <CCard className="mb-4 app-panel-card app-table-card">
            <CCardHeader><strong>Détail des paiements</strong></CCardHeader>
            <CCardBody>
              <CTable align="middle" hover responsive bordered>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Mois</CTableHeaderCell>
                    <CTableHeaderCell>Locataire</CTableHeaderCell>
                    <CTableHeaderCell>Montant</CTableHeaderCell>
                    <CTableHeaderCell>Statut</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {payments.length === 0 ? (
                    <TableEmptyRow colSpan={4} message="Aucun paiement" />
                  ) : (
                    payments.map((p) => (
                      <CTableRow key={p.id}>
                        <CTableDataCell>{DateUtils.formatMonthYear(p.month) || '-'}</CTableDataCell>
                        <CTableDataCell>{p.Tenant ? `${p.Tenant.firstname} ${p.Tenant.lastname}` : '-'}</CTableDataCell>
                        <CTableDataCell>{parseFloat(p.amount || 0).toFixed(2)} €</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={p.status === 'paid' ? 'success' : p.status === 'late' ? 'danger' : 'warning'}>
                            {p.status === 'paid' ? 'Payé' : p.status === 'late' ? 'Retard' : 'Attente'}
                          </CBadge>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
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
