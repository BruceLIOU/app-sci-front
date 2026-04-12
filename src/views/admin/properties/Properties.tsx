import React, { useState, useEffect } from 'react'
import PropertyDataService from '../../../services/property.service'
import Modal from '../modals/Modals'
import PropertyMap from './PropertyMap'
import PropertyDetailModal from './PropertyDetailModal'
import ViewControlBar from '../../../components/ViewControlBar'
import type { ViewMode } from '../../../components/ViewControlBar'
import {
  CRow, CCol, CCard, CCardBody, CCardTitle, CCardText, CCardFooter,
  CContainer, CButton, CTooltip, CCardImage, CButtonGroup,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPen, cilTrash } from '@coreui/icons'
import { DateUtils } from 'src/utils/date'
import useIsAdmin from '../../../hooks/useIsAdmin'

// Ratio hauteur/largeur de l'image selon le nombre de colonnes de la grille
const gridImgRatio: Record<number, string> = {
  1: '21/9',
  2: '16/9',
  3: '4/3',
  4: '1/1',
}

const Properties = () => {
  const [data, setData] = useState<any[]>([])
  const [propertyId, setPropertyId] = useState<number | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<string | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<any>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('vignette')
  const [gridCols, setGridCols] = useState<number>(2)
  const [filterType, setFilterType] = useState<string>('')
  const [filterCity, setFilterCity] = useState<string>('')
  const [filterPieces, setFilterPieces] = useState<string>('')

  // Options dynamiques déduites des données
  const typeOptions = [...new Set(data.map((d) => d.type).filter(Boolean))]
  const cityOptions = [...new Set(data.map((d) => d.city).filter(Boolean))]
  const piecesOptions = [...new Set(data.map((d) => d.pieces).filter((p) => p != null))].sort((a, b) => a - b)

  const hasFilter = filterType !== '' || filterCity !== '' || filterPieces !== ''

  const filteredData = data.filter((item) => {
    if (filterType && item.type !== filterType) return false
    if (filterCity && item.city !== filterCity) return false
    if (filterPieces && String(item.pieces) !== filterPieces) return false
    return true
  })

  const resetFilters = () => { setFilterType(''); setFilterCity(''); setFilterPieces('') }
  const isAdmin = useIsAdmin()

  const handleViewProperty = async (id: number) => {
    try {
      const response = await PropertyDataService.get(id)
      setSelectedProperty(response.data)
    } catch {
      setSelectedProperty(data.find((p) => p.id === id) ?? null)
    }
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
        {/* Bouton d'ajout */}
        <div className="d-flex justify-content-end mb-4">
          {isAdmin && (
            <CButton color="primary" onClick={handleCreateProperty}>
              <CIcon icon={cilPlus} className="text-danger mx-2" />Ajouter un bien
            </CButton>
          )}
        </div>

        {/* Carte des biens */}
        <div className="mb-3">
          <PropertyMap properties={data} onMarkerClick={handleViewProperty} />
        </div>

        {/* Barre de contrôle : vue + filtres */}
        <ViewControlBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          supportedModes={['vignette', 'list', 'grid']}
          gridCols={gridCols}
          onGridColsChange={setGridCols}
          filters={[
            {
              value: filterType,
              onChange: setFilterType,
              options: typeOptions.map((t) => ({ value: t, label: t })),
              placeholder: 'Tous les types',
              width: 160,
            },
            {
              value: filterCity,
              onChange: setFilterCity,
              options: cityOptions.map((c) => ({ value: c, label: c })),
              placeholder: 'Toutes les villes',
              width: 160,
            },
            {
              value: filterPieces,
              onChange: setFilterPieces,
              options: piecesOptions.map((p) => ({ value: String(p), label: `${p} pièce${p > 1 ? 's' : ''}` })),
              placeholder: 'Nb de pièces',
              width: 140,
            },
          ]}
          hasActiveFilter={hasFilter}
          onResetFilters={resetFilters}
          totalCount={data.length}
          filteredCount={filteredData.length}
          itemLabel="bien"
        />
      </CContainer>

      <CContainer fluid>
        {/* Vue vignettes */}
        {viewMode === 'vignette' && (
          <CRow xs={{ cols: 1, gutter: 4 }} md={{ cols: 3 }}>
            {filteredData.map((item) => (
              <CCol xs key={item.id}>
                <CCard
                  className="h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleViewProperty(item.id)}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', borderTopLeftRadius: 'var(--cui-card-inner-border-radius)', borderTopRightRadius: 'var(--cui-card-inner-border-radius)' }}>
                    {item.thumbnail ? (
                      <CCardImage
                        orientation="top"
                        src={item.thumbnail}
                        style={{ aspectRatio: '16/9', objectFit: 'cover', width: '100%' }}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center bg-light border-bottom"
                        style={{
                          aspectRatio: '16/9',
                          borderTopLeftRadius: 'var(--cui-card-inner-border-radius)',
                          borderTopRightRadius: 'var(--cui-card-inner-border-radius)',
                        }}
                      >
                        <span className="text-medium-emphasis small">Aucune photo</span>
                      </div>
                    )}
                    {item.Tenants?.length > 0 && (
                      <div style={{ position: 'absolute', top: 16, left: -26, width: 100, transform: 'rotate(-45deg)', backgroundColor: '#2eb85c', color: 'white', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, padding: '4px 0', zIndex: 1 }}>Loué</div>
                    )}
                  </div>
                  <CCardBody>
                    <CCardTitle>{item.type + ' – ' + item.city}</CCardTitle>
                    <CCardText>
                      Nombre de pièces : {item.pieces}<br />
                      Superficie : {item.area} m²
                    </CCardText>
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                      {isAdmin && (
                        <CTooltip content="Modifier">
                          <CButton
                            color="light"
                            onClick={(e) => { e.stopPropagation(); handleEditProperty(item.id) }}
                          >
                            <CIcon icon={cilPen} />
                          </CButton>
                        </CTooltip>
                      )}
                      {isAdmin && (
                        <CTooltip content="Supprimer">
                          <CButton
                            color="light"
                            onClick={(e) => { e.stopPropagation(); handleDeleteProperty(item.id) }}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </CTooltip>
                      )}
                    </div>
                  </CCardBody>
                  <CCardFooter>
                    <small className="text-medium-emphasis">{DateUtils.formatWithTime(item.createdAt)}</small>
                  </CCardFooter>
                </CCard>
              </CCol>
            ))}
          </CRow>
        )}

        {/* Vue liste */}
        {viewMode === 'list' && (
          <div className="d-flex flex-column gap-2">
            {filteredData.map((item) => (
              <CCard
                key={item.id}
                style={{ cursor: 'pointer' }}
                onClick={() => handleViewProperty(item.id)}
              >
                <div className="d-flex align-items-center">
                  <div style={{ position: 'relative', flexShrink: 0, overflow: 'hidden', borderTopLeftRadius: 'var(--cui-card-inner-border-radius)', borderBottomLeftRadius: 'var(--cui-card-inner-border-radius)' }}>
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.type}
                        style={{ width: 100, height: 70, objectFit: 'cover', display: 'block', borderRadius: 'var(--cui-card-inner-border-radius) 0 0 var(--cui-card-inner-border-radius)' }}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center bg-light"
                        style={{ width: 100, height: 70, borderRadius: 'var(--cui-card-inner-border-radius) 0 0 var(--cui-card-inner-border-radius)' }}
                      >
                        <span className="text-medium-emphasis" style={{ fontSize: 10 }}>Aucune photo</span>
                      </div>
                    )}
                    {item.Tenants?.length > 0 && (
                      <div style={{ position: 'absolute', top: 12, left: -20, width: 80, transform: 'rotate(-45deg)', backgroundColor: '#2eb85c', color: 'white', textAlign: 'center', fontSize: '0.6rem', fontWeight: 600, padding: '3px 0', zIndex: 1 }}>Loué</div>
                    )}
                  </div>
                  <CCardBody className="d-flex align-items-center flex-grow-1 py-2 gap-4">
                    <strong className="me-2" style={{ minWidth: 180 }}>{item.type} – {item.city}</strong>
                    <span className="text-medium-emphasis">{item.pieces} pièce{item.pieces > 1 ? 's' : ''}</span>
                    <span className="text-medium-emphasis">{item.area} m²</span>
                    <small className="text-medium-emphasis ms-auto">{DateUtils.formatWithTime(item.createdAt)}</small>
                  </CCardBody>
                  <div className="d-flex gap-2 me-3" style={{ flexShrink: 0 }}>
                    {isAdmin && (
                      <CTooltip content="Modifier">
                        <CButton
                          color="light"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleEditProperty(item.id) }}
                        >
                          <CIcon icon={cilPen} />
                        </CButton>
                      </CTooltip>
                    )}
                    {isAdmin && (
                      <CTooltip content="Supprimer">
                        <CButton
                          color="light"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDeleteProperty(item.id) }}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTooltip>
                    )}
                  </div>
                </div>
              </CCard>
            ))}
          </div>
        )}

        {/* Vue grille personnalisée */}
        {viewMode === 'grid' && (
          <CRow xs={{ cols: 1, gutter: 4 }} style={{ '--cui-breakpoint-xs': 0 } as React.CSSProperties}>
            {filteredData.map((item) => (
              <CCol key={item.id} style={{ flex: `0 0 ${100 / gridCols}%`, maxWidth: `${100 / gridCols}%` }}>
                <CCard
                  className="h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleViewProperty(item.id)}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', borderTopLeftRadius: 'var(--cui-card-inner-border-radius)', borderTopRightRadius: 'var(--cui-card-inner-border-radius)' }}>
                    {item.thumbnail ? (
                      <CCardImage
                        orientation="top"
                        src={item.thumbnail}
                        style={{ aspectRatio: gridImgRatio[gridCols], objectFit: 'cover', width: '100%' }}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center bg-light border-bottom"
                        style={{
                          aspectRatio: gridImgRatio[gridCols],
                          borderTopLeftRadius: 'var(--cui-card-inner-border-radius)',
                          borderTopRightRadius: 'var(--cui-card-inner-border-radius)',
                        }}
                      >
                        <span className="text-medium-emphasis small">Aucune photo</span>
                      </div>
                    )}
                    {item.Tenants?.length > 0 && (
                      <div style={{ position: 'absolute', top: 16, left: -26, width: 100, transform: 'rotate(-45deg)', backgroundColor: '#2eb85c', color: 'white', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, padding: '4px 0', zIndex: 1 }}>Loué</div>
                    )}
                  </div>
                  <CCardBody>
                    <CCardTitle>{item.type + ' – ' + item.city}</CCardTitle>
                    <CCardText>
                      Nombre de pièces : {item.pieces}<br />
                      Superficie : {item.area} m²
                    </CCardText>
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                      {isAdmin && (
                        <CTooltip content="Modifier">
                          <CButton
                            color="light"
                            onClick={(e) => { e.stopPropagation(); handleEditProperty(item.id) }}
                          >
                            <CIcon icon={cilPen} />
                          </CButton>
                        </CTooltip>
                      )}
                      {isAdmin && (
                        <CTooltip content="Supprimer">
                          <CButton
                            color="light"
                            onClick={(e) => { e.stopPropagation(); handleDeleteProperty(item.id) }}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </CTooltip>
                      )}
                    </div>
                  </CCardBody>
                  <CCardFooter>
                    <small className="text-medium-emphasis">{DateUtils.formatWithTime(item.createdAt)}</small>
                  </CCardFooter>
                </CCard>
              </CCol>
            ))}
          </CRow>
        )}
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
