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
    <div className="bg-light min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={5} lg={4}>
            <CCard className="p-4 shadow-sm">
              <CCardBody className="text-center">
                <div className="mb-4">
                  <h2 className="fw-bold mb-1">SCI Gestion</h2>
                  <p className="text-medium-emphasis small">
                    Accédez à votre espace de gestion immobilière
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
                      <CFormLabel htmlFor="email">Adresse email</CFormLabel>
                      <CFormInput
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                        autoFocus
                      />
                    </div>
                    <CButton type="submit" color="primary" className="w-100 py-2" disabled={loading}>
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
