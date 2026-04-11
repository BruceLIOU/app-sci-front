import React from 'react'
import { CRow, CFormLabel, CCol, CFormInput, CContainer, CButton, CBadge } from '@coreui/react'

interface ViewFormsProps {
  entities: string
  data: any[]
  setModalVisible: (v: boolean) => void
}

const ViewForms = ({ entities, data, setModalVisible }: ViewFormsProps) => {
  const isTenant = entities === 'tenants'

  return (
    <>
      {data.map((item) => (
        <CContainer key={item.id}>
          {isTenant ? (
            <>
              {item.avatar && (
                <div className="text-center mb-3">
                  <img src={item.avatar} alt="Avatar" className="rounded-circle" style={{ width: 96, height: 96, objectFit: 'cover' }} />
                </div>
              )}
              <CRow className="mb-3"><CFormLabel className="col-sm-3 col-form-label">Civilité</CFormLabel><CCol sm={9}><CFormInput type="text" defaultValue={item.civility} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-3 col-form-label">Prénom</CFormLabel><CCol sm={9}><CFormInput type="text" defaultValue={item.firstname} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-3 col-form-label">Nom</CFormLabel><CCol sm={9}><CFormInput type="text" defaultValue={item.lastname} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3">
                <CFormLabel className="col-sm-3 col-form-label">Email</CFormLabel>
                <CCol sm={9} className="d-flex align-items-center">
                  {item.email ? <a href={`mailto:${item.email}`} className="form-control-plaintext text-decoration-none">{item.email}</a> : <span className="form-control-plaintext text-muted">—</span>}
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel className="col-sm-3 col-form-label">Téléphone</CFormLabel>
                <CCol sm={9} className="d-flex align-items-center">
                  {item.mobile ? <a href={`tel:${item.mobile}`} className="form-control-plaintext text-decoration-none">{item.mobile}</a> : <span className="form-control-plaintext text-muted">—</span>}
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CFormLabel className="col-sm-3 col-form-label">Bien loué</CFormLabel>
                <CCol sm={9}>
                  <CFormInput type="text" defaultValue={item.Property ? `${item.Property.type} de ${item.Property.area} m² à ${item.Property.city}` : 'Aucun bien associé'} readOnly plainText />
                </CCol>
              </CRow>
              {(item.previous_address || item.previous_city) && (
                <CRow className="mb-3">
                  <CFormLabel className="col-sm-3 col-form-label">Anc. adresse</CFormLabel>
                  <CCol sm={9}>
                    <CFormInput type="text" defaultValue={[item.previous_address, item.previous_zipcode, item.previous_city].filter(Boolean).join(', ')} readOnly plainText />
                  </CCol>
                </CRow>
              )}
              {item.comments && (
                <CRow className="mb-3">
                  <CFormLabel className="col-sm-3 col-form-label">Commentaires</CFormLabel>
                  <CCol sm={9}><p className="form-control-plaintext" style={{ whiteSpace: 'pre-wrap' }}>{item.comments}</p></CCol>
                </CRow>
              )}
            </>
          ) : (
            <>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Adresse</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.address} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Code postal</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.zipcode} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Ville</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.city} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Type</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.type} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Pièces</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={item.pieces} readOnly plainText /></CCol></CRow>
              <CRow className="mb-3"><CFormLabel className="col-sm-2 col-form-label">Superficie</CFormLabel><CCol sm={10}><CFormInput type="text" defaultValue={`${item.area} m²`} readOnly plainText /></CCol></CRow>
              {(() => {
                const rooms: { type: string; count: number }[] = (() => { try { return JSON.parse(item.rooms || '[]') } catch { return [] } })()
                const features: string[] = (() => { try { return JSON.parse(item.features || '[]') } catch { return [] } })()
                return (
                  <>
                    {rooms.length > 0 && (
                      <CRow className="mb-3">
                        <CFormLabel className="col-sm-2 col-form-label">Détail pièces</CFormLabel>
                        <CCol sm={10} className="d-flex flex-wrap gap-2 align-self-center">
                          {rooms.map((r, i) => (
                            <CBadge key={i} color="info" className="fs-6 fw-normal">{r.count > 1 ? `${r.count}× ` : ''}{r.type}</CBadge>
                          ))}
                        </CCol>
                      </CRow>
                    )}
                    {features.length > 0 && (
                      <CRow className="mb-3">
                        <CFormLabel className="col-sm-2 col-form-label">Caractéristiques</CFormLabel>
                        <CCol sm={10} className="d-flex flex-wrap gap-2 align-self-center">
                          {features.map((f, i) => (
                            <CBadge key={i} color="success" className="fs-6 fw-normal">{f}</CBadge>
                          ))}
                        </CCol>
                      </CRow>
                    )}
                    {item.comments && (
                      <CRow className="mb-3">
                        <CFormLabel className="col-sm-2 col-form-label">Commentaires</CFormLabel>
                        <CCol sm={10}><p className="form-control-plaintext">{item.comments}</p></CCol>
                      </CRow>
                    )}
                  </>
                )
              })()}
            </>
          )}
          <hr />
          <CCol md={12} className="d-flex gap-2 justify-content-end">
            <CButton color="primary" onClick={() => setModalVisible(false)}>Quitter</CButton>
          </CCol>
        </CContainer>
      ))}
    </>
  )
}

export default ViewForms
