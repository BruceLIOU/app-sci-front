import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody,
  CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CBadge, CSpinner, CFormSelect,
} from '@coreui/react'
import { CChartBar, CChartDoughnut } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilCalendar, cilChartPie, cilContact, cilDescription, cilEuro, cilHome, cilWarning } from '@coreui/icons'
import PropertyDataService from '../../services/property.service'
import TenantDataService from '../../services/tenant.service'
import LeaseDataService from '../../services/lease.service'
import PaymentDataService from '../../services/payment.service'
import ChargeDataService from '../../services/charge.service'
import VisitDataService from '../../services/visit.service'
import { DateUtils } from 'src/utils/date'

const statusLabel: Record<string, string> = { paid: 'Payé', pending: 'En attente', late: 'En retard' }
const statusColor: Record<string, string> = { paid: 'success', pending: 'warning', late: 'danger' }
const chargeTypeLabel: Record<string, string> = {
  assurance: 'Assurance',
  taxe_fonciere: 'Taxe foncière',
  entretien: 'Entretien',
  travaux: 'Travaux',
  charges_copro: 'Charges copro',
  frais_gestion: 'Frais gestion',
  autre: 'Autre',
}

const CURRENT_YEAR = new Date().getFullYear().toString()

const parseAmount = (value: unknown) => parseFloat(String(value || 0)) || 0

const toPaymentMonthKey = (payment: any): string | null => {
  const paidDate = (payment.paid_date || '').slice(0, 7)
  if (/^\d{4}-\d{2}$/.test(paidDate)) return paidDate
  const dueDate = (payment.due_date || '').slice(0, 7)
  if (/^\d{4}-\d{2}$/.test(dueDate)) return dueDate
  const month = payment.month || ''
  if (/^\d{4}-\d{2}$/.test(month)) return month
  return null
}

const toPaymentYear = (payment: any): string | null => {
  const monthKey = toPaymentMonthKey(payment)
  if (monthKey) return monthKey.slice(0, 4)
  return null
}

const toChargeYear = (charge: any): string | null => {
  const value = (charge.date || '').slice(0, 4)
  return /^\d{4}$/.test(value) ? value : null
}

const formatPeriodLabel = (year: string) => year === 'all' ? 'Toutes périodes' : year
const pluralize = (count: number, singular: string, plural = `${singular}s`) => `${count} ${count > 1 ? plural : singular}`
const formatCurrency = (amount: number) => `${amount.toFixed(0)} €`

const MetricCard = ({
  eyebrow,
  value,
  label,
  icon,
  accent,
  onClick,
  solid = false,
}: {
  eyebrow: string
  value: string | number
  label: string
  icon: any
  accent: string
  onClick: () => void
  solid?: boolean
}) => {
  const cardStyle = solid
    ? {
      background: `linear-gradient(135deg, ${accent} 0%, ${accent}DD 100%)`,
      border: 'none',
      boxShadow: '0 16px 32px rgba(15, 23, 42, 0.12)',
    }
    : {
      background: `linear-gradient(145deg, rgba(255,255,255,0.98) 0%, ${accent}12 100%)`,
      border: `1px solid ${accent}22`,
      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
    }

  const iconWrapStyle = solid
    ? {
      width: 58,
      height: 58,
      borderRadius: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255,255,255,0.14)',
      border: '1px solid rgba(255,255,255,0.18)',
      color: 'rgba(255,255,255,0.95)',
      flexShrink: 0,
    }
    : {
      width: 58,
      height: 58,
      borderRadius: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `${accent}18`,
      border: `1px solid ${accent}26`,
      color: accent,
      flexShrink: 0,
    }

  return (
    <CCard
      className="h-100 overflow-hidden"
      style={{ ...cardStyle, cursor: 'pointer', borderRadius: 20 }}
      onClick={onClick}
    >
      <CCardBody className="d-flex align-items-start justify-content-between gap-3" style={{ minHeight: 142, padding: '1.25rem 1.3rem' }}>
        <div className={solid ? 'text-white' : ''}>
          <div
            className="text-uppercase fw-semibold mb-2"
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              color: solid ? 'rgba(255,255,255,0.72)' : accent,
            }}
          >
            {eyebrow}
          </div>
          <div className="fw-bold mb-1" style={{ fontSize: '2rem', lineHeight: 1.05 }}>
            {value}
          </div>
          <div style={{ color: solid ? 'rgba(255,255,255,0.92)' : 'var(--cui-body-color)' }}>
            {label}
          </div>
        </div>
        <div style={iconWrapStyle}>
          <CIcon icon={icon} size="xxl" />
        </div>
      </CCardBody>
    </CCard>
  )
}

const Dashboard = () => {
  const [properties, setProperties] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [leases, setLeases] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [charges, setCharges] = useState<any[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      PropertyDataService.getAll(),
      TenantDataService.getAll(),
      LeaseDataService.getAll(),
      PaymentDataService.getAll(),
      ChargeDataService.getAll(),
      VisitDataService.getAll(),
    ]).then(([p, t, l, pay, chg, vis]) => {
      setProperties(p.data)
      setTenants(t.data.filter((tenant: any) => tenant.is_active !== false))
      setLeases(l.data)
      setPayments(pay.data)
      setCharges(chg.data)
      setVisits(vis.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const yearOptions = Array.from(new Set([
    ...payments.map((payment) => toPaymentYear(payment)).filter(Boolean),
    ...charges.map((charge) => toChargeYear(charge)).filter(Boolean),
  ] as string[])).sort((a, b) => b.localeCompare(a))

  const isAllYears = selectedYear === 'all'
  const paymentsInScope = payments.filter((payment) => isAllYears || toPaymentYear(payment) === selectedYear)
  const chargesInScope = charges.filter((charge) => isAllYears || toChargeYear(charge) === selectedYear)

  const activeLeases = leases.filter((l) => l.status === 'active')
  const upcomingVisits = visits.filter((visit) => {
    if (visit.status && visit.status !== 'scheduled') return false
    if (!isAllYears && (visit.date || '').slice(0, 4) !== selectedYear) return false
    const datetime = new Date(`${visit.date}T${visit.time || '00:00'}:00`)
    return !Number.isNaN(datetime.getTime()) && datetime >= new Date()
  })
  const pendingPayments = paymentsInScope.filter((p) => p.status === 'pending' || p.status === 'late')
  const paidPayments = paymentsInScope.filter((p) => p.status === 'paid')
  const totalPaid = paidPayments.reduce((s, p) => s + parseAmount(p.amount), 0)
  const totalPending = pendingPayments.reduce((s, p) => s + parseAmount(p.amount), 0)
  const totalExpected = paymentsInScope.reduce((s, p) => s + parseAmount(p.amount), 0)
  const totalChargesPaid = chargesInScope.reduce((s, c) => s + parseAmount(c.amount), 0)
  const netBalance = totalPaid - totalChargesPaid
  const totalLatePayments = paymentsInScope.filter((p) => p.status === 'late').length

  const paidByMonth: Record<string, number> = {}
  paidPayments.forEach((payment) => {
    const monthKey = toPaymentMonthKey(payment)
    if (!monthKey) return
    paidByMonth[monthKey] = (paidByMonth[monthKey] || 0) + parseAmount(payment.amount)
  })

  const chargesByMonth: Record<string, number> = {}
  chargesInScope.forEach((charge) => {
    const monthKey = (charge.date || '').slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(monthKey)) return
    chargesByMonth[monthKey] = (chargesByMonth[monthKey] || 0) + parseAmount(charge.amount)
  })

  let chartMonthKeys: string[] = []
  if (isAllYears) {
    chartMonthKeys = Array.from(new Set([...Object.keys(paidByMonth), ...Object.keys(chargesByMonth)])).sort().slice(-12)
  } else {
    chartMonthKeys = Array.from({ length: 12 }, (_, i) => `${selectedYear}-${String(i + 1).padStart(2, '0')}`)
  }

  const paidChartData = chartMonthKeys.map((key) => paidByMonth[key] || 0)
  const chargesChartData = chartMonthKeys.map((key) => chargesByMonth[key] || 0)
  const chargeTypeTotals = chargesInScope.reduce((acc: Record<string, number>, charge: any) => {
    const type = charge.type || 'autre'
    acc[type] = (acc[type] || 0) + parseAmount(charge.amount)
    return acc
  }, {})
  const chargeTypeEntries: Array<[string, number]> = Object.entries(chargeTypeTotals)
    .map(([type, amount]) => [type, Number(amount)] as [string, number])
    .sort((a, b) => b[1] - a[1])
  const hasRentDonutData = totalPaid > 0 || totalPending > 0
  const hasChargeDonutData = chargeTypeEntries.some(([, amount]) => amount > 0)

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <>
      <CRow className="mb-4 align-items-end">
        <CCol md={8}>
          <div>
            <h2 className="mb-1">Dashboard</h2>
            <div className="text-body-secondary">Vue filtrée sur {formatPeriodLabel(selectedYear)}</div>
          </div>
        </CCol>
        <CCol md={4}>
          <label className="form-label">Année</label>
          <CFormSelect
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            aria-label="Sélectionner une année"
          >
            <option value={CURRENT_YEAR}>Année en cours ({CURRENT_YEAR})</option>
            {yearOptions.filter((year) => year !== CURRENT_YEAR).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
            <option value="all">Tout voir</option>
          </CFormSelect>
        </CCol>
      </CRow>

      <CRow className="mb-4 g-3">
        <CCol sm={6} xl={3}>
          <MetricCard
            eyebrow="Parc"
            value={properties.length}
            label={properties.length === 0 ? 'Aucun bien enregistré' : `${properties.length} bien${properties.length > 1 ? 's' : ''} enregistré${properties.length > 1 ? 's' : ''}`}
            icon={cilHome}
            accent="#5b6ee1"
            onClick={() => navigate('/admin/properties')}
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <MetricCard
            eyebrow="Occupation"
            value={tenants.length}
            label={tenants.length === 0 ? 'Aucun locataire actif' : `${tenants.length} locataire${tenants.length > 1 ? 's' : ''} actif${tenants.length > 1 ? 's' : ''}`}
            icon={cilContact}
            accent="#4f9cf9"
            onClick={() => navigate('/admin/tenants')}
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <MetricCard
            eyebrow="Contrats"
            value={activeLeases.length}
            label={activeLeases.length === 0 ? 'Aucun bail actif' : `${activeLeases.length} ${activeLeases.length > 1 ? 'Baux' : 'Bail'} actif${activeLeases.length > 1 ? 's' : ''}`}
            icon={cilDescription}
            accent="#49b773"
            onClick={() => navigate('/admin/leases')}
          />
        </CCol>
        <CCol sm={6} xl={3}>
          <MetricCard
            eyebrow="Agenda"
            value={upcomingVisits.length}
            label={upcomingVisits.length === 0 ? 'Aucune visite à venir' : `${upcomingVisits.length} visite${upcomingVisits.length > 1 ? 's' : ''} à venir`}
            icon={cilCalendar}
            accent="#f4b63f"
            onClick={() => navigate('/admin/visits')}
          />
        </CCol>
      </CRow>

      {/* Cartes statistiques */}
      <CRow className="mb-4 g-3">
        <CCol sm={6} lg={3}>
          <MetricCard
            eyebrow="Trésorerie"
            value={formatCurrency(totalPaid)}
            label="Loyers perçus"
            icon={cilEuro}
            accent="#1f9d55"
            onClick={() => navigate('/admin/payments')}
            solid
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <MetricCard
            eyebrow="Dépenses"
            value={formatCurrency(totalChargesPaid)}
            label="Charges payées"
            icon={cilDescription}
            accent="#e55353"
            onClick={() => navigate('/admin/charges')}
            solid
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <MetricCard
            eyebrow="Résultat"
            value={formatCurrency(netBalance)}
            label="Balance nette"
            icon={cilChartPie}
            accent={netBalance >= 0 ? '#339af0' : '#f59f00'}
            onClick={() => navigate('/admin/payments')}
            solid
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <MetricCard
            eyebrow="Suivi"
            value={totalLatePayments}
            label={pluralize(totalLatePayments, 'paiement en retard', 'paiements en retard')}
            icon={cilWarning}
            accent="#3b82f6"
            onClick={() => navigate('/admin/payments')}
            solid
          />
        </CCol>
      </CRow>

      <CRow className="mb-4">
        {/* Graphique loyers vs charges */}
        <CCol md={8}>
          <CCard className="h-100">
            <CCardHeader>
              <strong>Loyers perçus vs charges payées</strong>
            </CCardHeader>
            <CCardBody>
              {chartMonthKeys.length === 0 ? (
                <div className="text-center text-muted py-5">Aucune donnée pour cette période</div>
              ) : (
                <CChartBar
                  data={{
                    labels: chartMonthKeys.map((key) => DateUtils.formatMonthYear(key)),
                    datasets: [
                      {
                        label: 'Loyers perçus (€)',
                        backgroundColor: 'rgba(25, 135, 84, 0.7)',
                        borderColor: 'rgba(25, 135, 84, 1)',
                        borderWidth: 1,
                        data: paidChartData,
                      },
                      {
                        label: 'Charges payées (€)',
                        backgroundColor: 'rgba(220, 53, 69, 0.65)',
                        borderColor: 'rgba(220, 53, 69, 1)',
                        borderWidth: 1,
                        data: chargesChartData,
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: true, position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: (context: any) => `${context.dataset.label}: ${(context.parsed.y || 0).toFixed(2)} €`,
                          afterBody: (items: any[]) => {
                            const idx = items?.[0]?.dataIndex ?? 0
                            const balance = (paidChartData[idx] || 0) - (chargesChartData[idx] || 0)
                            return `Balance: ${balance.toFixed(2)} €`
                          },
                        },
                      },
                    },
                    scales: { y: { beginAtZero: true } },
                  }}
                  style={{ height: 260 }}
                />
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* Résumé financier */}
        <CCol md={4}>
          <CCard className="h-100">
            <CCardHeader><strong>Résumé financier</strong></CCardHeader>
            <CCardBody>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Loyers perçus</span>
                <strong className="text-success">{totalPaid.toFixed(2)} €</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Charges payées</span>
                <strong className="text-danger">{totalChargesPaid.toFixed(2)} €</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Balance nette</span>
                <strong className={netBalance >= 0 ? 'text-success' : 'text-danger'}>{netBalance.toFixed(2)} €</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Loyers en attente / retard</span>
                <strong className="text-danger">{totalPending.toFixed(2)} €</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Loyers attendus</span>
                <strong>{totalExpected.toFixed(2)} €</strong>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted">Paiements en retard</span>
                <strong className="text-warning">
                  <CIcon icon={cilWarning} className="me-1" />
                  {totalLatePayments}
                </strong>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader><strong>Répartition des loyers</strong></CCardHeader>
            <CCardBody className="d-flex justify-content-center align-items-center" style={{ minHeight: 280 }}>
              {!hasRentDonutData ? (
                <div className="text-center text-muted">Aucune donnée de loyer pour cette période</div>
              ) : (
                <div style={{ width: '100%', maxWidth: 320 }}>
                  <CChartDoughnut
                    data={{
                      labels: ['Perçus', 'En attente / retard'],
                      datasets: [{
                        data: [totalPaid, totalPending],
                        backgroundColor: ['rgba(25, 135, 84, 0.85)', 'rgba(255, 193, 7, 0.8)'],
                        borderColor: ['rgba(25, 135, 84, 1)', 'rgba(255, 193, 7, 1)'],
                        borderWidth: 1,
                      }],
                    }}
                    options={{
                      plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                          callbacks: {
                            label: (context: any) => `${context.label}: ${(context.raw || 0).toFixed(2)} €`,
                          },
                        },
                      },
                    }}
                    style={{ height: 240 }}
                  />
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6}>
          <CCard className="h-100">
            <CCardHeader><strong>Répartition des charges</strong></CCardHeader>
            <CCardBody className="d-flex justify-content-center align-items-center" style={{ minHeight: 280 }}>
              {!hasChargeDonutData ? (
                <div className="text-center text-muted">Aucune charge pour cette période</div>
              ) : (
                <div style={{ width: '100%', maxWidth: 320 }}>
                  <CChartDoughnut
                    data={{
                      labels: chargeTypeEntries.map(([type]) => chargeTypeLabel[type] || type),
                      datasets: [{
                        data: chargeTypeEntries.map(([, amount]) => amount),
                        backgroundColor: [
                          'rgba(13, 110, 253, 0.85)',
                          'rgba(220, 53, 69, 0.8)',
                          'rgba(25, 135, 84, 0.8)',
                          'rgba(111, 66, 193, 0.8)',
                          'rgba(253, 126, 20, 0.8)',
                          'rgba(108, 117, 125, 0.8)',
                          'rgba(32, 201, 151, 0.8)',
                        ],
                        borderWidth: 1,
                      }],
                    }}
                    options={{
                      plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                          callbacks: {
                            label: (context: any) => `${context.label}: ${(context.raw || 0).toFixed(2)} €`,
                          },
                        },
                      },
                    }}
                    style={{ height: 240 }}
                  />
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
