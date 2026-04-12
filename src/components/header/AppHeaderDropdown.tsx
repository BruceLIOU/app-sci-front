import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  CAvatar, CDropdown, CDropdownDivider, CDropdownHeader,
  CDropdownItem, CDropdownMenu, CDropdownToggle, CFormSwitch,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilSettings, cilAccountLogout, cilMoon } from '@coreui/icons'
import { RootState, setUser, updatePreferences } from '../../store'
import AuthService from '../../services/auth.service'

const AppHeaderDropdown = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const handleLogout = async () => {
    try {
      await AuthService.logout()
    } finally {
      dispatch(setUser(null))
      navigate('/login', { replace: true })
    }
  }

  const handleDarkMode = async (checked: boolean) => {
    try {
      const fd = new FormData()
      fd.append('darkMode', String(checked))
      const { data } = await AuthService.updatePreferences(fd)
      dispatch(updatePreferences(data.preferences))
      document.documentElement.setAttribute('data-coreui-theme', checked ? 'dark' : 'light')
    } catch { /* ignore */ }
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle className="py-0 px-2 app-profile-trigger" caret={false}>
        {user?.avatar ? (
          <CAvatar src={user.avatar} size="md" />
        ) : (
          <CAvatar color="primary" size="md">{initials}</CAvatar>
        )}
      </CDropdownToggle>
      <CDropdownMenu className="pt-0 app-dropdown-menu" style={{ minWidth: '220px' }}>
        <CDropdownHeader className="bg-body-secondary fw-semibold py-2">
          <div className="small text-truncate">{user?.name}</div>
          <div className="text-medium-emphasis" style={{ fontSize: '0.72rem' }}>{user?.email}</div>
        </CDropdownHeader>

        <CDropdownItem onClick={() => navigate('/admin/profile')} style={{ cursor: 'pointer' }}>
          <CIcon icon={cilUser} className="me-2" />
          Mon profil
        </CDropdownItem>

        <CDropdownItem onClick={() => navigate('/admin/settings')} style={{ cursor: 'pointer' }}>
          <CIcon icon={cilSettings} className="me-2" />
          Paramètres
        </CDropdownItem>

        <CDropdownDivider />

        {/* Toggle darkMode inline */}
        <div className="px-3 py-2 d-flex align-items-center justify-content-between">
          <span className="small">
            <CIcon icon={cilMoon} className="me-2" />
            Mode sombre
          </span>
          <CFormSwitch
            id="darkModeToggle"
            checked={user?.preferences?.darkMode || false}
            onChange={(e) => handleDarkMode(e.target.checked)}
          />
        </div>

        <CDropdownDivider />

        <CDropdownItem onClick={handleLogout} style={{ cursor: 'pointer' }} className="text-danger">
          <CIcon icon={cilAccountLogout} className="me-2" />
          Se déconnecter
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
