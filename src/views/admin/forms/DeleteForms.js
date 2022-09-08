/* eslint-disable react/prop-types */
/* eslint-disable react/no-unknown-property */
import React from 'react'

import PropertyDataService from './../../../services/property.service'

import { CRow, CCol, CButton } from '@coreui/react'

const DeleteForms = ({ entities, data, setModalVisible }) => {
  const handleDelete = async () => {
    try {
      const response = await PropertyDataService.delete(data[0].id)
      if (response.status === 201) {
        setModalVisible(false)
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  return (
    <>
      <CRow>
        <CCol>
          {`Êtes-vous sûr de vouloir supprimer le bien `}
          <strong>{`${data[0].type + ' ' + data[0].city}`}</strong>?
        </CCol>
      </CRow>
      <hr />
      <CRow>
        <CCol md={12} className="d-flex gap-2 justify-content-end">
          <CButton color="secondary" onClick={() => setModalVisible(false)}>
            Annuler
          </CButton>
          <CButton color="primary" onClick={handleDelete}>
            Supprimer
          </CButton>
        </CCol>
      </CRow>
    </>
  )
}

export default DeleteForms
