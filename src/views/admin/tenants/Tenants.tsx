import React, { useState, useEffect } from 'react'
import TenantDataService from '../../../services/tenant.service'
import Modal from '../modals/Modals'
import ViewControlBar from '../../../components/ViewControlBar'
import type { ViewMode } from '../../../components/ViewControlBar'
import CIcon from '@coreui/icons-react'
import { cilContact, cilPen, cilTrash, cilUser, cilUserFemale, cilPlus } from '@coreui/icons'
import {
  CRow, CCol, CCard, CCardBody, CCardTitle, CCardText, CCardFooter,
  CButton, CTooltip, CContainer,
} from '@coreui/react'
import { DateUtils } from 'src/utils/date'
import useIsAdmin from '../../../hooks/useIsAdmin'

const Tenants = () => {
  const [data, setData] = useState<any[]>([])
  const [tenantId, setTenantId] = useState<number | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('vignette')
  const [filterCivility, setFilterCivility] = useState('')
  const [filterCity, setFilterCity] = useState('')

  const civilityOptions = [...new Set(data.map((d) => d.civility).filter(Boolean))]
  const cityOptions = [...new Set(data.map((d) => d.Property?.city).filter(Boolean))]

  const hasFilter = filterCivility !== '' || filterCity !== ''

  const filteredData = data.filter((item) => {
    if (filterCivility && item.civility !== filterCivility) return false
    if (filterCity && item.Property?.city !== filterCity) return false
    return true
  })

  const resetFilters = () => { setFilterCivility(''); setFilterCity('') }
  const isAdmin = useIsAdmin()

  const handleViewTenant = (id: number) => { setTenantId(id); setModalType('view'); setModalVisible(true) }
  const handleEditTenant = (id: number) => { setTenantId(id); setModalType('edit'); setModalVisible(true) }
  const handleDeleteTenant = (id: number) => { setTenantId(id); setModalType('delete'); setModalVisible(true) }
  const handleCreateTenant = () => { setModalType('create'); setModalVisible(true) }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await TenantDataService.getAll()
        setData(response.data)
      } catch (error: any) { console.log(error.message) }
    }
    fetchData()
  }, [modalVisible])

  return (
    <>
      <CContainer>
        <div className="d-flex justify-content-md-end mb-4">
          {isAdmin && (
            <CButton color="primary" onClick={handleCreateTenant}>
              <CIcon icon={cilPlus} className="text-danger mx-2" />Ajouter un locataire
            </CButton>
          )}
        </div>

        <ViewControlBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          supportedModes={['vignette', 'list']}
          filters={[
            {
              value: filterCivility,
              onChange: setFilterCivility,
              options: civilityOptions.map((c) => ({ value: c, label: c })),
              placeholder: 'Civilité',
              width: 130,
            },
            {
              value: filterCity,
              onChange: setFilterCity,
              options: cityOptions.map((c) => ({ value: c, label: c })),
              placeholder: 'Toutes les villes',
              width: 160,
            },
          ]}
          hasActiveFilter={hasFilter}
          onResetFilters={resetFilters}
          totalCount={data.length}
          filteredCount={filteredData.length}
          itemLabel="locataire"
        />
      </CContainer>

      <CContainer fluid>
        {/* Vue vignettes */}
        {viewMode === 'vignette' && (
          <CRow xs={{ cols: 1, gutter: 4 }} md={{ cols: 3 }}>
            {filteredData.map((item) => (
              <CCol xs key={item.id}>
                <CCard>
                  <div className="d-flex justify-content-center pt-3">
                    {item.avatar ? (
                      <img src={item.avatar} alt="Avatar" className="rounded-circle" style={{ width: 72, height: 72, objectFit: 'cover' }} />
                    ) : (
                      <CIcon size={'3xl'} icon={item.civility === 'MR' ? cilUser : cilUserFemale} />
                    )}
                  </div>
                  <CCardBody>
                    <CCardTitle className="text-center">{`${item.civility || ''} ${item.firstname} ${item.lastname}`}</CCardTitle>
                    <CCardText>
                      {item.Property ? `Locataire de : ${item.Property.type} à ${item.Property.city}` : 'Aucun bien associé'}<br />
                      {item.email && <><a href={`mailto:${item.email}`} className="text-decoration-none">{item.email}</a><br /></>}
                      {item.mobile && <a href={`tel:${item.mobile}`} className="text-decoration-none">{item.mobile}</a>}
                    </CCardText>
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                      <CTooltip content="Voir"><CButton color="light" onClick={() => handleViewTenant(item.id)}><CIcon icon={cilContact} /></CButton></CTooltip>
                      {isAdmin && <CTooltip content="Modifier"><CButton color="light" onClick={() => handleEditTenant(item.id)}><CIcon icon={cilPen} /></CButton></CTooltip>}
                      {isAdmin && <CTooltip content="Supprimer"><CButton color="light" onClick={() => handleDeleteTenant(item.id)}><CIcon icon={cilTrash} /></CButton></CTooltip>}
                    </div>
                  </CCardBody>
                  <CCardFooter><small className="text-medium-emphasis">{DateUtils.formatWithTime(item.createdAt)}</small></CCardFooter>
                </CCard>
              </CCol>
            ))}
          </CRow>
        )}

        {/* Vue liste */}
        {viewMode === 'list' && (
          <div className="d-flex flex-column gap-2">
            {filteredData.map((item) => (
              <CCard key={item.id}>
                <div className="d-flex align-items-center">
                  <div className="d-flex align-items-center justify-content-center" style={{ width: 64, flexShrink: 0 }}>
                    {item.avatar ? (
                      <img src={item.avatar} alt="Avatar" className="rounded-circle" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                    ) : (
                      <CIcon size="xl" icon={item.civility === 'MR' ? cilUser : cilUserFemale} />
                    )}
                  </div>
                  <CCardBody className="d-flex align-items-center flex-grow-1 py-2 gap-4">
                    <strong style={{ minWidth: 200 }}>{`${item.civility || ''} ${item.firstname} ${item.lastname}`}</strong>
                    <span className="text-medium-emphasis">
                      {item.Property ? `${item.Property.type} à ${item.Property.city}` : 'Aucun bien'}
                    </span>
                    {item.email && (
                      <a href={`mailto:${item.email}`} className="text-muted text-decoration-none small">{item.email}</a>
                    )}
                    {item.mobile && (
                      <a href={`tel:${item.mobile}`} className="text-muted text-decoration-none small">{item.mobile}</a>
                    )}
                    <small className="text-medium-emphasis ms-auto">{DateUtils.formatWithTime(item.createdAt)}</small>
                  </CCardBody>
                  <div className="d-flex gap-1 me-3" style={{ flexShrink: 0 }}>
                    <CTooltip content="Voir"><CButton color="light" size="sm" onClick={() => handleViewTenant(item.id)}><CIcon icon={cilContact} /></CButton></CTooltip>
                    {isAdmin && <CTooltip content="Modifier"><CButton color="light" size="sm" onClick={() => handleEditTenant(item.id)}><CIcon icon={cilPen} /></CButton></CTooltip>}
                    {isAdmin && <CTooltip content="Supprimer"><CButton color="light" size="sm" onClick={() => handleDeleteTenant(item.id)}><CIcon icon={cilTrash} /></CButton></CTooltip>}
                  </div>
                </div>
              </CCard>
            ))}
          </div>
        )}
      </CContainer>

      {modalVisible && (
        <Modal
          type={modalType}
          entities="tenants"
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          data={data.filter((item) => item.id === tenantId)}
        />
      )}
    </>
  )
}

export default Tenants
