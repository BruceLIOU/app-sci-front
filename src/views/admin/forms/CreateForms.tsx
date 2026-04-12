import React, { useState, useEffect } from 'react'
import PropertyDataService from '../../../services/property.service'
import TenantDataService from '../../../services/tenant.service'
import { CFormInput, CForm, CCol, CButton, CFormSelect, CFormLabel, CFormCheck, CFormTextarea, CInputGroup, CInputGroupText, CAlert } from '@coreui/react'
import AddressAutocomplete from '../../../components/AddressAutocomplete'
import { propertyFormSchema, tenantFormSchema, toFieldErrors } from '../../../validation/schemas'
import { FormInputField, FormSelectField } from '../../../components/FormFields'

const ROOM_TYPES = ['Chambre', 'Salon', 'Séjour', 'Salle de bain', "Salle d'eau", 'WC / Toilettes', 'Cuisine', 'Cuisine ouverte', 'Bureau', 'Dressing', 'Buanderie', 'Garage', 'Cave', 'Grenier', 'Terrasse', 'Balcon', 'Véranda', "Entrée / Hall", 'Autre']
const FEATURE_LIST = ['Domotique', 'Ballon eau chaude thermodynamique', 'Chauffe-eau solaire', 'Pompe à chaleur', 'Climatisation', 'Cheminée / Poêle', 'Panneau solaire photovoltaïque', 'Double vitrage', 'Triple vitrage', 'Parquet', 'Cuisine équipée', 'Fibre optique', 'Alarme', 'Interphone / Digicode', 'Ascenseur', 'Parking', 'Box / Garage', 'Cave', 'Jardin', 'Piscine']

interface CreateFormsProps {
  setModalVisible: (v: boolean) => void
  entities: string
  data?: any[]
}

const CreateForms = ({ setModalVisible, entities }: CreateFormsProps) => {
  const [validated, setValidated] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string>('')

  // État pour la branche properties
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [propertyImages, setPropertyImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [rooms, setRooms] = useState<{ type: string; count: number }[]>([])
  const [features, setFeatures] = useState<string[]>([])
  const [newRoomType, setNewRoomType] = useState(ROOM_TYPES[0])

  // État pour la branche tenants
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [inputValue, setInputValue] = useState<any>(
    entities === 'tenants'
      ? { civility: 'MR', firstname: '', lastname: '', email: '', mobile: '', property_id: '', comments: '', previous_address: '', previous_zipcode: '', previous_city: '' }
      : { address: '', zipcode: '', city: '', type: '', pieces: '', area: '', latitude: '', longitude: '', comments: '' },
  )

  useEffect(() => {
    if (entities === 'tenants') {
      PropertyDataService.getAll().then((res) => setProperties(res.data)).catch((err) => console.log(err.message))
    }
  }, [entities])

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const field = e.target.name
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
    setInputValue({ ...inputValue, [e.target.name]: e.target.value })
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnail(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
  }

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPropertyImages(files)
    setImagePreviews(files.map((f) => URL.createObjectURL(f)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setValidated(true)
    setSubmitError('')

    const parsed = entities === 'tenants' ? tenantFormSchema.safeParse(inputValue) : propertyFormSchema.safeParse(inputValue)
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error))
      return
    }

    setFieldErrors({})
    const formData = new FormData()
    Object.entries(inputValue).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined) formData.append(key, String(val))
    })
    if (entities === 'properties') {
      if (thumbnail) formData.append('thumbnail', thumbnail)
      propertyImages.forEach((img) => formData.append('images', img))
      if (rooms.length) formData.append('rooms', JSON.stringify(rooms))
      if (features.length) formData.append('features', JSON.stringify(features))
    }
    if (entities === 'tenants' && avatar) {
      formData.append('avatar', avatar)
    }
    try {
      if (entities === 'tenants') await TenantDataService.create(formData)
      else await PropertyDataService.create(formData)
      setModalVisible(false)
    } catch (error: any) {
      const apiErrors = error?.response?.data?.errors
      if (apiErrors && typeof apiErrors === 'object') {
        const nextErrors: Record<string, string> = {}
        Object.entries(apiErrors).forEach(([k, v]) => {
          nextErrors[k] = Array.isArray(v) ? String(v[0]) : String(v)
        })
        setFieldErrors(nextErrors)
      }
      setSubmitError(error?.response?.data?.message || error.message || 'Erreur lors de la validation du formulaire.')
    }
  }

  if (entities === 'tenants') {
    return (
      <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
        {submitError && (
          <CCol md={12}>
            <CAlert color="danger" className="mb-0">{submitError}</CAlert>
          </CCol>
        )}
        {/* Avatar */}
        <CCol md={12}>
          <CFormLabel>Photo du locataire</CFormLabel>
          <CFormInput type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) { setAvatar(file); setAvatarPreview(URL.createObjectURL(file)) }
          }} />
          {avatarPreview && (
            <div className="mt-2 d-flex align-items-center gap-2">
              <img src={avatarPreview} alt="Aperçu" className="rounded-circle" style={{ width: 72, height: 72, objectFit: 'cover' }} />
              <CButton color="danger" size="sm" variant="outline" onClick={() => { setAvatar(null); setAvatarPreview(null) }}>Supprimer</CButton>
            </div>
          )}
        </CCol>
        <CCol md={6}>
          <CFormSelect label="Civilité" name="civility" value={inputValue.civility} onChange={handleChangeInput}>
            <option value="MR">M.</option>
            <option value="MME">Mme</option>
          </CFormSelect>
        </CCol>
        <CCol md={6}><FormInputField type="text" name="firstname" label="Prénom" placeholder="Prénom" value={inputValue.firstname} required error={fieldErrors.firstname} onChange={handleChangeInput} /></CCol>
        <CCol md={6}><FormInputField type="text" name="lastname" label="Nom" placeholder="Nom" value={inputValue.lastname} required error={fieldErrors.lastname} onChange={handleChangeInput} /></CCol>
        <CCol md={6}><FormInputField type="email" name="email" label="Email" placeholder="Email" value={inputValue.email} error={fieldErrors.email} onChange={handleChangeInput} /></CCol>
        <CCol md={6}><CFormInput type="text" name="mobile" label="Téléphone" placeholder="Téléphone" value={inputValue.mobile} onChange={handleChangeInput} /></CCol>
        <CCol md={6}>
          <CFormSelect label="Bien associé" name="property_id" value={inputValue.property_id} onChange={handleChangeInput}>
            <option value="">-- Aucun bien --</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{`${p.type} - ${p.address}, ${p.city}`}</option>)}
          </CFormSelect>
        </CCol>
        {/* Ancienne adresse */}
        <CCol md={12}>
          <AddressAutocomplete
            label="Ancienne adresse"
            value={inputValue.previous_address}
            onChange={(val) => setInputValue((prev: any) => ({ ...prev, previous_address: val }))}
            onSelect={(d) => setInputValue((prev: any) => ({ ...prev, previous_address: d.address, previous_zipcode: d.zipcode, previous_city: d.city }))}
          />
        </CCol>
        <CCol md={6}><CFormInput type="text" name="previous_zipcode" label="CP ancienne adresse" placeholder="Code postal" value={inputValue.previous_zipcode} onChange={handleChangeInput} /></CCol>
        <CCol md={6}><CFormInput type="text" name="previous_city" label="Ville ancienne adresse" placeholder="Ville" value={inputValue.previous_city} onChange={handleChangeInput} /></CCol>
        {/* Commentaires */}
        <CCol md={12}>
          <CFormLabel>Commentaires</CFormLabel>
          <CFormTextarea name="comments" rows={3} placeholder="Notes, observations..." value={inputValue.comments} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue((prev: any) => ({ ...prev, comments: e.target.value }))} />
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
      {submitError && (
        <CCol md={12}>
          <CAlert color="danger" className="mb-0">{submitError}</CAlert>
        </CCol>
      )}
      {/* Adresse avec auto-complétion */}
      <CCol md={12}>
        <AddressAutocomplete
          label="Adresse"
          required
          invalid={Boolean(fieldErrors.address)}
          feedbackInvalid={fieldErrors.address}
          value={inputValue.address}
          onChange={(val) => setInputValue((prev: any) => ({ ...prev, address: val }))}
          onSelect={(data) => setInputValue((prev: any) => ({ ...prev, ...data }))}
        />
      </CCol>
      <CCol md={6}><FormInputField type="number" name="zipcode" label="Code postal" placeholder="Code postal" value={inputValue.zipcode} required error={fieldErrors.zipcode} onChange={handleChangeInput} /></CCol>
      <CCol md={6}><FormInputField type="text" name="city" label="Ville" placeholder="Ville" value={inputValue.city} required error={fieldErrors.city} onChange={handleChangeInput} /></CCol>
      <CCol md={6}>
        <FormSelectField label="Type" name="type" value={inputValue.type} required error={fieldErrors.type} onChange={handleChangeInput}>
          <option value="" disabled>--Choisir--</option>
          <option value="Maison">Maison</option>
          <option value="Appartement">Appartement</option>
        </FormSelectField>
      </CCol>
      <CCol md={6}><FormInputField type="number" name="pieces" label="Pièces" placeholder="Pièces" value={inputValue.pieces} required error={fieldErrors.pieces} onChange={handleChangeInput} /></CCol>
      <CCol md={6}><FormInputField type="number" name="area" label="Superficie (m²)" placeholder="Superficie" value={inputValue.area} required error={fieldErrors.area} onChange={handleChangeInput} /></CCol>

      {/* Coordonnées GPS (auto-remplies via auto-complétion) */}
      <CCol md={6}>
        <CFormLabel>Latitude</CFormLabel>
        <CFormInput type="text" name="latitude" placeholder="Auto-détectée" value={inputValue.latitude} onChange={handleChangeInput} />
      </CCol>
      <CCol md={6}>
        <CFormLabel>Longitude</CFormLabel>
        <CFormInput type="text" name="longitude" placeholder="Auto-détectée" value={inputValue.longitude} onChange={handleChangeInput} />
      </CCol>

      {/* Photo principale */}
      <CCol md={12}>
        <CFormLabel>Photo principale (vignette)</CFormLabel>
        <CFormInput type="file" accept="image/*" onChange={handleThumbnailChange} />
        {thumbnailPreview && (
          <img src={thumbnailPreview} alt="Aperçu" className="mt-2 rounded" style={{ height: 120, objectFit: 'cover' }} />
        )}
      </CCol>

      {/* Galerie de photos */}
      <CCol md={12}>
        <CFormLabel>Photos supplémentaires</CFormLabel>
        <CFormInput type="file" accept="image/*" multiple onChange={handleImagesChange} />
        {imagePreviews.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mt-2">
            {imagePreviews.map((src, i) => (
              <img key={i} src={src} alt={`Aperçu ${i + 1}`} className="rounded" style={{ height: 80, objectFit: 'cover' }} />
            ))}
          </div>
        )}
      </CCol>

      {/* Détail des pièces */}
      <CCol md={12}><hr /><strong>Détail des pièces</strong></CCol>
      <CCol md={12}>
        <div className="d-flex gap-2 align-items-center flex-wrap mb-2">
          <CFormSelect style={{ maxWidth: 220 }} value={newRoomType} onChange={(e) => setNewRoomType(e.target.value)}>
            {ROOM_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
          </CFormSelect>
          <CButton color="secondary" size="sm" onClick={() => setRooms((prev) => [...prev, { type: newRoomType, count: 1 }])}>+ Ajouter</CButton>
        </div>
        {rooms.length > 0 && (
          <div className="d-flex flex-wrap gap-2">
            {rooms.map((room, i) => (
              <div key={i} className="d-flex align-items-center gap-1 border rounded px-2 py-1">
                <span className="me-1">{room.type}</span>
                <CInputGroup style={{ width: 90 }}>
                  <CFormInput type="number" min={1} max={20} value={room.count} size="sm" onChange={(e) => setRooms((prev) => prev.map((r, idx) => idx === i ? { ...r, count: Number(e.target.value) } : r))} />
                  <CInputGroupText className="p-1">×</CInputGroupText>
                </CInputGroup>
                <CButton color="danger" variant="ghost" size="sm" className="p-1 lh-1" onClick={() => setRooms((prev) => prev.filter((_, idx) => idx !== i))}>✕</CButton>
              </div>
            ))}
          </div>
        )}
      </CCol>

      {/* Caractéristiques */}
      <CCol md={12}><hr /><strong>Caractéristiques</strong></CCol>
      <CCol md={12}>
        <div className="d-flex flex-wrap gap-3">
          {FEATURE_LIST.map((feat) => (
            <CFormCheck
              key={feat}
              id={`feat-create-${feat}`}
              label={feat}
              checked={features.includes(feat)}
              onChange={(e) => setFeatures((prev) => e.target.checked ? [...prev, feat] : prev.filter((f) => f !== feat))}
            />
          ))}
        </div>
      </CCol>

      {/* Commentaires */}
      <CCol md={12}><hr /><strong>Commentaires</strong></CCol>
      <CCol md={12}>
        <CFormTextarea rows={3} name="comments" placeholder="Informations complémentaires sur le bien..." value={inputValue.comments} onChange={(e) => setInputValue((prev: any) => ({ ...prev, comments: e.target.value }))} />
      </CCol>

      <hr />
      <CCol md={12} className="d-flex gap-2 justify-content-end">
        <CButton color="secondary" onClick={() => setModalVisible(false)}>Annuler</CButton>
        <CButton color="primary" type="submit">Ajouter</CButton>
      </CCol>
    </CForm>
  )
}

export default CreateForms
