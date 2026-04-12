import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CAlert,
  CSpinner,
  CBadge,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilXCircle } from '@coreui/icons'
import SciConfigDataService, { SciConfigData } from '../../../services/sci_config.service'
import AssociateDataService from '../../../services/associate.service'
import VisitDataService from '../../../services/visit.service'
import http from '../../../utils/http-common'

interface Associate {
  id: number
  civility: string
  firstname: string
  lastname: string
  email: string | null
  phone: string | null
  role: string
}

interface GoogleCalendar {
  id: string
  summary: string
  primary: boolean
}

const Settings: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const [config, setConfig] = useState<SciConfigData>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gerants, setGerants] = useState<Associate[]>([])
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([])
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleCalendarsError, setGoogleCalendarsError] = useState(false)
  const [googleAlert, setGoogleAlert] = useState<{ type: 'success' | 'danger' | 'info'; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'sci' | 'google'>('sci')

  const fetchGoogleCalendars = async () => {
    setGoogleCalendarsError(false)
    try {
      const rc = await http.get<GoogleCalendar[]>('/visits/google/calendars')
      setGoogleCalendars(rc.data)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message || ''
      console.error('fetchGoogleCalendars error:', msg)
      setGoogleCalendarsError(true)
      setGoogleAlert({ type: 'danger', message: `Erreur chargement calendriers : ${msg}` })
    }
  }

  useEffect(() => {
    SciConfigDataService.get()
      .then((r) => setConfig(r.data))
      .catch(() => {})

    AssociateDataService.getAll()
      .then((r) => {
        const all: Associate[] = r.data
        setGerants(all.filter((a) => a.role === 'Gérant' || a.role === 'Gérant associé'))
      })
      .catch(() => {})

    VisitDataService.getGoogleStatus()
      .then((r) => {
        setGoogleConnected(r.data.connected)
        if (r.data.connected) fetchGoogleCalendars()
      })
      .catch(() => {})
  }, [])

  // Gestion du retour OAuth
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const google = params.get('google')
    if (google === 'success') {
      setGoogleConnected(true)
      setGoogleAlert({ type: 'success', message: 'Google Calendar connecté avec succès !' })
      fetchGoogleCalendars()
      navigate('/admin/settings', { replace: true })
    } else if (google === 'error') {
      setGoogleAlert({ type: 'danger', message: "Échec de la connexion à Google Calendar. Vérifiez vos identifiants OAuth." })
      navigate('/admin/settings', { replace: true })
    }
  }, [location.search, navigate])

  const handleGoogleReconnect = async () => {
    setGoogleLoading(true)
    try {
      await VisitDataService.disconnectGoogle()
      setGoogleConnected(false)
      setGoogleCalendars([])
      setGoogleCalendarsError(false)
      setConfig((prev) => ({ ...prev, google_calendar_id: null }))
      // Relance immédiatement le flux OAuth
      const { data } = await VisitDataService.getGoogleAuthUrl()
      window.location.href = data.url
    } catch {
      setGoogleAlert({ type: 'danger', message: 'Erreur lors de la reconnexion Google.' })
      setGoogleLoading(false)
    }
  }

  const handleGoogleConnect = async () => {
    setGoogleLoading(true)
    try {
      const { data } = await VisitDataService.getGoogleAuthUrl()
      window.location.href = data.url
    } catch {
      setGoogleAlert({ type: 'danger', message: "Impossible d'obtenir l'URL d'autorisation Google." })
      setGoogleLoading(false)
    }
  }

  const handleGoogleDisconnect = async () => {
    setGoogleLoading(true)
    try {
      await VisitDataService.disconnectGoogle()
      setGoogleConnected(false)
      setGoogleCalendars([])
      setGoogleCalendarsError(false)
      setConfig((prev) => ({ ...prev, google_calendar_id: null }))
      setGoogleAlert({ type: 'info', message: 'Google Calendar déconnecté.' })
    } catch {
      setGoogleAlert({ type: 'danger', message: 'Impossible de déconnecter Google Calendar.' })
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSaved(false)
    setConfig((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleGerantSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSaved(false)
    const id = e.target.value ? Number(e.target.value) : null
    if (!id) {
      setConfig((prev) => ({
        ...prev,
        manager_associate_id: null,
        manager_civility: '',
        manager_firstname: '',
        manager_lastname: '',
        manager_email: '',
        manager_phone: '',
      }))
      return
    }
    const associate = gerants.find((a) => a.id === id)
    if (associate) {
      setConfig((prev) => ({
        ...prev,
        manager_associate_id: associate.id,
        manager_civility: associate.civility || '',
        manager_firstname: associate.firstname || '',
        manager_lastname: associate.lastname || '',
        manager_email: associate.email || '',
        manager_phone: associate.phone || '',
      }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const fd = new FormData()
      Object.entries(config).forEach(([k, v]) => {
        if (v != null && k !== 'id') fd.append(k, String(v))
      })
      const r = await SciConfigDataService.update(fd)
      setConfig(r.data)
      setSaved(true)
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12} lg={10} xl={8}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Paramètres</strong>
          </CCardHeader>
          <CCardBody className="p-0">
            <CNav variant="tabs" className="px-3 pt-3">
              <CNavItem>
                <CNavLink
                  active={activeTab === 'sci'}
                  onClick={() => setActiveTab('sci')}
                  style={{ cursor: 'pointer' }}
                >
                  SCI
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink
                  active={activeTab === 'google'}
                  onClick={() => setActiveTab('google')}
                  style={{ cursor: 'pointer' }}
                >
                  Google Calendar
                  {googleConnected ? (
                    <CBadge color="success" className="ms-2">Connecté</CBadge>
                  ) : (
                    <CBadge color="secondary" className="ms-2">Non connecté</CBadge>
                  )}
                </CNavLink>
              </CNavItem>
            </CNav>

            <CTabContent className="p-3">
              <CTabPane visible={activeTab === 'sci'}>
            {saved && (
              <CAlert color="success" dismissible onClose={() => setSaved(false)}>
                Paramètres enregistrés avec succès.
              </CAlert>
            )}
            {error && <CAlert color="danger">{error}</CAlert>}

            <h6 className="fw-semibold text-uppercase text-muted mb-3 mt-2">Informations de la SCI</h6>

            <CRow className="mb-3">
              <CCol md={3}>
                <CFormLabel>Forme juridique</CFormLabel>
                <CFormInput
                  name="legal_form"
                  value={config.legal_form || ''}
                  onChange={handleChange}
                  placeholder="SCI"
                />
              </CCol>
              <CCol md={9}>
                <CFormLabel>
                  Raison sociale <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  name="name"
                  value={config.name || ''}
                  onChange={handleChange}
                  placeholder="Nom de la SCI (sans la forme juridique)"
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>SIRET</CFormLabel>
                <CFormInput
                  name="siret"
                  value={config.siret || ''}
                  onChange={handleChange}
                  placeholder="123 456 789 00010"
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>RCS</CFormLabel>
                <CFormInput
                  name="rcs"
                  value={config.rcs || ''}
                  onChange={handleChange}
                  placeholder="RCS Paris 123 456 789"
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel>Adresse du siège social</CFormLabel>
                <CFormInput
                  name="address"
                  value={config.address || ''}
                  onChange={handleChange}
                  placeholder="Numéro et nom de la rue"
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={4}>
                <CFormLabel>Code postal</CFormLabel>
                <CFormInput
                  name="zipcode"
                  value={config.zipcode || ''}
                  onChange={handleChange}
                  placeholder="75001"
                />
              </CCol>
              <CCol md={8}>
                <CFormLabel>Ville</CFormLabel>
                <CFormInput
                  name="city"
                  value={config.city || ''}
                  onChange={handleChange}
                  placeholder="Paris"
                />
              </CCol>
            </CRow>

            <CRow className="mb-4">
              <CCol md={12}>
                <CFormLabel>IBAN (compte bancaire)</CFormLabel>
                <CFormInput
                  name="iban"
                  value={config.iban || ''}
                  onChange={handleChange}
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                />
              </CCol>
            </CRow>

            <h6 className="fw-semibold text-uppercase text-muted mb-3">Gérant</h6>

            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel>Sélectionner un gérant associé</CFormLabel>
                <CFormSelect
                  value={config.manager_associate_id ?? ''}
                  onChange={handleGerantSelect}
                  disabled={gerants.length === 0}
                >
                  <option value="">— Saisie manuelle —</option>
                  {gerants.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.civility} {a.firstname} {a.lastname}
                    </option>
                  ))}
                </CFormSelect>
                <div className="form-text">
                  {gerants.length === 0
                    ? 'Aucun associé avec le rôle Gérant ou Gérant associé trouvé.'
                    : 'Sélectionner un associé gérant auto-remplira les champs ci-dessous.'}
                </div>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={2}>
                <CFormLabel>Civilité</CFormLabel>
                <CFormSelect
                  name="manager_civility"
                  value={config.manager_civility || ''}
                  onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                >
                  <option value="">—</option>
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                </CFormSelect>
              </CCol>
              <CCol md={5}>
                <CFormLabel>Prénom</CFormLabel>
                <CFormInput
                  name="manager_firstname"
                  value={config.manager_firstname || ''}
                  onChange={handleChange}
                />
              </CCol>
              <CCol md={5}>
                <CFormLabel>Nom</CFormLabel>
                <CFormInput
                  name="manager_lastname"
                  value={config.manager_lastname || ''}
                  onChange={handleChange}
                />
              </CCol>
            </CRow>

            <CRow className="mb-4">
              <CCol md={6}>
                <CFormLabel>Email</CFormLabel>
                <CFormInput
                  type="email"
                  name="manager_email"
                  value={config.manager_email || ''}
                  onChange={handleChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Téléphone</CFormLabel>
                <CFormInput
                  name="manager_phone"
                  value={config.manager_phone || ''}
                  onChange={handleChange}
                  placeholder="06 00 00 00 00"
                />
              </CCol>
            </CRow>

            <div className="d-flex justify-content-end">
              <CButton color="primary" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Enregistrement…
                  </>
                ) : (
                  'Enregistrer'
                )}
              </CButton>
            </div>
              </CTabPane>

              <CTabPane visible={activeTab === 'google'}>
            {googleAlert && (
              <CAlert color={googleAlert.type} dismissible onClose={() => setGoogleAlert(null)}>
                {googleAlert.message}
              </CAlert>
            )}

            {googleConnected ? (
              <>
                {googleCalendarsError ? (
                  <CAlert color="warning" className="mb-3">
                    Impossible de charger la liste des calendriers. Les permissions ont peut-être changé.
                    Déconnectez puis reconnectez votre compte Google pour autoriser les nouveaux accès.
                    <div className="mt-2 d-flex gap-2">
                      <CButton
                        color="warning"
                        size="sm"
                        onClick={handleGoogleReconnect}
                        disabled={googleLoading}
                      >
                        {googleLoading ? <CSpinner size="sm" className="me-1" /> : null}
                        Se reconnecter
                      </CButton>
                    </div>
                  </CAlert>
                ) : (
                  <CRow className="mb-3">
                    <CCol md={12}>
                      <CFormLabel>Calendrier à synchroniser</CFormLabel>
                      <CFormSelect
                        name="google_calendar_id"
                        value={config.google_calendar_id ?? ''}
                        onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                      >
                        <option value="">— Calendrier principal (primary) —</option>
                        {googleCalendars.map((cal) => (
                          <option key={cal.id} value={cal.id}>
                            {cal.summary}{cal.primary ? ' (principal)' : ''}
                          </option>
                        ))}
                      </CFormSelect>
                      <div className="form-text">
                        Les visites seront synchronisées vers ce calendrier.
                      </div>
                    </CCol>
                  </CRow>
                )}
                <div className="d-flex justify-content-between align-items-center">
                  <CButton
                    color="danger"
                    variant="outline"
                    size="sm"
                    onClick={handleGoogleDisconnect}
                    disabled={googleLoading}
                  >
                    {googleLoading ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilXCircle} className="me-1" />}
                    Déconnecter Google Calendar
                  </CButton>
                  <CButton color="primary" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Enregistrement…
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </CButton>
                </div>
              </>
            ) : (
              <div className="d-flex flex-column align-items-start gap-2">
                <p className="text-muted mb-2">
                  Connectez votre compte Google pour synchroniser automatiquement vos visites avec Google Calendar.
                </p>
                <CButton
                  color="light"
                  onClick={handleGoogleConnect}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <CSpinner size="sm" className="me-2" />
                  ) : (
                    <svg className="me-2" width="16" height="16" viewBox="0 0 488 512" fill="currentColor">
                      <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                    </svg>
                  )}
                  Connecter Google Calendar
                </CButton>
              </div>
            )}
              </CTabPane>
            </CTabContent>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Settings
