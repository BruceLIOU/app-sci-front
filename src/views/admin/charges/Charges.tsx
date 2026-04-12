import React, { useState, useEffect } from 'react'
import ChargeDataService from '../../../services/charge.service'
import PropertyDataService from '../../../services/property.service'
import ViewControlBar from '../../../components/ViewControlBar'
import ActionButtons from '../../../components/ActionButtons'
import CrudModal from '../../../components/CrudModal'
import DeleteModal from '../../../components/DeleteModal'
import EntityTableCard from '../../../components/EntityTableCard'
import StatCard from '../../../components/StatCard'
import TableEmptyRow from '../../../components/TableEmptyRow'
import useEntityCrud from '../../../hooks/useEntityCrud'
import {
  CCol, CRow, CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CFormInput, CFormSelect,
  CAlert, CButton, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSync } from '@coreui/icons'
import { DateUtils } from 'src/utils/date'

const typeLabel: Record<string, string> = { assurance: 'Assurance', taxe_fonciere: 'Taxe foncière', entretien: 'Entretien', travaux: 'Travaux', charges_copro: 'Charges copro', frais_gestion: 'Frais gestion', autre: 'Autre' }
const typeColor: Record<string, string> = { assurance: 'info', taxe_fonciere: 'warning', entretien: 'primary', travaux: 'danger', charges_copro: 'secondary', frais_gestion: 'dark', autre: 'light' }
const freqLabel: Record<string, string> = { unique: 'Unique', mensuel: 'Mensuel', trimestriel: 'Trimestriel', annuel: 'Annuel' }

const emptyForm = { property_id: '', type: 'autre', description: '', amount: '', date: '', frequency: 'unique' }

const Charges = () => {
  const [properties, setProperties] = useState<any[]>([])
  const [filterType, setFilterType] = useState('')
  const [filterFrequency, setFilterFrequency] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncAlert, setSyncAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkAlert, setBulkAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)

  const {
    items: charges,
    modalVisible, setModalVisible,
    deleteModal, setDeleteModal,
    editing, toDelete, form,
    handleChange, openCreate, openEdit, openDelete,
    handleSubmit, handleDelete, fetchAll,
  } = useEntityCrud({
    service: ChargeDataService,
    emptyForm,
    toForm: (c) => ({ property_id: c.property_id || '', type: c.type, description: c.description || '', amount: c.amount, date: c.date, frequency: c.frequency }),
  })

  useEffect(() => { PropertyDataService.getAll().then((r) => setProperties(r.data)) }, [])

  const handleSyncMatera = async () => {
    setSyncing(true)
    setSyncAlert(null)
    try {
      const res = await ChargeDataService.syncMatera()
      const { created, skipped, errors } = res.data
      if (errors.length > 0) {
        setSyncAlert({ type: 'danger', message: `Sync terminée avec erreurs — créées : ${created}, ignorées : ${skipped}. Erreur : ${errors[0]}` })
      } else if (created === 0) {
        setSyncAlert({ type: 'success', message: `Aucun nouvel email MATERA détecté (${skipped} déjà traité(s)).` })
      } else {
        setSyncAlert({ type: 'success', message: `${created} charge(s) créée(s) automatiquement depuis MATERA !` })
        // Rafraîchir la liste des charges
        window.location.reload()
      }
    } catch (e: any) {
      setSyncAlert({ type: 'danger', message: e.response?.data?.message || 'Erreur lors de la synchronisation MATERA.' })
    } finally {
      setSyncing(false)
    }
  }

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

  const isAllSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkDelete = async () => {
    setBulkLoading(true)
    try {
      await ChargeDataService.bulkDelete([...selectedIds])
      const count = selectedIds.size
      setSelectedIds(new Set())
      fetchAll()
      setBulkAlert({ type: 'success', message: `${count} charge(s) supprimée(s).` })
    } catch {
      setBulkAlert({ type: 'danger', message: 'Erreur lors de la suppression.' })
    } finally {
      setBulkLoading(false)
      setBulkDeleteModal(false)
    }
  }

  return (
    <>
      <CRow className="mb-4 text-center justify-content-center">
        {Object.entries(charges.reduce((acc: Record<string, number>, c) => { acc[c.type] = (acc[c.type] || 0) + parseFloat(c.amount || 0); return acc }, {})).slice(0, 3).map(([type, amount]) => (
          <StatCard key={type} value={`${(amount as number).toFixed(2)} €`} label={typeLabel[type]} color={typeColor[type] || 'secondary'} />
        ))}
        <StatCard value={`${totalAnnual.toFixed(2)} €`} label="Total annualisé" color="dark" />
      </CRow>

      {syncAlert && (
        <CAlert color={syncAlert.type} dismissible onClose={() => setSyncAlert(null)} className="mb-3">
          {syncAlert.message}
        </CAlert>
      )}
      {bulkAlert && (
        <CAlert color={bulkAlert.type} dismissible onClose={() => setBulkAlert(null)} className="mb-3">
          {bulkAlert.message}
        </CAlert>
      )}

      <EntityTableCard title="Charges &amp; dépenses" onAdd={openCreate}>
        <div className="d-flex justify-content-end mb-2">
          <CButton color="primary" variant="outline" size="sm" onClick={handleSyncMatera} disabled={syncing}>
            {syncing ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilSync} className="me-1" />}
            {syncing ? 'Synchronisation…' : 'Sync MATERA'}
          </CButton>
        </div>
        {selectedIds.size > 0 && (
          <div className="d-flex align-items-center gap-2 p-2 mb-2 bg-light border rounded">
            <span className="fw-semibold text-body">{selectedIds.size} sélectionné(s)</span>
            <CButton size="sm" color="danger" variant="outline" onClick={() => setBulkDeleteModal(true)} disabled={bulkLoading}>
              Supprimer la sélection
            </CButton>
            <CButton size="sm" color="secondary" variant="ghost" onClick={() => setSelectedIds(new Set())} disabled={bulkLoading}>
              Annuler
            </CButton>
          </div>
        )}
        <ViewControlBar
          filters={[
            { value: filterType, onChange: setFilterType, options: Object.entries(typeLabel).map(([v, l]) => ({ value: v, label: l })), placeholder: 'Tous les types', width: 180 },
            { value: filterFrequency, onChange: setFilterFrequency, options: Object.entries(freqLabel).map(([v, l]) => ({ value: v, label: l })), placeholder: 'Toutes les fréquences', width: 180 },
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
              <CTableHeaderCell style={{ width: '40px' }}>
                <input type="checkbox" className="form-check-input" checked={isAllSelected} onChange={toggleSelectAll} />
              </CTableHeaderCell>
              <CTableHeaderCell>Type</CTableHeaderCell><CTableHeaderCell>Description</CTableHeaderCell>
              <CTableHeaderCell>Bien</CTableHeaderCell><CTableHeaderCell>Montant</CTableHeaderCell>
              <CTableHeaderCell>Fréquence</CTableHeaderCell><CTableHeaderCell>Date</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {filtered.length === 0 ? (
              <TableEmptyRow colSpan={8} message="Aucune charge enregistrée" />
            ) : filtered.map((c) => (
              <CTableRow key={c.id}>
                <CTableDataCell>
                  <input type="checkbox" className="form-check-input" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} />
                </CTableDataCell>
                <CTableDataCell><CBadge color={typeColor[c.type] || 'secondary'}>{typeLabel[c.type] || c.type}</CBadge></CTableDataCell>
                <CTableDataCell>{c.description || '-'}</CTableDataCell>
                <CTableDataCell>{c.Property ? `${c.Property.type} - ${c.Property.city}` : 'Général'}</CTableDataCell>
                <CTableDataCell>{parseFloat(c.amount || 0).toFixed(2)} €</CTableDataCell>
                <CTableDataCell>{freqLabel[c.frequency] || c.frequency}</CTableDataCell>
                <CTableDataCell>{DateUtils.formatShort(c.date) || '-'}</CTableDataCell>
                <CTableDataCell className="text-end">
                  <ActionButtons onEdit={() => openEdit(c)} onDelete={() => openDelete(c)} />
                </CTableDataCell>
              </CTableRow>
            ))}
            {filtered.length > 0 && (
              <CTableRow className="fw-bold">
                <CTableDataCell colSpan={4} className="text-end">Total affiché :</CTableDataCell>
                <CTableDataCell>{total.toFixed(2)} €</CTableDataCell>
                <CTableDataCell colSpan={3}></CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>
      </EntityTableCard>

      <CrudModal
        visible={modalVisible}
        editing={editing}
        addTitle="Ajouter une charge"
        editTitle="Modifier la charge"
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      >
        <CCol md={6}><CFormSelect label="Type" name="type" value={form.type} onChange={handleChange}>{Object.entries(typeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</CFormSelect></CCol>
        <CCol md={6}><CFormSelect label="Bien (optionnel)" name="property_id" value={form.property_id} onChange={handleChange}><option value="">-- Général (SCI) --</option>{properties.map((p) => <option key={p.id} value={p.id}>{`${p.type} - ${p.address}, ${p.city}`}</option>)}</CFormSelect></CCol>
        <CCol md={12}><CFormInput type="text" name="description" label="Description" value={form.description} onChange={handleChange} /></CCol>
        <CCol md={4}><CFormInput type="number" name="amount" label="Montant (€)" value={form.amount} onChange={handleChange} required /></CCol>
        <CCol md={4}><CFormInput type="date" name="date" label="Date" value={form.date} onChange={handleChange} required /></CCol>
        <CCol md={4}><CFormSelect label="Fréquence" name="frequency" value={form.frequency} onChange={handleChange}><option value="unique">Unique</option><option value="mensuel">Mensuel</option><option value="trimestriel">Trimestriel</option><option value="annuel">Annuel</option></CFormSelect></CCol>
      </CrudModal>

      <DeleteModal
        visible={deleteModal}
        itemLabel={toDelete?.description || typeLabel[toDelete?.type]}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
      />
      <DeleteModal
        visible={bulkDeleteModal}
        itemLabel={`${selectedIds.size} charge(s)`}
        onClose={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />
    </>
  )
}

export default Charges
