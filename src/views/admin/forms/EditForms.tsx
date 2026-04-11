import React, { useState, useEffect } from 'react'
import PropertyDataService from '../../../services/property.service'
import TenantDataService from '../../../services/tenant.service'
import { CFormInput, CForm, CCol, CButton, CFormSelect, CFormLabel, CFormCheck, CFormTextarea, CInputGroup, CInputGroupText } from '@coreui/react'
import AddressAutocomplete from '../../../components/AddressAutocomplete'

const ROOM_TYPES = ['Chambre', 'Salon', 'Séjour', 'Salle de bain', "Salle d'eau", 'WC / Toilettes', 'Cuisine', 'Cuisine ouverte', 'Bureau', 'Dressing', 'Buanderie', 'Garage', 'Cave', 'Grenier', 'Terrasse', 'Balcon', 'Véranda', "Entrée / Hall", 'Autre']
const FEATURE_LIST = ['Domotique', 'Ballon eau chaude thermodynamique', 'Chauffe-eau solaire', 'Pompe à chaleur', 'Climatisation', 'Cheminée / Poêle', 'Panneau solaire photovoltaïque', 'Double vitrage', 'Triple vitrage', 'Parquet', 'Cuisine équipée', 'Fibre optique', 'Alarme', 'Interphone / Digicode', 'Ascenseur', 'Parking', 'Box / Garage', 'Cave', 'Jardin', 'Piscine']

interface EditFormsProps {
  setModalVisible: (v: boolean) => void
  data: any[]
  entities: string
}

const EditForms = ({ setModalVisible, data, entities }: EditFormsProps) => {
  const [validated, setValidated] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const isTenant = entities === 'tenants'

  // État pour la branche properties
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(data[0]?.thumbnail || null)
  const [removeThumbnail, setRemoveThumbnail] = useState(false)
  const [propertyImages, setPropertyImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>(() => {
    try { return JSON.parse(data[0]?.images || '[]') } catch { return [] }
  })
  const [rooms, setRooms] = useState<{ type: string; count: number }[]>(() => {
    try { return JSON.parse(data[0]?.rooms || '[]') } catch { return [] }
  })
  const [features, setFeatures] = useState<string[]>(() => {
    try { return JSON.parse(data[0]?.features || '[]') } catch { return [] }
  })
  const [newRoomType, setNewRoomType] = useState(ROOM_TYPES[0])

  // État pour la branche tenants
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(data[0]?.avatar || null)
  const [removeAvatar, setRemoveAvatar] = useState(false)

  const [inputValue, setInputValue] = useState<any>(
    isTenant
      ? { civility: data[0]?.civility || 'MR', firstname: data[0]?.firstname || '', lastname: data[0]?.lastname || '', email: data[0]?.email || '', mobile: data[0]?.mobile || '', property_id: data[0]?.property_id || '', comments: data[0]?.comments || '', previous_address: data[0]?.previous_address || '', previous_zipcode: data[0]?.previous_zipcode || '', previous_city: data[0]?.previous_city || '' }
      : { address: data[0]?.address || '', zipcode: data[0]?.zipcode || '', city: data[0]?.city || '', type: data[0]?.type || '', pieces: data[0]?.pieces || '', area: data[0]?.area || '', latitude: data[0]?.latitude || '', longitude: data[0]?.longitude || '', comments: data[0]?.comments || '' },
  )

  useEffect(() => {
    if (isTenant) PropertyDataService.getAll().then((res) => setProperties(res.data)).catch((err) => console.log(err.message))
  }, [isTenant])

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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setValidated(true)
    const formData = new FormData()
    Object.entries(inputValue).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined) formData.append(key, String(val))
    })
    if (!isTenant) {
      if (removeThumbnail && !thumbnail) formData.append('removeThumbnail', 'true')
      if (thumbnail) formData.append('thumbnail', thumbnail)
      propertyImages.forEach((img) => formData.append('images', img))
      if (propertyImages.length === 0) formData.append('keepImages', JSON.stringify(existingImages))
      formData.append('rooms', JSON.stringify(rooms))
      formData.append('features', JSON.stringify(features))
    }
    if (isTenant) {
      if (avatar) formData.append('avatar', avatar)
      else if (removeAvatar) formData.append('removeAvatar', 'true')
    }
    try {
      if (isTenant) await TenantDataService.update(data[0].id, formData)
      else await PropertyDataService.update(data[0].id, formData)
      setModalVisible(false)
    } catch (error: any) { console.log(error.message) }
  }

  if (isTenant) {
    return (
      <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
        {/* Avatar */}
        <CCol md={12}>
          <CFormLabel>Photo du locataire</CFormLabel>
          {avatarPreview && !removeAvatar ? (
            <div className="d-flex align-items-center gap-3 mb-2">
              <img src={avatarPreview} alt="Avatar" className="rounded-circle" style={{ width: 72, height: 72, objectFit: 'cover' }} />
              <CButton color="danger" size="sm" variant="outline" onClick={() => { setRemoveAvatar(true); setAvatarPreview(null); setAvatar(null) }}>Supprimer la photo</CButton>
            </div>
          ) : null}
          <CFormInput type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) { setAvatar(file); setAvatarPreview(URL.createObjectURL(file)); setRemoveAvatar(false) }
          }} />
        </CCol>
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
          <CButton color="primary" type="submit">Modifier</CButton>
        </CCol>
      </CForm>
    )
  }

  return (
    <CForm className="row g-3 needs-validation" noValidate validated={validated} onSubmit={handleSubmit}>
      {/* Adresse avec auto-complétion */}
      <CCol md={12}>
        <AddressAutocomplete
          label="Adresse"
          value={inputValue.address}
          onChange={(val) => setInputValue((prev: any) => ({ ...prev, address: val }))}
          onSelect={(data) => setInputValue((prev: any) => ({ ...prev, ...data }))}
        />
      </CCol>
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
      <CCol md={6}><CFormInput type="number" name="area" label="Superficie (m²)" value={inputValue.area} onChange={handleChangeInput} /></CCol>

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
          <div className="mt-2 d-flex align-items-start gap-2">
            <img src={thumbnailPreview} alt="Vignette" className="rounded" style={{ height: 120, objectFit: 'cover' }} />
            <CButton
              color="danger"
              variant="ghost"
              size="sm"
              title="Supprimer la vignette"
              onClick={() => { setThumbnailPreview(null); setThumbnail(null); setRemoveThumbnail(true) }}
            >✕</CButton>
          </div>
        )}
      </CCol>

      {/* Galerie de photos */}
      <CCol md={12}>
        <CFormLabel>Photos supplémentaires</CFormLabel>
        <CFormInput type="file" accept="image/*" multiple onChange={handleImagesChange} />
        {existingImages.length > 0 && propertyImages.length === 0 && (
          <div className="mt-2">
            <small className="text-medium-emphasis d-block mb-1">Photos actuelles :</small>
            <div className="d-flex flex-wrap gap-2">
              {existingImages.map((src, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={src} alt={`Photo ${i + 1}`} className="rounded" style={{ height: 80, objectFit: 'cover' }} />
                  <CButton
                    color="danger"
                    size="sm"
                    style={{ position: 'absolute', top: 2, right: 2, padding: '0 4px', lineHeight: 1.2, fontSize: '0.7rem' }}
                    title="Supprimer cette photo"
                    onClick={() => setExistingImages((prev) => prev.filter((_, idx) => idx !== i))}
                  >✕</CButton>
                </div>
              ))}
            </div>
          </div>
        )}
        {propertyImages.length > 0 && (
          <div className="mt-2">
            <small className="text-medium-emphasis d-block mb-1">Nouvelles photos :</small>
            <div className="d-flex flex-wrap gap-2">
              {propertyImages.map((file, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(file)} alt={`Photo ${i + 1}`} className="rounded" style={{ height: 80, objectFit: 'cover' }} />
                  <CButton
                    color="danger"
                    size="sm"
                    style={{ position: 'absolute', top: 2, right: 2, padding: '0 4px', lineHeight: 1.2, fontSize: '0.7rem' }}
                    title="Retirer cette photo"
                    onClick={() => setPropertyImages((prev) => prev.filter((_, idx) => idx !== i))}
                  >✕</CButton>
                </div>
              ))}
            </div>
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
              id={`feat-edit-${feat}`}
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
        <CButton color="primary" type="submit">Modifier</CButton>
      </CCol>
    </CForm>
  )
}

export default EditForms
