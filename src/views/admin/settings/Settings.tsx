import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CAlert,
  CSpinner,
} from '@coreui/react'
import SciConfigDataService, { SciConfigData } from '../../../services/sci_config.service'

const Settings: React.FC = () => {
  const [config, setConfig] = useState<SciConfigData>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    SciConfigDataService.get()
      .then((r) => setConfig(r.data))
      .catch(() => {})
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSaved(false)
    setConfig((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const fd = new FormData()
      Object.entries(config).forEach(([k, v]) => {
        if (v != null && k !== 'id') fd.append(k, String(v))
      })
      const r = await SciConfigDataService.update(fd)
      setConfig(r.data)
      setSaved(true)
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12} lg={10} xl={8}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Paramètres de la SCI</strong>
            <small className="ms-2 text-muted">
              Ces informations apparaissent sur les documents générés (bail, quittances, attestations…)
            </small>
          </CCardHeader>
          <CCardBody>
            {saved && (
              <CAlert color="success" dismissible onClose={() => setSaved(false)}>
                Paramètres enregistrés avec succès.
              </CAlert>
            )}
            {error && <CAlert color="danger">{error}</CAlert>}

            <h6 className="fw-semibold text-uppercase text-muted mb-3 mt-2">Informations de la SCI</h6>

            <CRow className="mb-3">
              <CCol md={3}>
                <CFormLabel>Forme juridique</CFormLabel>
                <CFormInput
                  name="legal_form"
                  value={config.legal_form || ''}
                  onChange={handleChange}
                  placeholder="SCI"
                />
              </CCol>
              <CCol md={9}>
                <CFormLabel>
                  Raison sociale <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  name="name"
                  value={config.name || ''}
                  onChange={handleChange}
                  placeholder="Nom de la SCI (sans la forme juridique)"
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>SIRET</CFormLabel>
                <CFormInput
                  name="siret"
                  value={config.siret || ''}
                  onChange={handleChange}
                  placeholder="123 456 789 00010"
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>RCS</CFormLabel>
                <CFormInput
                  name="rcs"
                  value={config.rcs || ''}
                  onChange={handleChange}
                  placeholder="RCS Paris 123 456 789"
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel>Adresse du siège social</CFormLabel>
                <CFormInput
                  name="address"
                  value={config.address || ''}
                  onChange={handleChange}
                  placeholder="Numéro et nom de la rue"
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={4}>
                <CFormLabel>Code postal</CFormLabel>
                <CFormInput
                  name="zipcode"
                  value={config.zipcode || ''}
                  onChange={handleChange}
                  placeholder="75001"
                />
              </CCol>
              <CCol md={8}>
                <CFormLabel>Ville</CFormLabel>
                <CFormInput
                  name="city"
                  value={config.city || ''}
                  onChange={handleChange}
                  placeholder="Paris"
                />
              </CCol>
            </CRow>

            <CRow className="mb-4">
              <CCol md={12}>
                <CFormLabel>IBAN (compte bancaire)</CFormLabel>
                <CFormInput
                  name="iban"
                  value={config.iban || ''}
                  onChange={handleChange}
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                />
              </CCol>
            </CRow>

            <h6 className="fw-semibold text-uppercase text-muted mb-3">Gérant</h6>

            <CRow className="mb-3">
              <CCol md={2}>
                <CFormLabel>Civilité</CFormLabel>
                <CFormSelect
                  name="manager_civility"
                  value={config.manager_civility || ''}
                  onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                >
                  <option value="">—</option>
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                </CFormSelect>
              </CCol>
              <CCol md={5}>
                <CFormLabel>Prénom</CFormLabel>
                <CFormInput
                  name="manager_firstname"
                  value={config.manager_firstname || ''}
                  onChange={handleChange}
                />
              </CCol>
              <CCol md={5}>
                <CFormLabel>Nom</CFormLabel>
                <CFormInput
                  name="manager_lastname"
                  value={config.manager_lastname || ''}
                  onChange={handleChange}
                />
              </CCol>
            </CRow>

            <CRow className="mb-4">
              <CCol md={6}>
                <CFormLabel>Email</CFormLabel>
                <CFormInput
                  type="email"
                  name="manager_email"
                  value={config.manager_email || ''}
                  onChange={handleChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Téléphone</CFormLabel>
                <CFormInput
                  name="manager_phone"
                  value={config.manager_phone || ''}
                  onChange={handleChange}
                  placeholder="06 00 00 00 00"
                />
              </CCol>
            </CRow>

            <div className="d-flex justify-content-end">
              <CButton color="primary" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Enregistrement…
                  </>
                ) : (
                  'Enregistrer'
                )}
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Settings
