import React from 'react'
import { CCard, CCardBody, CCol } from '@coreui/react'

interface StatCardProps {
  value: React.ReactNode
  label: string
  color: string
  sm?: number
}

/**
 * Carte KPI colorée. À utiliser à l'intérieur d'un <CRow className="mb-4">.
 *
 * @example
 * <CRow className="mb-4">
 *   <StatCard value="42" label="Baux actifs" color="success" />
 *   <StatCard value="1 200 €" label="Loyers CC" color="info" />
 * </CRow>
 */
const StatCard: React.FC<StatCardProps> = ({ value, label, color, sm = 4 }) => (
  <CCol sm={sm}>
    <CCard className={`mb-3 app-stat-card app-stat-${color}`}>
      <CCardBody>
        <div className="fs-4 fw-semibold app-stat-value">{value}</div>
        <div className="app-stat-label">{label}</div>
      </CCardBody>
    </CCard>
  </CCol>
)

export default StatCard
