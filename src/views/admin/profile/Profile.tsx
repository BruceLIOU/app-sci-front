import React, { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  CRow, CCol, CCard, CCardBody, CCardHeader,
  CForm, CFormInput, CFormLabel, CFormSwitch,
  CButton, CSpinner, CAlert, CAvatar,
} from '@coreui/react'
import { RootState, updatePreferences, updateProfile } from '../../../store'
import AuthService from '../../../services/auth.service'

const Profile: React.FC = () => {
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)

  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleProfileSave = async () => {
    setSaving(true)
    setAlert(null)
    try {
      const fd = new FormData()
      fd.append('name', name)
      const { data } = await AuthService.updateProfile(fd)
      dispatch(updateProfile({ name: data.name }))
      setAlert({ type: 'success', message: 'Profil mis à jour.' })
    } catch {
      setAlert({ type: 'danger', message: 'Erreur lors de la mise à jour.' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleAvatarUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setAlert(null)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const { data } = await AuthService.uploadAvatar(fd)
      dispatch(updateProfile({ avatar: data.avatar }))
      setAvatarPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setAlert({ type: 'success', message: 'Avatar mis à jour.' })
    } catch {
      setAlert({ type: 'danger', message: "Erreur lors de l'upload de l'avatar." })
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleDarkMode = async (checked: boolean) => {
    try {
      const fd = new FormData()
      fd.append('darkMode', String(checked))
      const { data } = await AuthService.updatePreferences(fd)
      dispatch(updatePreferences(data.preferences))
      document.documentElement.setAttribute('data-coreui-theme', checked ? 'dark' : 'light')
    } catch { /* ignore */ }
  }

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const currentAvatar = avatarPreview || user.avatar

  return (
    <>
      {alert && (
        <CAlert color={alert.type} dismissible onClose={() => setAlert(null)} className="mb-3">
          {alert.message}
        </CAlert>
      )}

      <CRow className="justify-content-center">
        <CCol md={8} lg={6}>
          {/* Carte profil */}
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Mon profil</strong>
            </CCardHeader>
            <CCardBody>
              {/* Avatar */}
              <div className="d-flex align-items-center gap-3 mb-4">
                {currentAvatar ? (
                  <CAvatar src={currentAvatar} size="xl" />
                ) : (
                  <CAvatar color="primary" size="xl">{initials}</CAvatar>
                )}
                <div>
                  <div className="fw-semibold fs-5">{user.name}</div>
                  <div className="text-medium-emphasis small">{user.email}</div>
                  <span className={`badge bg-${user.role === 'admin' ? 'primary' : 'secondary'} mt-1`}>
                    {user.role === 'admin' ? 'Administrateur' : 'Lecteur'}
                  </span>
                </div>
              </div>

              {/* Upload avatar */}
              <div className="mb-4 p-3 border rounded">
                <CFormLabel className="fw-semibold mb-2">Changer l&apos;avatar</CFormLabel>
                <div className="d-flex align-items-center gap-2">
                  <CFormInput
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    size="sm"
                  />
                  <CButton
                    color="secondary"
                    size="sm"
                    onClick={handleAvatarUpload}
                    disabled={!avatarPreview || avatarUploading}
                  >
                    {avatarUploading ? <CSpinner size="sm" className="me-1" /> : null}
                    Enregistrer
                  </CButton>
                </div>
              </div>

              <CForm>
                <div className="mb-3">
                  <CFormLabel>Nom affiché</CFormLabel>
                  <CFormInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                  />
                </div>
                <div className="mb-3">
                  <CFormLabel>Email</CFormLabel>
                  <CFormInput value={user.email} disabled />
                </div>
              </CForm>

              <CButton color="primary" onClick={handleProfileSave} disabled={saving}>
                {saving ? <CSpinner size="sm" className="me-1" /> : null}
                Enregistrer
              </CButton>
            </CCardBody>
          </CCard>

          {/* Carte préférences */}
          <CCard>
            <CCardHeader>
              <strong>Préférences</strong>
            </CCardHeader>
            <CCardBody>
              <CFormSwitch
                label="Mode sombre"
                id="darkMode"
                checked={user.preferences?.darkMode || false}
                onChange={(e) => handleDarkMode(e.target.checked)}
              />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Profile
