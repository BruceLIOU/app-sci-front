import React, { useState } from 'react'

import Modal from './../modals/Modals'

import tenants from './../../../data/data-tenants.json'

import findProperty from 'src/utils/query'

import CIcon from '@coreui/icons-react'
import { cilContact, cilPen, cilTrash, cilUser, cilUserFemale } from '@coreui/icons'

import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardTitle,
  CCardText,
  CCardFooter,
  CButton,
  CTooltip,
} from '@coreui/react'

const Tenants = () => {
  const [tenantId, setTenantId] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState(null)

  const handleViewTenant = (id) => {
    setTenantId(id)
    setModalType('view')
    setModalVisible(true)
  }

  const handleEditTenant = (id) => {
    setTenantId(id)
    setModalType('edit')
    setModalVisible(true)
  }

  const handleDeleteTenant = (id) => {
    setTenantId(id)
    setModalType('delete')
    setModalVisible(true)
  }

  return (
    <CRow xs={{ cols: 1, gutter: 4 }} md={{ cols: 3 }}>
      {tenants.map((item) => (
        <div key={item.id}>
          <CCol xs id={item.id}>
            <CCard>
              <div className="d-flex justify-content-end p-1">
                <CIcon size={'3xl'} icon={item.civility === 'MR' ? cilUser : cilUserFemale} />
              </div>

              <CCardBody>
                <CCardTitle>{`${item.civility} ${item.firstname} ${item.lastname}`}</CCardTitle>
                <CCardText>
                  Locataire de : {findProperty(item.property_id)}
                  <br />
                  Email : {item.email}
                  <br />
                  Téléphone : {item.mobile}
                </CCardText>
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <CTooltip content="Voir">
                    <CButton color="light" onClick={() => handleViewTenant(item.id)}>
                      <CIcon icon={cilContact} />
                    </CButton>
                  </CTooltip>
                  <CTooltip content="Modifier">
                    <CButton color="light" onClick={() => handleEditTenant(item.id)}>
                      <CIcon icon={cilPen} />
                    </CButton>
                  </CTooltip>
                  <CTooltip content="Supprimer">
                    <CButton color="light" onClick={() => handleDeleteTenant(item.id)}>
                      <CIcon icon={cilTrash} />
                    </CButton>
                  </CTooltip>
                </div>
              </CCardBody>
              <CCardFooter>
                <small className="text-medium-emphasis">{`Créé le ${item.created_at}`}</small>
              </CCardFooter>
            </CCard>
          </CCol>
          {modalVisible && (
            <Modal
              type={modalType}
              entities="tenants"
              modalVisible={modalVisible}
              setModalVisible={setModalVisible}
              data={tenants.filter((item) => item.id === tenantId)}
            />
          )}
        </div>
      ))}
    </CRow>
  )
}

export default Tenants
