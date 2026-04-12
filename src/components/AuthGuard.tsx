import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, setUser, setLoading } from '../store'
import AuthService from '../services/auth.service'

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch()
  const { user, loading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (user) return
    dispatch(setLoading(true))
    AuthService.me()
      .then(({ data }) => dispatch(setUser(data)))
      .catch(() => dispatch(setUser(null)))
  }, [dispatch, user])

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="sk-spinner sk-spinner-pulse" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

export default AuthGuard
