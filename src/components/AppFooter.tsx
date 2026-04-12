import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="app-footer px-4">
      <div className="app-footer-copy">
        <a href="https://coreui.io" target="_blank" rel="noopener noreferrer">
          Bruce LIOU
        </a>
        <span className="ms-1">&copy; 2024-{new Date().getFullYear()}.</span>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
