import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CProgress,
  CProgressBar,
  CRow,
  CSpinner,
} from '@coreui/react'
import OwnerConfigDataService, { OwnerConfigData } from '../../../services/owner_config.service'
import VisitDataService from '../../../services/visit.service'

interface Property {
  id: number
  name: string
  city?: string
}

interface Props {
  config: OwnerConfigData
  setConfig: React.Dispatch<React.SetStateAction<OwnerConfigData>>
  onSave: () => Promise<void>
  saving: boolean
  googleConnected: boolean
  googleLoading: boolean
  onGoogleConnect: () => Promise<void>
  properties: Property[]
  openTab?: (tab: 'owner' | 'google' | 'smtp' | 'imap' | 'cron') => void
  mode?: 'card' | 'modal'
}

const ONBOARDING_DISMISSED_KEY = 'settings_onboarding_hidden_v1'

const scheduleToFrequency = (schedule?: string) => {
  if (schedule === '*/30 * * * *') return '30min'
  if (schedule === '0 */6 * * *') return '6h'
  if (schedule === '0 8 * * *') return 'daily'
  if (schedule === '0 8 * * 1') return 'weekly'
  return 'custom'
}

const frequencyToSchedule = (frequency: string) => {
  if (frequency === '30min') return '*/30 * * * *'
  if (frequency === '6h') return '0 */6 * * *'
  if (frequency === 'daily') return '0 8 * * *'
  if (frequency === 'weekly') return '0 8 * * 1'
  return '0 8 * * *'
}

const SettingsOnboarding: React.FC<Props> = ({
  config,
  setConfig,
  onSave,
  saving,
  googleConnected,
  googleLoading,
  onGoogleConnect,
  properties,
  openTab,
  mode = 'card',
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [hidden, setHidden] = useState(false)
  const [siretLoading, setSiretLoading] = useState(false)
  const [siretMessage, setSiretMessage] = useState<string | null>(null)
  const [siretError, setSiretError] = useState<string | null>(null)
  const [googleTestLoading, setGoogleTestLoading] = useState(false)
  const [googleTestMessage, setGoogleTestMessage] = useState<string | null>(null)
  const [googleTestError, setGoogleTestError] = useState<string | null>(null)
  const [emailTestLoading, setEmailTestLoading] = useState(false)
  const [emailTestMessage, setEmailTestMessage] = useState<string | null>(null)
  const [emailTestError, setEmailTestError] = useState<string | null>(null)

  const [useMatera, setUseMatera] = useState(false)
  const [wantsGoogleSync, setWantsGoogleSync] = useState(false)
  const [materaFrequency, setMateraFrequency] = useState('daily')

  useEffect(() => {
    if (mode === 'modal') {
      setHidden(false)
      return
    }
    const dismissed = window.localStorage.getItem(ONBOARDING_DISMISSED_KEY)
    setHidden(dismissed === '1')
  }, [mode])

  useEffect(() => {
    setUseMatera(Boolean(config.matera_sender_email || config.imap_user || config.imap_host))
    setWantsGoogleSync(Boolean(googleConnected || config.google_calendar_id))
    setMateraFrequency(scheduleToFrequency(config.charge_cron_schedule))
  }, [config.matera_sender_email, config.imap_user, config.imap_host, config.charge_cron_schedule, googleConnected, config.google_calendar_id])

  const profileDone = useMemo(() => {
    const profileType = config.owner_profile_type || 'INDIVIDUAL'
    const hasName = Boolean(config.name && config.name.trim())
    if (!hasName) return false
    if (profileType === 'PROFESSIONAL' || profileType === 'SCI') {
      return Boolean(config.siret && String(config.siret).replace(/\D/g, '').length === 14)
    }
    return true
  }, [config.owner_profile_type, config.name, config.siret])

  const materaDone = useMemo(() => {
    if (!useMatera) return true
    return Boolean(config.matera_sender_email && config.imap_user && config.imap_host)
  }, [useMatera, config.matera_sender_email, config.imap_user, config.imap_host])

  const googleDone = useMemo(() => {
    if (!wantsGoogleSync) return true
    return googleConnected
  }, [wantsGoogleSync, googleConnected])

  const mailDone = useMemo(() => {
    return Boolean(config.smtp_host && config.smtp_user)
  }, [config.smtp_host, config.smtp_user])

  const testGoogleConnection = async () => {
    setGoogleTestError(null)
    setGoogleTestMessage(null)
    setGoogleTestLoading(true)
    try {
      const { data } = await VisitDataService.testGoogleConnection()
      setGoogleTestMessage(data.message || 'Connexion Google validee.')
    } catch (e: any) {
      setGoogleTestError(e?.response?.data?.message || 'Echec du test Google Calendar.')
    } finally {
      setGoogleTestLoading(false)
    }
  }

  const testEmailConnection = async () => {
    setEmailTestError(null)
    setEmailTestMessage(null)
    setEmailTestLoading(true)
    try {
      await onSave()
      const { data } = await OwnerConfigDataService.testEmailConnection()
      setEmailTestMessage(data.message || 'Email de test envoye avec succes.')
    } catch (e: any) {
      setEmailTestError(e?.response?.data?.message || 'Echec du test email.')
    } finally {
      setEmailTestLoading(false)
    }
  }

  const steps = [
    {
      title: 'Profil bailleur',
      subtitle: 'Type de bailleur et identification entreprise',
      done: profileDone,
    },
    {
      title: 'Charges Matera',
      subtitle: 'Import automatique et frequence',
      done: materaDone,
    },
    {
      title: 'Google Calendar',
      subtitle: 'Synchronisation des visites',
      done: googleDone,
    },
    {
      title: 'Envoi des mails',
      subtitle: 'Configuration SMTP',
      done: mailDone,
    },
  ]

  const completedCount = steps.filter((step) => step.done).length
  const progress = Math.round((completedCount / steps.length) * 100)

  const handleHide = () => {
    window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1')
    setHidden(true)
  }

  const handleRestore = () => {
    window.localStorage.removeItem(ONBOARDING_DISMISSED_KEY)
    setHidden(false)
  }

  const lookupSiret = async () => {
    setSiretMessage(null)
    setSiretError(null)
    const normalized = String(config.siret || '').replace(/\D/g, '')
    if (normalized.length !== 14) {
      setSiretError('Le SIRET doit contenir 14 chiffres.')
      return
    }

    setSiretLoading(true)
    try {
      const { data } = await OwnerConfigDataService.lookupSiret(normalized)
      setConfig((prev) => ({
        ...prev,
        siret: data.siret || normalized,
        name: data.name || prev.name || '',
        legal_form: data.legal_form || prev.legal_form || '',
        address: data.address || prev.address || '',
        zipcode: data.zipcode || prev.zipcode || '',
        city: data.city || prev.city || '',
        rcs: data.rcs || prev.rcs || '',
      }))
      setSiretMessage('Entreprise trouvee. Les informations ont ete pre-remplies.')
    } catch (e: any) {
      setSiretError(e?.response?.data?.message || 'Impossible de recuperer les informations SIRET.')
    } finally {
      setSiretLoading(false)
    }
  }

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <CRow>
          <CCol md={6} className="mb-3">
            <CFormLabel>Vous etes :</CFormLabel>
            <CFormSelect
              value={config.owner_profile_type || 'INDIVIDUAL'}
              onChange={(e) => {
                const ownerProfileType = e.target.value as 'SCI' | 'PROFESSIONAL' | 'INDIVIDUAL'
                setConfig((prev) => ({ ...prev, owner_profile_type: ownerProfileType }))
              }}
            >
              <option value="INDIVIDUAL">Bailleur particulier</option>
              <option value="PROFESSIONAL">Bailleur professionnel</option>
              <option value="SCI">SCI</option>
            </CFormSelect>
          </CCol>

          <CCol md={6} className="mb-3">
            <CFormLabel>Nom affiche dans vos documents</CFormLabel>
            <CFormInput
              value={config.name || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nom du bailleur ou de la societe"
            />
          </CCol>

          {((config.owner_profile_type || 'INDIVIDUAL') === 'PROFESSIONAL' || (config.owner_profile_type || 'INDIVIDUAL') === 'SCI') && (
            <>
              <CCol md={8} className="mb-3">
                <CFormLabel>SIRET</CFormLabel>
                <CFormInput
                  value={config.siret || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, siret: e.target.value }))}
                  placeholder="12345678900010"
                />
              </CCol>
              <CCol md={4} className="mb-3 d-flex align-items-end">
                <CButton color="light" onClick={lookupSiret} disabled={siretLoading} className="w-100">
                  {siretLoading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Recherche...
                    </>
                  ) : (
                    'Recuperer depuis SIRET'
                  )}
                </CButton>
              </CCol>
            </>
          )}

          {siretMessage && (
            <CCol md={12}>
              <CAlert color="success" className="mb-0">{siretMessage}</CAlert>
            </CCol>
          )}
          {siretError && (
            <CCol md={12}>
              <CAlert color="danger" className="mb-0">{siretError}</CAlert>
            </CCol>
          )}
        </CRow>
      )
    }

    if (currentStep === 1) {
      return (
        <CRow>
          <CCol md={12} className="mb-3">
            <CFormCheck
              id="onboarding_matera"
              label="Je souhaite recuperer automatiquement mes charges Matera depuis mes emails"
              checked={useMatera}
              onChange={(e) => {
                const checked = e.target.checked
                setUseMatera(checked)
                setConfig((prev) => ({ ...prev, charge_cron_enabled: checked }))
              }}
            />
          </CCol>

          {useMatera && (
            <>
              <CCol md={6} className="mb-3">
                <CFormLabel>Email expediteur Matera</CFormLabel>
                <CFormInput
                  value={config.matera_sender_email || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, matera_sender_email: e.target.value }))}
                  placeholder="notif@matera.eu"
                />
              </CCol>

              <CCol md={6} className="mb-3">
                <CFormLabel>Frequence de synchronisation</CFormLabel>
                <CFormSelect
                  value={materaFrequency}
                  onChange={(e) => {
                    const value = e.target.value
                    setMateraFrequency(value)
                    setConfig((prev) => ({
                      ...prev,
                      charge_cron_enabled: true,
                      charge_cron_schedule: frequencyToSchedule(value),
                    }))
                  }}
                >
                  <option value="30min">Toutes les 30 minutes</option>
                  <option value="6h">Toutes les 6 heures</option>
                  <option value="daily">Chaque jour a 8h</option>
                  <option value="weekly">Chaque lundi a 8h</option>
                </CFormSelect>
              </CCol>

              <CCol md={6} className="mb-3">
                <CFormLabel>Serveur IMAP</CFormLabel>
                <CFormInput
                  value={config.imap_host || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, imap_host: e.target.value }))}
                  placeholder="imap.free.fr"
                />
              </CCol>

              <CCol md={6} className="mb-3">
                <CFormLabel>Utilisateur IMAP</CFormLabel>
                <CFormInput
                  value={config.imap_user || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, imap_user: e.target.value }))}
                  placeholder="user@provider.fr"
                />
              </CCol>

              <CCol md={12} className="mb-3">
                <CFormLabel>Bien associe (optionnel)</CFormLabel>
                <CFormSelect
                  value={config.matera_property_id ?? ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, matera_property_id: e.target.value || null }))}
                >
                  <option value="">Aucun bien</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}{property.city ? ` - ${property.city}` : ''}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </>
          )}
        </CRow>
      )
    }

    if (currentStep === 2) {
      return (
        <CRow>
          <CCol md={12} className="mb-3">
            <CFormCheck
              id="onboarding_google"
              label="Je veux synchroniser mes visites avec Google Calendar"
              checked={wantsGoogleSync}
              onChange={(e) => setWantsGoogleSync(e.target.checked)}
            />
          </CCol>

          {wantsGoogleSync && (
            <CCol md={12} className="mb-0">
              {googleConnected ? (
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <CAlert color="success" className="mb-0 flex-grow-1">
                    Votre compte Google est deja connecte.
                  </CAlert>
                  <CButton color="light" variant="outline" onClick={testGoogleConnection} disabled={googleTestLoading}>
                    {googleTestLoading ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Test en cours...
                      </>
                    ) : (
                      'Tester la liaison Google'
                    )}
                  </CButton>
                </div>
              ) : (
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <CButton color="light" disabled={googleLoading} onClick={onGoogleConnect}>
                    {googleLoading ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Connexion en cours...
                      </>
                    ) : (
                      'Connecter Google Calendar'
                    )}
                  </CButton>
                  <CButton color="secondary" variant="outline" onClick={() => openTab?.('google')}>
                    Ouvrir les options avancees
                  </CButton>
                </div>
              )}
              {googleTestMessage && <CAlert color="success" className="mt-2 mb-0">{googleTestMessage}</CAlert>}
              {googleTestError && <CAlert color="danger" className="mt-2 mb-0">{googleTestError}</CAlert>}
            </CCol>
          )}
        </CRow>
      )
    }

    return (
      <CRow>
        <CCol md={4} className="mb-3">
          <CFormLabel>Serveur SMTP</CFormLabel>
          <CFormInput
            value={config.smtp_host || ''}
            onChange={(e) => setConfig((prev) => ({ ...prev, smtp_host: e.target.value }))}
            placeholder="smtp.gmail.com"
          />
        </CCol>
        <CCol md={4} className="mb-3">
          <CFormLabel>Utilisateur SMTP</CFormLabel>
          <CFormInput
            value={config.smtp_user || ''}
            onChange={(e) => setConfig((prev) => ({ ...prev, smtp_user: e.target.value }))}
            placeholder="user@example.com"
          />
        </CCol>
        <CCol md={4} className="mb-3">
          <CFormLabel>Adresse expediteur</CFormLabel>
          <CFormInput
            value={config.smtp_from || ''}
            onChange={(e) => setConfig((prev) => ({ ...prev, smtp_from: e.target.value }))}
            placeholder="no-reply@example.com"
          />
        </CCol>

        <CCol md={12} className="mb-0 d-flex flex-wrap gap-2">
          <CButton color="light" variant="outline" onClick={testEmailConnection} disabled={emailTestLoading || !config.smtp_host || !config.smtp_user}>
            {emailTestLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Test en cours...
              </>
            ) : (
              'Tester l\'envoi email'
            )}
          </CButton>
          <CButton color="secondary" variant="outline" onClick={() => openTab?.('smtp')}>
            Ouvrir la configuration email complete
          </CButton>
          <CButton color="secondary" variant="outline" onClick={() => openTab?.('imap')}>
            Ouvrir la configuration IMAP complete
          </CButton>
        </CCol>
        {emailTestMessage && <CCol md={12}><CAlert color="success" className="mb-0 mt-2">{emailTestMessage}</CAlert></CCol>}
        {emailTestError && <CCol md={12}><CAlert color="danger" className="mb-0 mt-2">{emailTestError}</CAlert></CCol>}
      </CRow>
    )
  }

  if (mode === 'card' && hidden) {
    return (
      <CCard className="mb-4 app-onboarding-card app-onboarding-card-min">
        <CCardBody className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <div>
            <strong>Onboarding masque</strong>
            <div className="text-medium-emphasis">Relancez le guide quand vous voulez.</div>
          </div>
          <CButton color="light" onClick={handleRestore}>Afficher le guide</CButton>
        </CCardBody>
      </CCard>
    )
  }

  if (mode === 'modal') {
    return (
      <>
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <div className="app-onboarding-kicker">NOUVEL UTILISATEUR</div>
            <h5 className="mb-1">Setup guide en 4 etapes</h5>
            <p className="text-medium-emphasis mb-0">
              Configurez les points critiques de votre compte en moins de 3 minutes.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <CBadge color="success">{completedCount}/{steps.length} completees</CBadge>
          </div>
        </div>

        <CProgress className="mb-3" height={8}>
          <CProgressBar value={progress} color="success" />
        </CProgress>

        <div className="app-onboarding-steps mb-3">
          {steps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              className={`app-onboarding-step ${index === currentStep ? 'is-active' : ''} ${step.done ? 'is-done' : ''}`}
              onClick={() => setCurrentStep(index)}
            >
              <span className="app-onboarding-step-index">{index + 1}</span>
              <span className="app-onboarding-step-content">
                <strong>{step.title}</strong>
                <small>{step.subtitle}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="app-onboarding-panel mb-3">
          {renderStep()}
        </div>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex gap-2">
            <CButton
              color="secondary"
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              Etape precedente
            </CButton>
            <CButton
              color="secondary"
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Etape suivante
            </CButton>
          </div>
          <CButton color="primary" onClick={onSave} disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer mes choix'
            )}
          </CButton>
        </div>
      </>
    )
  }

  return (
    <CCard className="mb-4 app-onboarding-card">
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <div className="app-onboarding-kicker">NOUVEL UTILISATEUR</div>
            <h5 className="mb-1">Setup guide en 4 etapes</h5>
            <p className="text-medium-emphasis mb-0">
              Configurez les points critiques de votre compte en moins de 3 minutes.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <CBadge color="success">{completedCount}/{steps.length} completees</CBadge>
            <CButton color="light" size="sm" onClick={handleHide}>Masquer</CButton>
          </div>
        </div>

        <CProgress className="mb-3" height={8}>
          <CProgressBar value={progress} color="success" />
        </CProgress>

        <div className="app-onboarding-steps mb-3">
          {steps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              className={`app-onboarding-step ${index === currentStep ? 'is-active' : ''} ${step.done ? 'is-done' : ''}`}
              onClick={() => setCurrentStep(index)}
            >
              <span className="app-onboarding-step-index">{index + 1}</span>
              <span className="app-onboarding-step-content">
                <strong>{step.title}</strong>
                <small>{step.subtitle}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="app-onboarding-panel mb-3">
          {renderStep()}
        </div>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex gap-2">
            <CButton
              color="secondary"
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              Etape precedente
            </CButton>
            <CButton
              color="secondary"
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Etape suivante
            </CButton>
          </div>
          <CButton color="primary" onClick={onSave} disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer mes choix'
            )}
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default SettingsOnboarding
