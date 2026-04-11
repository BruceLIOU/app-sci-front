import React from 'react'
import { CModal, CModalHeader, CModalTitle, CModalBody, CButton } from '@coreui/react'

interface DeleteModalProps {
  visible: boolean
  itemLabel?: string
  onClose: () => void
  onConfirm: () => void
}

const DeleteModal: React.FC<DeleteModalProps> = ({ visible, itemLabel, onClose, onConfirm }) => (
  <CModal alignment="center" visible={visible} onClose={onClose}>
    <CModalHeader><CModalTitle>Suppression</CModalTitle></CModalHeader>
    <CModalBody>
      <p>
        Supprimer{itemLabel ? <> <strong>{itemLabel}</strong></> : ' cet élément'} ?
      </p>
      <div className="d-flex gap-2 justify-content-end">
        <CButton color="secondary" onClick={onClose}>Annuler</CButton>
        <CButton color="danger" onClick={onConfirm}>Supprimer</CButton>
      </div>
    </CModalBody>
  </CModal>
)

export default DeleteModal
