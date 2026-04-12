import React, { useState, useEffect } from 'react'
import LeaseDataService from '../../../services/lease.service'
import TenantDataService from '../../../services/tenant.service'
import PropertyDataService from '../../../services/property.service'
import PdfDataService from '../../../services/pdf.service'
import DocumentsSection from '../../../components/DocumentsSection'
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
  CTableHead, CTableHeaderCell, CTableRow, CBadge, CButton, CModal, CModalHeader,
  CModalTitle, CModalBody, CFormInput, CFormSelect, CFormTextarea, CTooltip,
  CSpinner, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInfo, cilSend } from '@coreui/icons'
import { DateUtils } from 'src/utils/date'

const statusLabel: Record<string, string> = { active: 'Actif', expired: 'Expiré', terminated: 'Résilié' }
const statusColor: Record<string, string> = { active: 'success', expired: 'warning', terminated: 'danger' }
const typeLabel: Record<string, string> = { nu: 'Location nue', meublé: 'Meublé', commercial: 'Commercial' }

const emptyForm = {
  property_id: '', tenant_id: '', type: 'nu', start_date: '', end_date: '',
  rent_amount: '', charges_amount: '0', deposit_amount: '0',
  notice_period: '3', status: 'active', notes: '',
}

const Leases = () => {
  const [tenants, setTenants] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [viewModal, setViewModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLeaseType, setFilterLeaseType] = useState('')
  const [viewing, setViewing] = useState<any>(null)
  const [emailSendingId, setEmailSendingId] = useState<number | null>(null)
  const [emailResult, setEmailResult] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)

  const {
    items: leases,
    modalVisible, setModalVisible,
    deleteModal, setDeleteModal,
    editing, toDelete, form,
    handleChange, openCreate, openEdit, openDelete,
    handleSubmit, handleDelete, fetchAll,
  } = useEntityCrud({
    service: LeaseDataService,
    emptyForm,
    toForm: (l) => ({ property_id: l.property_id || '', tenant_id: l.tenant_id || '', type: l.type || 'nu', start_date: l.start_date || '', end_date: l.end_date || '', rent_amount: l.rent_amount || '', charges_amount: l.charges_amount || '0', deposit_amount: l.deposit_amount || '0', notice_period: l.notice_period || '3', status: l.status || 'active', notes: l.notes || '' }),
  })

  useEffect(() => {
    TenantDataService.getAll().then((r) => setTenants(r.data))
    PropertyDataService.getAll().then((r) => setProperties(r.data))
  }, [])

  const totalActive = leases.filter((l) => l.status === 'active').length
  const totalRent = leases.filter((l) => l.status === 'active').reduce((s, l) => s + parseFloat(l.rent_amount || 0) + parseFloat(l.charges_amount || 0), 0)

  const hasFilter = filterStatus !== '' || filterLeaseType !== ''
  const filteredLeases = leases.filter((l) => {
    if (filterStatus && l.status !== filterStatus) return false
    if (filterLeaseType && l.type !== filterLeaseType) return false
    return true
  })
  const resetFilters = () => { setFilterStatus(''); setFilterLeaseType('') }

  const handleEmailBail = async (id: number) => {
    setEmailSendingId(id)
    setEmailResult(null)
    try {
      const res = await PdfDataService.emailBail(id)
      setEmailResult({ type: 'success', message: res.data.message })
      fetchAll()
    } catch (e: any) {
      setEmailResult({ type: 'danger', message: e?.response?.data?.message || "Erreur lors de l'envoi." })
    } finally {
      setEmailSendingId(null)
    }
  }

  return (
    <>
      {emailResult && (
        <CAlert color={emailResult.type} dismissible onClose={() => setEmailResult(null)} className="mb-3">
          {emailResult.message}
        </CAlert>
      )}
      <CRow className="mb-4 text-center">
        <StatCard value={totalActive} label="Baux actifs" color="success" />
        <StatCard value={`${totalRent.toFixed(2)} €`} label="Loyers mensuels charges comprises" color="info" />
        <StatCard value={leases.length} label="Total baux" color="secondary" />
      </CRow>

      <EntityTableCard title="Baux de location" addLabel="Nouveau bail" onAdd={openCreate}>
        <ViewControlBar
          filters={[
            { value: filterStatus, onChange: setFilterStatus, options: Object.entries(statusLabel).map(([v, l]) => ({ value: v, label: l })), placeholder: 'Tous les statuts', width: 160 },
            { value: filterLeaseType, onChange: setFilterLeaseType, options: Object.entries(typeLabel).map(([v, l]) => ({ value: v, label: l })), placeholder: 'Tous les types', width: 160 },
          ]}
          hasActiveFilter={hasFilter}
          onResetFilters={resetFilters}
          totalCount={leases.length}
          filteredCount={filteredLeases.length}
          itemLabel="bail"
          itemLabelPlural="baux"
        />
        <CTable align="middle" hover responsive bordered>
          <CTableHead color="light">
            <CTableRow>
              <CTableHeaderCell>Bien</CTableHeaderCell>
              <CTableHeaderCell>Locataire</CTableHeaderCell>
              <CTableHeaderCell>Type</CTableHeaderCell>
              <CTableHeaderCell>Loyer CC</CTableHeaderCell>
              <CTableHeaderCell>Dépôt</CTableHeaderCell>
              <CTableHeaderCell>Début</CTableHeaderCell>
              <CTableHeaderCell>Fin</CTableHeaderCell>
              <CTableHeaderCell>Statut</CTableHeaderCell>
              <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {filteredLeases.length === 0 ? (
              <TableEmptyRow colSpan={9} message="Aucun bail enregistré" />
            ) : filteredLeases.map((l) => (
              <CTableRow key={l.id}>
                <CTableDataCell>{l.Property ? `${l.Property.type} - ${l.Property.city}` : '-'}</CTableDataCell>
                <CTableDataCell>{l.Tenant ? `${l.Tenant.civility || ''} ${l.Tenant.lastname}` : '-'}</CTableDataCell>
                <CTableDataCell>{typeLabel[l.type] || l.type}</CTableDataCell>
                <CTableDataCell>{(parseFloat(l.rent_amount || 0) + parseFloat(l.charges_amount || 0)).toFixed(2)} €</CTableDataCell>
                <CTableDataCell>{parseFloat(l.deposit_amount || 0).toFixed(2)} €</CTableDataCell>
                <CTableDataCell>{DateUtils.formatShort(l.start_date) || '-'}</CTableDataCell>
                <CTableDataCell>{DateUtils.formatShort(l.end_date) || 'En cours'}</CTableDataCell>
                <CTableDataCell><CBadge color={statusColor[l.status]}>{statusLabel[l.status]}</CBadge></CTableDataCell>
                <CTableDataCell className="text-end">
                  <ActionButtons onEdit={() => openEdit(l)} onDelete={() => openDelete(l)}>
                    <CTooltip content="Détails">
                      <CButton color="light" size="sm" className="me-1" onClick={() => { setViewing(l); setViewModal(true) }}>
                        <CIcon icon={cilInfo} />
                      </CButton>
                    </CTooltip>
                    <CTooltip content={l.email_sent_at ? `Envoyé le ${DateUtils.formatShort(l.email_sent_at)}` : 'Envoyer bail par email'}>
                      <CButton color={l.email_sent_at ? 'success' : 'light'} size="sm" className="me-1" disabled={emailSendingId === l.id} onClick={() => handleEmailBail(l.id)}>
                        {emailSendingId === l.id ? <CSpinner size="sm" /> : <CIcon icon={cilSend} />}
                      </CButton>
                    </CTooltip>
                  </ActionButtons>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </EntityTableCard>

      <CrudModal
        visible={modalVisible}
        editing={editing}
        addTitle="Nouveau bail"
        editTitle="Modifier le bail"
        size="xl"
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        submitLabel={editing ? 'Modifier' : 'Créer'}
      >
        <CCol md={6}><CFormSelect label="Bien" name="property_id" value={form.property_id} onChange={handleChange} required><option value="">-- Sélectionner un bien --</option>{properties.map((p) => <option key={p.id} value={p.id}>{`${p.type} - ${p.address}, ${p.city}`}</option>)}</CFormSelect></CCol>
        <CCol md={6}><CFormSelect label="Locataire" name="tenant_id" value={form.tenant_id} onChange={handleChange}><option value="">-- Sélectionner --</option>{tenants.map((t) => <option key={t.id} value={t.id}>{`${t.civility || ''} ${t.firstname} ${t.lastname}`}</option>)}</CFormSelect></CCol>
        <CCol md={4}><CFormSelect label="Type de bail" name="type" value={form.type} onChange={handleChange}><option value="nu">Location nue</option><option value="meublé">Meublé</option><option value="commercial">Commercial</option></CFormSelect></CCol>
        <CCol md={4}><CFormInput type="number" name="rent_amount" label="Loyer hors charges (€)" value={form.rent_amount} onChange={handleChange} required /></CCol>
        <CCol md={4}><CFormInput type="number" name="charges_amount" label="Charges (€)" value={form.charges_amount} onChange={handleChange} /></CCol>
        <CCol md={4}><CFormInput type="number" name="deposit_amount" label="Dépôt de garantie (€)" value={form.deposit_amount} onChange={handleChange} /></CCol>
        <CCol md={4}><CFormInput type="date" name="start_date" label="Date de début" value={DateUtils.formatShort(form.start_date)} onChange={handleChange} required /></CCol>
        <CCol md={4}><CFormInput type="date" name="end_date" label="Date de fin (optionnel)" value={DateUtils.formatShort(form.end_date)} onChange={handleChange} /></CCol>
        <CCol md={4}><CFormInput type="number" name="notice_period" label="Préavis (mois)" value={form.notice_period} onChange={handleChange} /></CCol>
        <CCol md={4}><CFormSelect label="Statut" name="status" value={form.status} onChange={handleChange}><option value="active">Actif</option><option value="expired">Expiré</option><option value="terminated">Résilié</option></CFormSelect></CCol>
        <CCol md={12}><CFormTextarea label="Notes" name="notes" rows={3} value={form.notes} onChange={handleChange} /></CCol>
      </CrudModal>

      {viewing && (
        <CModal size="lg" alignment="center" visible={viewModal} onClose={() => setViewModal(false)}>
          <CModalHeader><CModalTitle>Bail — {viewing.Property?.city}</CModalTitle></CModalHeader>
          <CModalBody>
            <CRow className="g-3">
              {([
                ['Bien', viewing.Property ? `${viewing.Property.type}, ${viewing.Property.address}, ${viewing.Property.city}` : '-'],
                ['Locataire', viewing.Tenant ? `${viewing.Tenant.civility || ''} ${viewing.Tenant.firstname} ${viewing.Tenant.lastname}` : '-'],
                ['Type', typeLabel[viewing.type] || viewing.type],
                ['Statut', statusLabel[viewing.status]],
                ['Loyer HC', `${parseFloat(viewing.rent_amount || 0).toFixed(2)} €`],
                ['Charges', `${parseFloat(viewing.charges_amount || 0).toFixed(2)} €`],
                ['Loyer CC', `${(parseFloat(viewing.rent_amount || 0) + parseFloat(viewing.charges_amount || 0)).toFixed(2)} €`],
                ['Dépôt de garantie', `${parseFloat(viewing.deposit_amount || 0).toFixed(2)} €`],
                ['Date de début', DateUtils.formatShort(viewing.start_date) || '-'],
                ['Date de fin', DateUtils.formatShort(viewing.end_date) || 'En cours'],
                ['Préavis', `${viewing.notice_period} mois`],
              ] as [string, string][]).map(([label, value]) => (
                <CCol key={label} sm={6}><div className="text-muted small">{label}</div><div className="fw-semibold">{value}</div></CCol>
              ))}
              {viewing.notes && <CCol sm={12}><div className="text-muted small">Notes</div><div>{viewing.notes}</div></CCol>}
            </CRow>
            <hr />
            <strong className="d-block mb-2">Documents</strong>
            <DocumentsSection entityType="lease" entityId={viewing.id} />
            <hr />
            <div className="d-flex justify-content-end gap-2">
              <CButton color="info" variant="outline" disabled={emailSendingId === viewing?.id} onClick={() => handleEmailBail(viewing.id)}>
                {emailSendingId === viewing?.id ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilSend} className="me-1" />}
                Envoyer bail par email
              </CButton>
              <CButton color="primary" onClick={() => setViewModal(false)}>Fermer</CButton></div>
          </CModalBody>
        </CModal>
      )}

      <DeleteModal
        visible={deleteModal}
        itemLabel={toDelete ? `le bail ${toDelete.Property?.city || ''}` : undefined}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}

export default Leases
