import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  CButton, CCard, CCardBody, CCol, CContainer, CRow, CSpinner, CAlert, CFormInput, CFormLabel,
} from '@coreui/react'
import { RootState } from '../../../store'
import AuthService from '../../../services/auth.service'

const normalizeCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)

const Login = () => {
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      await AuthService.requestLogin(email.trim())
      setStep('verify')
      setInfo('Si votre email est connu, un code de connexion à 6 caractères vient d’être envoyé.')
    } catch {
      setError('Impossible de contacter le serveur. Vérifiez que le backend est démarré.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || code.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      await AuthService.verifyLogin(email.trim(), code)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Code invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      await AuthService.requestLogin(email.trim())
      setCode('')
      setInfo('Un nouveau code a été envoyé si votre email est connu.')
    } catch {
      setError('Impossible de renvoyer le code pour le moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-login-shell d-flex flex-row align-items-center">
      <CContainer className="app-login-content py-4 py-lg-5">
        <CRow className="justify-content-center align-items-center g-4">
          <CCol lg={6}>
            <div className="app-login-showcase p-4 p-lg-5">
              <div className="app-page-kicker mb-3">Gestion locative nouvelle generation</div>
              <h1 className="app-login-showcase-title mb-3">Un espace de pilotage plus clair pour vos biens, vos flux et vos equipes.</h1>
              <p className="app-login-note mb-4">
                Centralisez les biens, locataires, baux, paiements et documents dans une interface plus
                contemporaine, plus lisible et orientee action.
              </p>

              <div className="app-kpi-inline">
                <div className="app-kpi-inline-item">
                  <div className="app-kpi-inline-value">1</div>
                  <div className="app-kpi-inline-label">entree unique pour toute l'activite</div>
                </div>
                <div className="app-kpi-inline-item">
                  <div className="app-kpi-inline-value">24/7</div>
                  <div className="app-kpi-inline-label">acces a vos donnees et alertes</div>
                </div>
                <div className="app-kpi-inline-item">
                  <div className="app-kpi-inline-value">6</div>
                  <div className="app-kpi-inline-label">caracteres a saisir pour se connecter</div>
                </div>
              </div>
            </div>
          </CCol>

          <CCol md={8} lg={5} xl={4}>
            <CCard className="app-login-panel p-4 p-lg-4 border-0">
              <CCardBody className="text-center">
                <div className="mb-4">
                  <h2 className="fw-bold mb-1">Connexion securisee</h2>
                  <p className="text-medium-emphasis small mb-0">
                    Recevez un code de connexion temporaire par email
                  </p>
                </div>

                {error && (
                  <CAlert color="danger" dismissible onClose={() => setError(null)} className="text-start mb-3">
                    {error}
                  </CAlert>
                )}

                {info && (
                  <CAlert color="success" dismissible onClose={() => setInfo(null)} className="text-start mb-3">
                    {info}
                  </CAlert>
                )}

                {step === 'verify' ? (
                  <form onSubmit={handleVerifyCode} className="text-start">
                    <div className="mb-3">
                      <CFormLabel htmlFor="email-readonly" className="fw-semibold">Adresse email</CFormLabel>
                      <CFormInput
                        id="email-readonly"
                        className="app-login-input"
                        value={email}
                        readOnly
                      />
                    </div>
                    <div className="mb-3">
                      <CFormLabel htmlFor="code" className="fw-semibold">Code de connexion</CFormLabel>
                      <CFormInput
                        className="app-login-input text-center"
                        id="code"
                        type="text"
                        inputMode="text"
                        autoComplete="one-time-code"
                        value={code}
                        onChange={(e) => setCode(normalizeCode(e.target.value))}
                        placeholder="ABC123"
                        maxLength={6}
                        required
                        autoFocus
                        style={{ letterSpacing: '0.35em', fontWeight: 700 }}
                      />
                    </div>
                    <CButton type="submit" color="primary" className="w-100 py-2 app-login-button mb-3" disabled={loading || code.length !== 6}>
                      {loading ? <CSpinner size="sm" className="me-2" /> : null}
                      Se connecter avec le code
                    </CButton>
                    <div className="d-flex justify-content-between align-items-center gap-3">
                      <CButton color="link" className="p-0 text-decoration-none" onClick={() => { setStep('request'); setCode(''); setInfo(null); setError(null) }}>
                        Changer d’email
                      </CButton>
                      <CButton color="link" className="p-0 text-decoration-none" onClick={handleResend} disabled={loading}>
                        Renvoyer un code
                      </CButton>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRequestCode} className="text-start">
                    <div className="mb-3">
                      <CFormLabel htmlFor="email" className="fw-semibold">Adresse email</CFormLabel>
                      <CFormInput
                        className="app-login-input"
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                        autoFocus
                      />
                    </div>
                    <CButton type="submit" color="primary" className="w-100 py-2 app-login-button" disabled={loading}>
                      {loading ? <CSpinner size="sm" className="me-2" /> : null}
                      Recevoir un code de connexion
                    </CButton>
                  </form>
                )}

                {step === 'request' && (
                  <p className="text-medium-emphasis mt-4 mb-0" style={{ fontSize: '0.75rem' }}>
                    Aucun mot de passe requis — connexion sécurisée par code email à usage unique
                  </p>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
