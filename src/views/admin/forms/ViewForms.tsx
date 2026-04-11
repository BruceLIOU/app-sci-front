import React from 'react'
import { CRow, CFormLabel, CCol, CFormInput, CContainer, CButton } from '@coreui/react'

interface ViewFormsProps {
  entities: string
  data: any[]
  setModalVisible: (v: boolean) => void
}

const ViewForms = ({ entities, data, setModalVisible }: ViewFormsProps) => {
  const isTenant = entities === 'tenants'

  return (
    <>
      {data.map((item) => (
        <CContainer key={item.id}>
          {isTenant ? (
            <>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Civilité</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.civility} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Prénom</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.firstname} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Nom</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.lastname} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Email</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.email} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Téléphone</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.mobile} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3">
                <CFormLabel className="col-sm-2 col-form-label">Bien loué</CFormLabel>
                <CCol sm={10}>
                  <CFormInput type="text" defaultValue={item.Property ? `${item.Property.type} de ${item.Property.area} m² à ${item.Property.city}` : 'Aucun bien associé'} readOnly plainText />
                </CCol>
              </CRow>
            </>
          ) : (
            <>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Adresse</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.address} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Code postal</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.zipcode} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Ville</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.city} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Type</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.type} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Pièces</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.pieces} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Superficie</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={`${item.area} m²`} readOnly plainText /></CCol></CRow>
            </>
          )}
          <hr />
          <CCol md={12} className="d-flex gap-2 justify-content-end">
            <CButton color="primary" onClick={() => setModalVisible(false)}>Quitter</CButton>
          </CCol>
        </CContainer>
      ))}
    </>
  )
}

export default ViewForms
