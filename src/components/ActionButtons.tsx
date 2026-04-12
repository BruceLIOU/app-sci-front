import React from 'react'
import { CButton, CTooltip } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPen, cilTrash } from '@coreui/icons'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

interface ActionButtonsProps {
  onEdit: () => void
  onDelete: () => void
  editTooltip?: string
  deleteTooltip?: string
  children?: React.ReactNode
}

/**
 * Boutons d'actions réutilisables pour les lignes de tableau.
 * Utilisez `children` pour ajouter des boutons supplémentaires avant Modifier/Supprimer.
 * Les boutons Modifier/Supprimer sont masqués pour les utilisateurs avec le rôle 'viewer'.
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  editTooltip = 'Modifier',
  deleteTooltip = 'Supprimer',
  children,
}) => {
  const userRole = useSelector((state: RootState) => state.auth.user?.role ?? 'viewer')
  const isAdmin = userRole === 'admin'

  return (
    <>
      {children}
      {isAdmin && (
        <>
          <CTooltip content={editTooltip}>
            <CButton color="light" size="sm" className="me-1 app-table-action-button" onClick={onEdit}>
              <CIcon icon={cilPen} />
            </CButton>
          </CTooltip>
          <CTooltip content={deleteTooltip}>
            <CButton color="light" size="sm" className="app-table-action-button" onClick={onDelete}>
              <CIcon icon={cilTrash} />
            </CButton>
          </CTooltip>
        </>
      )}
    </>
  )
}

export default ActionButtons
