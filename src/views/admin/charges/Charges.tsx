import React, { useState, useEffect } from 'react'
import ChargeDataService from '../../../services/charge.service'
import PropertyDataService from '../../../services/property.service'
import ViewControlBar from '../../../components/ViewControlBar'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CButton, CModal, CModalHeader,
  CModalTitle, CModalBody, CForm, CFormInput, CFormSelect, CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPen, cilTrash } from '@coreui/icons'

const typeLabel: Record<string, string> = { assurance: 'Assurance', taxe_fonciere: 'Taxe foncière', entretien: 'Entretien', travaux: 'Travaux', charges_copro: 'Charges copro', frais_gestion: 'Frais gestion', autre: 'Autre' }
const typeColor: Record<string, string> = { assurance: 'info', taxe_fonciere: 'warning', entretien: 'primary', travaux: 'danger', charges_copro: 'secondary', frais_gestion: 'dark', autre: 'light' }
const freqLabel: Record<string, string> = { unique: 'Unique', mensuel: 'Mensuel', trimestriel: 'Trimestriel', annuel: 'Annuel' }

const emptyForm = { property_id: '', type: 'autre', description: '', amount: '', date: '', frequency: 'unique' }

const Charges = () => {
  const [charges, setCharges] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [toDelete, setToDelete] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [filterType, setFilterType] = useState('')
  const [filterFrequency, setFilterFrequency] = useState('')

  const fetchAll = () => ChargeDataService.getAll().then((r) => setCharges(r.data)).catch(console.error)

  useEffect(() => { fetchAll(); PropertyDataService.getAll().then((r) => setProperties(r.data)) }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalVisible(true) }
  const openEdit = (c: any) => {
    setEditing(c)
    setForm({ property_id: c.property_id || '', type: c.type, description: c.description || '', amount: c.amount, date: c.date, frequency: c.frequency })
    setModalVisible(true)
  }

  const handleChange = (e: React.ChangeEvent<any>) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    try {
      if (editing) await ChargeDataService.update(editing.id, fd)
      else await ChargeDataService.create(fd)
      setModalVisible(false); fetchAll()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async () => { await ChargeDataService.delete(toDelete.id); setDeleteModal(false); fetchAll() }

  const hasFilter = filterType !== '' || filterFrequency !== ''
  const filtered = charges.filter((c) => {
    if (filterType && c.type !== filterType) return false
    if (filterFrequency && c.frequency !== filterFrequency) return false
    return true
  })
  const total = filtered.reduce((s, c) => s + parseFloat(c.amount || 0), 0)
  const totalAnnual = charges.reduce((s, c) => {
    const a = parseFloat(c.amount || 0)
    if (c.frequency === 'mensuel') return s + a * 12
    if (c.frequency === 'trimestriel') return s + a * 4
    return s + a
  }, 0)

  return (
    <>
      <CRow className="mb-4">
        {Object.entries(charges.reduce((acc: Record<string, number>, c) => { acc[c.type] = (acc[c.type] || 0) + parseFloat(c.amount || 0); return acc }, {})).slice(0, 3).map(([type, amount]) => (
          <CCol sm={4} key={type}>
            <CCard className={`text-white bg-${typeColor[type] || 'secondary'} mb-3`}>
              <CCardBody><div className="fs-5 fw-semibold">{(amount as number).toFixed(2)} €</div><div>{typeLabel[type]}</div></CCardBody>
            </CCard>
          </CCol>
        ))}
        <CCol sm={4}><CCard className="text-white bg-dark mb-3"><CCardBody><div className="fs-4 fw-semibold">{totalAnnual.toFixed(2)} €</div><div>Total annualisé</div></CCardBody></CCard></CCol>
      </CRow>

      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Charges &amp; dépenses</strong>
          <CButton color="primary" size="sm" onClick={openCreate}><CIcon icon={cilPlus} className="me-1" />Ajouter</CButton>
        </CCardHeader>
        <CCardBody>
          <ViewControlBar
            filters={[
              {
                value: filterType,
                onChange: setFilterType,
                options: Object.entries(typeLabel).map(([v, l]) => ({ value: v, label: l })),
                placeholder: 'Tous les types',
                width: 180,
              },
              {
                value: filterFrequency,
                onChange: setFilterFrequency,
                options: Object.entries(freqLabel).map(([v, l]) => ({ value: v, label: l })),
                placeholder: 'Toutes les fréquences',
                width: 180,
              },
            ]}
            hasActiveFilter={hasFilter}
            onResetFilters={() => { setFilterType(''); setFilterFrequency('') }}
            totalCount={charges.length}
            filteredCount={filtered.length}
            itemLabel="charge"
          />
          <CTable align="middle" hover responsive bordered>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Type</CTableHeaderCell><CTableHeaderCell>Description</CTableHeaderCell>
                <CTableHeaderCell>Bien</CTableHeaderCell><CTableHeaderCell>Montant</CTableHeaderCell>
                <CTableHeaderCell>Fréquence</CTableHeaderCell><CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filtered.length === 0 ? (
                <CTableRow><CTableDataCell colSpan={7} className="text-center text-muted">Aucune charge enregistrée</CTableDataCell></CTableRow>
              ) : filtered.map((c) => (
                <CTableRow key={c.id}>
                  <CTableDataCell><CBadge color={typeColor[c.type] || 'secondary'}>{typeLabel[c.type] || c.type}</CBadge></CTableDataCell>
                  <CTableDataCell>{c.description || '-'}</CTableDataCell>
                  <CTableDataCell>{c.Property ? `${c.Property.type} - ${c.Property.city}` : 'Général'}</CTableDataCell>
                  <CTableDataCell>{parseFloat(c.amount || 0).toFixed(2)} €</CTableDataCell>
                  <CTableDataCell>{freqLabel[c.frequency] || c.frequency}</CTableDataCell>
                  <CTableDataCell>{c.date || '-'}</CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CTooltip content="Modifier"><CButton color="light" size="sm" className="me-1" onClick={() => openEdit(c)}><CIcon icon={cilPen} /></CButton></CTooltip>
                    <CTooltip content="Supprimer"><CButton color="light" size="sm" onClick={() => { setToDelete(c); setDeleteModal(true) }}><CIcon icon={cilTrash} /></CButton></CTooltip>
                  </CTableDataCell>
                </CTableRow>
              ))}
              {filtered.length > 0 && (
                <CTableRow className="fw-bold">
                  <CTableDataCell colSpan={3} className="text-end">Total affiché :</CTableDataCell>
                  <CTableDataCell>{total.toFixed(2)} €</CTableDataCell>
                  <CTableDataCell colSpan={3}></CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CModal size="lg" alignment="center" visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader><CModalTitle>{editing ? 'Modifier la charge' : 'Ajouter une charge'}</CModalTitle></CModalHeader>
        <CModalBody>
          <CForm className="row g-3" onSubmit={handleSubmit}>
            <CCol md={6}><CFormSelect label="Type" name="type" value={form.type} onChange={handleChange}>{Object.entries(typeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</CFormSelect></CCol>
            <CCol md={6}><CFormSelect label="Bien (optionnel)" name="property_id" value={form.property_id} onChange={handleChange}><option value="">-- Général (SCI) --</option>{properties.map((p) => <option key={p.id} value={p.id}>{`${p.type} - ${p.address}, ${p.city}`}</option>)}</CFormSelect></CCol>
            <CCol md={12}><CFormInput type="text" name="description" label="Description" value={form.description} onChange={handleChange} /></CCol>
            <CCol md={4}><CFormInput type="number" name="amount" label="Montant (€)" value={form.amount} onChange={handleChange} required /></CCol>
            <CCol md={4}><CFormInput type="date" name="date" label="Date" value={form.date} onChange={handleChange} required /></CCol>
            <CCol md={4}><CFormSelect label="Fréquence" name="frequency" value={form.frequency} onChange={handleChange}><option value="unique">Unique</option><option value="mensuel">Mensuel</option><option value="trimestriel">Trimestriel</option><option value="annuel">Annuel</option></CFormSelect></CCol>
            <hr />
            <CCol md={12} className="d-flex gap-2 justify-content-end">
              <CButton color="secondary" onClick={() => setModalVisible(false)}>Annuler</CButton>
              <CButton color="primary" type="submit">{editing ? 'Modifier' : 'Ajouter'}</CButton>
            </CCol>
          </CForm>
        </CModalBody>
      </CModal>

      <CModal alignment="center" visible={deleteModal} onClose={() => setDeleteModal(false)}>
        <CModalHeader><CModalTitle>Suppression</CModalTitle></CModalHeader>
        <CModalBody>
          <p>Supprimer <strong>{toDelete?.description || typeLabel[toDelete?.type]}</strong> ?</p>
          <div className="d-flex gap-2 justify-content-end">
            <CButton color="secondary" onClick={() => setDeleteModal(false)}>Annuler</CButton>
            <CButton color="danger" onClick={handleDelete}>Supprimer</CButton>
          </div>
        </CModalBody>
      </CModal>
    </>
  )
}

export default Charges
