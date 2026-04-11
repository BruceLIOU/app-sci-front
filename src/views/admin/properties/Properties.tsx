import React, { useState, useEffect } from 'react'
import PropertyDataService from '../../../services/property.service'
import Modal from '../modals/Modals'
import PropertyMap from './PropertyMap'
import PropertyDetailModal from './PropertyDetailModal'
import {
  CRow, CCol, CCard, CCardBody, CCardTitle, CCardText, CCardFooter,
  CContainer, CButton, CTooltip, CCardImage,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPen, cilTrash } from '@coreui/icons'

const Properties = () => {
  const [data, setData] = useState<any[]>([])
  const [propertyId, setPropertyId] = useState<number | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<string | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<any>(null)

  const handleViewProperty = (id: number) => {
    setSelectedProperty(data.find((p) => p.id === id) ?? null)
    setDetailVisible(true)
  }
  const handleEditProperty = (id: number) => { setPropertyId(id); setModalType('edit'); setModalVisible(true) }
  const handleDeleteProperty = (id: number) => { setPropertyId(id); setModalType('delete'); setModalVisible(true) }
  const handleCreateProperty = () => { setModalType('create'); setModalVisible(true) }

  const handleEditFromDetail = () => {
    setDetailVisible(false)
    setPropertyId(selectedProperty?.id ?? null)
    setModalType('edit')
    setModalVisible(true)
  }
  const handleDeleteFromDetail = () => {
    setDetailVisible(false)
    setPropertyId(selectedProperty?.id ?? null)
    setModalType('delete')
    setModalVisible(true)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await PropertyDataService.getAll()
        setData(response.data)
      } catch (error: any) { console.log(error.message) }
    }
    fetchData()
  }, [modalVisible])

  return (
    <>
      <CContainer>
        <div className="d-flex justify-content-md-end mb-4">
          <CButton color="primary" onClick={handleCreateProperty}>
            <CIcon icon={cilPlus} className="text-danger mx-2" />Ajouter un bien
          </CButton>
        </div>

        {/* Carte des biens */}
        <div className="mb-4">
          <PropertyMap properties={data} onMarkerClick={handleViewProperty} />
        </div>
      </CContainer>

      <CContainer fluid>
        <CRow xs={{ cols: 1, gutter: 4 }} md={{ cols: 3 }}>
          {data.map((item) => (
            <CCol xs key={item.id}>
              <CCard
                className="h-100"
                style={{ cursor: 'pointer' }}
                onClick={() => handleViewProperty(item.id)}
              >
                {item.thumbnail ? (
                  <CCardImage
                    orientation="top"
                    src={item.thumbnail}
                    style={{ height: 180, objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center bg-light border-bottom"
                    style={{
                      height: 180,
                      borderTopLeftRadius: 'var(--cui-card-inner-border-radius)',
                      borderTopRightRadius: 'var(--cui-card-inner-border-radius)',
                    }}
                  >
                    <span className="text-medium-emphasis small">Aucune photo</span>
                  </div>
                )}
                <CCardBody>
                  <CCardTitle>{item.type + ' – ' + item.city}</CCardTitle>
                  <CCardText>
                    Nombre de pièces : {item.pieces}<br />
                    Superficie : {item.area} m²
                  </CCardText>
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <CTooltip content="Modifier">
                      <CButton
                        color="light"
                        onClick={(e) => { e.stopPropagation(); handleEditProperty(item.id) }}
                      >
                        <CIcon icon={cilPen} />
                      </CButton>
                    </CTooltip>
                    <CTooltip content="Supprimer">
                      <CButton
                        color="light"
                        onClick={(e) => { e.stopPropagation(); handleDeleteProperty(item.id) }}
                      >
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

      {/* Modale détail enrichie */}
      {detailVisible && (
        <PropertyDetailModal
          visible={detailVisible}
          property={selectedProperty}
          onClose={() => setDetailVisible(false)}
          onEdit={handleEditFromDetail}
          onDelete={handleDeleteFromDetail}
        />
      )}

      {/* Modales CRUD */}
      {modalVisible && (
        <Modal
          type={modalType}
          entities="properties"
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          data={data.filter((item) => item.id === propertyId)}
        />
      )}
    </>
  )
}

export default Properties
