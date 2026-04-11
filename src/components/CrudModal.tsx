import React from 'react'
import { CModal, CModalHeader, CModalTitle, CModalBody, CForm, CCol, CButton } from '@coreui/react'

interface CrudModalProps {
  visible: boolean
  editing: any
  title?: string
  addTitle?: string
  editTitle?: string
  size?: 'sm' | 'lg' | 'xl'
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  submitLabel?: string
  children: React.ReactNode
}

/**
 * Squelette de modal CRUD (Créer / Modifier).
 * Gère automatiquement le titre et le libellé du bouton de soumission selon `editing`.
 *
 * @example
 * <CrudModal
 *   visible={modalVisible}
 *   editing={editing}
 *   addTitle="Ajouter un paiement"
 *   editTitle="Modifier le paiement"
 *   onClose={() => setModalVisible(false)}
 *   onSubmit={handleSubmit}
 * >
 *   <CCol md={6}><CFormInput name="amount" label="Montant" ... /></CCol>
 * </CrudModal>
 */
const CrudModal: React.FC<CrudModalProps> = ({
  visible,
  editing,
  title,
  addTitle = 'Ajouter',
  editTitle = 'Modifier',
  size = 'lg',
  onClose,
  onSubmit,
  submitLabel,
  children,
}) => (
  <CModal size={size} alignment="center" visible={visible} onClose={onClose}>
    <CModalHeader>
      <CModalTitle>{title ?? (editing ? editTitle : addTitle)}</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CForm className="row g-3" onSubmit={onSubmit}>
        {children}
        <hr />
        <CCol md={12} className="d-flex gap-2 justify-content-end">
          <CButton color="secondary" onClick={onClose}>Annuler</CButton>
          <CButton color="primary" type="submit">
            {submitLabel ?? (editing ? 'Modifier' : 'Ajouter')}
          </CButton>
        </CCol>
      </CForm>
    </CModalBody>
  </CModal>
)

export default CrudModal
