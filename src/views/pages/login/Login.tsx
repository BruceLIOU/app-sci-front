import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  CButton, CCard, CCardBody, CCol, CContainer, CRow, CSpinner, CAlert,
} from '@coreui/react'
import { RootState } from '../../../store'
import AuthService from '../../../services/auth.service'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector((state: RootState) => state.auth.user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
    const params = new URLSearchParams(location.search)
    const errorParam = params.get('error')
    const infoParam = params.get('info')
    if (errorParam === 'auth_failed') setError("Échec de l'authentification Google. Réessayez.")
    if (errorParam === 'not_invited') setError("Votre compte n'est pas autorisé. Contactez un administrateur.")
    if (errorParam === 'account_not_activated') setError("Votre compte n'est pas encore activé. Vérifiez votre email d'invitation.")
    if (infoParam === 'account_activated') setInfo('Votre compte est activé ! Connectez-vous avec Google.')
    if (infoParam === 'already_active') setInfo('Votre compte est déjà actif. Connectez-vous.')
  }, [user, navigate, location.search])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await AuthService.getGoogleUrl()
      window.location.href = data.url
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez que le backend est démarré.")
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
                {/* Logo / titre */}
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

                <CButton
                  color="light"
                  className="w-100 d-flex align-items-center justify-content-center gap-2 border py-2"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <CSpinner size="sm" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 488 512">
                      <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                    </svg>
                  )}
                  <span>Se connecter avec Google</span>
                </CButton>

                <p className="text-medium-emphasis mt-4 mb-0" style={{ fontSize: '0.75rem' }}>
                  Aucun mot de passe requis — connexion sécurisée via Google OAuth 2.0
                </p>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
