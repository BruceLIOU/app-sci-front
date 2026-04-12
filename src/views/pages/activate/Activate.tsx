import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CCol, CContainer, CRow, CSpinner, CAlert,
} from '@coreui/react'
import UserDataService from '../../../services/user.service'
import AuthService from '../../../services/auth.service'

type Status = 'loading' | 'success' | 'error'

const Activate = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')

    if (!token) {
      setStatus('error')
      setMessage("Lien d'activation invalide. Aucun token trouvé.")
      return
    }

    UserDataService.activate(token)
      .then(({ data }) => {
        setStatus('success')
        setMessage(data.message)
        setEmail(data.email || '')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.message || "Une erreur s'est produite.")
      })
  }, [location.search])

  const handleGoogleLogin = async () => {
    setLoginLoading(true)
    try {
      const { data } = await AuthService.getGoogleUrl()
      window.location.href = data.url
    } catch {
      setLoginLoading(false)
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
                  <p className="text-medium-emphasis small">Activation de votre compte</p>
                </div>

                {status === 'loading' && (
                  <div className="py-4">
                    <CSpinner color="primary" />
                    <p className="mt-3 text-muted">Validation en cours…</p>
                  </div>
                )}

                {status === 'success' && (
                  <>
                    <CAlert color="success" className="text-start mb-4">
                      <strong>Compte activé !</strong> {message}
                      {email && <div className="mt-1 small">Email : <strong>{email}</strong></div>}
                    </CAlert>
                    <p className="text-muted small mb-4">
                      Connectez-vous maintenant avec le compte Google associé à cet email.
                    </p>
                    <CButton
                      color="light"
                      className="w-100 d-flex align-items-center justify-content-center gap-2 border py-2"
                      onClick={handleGoogleLogin}
                      disabled={loginLoading}
                    >
                      {loginLoading ? (
                        <CSpinner size="sm" />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 488 512">
                          <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                        </svg>
                      )}
                      <span>Se connecter avec Google</span>
                    </CButton>
                  </>
                )}

                {status === 'error' && (
                  <>
                    <CAlert color="danger" className="text-start mb-4">
                      {message}
                    </CAlert>
                    <CButton color="link" onClick={() => navigate('/login')}>
                      Retour à la connexion
                    </CButton>
                  </>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Activate
