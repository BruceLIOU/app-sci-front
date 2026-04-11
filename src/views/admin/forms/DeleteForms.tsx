import React from 'react'
import PropertyDataService from '../../../services/property.service'
import TenantDataService from '../../../services/tenant.service'
import { CRow, CCol, CButton } from '@coreui/react'

interface DeleteFormsProps {
  entities: string
  data: any[]
  setModalVisible: (v: boolean) => void
}

const DeleteForms = ({ entities, data, setModalVisible }: DeleteFormsProps) => {
  const isTenant = entities === 'tenants'

  const handleDelete = async () => {
    try {
      let response
      if (isTenant) response = await TenantDataService.delete(data[0].id)
      else response = await PropertyDataService.delete(data[0].id)
      if (response.status === 200 || response.status === 201) setModalVisible(false)
    } catch (error: any) { console.log(error.message) }
  }

  const confirmText = isTenant ? 'Êtes-vous sûr de vouloir supprimer le locataire ' : 'Êtes-vous sûr de vouloir supprimer le bien '
  const entityName = isTenant
    ? `${data[0]?.civility || ''} ${data[0]?.firstname} ${data[0]?.lastname}`
    : `${data[0]?.type} ${data[0]?.city}`

  return (
    <>
      <CRow>
        <CCol>{confirmText}<strong>{entityName}</strong> ?</CCol>
      </CRow>
      <hr />
      <CRow>
        <CCol md={12} className="d-flex gap-2 justify-content-end">
          <CButton color="secondary" onClick={() => setModalVisible(false)}>Annuler</CButton>
          <CButton color="danger" onClick={handleDelete}>Supprimer</CButton>
        </CCol>
      </CRow>
    </>
  )
}

export default DeleteForms
