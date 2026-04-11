import React from 'react'
import { CButton, CTooltip } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPen, cilTrash } from '@coreui/icons'

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
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  editTooltip = 'Modifier',
  deleteTooltip = 'Supprimer',
  children,
}) => (
  <>
    {children}
    <CTooltip content={editTooltip}>
      <CButton color="light" size="sm" className="me-1" onClick={onEdit}>
        <CIcon icon={cilPen} />
      </CButton>
    </CTooltip>
    <CTooltip content={deleteTooltip}>
      <CButton color="light" size="sm" onClick={onDelete}>
        <CIcon icon={cilTrash} />
      </CButton>
    </CTooltip>
  </>
)

export default ActionButtons
