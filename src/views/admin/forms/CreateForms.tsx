import React, { useState, useEffect } from 'react'
import PropertyDataService from '../../../services/property.service'
import TenantDataService from '../../../services/tenant.service'
import { CFormInput, CForm, CCol, CButton, CFormSelect } from '@coreui/react'

interface CreateFormsProps {
  setModalVisible: (v: boolean) => void
  entities: string
  data?: any[]
}

const CreateForms = ({ setModalVisible, entities }: CreateFormsProps) => {
  const [validated, setValidated] = useState(false)
  const [properties, setProperties] = useState<any[]>([])

  const [inputValue, setInputValue] = useState<any>(
    entities === 'tenants'
      ? { civility: 'MR', firstname: '', lastname: '', email: '', mobile: '', property_id: '' }
      : { address: '', zipcode: '', city: '', type: '', pieces: '', area: '' },
  )

  useEffect(() => {
    if (entities === 'tenants') {
      PropertyDataService.getAll().then((res) => setProperties(res.data)).catch((err) => console.log(err.message))
    }
  }, [entities])

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setInputValue({ ...inputValue, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setValidated(true)
    const formData = new FormData()
    Object.entries(inputValue).forEach(([key, val]) => formData.append(key, String(val)))
    try {
      if (entities === 'tenants') TenantDataService.create(formData)
      else PropertyDataService.create(formData)
      setModalVisible(false)
    } catch (error: any) { console.log(error.message) }
  }

  if (entities === 'tenants') {
    return (
      <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
        <CCol md={6}>
          <CFormSelect label="Civilité" name="civility" value={inputValue.civility} onChange={handleChangeInput}>
            <option value="MR">M.</option>
            <option value="MME">Mme</option>
          </CFormSelect>
        </CCol>
        <CCol md={6}><CFormInput type="text" name="firstname" label="Prénom" placeholder="Prénom" value={inputValue.firstname} required onChange={handleChangeInput} /></CCol>
        <CCol md={6}><CFormInput type="text" name="lastname" label="Nom" placeholder="Nom" value={inputValue.lastname} required onChange={handleChangeInput} /></CCol>
        <CCol md={6}><CFormInput type="email" name="email" label="Email" placeholder="Email" value={inputValue.email} required onChange={handleChangeInput} /></CCol>
        <CCol md={6}><CFormInput type="text" name="mobile" label="Téléphone" placeholder="Téléphone" value={inputValue.mobile} onChange={handleChangeInput} /></CCol>
        <CCol md={6}>
          <CFormSelect label="Bien associé" name="property_id" value={inputValue.property_id} onChange={handleChangeInput}>
            <option value="">-- Aucun bien --</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{`${p.type} - ${p.address}, ${p.city}`}</option>)}
          </CFormSelect>
        </CCol>
        <hr />
        <CCol md={12} className="d-flex gap-2 justify-content-end">
          <CButton color="secondary" onClick={() => setModalVisible(false)}>Annuler</CButton>
          <CButton color="primary" type="submit">Ajouter</CButton>
        </CCol>
      </CForm>
    )
  }

  return (
    <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      <CCol md={6}><CFormInput type="text" name="address" label="Adresse" placeholder="Adresse" value={inputValue.address} required onChange={handleChangeInput} /></CCol>
      <CCol md={6}><CFormInput type="number" name="zipcode" label="Code postal" placeholder="Code postal" value={inputValue.zipcode} required onChange={handleChangeInput} /></CCol>
      <CCol md={6}><CFormInput type="text" name="city" label="Ville" placeholder="Ville" value={inputValue.city} required onChange={handleChangeInput} /></CCol>
      <CCol md={6}>
        <CFormSelect label="Type" name="type" value={inputValue.type} onChange={handleChangeInput}>
          <option value="" disabled>--Choisir--</option>
          <option value="Maison">Maison</option>
          <option value="Appartement">Appartement</option>
        </CFormSelect>
      </CCol>
      <CCol md={6}><CFormInput type="number" name="pieces" label="Pièces" placeholder="Pièces" value={inputValue.pieces} required onChange={handleChangeInput} /></CCol>
      <CCol md={6}><CFormInput type="number" name="area" label="Superficie" placeholder="Superficie" value={inputValue.area} required onChange={handleChangeInput} /></CCol>
      <hr />
      <CCol md={12} className="d-flex gap-2 justify-content-end">
        <CButton color="secondary" onClick={() => setModalVisible(false)}>Annuler</CButton>
        <CButton color="primary" type="submit">Ajouter</CButton>
      </CCol>
    </CForm>
  )
}

export default CreateForms
