import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import routes from '../routes'
import OwnerProfileGuard from './OwnerProfileGuard'

const AppContent = () => {
  const userRole = useSelector((state: RootState) => state.auth.user?.role ?? 'viewer')

  return (
    <CContainer lg className="app-content-container">
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {routes.map((route, idx) => {
            if (!route.element) return null
            if (route.roles && !route.roles.includes(userRole as any)) {
              return (
                <Route
                  key={idx}
                  path={route.path}
                  element={<Navigate to="/dashboard" replace />}
                />
              )
            }
            return (
              <Route
                key={idx}
                path={route.path}
                element={route.sciOnly ? <OwnerProfileGuard requireSci><route.element /></OwnerProfileGuard> : <route.element />}
              />
            )
          })}
          <Route path="/" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
