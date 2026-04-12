import React from 'react'
import { CCard, CCardBody, CCardHeader, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

interface EntityTableCardProps {
  title: string
  addLabel?: string
  onAdd?: () => void
  children: React.ReactNode
}

/**
 * CCard avec en-tête contenant un titre et (optionnellement) un bouton "Ajouter".
 * Le bouton "Ajouter" est masqué pour les utilisateurs avec le rôle 'viewer'.
 *
 * @example
 * <EntityTableCard title="Baux de location" addLabel="Nouveau bail" onAdd={openCreate}>
 *   <ViewControlBar ... />
 *   <CTable>...</CTable>
 * </EntityTableCard>
 */
const EntityTableCard: React.FC<EntityTableCardProps> = ({
  title,
  addLabel = 'Ajouter',
  onAdd,
  children,
}) => {
  const userRole = useSelector((state: RootState) => state.auth.user?.role ?? 'viewer')
  const isAdmin = userRole === 'admin'

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <strong>{title}</strong>
        {isAdmin && onAdd && (
          <CButton color="primary" size="sm" onClick={onAdd}>
            <CIcon icon={cilPlus} className="me-1" />
            {addLabel}
          </CButton>
        )}
      </CCardHeader>
      <CCardBody>{children}</CCardBody>
    </CCard>
  )
}

export default EntityTableCard
