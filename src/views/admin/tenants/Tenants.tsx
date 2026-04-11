import React, { useState, useEffect } from 'react'
import TenantDataService from '../../../services/tenant.service'
import Modal from '../modals/Modals'
import CIcon from '@coreui/icons-react'
import { cilContact, cilPen, cilTrash, cilUser, cilUserFemale, cilPlus } from '@coreui/icons'
import {
  CRow, CCol, CCard, CCardBody, CCardTitle, CCardText, CCardFooter,
  CButton, CTooltip, CContainer,
} from '@coreui/react'

const Tenants = () => {
  const [data, setData] = useState<any[]>([])
  const [tenantId, setTenantId] = useState<number | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<string | null>(null)

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
          <CButton color="primary" onClick={handleCreateTenant}>
            <CIcon icon={cilPlus} className="text-danger mx-2" />Ajouter un locataire
          </CButton>
        </div>
      </CContainer>
      <CContainer fluid>
        <CRow xs={{ cols: 1, gutter: 4 }} md={{ cols: 3 }}>
          {data.map((item) => (
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
                    <CTooltip content="Modifier"><CButton color="light" onClick={() => handleEditTenant(item.id)}><CIcon icon={cilPen} /></CButton></CTooltip>
                    <CTooltip content="Supprimer"><CButton color="light" onClick={() => handleDeleteTenant(item.id)}><CIcon icon={cilTrash} /></CButton></CTooltip>
                  </div>
                </CCardBody>
                <CCardFooter><small className="text-medium-emphasis">{item.createdAt}</small></CCardFooter>
              </CCard>
            </CCol>
          ))}
        </CRow>
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
