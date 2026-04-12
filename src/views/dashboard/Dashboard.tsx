import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody,
  CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CBadge, CSpinner,
} from '@coreui/react'
import { CChartBar } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilHome, cilContact, cilDescription, cilEuro, cilWarning } from '@coreui/icons'
import PropertyDataService from '../../services/property.service'
import TenantDataService from '../../services/tenant.service'
import LeaseDataService from '../../services/lease.service'
import PaymentDataService from '../../services/payment.service'
import { DateUtils } from 'src/utils/date'

const statusLabel: Record<string, string> = { paid: 'Payé', pending: 'En attente', late: 'En retard' }
const statusColor: Record<string, string> = { paid: 'success', pending: 'warning', late: 'danger' }

const Dashboard = () => {
  const [properties, setProperties] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [leases, setLeases] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      PropertyDataService.getAll(),
      TenantDataService.getAll(),
      LeaseDataService.getAll(),
      PaymentDataService.getAll(),
    ]).then(([p, t, l, pay]) => {
      setProperties(p.data)
      setTenants(t.data.filter((tenant: any) => tenant.is_active !== false))
      setLeases(l.data)
      setPayments(pay.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const activeLeases = leases.filter((l) => l.status === 'active')
  const monthlyRevenue = activeLeases.reduce((s, l) => s + parseFloat(l.rent_amount || 0) + parseFloat(l.charges_amount || 0), 0)
  const pendingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'late')
  const paidPayments = payments.filter((p) => p.status === 'paid')
  const totalPaid = paidPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const totalPending = pendingPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)

  // Regrouper les paiements encaissés par mois
  const byMonth: Record<string, number> = {}
  const monthSortKey: Record<string, string> = {}
  payments.forEach((p) => {
    if (p.status === 'paid' && p.month) {
      byMonth[p.month] = (byMonth[p.month] || 0) + parseFloat(p.amount || 0)
      if (!monthSortKey[p.month] || (p.due_date && p.due_date < monthSortKey[p.month])) {
        monthSortKey[p.month] = p.due_date || ''
      }
    }
  })
  const chartLabels = Object.keys(byMonth)
    .sort((a, b) => (monthSortKey[a] || '').localeCompare(monthSortKey[b] || ''))
    .slice(-6)
  const chartData = chartLabels.map((m) => byMonth[m])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <>
      {/* Cartes statistiques */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-primary mb-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/properties')}>
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fs-2 fw-bold">{properties.length}</div>
                <div className="small">Bien{properties.length > 1 ? 's' : ''} immobilier{properties.length > 1 ? 's' : ''}</div>
              </div>
              <CIcon icon={cilHome} size="3xl" className="opacity-50" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-info mb-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/tenants')}>
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fs-2 fw-bold">{tenants.length}</div>
                <div className="small">Locataire{tenants.length > 1 ? 's' : ''} Actif{tenants.length > 1 ? 's' : ''}</div>
              </div>
              <CIcon icon={cilContact} size="3xl" className="opacity-50" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-success mb-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/leases')}>
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fs-2 fw-bold">{activeLeases.length}</div>
                <div className="small">{activeLeases.length > 1 ? 'Baux actifs' : 'Bail actif'}</div>
              </div>
              <CIcon icon={cilDescription} size="3xl" className="opacity-50" />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol sm={6} lg={3}>
          <CCard className="text-white bg-warning mb-3" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/payments')}>
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fs-2 fw-bold">{monthlyRevenue.toFixed(0)} €</div>
                <div className="small">Loyer{activeLeases.length > 1 ? 's' : ''} mensuel{activeLeases.length > 1 ? 's' : ''} CC</div>
              </div>
              <CIcon icon={cilEuro} size="3xl" className="opacity-50" />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4">
        {/* Graphique des encaissements */}
        <CCol md={7}>
          <CCard className="h-100">
            <CCardHeader><strong>Encaissements par mois</strong></CCardHeader>
            <CCardBody>
              {chartLabels.length === 0 ? (
                <div className="text-center text-muted py-5">Aucun paiement encaissé</div>
              ) : (
                <CChartBar
                  data={{
                    labels: chartLabels.map((m) => DateUtils.formatMonthYear(m)),
                    datasets: [{
                      label: 'Encaissé (€)',
                      backgroundColor: 'rgba(50, 153, 255, 0.6)',
                      borderColor: 'rgba(50, 153, 255, 1)',
                      borderWidth: 1,
                      data: chartData,
                    }],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }}
                  style={{ height: 220 }}
                />
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* Résumé financier */}
        <CCol md={5}>
          <CCard className="h-100">
            <CCardHeader><strong>Résumé financier</strong></CCardHeader>
            <CCardBody>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Total encaissé</span>
                <strong className="text-success">{totalPaid.toFixed(2)} €</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">En attente / retard</span>
                <strong className="text-danger">{totalPending.toFixed(2)} €</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Loyers mensuels attendus</span>
                <strong>{monthlyRevenue.toFixed(2)} €</strong>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted">Paiements en retard</span>
                <strong className="text-warning">
                  <CIcon icon={cilWarning} className="me-1" />
                  {payments.filter((p) => p.status === 'late').length}
                </strong>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow>
        {/* Paiements non réglés */}
        <CCol md={6}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/payments')}>
              <strong>Paiements en attente / retard</strong>
              <CBadge color="danger">{pendingPayments.length}</CBadge>
            </CCardHeader>
            <CCardBody>
              <CTable hover responsive bordered small>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Locataire</CTableHeaderCell>
                    <CTableHeaderCell>Mois</CTableHeaderCell>
                    <CTableHeaderCell>Montant</CTableHeaderCell>
                    <CTableHeaderCell>Statut</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {pendingPayments.length === 0 ? (
                    <CTableRow><CTableDataCell colSpan={4} className="text-center text-muted">Aucun paiement en attente</CTableDataCell></CTableRow>
                  ) : pendingPayments.slice(0, 8).map((p) => (
                    <CTableRow key={p.id}>
                      <CTableDataCell>{p.Tenant ? `${p.Tenant.civility || ''} ${p.Tenant.lastname}` : '-'}</CTableDataCell>
                      <CTableDataCell>{p.month || '-'}</CTableDataCell>
                      <CTableDataCell>{parseFloat(p.amount || 0).toFixed(2)} €</CTableDataCell>
                      <CTableDataCell><CBadge color={statusColor[p.status]}>{statusLabel[p.status]}</CBadge></CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Liste des baux actifs */}
        <CCol md={6}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/leases')}>
              <strong>Baux actifs</strong>
              <CBadge color="success">{activeLeases.length}</CBadge>
            </CCardHeader>
            <CCardBody>
              <CTable hover responsive bordered small>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Bien</CTableHeaderCell>
                    <CTableHeaderCell>Locataire</CTableHeaderCell>
                    <CTableHeaderCell>Loyer CC</CTableHeaderCell>
                    <CTableHeaderCell>Depuis</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {activeLeases.length === 0 ? (
                    <CTableRow><CTableDataCell colSpan={4} className="text-center text-muted">Aucun bail actif</CTableDataCell></CTableRow>
                  ) : activeLeases.slice(0, 8).map((l) => (
                    <CTableRow key={l.id}>
                      <CTableDataCell>{l.Property ? `${l.Property.type} - ${l.Property.city}` : '-'}</CTableDataCell>
                      <CTableDataCell>{l.Tenant ? `${l.Tenant.civility || ''} ${l.Tenant.lastname}` : '-'}</CTableDataCell>
                      <CTableDataCell>{(parseFloat(l.rent_amount || 0) + parseFloat(l.charges_amount || 0)).toFixed(2)} €</CTableDataCell>
                      <CTableDataCell>{DateUtils.formatShort(l.start_date) || '-'}</CTableDataCell>
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

export default Dashboard
