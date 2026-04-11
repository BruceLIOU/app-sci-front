import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { CBadge, CNavLink } from '@coreui/react'

interface NavItem {
  component: any
  name?: string
  icon?: React.ReactNode
  badge?: { color: string; text: string }
  to?: string
  items?: NavItem[]
  [key: string]: any
}

export const AppSidebarNav = ({ items }: { items: NavItem[] }) => {
  const location = useLocation()

  const navLink = (name?: string, icon?: React.ReactNode, badge?: { color: string; text: string }) => (
    <>
      {icon && icon}
      {name && name}
      {badge && (
        <CBadge color={badge.color} className="ms-auto">
          {badge.text}
        </CBadge>
      )}
    </>
  )

  const navItem = (item: NavItem, index: number) => {
    const { component, name, badge, icon, to, ...rest } = item
    const Component = component
    return (
      <Component key={index} {...rest}>
        {to ? (
          <CNavLink as={NavLink} to={to}>
            {navLink(name, icon, badge)}
          </CNavLink>
        ) : (
          navLink(name, icon, badge)
        )}
      </Component>
    )
  }

  const navGroup = (item: NavItem, index: number) => {
    const { component, name, icon, to, ...rest } = item
    const Component = component
    return (
      <Component
        idx={String(index)}
        key={index}
        toggler={navLink(name, icon)}
        visible={location.pathname.startsWith(to || '')}
        {...rest}
      >
        {item.items?.map((child, i) =>
          child.items ? navGroup(child, i) : navItem(child, i),
        )}
      </Component>
    )
  }

  return (
    <React.Fragment>
      {items && items.map((item, index) => (item.items ? navGroup(item, index) : navItem(item, index)))}
    </React.Fragment>
  )
}
