import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
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
  CFormCheck,
  CButton,
  CAlert,
  CSpinner,
  CBadge,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilXCircle, cilLockLocked, cilLockUnlocked } from '@coreui/icons'
import OwnerConfigDataService, { OwnerConfigData } from '../../../services/owner_config.service'
import AssociateDataService from '../../../services/associate.service'
import VisitDataService from '../../../services/visit.service'
import PropertyDataService from '../../../services/property.service'
import http from '../../../utils/http-common'
import { setOwnerProfileType } from '../../../store'

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

interface Property {
  id: number
  name: string
  address?: string
  city?: string
}

const Settings: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [config, setConfig] = useState<OwnerConfigData>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gerants, setGerants] = useState<Associate[]>([])
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([])
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleCalendarsError, setGoogleCalendarsError] = useState(false)
  const [googleAlert, setGoogleAlert] = useState<{ type: 'success' | 'danger' | 'info'; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'owner' | 'google' | 'smtp' | 'imap' | 'cron'>('owner')
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [showImapPass, setShowImapPass] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const isSciProfile = (config.owner_profile_type || 'INDIVIDUAL') === 'SCI'
  const isIndividual = (config.owner_profile_type || 'INDIVIDUAL') === 'INDIVIDUAL'
  const isProfessional = (config.owner_profile_type || 'INDIVIDUAL') === 'PROFESSIONAL'

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
    OwnerConfigDataService.get()
      .then((r) => setConfig({ owner_profile_type: 'INDIVIDUAL', ...r.data }))
      .catch(() => {})

    AssociateDataService.getAll()
      .then((r) => {
        const all: Associate[] = r.data
        setGerants(all.filter((a) => a.role === 'Gérant' || a.role === 'Gérant associé' || a.role === 'Bailleur principal'))
      })
      .catch(() => {})

    VisitDataService.getGoogleStatus()
      .then((r) => {
        setGoogleConnected(r.data.connected)
        if (r.data.connected) fetchGoogleCalendars()
      })
      .catch(() => {})

    PropertyDataService.getAll()
      .then((r) => setProperties(r.data))
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
      const r = await OwnerConfigDataService.update(fd)
      setConfig(r.data)
      // Mettre à jour le store Redux si le type de bailleur a changé
      if (r.data.owner_profile_type) {
        dispatch(setOwnerProfileType(r.data.owner_profile_type as 'SCI' | 'PROFESSIONAL' | 'INDIVIDUAL'))
      }
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
                  active={activeTab === 'owner'}
                  onClick={() => setActiveTab('owner')}
                  style={{ cursor: 'pointer' }}
                >
                  Bailleurs
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
              <CNavItem>
                <CNavLink
                  active={activeTab === 'smtp'}
                  onClick={() => setActiveTab('smtp')}
                  style={{ cursor: 'pointer' }}
                >
                  Envoi de mail
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink
                  active={activeTab === 'imap'}
                  onClick={() => setActiveTab('imap')}
                  style={{ cursor: 'pointer' }}
                >
                  Récup. mail Matera
                </CNavLink>
              </CNavItem>
              <CNavItem>
                <CNavLink
                  active={activeTab === 'cron'}
                  onClick={() => setActiveTab('cron')}
                  style={{ cursor: 'pointer' }}
                >
                  Cron
                </CNavLink>
              </CNavItem>
            </CNav>

            <CTabContent className="p-3">
              <CTabPane visible={activeTab === 'owner'}>
            {saved && activeTab === 'owner' && (
              <CAlert color="success" dismissible onClose={() => setSaved(false)}>
                Paramètres enregistrés avec succès.
              </CAlert>
            )}
            {error && activeTab === 'owner' && <CAlert color="danger">{error}</CAlert>}

            <h6 className="fw-semibold text-uppercase text-muted mb-3 mt-2">Profil bailleur</h6>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Type de bailleur</CFormLabel>
                <CFormSelect
                  name="owner_profile_type"
                  value={config.owner_profile_type || 'INDIVIDUAL'}
                  onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                >
                  <option value="INDIVIDUAL">Bailleur particulier</option>
                  <option value="PROFESSIONAL">Bailleur professionnel</option>
                  <option value="SCI">SCI (Société Civile Immobilière)</option>
                </CFormSelect>
              </CCol>
              {(isSciProfile || isProfessional) && (
                <CCol md={6}>
                  <CFormLabel>Forme juridique</CFormLabel>
                  <CFormInput
                    name="legal_form"
                    value={config.legal_form || ''}
                    onChange={handleChange}
                    placeholder={isSciProfile ? 'SCI' : 'SARL, EIRL, etc.'}
                  />
                </CCol>
              )}
            </CRow>

            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel>
                  {isSciProfile ? 'Raison sociale' : 'Nom du bailleur'} <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  name="name"
                  value={config.name || ''}
                  onChange={handleChange}
                  placeholder={
                    isSciProfile
                      ? 'Nom de la SCI (sans la forme juridique)'
                      : isProfessional
                        ? "Nom de l'entreprise ou de la personne"
                        : 'Nom du bailleur affiché dans les documents'
                  }
                />
              </CCol>
            </CRow>

            {(isSciProfile || isProfessional) && (
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
            )}

            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel>
                  {isSciProfile ? 'Adresse du siège social' : 'Adresse'}
                </CFormLabel>
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

            {(isSciProfile || isProfessional) && (
              <>
                <h6 className="fw-semibold text-uppercase text-muted mb-3">
                  {isSciProfile ? 'Gérant' : 'Responsable'}
                </h6>

                <CRow className="mb-3">
                  <CCol md={12}>
                    <CFormLabel>
                      {isSciProfile ? 'Sélectionner un gérant associé' : 'Sélectionner un responsable'}
                    </CFormLabel>
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
                        ? isSciProfile
                          ? 'Aucun co-bailleur avec un rôle de gestion trouvé.'
                          : 'Aucun responsable trouvé.'
                        : 'La sélection remplit automatiquement les champs ci-dessous.'}
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
              </>
            )}

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

              {/* ── SMTP ── */}
              <CTabPane visible={activeTab === 'smtp'}>
                {saved && activeTab === 'smtp' && (
                  <CAlert color="success" dismissible onClose={() => setSaved(false)}>
                    Paramètres enregistrés avec succès.
                  </CAlert>
                )}
                {error && activeTab === 'smtp' && <CAlert color="danger">{error}</CAlert>}

                <h6 className="fw-semibold text-uppercase text-muted mb-3 mt-2">Configuration SMTP (envoi de mails)</h6>

                <CRow className="mb-3">
                  <CCol md={8}>
                    <CFormLabel>Serveur SMTP</CFormLabel>
                    <CFormInput
                      name="smtp_host"
                      value={config.smtp_host || ''}
                      onChange={handleChange}
                      placeholder="smtp.gmail.com"
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Port</CFormLabel>
                    <CFormInput
                      type="number"
                      name="smtp_port"
                      value={config.smtp_port ?? ''}
                      onChange={handleChange}
                      placeholder="587"
                    />
                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  <CCol md={12}>
                    <CFormCheck
                      id="smtp_secure"
                      name="smtp_secure"
                      label="Connexion sécurisée (SSL/TLS — port 465)"
                      checked={!!config.smtp_secure}
                      onChange={(e) => {
                        setSaved(false)
                        setConfig((prev) => ({ ...prev, smtp_secure: e.target.checked }))
                      }}
                    />
                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel>Utilisateur (login)</CFormLabel>
                    <CFormInput
                      name="smtp_user"
                      value={config.smtp_user || ''}
                      onChange={handleChange}
                      placeholder="user@example.com"
                      autoComplete="off"
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel>Mot de passe</CFormLabel>
                    <CInputGroup>
                      <CFormInput
                        type={showSmtpPass ? 'text' : 'password'}
                        name="smtp_pass"
                        value={config.smtp_pass || ''}
                        onChange={handleChange}
                        autoComplete="new-password"
                      />
                      <CInputGroupText
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowSmtpPass((v) => !v)}
                      >
                        <CIcon icon={showSmtpPass ? cilLockUnlocked : cilLockLocked} />
                      </CInputGroupText>
                    </CInputGroup>
                  </CCol>
                </CRow>

                <CRow className="mb-4">
                  <CCol md={12}>
                    <CFormLabel>Adresse expéditeur (From)</CFormLabel>
                    <CFormInput
                      name="smtp_from"
                      value={config.smtp_from || ''}
                      onChange={handleChange}
                      placeholder="no-reply@example.com"
                    />
                    <div className="form-text">Si vide, l&apos;adresse utilisateur sera utilisée.</div>
                  </CCol>
                </CRow>

                <div className="d-flex justify-content-end">
                  <CButton color="primary" onClick={handleSave} disabled={saving}>
                    {saving ? <><CSpinner size="sm" className="me-2" />Enregistrement…</> : 'Enregistrer'}
                  </CButton>
                </div>
              </CTabPane>

              {/* ── IMAP / Matera ── */}
              <CTabPane visible={activeTab === 'imap'}>
                {saved && activeTab === 'imap' && (
                  <CAlert color="success" dismissible onClose={() => setSaved(false)}>
                    Paramètres enregistrés avec succès.
                  </CAlert>
                )}
                {error && activeTab === 'imap' && <CAlert color="danger">{error}</CAlert>}

                <h6 className="fw-semibold text-uppercase text-muted mb-3 mt-2">Configuration IMAP (récupération emails Matera)</h6>

                <CRow className="mb-3">
                  <CCol md={8}>
                    <CFormLabel>Serveur IMAP</CFormLabel>
                    <CFormInput
                      name="imap_host"
                      value={config.imap_host || ''}
                      onChange={handleChange}
                      placeholder="imap.free.fr"
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Port</CFormLabel>
                    <CFormInput
                      type="number"
                      name="imap_port"
                      value={config.imap_port ?? ''}
                      onChange={handleChange}
                      placeholder="993"
                    />
                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  <CCol md={12}>
                    <CFormCheck
                      id="imap_tls"
                      name="imap_tls"
                      label="Utiliser TLS"
                      checked={config.imap_tls !== false}
                      onChange={(e) => {
                        setSaved(false)
                        setConfig((prev) => ({ ...prev, imap_tls: e.target.checked }))
                      }}
                    />
                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel>Utilisateur (login)</CFormLabel>
                    <CFormInput
                      name="imap_user"
                      value={config.imap_user || ''}
                      onChange={handleChange}
                      placeholder="user@free.fr"
                      autoComplete="off"
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel>Mot de passe</CFormLabel>
                    <CInputGroup>
                      <CFormInput
                        type={showImapPass ? 'text' : 'password'}
                        name="imap_pass"
                        value={config.imap_pass || ''}
                        onChange={handleChange}
                        autoComplete="new-password"
                      />
                      <CInputGroupText
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowImapPass((v) => !v)}
                      >
                        <CIcon icon={showImapPass ? cilLockUnlocked : cilLockLocked} />
                      </CInputGroupText>
                    </CInputGroup>
                  </CCol>
                </CRow>

                <h6 className="fw-semibold text-uppercase text-muted mb-3 mt-4">Paramètres Matera</h6>

                <CRow className="mb-3">
                  <CCol md={8}>
                    <CFormLabel>Email expéditeur Matera</CFormLabel>
                    <CFormInput
                      name="matera_sender_email"
                      value={config.matera_sender_email || ''}
                      onChange={handleChange}
                      placeholder="notif@matera.eu"
                    />
                    <div className="form-text">Les emails reçus de cet expéditeur seront traités.</div>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Bien associé</CFormLabel>
                    <CFormSelect
                      name="matera_property_id"
                      value={config.matera_property_id ?? ''}
                      onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                      disabled={properties.length === 0}
                    >
                      <option value="">— Aucun bien —</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{p.city ? ` — ${p.city}` : ''}
                        </option>
                      ))}
                    </CFormSelect>
                    <div className="form-text">Les charges seront liées à ce bien.</div>
                  </CCol>
                </CRow>

                <div className="d-flex justify-content-end">
                  <CButton color="primary" onClick={handleSave} disabled={saving}>
                    {saving ? <><CSpinner size="sm" className="me-2" />Enregistrement…</> : 'Enregistrer'}
                  </CButton>
                </div>
              </CTabPane>

              {/* ── Cron ── */}
              <CTabPane visible={activeTab === 'cron'}>
                {saved && activeTab === 'cron' && (
                  <CAlert color="success" dismissible onClose={() => setSaved(false)}>
                    Paramètres enregistrés. Le cron sera rechargé immédiatement.
                  </CAlert>
                )}
                {error && activeTab === 'cron' && <CAlert color="danger">{error}</CAlert>}

                <h6 className="fw-semibold text-uppercase text-muted mb-3 mt-2">Planification automatique (Cron)</h6>

                <CRow className="mb-3">
                  <CCol md={12}>
                    <CFormCheck
                      id="charge_cron_enabled"
                      name="charge_cron_enabled"
                      label="Activer la récupération automatique des emails Matera"
                      checked={config.charge_cron_enabled !== false}
                      onChange={(e) => {
                        setSaved(false)
                        setConfig((prev) => ({ ...prev, charge_cron_enabled: e.target.checked }))
                      }}
                    />
                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  <CCol md={8}>
                    <CFormLabel>Schedule (syntaxe cron)</CFormLabel>
                    <CFormInput
                      name="charge_cron_schedule"
                      value={config.charge_cron_schedule || '0 8 * * *'}
                      onChange={handleChange}
                      placeholder="0 8 * * *"
                      disabled={config.charge_cron_enabled === false}
                    />
                    <div className="form-text">
                      Exemples : <code>0 8 * * *</code> (chaque jour à 8h00) — <code>0 */6 * * *</code> (toutes les 6h) — <code>*/30 * * * *</code> (toutes les 30 min)
                    </div>
                  </CCol>
                </CRow>

                <div className="d-flex justify-content-end">
                  <CButton color="primary" onClick={handleSave} disabled={saving}>
                    {saving ? <><CSpinner size="sm" className="me-2" />Enregistrement…</> : 'Enregistrer'}
                  </CButton>
                </div>
              </CTabPane>
            </CTabContent>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Settings
