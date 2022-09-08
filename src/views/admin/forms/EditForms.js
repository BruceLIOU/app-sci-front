import React, { useState } from 'react'

import PropTypes from 'prop-types'

import PropertyDataService from '../../../services/property.service'

import { CFormInput, CForm, CCol, CButton, CFormSelect } from '@coreui/react'

const EditForms = ({ setModalVisible, data, entities }) => {
  const [validated, setValidated] = useState(false)
  const [inputValue, setInputValue] = useState({
    address: data[0].address,
    zipcode: data[0].zipcode,
    city: data[0].city,
    type: data[0].type,
    pieces: data[0].pieces,
    area: data[0].area,
  })

  const options = [
    { value: '', text: '--Choisir une option--', disabled: true },
    { value: 'Maison', text: 'Maison', disabled: false },
    { value: 'Appartement', text: 'Appartement', disabled: false },
  ]

  const handleChangeInput = (e) => {
    setInputValue({
      ...inputValue,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()

    setValidated(true)

    // const data = { inputValue }
    const formData = new FormData()
    formData.append('address', inputValue.address)
    formData.append('zipcode', inputValue.zipcode)
    formData.append('city', inputValue.city)
    formData.append('type', inputValue.type)
    formData.append('pieces', inputValue.pieces)
    formData.append('area', inputValue.area)

    try {
      PropertyDataService.update(data[0].id, formData)
      setModalVisible(false)
    } catch (error) {
      console.log(error.message)
    }
  }
  return (
    <CForm
      className="row g-3 needs-validation"
      noValidate
      validated={validated}
      onSubmit={handleSubmit}
    >
      <CCol md={6}>
        <CFormInput
          type="text"
          name={`${entities === 'tenants' ? 'firstname' : 'address'}`}
          label={`${entities === 'tenants' ? 'Prénom' : 'Adresse'}`}
          placeholder={`${entities === 'tenants' ? data[0].firstname : data[0].address}`}
          value={`${entities === 'tenants' ? inputValue.firstname : inputValue.address}`}
          onChange={handleChangeInput}
        />
      </CCol>
      <CCol md={6}>
        <CFormInput
          type="text"
          name={`${entities === 'tenants' ? 'lastname' : 'zipcode'}`}
          label={`${entities === 'tenants' ? 'Nom' : 'Code postal'}`}
          placeholder={`${entities === 'tenants' ? data[0].lastname : data[0].zipcode}`}
          value={`${entities === 'tenants' ? inputValue.lastname : inputValue.zipcode}`}
          onChange={handleChangeInput}
        />
      </CCol>
      <CCol md={6}>
        <CFormInput
          type={`${entities === 'tenants' ? 'email' : 'text'}`}
          name={`${entities === 'tenants' ? 'email' : 'city'}`}
          label={`${entities === 'tenants' ? 'Email' : 'Ville'}`}
          placeholder={`${entities === 'tenants' ? data[0].email : data[0].city}`}
          value={`${entities === 'tenants' ? inputValue.email : inputValue.city}`}
          onChange={handleChangeInput}
        />
      </CCol>
      <CCol md={6}>
        <CFormInput
          type="number"
          name={`${entities === 'tenants' ? 'mobile' : 'pieces'}`}
          label={`${entities === 'tenants' ? 'Mobile' : 'Pièces'}`}
          placeholder={`${entities === 'tenants' ? data[0].mobile : data[0].pieces}`}
          value={`${entities === 'tenants' ? inputValue.mobile : inputValue.pieces}`}
          onChange={handleChangeInput}
        />
      </CCol>
      {entities !== 'tenants' && (
        <>
          <CCol md={6}>
            <CFormSelect
              aria-label="Type"
              label="Type"
              name="type"
              value={inputValue.type}
              onChange={handleChangeInput}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.text}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={6}>
            <CFormInput
              type="text"
              name="area"
              label="Superficie"
              placeholder={`${data[0].area}`}
              value={inputValue.area}
              onChange={handleChangeInput}
            />
          </CCol>
          <hr />
          <CCol md={12} className="d-flex gap-2 justify-content-end">
            <CButton color="secondary" onClick={() => setModalVisible(false)}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit">
              Modifier
            </CButton>
          </CCol>
        </>
      )}
    </CForm>
  )
}

EditForms.propTypes = {
  entities: PropTypes.any,
  data: PropTypes.any,
  setModalVisible: PropTypes.any,
}

export default EditForms
