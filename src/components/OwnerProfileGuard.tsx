import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import OwnerConfigDataService from '../services/owner_config.service'

type OwnerProfileGuardProps = {
  children: React.ReactNode
  requireSci?: boolean
}

const OwnerProfileGuard: React.FC<OwnerProfileGuardProps> = ({ children, requireSci = false }) => {
  const [loading, setLoading] = useState(true)
  const [isSciProfile, setIsSciProfile] = useState(false)

  useEffect(() => {
    OwnerConfigDataService.get()
      .then((response) => {
        setIsSciProfile((response.data.owner_profile_type || 'INDIVIDUAL') === 'SCI')
      })
      .catch(() => {
        setIsSciProfile(false)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 240 }}>
        <div className="sk-spinner sk-spinner-pulse" />
      </div>
    )
  }

  if (requireSci && !isSciProfile) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default OwnerProfileGuard