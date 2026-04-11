import React, { useState, useEffect } from 'react'
import PropertyDataService from '../../../services/property.service'
import TenantDataService from '../../../services/tenant.service'
import { CFormInput, CForm, CCol, CButton, CFormSelect } from '@coreui/react'

interface EditFormsProps {
  setModalVisible: (v: boolean) => void
  data: any[]
  entities: string
}

const EditForms = ({ setModalVisible, data, entities }: EditFormsProps) => {
  const [validated, setValidated] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const isTenant = entities === 'tenants'

  const [inputValue, setInputValue] = useState<any>(
    isTenant
      ? { civility: data[0]?.civility || 'MR', firstname: data[0]?.firstname || '', lastname: data[0]?.lastname || '', email: data[0]?.email || '', mobile: data[0]?.mobile || '', property_id: data[0]?.property_id || '' }
      : { address: data[0]?.address || '', zipcode: data[0]?.zipcode || '', city: data[0]?.city || '', type: data[0]?.type || '', pieces: data[0]?.pieces || '', area: data[0]?.area || '' },
  )

  useEffect(() => {
    if (isTenant) PropertyDataService.getAll().then((res) => setProperties(res.data)).catch((err) => console.log(err.message))
  }, [isTenant])

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setInputValue({ ...inputValue, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setValidated(true)
    const formData = new FormData()
    Object.entries(inputValue).forEach(([key, val]) => formData.append(key, String(val)))
    try {
      if (isTenant) await TenantDataService.update(data[0].id, formData)
      else await PropertyDataService.update(data[0].id, formData)
      setModalVisible(false)
    } catch (error: any) { console.log(error.message) }
  }

  if (isTenant) {
    return (
      <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
        <CCol md={6}>
          <CFormSelect label="Civilité" name="civility" value={inputValue.civility} onChange={handleChangeInput}>
            <option value="MR">M.</option>
            <option value="MME">Mme</option>
          </CFormSelect>
        </CCol>
        <CCol md={6}><CFormInput type="text" name="firstname" label="Prénom" value={inputValue.firstname} onChange={handleChangeInput} /></CCol>
        <CCol md={6}><CFormInput type="text" name="lastname" label="Nom" value={inputValue.lastname} required onChange={handleChangeInput} /></CCol>
        <CCol md={6}><CFormInput type="email" name="email" label="Email" value={inputValue.email} required onChange={handleChangeInput} /></CCol>
        <CCol md={6}><CFormInput type="text" name="mobile" label="Téléphone" value={inputValue.mobile} onChange={handleChangeInput} /></CCol>
        <CCol md={6}>
          <CFormSelect label="Bien associé" name="property_id" value={inputValue.property_id} onChange={handleChangeInput}>
            <option value="">-- Aucun bien --</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{`${p.type} - ${p.address}, ${p.city}`}</option>)}
          </CFormSelect>
        </CCol>
        <hr />
        <CCol md={12} className="d-flex gap-2 justify-content-end">
          <CButton color="secondary" onClick={() => setModalVisible(false)}>Annuler</CButton>
          <CButton color="primary" type="submit">Modifier</CButton>
        </CCol>
      </CForm>
    )
  }

  return (
    <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      <CCol md={6}><CFormInput type="text" name="address" label="Adresse" value={inputValue.address} onChange={handleChangeInput} /></CCol>
      <CCol md={6}><CFormInput type="number" name="zipcode" label="Code postal" value={inputValue.zipcode} onChange={handleChangeInput} /></CCol>
      <CCol md={6}><CFormInput type="text" name="city" label="Ville" value={inputValue.city} required onChange={handleChangeInput} /></CCol>
      <CCol md={6}>
        <CFormSelect label="Type" name="type" value={inputValue.type} onChange={handleChangeInput}>
          <option value="" disabled>--Choisir--</option>
          <option value="Maison">Maison</option>
          <option value="Appartement">Appartement</option>
        </CFormSelect>
      </CCol>
      <CCol md={6}><CFormInput type="number" name="pieces" label="Pièces" value={inputValue.pieces} onChange={handleChangeInput} /></CCol>
      <CCol md={6}><CFormInput type="number" name="area" label="Superficie" value={inputValue.area} onChange={handleChangeInput} /></CCol>
      <hr />
      <CCol md={12} className="d-flex gap-2 justify-content-end">
        <CButton color="secondary" onClick={() => setModalVisible(false)}>Annuler</CButton>
        <CButton color="primary" type="submit">Modifier</CButton>
      </CCol>
    </CForm>
  )
}

export default EditForms
