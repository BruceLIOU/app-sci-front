import React from 'react'
import PropTypes from 'prop-types'

import findProperty from 'src/utils/query'

import { CRow, CFormLabel, CCol, CFormInput, CContainer, CButton } from '@coreui/react'

const ViewForms = ({ entities, data, setModalVisible }) => {
  return (
    <>
      {data.map((item) => (
        <CContainer key={item.id}>
          <CRow className="mb-3">
            <CFormLabel
              htmlFor={`${entities === 'tenants' ? 'civility' : 'address'}`}
              className="col-sm-2 col-form-label"
            >
              {`${entities === 'tenants' ? 'Civilité' : 'Adresse'}`}
            </CFormLabel>
            <CCol sm={10}>
              <CFormInput
                type="text"
                id={`${entities === 'tenants' ? 'civility' : 'address'}`}
                defaultValue={`${entities === 'tenants' ? item.civility : item.address}`}
                readOnly
                plainText
              />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CFormLabel htmlFor="firstname" className="col-sm-2 col-form-label">
              {`${entities === 'tenants' ? 'Prénom' : 'Code postal'}`}
            </CFormLabel>
            <CCol sm={10}>
              <CFormInput
                type="text"
                id="firstname"
                defaultValue={`${entities === 'tenants' ? item.firstname : item.zipcode}`}
                readOnly
                plainText
              />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CFormLabel htmlFor="lastname" className="col-sm-2 col-form-label">
              {`${entities === 'tenants' ? 'Nom' : 'Ville'}`}
            </CFormLabel>
            <CCol sm={10}>
              <CFormInput
                type="text"
                id="lastname"
                defaultValue={`${entities === 'tenants' ? item.lastname : item.city}`}
                readOnly
                plainText
              />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CFormLabel htmlFor="email" className="col-sm-2 col-form-label">
              {`${entities === 'tenants' ? 'Email' : 'Type'}`}
            </CFormLabel>
            <CCol sm={10}>
              <CFormInput
                type="text"
                id="email"
                defaultValue={`${entities === 'tenants' ? item.email : item.type}`}
                readOnly
                plainText
              />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CFormLabel htmlFor="phone" className="col-sm-2 col-form-label">
              {`${entities === 'tenants' ? 'Téléphone' : 'Pièces'}`}
            </CFormLabel>
            <CCol sm={10}>
              <CFormInput
                type="text"
                id="phone"
                defaultValue={`${entities === 'tenants' ? item.mobile : item.pieces}`}
                readOnly
                plainText
              />
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CFormLabel htmlFor="location" className="col-sm-2 col-form-label">
              {`${entities === 'tenants' ? 'Location' : 'Surface'}`}
            </CFormLabel>
            <CCol sm={10}>
              <CFormInput
                type="text"
                id="location"
                defaultValue={`${
                  entities === 'tenants' ? findProperty(item.id) : item.area + 'm²'
                }`}
                readOnly
                plainText
              />
            </CCol>
          </CRow>
          <hr />
          <CCol md={12} className="d-flex gap-2 justify-content-end">
            <CButton color="primary" onClick={() => setModalVisible(false)}>
              Quitter
            </CButton>
          </CCol>
        </CContainer>
      ))}
    </>
  )
}

ViewForms.propTypes = {
  data: PropTypes.any,
  entities: PropTypes.any,
  setModalVisible: PropTypes.any,
}

export default ViewForms
