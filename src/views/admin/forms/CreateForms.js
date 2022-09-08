import React, { useState } from 'react'
import PropTypes from 'prop-types'

import PropertyDataService from '../../../services/property.service'

import { CFormInput, CForm, CCol, CButton, CFormSelect } from '@coreui/react'

const CreateForms = ({ setModalVisible, entities, data }) => {
  const [validated, setValidated] = useState(false)
  const [inputValue, setInputValue] = useState({
    address: '',
    zipcode: '',
    city: '',
    type: '',
    pieces: '',
    area: '',
  })

  const options = [
    { value: '', text: '--Choisir une option--', disabled: true },
    { value: 'Maison', text: 'Maison', disabled: false },
    { value: 'Appartement', text: 'Appartement', disabled: false },
  ]

  const validInput = 'Parfait !'
  const invalidInput = 'Ce champs est requis !'

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

    const formData = new FormData()
    formData.append('address', inputValue.address)
    formData.append('zipcode', inputValue.zipcode)
    formData.append('city', inputValue.city)
    formData.append('type', inputValue.type)
    formData.append('pieces', inputValue.pieces)
    formData.append('area', inputValue.area)

    try {
      PropertyDataService.create(formData)
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
          name="address"
          label="Adresse"
          placeholder="Adresse"
          value={inputValue.address}
          feedbackValid={validInput}
          feedbackInvalid={invalidInput}
          required
          onChange={handleChangeInput}
        />
      </CCol>
      <CCol md={6}>
        <CFormInput
          type="number"
          name="zipcode"
          label="Code postal"
          placeholder="Code postal"
          value={inputValue.zipcode}
          feedbackValid={validInput}
          feedbackInvalid={invalidInput}
          required
          onChange={handleChangeInput}
        />
      </CCol>
      <CCol md={6}>
        <CFormInput
          type="text"
          name="city"
          label="Ville"
          placeholder="Ville"
          value={inputValue.city}
          feedbackValid={validInput}
          feedbackInvalid={invalidInput}
          required
          onChange={handleChangeInput}
        />
      </CCol>
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
          type="number"
          name="pieces"
          label="Pièces"
          placeholder="Pièces"
          value={inputValue.pieces}
          feedbackValid={validInput}
          feedbackInvalid={invalidInput}
          required
          onChange={handleChangeInput}
        />
      </CCol>
      <CCol md={6}>
        <CFormInput
          type="number"
          name="area"
          label="Superficie"
          placeholder="Superficie"
          value={inputValue.area}
          feedbackValid={validInput}
          feedbackInvalid={invalidInput}
          required
          onChange={handleChangeInput}
        />
      </CCol>
      <hr />
      <CCol md={12} className="d-flex gap-2 justify-content-end">
        <CButton color="secondary" onClick={() => setModalVisible(false)}>
          Annuler
        </CButton>
        <CButton color="primary" type="submit">
          Ajouter
        </CButton>
      </CCol>
    </CForm>
  )
}

CreateForms.propTypes = {
  entities: PropTypes.any,
  data: PropTypes.any,
  setModalVisible: PropTypes.any,
}

export default CreateForms
