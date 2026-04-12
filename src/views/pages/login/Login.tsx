import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  CButton, CCard, CCardBody, CCol, CContainer, CRow, CSpinner, CAlert, CFormInput, CFormLabel,
} from '@coreui/react'
import { RootState } from '../../../store'
import AuthService from '../../../services/auth.service'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector((state: RootState) => state.auth.user)

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })

    const params = new URLSearchParams(location.search)
    const errorParam = params.get('error')
    const infoParam = params.get('info')

    if (errorParam === 'invalid_token') setError('Ce lien de connexion est invalide ou déjà utilisé.')
    if (errorParam === 'expired_token') setError('Ce lien a expiré (valide 15 min). Demandez un nouveau lien.')
    if (errorParam === 'auth_failed') setError("Échec de l'authentification. Réessayez.")
    if (infoParam === 'account_activated') setInfo('Votre compte est activé ! Demandez un lien de connexion.')
    if (infoParam === 'already_active') setInfo('Votre compte est déjà actif. Demandez un lien de connexion.')
  }, [user, navigate, location.search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      await AuthService.requestLogin(email.trim())
      setSent(true)
    } catch {
      setError('Impossible de contacter le serveur. Vérifiez que le backend est démarré.')
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
                  <div className="app-kpi-inline-value">0</div>
                  <div className="app-kpi-inline-label">mot de passe a retenir avec le magic link</div>
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
                    Recevez un lien de connexion temporaire par email
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

                {sent ? (
                  <CAlert color="success" className="text-start">
                    <strong>Lien envoyé !</strong><br />
                    Vérifiez votre boîte email et cliquez sur le lien de connexion. Il est valable 15 minutes.
                  </CAlert>
                ) : (
                  <form onSubmit={handleSubmit} className="text-start">
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
                      Recevoir un lien de connexion
                    </CButton>
                  </form>
                )}

                {!sent && (
                  <p className="text-medium-emphasis mt-4 mb-0" style={{ fontSize: '0.75rem' }}>
                    Aucun mot de passe requis — connexion sécurisée par lien email
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
