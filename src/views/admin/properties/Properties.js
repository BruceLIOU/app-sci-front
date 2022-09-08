import React, { useState, useEffect } from 'react'

import PropertyDataService from './../../../services/property.service'

import Modal from '../modals/Modals'

import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardTitle,
  CCardText,
  CCardFooter,
  CContainer,
  CButton,
  CTooltip,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'
import { cilPlus, cilContact, cilPen, cilTrash } from '@coreui/icons'

const Properties = () => {
  const [data, setData] = useState([])
  const [propertyId, setPropertyId] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState(null)

  const handleViewProperty = (id) => {
    setPropertyId(id)
    setModalType('view')
    setModalVisible(true)
  }

  const handleEditProperty = (id) => {
    setPropertyId(id)
    setModalType('edit')
    setModalVisible(true)
  }

  const handleCreateProperty = () => {
    setModalType('create')
    setModalVisible(true)
  }

  const handleDeleteProperty = (id) => {
    setPropertyId(id)
    setModalType('delete')
    setModalVisible(true)
  }
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await PropertyDataService.getAll()
        setData(response.data)
      } catch (error) {
        console.log(error.message)
      }
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalVisible])

  return (
    <>
      <CContainer>
        <div className="d-flex justify-content-md-end mb-4">
          <CButton color="primary" onClick={handleCreateProperty}>
            <CIcon icon={cilPlus} className="text-danger mx-2" />
            Ajouter un bien
          </CButton>
        </div>
      </CContainer>
      <CContainer fluid>
        <CRow xs={{ cols: 1, gutter: 4 }} md={{ cols: 3 }}>
          {data.map((item) => (
            <CCol xs key={item.id}>
              <CCard>
                <CCardBody>
                  <CCardTitle>{item.type + ' ' + item.city}</CCardTitle>
                  <CCardText>
                    Nombre de pièces : {item.pieces}
                    <br />
                    Superficie : {item.area} m²
                  </CCardText>
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <CTooltip content="Voir">
                      <CButton color="light" onClick={() => handleViewProperty(item.id)}>
                        <CIcon icon={cilContact} />
                      </CButton>
                    </CTooltip>
                    <CTooltip content="Modifier">
                      <CButton color="light" onClick={() => handleEditProperty(item.id)}>
                        <CIcon icon={cilPen} />
                      </CButton>
                    </CTooltip>
                    <CTooltip content="Supprimer">
                      <CButton color="light" onClick={() => handleDeleteProperty(item.id)}>
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTooltip>
                  </div>
                </CCardBody>
                <CCardFooter>
                  <small className="text-medium-emphasis">{item.createdAt}</small>
                </CCardFooter>
              </CCard>
            </CCol>
          ))}
        </CRow>
      </CContainer>
      {modalVisible && (
        <Modal
          type={modalType}
          entities={'properties'}
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          data={data.filter((item) => item.id === propertyId)}
        />
      )}
    </>
  )
}

export default Properties
