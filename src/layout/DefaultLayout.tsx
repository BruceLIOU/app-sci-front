import React from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'

const DefaultLayout = () => {
  return (
    <div className="app-shell">
      <AppSidebar />
      <div className="wrapper app-main d-flex flex-column min-vh-100 bg-body">
        <AppHeader />
        <div className="body flex-grow-1 px-3 app-content-shell">
          <AppContent />
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
