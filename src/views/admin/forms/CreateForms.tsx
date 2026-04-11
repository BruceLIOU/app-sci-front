import React, { useState, useEffect, useRef } from 'react'
import PropertyDataService from '../../../services/property.service'
import TenantDataService from '../../../services/tenant.service'
import { CFormInput, CForm, CCol, CButton, CFormSelect, CFormLabel, CSpinner, CFormCheck, CFormTextarea, CInputGroup, CInputGroupText } from '@coreui/react'

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
  const [geocoding, setGeocoding] = useState(false)

  // État pour la branche properties
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [propertyImages, setPropertyImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [rooms, setRooms] = useState<{ type: string; count: number }[]>([])
  const [features, setFeatures] = useState<string[]>([])
  const [newRoomType, setNewRoomType] = useState(ROOM_TYPES[0])

  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [inputValue, setInputValue] = useState<any>(
    entities === 'tenants'
      ? { civility: 'MR', firstname: '', lastname: '', email: '', mobile: '', property_id: '' }
      : { address: '', zipcode: '', city: '', type: '', pieces: '', area: '', latitude: '', longitude: '', comments: '' },
  )

  useEffect(() => {
    if (entities === 'tenants') {
      PropertyDataService.getAll().then((res) => setProperties(res.data)).catch((err) => console.log(err.message))
    }
  }, [entities])

  // Géocodage auto (Nominatim) sur changement adresse/cp/ville
  useEffect(() => {
    if (entities !== 'properties') return
    if (!inputValue.address && !inputValue.city) return

    if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
    geocodeTimer.current = setTimeout(async () => {
      const query = [inputValue.address, inputValue.zipcode, inputValue.city].filter(Boolean).join(' ')
      if (query.trim().length < 5) return
      setGeocoding(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
          { headers: { 'Accept-Language': 'fr' } },
        )
        const results = await res.json()
        if (results.length > 0) {
          setInputValue((prev: any) => ({
            ...prev,
            latitude: results[0].lat,
            longitude: results[0].lon,
          }))
        }
      } catch {}
      setGeocoding(false)
    }, 900)

    return () => { if (geocodeTimer.current) clearTimeout(geocodeTimer.current) }
  }, [inputValue.address, inputValue.zipcode, inputValue.city])

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setValidated(true)
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
      {/* Adresse */}
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
      <CCol md={6}><CFormInput type="number" name="area" label="Superficie (m²)" placeholder="Superficie" value={inputValue.area} required onChange={handleChangeInput} /></CCol>

      {/* Coordonnées GPS (auto-remplies, overridables) */}
      <CCol md={6}>
        <CFormLabel>Latitude {geocoding && <CSpinner size="sm" className="ms-1" />}</CFormLabel>
        <CFormInput type="text" name="latitude" placeholder="Auto-détectée" value={inputValue.latitude} onChange={handleChangeInput} />
      </CCol>
      <CCol md={6}>
        <CFormLabel>Longitude {geocoding && <CSpinner size="sm" className="ms-1" />}</CFormLabel>
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
