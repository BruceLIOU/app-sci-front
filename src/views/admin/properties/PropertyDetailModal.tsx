import React from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CRow,
  CCol,
  CBadge,
  CCarousel,
  CCarouselItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPen, cilTrash } from '@coreui/icons'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface PropertyDetailModalProps {
  visible: boolean
  property: any
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  visible,
  property,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!property) return null

  const images: string[] = (() => {
    const list: string[] = []
    if (property.thumbnail) list.push(property.thumbnail)
    try {
      const parsed = JSON.parse(property.images || '[]')
      if (Array.isArray(parsed)) list.push(...parsed)
    } catch {}
    return [...new Set(list)]
  })()

  const hasCoords =
    property.latitude != null &&
    property.longitude != null &&
    !isNaN(Number(property.latitude)) &&
    !isNaN(Number(property.longitude))

  return (
    <CModal size="xl" alignment="center" visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>
          {property.type} – {property.city}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CRow>
          {/* Colonne gauche : galerie + mini-carte */}
          <CCol md={7}>
            {images.length > 0 ? (
              <CCarousel controls indicators transition="crossfade" className="mb-3 rounded overflow-hidden">
                {images.map((src, i) => (
                  <CCarouselItem key={i}>
                    <img
                      src={src}
                      alt={`Photo ${i + 1}`}
                      style={{ width: '100%', height: 280, objectFit: 'cover' }}
                    />
                  </CCarouselItem>
                ))}
              </CCarousel>
            ) : (
              <div
                className="d-flex align-items-center justify-content-center bg-light rounded border mb-3"
                style={{ height: 280 }}
              >
                <span className="text-medium-emphasis">Aucune photo disponible</span>
              </div>
            )}

            {hasCoords && (
              <MapContainer
                center={[Number(property.latitude), Number(property.longitude)]}
                zoom={14}
                style={{ height: 200, width: '100%', borderRadius: 8 }}
                scrollWheelZoom={false}
                dragging={false}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[Number(property.latitude), Number(property.longitude)]} />
              </MapContainer>
            )}
          </CCol>

          {/* Colonne droite : informations */}
          <CCol md={5}>
            <h5 className="mb-3">Informations</h5>
            <table className="table table-sm table-bordered">
              <tbody>
                <tr>
                  <th className="text-nowrap">Adresse</th>
                  <td>{property.address}</td>
                </tr>
                <tr>
                  <th>Code postal</th>
                  <td>{property.zipcode}</td>
                </tr>
                <tr>
                  <th>Ville</th>
                  <td>{property.city}</td>
                </tr>
                <tr>
                  <th>Type</th>
                  <td>
                    <CBadge color="info">{property.type}</CBadge>
                  </td>
                </tr>
                <tr>
                  <th>Pièces</th>
                  <td>{property.pieces}</td>
                </tr>
                <tr>
                  <th>Superficie</th>
                  <td>{property.area} m²</td>
                </tr>
                {hasCoords && (
                  <tr>
                    <th>Coordonnées</th>
                    <td>
                      <small className="text-medium-emphasis">
                        {Number(property.latitude).toFixed(5)}, {Number(property.longitude).toFixed(5)}
                      </small>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Fermer
        </CButton>
        <CButton color="warning" onClick={onEdit}>
          <CIcon icon={cilPen} className="me-1" />
          Modifier
        </CButton>
        <CButton color="danger" onClick={onDelete}>
          <CIcon icon={cilTrash} className="me-1" />
          Supprimer
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default PropertyDetailModal
