import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CCol, CContainer, CRow, CSpinner, CAlert,
} from '@coreui/react'
import UserDataService from '../../../services/user.service'

type Status = 'loading' | 'success' | 'error'

const Activate = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

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
                      Connectez-vous en demandant un lien de connexion sur la page de login.
                    </p>
                    <CButton color="primary" className="w-100" onClick={() => navigate('/login')}>
                      Aller à la page de connexion
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
