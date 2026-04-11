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
  CTabs,
  CTabList,
  CTab,
  CTabContent,
  CTabPanel,
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
          <CCol md={5}>
            {images.length > 0 ? (
              <CCarousel controls indicators transition="crossfade" interval={false} className="mb-3 rounded overflow-hidden">
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

          {/* Colonne droite : onglets */}
          <CCol md={7}>
            <CTabs defaultActiveItemKey="detail">
              <CTabList variant="tabs" className="mb-3">
                <CTab itemKey="detail">Détail</CTab>
                <CTab itemKey="tenants">Locataires</CTab>
                <CTab itemKey="features">Caractéristiques</CTab>
                <CTab itemKey="comments">Commentaires</CTab>
              </CTabList>
              <CTabContent>
                {/* Onglet Détail */}
                <CTabPanel itemKey="detail">
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
                  {/* Pièces détaillées (rooms) */}
                  {property.rooms && (() => {
                    let rooms: any[] = []
                    try { rooms = JSON.parse(property.rooms) } catch { rooms = [] }
                    return rooms.length > 0 ? (
                      <div>
                        <strong className="d-block mb-2">Détail des pièces</strong>
                        <div className="d-flex flex-wrap gap-2">
                          {rooms.map((r: any, i: number) => (
                            <span key={i} className="d-inline-flex align-items-center gap-1 border rounded px-2 py-1 small">
                              <CBadge color="secondary">{r.count ?? 1}</CBadge>
                              {typeof r === 'object' ? `${r.type ?? ''}${r.area ? ` – ${r.area} m²` : ''}` : String(r)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null
                  })()}
                </CTabPanel>

                {/* Onglet Locataires */}
                <CTabPanel itemKey="tenants">
                  {(() => {
                    const tenants: any[] = Array.isArray(property.Tenants) ? property.Tenants : []
                    if (tenants.length === 0) {
                      return <p className="text-medium-emphasis fst-italic">Aucun locataire associé à ce bien.</p>
                    }
                    return (
                      <ul className="list-group list-group-flush">
                        {tenants.map((t: any) => (
                          <li key={t.id} className="list-group-item px-0">
                            <div className="fw-semibold">
                              {t.civility ? `${t.civility} ` : ''}{t.firstname} {t.lastname}
                            </div>
                            {t.email && <div className="text-medium-emphasis small">{t.email}</div>}
                            {t.mobile && <div className="text-medium-emphasis small">{t.mobile}</div>}
                          </li>
                        ))}
                      </ul>
                    )
                  })()}
                </CTabPanel>

                {/* Onglet Caractéristiques */}
                <CTabPanel itemKey="features">
                  {property.features ? (() => {
                    let features: any[] = []
                    try { features = JSON.parse(property.features) } catch { features = [property.features] }
                    return features.length > 0 ? (
                      <ul className="list-group list-group-flush">
                        {features.map((f: any, i: number) => (
                          <li key={i} className="list-group-item px-0">
                            <span className="me-2">•</span>{typeof f === 'object' ? JSON.stringify(f) : String(f)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-medium-emphasis fst-italic">Aucune caractéristique renseignée.</p>
                    )
                  })() : (
                    <p className="text-medium-emphasis fst-italic">Aucune caractéristique renseignée.</p>
                  )}
                </CTabPanel>

                {/* Onglet Commentaires */}
                <CTabPanel itemKey="comments">
                  {property.comments ? (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{property.comments}</p>
                  ) : (
                    <p className="text-medium-emphasis fst-italic">Aucun commentaire renseigné.</p>
                  )}
                </CTabPanel>
              </CTabContent>
            </CTabs>
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
